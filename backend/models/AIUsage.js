const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    monthKey: { type: String, required: true },
    count: { type: Number, default: 0, min: 0 },
    limit: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

aiUsageSchema.index({ ownerId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model("AIUsage", aiUsageSchema);
