const mongoose = require("mongoose");

const whatsappIntegrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    whatsappBusinessAccountId: {
      type: String,
      required: true,
    },

    phoneNumberId: {
      type: String,
      required: true,
    },

    displayPhoneNumber: {
      type: String,
      default: "",
    },

    verifiedName: {
      type: String,
      default: "",
    },

    accessTokenEncrypted: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

whatsappIntegrationSchema.index(
  { userId: 1, phoneNumberId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "WhatsAppIntegration",
  whatsappIntegrationSchema
);