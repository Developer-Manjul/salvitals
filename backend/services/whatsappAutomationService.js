const AIAssistant = require("../models/AIAssistant");
const AIKnowledge = require("../models/AIKnowledge");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
const MetaMessage = require("../models/MetaMessage");
const Service = require("../models/Service");
const User = require("../models/User");
const WhatsAppAutomationSettings = require("../models/WhatsAppAutomationSettings");
const { buildKnowledgeSearchQuery, searchKnowledge } = require("./aiKnowledgeService");
const { detectLanguage, generateAIReply } = require("./aiService");
const meta = require("./metaService");

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-15);
}

function isGreeting(text) {
  return /^(hi|hii|hello|hey|namaste|namaskar|good morning|good afternoon|good evening)[.!?\s]*$/i.test(
    String(text || "").trim()
  );
}

function cleanCustomerName(value) {
  const name = String(value || "").trim();
  if (!name || /^\+?[\d\s().-]+$/.test(name) || name.length > 100) return "";
  if (/^(whatsapp user|instagram\/facebook user|customer|unknown)$/i.test(name)) return "";
  return name;
}

function normalizeWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u0900-\u097f]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistanceAtMostOne(left, right) {
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0;
  let j = 0;
  let differences = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    differences += 1;
    if (differences > 1) return false;
    if (left.length > right.length) i += 1;
    else if (right.length > left.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  if (i < left.length || j < right.length) differences += 1;
  return differences <= 1;
}

function matchTreatment(text, candidates = []) {
  const words = normalizeWords(text).split(" ").filter(Boolean);
  for (const candidate of candidates) {
    const name = String(candidate || "").trim();
    const normalized = normalizeWords(name);
    if (!normalized || normalized.length < 3) continue;
    if (/\b(price|pricing|cost|fee|fees|consultation|doctor|appointment|booking)\b/.test(normalized)) continue;
    if (` ${normalizeWords(text)} `.includes(` ${normalized} `)) return name;

    const candidateWords = normalized.split(" ").filter((word) => word.length >= 4);
    if (candidateWords.some((candidateWord) =>
      words.some((word) =>
        word === candidateWord ||
        (Math.min(word.length, candidateWord.length) >= 5 &&
          editDistanceAtMostOne(word, candidateWord))
      )
    )) return name;
  }
  return "";
}

function isAppointmentRequest(text) {
  if (isPricingQuestion(text)) return false;
  if (/अपॉइंटमेंट|परामर्श|डॉक्टर.{0,12}(बात|मिल|बोल)|डॉक्टर से बात/u.test(String(text || ""))) {
    return true;
  }
  const value = normalizeWords(text);
  return /\b(appointment|appointmnt|appointement|booking|book|reserve|schedule)\b/.test(value) ||
    /\b(i want|want to|would like to|need to|please)\s+(?:consult|see|speak to|talk to)\s+(?:a\s+)?doctor\b/.test(value) ||
    /\bconsult\s+(?:a\s+)?doctor\b/.test(value) ||
    /\bdoctor\s+consultation\s+(?:book|schedule|chahiye|karni|krni)\b/.test(value) ||
    /\b(doctor|dr)\s+(se\s+)?(baat|bat|talk|speak)\b/.test(value) ||
    /\b(baat|bat)\s+(karni|krni|karna|krna)\s+(hai|h)\b.*\b(doctor|dr)\b/.test(value) ||
    /\bdoctor\s+(se\s+)?(baat|bat)\s+(karni|krni)\s+(hai|h)\b/.test(value);
}

function isPricingQuestion(text) {
  if (/कीमत|मूल्य|खर्च|दाम|शुल्क|फीस/u.test(String(text || ""))) return true;
  return /\b(cost|price|pricing|fee|fees|charge|charges|rate|kitna|kitne|kitni|kharcha|paisa|paise)\b/.test(
    normalizeWords(text)
  );
}

function detectIntent(text, treatment = "", previousPricingTopic = "") {
  const value = normalizeWords(text);
  if (isPricingQuestion(text)) {
    if (/\bconsultation|consult|doctor\b/.test(value) ||
        /परामर्श|कंसल्टेशन|डॉक्टर/u.test(String(text || ""))) return "consultation_fee";
    if (previousPricingTopic === "consultation_fee" &&
        !/\b(treatment|procedure|service|surgery)\b/.test(value)) return "consultation_fee";
    return "treatment_pricing";
  }
  if (isAppointmentRequest(text)) return "appointment_booking";
  if (/\b(doctor|dr|surgeon)\b/.test(value) &&
      /\b(name|who|information|details|qualification|experience|about)\b/.test(value)) {
    return "doctor_information";
  }
  if (treatment || /\b(treatment|procedure|service|surgery|recovery|healing|aftercare)\b/.test(value) ||
      /उपचार|इलाज|प्रक्रिया|सर्जरी/u.test(String(text || ""))) {
    return "treatment_enquiry";
  }
  return "general_conversation";
}

function extractDoctorName(knowledge = []) {
  for (const item of knowledge) {
    const text = `${item?.title || ""} ${item?.content || ""}`;
    const match = text.match(/\bDr\.?\s+([A-Z][A-Za-z'.-]*(?:\s+[A-Z][A-Za-z'.-]*){0,3})/);
    if (match) return `Dr. ${match[1].trim().replace(/[.,;:!?]+$/, "")}`;
  }
  return "";
}

