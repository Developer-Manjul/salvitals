const mongoose = require("mongoose");

const leadWhatsAppSettingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        enabled: {
            type: Boolean,
            default: false,
        },

        recipientNumber: {
            type: String,
            trim: true,
            default: "",
        },

        startTime: {
            type: String,
            default: "19:00",
        },

        endTime: {
            type: String,
            default: "10:00",
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata",
        },

        leadSources: {
            type: [String],
            enum: ["Website", "Meta", "AI Chat", "Google Ads"],
            default: ["Website", "Meta", "AI Chat", "Google Ads"],
        },

        sendOutsideWindow: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "LeadWhatsAppSetting",
    leadWhatsAppSettingSchema
);
