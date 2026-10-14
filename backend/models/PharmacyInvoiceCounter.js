
const mongoose = require("mongoose");

const pharmacyInvoiceCounterSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        sequence: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

pharmacyInvoiceCounterSchema.index(
    { userId: 1, year: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "PharmacyInvoiceCounter",
    pharmacyInvoiceCounterSchema
);
