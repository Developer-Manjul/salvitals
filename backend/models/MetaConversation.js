
const mongoose = require("mongoose");

const metaConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ["facebook", "instagram"],
      required: true,
    },

    pageId: {
      type: String,
      required: true,
    },

    instagramAccountId: {
      type: String,
      default: "",
    },

    externalConversationId: {
      type: String,
      required: true,
    },

    participantId: {
      type: String,
      required: true,
    },

    participantName: {
      type: String,
      default: "Instagram/Facebook user",
    },

    participantProfilePicture: {
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
      min: 0,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

metaConversationSchema.index(
  {
    userId: 1,
    platform: 1,
    pageId: 1,
    externalConversationId: 1,
  },
  { unique: true }
);

metaConversationSchema.index({
  userId: 1,
  lastMessageAt: -1,
});

module.exports = mongoose.model(
  "MetaConversation",
  metaConversationSchema
);
