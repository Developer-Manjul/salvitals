const mongoose = require("mongoose");

const invoiceCounterSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sequence: {
            type: Number,
            min: 0,
        },
    },
    { timestamps: true }
);

invoiceCounterSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("InvoiceCounter", invoiceCounterSchema);
