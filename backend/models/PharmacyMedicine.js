
const mongoose = require("mongoose");

const pharmacyMedicineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Medicine Name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Batch Number
    batchNo: {
      type: String,
      required: true,
      trim: true,
    },

    // Pack MRP
    packPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Individual units currently in stock
    unitInStock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Units in stock must be a whole number.",
      },
    },

    // Expiry Date
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

pharmacyMedicineSchema.index({
  userId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "PharmacyMedicine",
  pharmacyMedicineSchema
);
