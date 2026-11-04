const mongoose = require("mongoose");

const whatsappAutomationSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    welcomeEnabled: { type: Boolean, default: true },
    welcomeMessage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "Hello! Thanks for contacting us. How can we help you today?",
    },
    aiReplyEnabled: { type: Boolean, default: true },
    appointmentEnabled: { type: Boolean, default: true },
    leadSyncEnabled: { type: Boolean, default: true },
    humanTakeoverEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "WhatsAppAutomationSettings",
  whatsappAutomationSettingsSchema
);
