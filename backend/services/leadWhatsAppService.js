
const axios = require("axios");
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

function isWithinAllowedWindow(settings, now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: settings.timezone || "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(now);

    const hour = Number(parts.find((part) => part.type === "hour").value);
    const minute = Number(parts.find((part) => part.type === "minute").value);
    const current = hour * 60 + minute;

    const [startHour, startMinute] = settings.startTime.split(":").map(Number);
    const [endHour, endMinute] = settings.endTime.split(":").map(Number);

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (start < end) {
        return current >= start && current < end;
    }

    return current >= start || current < end;
}

async function sendLeadWhatsAppNotification(lead) {
    if (!lead?._id || !lead?.userId) {
        return { sent: false, reason: "invalid_lead" };
    }

    const settings = await LeadWhatsAppSetting.findOne({
        userId: lead.userId,
    }).lean();

    if (!settings?.enabled) {
        return { sent: false, reason: "disabled" };
    }

    const source = String(lead.source || "Other").trim();

    if (!settings.leadSources?.includes(source)) {
        return { sent: false, reason: "source_not_selected" };
    }

    const recipientNumber = normalizePhone(settings.recipientNumber);

    if (!recipientNumber) {
        return { sent: false, reason: "invalid_recipient" };
    }

    const withinWindow = isWithinAllowedWindow(settings);

    if (!withinWindow && !settings.sendOutsideWindow) {
        return { sent: false, reason: "outside_window" };
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
        console.error("LEAD WHATSAPP ERROR: API configuration is missing.");
        return { sent: false, reason: "api_not_configured" };
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
            return { sent: false, reason: "already_registered" };
        }

        throw error;
    }

    if (delivery.status === "sent" || delivery.status === "processing") {
        return { sent: false, reason: "already_processed" };
    }

    const claimed = await LeadWhatsAppDelivery.findOneAndUpdate(
        {
            _id: delivery._id,
            status: { $in: ["pending", "failed"] },
        },
        {
            $set: {
                status: "processing",
                lastError: "",
            },
            $inc: { attempts: 1 },
        },
        { new: true }
    );

    if (!claimed) {
        return { sent: false, reason: "already_claimed" };
    }

    try {
        const response = await axios.post(
            `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                to: recipientNumber,
                type: "template",
                template: {
                    name: process.env.WHATSAPP_LEAD_TEMPLATE_NAME || "new_lead_notification",
                    language: {
                        code: process.env.WHATSAPP_LEAD_TEMPLATE_LANGUAGE || "en",
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: String(lead.name || "New lead").slice(0, 200),
                                },
                                {
                                    type: "text",
                                    text: source.slice(0, 100),
                                },
                                {
                                    type: "text",
                                    text: String(lead.phone || "Not provided").slice(0, 100),
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
            { _id: claimed._id, status: "processing" },
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

        await LeadWhatsAppDelivery.updateOne(
            { _id: claimed._id, status: "processing" },
            {
                $set: {
                    status: "failed",
                    lastError: String(message).slice(0, 1000),
                },
            }
        );

        console.error("LEAD WHATSAPP SEND ERROR:", message);

        return { sent: false, reason: "send_failed", message };
    }
}

module.exports = {
    sendLeadWhatsAppNotification,
    isWithinAllowedWindow,
    normalizePhone,
};
