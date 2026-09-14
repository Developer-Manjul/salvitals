const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            default: "",
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        source: {
            type: String,
            required: true,
            trim: true,
            default: "Manual",
        },

        service: {
            type: String,
            trim: true,
            default: "",
        },

        owner: {
            type: String,
            trim: true,
            default: "",
        },

        stage: {
            type: String,
            trim: true,
            default: "New",
        },

        preferredDoctor: {
            type: String,
            trim: true,
            default: "",
        },

        landingPage: {
            type: String,
            trim: true,
            default: "",
        },

        pageUrl: {
            type: String,
            trim: true,
            default: "",
        },

        utmSource: {
            type: String,
            trim: true,
            default: "",
        },

        utmMedium: {
            type: String,
            trim: true,
            default: "",
        },

        utmCampaign: {
            type: String,
            trim: true,
            default: "",
        },

        utmTerm: {
            type: String,
            trim: true,
            default: "",
        },

        utmContent: {
            type: String,
            trim: true,
            default: "",
        },

        ipAddress: {
            type: String,
            trim: true,
            default: "",
        },

        firstNote: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Lead", leadSchema);