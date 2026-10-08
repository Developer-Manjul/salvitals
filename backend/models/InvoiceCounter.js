const mongoose = require("mongoose");

const invoiceCounterSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Old K-series counter
        sequence: {
            type: Number,
            min: 0,
            default: 0,
        },

        // New prefix-based patient counters
        // Example:
        // { WF: 1, AB: 5 }
        prefixSequences: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true }
);

invoiceCounterSchema.index(
    { userId: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "InvoiceCounter",
    invoiceCounterSchema
);