const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildKnowledgeSearchQuery,
} = require("../services/aiKnowledgeService");
const {
  detectIntent,
  extractDoctorName,
  isAppointmentRequest,
  isPricingQuestion,
  matchTreatment,
} = require("../services/whatsappAutomationService");
const { isAppointmentRequest: aiServiceAppointmentRequest } = require("../services/aiService");
const AIKnowledge = require("../models/AIKnowledge");
const { searchKnowledge } = require("../services/aiKnowledgeService");

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
