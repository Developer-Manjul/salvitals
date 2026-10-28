const axios = require("axios");
const User = require("../models/User");
const LeadWhatsAppSetting = require("../models/LeadWhatsAppSetting");
const LeadWhatsAppDelivery = require("../models/LeadWhatsAppDelivery");

function normalizePhone(value) {
    let phone = String(value || "").replace(/\D/g, "");

    if (phone.length === 10 && /^[6-9]/.test(phone)) {
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
        ["website", "web", "website lead", "website leads"].includes(source)
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

    return source ? String(value).trim() : "Other";
}

function isWithinAllowedWindow(settings, now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: settings.timezone || "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(now);

    const hour = Number(
        parts.find((part) => part.type === "hour").value
    );

    const minute = Number(
        parts.find((part) => part.type === "minute").value
    );

    const current = hour * 60 + minute;

    const [startHour, startMinute] = settings.startTime
        .split(":")
        .map(Number);

    const [endHour, endMinute] = settings.endTime
        .split(":")
        .map(Number);

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (start < end) {
        return current >= start && current < end;
    }

    // Supports windows that cross midnight, e.g. 19:00–10:00.
    return current >= start || current < end;
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
    settings.sendOutsideWindow !== true &&
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

module.exports = {
    sendLeadWhatsAppNotification,
    isWithinAllowedWindow,
    normalizePhone,
    normalizeLeadSource,
};
