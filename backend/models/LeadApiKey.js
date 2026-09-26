const mongoose = require("mongoose");

const leadApiKeySchema = new mongoose.Schema(
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
            default: "Website",
        },

        keyHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        keyPrefix: {
            type: String,
            required: true,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "LeadApiKey",
    leadApiKeySchema
);