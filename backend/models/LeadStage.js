const mongoose = require("mongoose");

const leadStageSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        icon: {
            type: String,
            trim: true,
            default: "fa-solid fa-circle",
        },

        color: {
            type: String,
            trim: true,
            default: "blue",
        },

        colorHex: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },

        isSystem: {
            type: Boolean,
            default: false,
            index: true,
        },

        locked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

leadStageSchema.index(
    { slug: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isSystem: true,
        },
    }
);

leadStageSchema.index(
    { owner: 1, slug: 1 },
    {
        unique: true,
        partialFilterExpression: {
            owner: {
                $type: "objectId",
            },
        },
    }
);

module.exports = mongoose.model(
    "LeadStage",
    leadStageSchema
);