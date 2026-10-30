
const mongoose = require("mongoose");

const metaMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MetaConversation",
      required: true,
      index: true,
    },

    platform: {
    type: String,
    enum: ["facebook", "instagram", "whatsapp"],
    required: true,
  },
    externalMessageId: {
      type: String,
      default: "",
    },

    senderId: {
      type: String,
      required: true,
    },

    recipientId: {
      type: String,
      default: "",
    },

    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "sticker", "other"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
    },

    attachments: [
      {
        type: {
          type: String,
          default: "file",
        },
        url: {
          type: String,
          default: "",
        },
        name: {
          type: String,
          default: "",
        },
      },
    ],

    sentAt: {
      type: Date,
      default: Date.now,
    },

    deliveryStatus: {
      type: String,
      enum: ["received", "sent", "delivered", "read", "failed"],
      default: "received",
    },

    rawEvent: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true }
);

metaMessageSchema.index(
  { userId: 1, externalMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalMessageId: { $type: "string", $gt: "" },
    },
  }
);

metaMessageSchema.index({
  userId: 1,
  conversationId: 1,
  sentAt: 1,
});

module.exports = mongoose.model(
  "MetaMessage",
  metaMessageSchema
);
