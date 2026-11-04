const AIAssistant = require("../models/AIAssistant");
const Lead = require("../models/Lead");
const MetaMessage = require("../models/MetaMessage");
const WhatsAppAutomationSettings = require("../models/WhatsAppAutomationSettings");
const { searchKnowledge } = require("./aiKnowledgeService");
const { generateAIReply } = require("./aiService");
const meta = require("./metaService");

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-15);
}

function isAppointmentRequest(text) {
  return /\b(appointment|consultation|book|booking|visit)\b|appointment chahiye|consultation\b/i.test(
    String(text || "")
  );
}

async function syncLead({ ownerId, conversation, name, phone }) {
  const cleanName = String(name || conversation.participantName || "").trim();
  const cleanPhone = normalizePhone(phone || conversation.participantId);
  if (!cleanPhone) return null;

  const existing = await Lead.findOne({
    userId: ownerId,
    phone: { $in: [cleanPhone, conversation.participantId] },
  }).sort({ createdAt: -1 });

  const displayName = cleanName && !/^WhatsApp user$/i.test(cleanName)
    ? cleanName
    : cleanName || "WhatsApp Patient";

  if (existing) {
    let changed = false;
    if (displayName && existing.name !== displayName) {
      existing.name = displayName;
      changed = true;
    }
    if (existing.source !== "WhatsApp") {
      existing.source = "WhatsApp";
      changed = true;
    }
    if (changed) await existing.save();
    return existing;
  }

  return Lead.create({
    userId: ownerId,
    name: displayName,
    phone: cleanPhone,
    source: "WhatsApp",
    stage: "New",
    firstNote: "Lead created from WhatsApp Inbox.",
  });
}

async function sendAutomationReply({
  integration,
  conversation,
  text,
  accessToken,
}) {
  const result = await meta.sendWhatsAppMessage({
    phoneNumberId: integration.phoneNumberId,
    accessToken,
    to: conversation.participantId,
    text,
  });

  return MetaMessage.create({
    userId: conversation.userId,
    conversationId: conversation._id,
    platform: "whatsapp",
    externalMessageId: String(result.messages?.[0]?.id || ""),
    senderId: integration.phoneNumberId,
    recipientId: conversation.participantId,
    direction: "outbound",
    messageType: "text",
    text,
    sentAt: new Date(),
    deliveryStatus: "sent",
  });
}

async function processIncomingWhatsApp({
  integration,
  conversation,
  inboundText,
  accessToken,
}) {
  let settings = await WhatsAppAutomationSettings.findOne({
    userId: integration.userId,
  });

  if (!settings) {
    settings = await WhatsAppAutomationSettings.create({
      userId: integration.userId,
    });
  }

  if (conversation.aiPaused) return;

  if (settings.leadSyncEnabled) {
    await syncLead({
      ownerId: integration.userId,
      conversation,
      name: conversation.participantName,
      phone: conversation.participantId,
    });
  }

  const inboundCount = await MetaMessage.countDocuments({
    userId: integration.userId,
    conversationId: conversation._id,
    direction: "inbound",
  });

  if (settings.welcomeEnabled && inboundCount === 1 && settings.welcomeMessage) {
    const welcomeMessage = await sendAutomationReply({
      integration,
      conversation,
      text: settings.welcomeMessage,
      accessToken,
    });
    conversation.lastMessageText = settings.welcomeMessage;
    conversation.lastMessageAt = welcomeMessage.sentAt;
    conversation.lastMessageDirection = "outbound";
    await conversation.save();
    return;
  }

  if (settings.appointmentEnabled) {
    const state = conversation.aiBookingState || "idle";
    let reply = "";

    if (state === "awaiting_name") {
      conversation.aiBookingName = String(inboundText || "").trim();
      conversation.aiBookingState = "awaiting_phone";
      reply = "Please share your mobile number so we can reserve the consultation.";
    } else if (state === "awaiting_phone") {
      const phone = normalizePhone(inboundText);
      if (phone.length < 10) {
        reply = "Please share a valid 10-digit mobile number.";
      } else {
        const lead = await syncLead({
          ownerId: integration.userId,
          conversation,
          name: conversation.aiBookingName || conversation.participantName,
          phone,
        });
        if (lead) {
          lead.followUps = [
            ...(lead.followUps || []),
            {
              date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              note: `WhatsApp consultation request from ${conversation.participantId}`,
              purpose: "Consultation booking",
              channel: "WhatsApp",
            },
          ];
          await lead.save();
        }
        conversation.aiBookingState = "idle";
        conversation.aiBookingName = "";
        reply = "Thank you. Your consultation request has been booked. Our team will contact you shortly.";
      }
    } else if (isAppointmentRequest(inboundText)) {
      conversation.aiBookingState = "awaiting_name";
      reply = "Sure, I can help with a consultation. Please share your name.";
    }

    if (reply) {
      await conversation.save();
      const automationMessage = await sendAutomationReply({
        integration,
        conversation,
        text: reply,
        accessToken,
      });
      conversation.lastMessageText = reply;
      conversation.lastMessageAt = automationMessage.sentAt;
      conversation.lastMessageDirection = "outbound";
      await conversation.save();
      return;
    }
  }

  if (!settings.aiReplyEnabled) return;

  const assistant = await AIAssistant.findOne({ ownerId: integration.userId });
  const knowledge = assistant
    ? await searchKnowledge({
        ownerId: integration.userId,
        assistantId: assistant._id,
        query: inboundText,
        limit: 8,
      })
    : [];

  const aiResult = await generateAIReply({
    assistant: assistant || {
      assistantName: "Clinic Assistant",
      customInstructions: "Answer briefly using only the clinic information provided.",
    },
    history: [],
    userMessage: inboundText,
    knowledge: Array.isArray(knowledge) ? knowledge : knowledge?.results || [],
  });

  if (!aiResult?.text?.trim()) return;

  const automationMessage = await sendAutomationReply({
    integration,
    conversation,
    text: aiResult.text.trim(),
    accessToken,
  });
  conversation.lastMessageText = aiResult.text.trim();
  conversation.lastMessageAt = automationMessage.sentAt;
  conversation.lastMessageDirection = "outbound";
  await conversation.save();
}

module.exports = { processIncomingWhatsApp, syncLead };
