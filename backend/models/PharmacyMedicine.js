const mongoose = require("mongoose");

const pharmacyMedicineSchema = new mongoose.Schema(
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

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be a whole number.",
            },
        },

        expiryDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

pharmacyMedicineSchema.index({
    userId: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "PharmacyMedicine",
    pharmacyMedicineSchema
);