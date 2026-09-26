const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    source: { type: String, trim: true, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index(
  { userId: 1, type: 1, leadId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Notification", notificationSchema);