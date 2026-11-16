const test = require("node:test");
const assert = require("node:assert/strict");

const originalEncryptionKey = process.env.META_TOKEN_ENCRYPTION_KEY;
const originalTemplateName = process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_NAME;
const originalTemplateLanguage = process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_LANGUAGE;
process.env.META_TOKEN_ENCRYPTION_KEY = "lead-welcome-test-key";
process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_NAME = "approved_lead_welcome";
process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_LANGUAGE = "en";

const { encrypt } = require("../utils/encryption");
const { isExplicitWhatsAppOptIn } = require("../utils/whatsappConsent");
const welcomeService = require("../services/leadWhatsAppService");
const meta = require("../services/metaService");
const User = require("../models/User");
const Lead = require("../models/Lead");
const LeadWhatsAppDelivery = require("../models/LeadWhatsAppDelivery");
const WhatsAppIntegration = require("../models/WhatsAppIntegration");
const WhatsAppAutomationSettings = require("../models/WhatsAppAutomationSettings");
const MetaConversation = require("../models/MetaConversation");
const MetaMessage = require("../models/MetaMessage");

const originalContactService = require("../services/contactService");
const originalNotificationService = require("../services/notificationService");
const originalSendLeadNotification = welcomeService.sendLeadWhatsAppNotification;
const originalSendLeadWelcome = welcomeService.sendLeadWhatsAppWelcome;
const originalCreateContact = originalContactService.createContactFromLead;
const originalCreateNotification = originalNotificationService.createLeadNotification;
let processedWelcomeCalls = 0;

welcomeService.sendLeadWhatsAppNotification = async () => ({ sent: false });
welcomeService.sendLeadWhatsAppWelcome = async () => {
  processedWelcomeCalls += 1;
  throw new Error("simulated delivery error");
};
originalContactService.createContactFromLead = async () => null;
originalNotificationService.createLeadNotification = async () => null;
const { processNewLead } = require("../services/leadProcessingService");
welcomeService.sendLeadWhatsAppNotification = originalSendLeadNotification;
welcomeService.sendLeadWhatsAppWelcome = originalSendLeadWelcome;
originalContactService.createContactFromLead = originalCreateContact;
originalNotificationService.createLeadNotification = originalCreateNotification;

const WORKSPACE_A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const WORKSPACE_B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const integrations = [
  {
    userId: WORKSPACE_A,
    phoneNumberId: "phone-a",
    accessTokenEncrypted: encrypt("workspace-a-token"),
    isActive: true,
    connectedAt: new Date(),
  },
  {
    userId: WORKSPACE_B,
    phoneNumberId: "phone-b",
    accessTokenEncrypted: encrypt("workspace-b-token"),
    isActive: true,
    connectedAt: new Date(),
  },
];

function createLead(source = "Website", values = {}) {
  return {
    _id: values._id || `lead-${source.replace(/\W/g, "-")}`,
    userId: values.userId || WORKSPACE_A,
    source,
    name: values.name || "Asha Patient",
    phone: values.phone || "9876543210",
    service: values.service === undefined ? "Rhinoplasty" : values.service,
    whatsappOptIn: values.whatsappOptIn === undefined
      ? true
      : values.whatsappOptIn,
    whatsappOptInAt: values.whatsappOptInAt || new Date(),
    whatsappConversationId: null,
  };
}