async function findCustomerName({ ownerId, conversation }) {
  const profileName = cleanCustomerName(conversation.participantName);
  if (profileName) return profileName;

  const phone = normalizePhone(conversation.participantId);
  if (!phone) return "";
  const contact = await Contact.findOne({
    userId: ownerId,
    normalizedPhone: { $regex: `${phone}$` },
    deletedAt: null,
  }).select("name").lean();
  return cleanCustomerName(contact?.name);
}

async function syncLead({ ownerId, conversation, name, phone, treatment, consultation = false }) {
  const cleanName = cleanCustomerName(name);
  const cleanPhone = normalizePhone(phone || conversation.participantId);
  if (!cleanName || cleanPhone.length < 10) return null;

  const existing = await Lead.findOne({
    userId: ownerId,
    $or: [
      { whatsappConversationId: conversation._id },
      { phone: { $in: [cleanPhone, String(phone || ""), conversation.participantId] } },
      { phone: { $regex: `${cleanPhone.slice(-10)}$` } },
    ],
  }).sort({ createdAt: -1 });

  const noteText = [
    consultation ? "WhatsApp consultation request" : "WhatsApp conversation",
    `Conversation: ${String(conversation._id)}`,
    treatment ? `Treatment: ${treatment}` : "",
  ].filter(Boolean).join("\n");

  if (existing) {
    existing.name = cleanName;
    existing.phone = cleanPhone;
    existing.source = "WhatsApp";
    existing.whatsappConversationId = conversation._id;
    if (treatment) existing.service = treatment;
    const existingNote = String(existing.firstNote || "");
    if (!existingNote.includes(String(conversation._id))) {
      existing.firstNote = [existing.firstNote, noteText].filter(Boolean).join("\n");
    } else if (treatment && !existingNote.includes(`Treatment: ${treatment}`)) {
      existing.firstNote = `${existingNote}\nTreatment: ${treatment}`;
    } else if (consultation && existingNote.startsWith("WhatsApp conversation")) {
      existing.firstNote = existingNote.replace("WhatsApp conversation", "WhatsApp consultation request");
    }
    const priorNote = (existing.notes || []).find((note) =>
      String(note.text || "").includes(String(conversation._id))
    );
    if (priorNote && treatment && !String(priorNote.text || "").includes(`Treatment: ${treatment}`)) {
      priorNote.text = noteText;
    } else if (priorNote && consultation && String(priorNote.text || "").startsWith("WhatsApp conversation")) {
      priorNote.text = String(priorNote.text).replace("WhatsApp conversation", "WhatsApp consultation request");
    } else if (!priorNote) {
      existing.notes.push({ text: noteText, userName: "WhatsApp" });
    }
    await existing.save();
    return existing;
  }

  return Lead.create({
    userId: ownerId,
    name: cleanName,
    phone: cleanPhone,
    source: "WhatsApp",
    service: treatment || "",
    stage: "New",
    whatsappConversationId: conversation._id,
    firstNote: noteText,
    notes: [{ text: noteText, userName: "WhatsApp" }],
  });
}

