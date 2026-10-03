const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
            default: "",
        },

        serviceName: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },

        cost: {
            type: Number,
            default: 0,
        },

        gst: {
            type: Number,
            default: 0,
        },

        baseAmount: {
            type: Number,
            default: 0,
        },

        gstAmount: {
            type: Number,
            default: 0,
        },

        total: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: true,
    }
);

const billedBySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: "",
        },

        businessName: {
            type: String,
            default: "",
        },

        displayName: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        email: {
            type: String,
            default: "",
        },

        address: {
            type: String,
            default: "",
        },

        gstin: {
            type: String,
            default: "",
        },

        pan: {
            type: String,
            default: "",
        },

        website: {
            type: String,
            default: "",
        },

        logo: {
            type: String,
            default: "",
        },
    },
    {
        _id: false,
    }
);

const invoiceSchema = new mongoose.Schema(
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
            trim: true,
        },

        invoiceDate: {
            type: Date,
            default: Date.now,
        },

        customerId: {
            type: String,
            default: "",
        },

        patientId: {
            type: String,
            default: "",
            trim: true,
        },

        customerName: {
            type: String,
            required: true,
            trim: true,
        },

        customerEmail: {
            type: String,
            default: "",
            trim: true,
        },

        customerPhone: {
            type: String,
            default: "",
            trim: true,
        },

        customerAddress: {
            type: String,
            default: "",
        },

        paymentMode: {
            type: String,
            enum: [
                "",
                "Credit Card",
                "Debit Card",
                "Cash",
                "UPI",
                "Bank Transfer",
            ],
            default: "",
            trim: true,
        },

        billedBy: {
            type: billedBySchema,
            default: {},
        },

        items: {
            type: [invoiceItemSchema],
            default: [],
        },

        subtotal: {
            type: Number,
            default: 0,
        },

        gstAmount: {
            type: Number,
            default: 0,
        },

        total: {
            type: Number,
            default: 0,
        },

        notes: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "Draft",
                "Sent",
                "Paid",
                "Cancelled",
            ],
            default: "Draft",
        },

        whatsappSentAt: {
            type: Date,
            default: null,
        },

        whatsappMessageId: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

invoiceSchema.index({
    userId: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "Invoice",
    invoiceSchema
);