async function withWelcomeMocks(
  {
    welcomeEnabled = true,
    integrationsForLead = integrations,
    conversation = null,
    inboundMessage = null,
    failTemplateSend = false,
    failTextSend = false,
  } = {},
  run
) {
  const originals = {
    userFindById: User.findById,
    leadUpdateOne: Lead.updateOne,
    deliveryFindOneAndUpdate: LeadWhatsAppDelivery.findOneAndUpdate,
    deliveryFindOne: LeadWhatsAppDelivery.findOne,
    deliveryUpdateOne: LeadWhatsAppDelivery.updateOne,
    integrationFind: WhatsAppIntegration.find,
    settingsFindOne: WhatsAppAutomationSettings.findOne,
    conversationFindOne: MetaConversation.findOne,
    conversationFindOneAndUpdate: MetaConversation.findOneAndUpdate,
    messageFindOne: MetaMessage.findOne,
    messageCreate: MetaMessage.create,
    sendText: meta.sendWhatsAppMessage,
    sendTemplate: meta.sendWhatsAppTemplateMessage,
  };

  const deliveries = new Map();
  const sentText = [];
  const sentTemplates = [];
  const inboxMessages = [];
  const integrationQueries = [];
  let nextDeliveryId = 0;

  User.findById = () => ({
    select() {
      return this;
    },
    lean: async () => ({
      clinicName: "Workspace Clinic",
      displayName: "Workspace",
      name: "Workspace Owner",
    }),
  });
  Lead.updateOne = async () => ({ acknowledged: true });

  LeadWhatsAppDelivery.findOneAndUpdate = async (filter, update) => {
    let delivery = [...deliveries.values()].find((item) =>
      filter._id
        ? String(item._id) === String(filter._id)
        : String(item.userId) === String(filter.userId) &&
          String(item.leadId) === String(filter.leadId)
    );

    if (!delivery && filter._id) return null;

    if (!delivery) {
      delivery = {
        _id: `delivery-${++nextDeliveryId}`,
        ...update.$setOnInsert,
      };
      deliveries.set(String(delivery.leadId), delivery);
      return { ...delivery };
    }

    if (update.$setOnInsert) {
      return { ...delivery };
    }

    if (filter._id && !["pending", undefined].includes(delivery.welcomeStatus)) {
      return null;
    }

    Object.assign(delivery, update.$set || {});
    for (const [key, increment] of Object.entries(update.$inc || {})) {
      delivery[key] = (delivery[key] || 0) + increment;
    }
    return { ...delivery };
  };

  LeadWhatsAppDelivery.findOne = async (filter) =>
    [...deliveries.values()].find((item) =>
      String(item.userId) === String(filter.userId) &&
      String(item.leadId) === String(filter.leadId)
    ) || null;

  LeadWhatsAppDelivery.updateOne = async (filter, update) => {
    const delivery = [...deliveries.values()].find(
      (item) => String(item._id) === String(filter._id)
    );
    if (delivery && delivery.welcomeStatus === filter.welcomeStatus) {
      Object.assign(delivery, update.$set || {});
    }
    return { acknowledged: true };
  };

  WhatsAppIntegration.find = (filter) => {
    integrationQueries.push(filter);
    return {
      sort() {
        return this;
      },
      lean: async () => integrationsForLead.filter(
        (integration) =>
          String(integration.userId) === String(filter.userId) &&
          integration.isActive === filter.isActive
      ),
    };
  };

  WhatsAppAutomationSettings.findOne = () => ({
    lean: async () => ({ welcomeEnabled }),
  });

  MetaConversation.findOne = () => ({
    sort() {
      return Promise.resolve(conversation);
    },
  });

  MetaConversation.findOneAndUpdate = async (filter, update) => {
    const result = conversation || {
      _id: `conversation-${inboxMessages.length + 1}`,
    };
    Object.assign(result, update.$setOnInsert || {}, update.$set || {});
    return result;
  };

  MetaMessage.findOne = () => ({
    sort() {
      return this;
    },
    select() {
      return this;
    },
    lean: async () => inboundMessage,
  });

  MetaMessage.create = async (message) => {
    inboxMessages.push(message);
    return message;
  };

  meta.sendWhatsAppMessage = async (request) => {
    sentText.push(request);
    if (failTextSend) throw new Error("simulated text send failure");
    return { messages: [{ id: `text-${sentText.length}` }] };
  };

  meta.sendWhatsAppTemplateMessage = async (request) => {
    sentTemplates.push(request);
    if (failTemplateSend) throw new Error("simulated template send failure");
    return { messages: [{ id: `template-${sentTemplates.length}` }] };
  };

  try {
    await run({
      deliveries,
      sentText,
      sentTemplates,
      inboxMessages,
      integrationQueries,
    });
  } finally {
    User.findById = originals.userFindById;
    Lead.updateOne = originals.leadUpdateOne;
    LeadWhatsAppDelivery.findOneAndUpdate = originals.deliveryFindOneAndUpdate;
    LeadWhatsAppDelivery.findOne = originals.deliveryFindOne;
    LeadWhatsAppDelivery.updateOne = originals.deliveryUpdateOne;
    WhatsAppIntegration.find = originals.integrationFind;
    WhatsAppAutomationSettings.findOne = originals.settingsFindOne;
    MetaConversation.findOne = originals.conversationFindOne;
    MetaConversation.findOneAndUpdate = originals.conversationFindOneAndUpdate;
    MetaMessage.findOne = originals.messageFindOne;
    MetaMessage.create = originals.messageCreate;
    meta.sendWhatsAppMessage = originals.sendText;
    meta.sendWhatsAppTemplateMessage = originals.sendTemplate;
  }
}

