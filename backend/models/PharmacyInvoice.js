
const mongoose = require("mongoose");

const pharmacyInvoiceItemSchema = new mongoose.Schema(
    {
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PharmacyMedicine",
            required: true,
        },
        medicineName: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be a whole number.",
            },
        },
        gstRate: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        taxableAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        gstAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const pharmacyInvoiceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        invoiceNumber: {
            type: String,
            required: true,
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        email: {
            type: String,
            default: "",
            trim: true,
        },
        address: {
            type: String,
            default: "",
            trim: true,
        },
        invoiceDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        items: {
            type: [pharmacyInvoiceItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "At least one medicine is required.",
            },
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        gstAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["Draft", "Paid", "Unpaid", "Cancelled"],
            default: "Unpaid",
        },
    },
    { timestamps: true }
);

pharmacyInvoiceSchema.index(
    { userId: 1, invoiceNumber: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "PharmacyInvoice",
    pharmacyInvoiceSchema
);
