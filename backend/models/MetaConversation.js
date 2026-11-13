
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
    enum: ["facebook", "instagram", "whatsapp"],
    required: true,
  },

    pageId: {
    type: String,
    default: "",
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

    aiPaused: {
      type: Boolean,
      default: false,
      index: true,
    },

    aiPausedAt: {
      type: Date,
      default: null,
    },

    aiBookingState: {
      type: String,
      enum: [
        "idle",
        "awaiting_name",
        "awaiting_phone",
        "awaiting_treatment",
        "ready_to_submit",
      ],
      default: "idle",
    },

    aiBookingName: {
      type: String,
      default: "",
    },

    aiBookingPhone: {
      type: String,
      default: "",
    },

    aiBookingTreatment: {
      type: String,
      default: "",
    },

    lastDiscussedTreatment: {
      type: String,
      default: "",
    },

    lastDiscussedDoctor: {
      type: String,
      default: "",
    },

    lastPricingTopic: {
      type: String,
      default: "",
    },

    currentIntent: {
      type: String,
      default: "",
    },

    appointmentProgress: {
      type: String,
      default: "idle",
    },

    whatsappLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
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
  {
    unique: true,
    partialFilterExpression: {
      pageId: { $type: "string", $gt: "" },
    },
  }
);

metaConversationSchema.index(
  {
    userId: 1,
    platform: 1,
    externalConversationId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      platform: "whatsapp",
    },
  }
);

metaConversationSchema.index({
  userId: 1,
  lastMessageAt: -1,
});

metaConversationSchema.index({
  userId: 1,
  lastMessageAt: -1,
});

module.exports = mongoose.model(
  "MetaConversation",
  metaConversationSchema
);