test("Meta, website form, AI chat, Google, and GMB leads use the workspace template sender", async () => {
  await withWelcomeMocks({}, async ({ sentTemplates, integrationQueries, deliveries }) => {
    for (const [index, source] of [
      "Meta Ads",
      "Website Form",
      "AI Chat",
      "Google Ads",
      "GMB",
    ].entries()) {
      const result = await welcomeService.sendLeadWhatsAppWelcome(
        createLead(source, { _id: `auto-lead-${index}` })
      );
      assert.equal(result.sent, true, source);
    }

    assert.equal(sentTemplates.length, 5);
    assert.ok(sentTemplates.every((request) =>
      request.phoneNumberId === "phone-a" &&
      request.accessToken === "workspace-a-token" &&
      request.to === "919876543210" &&
      request.templateName === "approved_lead_welcome" &&
      request.parameters[0] === "Asha Patient" &&
      request.parameters[1] === "Workspace Clinic" &&
      request.parameters[2] === "Rhinoplasty"
    ));
    assert.ok(integrationQueries.every((query) => query.userId === WORKSPACE_A));
    assert.ok([...deliveries.values()].every((delivery) =>
      delivery.welcomeStatus === "sent" &&
      delivery.welcomeMessageId.startsWith("template-")
    ));
  });
});

test("an active customer-service window sends personalized text instead of a template", async () => {
  const existingConversation = {
    _id: "conversation-open",
    userId: WORKSPACE_A,
    pageId: "phone-a",
    platform: "whatsapp",
    participantId: "919876543210",
    externalConversationId: "919876543210",
    lastMessageDirection: "outbound",
  };

  await withWelcomeMocks(
    {
      conversation: existingConversation,
      inboundMessage: { sentAt: new Date(Date.now() - 60 * 1000) },
    },
    async ({ sentText, sentTemplates, inboxMessages }) => {
      const result = await welcomeService.sendLeadWhatsAppWelcome(
        createLead("Website", { _id: "in-window-lead" })
      );

      assert.equal(result.sent, true);
      assert.equal(sentText.length, 1);
      assert.equal(sentTemplates.length, 0);
      assert.match(sentText[0].text, /Workspace Clinic regarding Rhinoplasty/);
      assert.equal(inboxMessages[0].conversationId, "conversation-open");
    }
  );
});

test("the connected WhatsApp number and token are selected only from the lead workspace", async () => {
  await withWelcomeMocks({}, async ({ sentTemplates, integrationQueries }) => {
    const result = await welcomeService.sendLeadWhatsAppWelcome(
      createLead("Website", {
        _id: "workspace-b-lead",
        userId: WORKSPACE_B,
      })
    );

    assert.equal(result.sent, true);
    assert.equal(sentTemplates.length, 1);
    assert.equal(sentTemplates[0].phoneNumberId, "phone-b");
    assert.equal(sentTemplates[0].accessToken, "workspace-b-token");
    assert.equal(integrationQueries.length, 1);
    assert.equal(integrationQueries[0].userId, WORKSPACE_B);
  });
});

test("welcome automation does not send into a human-takeover conversation", async () => {
  await withWelcomeMocks(
    {
      conversation: {
        _id: "conversation-human",
        userId: WORKSPACE_A,
        pageId: "phone-a",
        platform: "whatsapp",
        participantId: "919876543210",
        externalConversationId: "919876543210",
        aiPaused: true,
      },
    },
    async ({ sentTemplates, deliveries }) => {
      const result = await welcomeService.sendLeadWhatsAppWelcome(
        createLead("Website", { _id: "human-takeover-lead" })
      );

      assert.equal(result.reason, "human_takeover");
      assert.equal(sentTemplates.length, 0);
      assert.equal(deliveries.get("human-takeover-lead").welcomeStatus, "skipped");
    }
  );
});

test("manual leads and leads without explicit WhatsApp opt-in are not messaged", async () => {
  await withWelcomeMocks({}, async ({ sentText, sentTemplates, deliveries }) => {
    const manualResult = await welcomeService.sendLeadWhatsAppWelcome(
      createLead("Manual", { _id: "manual-lead" })
    );
    const noConsentResult = await welcomeService.sendLeadWhatsAppWelcome(
      createLead("AI Chat", {
        _id: "no-consent-lead",
        whatsappOptIn: false,
      })
    );

    assert.equal(manualResult.reason, "manual_lead");
    assert.equal(noConsentResult.reason, "whatsapp_opt_in_missing");
    assert.equal(sentText.length + sentTemplates.length, 0);
    assert.equal(deliveries.size, 0);
    assert.equal(isExplicitWhatsAppOptIn("yes"), true);
    assert.equal(isExplicitWhatsAppOptIn("No"), false);
  });
});

