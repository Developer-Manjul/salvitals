const LeadSource = require("../models/LeadSource");
const LeadStage = require("../models/LeadStage");

const DEFAULT_SOURCES = [
    {
        name: "Meta Ads (Facebook / Instagram)",
        slug: "meta",
        icon: "fa-brands fa-meta",
        color: "purple",
        status: "active",
        locked: false,
    },
    {
        name: "WhatsApp",
        slug: "whatsapp",
        icon: "fa-brands fa-whatsapp",
        color: "green",
        status: "active",
        locked: false,
    },
    {
        name: "Website Form",
        slug: "website",
        icon: "fa-solid fa-globe",
        color: "blue",
        status: "active",
        locked: false,
    },
    {
        name: "Walk in",
        slug: "walk-in",
        icon: "fa-solid fa-person-walking",
        color: "blue",
        status: "active",
        locked: false,
    },
    {
        name: "Google Ads",
        slug: "google-ads",
        icon: "fa-brands fa-google",
        color: "orange",
        status: "coming_soon",
        locked: true,
    },
    {
        name: "GMB",
        slug: "gmb",
        icon: "fa-brands fa-google",
        color: "blue",
        status: "active",
        locked: false,
    },
    {
        name: "Inbound Call",
        slug: "inbound-call",
        icon: "fa-solid fa-phone",
        color: "blue",
        status: "active",
        locked: false,
    },
    {
        name: "AI Chat",
        slug: "ai-chat",
        icon: "fa-solid fa-robot",
        color: "blue",
        status: "active",
        locked: false,
    },
    {
        name: "Patient Referrals",
        slug: "patient-referrals",
        icon: "fa-solid fa-user-group",
        color: "blue",
        status: "active",
        locked: false,
    },
    {
        name: "Doctor Referrals",
        slug: "doctor-referrals",
        icon: "fa-solid fa-user-doctor",
        color: "blue",
        status: "active",
        locked: false,
    },
];

const DEFAULT_STAGES = [
    {
        name: "New",
        slug: "new",
        icon: "fa-solid fa-circle-plus",
        color: "blue",
    },
    {
        name: "Active",
        slug: "active",
        icon: "fa-solid fa-bolt",
        color: "orange",
    },
    {
        name: "Contacted",
        slug: "contacted",
        icon: "fa-solid fa-phone-volume",
        color: "purple",
    },
    {
        name: "Converted",
        slug: "converted",
        icon: "fa-solid fa-user-check",
        color: "green",
    },
    {
        name: "Lost",
        slug: "lost",
        icon: "fa-solid fa-circle-xmark",
        color: "red",
    },
    {
        name: "Relevant",
        slug: "relevant",
        icon: "fa-solid fa-circle-check",
        color: "green",
    },
    {
        name: "Junk Lead",
        slug: "junk-lead",
        icon: "fa-solid fa-trash",
        color: "red",
    },
    {
        name: "Follow-Up",
        slug: "follow-up",
        icon: "fa-solid fa-clock",
        color: "purple",
    },
    {
        name: "Call Not Answered",
        slug: "call-not-answered",
        icon: "fa-solid fa-phone-slash",
        color: "red",
    },
    
    {
        name: "Distance Issues",
        slug: "distance-issues",
        icon: "fa-solid fa-location-dot",
        color: "gray",
    },
];

const seedLeadSettings = async () => {
    for (const source of DEFAULT_SOURCES) {
        await LeadSource.findOneAndUpdate(
            {
                slug: source.slug,
                isSystem: true,
            },
            {
                $set: {
                    name: source.name,
                    icon: source.icon,
                    color: source.color,
                    status: source.status,
                    locked: source.locked,
                    isSystem: true,
                    owner: null,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );
    }

    for (const stage of DEFAULT_STAGES) {
        await LeadStage.findOneAndUpdate(
            {
                slug: stage.slug,
                isSystem: true,
            },
            {
                $set: {
                    name: stage.name,
                    icon: stage.icon,
                    color: stage.color,
                    status: "active",
                    isSystem: true,
                    locked: false,
                    owner: null,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );
    }

    console.log(
        "Lead sources and stages seeded successfully"
    );
};

module.exports = seedLeadSettings;