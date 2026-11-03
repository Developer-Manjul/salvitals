
const mongoose = require("mongoose");

const platformWhatsAppMessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlatformWhatsAppConversation",
            required: true,
            index: true,
        },
        externalMessageId: {
            type: String,
            required: true,
            unique: true,
        },
        senderId: String,
        recipientId: String,
        direction: {
            type: String,
            enum: ["inbound", "outbound"],
            required: true,
        },
        messageType: {
            type: String,
            default: "text",
        },
        text: {
            type: String,
            default: "",
        },
        attachments: {
            type: Array,
            default: [],
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        deliveryStatus: {
            type: String,
            default: "received",
        },
        rawEvent: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "PlatformWhatsAppMessage",
    platformWhatsAppMessageSchema
);
