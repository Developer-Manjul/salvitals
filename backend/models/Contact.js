const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "Manual" },
    service: { type: String, trim: true, default: "" },
    doctor: { type: String, trim: true, default: "" },
    owner: { type: String, trim: true, default: "" },
    gender: { type: String, trim: true, default: "" },
    age: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    lastVisit: { type: Date, default: null },
    leadCreatedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index(
  { userId: 1, leadId: 1 },
  { unique: true, partialFilterExpression: { leadId: { $type: "objectId" } } }
);

module.exports = mongoose.model("Contact", contactSchema);