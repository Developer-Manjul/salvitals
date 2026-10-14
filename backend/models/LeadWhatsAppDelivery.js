
const mongoose = require("mongoose");

const leadWhatsAppDeliverySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
            required: true,
        },

        recipientNumber: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["pending", "processing", "sent", "failed"],
            default: "pending",
            index: true,
        },

        attempts: {
            type: Number,
            default: 0,
        },

        scheduledFor: {
            type: Date,
            default: Date.now,
            index: true,
        },

        sentAt: {
            type: Date,
            default: null,
        },

        lastError: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// One WhatsApp delivery record per workspace and lead.
leadWhatsAppDeliverySchema.index(
    {
        userId: 1,
        leadId: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "LeadWhatsAppDelivery",
    leadWhatsAppDeliverySchema
);