async function sendAutomationReply({ integration, conversation, text, accessToken }) {
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

async function replyAndUpdate({ integration, conversation, text, accessToken }) {
  const message = await sendAutomationReply({ integration, conversation, text, accessToken });
  conversation.lastMessageText = text;
  conversation.lastMessageAt = message.sentAt;
  conversation.lastMessageDirection = "outbound";
  await conversation.save();
}

function setNextBookingState(conversation, customerName) {
  conversation.aiBookingName = cleanCustomerName(conversation.aiBookingName) || customerName;
  conversation.aiBookingPhone = normalizePhone(
    conversation.aiBookingPhone || conversation.participantId
  );
  conversation.aiBookingTreatment = String(
    conversation.aiBookingTreatment || conversation.lastDiscussedTreatment || ""
  ).trim();

  if (!conversation.aiBookingName) conversation.aiBookingState = "awaiting_name";
  else if (conversation.aiBookingPhone.length < 10) conversation.aiBookingState = "awaiting_phone";
  else if (!conversation.aiBookingTreatment) conversation.aiBookingState = "awaiting_treatment";
  else conversation.aiBookingState = "ready_to_submit";
}

function getBookingPrompt(conversation, language) {
  if (language === "hindi") {
    if (conversation.aiBookingState === "awaiting_name") return "कंसल्टेशन अनुरोध के लिए मैं आपका क्या नाम लिखूँ?";
    if (conversation.aiBookingState === "awaiting_phone") return "क्लिनिक के संपर्क के लिए अपना मोबाइल नंबर साझा करें।";
    if (conversation.aiBookingState === "awaiting_treatment") return "आप किस उपचार या समस्या के बारे में डॉक्टर से चर्चा करना चाहेंगे?";
  }
  if (language === "hinglish") {
    if (conversation.aiBookingState === "awaiting_name") return "Consultation request ke liye aapka naam kya likhun?";
    if (conversation.aiBookingState === "awaiting_phone") return "Clinic se contact ke liye apna mobile number share karein.";
    if (conversation.aiBookingState === "awaiting_treatment") return "Aap kis treatment ya concern ke baare mein doctor se baat karna chahenge?";
  }
  if (conversation.aiBookingState === "awaiting_name") {
    return "I can help with that. What name should I use for your consultation request?";
  }
  if (conversation.aiBookingState === "awaiting_phone") {
    return "Please share the best mobile number for the clinic to contact you.";
  }
  if (conversation.aiBookingState === "awaiting_treatment") {
    return "Which treatment or concern would you like to discuss with the doctor?";
  }
  return "";
}

function normalizeNameAnswer(value) {
  const name = cleanCustomerName(String(value || "")
    .replace(/^(my name is|i am|i'm|this is|name is|mera naam|naam)\s+/i, "")
    .trim());
  if (!name || /\d|[?!]/.test(name) || name.split(/\s+/).length > 5 ||
      isPricingQuestion(name) || isAppointmentRequest(name) ||
      /\b(doctor|treatment|procedure|appointment|consultation|fees?|price|cost)\b/i.test(name)) {
    return "";
  }
  return name;
}

function confirmationMessage({ name, clinicName, treatment, language }) {
  const clinic = clinicName || "our team";
  const procedure = treatment ? ` for ${treatment}` : "";
  if (language === "hindi" || language === "hinglish") {
    const hindiProcedure = treatment ? ` (${treatment}) ke liye` : "";
    if (language === "hindi") {
      return `धन्यवाद, ${name}। आपकी${hindiProcedure} कंसल्टेशन रिक्वेस्ट ${clinic} को भेज दी गई है। क्लिनिक की टीम समय तय करने के लिए आपसे संपर्क करेगी। यह अनुरोध है, कन्फर्म अपॉइंटमेंट नहीं।`;
    }
    return `Dhanyavaad, ${name}. Aapki consultation request${hindiProcedure} ${clinic} ko bhej di gayi hai. Clinic ki team samay tay karne ke liye aapse sampark karegi. Yeh request hai, confirmed appointment nahi.`;
  }
  return `Thank you, ${name}. Your consultation request${procedure} has been sent to ${clinic}. The clinic team will contact you to arrange a time. This is a request, not a confirmed appointment.`;
}

async function processIncomingWhatsApp({
  integration,
  conversation,
  inboundText,
  inboundMessageId,
  accessToken,
}) {
  const ownerId = integration.userId;
  const settings = await WhatsAppAutomationSettings.findOne({ userId: ownerId }) ||
    await WhatsAppAutomationSettings.create({ userId: ownerId });

  if (conversation.aiPaused) return;

  const [ownerProfile, assistant, services, customerName] = await Promise.all([
    User.findById(ownerId).select("clinicName").lean(),
    AIAssistant.findOne({ ownerId }),
    Service.find({ userId: ownerId }).select("name").lean(),
    findCustomerName({ ownerId, conversation }),
  ]);
  const serviceKnowledge = assistant
    ? await AIKnowledge.find({ ownerId, assistantId: assistant._id, active: true, type: "service" })
      .select("title").lean()
    : [];
  if (customerName && !cleanCustomerName(conversation.participantName)) {
    conversation.participantName = customerName;
  }

  const treatmentCandidates = [
    ...services.map((service) => service.name),
    ...serviceKnowledge.map((item) => item.title),
  ].filter(Boolean);
  const mentionedTreatment = matchTreatment(inboundText, treatmentCandidates);
  if (mentionedTreatment && mentionedTreatment !== conversation.lastDiscussedTreatment) {
    conversation.lastDiscussedTreatment = mentionedTreatment;
    conversation.lastPricingTopic = "";
  }
  const intent = detectIntent(
    inboundText,
    mentionedTreatment || conversation.lastDiscussedTreatment,
    conversation.lastPricingTopic
  );
  conversation.currentIntent = intent === "general_conversation" &&
    conversation.aiBookingState && conversation.aiBookingState !== "idle"
    ? "appointment_booking"
    : intent;
  if (intent === "treatment_pricing" || intent === "consultation_fee") {
    conversation.lastPricingTopic = intent;
  }
  await conversation.save();

  if (settings.leadSyncEnabled && customerName && !isPricingQuestion(inboundText) &&
      !isAppointmentRequest(inboundText) &&
      (!conversation.aiBookingState || conversation.aiBookingState === "idle")) {
    try {
      await syncLead({
        ownerId,
        conversation,
        name: customerName,
        phone: conversation.participantId,
        treatment: conversation.lastDiscussedTreatment,
      });
    } catch (error) {
      console.error("WHATSAPP LEAD SYNC ERROR:", error?.message || error);
    }
  }

  const inboundCount = await MetaMessage.countDocuments({
    userId: ownerId,
    conversationId: conversation._id,
    direction: "inbound",
  });
  if (settings.welcomeEnabled && inboundCount === 1 && settings.welcomeMessage &&
      isGreeting(inboundText)) {
    await replyAndUpdate({
      integration,
      conversation,
      text: settings.welcomeMessage,
      accessToken,
    });
    return;
  }

  const bookingActive = conversation.aiBookingState && conversation.aiBookingState !== "idle";
  const appointmentRequested = isAppointmentRequest(inboundText);
  const beginsBooking = Boolean(settings.appointmentEnabled && appointmentRequested && !bookingActive);
  const bookingQuestion = isPricingQuestion(inboundText) ||
    intent === "doctor_information" ||
    (conversation.aiBookingState === "awaiting_name" &&
      !normalizeNameAnswer(inboundText) && !appointmentRequested) ||
    (conversation.aiBookingState === "awaiting_treatment" && isPricingQuestion(inboundText));

  if (settings.appointmentEnabled && ((bookingActive && !bookingQuestion) || beginsBooking)) {
    if (beginsBooking) {
      conversation.currentIntent = "appointment_booking";
      conversation.appointmentProgress = "collecting_details";
      conversation.aiBookingTreatment = conversation.lastDiscussedTreatment || mentionedTreatment;
      conversation.aiBookingName = customerName || "";
      conversation.aiBookingPhone = normalizePhone(conversation.participantId);
    } else if (conversation.aiBookingState === "awaiting_name") {
      const answer = isAppointmentRequest(inboundText) ? "" : normalizeNameAnswer(inboundText);
      if (answer) {
        conversation.aiBookingName = answer;
        conversation.participantName = answer;
      }
    } else if (conversation.aiBookingState === "awaiting_phone") {
      const phone = normalizePhone(inboundText);
      if (phone.length >= 10) conversation.aiBookingPhone = phone;
    } else if (conversation.aiBookingState === "awaiting_treatment") {
      const answer = String(inboundText || "").trim();
      if (answer && !isAppointmentRequest(answer) && !isPricingQuestion(answer)) {
        conversation.aiBookingTreatment = mentionedTreatment || answer.slice(0, 160);
        conversation.lastDiscussedTreatment = conversation.aiBookingTreatment;
      }
    }

    setNextBookingState(conversation, customerName);
    conversation.appointmentProgress = conversation.aiBookingState;
    if (conversation.aiBookingState !== "ready_to_submit") {
      const prompt = getBookingPrompt(conversation, detectLanguage(inboundText));
      await conversation.save();
      await replyAndUpdate({ integration, conversation, text: prompt, accessToken });
      return;
    }

    let lead;
    try {
      lead = await syncLead({
        ownerId,
        conversation,
        name: conversation.aiBookingName,
        phone: conversation.aiBookingPhone,
        treatment: conversation.aiBookingTreatment,
        consultation: true,
      });
      if (!lead) throw new Error("WhatsApp consultation details are incomplete.");
    } catch (error) {
      console.error("WHATSAPP CONSULTATION LEAD SAVE ERROR:", error?.message || error);
      conversation.aiBookingState = "ready_to_submit";
      conversation.appointmentProgress = "save_failed";
      await conversation.save();
      await replyAndUpdate({
        integration,
        conversation,
        text: "I’m sorry, I couldn’t submit your consultation request right now. Your details are still here; please message again to retry or contact the clinic directly.",
        accessToken,
      });
      return;
    }
    conversation.whatsappLeadId = lead._id;
    conversation.appointmentProgress = "request_submitted";
    conversation.aiBookingState = "idle";
    await conversation.save();
    const clinicName = String(ownerProfile?.clinicName || integration.verifiedName || "").trim();
    await replyAndUpdate({
      integration,
      conversation,
      text: confirmationMessage({
        name: conversation.aiBookingName,
        clinicName,
        treatment: conversation.aiBookingTreatment,
        language: detectLanguage(inboundText),
      }),
      accessToken,
    });
    return;
  }

  if (!settings.aiReplyEnabled || (assistant && (assistant.enabled === false || assistant.status === "disabled"))) {
    return;
  }

  const history = await MetaMessage.find({
      userId: ownerId,
      conversationId: conversation._id,
      ...(inboundMessageId ? { externalMessageId: { $ne: inboundMessageId } } : {}),
    }).sort({ sentAt: -1 }).limit(12).lean().then((items) => items.reverse().map((item) => ({
      sender: item.direction === "inbound" ? "visitor" : "assistant",
      message: item.text,
    })));
  const query = buildKnowledgeSearchQuery(inboundText, history, [
    conversation.lastDiscussedTreatment
      ? `Last discussed treatment: ${conversation.lastDiscussedTreatment}`
      : "",
    conversation.lastDiscussedDoctor
      ? `Last discussed doctor: ${conversation.lastDiscussedDoctor}`
      : "",
    intent === "consultation_fee" ? "Doctor consultation fee" : "",
  ]);
  let knowledge = [];
  if (assistant) {
    try {
      knowledge = await searchKnowledge({
        ownerId,
        assistantId: assistant._id,
        query,
        intentQuery: inboundText,
        limit: 5,
      });
    } catch (error) {
      console.error("WHATSAPP AI KNOWLEDGE SEARCH ERROR:", error?.message || error);
    }
  }
  const doctorName = extractDoctorName(knowledge);
  if (doctorName && intent === "doctor_information") {
    conversation.lastDiscussedDoctor = doctorName;
    await conversation.save();
  }
  const clinicName = String(ownerProfile?.clinicName || integration.verifiedName || "").trim();
  const aiResult = await generateAIReply({
      assistant: {
        ...(assistant?.toObject ? assistant.toObject() : assistant || {}),
        assistantName: assistant?.assistantName || "Clinic Assistant",
        businessName: clinicName,
        customInstructions: assistant?.customInstructions ||
          "Answer briefly using only the verified information provided. Never invent clinic, doctor, treatment, price, or medical facts.",
      },
      history,
      userMessage: inboundText,
      knowledge,
  });
  const reply = aiResult?.shouldReply === false ? "" : String(aiResult?.text || "").trim();
  if (!reply) return;
  await replyAndUpdate({ integration, conversation, text: reply, accessToken });
}

module.exports = {
  processIncomingWhatsApp,
  syncLead,
  isAppointmentRequest,
  matchTreatment,
  isPricingQuestion,
  detectIntent,
  extractDoctorName,
  normalizePhone,
  cleanCustomerName,
};
