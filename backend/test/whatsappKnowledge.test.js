const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildKnowledgeSearchQuery,
} = require("../services/aiKnowledgeService");
const {
  detectIntent,
  extractDoctorName,
  extractPreferredDate,
  extractPreferredTime,
  getConfirmationDecision,
  isAppointmentRequest,
  isPricingQuestion,
  matchTreatment,
  setNextBookingState,
} = require("../services/whatsappAutomationService");
const { isAppointmentRequest: aiServiceAppointmentRequest } = require("../services/aiService");
const AIKnowledge = require("../models/AIKnowledge");
const { searchKnowledge } = require("../services/aiKnowledgeService");
const whatsappAutomation = require("../services/whatsappAutomationService");
const AIAssistant = require("../models/AIAssistant");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
const MetaMessage = require("../models/MetaMessage");
const Service = require("../models/Service");
const User = require("../models/User");
const WhatsAppAutomationSettings = require("../models/WhatsAppAutomationSettings");
const meta = require("../services/metaService");
const axios = require("axios");

test("pricing questions remain informational and do not start booking", () => {
  for (const message of [
    "facelift cost?",
    "consultation fees",
    "doctor consultation fee?",
    "consultation ki fees kya hai",
    "परामर्श शुल्क क्या है?",
  ]) {
    assert.equal(isPricingQuestion(message), true, message);
    assert.equal(isAppointmentRequest(message), false, message);
    assert.equal(aiServiceAppointmentRequest(message), false, message);
  }
  assert.equal(detectIntent("doctor consultation fee?"), "consultation_fee");
  assert.equal(detectIntent("परामर्श शुल्क क्या है?"), "consultation_fee");
  assert.equal(detectIntent("facelift cost?"), "treatment_pricing");
});

test("explicit doctor and appointment requests start booking, doctor questions do not", () => {
  assert.equal(isAppointmentRequest("I want to consult a doctor"), true);
  assert.equal(isAppointmentRequest("doctor se baat karni hai"), true);
  assert.equal(isAppointmentRequest("Book my appointment"), true);
  assert.equal(isAppointmentRequest("Who is the doctor?"), false);
  assert.equal(detectIntent("Who is the doctor?"), "doctor_information");
  assert.equal(isAppointmentRequest("consultation fees kya hai?"), false);
  assert.equal(getConfirmationDecision("yes please proceed"), true);
  assert.equal(getConfirmationDecision("haan"), true);
  assert.equal(getConfirmationDecision("no"), false);
});

test("booking asks only for the next missing detail and parses short replies", () => {
  const booking = {
    aiBookingTreatment: "Facelift",
    aiBookingDate: "",
    aiBookingTime: "",
    aiBookingName: "Manjul",
    aiBookingPhone: "14155550123",
    participantId: "14155550123",
  };
  setNextBookingState(booking, "Manjul");
  assert.equal(booking.aiBookingState, "awaiting_date");
  booking.aiBookingDate = extractPreferredDate("kal");
  assert.equal(booking.aiBookingDate, "kal");
  setNextBookingState(booking, "Manjul");
  assert.equal(booking.aiBookingState, "awaiting_time");
  booking.aiBookingTime = extractPreferredTime("4 baje");
  assert.equal(booking.aiBookingTime, "4 baje");
  setNextBookingState(booking, "Manjul");
  assert.equal(booking.aiBookingState, "awaiting_confirmation");
});

test("treatment and doctor context come from current client data", () => {
  const clinicServices = ["Facelift", "Rhinoplasty"];
  assert.equal(matchTreatment("What is the facelift cost?", clinicServices), "Facelift");
  assert.equal(matchTreatment("What is the consultation fee?", clinicServices), "");
  assert.equal(matchTreatment("I am also considering rhinoplasty", clinicServices), "Rhinoplasty");
  assert.equal(extractDoctorName([
    { title: "Doctor profile", content: "The doctor is Dr. Asha Mehta." },
  ]), "Dr. Asha Mehta");
});

test("knowledge query uses recent visitor context and persisted treatment memory", () => {
  const query = buildKnowledgeSearchQuery(
    "cost?",
    [
      { sender: "visitor", message: "I am interested in facelift" },
      { sender: "assistant", message: "How can I help?" },
    ],
    ["Last discussed treatment: Facelift"]
  );
  assert.match(query, /interested in facelift/i);
  assert.match(query, /Last discussed treatment: Facelift/i);
  assert.match(query, /cost\?/i);
});

