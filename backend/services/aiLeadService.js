const Lead = require("../models/Lead");
const { processNewLead } = require("./leadProcessingService");

async function syncAILead({ ownerId, conversation, service = "" }) {
  const name = String(conversation.visitorName || "").trim();
  const phone = String(conversation.visitorPhone || "").trim();
  const email = String(conversation.visitorEmail || "").trim();

  if (!name || !phone) return null;

  const existing = await Lead.findOne({ userId: ownerId, phone }).sort({ createdAt: -1 });
  if (existing) {
    let changed = false;
    if (!existing.email && email) { existing.email = email; changed = true; }
    if (!existing.service && service) { existing.service = service; changed = true; }
    if (existing.source !== "AI Assistant") { existing.source = "AI Assistant"; changed = true; }
    if (changed) await existing.save();
    return existing;
  }

  const lead = await Lead.create({
    userId: ownerId,
    name,
    email,
    phone,
    source: "AI Assistant",
    service,
    stage: "New",
    landingPage: conversation.source || "Website",
  });

  await processNewLead(lead);
  return lead;
}

module.exports = { syncAILead };
