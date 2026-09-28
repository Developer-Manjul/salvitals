const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        orderType: {
            type: String,
            enum: ["subscription", "addon"],
            default: "subscription",
            index: true,
        },

        planId: {
            type: String,
            required: true,
        },

        planName: {
            type: String,
            default: "",
        },

        addonType: {
            type: String,
            enum: ["", "contacts", "ai_chat"],
            default: "",
            index: true,
        },

        addonName: {
            type: String,
            default: "",
        },

        addonMonths: {
            type: Number,
            default: 0,
        },

        addonUnitPrice: {
            type: Number,
            default: 0,
        },

        addonQuota: {
            type: Number,
            default: 0,
        },

        addonQuotaUsed: {
            type: Number,
            default: 0,
        },

        addonStartsAt: {
            type: Date,
            default: null,
        },

        addonExpiresAt: {
            type: Date,
            default: null,
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
            index: true,
        },

        razorpayOrderId: {
            type: String,
            default: "",
            index: true,
        },

        razorpayPaymentId: {
            type: String,
            default: "",
        },

        razorpaySignature: {
            type: String,
            default: "",
        },

        invoiceEmailSentAt: {
            type: Date,
            default: null,
        },

        invoiceEmailError: {
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