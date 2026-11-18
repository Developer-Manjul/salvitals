const axios = require("axios");
const User = require("../models/User");
const LeadWhatsAppSetting = require("../models/LeadWhatsAppSetting");
const LeadWhatsAppDelivery = require("../models/LeadWhatsAppDelivery");
const Lead = require("../models/Lead");
const WhatsAppIntegration = require("../models/WhatsAppIntegration");
const WhatsAppAutomationSettings = require("../models/WhatsAppAutomationSettings");
const MetaConversation = require("../models/MetaConversation");
const MetaMessage = require("../models/MetaMessage");
const meta = require("./metaService");
const { decrypt } = require("../utils/encryption");
const { isExplicitWhatsAppOptIn } = require("../utils/whatsappConsent");
const {
    isWithinAllowedWindow,
} = require("../utils/leadWhatsAppSchedule");

function normalizePhone(value) {
    let phone = String(value || "").replace(/\D/g, "");

    if (phone.length === 10) {
        if (!/^[6-9]/.test(phone)) {
            return "";
        }

        phone = `91${phone}`;
    } else if (phone.startsWith("0") && phone.length === 11) {
        phone = `91${phone.slice(1)}`;
    }

    return /^[1-9]\d{9,14}$/.test(phone) ? phone : "";
}

function normalizeLeadSource(value) {
    const source = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    if (
        [
            "website",
            "web",
            "website lead",
            "website leads",
            "website form",
        ].includes(source)
    ) {
        return "Website";
    }

    if (
        [
            "meta",
            "meta ads",
            "meta ad",
            "facebook",
            "facebook ads",
            "instagram",
            "instagram ads",
        ].includes(source)
    ) {
        return "Meta";
    }

    if (
        ["ai chat", "ai chatbot", "ai assistant", "chatbot"].includes(source)
    ) {
        return "AI Chat";
    }

    if (
        ["google ads", "google ad", "google", "google advertising"].includes(source)
    ) {
        return "Google Ads";
    }

    if (
        [
            "gmb",
            "google business",
            "google business profile",
            "google my business",
        ].includes(source)
    ) {
        return "GMB";
    }

    return source ? String(value).trim() : "Other";
}

async function reserveWhatsAppQuota(userId) {
    const now = new Date();

    // Atomically reserve one notification so concurrent leads
    // cannot exceed the purchased quota.
    const user = await User.findOneAndUpdate(
        {
            _id: userId,

            "subscription.status": "active",
            "subscription.expiresAt": { $gt: now },

            "addons.whatsapp_leads.enabled": true,
            "addons.whatsapp_leads.startsAt": { $lte: now },
            "addons.whatsapp_leads.expiresAt": { $gt: now },

            $expr: {
                $lt: [
                    {
                        $ifNull: [
                            "$addons.whatsapp_leads.used",
                            0,
                        ],
                    },
                    {
                        $ifNull: [
                            "$addons.whatsapp_leads.quota",
                            0,
                        ],
                    },
                ],
            },
        },
        {
            $inc: {
                "addons.whatsapp_leads.used": 1,
            },
        },
        {
            new: true,
            projection: {
                _id: 1,
                "addons.whatsapp_leads.quota": 1,
                "addons.whatsapp_leads.used": 1,
            },
        }
    );

    if (!user) {
        return {
            reserved: false,
            reason: "plan_addon_inactive_or_quota_exhausted",
        };
    }

    return {
        reserved: true,
    };
}

async function releaseWhatsAppQuota(userId) {
    await User.updateOne(
        {
            _id: userId,
            "addons.whatsapp_leads.used": { $gt: 0 },
        },
        {
            $inc: {
                "addons.whatsapp_leads.used": -1,
            },
        }
    );
}

