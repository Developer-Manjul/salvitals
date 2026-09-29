const User = require("../models/User");

const AI_CHATBOT_LIMITS = Object.freeze({
    starter: 5000,
    growth: 15000,
    scale: 40000,
});

function normalizeAIPlanId(value) {
    const normalized =
        String(value || "")
            .trim()
            .toLowerCase();

    if (normalized === "custom") {
        return "enterprise";
    }

    return normalized;
}

function getAIChatbotLimit(planId) {
    return (
        AI_CHATBOT_LIMITS[
            normalizeAIPlanId(planId)
        ] || 0
    );
}

function getActiveAIAddon(addon) {
    if (!addon?.enabled) {
        return {
            enabled: false,
            quota: 0,
            used: 0,
            remaining: 0,
            months: 0,
            startsAt: null,
            expiresAt: null,
        };
    }

    if (
        addon.expiresAt &&
        new Date(
            addon.expiresAt
        ).getTime() <= Date.now()
    ) {
        return {
            enabled: false,
            quota: 0,
            used: 0,
            remaining: 0,
            months: 0,
            startsAt:
                addon.startsAt || null,
            expiresAt:
                addon.expiresAt || null,
        };
    }

    const quota = Math.max(
        Number(addon.quota || 0),
        0
    );

    const used = Math.min(
        Math.max(
            Number(addon.used || 0),
            0
        ),
        quota
    );

    return {
        enabled: true,
        quota,
        used,
        remaining: Math.max(
            quota - used,
            0
        ),
        months:
            Number(addon.months || 0),
        startsAt:
            addon.startsAt || null,
        expiresAt:
            addon.expiresAt || null,
    };
}

async function getAIPlan(userId) {
    const user =
        await User.findById(
            userId
        )
            .select(
                "subscription addons"
            )
            .lean();

    if (
        !user ||
        !user.subscription
    ) {
        return {
            planId: null,
            planName: "No active plan",
            planLimit: 0,
            addonLimit: 0,
            totalLimit: 0,
            used: 0,
            remaining: 0,
            addonUsed: 0,
            addonRemaining: 0,
            addon: null,
            status: "none",
        };
    }

    const subscription =
        user.subscription;

    if (
        subscription.status !==
        "active"
    ) {
        return {
            planId: null,
            planName: "No active plan",
            planLimit: 0,
            addonLimit: 0,
            totalLimit: 0,
            used: 0,
            remaining: 0,
            addonUsed: 0,
            addonRemaining: 0,
            addon: null,
            status:
                subscription.status ||
                "none",
        };
    }

    if (
        subscription.expiresAt &&
        new Date(
            subscription.expiresAt
        ).getTime() <= Date.now()
    ) {
        const planId =
            normalizeAIPlanId(
                subscription.planId
            );

        const planLimit =
            getAIChatbotLimit(
                planId
            );

        return {
            planId,
            planName:
                subscription.planName ||
                "Expired",
            planLimit,
            addonLimit: 0,
            totalLimit: planLimit,
            used: 0,
            remaining: 0,
            addonUsed: 0,
            addonRemaining: 0,
            addon: null,
            status: "expired",
        };
    }

    const planId =
        normalizeAIPlanId(
            subscription.planId
        );

    const planLimit =
        getAIChatbotLimit(
            planId
        );

    const planName =
        planId === "enterprise"
            ? "Enterprise"
            : (
                subscription.planName ||
                planId
                    .charAt(0)
                    .toUpperCase() +
                planId.slice(1)
            );

    const addon =
        getActiveAIAddon(
            user.addons?.ai_chat
        );

    const addonLimit =
        addon.enabled
            ? addon.quota
            : 0;

    const totalLimit =
        planLimit + addonLimit;

    return {
        planId,
        planName,
        planLimit,
        addonLimit,
        totalLimit,
        used: addon.used,
        remaining:
            Math.max(
                totalLimit -
                    addon.used,
                0
            ),
        addonUsed:
            addon.used,
        addonRemaining:
            addon.remaining,
        addon,
        status: "active",
        startedAt:
            subscription.startedAt ||
            null,
        expiresAt:
            subscription.expiresAt ||
            null,
    };
}

function getMonthKey(
    date = new Date()
) {
    const year =
        date.getUTCFullYear();

    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0");

    return `${year}-${month}`;
}

module.exports = {
    AI_CHATBOT_LIMITS,
    getAIChatbotLimit,
    getAIPlan,
    getMonthKey,
    normalizeAIPlanId,
    getActiveAIAddon,
};