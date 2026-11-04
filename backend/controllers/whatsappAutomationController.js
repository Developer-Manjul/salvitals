const WhatsAppAutomationSettings = require("../models/WhatsAppAutomationSettings");
const MetaConversation = require("../models/MetaConversation");
const { getWorkspaceContext } = require("../utils/workspace");

async function getContext(req) {
  return getWorkspaceContext(req);
}

exports.getSettings = async (req, res) => {
  const context = await getContext(req);
  if (!context) return res.status(401).json({ success: false, message: "Authentication required" });

  let settings = await WhatsAppAutomationSettings.findOne({ userId: context.workspaceOwnerId });
  if (!settings) {
    settings = await WhatsAppAutomationSettings.create({ userId: context.workspaceOwnerId });
  }
  return res.json({ success: true, settings });
};

exports.updateSettings = async (req, res) => {
  const context = await getContext(req);
  if (!context) return res.status(401).json({ success: false, message: "Authentication required" });

  const allowed = [
    "welcomeEnabled",
    "welcomeMessage",
    "aiReplyEnabled",
    "appointmentEnabled",
    "leadSyncEnabled",
    "humanTakeoverEnabled",
  ];
  const update = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });

  update.welcomeMessage = String(update.welcomeMessage || "Hello! Thanks for contacting us. How can we help you today?")
    .trim()
    .slice(0, 2000);

  const settings = await WhatsAppAutomationSettings.findOneAndUpdate(
    { userId: context.workspaceOwnerId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return res.json({ success: true, settings });
};

exports.resumeConversation = async (req, res) => {
  const context = await getContext(req);
  if (!context) return res.status(401).json({ success: false, message: "Authentication required" });

  const conversation = await MetaConversation.findOneAndUpdate(
    { _id: req.params.id, userId: context.workspaceOwnerId, platform: "whatsapp" },
    { $set: { aiPaused: false, aiPausedAt: null, aiBookingState: "idle", aiBookingName: "" } },
    { new: true }
  );
  if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
  return res.json({ success: true, conversation });
};
