const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
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
    tags: Array.isArray(lead.tags)
      ? lead.tags
      : [],
  };
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "");
}

function addNormalizedIdentity(payload) {
  return {
    ...payload,
    email: String(payload.email || "").trim(),
    phone: String(payload.phone || "").trim(),
    normalizedEmail: normalizeEmail(payload.email),
    normalizedPhone: normalizePhone(payload.phone),
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
    doctor: String(
      input.doctor ||
      input.preferredDoctor ||
      ""
    ).trim(),
    owner: String(input.owner || "").trim(),
    gender: String(input.gender || "").trim(),
    age: String(input.age || "").trim(),
    tags: Array.isArray(input.tags)
      ? input.tags
          .map(String)
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };
}

/*
|--------------------------------------------------------------------------
| Junk Lead Helpers
|--------------------------------------------------------------------------
*/

function normalizeStage(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isJunkLead(lead) {
  const stage = normalizeStage(
    lead?.stage ||
    lead?.leadStage ||
    lead?.status ||
    ""
  );

  return (
    stage === "junk" ||
    stage === "junk lead"
  );
}

/*
|--------------------------------------------------------------------------
| Count only NON-JUNK leads
|--------------------------------------------------------------------------
*/

async function getNonJunkLeadCount(
  userId,
  session = null
) {
  let query = Lead.find({
    userId,
  }).select(
    "stage leadStage status"
  );

  if (session) {
    query = query.session(session);
  }

  const leads = await query.lean();

  return leads.filter(
    (lead) => !isJunkLead(lead)
  ).length;
}

/*
|--------------------------------------------------------------------------
| Contact Usage
|--------------------------------------------------------------------------
*/

async function getContactUsage(
  userId,
  plan = null
) {
  const activePlan =
    plan || await getActivePlan(userId);

  const junkContacts =
    await Lead.find({
      userId,
    }).select("_id stage leadStage status").lean();

  const junkLeadIds =
    junkContacts
      .filter(isJunkLead)
      .map((lead) => lead._id);

  const contactCount =
    await Contact.countDocuments({
      userId,
      deletedAt: null,
      leadId: {
        $nin: junkLeadIds,
      },
    });

  const used = contactCount;

  const available =
    activePlan.limit === null
      ? null
      : Math.max(
          activePlan.limit - used,
          0
        );

  return {
    plan:
      activePlan.planName,
    planId:
      activePlan.planId,
    limit:
      activePlan.limit,
    used,
    available,
    isLimitReached:
      activePlan.limit !== null &&
      used >= activePlan.limit,
  };
}

async function getAuthoritativeContactCount(userId) {
  const junkLeads = await Lead.find({
    userId,
  }).select("_id stage leadStage status").lean();

  const junkLeadIds = junkLeads
    .filter(isJunkLead)
    .map((lead) => lead._id);

  return Contact.countDocuments({
    userId,
    deletedAt: null,
    leadId: {
      $nin: junkLeadIds,
    },
  });
}

/*
|--------------------------------------------------------------------------
| Create Contact With Quota
|--------------------------------------------------------------------------
*/

async function createContactWithQuota(
  payload,
  userId
) {
  payload = addNormalizedIdentity(payload);
  const session =
    await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(
      async () => {
        await User.updateOne(
          {
            _id: userId,
          },
          {
            $inc: {
              contactQuotaVersion: 1,
            },
          },
          {
            session,
          }
        );

        const existing =
          payload.leadId
            ? await Contact.findOne({
                userId,
                leadId:
                  payload.leadId,
              }).session(session)
            : null;

        let matchingContact = existing;

        if (!matchingContact && payload.normalizedPhone) {
          const phoneMatches =
            await Contact.find({
              userId,
            }).select("_id leadId phone email normalizedPhone normalizedEmail leadCreatedAt").session(session);

          matchingContact = phoneMatches.find((contact) =>
            normalizePhone(contact.normalizedPhone || contact.phone) === payload.normalizedPhone
          ) || null;
        }

        if (!matchingContact && payload.normalizedEmail) {
          const emailMatches =
            await Contact.find({
              userId,
            }).select("_id leadId phone email normalizedPhone normalizedEmail leadCreatedAt").session(session);

          matchingContact = emailMatches.find((contact) =>
            normalizeEmail(contact.normalizedEmail || contact.email) === payload.normalizedEmail
          ) || null;
        }

        if (matchingContact) {
          matchingContact.deletedAt = null;
          matchingContact.normalizedEmail =
            payload.normalizedEmail;
          matchingContact.normalizedPhone =
            payload.normalizedPhone;

          if (
            payload.leadId &&
            !matchingContact.leadId
          ) {
            matchingContact.leadId =
              payload.leadId;
          }

          if (
            !matchingContact.leadCreatedAt &&
            payload.leadCreatedAt
          ) {
            matchingContact.leadCreatedAt =
              payload.leadCreatedAt;
          }

          await matchingContact.save({
            session,
          });

          result = {
            created: false,
            duplicate: true,
            contact: matchingContact,
          };

          return;
        }

        const plan =
          await getActivePlan(userId);

        const junkLeads =
          await Lead.find({
            userId,
          }).select("_id stage leadStage status").lean();

        const junkLeadIds =
          junkLeads
            .filter(isJunkLead)
            .map((lead) => lead._id);

        const contactCount =
        await Contact.countDocuments({
          userId,
          deletedAt: null,
          leadId: {
            $nin: junkLeadIds,
          },
        }).session(session);

      const used = contactCount;

        const available =
          plan.limit === null
            ? null
            : Math.max(
                plan.limit - used,
                0
              );

        const usage = {
          plan:
            plan.planName,
          planId:
            plan.planId,
          limit:
            plan.limit,
          used,
          available,
          isLimitReached:
            plan.limit !== null &&
            used >= plan.limit,
        };

        if (
          plan.limit !== null &&
          used >= plan.limit
        ) {
          result = {
            created: false,
            skipped: true,
            reason: "limit",
            usage,
          };

          return;
        }

        const [contact] =
          await Contact.create(
            [payload],
            {
              session,
            }
          );

        result = {
          created: true,
          contact,
        };
      }
    );

    if (result?.created) {
      result.usage =
        await getContactUsage(
          userId
        );
    }

    return result;
  } catch (error) {
    if (
      error?.code === 11000 ||
      error?.code === 11001
    ) {
      const duplicate = payload.leadId
        ? await Contact.findOne({
            userId,
            leadId: payload.leadId,
            deletedAt: null,
          })
        : payload.normalizedPhone
          ? await Contact.findOne({
              userId,
              deletedAt: null,
              normalizedPhone: payload.normalizedPhone,
            })
          : payload.normalizedEmail
            ? await Contact.findOne({
                userId,
                deletedAt: null,
                normalizedEmail: payload.normalizedEmail,
              })
            : null;

      if (duplicate) {
        return {
          created: false,
          duplicate: true,
          contact: duplicate,
          usage: await getContactUsage(userId),
        };
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

/*
|--------------------------------------------------------------------------
| Create Contact From Lead
|--------------------------------------------------------------------------
*/

async function createContactFromLead(
  lead
) {
  try {
    if (isJunkLead(lead)) {
      return {
        created: false,
        skipped: true,
        reason: "junk",
      };
    }

    const result =
      await createContactWithQuota(
        contactPayloadFromLead(
          lead
        ),
        lead.userId
      );

    if (
      result?.reason === "limit"
    ) {
      console.log(
        "CONTACT QUOTA FULL; LEAD KEPT:",
        lead._id
      );
    }

    return result;
  } catch (error) {
    console.error(
      "CREATE CONTACT FROM LEAD ERROR:",
      error.message
    );

    return {
      created: false,
      skipped: true,
      reason: "error",
      error,
    };
  }
}

module.exports = {
  createContactFromLead,
  createContactWithQuota,
  getContactUsage,
  getAuthoritativeContactCount,
  contactPayloadFromInput,
  addNormalizedIdentity,
};