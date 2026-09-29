const mongoose = require("mongoose");

const aiAssistantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    assistantName: {
      type: String,
      trim: true,
      default: "AI Assistant",
    },

    fromName: {
      type: String,
      trim: true,
      default: "",
    },

    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    primaryColor: {
      type: String,
      trim: true,
      default: "#00656A",
    },

    websiteUrl: {
      type: String,
      trim: true,
      default: "",
    },

    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    mobile: {
      type: String,
      trim: true,
      default: "",
    },

    whatsappNumber: {
      type: String,
      trim: true,
      default: "",
    },

    welcomeMessage: {
      type: String,
      trim: true,
      default: "Hello 👋 Welcome! How can I help you today?",
    },

    customInstructions: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIAssistant", aiAssistantSchema);