const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
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
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["visitor", "ai", "human", "system"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("AIMessage", aiMessageSchema);
