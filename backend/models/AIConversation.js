const mongoose = require("mongoose");

const aiConversationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assistantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIAssistant",
      required: true,
      index: true,
    },

    visitorId: {
      type: String,
      trim: true,
      default: "",
    },

    sessionId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    visitorName: {
      type: String,
      trim: true,
      default: "",
    },

    visitorPhone: {
      type: String,
      trim: true,
      default: "",
    },

    visitorEmail: {
      type: String,
      trim: true,
      default: "",
    },
    preferredDoctor: {
      type: String,
      trim: true,
      default: "",
    },
    appointmentNote: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "waiting_human", "closed"],
      default: "active",
      index: true,
    },

    mode: {
      type: String,
      enum: ["ai", "human"],
      default: "ai",
    },

    source: {
      type: String,
      default: "Website",
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    initialUserMessageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    messagesAfterAppointmentOffer: {
      type: Number,
      default: 0,
      min: 0,
    },
    appointmentOfferPending: {
      type: Boolean,
      default: false,
    },
    appointmentOfferCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactOfferPending: {
      type: Boolean,
      default: false,
    },
    appointmentOfferDeclined: {
      type: Boolean,
      default: false,
    },
    contactCollectionRequested: {
      type: Boolean,
      default: false,
    },
    contactDetailsCaptured: {
      type: Boolean,
      default: false,
    },
    appointmentRequestSubmitted: {
      type: Boolean,
      default: false,
    },
    appointmentFormOpen: {
      type: Boolean,
      default: false,
    },

    assignedTo: {
      type: String,
      trim: true,
      default: "",
    },

    unreadForTeam: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

aiConversationSchema.index({
  ownerId: 1,
  lastMessageAt: -1,
});

module.exports = mongoose.model("AIConversation", aiConversationSchema);