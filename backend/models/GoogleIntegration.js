const mongoose = require("mongoose");

const googleIntegrationSchema = new mongoose.Schema(
    {
        /* =========================================
           SALEVITALS USER
        ========================================== */

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        /* =========================================
           GOOGLE ACCOUNT
        ========================================== */

        googleUserId: {
            type: String,
            default: "",
        },

        googleEmail: {
            type: String,
            default: "",
            trim: true,
        },

        /* =========================================
           GOOGLE ADS CUSTOMER
        ========================================== */

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

        /*
         * If the Google Ads account is accessed
         * through a Manager Account (MCC).
         */
        loginCustomerId: {
            type: String,
            default: "",
            trim: true,
        },

        /* =========================================
           OAUTH TOKENS
        ========================================== */

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

        /* =========================================
           CONNECTION STATUS
        ========================================== */

        isActive: {
            type: Boolean,
            default: true,
        },

        connectedAt: {
            type: Date,
            default: Date.now,
        },

        /* =========================================
           WEBHOOK
        ========================================== */

        webhookSecret: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

/* =========================================
   ONE GOOGLE ADS ACCOUNT PER SALEVITALS USER
========================================= */

googleIntegrationSchema.index(
    {
        userId: 1,
        customerId: 1,
    },
    {
        unique: true,
    }
);

/* =========================================
   FIND ACTIVE INTEGRATION BY CUSTOMER
========================================= */

googleIntegrationSchema.index({
    customerId: 1,
    isActive: 1,
});

module.exports = mongoose.model(
    "GoogleIntegration",
    googleIntegrationSchema
);