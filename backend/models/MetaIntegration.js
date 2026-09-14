const mongoose = require("mongoose");

const metaIntegrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pageId: { type: String, required: true },
    pageName: { type: String, default: "" },
    instagramAccountId: { type: String, default: "" },
    instagramUsername: { type: String, default: "" },
    businessId: { type: String, default: "" },
    businessName: { type: String, default: "" },
    accessTokenEncrypted: { type: String, required: true },
    tokenExpiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

metaIntegrationSchema.index({ userId: 1, pageId: 1 }, { unique: true });
metaIntegrationSchema.index({ pageId: 1, isActive: 1 });

module.exports = mongoose.model("MetaIntegration", metaIntegrationSchema);