test("knowledge retrieval isolates both workspace owner and assistant", async () => {
  const originalFind = AIKnowledge.find;
  const documents = [
    {
      ownerId: "workspace-a",
      assistantId: "assistant-a",
      active: true,
      type: "faq",
      title: "Facelift pricing",
      content: "Facelift treatment price is INR 85000.",
      sourceUrl: "workspace-a",
    },
    {
      ownerId: "workspace-b",
      assistantId: "assistant-b",
      active: true,
      type: "faq",
      title: "Facelift pricing",
      content: "Facelift treatment price is INR 150000.",
      sourceUrl: "workspace-b",
    },
  ];

  AIKnowledge.find = (filter) => ({
    sort() {
      return this;
    },
    async lean() {
      return documents.filter((item) =>
        item.ownerId === filter.ownerId &&
        item.assistantId === filter.assistantId &&
        item.active === filter.active
      );
    },
  });

  try {
    const workspaceA = await searchKnowledge({
      ownerId: "workspace-a",
      assistantId: "assistant-a",
      query: "facelift cost",
    });
    const workspaceB = await searchKnowledge({
      ownerId: "workspace-b",
      assistantId: "assistant-b",
      query: "facelift cost",
    });
    assert.deepEqual(workspaceA.map((item) => item.sourceUrl), ["workspace-a"]);
    assert.deepEqual(workspaceB.map((item) => item.sourceUrl), ["workspace-b"]);
  } finally {
    AIKnowledge.find = originalFind;
  }
});

test("the current question controls intent while history supplies retrieval context", async () => {
  const originalFind = AIKnowledge.find;
  const documents = [
    {
      ownerId: "workspace-a",
      assistantId: "assistant-a",
      active: true,
      type: "faq",
      title: "Facelift pricing",
      content: "Facelift treatment price is INR 85000.",
    },
    {
      ownerId: "workspace-a",
      assistantId: "assistant-a",
      active: true,
      type: "faq",
      title: "Doctor profile",
      content: "The doctor is Dr. Asha Mehta, an experienced specialist.",
    },
  ];

  AIKnowledge.find = (filter) => ({
    sort() {
      return this;
    },
    async lean() {
      return documents.filter((item) =>
        item.ownerId === filter.ownerId &&
        item.assistantId === filter.assistantId &&
        item.active === filter.active
      );
    },
  });

  try {
    const results = await searchKnowledge({
      ownerId: "workspace-a",
      assistantId: "assistant-a",
      query: "Facelift cost Who is the doctor?",
      intentQuery: "Who is the doctor?",
      limit: 2,
    });
    assert.equal(results[0].title, "Doctor profile");
  } finally {
    AIKnowledge.find = originalFind;
  }
});

