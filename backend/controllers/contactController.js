const jwt = require("jsonwebtoken");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
const {
  createContactWithQuota,
  getContactUsage,
  contactPayloadFromInput,
} = require("../services/contactService");

function getUserId(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    return decoded.id || decoded._id || decoded.userId || null;
  } catch (error) {
    return null;
  }
}

function requireUser(req, res) {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required" });
  }
  return userId;
}

async function getUsage(userId, plan = null) {
  return getContactUsage(userId, plan);
}

function limitResponse(res, usage) {
  const code = usage.planId === null
    ? "CONTACT_SUBSCRIPTION_REQUIRED"
    : "CONTACT_LIMIT_REACHED";
  const message = usage.planId === null
    ? "An active paid subscription is required to save contacts."
    : usage.limit === null
    ? "Your Enterprise contact limit is not configured yet."
    : usage.used > usage.limit
      ? `Your current plan allows ${usage.limit} contacts, but you currently have ${usage.used} contacts. Please upgrade your plan or remove contacts to add new contacts.`
      : `You've reached your ${usage.limit} contact limit. Upgrade your plan to save more contacts.`;

  return res.status(409).json({
    success: false,
    code,
    message,
    limit: usage.limit,
    current: usage.used,
    plan: usage.plan,
  });
}

exports.getContacts = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const [contacts, usage] = await Promise.all([
      Contact.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      getUsage(userId),
    ]);
    return res.json({ success: true, contacts, usage });
  } catch (error) {
    console.error("GET CONTACTS ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load contacts" });
  }
};

exports.getUsage = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    return res.json({ success: true, ...(await getUsage(userId)) });
  } catch (error) {
    console.error("GET CONTACT USAGE ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load contact usage" });
  }
};

exports.createContact = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  if (!String(req.body.name || "").trim()) {
    return res.status(400).json({ success: false, message: "Contact name is required" });
  }

  try {
    const result = await createContactWithQuota(
      contactPayloadFromInput(req.body, userId),
      userId
    );
    if (!result.created && !result.duplicate) return limitResponse(res, result.usage);
    return res.status(result.duplicate ? 200 : 201).json({
      success: true,
      contact: result.contact,
      usage: result.usage || await getUsage(userId),
    });
  } catch (error) {
    console.error("CREATE CONTACT ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to create contact" });
  }
};

exports.convertLead = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const lead = await Lead.findOne({ _id: req.params.leadId, userId });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    const result = await createContactWithQuota(
      contactPayloadFromInput(
        { ...lead.toObject(), doctor: lead.preferredDoctor, leadId: lead._id },
        userId
      ),
      userId
    );
    if (!result.created && !result.duplicate) return limitResponse(res, result.usage);
    return res.status(result.duplicate ? 200 : 201).json({
      success: true,
      contact: result.contact,
      usage: result.usage || await getUsage(userId),
    });
  } catch (error) {
    console.error("CONVERT LEAD CONTACT ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to convert lead to contact" });
  }
};

exports.deleteContact = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });
    return res.json({ success: true, usage: await getUsage(userId) });
  } catch (error) {
    console.error("DELETE CONTACT ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to delete contact" });
  }
};