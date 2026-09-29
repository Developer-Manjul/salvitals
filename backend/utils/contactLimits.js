const User = require("../models/User");

const PLAN_LIMITS = Object.freeze({
    starter: 1000,
    growth: 2500,
    scale: 4500,
});

function normalizePlanId(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    if (normalized === "custom") {
        return "enterprise";
    }

    return normalized;
}

function getContactLimit(planId) {
    const normalized = normalizePlanId(planId);

    if (normalized === "enterprise") {
        const configured = Number(
            process.env.ENTERPRISE_CONTACT_LIMIT || 0
        );

        return configured > 0 ? configured : null;
    }

    return (
        PLAN_LIMITS[normalized] ||
        PLAN_LIMITS.starter
    );
}

function getActiveAddon(addon) {
    if (!addon?.enabled) {
        return {
            enabled: false,
            quota: 0,
            used: 0,
            remaining: 0,
            months: 0,
            startsAt: null,
            expiresAt: null,
            orderId: null,
        };
    }

    if (
        addon.expiresAt &&
        new Date(addon.expiresAt).getTime() <= Date.now()
    ) {
        return {
            enabled: false,
            quota: 0,
            used: 0,
            remaining: 0,
            months: 0,
            startsAt: addon.startsAt || null,
            expiresAt: addon.expiresAt || null,
            orderId: addon.orderId || null,
        };
    }

    const quota = Math.max(
        Number(addon.quota || 0),
        0
    );

    const used = Math.min(
        Math.max(Number(addon.used || 0), 0),
        quota
    );

    return {
        enabled: true,
        quota,
        used,
        remaining: Math.max(quota - used, 0),
        months: Number(addon.months || 0),
        unitPrice: Number(addon.unitPrice || 0),
        startsAt: addon.startsAt || null,
        expiresAt: addon.expiresAt || null,
        orderId: addon.orderId || null,
        razorpayOrderId:
            addon.razorpayOrderId || "",
        paymentId:
            addon.paymentId || "",
    };
}

async function getActivePlan(userId) {
    const user = await User.findById(userId)
        .select("subscription addons")
        .lean();

    if (!user || !user.subscription) {
        return {
            planId: null,
            planName: "No active plan",
            limit: 0,
            planLimit: 0,
            addonLimit: 0,
            totalLimit: 0,
            addonUsed: 0,
            addonRemaining: 0,
            addon: null,
            status: "none",
        };
    }

    const subscription = user.subscription;

    const planId = normalizePlanId(
        subscription.planId
    );

    if (
        !planId ||
        subscription.status !== "active"
    ) {
        return {
            planId: null,
            planName: "No active plan",
            limit: 0,
            planLimit: 0,
            addonLimit: 0,
            totalLimit: 0,
            addonUsed: 0,
            addonRemaining: 0,
            addon: null,
            status:
                subscription.status || "none",
        };
    }

    if (
        subscription.expiresAt &&
        new Date(
            subscription.expiresAt
        ).getTime() <= Date.now()
    ) {
        return {
            planId,
            planName:
                subscription.planName || "Expired",
            limit: getContactLimit(planId),
            planLimit: getContactLimit(planId),
            addonLimit: 0,
            totalLimit: getContactLimit(planId),
            addonUsed: 0,
            addonRemaining: 0,
            addon: null,
            status: "expired",
            startedAt:
                subscription.startedAt || null,
            expiresAt:
                subscription.expiresAt || null,
            nextBillingAt:
                subscription.nextBillingAt || null,
        };
    }

    const planLimit = getContactLimit(planId);

    const contactAddon = getActiveAddon(
        user.addons?.contacts
    );

    const addonLimit = contactAddon.enabled
        ? contactAddon.quota
        : 0;

    const totalLimit =
        planLimit === null
            ? null
            : planLimit + addonLimit;

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

    return {
        planId,
        planName,
        limit: totalLimit,
        planLimit,
        addonLimit,
        totalLimit,
        addonUsed: contactAddon.used,
        addonRemaining:
            contactAddon.remaining,
        addon: contactAddon,
        status: "active",
        startedAt:
            subscription.startedAt || null,
        expiresAt:
            subscription.expiresAt || null,
        nextBillingAt:
            subscription.nextBillingAt || null,
    };
}

module.exports = {
    getActivePlan,
    getContactLimit,
    normalizePlanId,
    getActiveAddon,
};