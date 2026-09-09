const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        planId: {
            type: String,
            required: true,
        },

        planName: {
            type: String,
            default: "",
        },

        amount: {
            type: Number,
            default: 0,
        },

        planAmount: {
            type: Number,
            default: 0,
        },

        setupFee: {
            type: Number,
            default: 0,
        },

        tax: {
            type: Number,
            default: 0,
        },

        currency: {
            type: String,
            default: "INR",
        },

        period: {
            type: Number,
            default: 1,
        },

        periodLabel: {
            type: String,
            default: "",
        },

        invoiceNumber: {
            type: String,
            default: "",
            index: true,
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
            ],
            default: "pending",
        },

        razorpayOrderId: {
            type: String,
            default: "",
        },

        razorpayPaymentId: {
            type: String,
            default: "",
        },

        razorpaySignature: {
            type: String,
            default: "",
        },

        country: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Order",
    orderSchema
);