const mongoose = require("mongoose");

const googleAccountSchema =
    new mongoose.Schema(
        {
            customerId: {
                type: String,
                required: true,
                trim: true,
            },

            customerName: {
                type: String,
                default: "",
                trim: true,
            },

            currencyCode: {
                type: String,
                default: "",
                trim: true,
            },

            timeZone: {
                type: String,
                default: "",
                trim: true,
            },

            status: {
                type: String,
                default: "",
                trim: true,
            },
        },
        {
            _id: false,
        }
    );

const googleIntegrationSchema =
    new mongoose.Schema(
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
                index: true,
            },

            googleUserId: {
                type: String,
                default: "",
            },

            googleEmail: {
                type: String,
                default: "",
                trim: true,
            },

            customerId: {
                type: String,
                required: true,
                trim: true,
                default: "PENDING",
            },

            customerName: {
                type: String,
                default: "",
                trim: true,
            },

            loginCustomerId: {
                type: String,
                default: "",
                trim: true,
            },

            availableAccounts: {
                type: [googleAccountSchema],
                default: [],
            },

            accessTokenEncrypted: {
                type: String,
                default: "",
            },

            refreshTokenEncrypted: {
                type: String,
                default: "",
            },

            tokenExpiresAt: {
                type: Date,
                default: null,
            },

            isActive: {
                type: Boolean,
                default: true,
            },

            connectedAt: {
                type: Date,
                default: Date.now,
            },

            webhookSecret: {
                type: String,
                default: "",
            },
        },
        {
            timestamps: true,
        }
    );

googleIntegrationSchema.index({
    userId: 1,
});

googleIntegrationSchema.index({
    customerId: 1,
    isActive: 1,
});

module.exports =
    mongoose.model(
        "GoogleIntegration",
        googleIntegrationSchema
    );