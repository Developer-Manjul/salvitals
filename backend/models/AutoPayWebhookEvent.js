const mongoose = require("mongoose");

const autoPayWebhookEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        eventType: {
            type: String,
            required: true,
            trim: true,
        },

        razorpaySubscriptionId: {
            type: String,
            default: "",
            trim: true,
        },

        status: {
            type: String,
            enum: ["received", "processed", "failed"],
            default: "received",
        },

        errorMessage: {
            type: String,
            default: "",
        },

        processedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "AutoPayWebhookEvent",
    autoPayWebhookEventSchema
);