test("duplicate webhook processing sends at most one welcome message per lead", async () => {
  await withWelcomeMocks({}, async ({ sentTemplates, deliveries }) => {
    const lead = createLead("Meta Ads", { _id: "duplicate-webhook-lead" });
    const results = await Promise.all([
      welcomeService.sendLeadWhatsAppWelcome(lead),
      welcomeService.sendLeadWhatsAppWelcome(lead),
    ]);

    assert.equal(results.filter((result) => result.sent).length, 1);
    assert.equal(sentTemplates.length, 1);
    assert.equal(
      (await welcomeService.sendLeadWhatsAppWelcome(lead)).reason,
      "already_processed"
    );
    assert.equal(deliveries.get(lead._id).welcomeAttempts, 1);
  });
});

test("invalid phones and failed WhatsApp sends are logged without throwing", async () => {
  await withWelcomeMocks(
    { failTemplateSend: true },
    async ({ sentTemplates, deliveries }) => {
      const invalidPhone = await welcomeService.sendLeadWhatsAppWelcome(
        createLead("Website", {
          _id: "invalid-phone-lead",
          phone: "12345",
        })
      );
      const failedSend = await welcomeService.sendLeadWhatsAppWelcome(
        createLead("Google Ads", { _id: "failed-send-lead" })
      );

      assert.equal(invalidPhone.reason, "invalid_phone");
      assert.equal(failedSend.reason, "send_failed");
      assert.equal(sentTemplates.length, 1);
      assert.equal(deliveries.get("invalid-phone-lead").welcomeStatus, "failed");
      assert.equal(deliveries.get("failed-send-lead").welcomeStatus, "failed");
      assert.match(deliveries.get("failed-send-lead").welcomeLastError, /simulated template send failure/);
    }
  );
});

test("a missing workspace WhatsApp integration is logged as a failed delivery", async () => {
  await withWelcomeMocks(
    { integrationsForLead: [] },
    async ({ sentTemplates, deliveries }) => {
      const result = await welcomeService.sendLeadWhatsAppWelcome(
        createLead("Website", { _id: "disconnected-lead" })
      );

      assert.equal(result.reason, "send_failed");
      assert.equal(sentTemplates.length, 0);
      assert.equal(deliveries.get("disconnected-lead").welcomeStatus, "failed");
      assert.match(
        deliveries.get("disconnected-lead").welcomeLastError,
        /No active WhatsApp integration/
      );
    }
  );
});

test("a missing service uses a general enquiry message without inventing a treatment", () => {
  const message = welcomeService.buildLeadWelcomeMessage({
    leadName: "Sam",
    clinicName: "Workspace Clinic",
    serviceName: "",
  });

  assert.match(message, /Thank you for reaching out to Workspace Clinic\./);
  assert.doesNotMatch(message, /regarding undefined|regarding null/);
  assert.doesNotMatch(message, /regarding [A-Z][a-z]+/);
});

test("welcome automation settings disable the customer message", async () => {
  await withWelcomeMocks(
    { welcomeEnabled: false },
    async ({ sentText, sentTemplates, deliveries }) => {
      const result = await welcomeService.sendLeadWhatsAppWelcome(
        createLead("Website", { _id: "disabled-welcome-lead" })
      );

      assert.equal(result.reason, "welcome_messages_disabled");
      assert.equal(sentText.length + sentTemplates.length, 0);
      assert.equal(deliveries.size, 0);
    }
  );
});

test("lead processing keeps lead creation independent from welcome delivery failures and excludes manual leads", async () => {
  const lead = createLead("Website", { _id: "processing-failure-lead" });
  const result = await processNewLead(lead, { sendCustomerWelcome: true });

  assert.equal(result.lead, lead);
  assert.equal(processedWelcomeCalls, 1);

  await processNewLead(
    createLead("Website", { _id: "processing-existing-lead" })
  );
  assert.equal(processedWelcomeCalls, 1);

  await processNewLead(
    createLead("Manual", { _id: "processing-manual-lead" }),
    { sendCustomerWelcome: false }
  );
  assert.equal(processedWelcomeCalls, 1);
});

test.after(() => {
  if (originalEncryptionKey === undefined) {
    delete process.env.META_TOKEN_ENCRYPTION_KEY;
  } else {
    process.env.META_TOKEN_ENCRYPTION_KEY = originalEncryptionKey;
  }

  if (originalTemplateName === undefined) {
    delete process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_NAME;
  } else {
    process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_NAME = originalTemplateName;
  }

  if (originalTemplateLanguage === undefined) {
    delete process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_LANGUAGE;
  } else {
    process.env.WHATSAPP_LEAD_WELCOME_TEMPLATE_LANGUAGE =
      originalTemplateLanguage;
  }
});
