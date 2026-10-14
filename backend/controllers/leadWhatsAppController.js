const LeadWhatsAppSetting = require("../models/LeadWhatsAppSetting");
const {
getWorkspaceContext,
requirePermission,
} = require("../utils/workspace");

const ALLOWED_SOURCES = [
"Website",
"Facebook",
"Instagram",
"AI Chat",
];

exports.getSettings = async (req, res) => {
try {
const context = await getWorkspaceContext(req);

    if (!context) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized.",
        });
    }

    if (!requirePermission(context, "leads.view")) {
        return res.status(403).json({
            success: false,
            message: "Permission denied.",
        });
    }

    const setting = await LeadWhatsAppSetting.findOne({
        userId: context.workspaceOwnerId,
    }).lean();

    return res.json({
        success: true,
        settings: setting || {
            enabled: false,
            recipientNumber: "",
            startTime: "19:00",
            endTime: "10:00",
            timezone: "Asia/Kolkata",
            leadSources: ALLOWED_SOURCES,
            sendOutsideWindow: false,
        },
    });
} catch (error) {
    console.error("GET LEAD WHATSAPP SETTINGS ERROR:", error.message);

    return res.status(500).json({
        success: false,
        message: "Failed to load WhatsApp settings.",
    });
}

};

exports.saveSettings = async (req, res) => {
try {
const context = await getWorkspaceContext(req);

    if (!context) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized.",
        });
    }

    if (!context.isOwner) {
        return res.status(403).json({
            success: false,
            message: "Only the workspace owner can change WhatsApp settings.",
        });
    }

    const {
        enabled,
        recipientNumber,
        startTime,
        endTime,
        timezone,
        leadSources,
        sendOutsideWindow,
    } = req.body;

    if (
        typeof enabled !== "boolean" ||
        typeof sendOutsideWindow !== "boolean"
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification settings.",
        });
    }

    const phone = String(recipientNumber || "").replace(/\D/g, "");

    if (enabled && !/^[1-9]\d{9,14}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid WhatsApp number with country code.",
        });
    }

    const validTime = (value) =>
        typeof value === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

    if (!validTime(startTime) || !validTime(endTime)) {
        return res.status(400).json({
            success: false,
            message: "Start and end times must use HH:mm format.",
        });
    }

    if (startTime === endTime) {
        return res.status(400).json({
            success: false,
            message: "Start and end times cannot be the same.",
        });
    }

    if (
        !Array.isArray(leadSources) ||
        leadSources.some((source) => !ALLOWED_SOURCES.includes(source))
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid lead sources.",
        });
    }

    const selectedTimezone = timezone || "Asia/Kolkata";

    try {
        new Intl.DateTimeFormat("en-US", {
            timeZone: selectedTimezone,
        });
    } catch {
        return res.status(400).json({
            success: false,
            message: "Invalid timezone.",
        });
    }

    const settings = await LeadWhatsAppSetting.findOneAndUpdate(
        { userId: context.workspaceOwnerId },
        {
            $set: {
                enabled,
                recipientNumber: phone,
                startTime,
                endTime,
                timezone: selectedTimezone,
                leadSources: [...new Set(leadSources)],
                sendOutsideWindow,
            },
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );

    return res.json({
        success: true,
        message: "WhatsApp lead settings saved.",
        settings,
    });
} catch (error) {
    console.error("SAVE LEAD WHATSAPP SETTINGS ERROR:", error.message);

    return res.status(500).json({
        success: false,
        message: "Failed to save WhatsApp settings.",
    });
}

};