async function withWhatsAppMocks({ failLeadSave = false } = {}, run) {
  const saved = {
    settingsFindOne: WhatsAppAutomationSettings.findOne,
    userFindById: User.findById,
    assistantFindOne: AIAssistant.findOne,
    serviceFind: Service.find,
    contactFindOne: Contact.findOne,
    messageCount: MetaMessage.countDocuments,
    messageFind: MetaMessage.find,
    messageCreate: MetaMessage.create,
    leadFindOne: Lead.findOne,
    leadCreate: Lead.create,
    sendWhatsAppMessage: meta.sendWhatsAppMessage,
    axiosPost: axios.post,
    openAiKey: process.env.OPENAI_API_KEY,
  };
  const leads = [];
  const outbound = [];

  WhatsAppAutomationSettings.findOne = async () => ({
    welcomeEnabled: false,
    aiReplyEnabled: true,
    appointmentEnabled: true,
    leadSyncEnabled: false,
  });
  User.findById = () => ({
    select() {
      return this;
    },
    lean: async () => ({ clinicName: "Workspace Clinic" }),
  });
  AIAssistant.findOne = async () => null;
  Service.find = () => ({
    select() {
      return this;
    },
    lean: async () => [{ name: "Facelift" }, { name: "Rhinoplasty" }],
  });
  Contact.findOne = async () => null;
  MetaMessage.countDocuments = async () => 2;
  MetaMessage.find = () => ({
    sort() {
      return this;
    },
    limit() {
      return this;
    },
    lean: async () => [],
  });
  MetaMessage.create = async (data) => {
    outbound.push(data);
    return { ...data, _id: `message-${outbound.length}` };
  };
  Lead.findOne = () => ({
    sort: async () => leads[0] || null,
  });
  Lead.create = async (data) => {
    if (failLeadSave) throw new Error("simulated CRM save failure");
    const lead = {
      ...data,
      _id: `lead-${leads.length + 1}`,
      save: async function save() { return this; },
    };
    leads.push(lead);
    return lead;
  };
  meta.sendWhatsAppMessage = async () => ({
    messages: [{ id: `wamid-${outbound.length + 1}` }],
  });
  axios.post = async () => ({
    status: 200,
    data: { output_text: "The clinic’s consultation fee is listed in its verified information." },
  });
  process.env.OPENAI_API_KEY = "test-key";

  try {
    await run({ leads, outbound });
  } finally {
    WhatsAppAutomationSettings.findOne = saved.settingsFindOne;
    User.findById = saved.userFindById;
    AIAssistant.findOne = saved.assistantFindOne;
    Service.find = saved.serviceFind;
    Contact.findOne = saved.contactFindOne;
    MetaMessage.countDocuments = saved.messageCount;
    MetaMessage.find = saved.messageFind;
    MetaMessage.create = saved.messageCreate;
    Lead.findOne = saved.leadFindOne;
    Lead.create = saved.leadCreate;
    meta.sendWhatsAppMessage = saved.sendWhatsAppMessage;
    axios.post = saved.axiosPost;
    if (saved.openAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved.openAiKey;
  }
}

function makeBookingConversation() {
  return {
    _id: "conversation-1",
    userId: "workspace-a",
    participantId: "14155550123",
    participantName: "Manjul",
    lastDiscussedTreatment: "Facelift",
    aiBookingState: "idle",
    aiPaused: false,
    save: async function save() { return this; },
  };
}

test("WhatsApp booking waits for confirmation, resumes after questions, and saves once", async () => {
  await withWhatsAppMocks({}, async ({ leads, outbound }) => {
    const conversation = makeBookingConversation();
    const integration = { userId: "workspace-a", phoneNumberId: "phone-a" };
    const send = async (text) => whatsappAutomation.processIncomingWhatsApp({
      integration,
      conversation,
      inboundText: text,
      inboundMessageId: `in-${outbound.length}-${text}`,
      accessToken: "test-token",
    });

    await send("I want to consult a doctor");
    assert.equal(conversation.aiBookingState, "awaiting_date");
    assert.match(outbound.at(-1).text, /What date would you prefer/i);
    assert.equal(leads.length, 0);

    await send("consultation fees kya hai?");
    assert.equal(conversation.aiBookingState, "awaiting_date");
    assert.match(outbound.at(-1).text, /consultation fee/i);
    assert.match(outbound.at(-1).text, /date aapke liye convenient/i);
    assert.equal(leads.length, 0);

    await send("kal");
    assert.equal(conversation.aiBookingDate, "kal");
    assert.equal(conversation.aiBookingState, "awaiting_time");
    await send("4 baje");
    assert.equal(conversation.aiBookingTime, "4 baje");
    assert.equal(conversation.aiBookingState, "awaiting_confirmation");
    assert.match(outbound.at(-1).text, /Facelift/);
    assert.match(outbound.at(-1).text, /4 baje/);
    assert.match(outbound.at(-1).text, /proceed|bhej doon/i);
    assert.equal(leads.length, 0);

    await send("Rhinoplasty instead");
    assert.equal(conversation.aiBookingTreatment, "Rhinoplasty");
    assert.equal(conversation.aiBookingState, "awaiting_confirmation");
    await send("Monday");
    await send("5 pm");
    assert.equal(conversation.aiBookingDate, "Monday");
    assert.equal(conversation.aiBookingTime, "5 pm");
    assert.equal(leads.length, 0);

    await send("haan");
    assert.equal(leads.length, 1);
    assert.equal(conversation.aiBookingState, "idle");
    assert.equal(leads[0].service, "Rhinoplasty");
    assert.match(leads[0].firstNote, /Preferred date: Monday/);
    assert.match(leads[0].firstNote, /Preferred time: 5 pm/);
    assert.match(outbound.at(-1).text, /consultation request.*successfully submit/i);
    assert.doesNotMatch(outbound.at(-1).text, /appointment is confirmed/i);

    const successCount = outbound.filter((message) =>
      /consultation request.*successfully submit/i.test(message.text)
    ).length;
    await send("yes");
    assert.equal(leads.length, 1);
    assert.equal(outbound.filter((message) =>
      /consultation request.*successfully submit/i.test(message.text)
    ).length, successCount);
  });
});

test("booking rejection and failed lead save never send a success message", async () => {
  await withWhatsAppMocks({}, async ({ leads, outbound }) => {
    const conversation = {
      ...makeBookingConversation(),
      aiBookingState: "awaiting_confirmation",
      aiBookingTreatment: "Facelift",
      aiBookingDate: "tomorrow",
      aiBookingTime: "4 pm",
      aiBookingName: "Manjul",
      aiBookingPhone: "14155550123",
    };
    await whatsappAutomation.processIncomingWhatsApp({
      integration: { userId: "workspace-a", phoneNumberId: "phone-a" },
      conversation,
      inboundText: "no",
      inboundMessageId: "reject-1",
      accessToken: "test-token",
    });
    assert.equal(leads.length, 0);
    assert.equal(conversation.appointmentProgress, "declined");
    assert.doesNotMatch(outbound.at(-1).text, /successfully submitted/i);
  });

  await withWhatsAppMocks({ failLeadSave: true }, async ({ leads, outbound }) => {
    const conversation = {
      ...makeBookingConversation(),
      aiBookingState: "awaiting_confirmation",
      aiBookingTreatment: "Facelift",
      aiBookingDate: "tomorrow",
      aiBookingTime: "4 pm",
      aiBookingName: "Manjul",
      aiBookingPhone: "14155550123",
    };
    await whatsappAutomation.processIncomingWhatsApp({
      integration: { userId: "workspace-a", phoneNumberId: "phone-a" },
      conversation,
      inboundText: "yes",
      inboundMessageId: "fail-1",
      accessToken: "test-token",
    });
    assert.equal(leads.length, 0);
    assert.equal(conversation.aiBookingState, "awaiting_confirmation");
    assert.equal(conversation.appointmentProgress, "save_failed");
    assert.doesNotMatch(outbound.at(-1).text, /successfully submitted/i);
  });
});
