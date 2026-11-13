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

function cleanTreatment(value) {
  const treatment = String(value || "").trim().slice(0, 160);
  if (!treatment || isPricingQuestion(treatment) ||
      /^(yes|yeah|yep|yup|haan|han|ji|no|nahi|nahin|ok|okay)$/i.test(normalizeWords(treatment)) ||
      /\b(consultation|doctor|appointment|booking|book|fee|fees|price|pricing|cost)\b/i.test(treatment)) {
    return "";
  }
  return treatment;
}

function extractPreferredDate(value) {
  const hindiDate = String(value || "").match(/आज|कल|परसों/u);
  if (hindiDate) return hindiDate[0];
  const patterns = [
    /\b(?:day after tomorrow|tomorrow|today|next\s+(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|week)|this\s+(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|aaj|kal|parso|somvar|mangalvar|budhvar|guruvar|shukravar|shanivar|ravivar|आज|कल|परसों)\b/i,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?\b/i,
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/i,
    /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/,
  ];
  const text = String(value || "").trim();
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim().slice(0, 80);
  }
  return "";
}

function extractPreferredTime(value) {
  const text = String(value || "").trim();
  const match = text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm|baje|bajey|o['’]?clock)(?:\s*(?:subah|shaam|dopahar|raat|morning|afternoon|evening))?\b/i) ||
    text.match(/\b\d{1,2}(?::\d{2})?\s*बजे(?:\s*(?:सुबह|शाम|दोपहर|रात))?/u) ||
    text.match(/\b(?:noon|midnight|morning|afternoon|evening)\b/i);
  return match ? match[0].trim().slice(0, 80) : "";
}

function isInformationQuestion(value) {
  const text = String(value || "").trim();
  const normalized = normalizeWords(text);
  return /^(what|who|when|where|why|how|can|could|does|do|is|are|tell me|explain|kya|kaise|kyu|kab|kaun|batao)\b/i.test(normalized) ||
    /\b(kya|kaise|kyu|kab|kaun|what|who|how|why)\b/i.test(normalized) && /[?؟]/.test(text);
}

function getConfirmationDecision(value) {
  const text = normalizeWords(value);
  if (/^(no|nope|nah|nahi|nahin|cancel|stop|not now|no thanks|no thank you|no please|nahi chahiye|nahin chahiye|no do not proceed)$/.test(text)) {
    return false;
  }
  if (/^(yes|yeah|yep|yup|haan|han|ji|ji haan|haan ji|yes please|yes proceed|yes please proceed|please proceed|proceed|i confirm|confirm|confirm it|confirmed|i agree|go ahead|ok|okay|theek hai|thik hai|kar do|haan kar do|haan proceed|book kar do|please do)$/.test(text)) {
    return true;
  }
  return null;
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

async function syncLead({
  ownerId,
  conversation,
  name,
  phone,
  treatment,
  preferredDate = "",
  preferredTime = "",
  consultation = false,
}) {
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
    preferredDate ? `Preferred date: ${preferredDate}` : "",
    preferredTime ? `Preferred time: ${preferredTime}` : "",
  ].filter(Boolean).join("\n");

  if (existing) {
    existing.name = cleanName;
    existing.phone = cleanPhone;
    existing.source = "WhatsApp";
    existing.whatsappConversationId = conversation._id;
    if (treatment) existing.service = treatment;
    const existingNote = String(existing.firstNote || "");
    if (consultation) {
      const base = existingNote.split(/\n/)
        .filter((line) => !/^(WhatsApp (?:consultation request|conversation)|Conversation:|Treatment:|Preferred date:|Preferred time:)/i.test(line))
        .join("\n")
        .trim();
      existing.firstNote = [base, noteText].filter(Boolean).join("\n");
    } else if (!existingNote.includes(String(conversation._id))) {
      existing.firstNote = [existing.firstNote, noteText].filter(Boolean).join("\n");
    } else if (treatment && !existingNote.includes(`Treatment: ${treatment}`)) {
      existing.firstNote = `${existingNote}\nTreatment: ${treatment}`;
    } else if (consultation && existingNote.startsWith("WhatsApp conversation")) {
      existing.firstNote = existingNote.replace("WhatsApp conversation", "WhatsApp consultation request");
    }
    const priorNote = (existing.notes || []).find((note) =>
      String(note.text || "").includes(String(conversation._id))
    );
    if (priorNote && consultation) {
      priorNote.text = noteText;
    } else if (priorNote && treatment && !String(priorNote.text || "").includes(`Treatment: ${treatment}`)) {
      priorNote.text = noteText;
    } else if (priorNote && consultation && String(priorNote.text || "").startsWith("WhatsApp conversation")) {
      priorNote.text = String(priorNote.text).replace("WhatsApp conversation", "WhatsApp consultation request");
    } else if (!priorNote) {
      existing.notes.push({ text: noteText, userName: "WhatsApp" });
    }
    await existing.save();
    return existing;
  }

  try {
    return await Lead.create({
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
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const duplicate = await Lead.findOne({
      userId: ownerId,
      whatsappConversationId: conversation._id,
    });
    if (!duplicate) throw error;
    return duplicate;
  }
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
  conversation.aiBookingName = cleanCustomerName(conversation.aiBookingName) || cleanCustomerName(customerName);
  conversation.aiBookingPhone = normalizePhone(
    conversation.aiBookingPhone || conversation.participantId
  );
  conversation.aiBookingTreatment = cleanTreatment(
    conversation.aiBookingTreatment || conversation.lastDiscussedTreatment
  );

  if (!conversation.aiBookingTreatment) conversation.aiBookingState = "awaiting_treatment";
  else if (!conversation.aiBookingDate) conversation.aiBookingState = "awaiting_date";
  else if (!conversation.aiBookingTime) conversation.aiBookingState = "awaiting_time";
  else if (!conversation.aiBookingName) conversation.aiBookingState = "awaiting_name";
  else if (conversation.aiBookingPhone.length < 10) conversation.aiBookingState = "awaiting_phone";
  else conversation.aiBookingState = "awaiting_confirmation";
}

function getBookingPrompt(conversation, language) {
  if (conversation.aiBookingState === "awaiting_confirmation") {
    const treatment = conversation.aiBookingTreatment;
    const date = conversation.aiBookingDate;
    const time = conversation.aiBookingTime;
    if (language === "hindi") {
      return `आपकी ${treatment} कंसल्टेशन रिक्वेस्ट ${date} को ${time} के लिए है। क्या मैं इसे टीम को भेज दूँ?`;
    }
    if (language === "hinglish") {
      return `Aapki ${treatment} consultation request ${date} ko ${time} ke liye hai. Kya main ise team ko bhej doon?`;
    }
    return `Your consultation request is for ${treatment} on ${date} at ${time}. Shall I proceed?`;
  }
  if (conversation.aiBookingState === "awaiting_treatment") {
    if (language === "hindi") return "ज़रूर! आप किस उपचार या समस्या के बारे में डॉक्टर से परामर्श करना चाहेंगे?";
    if (language === "hinglish") return "Sure! Aap kis treatment ya concern ke baare mein doctor se consult karna chahenge?";
    return "Sure! Which treatment or concern would you like to consult the doctor about?";
  }
  if (conversation.aiBookingState === "awaiting_date") {
    if (language === "hindi") return "कंसल्टेशन के लिए कौन-सी तारीख आपके लिए सुविधाजनक रहेगी?";
    if (language === "hinglish") return "Consultation ke liye kaunsi date aapke liye convenient rahegi?";
    return "What date would you prefer for the consultation?";
  }
  if (conversation.aiBookingState === "awaiting_time") {
    if (language === "hindi") return "उस तारीख को कौन-सा समय आपके लिए सुविधाजनक रहेगा?";
    if (language === "hinglish") return "Us date par kaunsa time aapke liye convenient rahega?";
    return "What time would you prefer on that date?";
  }
  if (language === "hindi") {
    if (conversation.aiBookingState === "awaiting_name") return "कंसल्टेशन अनुरोध के लिए मैं आपका क्या नाम लिखूँ?";
    if (conversation.aiBookingState === "awaiting_phone") return "क्लिनिक के संपर्क के लिए अपना मोबाइल नंबर साझा करें।";
  }
  if (language === "hinglish") {
    if (conversation.aiBookingState === "awaiting_name") return "Consultation request ke liye aapka naam kya likhun?";
    if (conversation.aiBookingState === "awaiting_phone") return "Clinic se contact ke liye apna mobile number share karein.";
  }
  if (conversation.aiBookingState === "awaiting_name") {
    return "I can help with that. What name should I use for your consultation request?";
  }
  if (conversation.aiBookingState === "awaiting_phone") {
    return "Please share the best mobile number for the clinic to contact you.";
  }
  return "";
}

function normalizeNameAnswer(value) {
  const name = cleanCustomerName(String(value || "")
    .replace(/^(my name is|i am|i'm|this is|name is|mera naam|naam)\s+/i, "")
    .trim());
  if (!name || /\d|[?!]/.test(name) || name.split(/\s+/).length > 5 ||
      isPricingQuestion(name) || isAppointmentRequest(name) ||
      /^(yes|yeah|yep|yup|haan|han|ji|no|nahi|nahin|ok|okay)$/i.test(normalizeWords(name)) ||
      /\b(doctor|treatment|procedure|appointment|consultation|fees?|price|cost)\b/i.test(name)) {
    return "";
  }
  return name;
}

function confirmationMessage(language) {
  if (language === "hindi" || language === "hinglish") {
    if (language === "hindi") {
      return "धन्यवाद! आपका कंसल्टेशन अनुरोध सफलतापूर्वक भेज दिया गया है। हमारी टीम उपलब्धता की पुष्टि के लिए आपसे संपर्क करेगी। यह अनुरोध है, कन्फर्म अपॉइंटमेंट नहीं।";
    }
    return "Thank you! Aapki consultation request successfully submit ho gayi hai. Hamari team availability confirm karne ke liye aapse contact karegi. Yeh request hai, confirmed appointment nahi.";
  }
  return "Thank you! Your consultation request has been successfully submitted. Our team will contact you with confirmation. Your preferred date and time are not yet confirmed.";
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
  conversation.lastDiscussedTreatment = cleanTreatment(conversation.lastDiscussedTreatment);
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
  if (conversation.aiBookingState && conversation.aiBookingState !== "idle") {
    const detectedLanguage = detectLanguage(inboundText);
    if (detectedLanguage !== "english") conversation.aiBookingLanguage = detectedLanguage;
  }
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
  const bookingQuestion = bookingActive && (
    isPricingQuestion(inboundText) ||
    intent === "doctor_information" ||
    (isInformationQuestion(inboundText) && intent !== "appointment_booking")
  );

  if (settings.appointmentEnabled && ((bookingActive && !bookingQuestion) || beginsBooking)) {
    const detectedLanguage = detectLanguage(inboundText);
    if (beginsBooking || detectedLanguage !== "english") {
      conversation.aiBookingLanguage = detectedLanguage;
    }

    if (beginsBooking) {
      conversation.currentIntent = "appointment_booking";
      conversation.appointmentProgress = "collecting_details";
      conversation.aiBookingTreatment = cleanTreatment(
        conversation.lastDiscussedTreatment || mentionedTreatment
      );
      conversation.aiBookingDate = "";
      conversation.aiBookingTime = "";
      conversation.aiBookingName = customerName || "";
      conversation.aiBookingPhone = normalizePhone(conversation.participantId);
      setNextBookingState(conversation, customerName);
      conversation.appointmentProgress = conversation.aiBookingState;
      const prompt = getBookingPrompt(conversation, conversation.aiBookingLanguage);
      await conversation.save();
      await replyAndUpdate({ integration, conversation, text: prompt, accessToken });
      return;
    }

    const decision = conversation.aiBookingState === "awaiting_confirmation"
      ? getConfirmationDecision(inboundText)
      : null;
    if (conversation.aiBookingState === "awaiting_confirmation" && decision === false) {
      conversation.aiBookingState = "idle";
      conversation.appointmentProgress = "declined";
      await conversation.save();
      await replyAndUpdate({
        integration,
        conversation,
        text: conversation.aiBookingLanguage === "hindi"
          ? "कोई बात नहीं। आपका अनुरोध नहीं भेजा गया है। जब आप चाहें, हम इसे फिर से शुरू कर सकते हैं।"
          : conversation.aiBookingLanguage === "hinglish"
            ? "Koi baat nahi. Aapki request submit nahi hui hai. Jab chahein, hum booking phir se shuru kar sakte hain."
            : "No problem. Your request was not submitted. We can restart whenever you’re ready.",
        accessToken,
      });
      return;
    }

    if (conversation.aiBookingState === "awaiting_confirmation") {
      let detailsChanged = false;
      if (mentionedTreatment && mentionedTreatment !== conversation.aiBookingTreatment) {
        conversation.aiBookingTreatment = mentionedTreatment;
        conversation.lastDiscussedTreatment = mentionedTreatment;
        detailsChanged = true;
      }
      const date = extractPreferredDate(inboundText);
      const time = extractPreferredTime(inboundText);
      if (date && date !== conversation.aiBookingDate) {
        conversation.aiBookingDate = date;
        detailsChanged = true;
      }
      if (time && time !== conversation.aiBookingTime) {
        conversation.aiBookingTime = time;
        detailsChanged = true;
      }
      if (decision !== true || detailsChanged) {
        const prompt = getBookingPrompt(conversation, conversation.aiBookingLanguage);
        conversation.appointmentProgress = "awaiting_confirmation";
        await conversation.save();
        await replyAndUpdate({ integration, conversation, text: prompt, accessToken });
        return;
      }
    } else {
      if (mentionedTreatment && !bookingQuestion &&
          conversation.aiBookingState !== "awaiting_treatment" &&
          mentionedTreatment !== conversation.aiBookingTreatment) {
        conversation.aiBookingTreatment = mentionedTreatment;
        conversation.lastDiscussedTreatment = mentionedTreatment;
      }

      if (conversation.aiBookingState === "awaiting_treatment") {
        const answer = String(inboundText || "").trim();
        if (answer && !bookingQuestion && !isAppointmentRequest(answer) &&
            !extractPreferredDate(answer) && !extractPreferredTime(answer)) {
          conversation.aiBookingTreatment = cleanTreatment(mentionedTreatment || answer);
          if (conversation.aiBookingTreatment) {
            conversation.lastDiscussedTreatment = conversation.aiBookingTreatment;
          }
        }
      } else if (conversation.aiBookingState === "awaiting_date" ||
          conversation.aiBookingState === "awaiting_time") {
        const date = extractPreferredDate(inboundText);
        const time = extractPreferredTime(inboundText);
        if (date) conversation.aiBookingDate = date;
        if (time) conversation.aiBookingTime = time;
      } else if (conversation.aiBookingState === "awaiting_name") {
        const answer = normalizeNameAnswer(inboundText);
        if (answer) {
          conversation.aiBookingName = answer;
          conversation.participantName = answer;
        }
      } else if (conversation.aiBookingState === "awaiting_phone") {
        const phone = normalizePhone(inboundText);
        if (phone.length >= 10) conversation.aiBookingPhone = phone;
      }

      setNextBookingState(conversation, customerName);
      conversation.appointmentProgress = conversation.aiBookingState;
      const prompt = getBookingPrompt(conversation, conversation.aiBookingLanguage);
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
        preferredDate: conversation.aiBookingDate,
        preferredTime: conversation.aiBookingTime,
        consultation: true,
      });
      if (!lead) throw new Error("WhatsApp consultation details are incomplete.");
    } catch (error) {
      console.error("WHATSAPP CONSULTATION LEAD SAVE ERROR:", error?.message || error);
      conversation.aiBookingState = "awaiting_confirmation";
      conversation.appointmentProgress = "save_failed";
      await conversation.save();
      await replyAndUpdate({
        integration,
        conversation,
        text: conversation.aiBookingLanguage === "hindi"
          ? "माफ़ कीजिए, अनुरोध अभी सेव नहीं हो सका। विवरण सुरक्षित हैं। दोबारा कोशिश करने के लिए कृपया 'हाँ' कहें।"
          : conversation.aiBookingLanguage === "hinglish"
            ? "Sorry, request abhi save nahi ho saki. Aapki details yahin hain. Retry karne ke liye please 'haan' reply karein."
            : "Sorry, I couldn’t save your consultation request. Your details are still here. Reply “yes” to retry.",
        accessToken,
      });
      return;
    }
    conversation.whatsappLeadId = lead._id;
    conversation.appointmentProgress = "request_submitted";
    conversation.aiBookingState = "idle";
    await conversation.save();
    await replyAndUpdate({
      integration,
      conversation,
      text: confirmationMessage({
        language: conversation.aiBookingLanguage,
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
  const bookingInstructions = bookingQuestion
    ? `The visitor has a pending consultation request. The current question is ${conversation.aiBookingState}. Answer their current information question first using only verified knowledge. Do not book, submit, or claim availability. The application will continue the pending request afterward.`
    : "";
  const aiResult = await generateAIReply({
      assistant: {
        ...(assistant?.toObject ? assistant.toObject() : assistant || {}),
        assistantName: assistant?.assistantName || "Clinic Assistant",
        businessName: clinicName,
        customInstructions: [
          assistant?.customInstructions ||
            "Answer briefly using only the verified information provided. Never invent clinic, doctor, treatment, price, or medical facts.",
          bookingInstructions,
        ].filter(Boolean).join("\n"),
      },
      history,
      userMessage: inboundText,
      knowledge,
  });
  let reply = aiResult?.shouldReply === false ? "" : String(aiResult?.text || "").trim();
  if (!reply) return;
  if (bookingQuestion) {
    const pendingPrompt = getBookingPrompt(conversation, conversation.aiBookingLanguage);
    if (pendingPrompt) reply = `${reply}\n\n${pendingPrompt}`;
  }
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
  cleanTreatment,
  setNextBookingState,
  extractPreferredDate,
  extractPreferredTime,
  getConfirmationDecision,
  getBookingPrompt,
  normalizePhone,
  cleanCustomerName,
};
