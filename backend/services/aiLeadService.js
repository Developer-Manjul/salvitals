const Lead = require("../models/Lead");
const AIMessage = require("../models/AIMessage");
const { processNewLead } = require("./leadProcessingService");
const { generateAILeadSummary } = require("./aiService");

const SUMMARY_LABEL = "AI Chat - Lead Summary";

function normalizeText(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLegacyTranscriptNote(note) {
  const text = String(note?.text || "");
  const aiNote = /ai chat/i.test(String(note?.userName || ""));
  return aiNote && (
    text.includes("Conversation transcript:") ||
    text.includes("Contact details collected from AI Chat") ||
    text.includes("Appointment request submitted from AI Chat")
  );
}

function buildFallbackSummary(conversation, service = "") {
  const fields = [];
  const name = String(conversation.visitorName || "").trim();
  const phone = String(conversation.visitorPhone || "").trim();
  const requirement = String(service || "").trim();

  if (requirement) fields.push(`- Requirement: ${requirement}`);
  if (name) fields.push(`- Patient: ${name}`);
  if (phone) fields.push(`- Phone: ${phone}`);

  if (String(conversation.appointmentNote || "").match(/\b(tomorrow|today|\d{1,2}[:/-]\d{2}|am|pm)\b/i)) {
    fields.push("- Appointment: Appointment interest mentioned");
  }

  return fields.length ? `${SUMMARY_LABEL}\n${fields.join("\n")}` : "";
}

function formatGeneratedSummary(text, fallback) {
  const clean = String(text || "").replace(/\*\*/g, "").trim();
  const lines = clean.split(/\n+/).map((line) =>
    line.replace(/^\s*[-*]\s*/, "").trim()
  ).filter(Boolean);
  if (!lines.some((line) => /AI Chat\s*-?\s*Lead Summary/i.test(line))) return fallback;

  const allowed = /^(requirement|main concern|service|patient preferences|appointment|next action|patient|phone|treatment):/i;
  const bullets = lines.slice(1)
    .filter((line) => allowed.test(line))
    .slice(0, 8)
    .map((line) => `- ${line}`);

  return bullets.length ? `${SUMMARY_LABEL}\n${bullets.join("\n")}` : fallback;
}

async function getTranscript(conversationId) {
  if (!conversationId) return "";
  const messages = await AIMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
  return messages.map((item) =>
    `${item.sender === "visitor" ? "Visitor" : "Assistant"}: ${String(item.message || "").trim()}`
  ).filter((line) => !line.endsWith(":")).join("\n");
}

async function createAISummary(conversation, service) {
  const fallback = buildFallbackSummary(conversation, service);
  try {
    const transcript = await getTranscript(conversation._id);
    if (!transcript) return fallback;
    const generated = await generateAILeadSummary({ transcript, visitor: conversation, service });
    return formatGeneratedSummary(generated.text, fallback);
  } catch (error) {
    console.error("AI LEAD SUMMARY FALLBACK:", error?.message || error);
    return fallback;
  }
}

async function syncAILead({ ownerId, conversation, service = "" }) {
  const name = String(conversation.visitorName || "").trim();
  const phone = String(conversation.visitorPhone || "").trim();
  const email = String(conversation.visitorEmail || "").trim();
  if (!name || !phone) return null;

  const sourceUrl = String(
    conversation.sourceUrl || conversation.pageUrl ||
    conversation.landingPage || conversation.source || ""
  ).trim();
  const summary = await createAISummary(conversation, service);
  const existing = await Lead.findOne({ userId: ownerId, phone }).sort({ createdAt: -1 });

  if (existing) {
    let changed = false;
    const cleanNotes = (existing.notes || []).filter((note) => !isLegacyTranscriptNote(note));
    if (cleanNotes.length !== (existing.notes || []).length) {
      existing.notes = cleanNotes;
      changed = true;
    }

    if (name && existing.name !== name) existing.name = name, changed = true;
    if (!existing.email && email) existing.email = email, changed = true;
    if (service && existing.service !== service) existing.service = service, changed = true;
    if (existing.source !== "AI Chat") existing.source = "AI Chat", changed = true;
    if (!existing.preferredDoctor && conversation.preferredDoctor) {
      existing.preferredDoctor = String(conversation.preferredDoctor).trim();
      changed = true;
    }

    const existingAISummaries = existing.notes.filter((note) =>
      /ai chat/i.test(String(note.userName || "")) ||
      String(note.text || "").includes(SUMMARY_LABEL)
    );
    const duplicateSummary = existingAISummaries.some((note) =>
      normalizeText(note.text) === normalizeText(summary)
    );
    const fallbackDuplicate = summary &&
      !summary.includes("\n- ") &&
      existingAISummaries.length > 0;

    if (summary && !duplicateSummary && !fallbackDuplicate) {
      existing.notes.push({ text: summary, userName: "AI Chat Summary" });
      changed = true;
    }

    if (sourceUrl && (!existing.landingPage || existing.landingPage === "Website")) {
      existing.landingPage = sourceUrl;
      changed = true;
    }
    if (sourceUrl && !existing.pageUrl) {
      existing.pageUrl = sourceUrl;
      changed = true;
    }
    if (changed) await existing.save();
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
    firstNote: summary,
    notes: summary ? [{ text: summary, userName: "AI Chat Summary" }] : [],
  });

  await processNewLead(lead);
  return lead;
}

module.exports = { syncAILead };
