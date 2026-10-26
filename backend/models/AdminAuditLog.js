const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
    {
        adminEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        targetEmail: {
            type: String,
            default: "",
            trim: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ip: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "AdminAuditLog",
    adminAuditLogSchema
);