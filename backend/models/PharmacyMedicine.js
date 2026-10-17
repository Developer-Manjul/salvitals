
const mongoose = require("mongoose");

const pharmacyMedicineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    batchNo: {
      type: String,
      required: true,
      trim: true,
    },
    packPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    gst: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    packSize: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Pack size must be a whole number.",
      },
    },
    unitInStock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number of packs.",
      },
    },

    looseUnits: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Loose units must be a whole number.",
    },
  },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

pharmacyMedicineSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model(
  "PharmacyMedicine",
  pharmacyMedicineSchema
);