async function sendLeadWhatsAppNotification(lead) {
    if (!lead?._id || !lead?.userId) {
        return {
            sent: false,
            reason: "invalid_lead",
        };
    }

    const settings = await LeadWhatsAppSetting.findOne({
        userId: lead.userId,
    }).lean();

    if (!settings?.enabled) {
        return {
            sent: false,
            reason: "disabled",
        };
    }

    const normalizedSource = normalizeLeadSource(lead.source);

    const selectedSources = Array.isArray(settings.leadSources)
        ? settings.leadSources.map(normalizeLeadSource)
        : [];

    if (!selectedSources.includes(normalizedSource)) {
        return {
            sent: false,
            reason: "source_not_selected",
        };
    }

    const recipientNumber = normalizePhone(settings.recipientNumber);

    if (!recipientNumber) {
        return {
            sent: false,
            reason: "invalid_recipient",
        };
    }

    if (
    !isWithinAllowedWindow(settings)
    ) {
        return {
            sent: false,
            reason: "outside_window",
        };
    }
    const accessToken =
        process.env.WHATSAPP_ACCESS_TOKEN ||
        process.env.META_WHATSAPP_ACCESS_TOKEN ||
        process.env.META_ACCESS_TOKEN;

    const phoneNumberId =
        process.env.WHATSAPP_PHONE_NUMBER_ID ||
        process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    const graphVersion = process.env.META_GRAPH_VERSION || "v22.0";

    if (!accessToken || !phoneNumberId) {
        console.error(
            "LEAD WHATSAPP ERROR: API configuration is missing."
        );

        return {
            sent: false,
            reason: "api_not_configured",
        };
    }

    

    let delivery;

    try {
        delivery = await LeadWhatsAppDelivery.findOneAndUpdate(
            {
                userId: lead.userId,
                leadId: lead._id,
            },
            {
                $setOnInsert: {
                    userId: lead.userId,
                    leadId: lead._id,
                    recipientNumber,
                    status: "pending",
                    scheduledFor: new Date(),
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );
    } catch (error) {
        if (error.code === 11000) {
            return {
                sent: false,
                reason: "already_registered",
            };
        }

        throw error;
    }

    if (
        delivery.status === "sent" ||
        delivery.status === "processing"
    ) {
        return {
            sent: false,
            reason: "already_processed",
        };
    }

    const claimed = await LeadWhatsAppDelivery.findOneAndUpdate(
        {
            _id: delivery._id,
            status: { $in: ["pending", "failed"] },
        },
        {
            $set: {
                status: "processing",
                recipientNumber,
                lastError: "",
            },
            $inc: {
                attempts: 1,
            },
        },
        {
            new: true,
        }
    );

    if (!claimed) {
        return {
            sent: false,
            reason: "already_claimed",
        };
    }

    let quotaReserved = false;

    try {
        const reservation = await reserveWhatsAppQuota(lead.userId);

        if (!reservation.reserved) {
            await LeadWhatsAppDelivery.updateOne(
                {
                    _id: claimed._id,
                    status: "processing",
                },
                {
                    $set: {
                        status: "pending",
                        lastError: reservation.reason,
                    },
                }
            );

            return {
                sent: false,
                reason: reservation.reason,
            };
        }

        quotaReserved = true;

        const response = await axios.post(
            `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                to: recipientNumber,
                type: "template",
                template: {
                    name:
                        process.env.WHATSAPP_LEAD_TEMPLATE_NAME ||
                        "new_lead_notification",
                    language: {
                        code:
                            process.env.WHATSAPP_LEAD_TEMPLATE_LANGUAGE ||
                            "en",
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: String(
                                        lead.name || "New lead"
                                    ).slice(0, 200),
                                },
                                {
                                    type: "text",
                                    text: normalizedSource.slice(0, 100),
                                },
                                {
                                    type: "text",
                                    text: String(
                                        lead.phone || "Not provided"
                                    ).slice(0, 100),
                                },
                            ],
                        },
                    ],
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        await LeadWhatsAppDelivery.updateOne(
            {
                _id: claimed._id,
                status: "processing",
            },
            {
                $set: {
                    status: "sent",
                    sentAt: new Date(),
                    lastError: "",
                },
            }
        );

        return {
            sent: true,
            messageId: response.data?.messages?.[0]?.id || null,
        };
    } catch (error) {
        const message =
            error.response?.data?.error?.message ||
            error.message ||
            "WhatsApp send failed.";

        // If Meta explicitly rejects the request, release the reserved
        // quota. For network timeouts, delivery may be uncertain, so keep
        // the reservation to avoid double-counting a possibly sent message.
        if (quotaReserved && error.response) {
            try {
                await releaseWhatsAppQuota(lead.userId);
            } catch (releaseError) {
                console.error(
                    "WHATSAPP QUOTA RELEASE ERROR:",
                    releaseError.message
                );
            }
        }

        await LeadWhatsAppDelivery.updateOne(
            {
                _id: claimed._id,
                status: "processing",
            },
            {
                $set: {
                    status: "failed",
                    lastError: String(message).slice(0, 1000),
                },
            }
        );

        console.error(
            "LEAD WHATSAPP SEND ERROR:",
            message
        );

        return {
            sent: false,
            reason: "send_failed",
            message,
        };
    }
}

function buildLeadWelcomeMessage({ leadName, clinicName, serviceName }) {
    const serviceLine = serviceName
        ? `Thank you for reaching out to ${clinicName} regarding ${serviceName}.`
        : `Thank you for reaching out to ${clinicName}.`;
    const enquiryLine = serviceName
        ? "Would you like more information about the treatment, pricing, or assistance with booking a consultation?"
        : "Would you like more information about our services, pricing, or assistance with booking a consultation?";

    return [
        `Hi ${leadName}! 👋`,
        "",
        serviceLine,
        "",
        "I'm here to help you with your enquiry. " + enquiryLine,
        "",
        "Feel free to let us know how we can help!",
        "",
        "Regards,",
        clinicName,
    ].join("\n");
}

async function getWelcomeDelivery(lead, recipientNumber) {
    try {
        return await LeadWhatsAppDelivery.findOneAndUpdate(
            {
                userId: lead.userId,
                leadId: lead._id,
            },
            {
                $setOnInsert: {
                    userId: lead.userId,
                    leadId: lead._id,
                    recipientNumber: recipientNumber || String(lead.phone || ""),
                    status: "pending",
                    welcomeStatus: "pending",
                    scheduledFor: new Date(),
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );
    } catch (error) {
        if (error.code !== 11000) throw error;

        const existing = await LeadWhatsAppDelivery.findOne({
            userId: lead.userId,
            leadId: lead._id,
        });

        if (!existing) throw error;
        return existing;
    }
}

async function updateWelcomeDelivery(deliveryId, update) {
    return LeadWhatsAppDelivery.updateOne(
        {
            _id: deliveryId,
            welcomeStatus: "processing",
        },
        { $set: update }
    );
}

async function findWhatsAppConversation(userId, recipientNumber) {
    return MetaConversation.findOne({
        userId,
        platform: "whatsapp",
        $or: [
            { participantId: recipientNumber },
            { externalConversationId: recipientNumber },
        ],
    }).sort({ lastMessageAt: -1 });
}

async function isWithinWhatsAppServiceWindow({
    userId,
    conversation,
    phoneNumberId,
    now = new Date(),
}) {
    if (!conversation || conversation.pageId !== phoneNumberId) {
        return false;
    }

    const lastInboundMessage = await MetaMessage.findOne({
        userId,
        conversationId: conversation._id,
        platform: "whatsapp",
        direction: "inbound",
    })
        .sort({ sentAt: -1 })
        .select("sentAt")
        .lean();

    const lastInboundAt = lastInboundMessage?.sentAt ||
        (conversation.lastMessageDirection === "inbound"
            ? conversation.lastMessageAt
            : null);

    if (!lastInboundAt) return false;

    const elapsed = now.getTime() - new Date(lastInboundAt).getTime();
    return elapsed >= 0 && elapsed < 24 * 60 * 60 * 1000;
}

async function recordLeadWelcomeInInbox({
    lead,
    integration,
    recipientNumber,
    text,
    messageId,
    sentAt,
}) {
    const conversation = await MetaConversation.findOneAndUpdate(
        {
            userId: lead.userId,
            platform: "whatsapp",
            externalConversationId: recipientNumber,
        },
        {
            $set: {
                pageId: integration.phoneNumberId,
                participantId: recipientNumber,
                participantName: String(lead.name || "WhatsApp User").trim(),
                lastMessageText: text,
                lastMessageAt: sentAt,
                lastMessageDirection: "outbound",
            },
            $setOnInsert: {
                userId: lead.userId,
                platform: "whatsapp",
                externalConversationId: recipientNumber,
                status: "open",
                unreadCount: 0,
            },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    await MetaMessage.create({
        userId: lead.userId,
        conversationId: conversation._id,
        platform: "whatsapp",
        externalMessageId: String(messageId || ""),
        senderId: integration.phoneNumberId,
        recipientId: recipientNumber,
        direction: "outbound",
        messageType: "text",
        text,
        sentAt,
        deliveryStatus: "sent",
    });

    if (!lead.whatsappConversationId) {
        await Lead.updateOne(
            {
                _id: lead._id,
                userId: lead.userId,
                $or: [
                    { whatsappConversationId: null },
                    { whatsappConversationId: { $exists: false } },
                ],
            },
            {
                $set: { whatsappConversationId: conversation._id },
            }
        );
    }
}

async function updateLeadWhatsAppDeliveryStatus({
    phoneNumberId,
    messageId,
    status,
    errors = [],
}) {
    const deliveryStatus = String(status || "").trim().toLowerCase();
    if (
        !phoneNumberId ||
        !messageId ||
        !["sent", "delivered", "read", "failed"].includes(deliveryStatus)
    ) {
        return false;
    }

    const delivery = await LeadWhatsAppDelivery.findOne({
        welcomePhoneNumberId: phoneNumberId,
        welcomeMessageId: messageId,
    })
        .select("userId welcomeDeliveryStatus")
        .lean();

    if (!delivery) return false;

    const statusRank = {
        accepted: 0,
        sent: 1,
        delivered: 2,
        read: 3,
    };
    if (
        delivery.welcomeDeliveryStatus === "failed" ||
        (statusRank[delivery.welcomeDeliveryStatus] !== undefined &&
            statusRank[deliveryStatus] !== undefined &&
            statusRank[deliveryStatus] < statusRank[delivery.welcomeDeliveryStatus])
    ) {
        return false;
    }

    const failureDetails = deliveryStatus === "failed"
        ? errors
        : undefined;
    const failureMessage = deliveryStatus === "failed"
        ? errors
            .map((item) => item?.error_data?.details || item?.message || item?.title || item?.code)
            .filter(Boolean)
            .join("; ")
        : "";

    const update = {
        welcomeDeliveryStatus: deliveryStatus,
    };
    if (failureDetails) {
        update.welcomeFailureDetails = failureDetails;
        update.welcomeLastError = failureMessage || "Meta reported WhatsApp delivery failure.";
    }

    await LeadWhatsAppDelivery.updateOne(
        {
            userId: delivery.userId,
            welcomePhoneNumberId: phoneNumberId,
            welcomeMessageId: messageId,
        },
        { $set: update }
    );

    await MetaMessage.updateOne(
        {
            userId: delivery.userId,
            externalMessageId: messageId,
        },
        { $set: { deliveryStatus } }
    );

    return true;
}

async function sendLeadWhatsAppWelcome(lead, { allowAutomatic = true } = {}) {
    if (!lead?._id || !lead?.userId) {
        return { sent: false, reason: "invalid_lead" };
    }

    if (
        !allowAutomatic ||
        normalizeLeadSource(lead.source).toLowerCase() === "manual"
    ) {
        return { sent: false, reason: "manual_lead" };
    }

    const automationSettings = await WhatsAppAutomationSettings.findOne({
        userId: lead.userId,
    }).lean();

    if (automationSettings?.welcomeEnabled === false) {
        return { sent: false, reason: "welcome_messages_disabled" };
    }

    const recipientNumber = normalizePhone(lead.phone);
    if (!isExplicitWhatsAppOptIn(lead.whatsappOptIn)) {
        const delivery = await getWelcomeDelivery(lead, recipientNumber);
        const reason = "WhatsApp consent was not explicitly granted; customer was not messaged.";
        await LeadWhatsAppDelivery.findOneAndUpdate(
            {
                _id: delivery._id,
                $or: [
                    { welcomeStatus: { $exists: false } },
                    { welcomeStatus: "pending" },
                ],
            },
            {
                $set: {
                    welcomeStatus: "skipped",
                    welcomeLastError: reason,
                },
            },
            { new: true }
        );
        return { sent: false, reason: "whatsapp_opt_in_missing", message: reason };
    }

    const delivery = await getWelcomeDelivery(lead, recipientNumber);

    if (
        ["sent", "processing", "failed", "skipped"].includes(
            delivery.welcomeStatus
        )
    ) {
        return { sent: false, reason: "already_processed" };
    }

    const claimed = await LeadWhatsAppDelivery.findOneAndUpdate(
        {
            _id: delivery._id,
            $or: [
                { welcomeStatus: { $exists: false } },
                { welcomeStatus: "pending" },
            ],
        },
        {
            $set: {
                welcomeStatus: "processing",
                welcomeRecipientNumber: recipientNumber,
                welcomeLastError: "",
            },
            $inc: { welcomeAttempts: 1 },
        },
        { new: true }
    );

    if (!claimed) {
        return { sent: false, reason: "already_claimed" };
    }

    if (!recipientNumber) {
        const message = "Lead phone number is invalid for WhatsApp.";
        await updateWelcomeDelivery(claimed._id, {
            welcomeStatus: "failed",
            welcomeLastError: message,
        });
        console.error("LEAD WHATSAPP WELCOME FAILED:", message, String(lead._id));
        return { sent: false, reason: "invalid_phone", message };
    }

    let apiAccepted = false;
    let messageId = "";
    let sentAt = null;
    let text = "";
    let templateName = "";
    let templateLanguage = "";
    let integration = null;
    let metaResponse = null;

    try {
        const integrations = await WhatsAppIntegration.find({
            userId: lead.userId,
            isActive: true,
        })
            .sort({ connectedAt: -1 })
            .lean();
        
        console.log("ALL ACTIVE WHATSAPP INTEGRATIONS:", integrations.map(item => ({
            phoneNumberId: item.phoneNumberId,
            whatsappBusinessAccountId: item.whatsappBusinessAccountId,
            verifiedName: item.verifiedName,
            isActive: item.isActive,
            connectedAt: item.connectedAt,
        })));

        if (!integrations.length) {
            const error = new Error("No active WhatsApp integration is connected for this workspace.");
            error.reason = "integration_inactive";
            throw error;
        }

        const existingConversation = await findWhatsAppConversation(
            lead.userId,
            recipientNumber
        );
        if (existingConversation?.aiPaused) {
            await updateWelcomeDelivery(claimed._id, {
                welcomeStatus: "skipped",
                welcomeLastError: "Skipped because this WhatsApp conversation is under human takeover.",
            });
            return { sent: false, reason: "human_takeover" };
        }

        integration =
            integrations.find(
                (item) => item.phoneNumberId === existingConversation?.pageId
            ) || integrations[0];
        
        console.log("SELECTED WHATSAPP INTEGRATION:", {
        phoneNumberId: integration?.phoneNumberId,
        whatsappBusinessAccountId: integration?.whatsappBusinessAccountId,
        verifiedName: integration?.verifiedName,
    });

        if (!integration.accessTokenEncrypted) {
            throw new Error("WhatsApp access token is unavailable.");
        }
        if (!integration.phoneNumberId) {
            throw new Error("Active WhatsApp integration has no phone number ID.");
        }

        const accessToken = decrypt(integration.accessTokenEncrypted);
        if (!accessToken) {
            throw new Error("WhatsApp access token could not be decrypted.");
        }
        const business = await User.findById(lead.userId)
            .select("clinicName displayName")
            .lean();
        const clinicName = String(
            business?.clinicName ||
            business?.displayName ||
            integration.verifiedName ||
            "our clinic"
        ).trim();
        const rawLeadName = String(lead.name || "").trim();
        const leadName = /^(unknown|new lead|website lead|google ads lead)$/i.test(
            rawLeadName
        )
            ? "there"
            : (rawLeadName || "there").slice(0, 200);
        const serviceName = String(lead.service || "").trim().slice(0, 200);

        text = buildLeadWelcomeMessage({
            leadName,
            clinicName,
            serviceName,
        });

        const now = new Date();
        const inServiceWindow =
            existingConversation?.pageId === integration.phoneNumberId &&
            await isWithinWhatsAppServiceWindow({
                userId: lead.userId,
                conversation: existingConversation,
                phoneNumberId: integration.phoneNumberId,
                now,
            });

        let response;
        if (inServiceWindow) {
            response = await meta.sendWhatsAppMessage({
                phoneNumberId: integration.phoneNumberId,
                accessToken,
                to: recipientNumber,
                text,
            });
        } else {
            templateName = String(
                automationSettings?.leadWelcomeTemplateName || ""
            ).trim();
            templateLanguage = String(
                automationSettings?.leadWelcomeTemplateLanguage || ""
            ).trim();

            if (!templateName || !templateLanguage) {
                const error = new Error(
                    "No approved WhatsApp lead welcome template is configured for this workspace."
                );
                error.reason = "template_not_configured";
                throw error;
            }

            if (!integration.whatsappBusinessAccountId) {
                throw new Error("Active WhatsApp integration has no business account ID.");
            }

            console.log("WHATSAPP TEMPLATE API CHECK:", {
            integrationWabaId: integration.whatsappBusinessAccountId,
            phoneNumberId: integration.phoneNumberId,
            accessTokenExists: !!accessToken,
        });

            const templateResponse = await meta.getWhatsAppMessageTemplates(
                integration.whatsappBusinessAccountId,
                accessToken
            );
            

           console.log("WHATSAPP TEMPLATE API RESULT:", {
                wabaId: integration.whatsappBusinessAccountId,
                responseData: templateResponse?.data,
                paging: templateResponse?.paging,
                totalTemplates: templateResponse?.data?.length || 0,
            });
            const approvedTemplate = (templateResponse?.data || []).find(
                (item) =>
                    item.name === templateName &&
                    item.status === "APPROVED" &&
                    item.language === templateLanguage
            );
            if (!approvedTemplate) {
                const error = new Error(
                    "The configured WhatsApp lead welcome template is not approved for this workspace and language."
                );
                error.reason = "template_not_approved";
                throw error;
            }
            const bodyText = String(
                approvedTemplate.components?.find(
                    (component) => component.type === "BODY"
                )?.text || ""
            );
            const bodyParameters = Array.from(
                bodyText.matchAll(/{{(\d+)}}/g),
                (match) => Number(match[1])
            );
            if (
                bodyParameters.length !== 3 ||
                bodyParameters.some((parameter, index) => parameter !== index + 1)
            ) {
                const error = new Error(
                    "The approved WhatsApp lead welcome template must have three sequential body parameters for lead name, business name, and enquiry."
                );
                error.reason = "template_parameters_mismatch";
                throw error;
            }

            response = await meta.sendWhatsAppTemplateMessage({
                phoneNumberId: integration.phoneNumberId,
                accessToken,
                to: recipientNumber,
                templateName,
                language: templateLanguage,
                parameters: [
                    leadName,
                    clinicName.slice(0, 200),
                    serviceName || "your enquiry",
                ],
            });
        }

        metaResponse = response;
        messageId = String(response?.messages?.[0]?.id || "");
        if (!messageId) {
            throw new Error("Meta accepted no message ID for the WhatsApp welcome send.");
        }

        apiAccepted = true;
        sentAt = new Date();
    } catch (error) {
        const message =
            error.response?.data?.error?.message ||
            error.metaError?.message ||
            error.message ||
            "WhatsApp welcome message failed.";
        const metaErrorResponse =
            error.response?.data ||
            (error.metaError ? { error: error.metaError } : null);

        await updateWelcomeDelivery(claimed._id, {
            welcomeStatus: "failed",
            welcomeDeliveryStatus: "failed",
            welcomeLastError: String(message).slice(0, 4000),
            welcomeTemplateName: templateName,
            welcomeMetaResponse: metaResponse || metaErrorResponse,
            welcomeFailureDetails: metaErrorResponse || {
                code: error.code || "",
                message: String(message),
            },
        });

        console.error(
            "LEAD WHATSAPP WELCOME SEND ERROR:",
            String(lead._id),
            message
        );

        return {
            sent: false,
            reason: error.reason || "send_failed",
            message,
        };
    }

    try {
        await updateWelcomeDelivery(claimed._id, {
            welcomeStatus: "sent",
            welcomeRecipientNumber: recipientNumber,
            welcomePhoneNumberId: integration.phoneNumberId,
            welcomeMessageId: messageId,
            welcomeMessageText: text,
            welcomeTemplateName: templateName,
            welcomeMetaResponse: metaResponse,
            welcomeDeliveryStatus: "accepted",
            welcomeFailureDetails: undefined,
            welcomeSentAt: sentAt,
            welcomeLastError: "",
        });
    } catch (error) {
        console.error(
            "LEAD WHATSAPP WELCOME STATUS SAVE ERROR:",
            String(lead._id),
            error.message
        );
    }

    if (apiAccepted) {
        try {
            if (!integration) {
                throw new Error("Connected WhatsApp integration disappeared after sending.");
            }

            await recordLeadWelcomeInInbox({
                lead,
                integration,
                recipientNumber,
                text,
                messageId,
                sentAt,
            });
        } catch (error) {
            console.error(
                "LEAD WHATSAPP WELCOME INBOX LOG ERROR:",
                String(lead._id),
                error.message
            );
        }
    }

    return {
        sent: true,
        messageId: messageId || null,
        recipientNumber,
    };
}

module.exports = {
    sendLeadWhatsAppNotification,
    sendLeadWhatsAppWelcome,
    updateLeadWhatsAppDeliveryStatus,
    buildLeadWelcomeMessage,
    isWithinAllowedWindow,
    normalizePhone,
    normalizeLeadSource,
};
