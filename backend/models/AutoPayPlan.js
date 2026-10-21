
const mongoose = require("mongoose");

const autoPayPlanSchema = new mongoose.Schema(
    {
        planKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        planId: {
            type: String,
            required: true,
            unique: true,
        },
        planName: {
            type: String,
            required: true,
        },
        currency: {
            type: String,
            enum: ["INR", "USD"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        periodMonths: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "AutoPayPlan",
    autoPayPlanSchema
);
