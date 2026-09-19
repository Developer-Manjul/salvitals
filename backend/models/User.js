const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        clinicName: {
            type: String,
            trim: true,
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            default: "",
        },

        phoneCountryCode: {
            type: String,
            trim: true,
            default: "",
        },

        emailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationToken: {
            type: String,
            default: "",
        },

        emailVerificationExpires: {
            type: Date,
            default: null,
        },

        speciality: {
            type: String,
            trim: true,
            default: "",
        },

        numberOfDoctors: {
            type: String,
            trim: true,
            default: "",
        },

        displayName: {
            type: String,
            trim: true,
            default: "",
        },

        address: {
            type: String,
            trim: true,
            default: "",
        },

        gstin: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
        },

        zipCode: {
            type: String,
            trim: true,
            default: "",
        },

        website: {
            type: String,
            trim: true,
            default: "",
        },

        clinicLogo: {
            type: String,
            trim: true,
            default: "",
        },

        // =========================================
        // BANK DETAILS
        // =========================================

        bankName: {
            type: String,
            trim: true,
            default: "",
        },

        accountHolderName: {
            type: String,
            trim: true,
            default: "",
        },

        accountNumber: {
            type: String,
            trim: true,
            default: "",
        },

        ifscCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
        },

        upiId: {
            type: String,
            trim: true,
            default: "",
        },

        // =========================================
        // ACCOUNT SETUP
        // =========================================

        accountSetupCompleted: {
            type: Boolean,
            default: false,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        contactQuotaVersion: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);