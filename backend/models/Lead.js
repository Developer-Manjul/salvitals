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

        metaLeadId: {
            type: String,
            default: "",
        },

        metaPageId: {
            type: String,
            default: "",
        },

        metaFormId: {
            type: String,
            default: "",
        },

        metaAdId: {
            type: String,
            default: "",
        },

        metaCampaignId: {
            type: String,
            default: "",
        },

        notes: {
            type: [{
                text: {
                    type: String,
                    trim: true,
                },
                userName: {
                    type: String,
                    trim: true,
                    default: "",
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            }],
            default: [],
        },

        followUps: {
            type: [{
                date: {
                    type: Date,
                    required: true,
                },

                note: {
                    type: String,
                    trim: true,
                    default: "",
                },

                purpose: {
                    type: String,
                    trim: true,
                    default: "",
                },

                channel: {
                    type: String,
                    trim: true,
                    default: "Call",
                },

                assignedTo: {
                    type: String,
                    trim: true,
                    default: "",
                },

                priority: {
                    type: String,
                    trim: true,
                    enum: ["Low", "Medium", "High"],
                    default: "Medium",
                },

                reminder: {
                    type: Boolean,
                    default: true,
                },

                repeatWeekly: {
                    type: Boolean,
                    default: false,
                },

                status: {
                    type: String,
                    trim: true,
                    default: "Scheduled",
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            }],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

leadSchema.index(
    { userId: 1, metaLeadId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            metaLeadId: {
                $type: "string",
                $ne: "",
            },
        },
    }
);

module.exports = mongoose.model(
    "Lead",
    leadSchema
);