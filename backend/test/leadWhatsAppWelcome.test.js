const test = require("node:test");
const assert = require("node:assert/strict");

const originalEncryptionKey = process.env.META_TOKEN_ENCRYPTION_KEY;
process.env.META_TOKEN_ENCRYPTION_KEY = "lead-welcome-test-key";

const { encrypt } = require("../utils/encryption");
const {
  hasExplicitWhatsAppOptIn,
  isExplicitWhatsAppOptIn,
} = require("../utils/whatsappConsent");
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
    whatsappBusinessAccountId: "waba-a",
    phoneNumberId: "phone-a",
    accessTokenEncrypted: encrypt("workspace-a-token"),
    isActive: true,
    connectedAt: new Date(),
  },
  {
    userId: WORKSPACE_B,
    whatsappBusinessAccountId: "waba-b",
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
    whatsappOptInAt: values.whatsappOptIn === false
      ? null
      : values.whatsappOptInAt || new Date(),
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
    templateName = "approved_lead_welcome",
    templateLanguage = "en",
    approvedTemplates = [
      {
        name: "approved_lead_welcome",
        status: "APPROVED",
        language: "en",
        components: [{ type: "BODY", text: "Hi {{1}}, {{2}} received your enquiry about {{3}}." }],
      },
    ],
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
    messageUpdateOne: MetaMessage.updateOne,
    sendText: meta.sendWhatsAppMessage,
    sendTemplate: meta.sendWhatsAppTemplateMessage,
    getTemplates: meta.getWhatsAppMessageTemplates,
  };

  const deliveries = new Map();
  const sentText = [];
  const sentTemplates = [];
  const inboxMessages = [];
  const integrationQueries = [];
  const templateQueries = [];
  const messageUpdates = [];
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

  LeadWhatsAppDelivery.findOne = (filter) => {
    const delivery = [...deliveries.values()].find((item) =>
      (!filter.userId || String(item.userId) === String(filter.userId)) &&
      (!filter.leadId || String(item.leadId) === String(filter.leadId)) &&
      (!filter.welcomeMessageId ||
        item.welcomeMessageId === filter.welcomeMessageId) &&
      (!filter.welcomePhoneNumberId ||
        item.welcomePhoneNumberId === filter.welcomePhoneNumberId)
    ) || null;
    const query = {
      select() {
        return this;
      },
      lean: async () => delivery,
      then(resolve, reject) {
        return this.lean().then(resolve, reject);
      },
    };
    return query;
  };

  LeadWhatsAppDelivery.updateOne = async (filter, update) => {
    const delivery = [...deliveries.values()].find(
      (item) =>
        (!filter._id || String(item._id) === String(filter._id)) &&
        (!filter.userId || String(item.userId) === String(filter.userId)) &&
        (!filter.welcomeMessageId ||
          item.welcomeMessageId === filter.welcomeMessageId) &&
        (!filter.welcomePhoneNumberId ||
          item.welcomePhoneNumberId === filter.welcomePhoneNumberId)
    );
    if (
      delivery &&
      (!filter.welcomeStatus || delivery.welcomeStatus === filter.welcomeStatus)
    ) {
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

  MetaMessage.updateOne = async (filter, update) => {
    messageUpdates.push({ filter, update });
    return { acknowledged: true };
  };

  meta.getWhatsAppMessageTemplates = async (wabaId) => {
    templateQueries.push(wabaId);
    return { data: approvedTemplates };
  };

  meta.sendWhatsAppMessage = async (request) => {
    sentText.push(request);
    if (failTextSend) {
      const error = new Error("simulated text send failure");
      error.metaError = { code: 131000, message: error.message };
      throw error;
    }
    return { messages: [{ id: `text-${sentText.length}` }] };
  };

  meta.sendWhatsAppTemplateMessage = async (request) => {
    sentTemplates.push(request);
    if (failTemplateSend) {
      const error = new Error("simulated template send failure");
      error.metaError = { code: 131000, message: error.message };
      throw error;
    }
    return { messages: [{ id: `template-${sentTemplates.length}` }] };
  };

  WhatsAppAutomationSettings.findOne = () => ({
    lean: async () => ({
      welcomeEnabled,
      leadWelcomeTemplateName: templateName,
      leadWelcomeTemplateLanguage: templateLanguage,
    }),
  });

  try {
    await run({
      deliveries,
      sentText,
      sentTemplates,
      inboxMessages,
      integrationQueries,
      templateQueries,
      messageUpdates,
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
    MetaMessage.updateOne = originals.messageUpdateOne;
    meta.sendWhatsAppMessage = originals.sendText;
    meta.sendWhatsAppTemplateMessage = originals.sendTemplate;
    meta.getWhatsAppMessageTemplates = originals.getTemplates;
  }
}

test("Meta, website form, AI chat, Google, and GMB leads use the workspace template sender", async () => {
  await withWelcomeMocks({}, async ({ sentTemplates, integrationQueries, templateQueries, deliveries }) => {
    for (const [index, source] of [
      "Meta Ads",
      "Website Form",
      "AI Chat",
      "Google Ads",
      "Google Business Profile",
    ].entries()) {
      const result = await welcomeService.sendLeadWhatsAppWelcome(
        createLead(source, { _id: `auto-lead-${index}` })
      );
      assert.equal(result.sent, true, source);
    }

    assert.equal(sentTemplates.length, 5);
    assert.deepEqual(templateQueries, ["waba-a", "waba-a", "waba-a", "waba-a", "waba-a"]);
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
      delivery.welcomeMessageId.startsWith("template-") &&
      delivery.welcomeDeliveryStatus === "accepted" &&
      delivery.welcomeMetaResponse.messages[0].id === delivery.welcomeMessageId
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
    async ({ sentText, sentTemplates, inboxMessages, templateQueries }) => {
      const result = await welcomeService.sendLeadWhatsAppWelcome(
        createLead("Website", { _id: "in-window-lead" })
      );

      assert.equal(result.sent, true);
      assert.equal(sentText.length, 1);
      assert.equal(sentTemplates.length, 0);
      assert.equal(templateQueries.length, 0);
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
    assert.equal(deliveries.get("no-consent-lead").welcomeStatus, "skipped");
    assert.match(
      deliveries.get("no-consent-lead").welcomeLastError,
      /consent was not explicitly granted/
    );
    assert.equal(isExplicitWhatsAppOptIn("yes"), true);
    assert.equal(isExplicitWhatsAppOptIn("No"), false);
    assert.equal(
      hasExplicitWhatsAppOptIn({
        "Do you agree to receive messages on WhatsApp?": "Yes",
      }),
      true
    );
    assert.equal(
      hasExplicitWhatsAppOptIn({ whatsapp_number: "Yes" }),
      false
    );
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
      assert.equal(deliveries.get("failed-send-lead").welcomeDeliveryStatus, "failed");
      assert.equal(
        deliveries.get("failed-send-lead").welcomeFailureDetails.error.code,
        131000
      );
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

      assert.equal(result.reason, "integration_inactive");
      assert.equal(sentTemplates.length, 0);
      assert.equal(deliveries.get("disconnected-lead").welcomeStatus, "failed");
      assert.match(
        deliveries.get("disconnected-lead").welcomeLastError,
        /No active WhatsApp integration/
      );
    }
  );
});

test("an unconfigured or unapproved workspace template is never guessed or sent", async () => {
  await withWelcomeMocks(
    { templateName: "", templateLanguage: "" },
    async ({ sentTemplates, templateQueries, deliveries }) => {
      const lead = createLead("Website", { _id: "template-not-configured" });
      const result = await welcomeService.sendLeadWhatsAppWelcome(lead);

      assert.equal(result.reason, "template_not_configured");
      assert.equal(sentTemplates.length, 0);
      assert.equal(templateQueries.length, 0);
      assert.equal(deliveries.get(lead._id).welcomeStatus, "failed");
      assert.match(
        deliveries.get(lead._id).welcomeLastError,
        /No approved WhatsApp lead welcome template is configured/
      );
    }
  );

  await withWelcomeMocks(
    { approvedTemplates: [] },
    async ({ sentTemplates, deliveries }) => {
      const lead = createLead("Website", { _id: "template-not-approved" });
      const result = await welcomeService.sendLeadWhatsAppWelcome(lead);

      assert.equal(result.reason, "template_not_approved");
      assert.equal(sentTemplates.length, 0);
      assert.equal(deliveries.get(lead._id).welcomeStatus, "failed");
      assert.match(
        deliveries.get(lead._id).welcomeLastError,
        /not approved for this workspace and language/
      );
    }
  );
});

test("an approved template with a mismatched body parameter layout is not sent", async () => {
  await withWelcomeMocks(
    {
      approvedTemplates: [{
        name: "approved_lead_welcome",
        status: "APPROVED",
        language: "en",
        components: [{ type: "BODY", text: "Thanks for contacting {{1}}." }],
      }],
    },
    async ({ sentTemplates, deliveries }) => {
      const lead = createLead("Website", { _id: "template-parameters-mismatch" });
      const result = await welcomeService.sendLeadWhatsAppWelcome(lead);

      assert.equal(result.reason, "template_parameters_mismatch");
      assert.equal(sentTemplates.length, 0);
      assert.equal(deliveries.get(lead._id).welcomeStatus, "failed");
      assert.match(
        deliveries.get(lead._id).welcomeLastError,
        /must have three sequential body parameters/
      );
    }
  );
});

test("Meta delivery webhooks update the lead delivery and Inbox message status", async () => {
  await withWelcomeMocks({}, async ({ deliveries, messageUpdates }) => {
    const lead = createLead("Website", { _id: "webhook-status-lead" });
    await welcomeService.sendLeadWhatsAppWelcome(lead);

    const delivery = deliveries.get(lead._id);
    let updated = await welcomeService.updateLeadWhatsAppDeliveryStatus({
      phoneNumberId: "phone-a",
      messageId: delivery.welcomeMessageId,
      status: "delivered",
    });

    assert.equal(updated, true);
    assert.equal(delivery.welcomeDeliveryStatus, "delivered");
    assert.equal(messageUpdates.length, 1);
    updated = await welcomeService.updateLeadWhatsAppDeliveryStatus({
      phoneNumberId: "phone-a",
      messageId: delivery.welcomeMessageId,
      status: "sent",
    });
    assert.equal(updated, false);
    assert.equal(delivery.welcomeDeliveryStatus, "delivered");
    assert.equal(messageUpdates.length, 1);
    assert.deepEqual(messageUpdates[0].update.$set, {
      deliveryStatus: "delivered",
    });
  });
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

});
