const mongoose = require("mongoose");

const metaOAuthStateSchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  accessTokenEncrypted: {
    type: String,
    default: ""
  },
  tokenExpiresAt: {
    type: Date,
    default: null
  },
  pages: {
    type: Array,
    default: []
  },

      connectionType: {
      type: String,
      enum: ["facebook", "whatsapp"],
      default: "facebook",
    },

    whatsappBusinessAccountId: {
      type: String,
      default: "",
    },

    whatsappPhoneNumberId: {
      type: String,
      default: "",
    },

    whatsappDisplayPhoneNumber: {
      type: String,
      default: "",
    },
  expiresAt: {
    type: Date,
    required: true,
    index: {
      expires: 0
    }
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("MetaOAuthState", metaOAuthStateSchema);