const mongoose = require("mongoose");

const aiKnowledgeSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["website", "faq", "service", "custom"],
      required: true,
      index: true,
    },
    title: { type: String, trim: true, default: "" },
    content: { type: String, trim: true, required: true },
    sourceUrl: { type: String, trim: true, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

aiKnowledgeSchema.index({ ownerId: 1, assistantId: 1, type: 1 });

module.exports = mongoose.model("AIKnowledge", aiKnowledgeSchema);
