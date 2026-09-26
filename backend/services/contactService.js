const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const User = require("../models/User");
const { getActivePlan } = require("../utils/contactLimits");

function contactPayloadFromLead(lead) {
  return {
    userId: lead.userId,
    leadId: lead._id,
    leadCreatedAt: lead.createdAt || null,
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "Manual",
    service: lead.service || "",
    doctor: lead.preferredDoctor || "",
    owner: lead.owner || "",
    gender: lead.gender || "",
    age: lead.age || "",
    tags: Array.isArray(lead.tags) ? lead.tags : [],
  };
}

function contactPayloadFromInput(input, userId) {
  return {
    userId,
    leadId: input.leadId || null,
    leadCreatedAt: input.leadCreatedAt || null,
    name: String(input.name || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    source: String(input.source || "Manual").trim(),
    service: String(input.service || "").trim(),
    doctor: String(input.doctor || input.preferredDoctor || "").trim(),
    owner: String(input.owner || "").trim(),
    gender: String(input.gender || "").trim(),
    age: String(input.age || "").trim(),
    tags: Array.isArray(input.tags)
      ? input.tags.map(String).map((tag) => tag.trim()).filter(Boolean)
      : [],
  };
}

async function getContactUsage(userId, plan = null) {
  const activePlan = plan || await getActivePlan(userId);
  const used = await Contact.countDocuments({ userId, deletedAt: null });
  const available = activePlan.limit === null
    ? null
    : Math.max(activePlan.limit - used, 0);

  return {
    plan: activePlan.planName,
    planId: activePlan.planId,
    limit: activePlan.limit,
    used,
    available,
    isLimitReached: activePlan.limit !== null && used >= activePlan.limit,
  };
}

async function createContactWithQuota(payload, userId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      // This write serializes concurrent quota checks for the same account.
      await User.updateOne(
        { _id: userId },
        { $inc: { contactQuotaVersion: 1 } },
        { session }
      );

      const existing = payload.leadId
        ? await Contact.findOne({ userId, leadId: payload.leadId }).session(session)
        : null;

      if (existing) {
        if (!existing.leadCreatedAt && payload.leadCreatedAt) {
          existing.leadCreatedAt = payload.leadCreatedAt;
          await existing.save({ session });
        }
        result = { created: false, duplicate: true, contact: existing };
        return;
      }

      const plan = await getActivePlan(userId);
      const used = await Contact.countDocuments({ userId, deletedAt: null }).session(session);
      const usage = { ...plan, used };

      if (plan.limit !== null && used >= plan.limit) {
        result = { created: false, skipped: true, reason: "limit", usage };
        return;
      }

      const [contact] = await Contact.create([payload], { session });
      result = {
        created: true,
        contact,
      };
    });
    if (result?.created) {
      result.usage = await getContactUsage(userId);
    }
    return result;
  } finally {
    await session.endSession();
  }
}

async function createContactFromLead(lead) {
  try {
    const result = await createContactWithQuota(
      contactPayloadFromLead(lead),
      lead.userId
    );

    if (result?.reason === "limit") {
      console.log("CONTACT QUOTA FULL; LEAD KEPT:", lead._id);
    }
    return result;
  } catch (error) {
    console.error("CREATE CONTACT FROM LEAD ERROR:", error.message);
    return { created: false, skipped: true, reason: "error", error };
  }
}

module.exports = {
  createContactFromLead,
  createContactWithQuota,
  getContactUsage,
  contactPayloadFromInput,
};
