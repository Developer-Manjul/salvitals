const Lead = require("../models/Lead");
const { processNewLead } = require("./leadProcessingService");

async function syncAILead({ ownerId, conversation, service = "" }) {
  const name = String(conversation.visitorName || "").trim();
  const phone = String(conversation.visitorPhone || "").trim();
  const email = String(conversation.visitorEmail || "").trim();

  if (!name || !phone) return null;

  const sourceUrl =
  String(
    conversation.sourceUrl ||
    conversation.pageUrl ||
    conversation.landingPage ||
    conversation.source ||
    ""
  ).trim();

  const existing = await Lead.findOne({
    userId: ownerId,
    phone,
  }).sort({ createdAt: -1 });

  if (existing) {
    let changed = false;
    const appointmentNote = String(conversation.appointmentNote || "").trim();

    if (!existing.email && email) {
      existing.email = email;
      changed = true;
    }

    if (!existing.service && service) {
      existing.service = service;
      changed = true;
    }

    if (existing.source !== "AI Chat") {
      existing.source = "AI Chat";
      changed = true;
    }

    if (!existing.preferredDoctor && conversation.preferredDoctor) {
      existing.preferredDoctor = String(conversation.preferredDoctor).trim();
      changed = true;
    }

    if (appointmentNote && !existing.notes?.some((item) => item.text === appointmentNote)) {
      existing.notes = [
        ...(existing.notes || []),
        { text: appointmentNote, userName: "AI Chat" },
      ];
      changed = true;
    }

    if (sourceUrl) {
  if (!existing.landingPage || existing.landingPage === "Website") {
    existing.landingPage = sourceUrl;
    changed = true;
  }

  if (!existing.pageUrl) {
    existing.pageUrl = sourceUrl;
    changed = true;
  }
}

    if (changed) {
      await existing.save();
    }

    return existing;
  }

 const lead = await Lead.create({
  userId: ownerId,
  name,
  email,
  phone,
  source: "AI Chat",
  service,
  stage: "New",
  landingPage: sourceUrl || "Website",
  pageUrl: sourceUrl || "",
  preferredDoctor: String(conversation.preferredDoctor || "").trim(),
  firstNote: String(conversation.appointmentNote || "").trim(),
  notes: String(conversation.appointmentNote || "").trim()
    ? [{ text: String(conversation.appointmentNote || "").trim(), userName: "AI Chat" }]
    : [],
});

  await processNewLead(lead);

  return lead;
}

module.exports = {
  syncAILead,
};