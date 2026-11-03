
const mongoose = require("mongoose");

const platformWhatsAppConversationSchema = new mongoose.Schema(
    {
        externalConversationId: {
            type: String,
            required: true,
            unique: true,
        },
        participantId: {
            type: String,
            required: true,
        },
        participantName: {
            type: String,
            default: "",
        },
        lastMessageText: {
            type: String,
            default: "",
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        lastMessageDirection: {
            type: String,
            enum: ["inbound", "outbound"],
            default: "inbound",
        },
        unreadCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open",
        },
    },
    { timestamps: true }
);

platformWhatsAppConversationSchema.index({
    lastMessageAt: -1,
});

module.exports = mongoose.model(
    "PlatformWhatsAppConversation",
    platformWhatsAppConversationSchema
);
