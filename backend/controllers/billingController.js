const User = require("../models/User");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
const Order = require("../models/Order");
const TeamMember = require("../models/TeamMember");
const AIUsage = require("../models/AIUsage");

const {
    getContactLimit,
} = require("../utils/contactLimits");

const {
    getTeamMemberLimit,
} = require("../utils/teamLimits");

const {
    getAIChatbotLimit,
    normalizeAIPlanId,
} = require("../utils/aiLimits");

const {
    getWorkspaceContext,
    hasPermission,
} = require("../utils/workspace");

const PLANS = {
    starter: {
        id: "starter",
        name: "Starter",
        contactLimit: 500,
        aiChatbotLimit: 500,
    },
    growth: {
        id: "growth",
        name: "Growth",
        contactLimit: 1500,
        aiChatbotLimit: 1500,
    },
    scale: {
        id: "scale",
        name: "Scale",
        contactLimit: 2500,
        aiChatbotLimit: 3000,
    },
    enterprise: {
        id: "enterprise",
        name: "Enterprise",
        contactLimit: null,
        aiChatbotLimit: null,
    },
};

async function requireBillingPermission(req, res) {
    const context = await getWorkspaceContext(req);

    if (!context) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });
        return null;
    }

    if (!hasPermission(context, "billing.view")) {
        res.status(403).json({
            success: false,
            message: "You do not have permission to access billing",
        });
        return null;
    }

    return context;
}

function getDaysRemaining(expiresAt) {
    if (!expiresAt) {
        return null;
    }

    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();

    if (expiry <= now) {
        return 0;
    }

    return Math.ceil(
        (expiry - now) /
        (1000 * 60 * 60 * 24)
    );
}

function getPlanDetails(planId) {
    const normalized = String(planId || "")
        .trim()
        .toLowerCase();

    if (normalized === "custom") {
        return PLANS.enterprise;
    }

    return PLANS[normalized] || null;
}

function getPlanOrder(planId) {
    const order = [
        "starter",
        "growth",
        "scale",
        "enterprise",
    ];

    return order.indexOf(planId);
}

function getAvailablePlans(currentPlanId) {
    const currentIndex = getPlanOrder(currentPlanId);

    return Object.values(PLANS).map((plan) => {
        const planIndex = getPlanOrder(plan.id);

        return {
            id: plan.id,
            name: plan.name,
            contactLimit: getContactLimit(plan.id),
            aiChatbotLimit: getAIChatbotLimit(plan.id),
            current: plan.id === currentPlanId,
            upgrade:
                currentIndex >= 0 &&
                planIndex > currentIndex,
            available:
                plan.id === "enterprise" ||
                currentIndex < 0 ||
                planIndex > currentIndex,
        };
    });
}

function getMonthKey(date = new Date()) {
    const year = date.getUTCFullYear();

    const month = String(
        date.getUTCMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
}

function calculatePercentage(used, limit) {
    if (
        limit === null ||
        limit === undefined ||
        Number(limit) <= 0
    ) {
        return 0;
    }

    return Math.min(
        Math.round(
            (Number(used) / Number(limit)) * 100
        ),
        100
    );
}

function normalizeAddon(addon) {
    if (!addon || !addon.enabled) {
        return {
            enabled: false,
            quota: 0,
            used: 0,
            remaining: 0,
            months: 0,
            unitPrice: 0,
            startsAt: null,
            expiresAt: null,
            orderId: null,
            razorpayOrderId: "",
            paymentId: "",
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
        months: Number(
            addon.months || 0
        ),
        unitPrice: Number(
            addon.unitPrice || 0
        ),
        startsAt:
            addon.startsAt || null,
        expiresAt:
            addon.expiresAt || null,
        orderId:
            addon.orderId || null,
        razorpayOrderId:
            addon.razorpayOrderId || "",
        paymentId:
            addon.paymentId || "",
    };
}

function getAddonStatus(addon) {
    if (!addon?.enabled) {
        return "inactive";
    }

    if (
        addon.expiresAt &&
        new Date(
            addon.expiresAt
        ).getTime() <= Date.now()
    ) {
        return "expired";
    }

    return "active";
}

function buildSubscriptionFromOrder(order) {
    if (
        !order ||
        order.orderType !== "subscription" ||
        order.paymentStatus !== "paid"
    ) {
        return null;
    }

    const planId = String(
        order.planId || ""
    )
        .trim()
        .toLowerCase();

    if (!planId) {
        return null;
    }

    const normalizedPlanId =
        planId === "custom"
            ? "enterprise"
            : planId;

    const planDetails =
        getPlanDetails(normalizedPlanId);

    const startedAt = order.createdAt
        ? new Date(order.createdAt)
        : new Date();

    if (
        Number.isNaN(
            startedAt.getTime()
        )
    ) {
        return null;
    }

    const period =
        Number(order.period) || 1;

    const expiresAt =
        new Date(startedAt);

    expiresAt.setMonth(
        expiresAt.getMonth() + period
    );

    if (
        expiresAt.getTime() <= Date.now()
    ) {
        return null;
    }

    return {
        planId: normalizedPlanId,

        planName:
            order.planName ||
            planDetails?.name ||
            normalizedPlanId,

        status: "active",

        billingCycle:
            period === 1
                ? "monthly"
                : `${period}-months`,

        startedAt,

        expiresAt,

        nextBillingAt:
            expiresAt,

        amount: Number(
            order.planAmount ||
            order.amount ||
            0
        ),

        currency:
            order.currency || "INR",

        orderId:
            order._id,

        razorpayOrderId:
            order.razorpayOrderId || "",

        paymentId:
            order.razorpayPaymentId || "",

        setupFeePaid:
            Number(order.setupFee || 0) > 0,
    };
}

exports.getCurrentBilling =
    async (req, res) => {
        try {
            const context =
                await requireBillingPermission(
                    req,
                    res
                );

            if (!context) {
                return;
            }

            const ownerId =
                context.workspaceOwnerId;

            let user =
                await User.findById(ownerId)
                    .select(
                        "name email subscription addons"
                    )
                    .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            let subscription =
                user.subscription || {};

            let subscriptionExpiresAt =
                subscription.expiresAt
                    ? new Date(
                        subscription.expiresAt
                    ).getTime()
                    : null;

            let subscriptionIsActive =
                String(
                    subscription.status || ""
                ).toLowerCase() === "active" &&
                subscriptionExpiresAt &&
                subscriptionExpiresAt > Date.now();

            if (!subscriptionIsActive) {
                const latestPaidOrder =
                    await Order.findOne({
                        userId: ownerId,
                        orderType: "subscription",
                        paymentStatus: "paid",
                    })
                        .sort({
                            createdAt: -1,
                        })
                        .lean();

                const recoveredSubscription =
                    buildSubscriptionFromOrder(
                        latestPaidOrder
                    );

                if (recoveredSubscription) {
                    await User.findByIdAndUpdate(
                        ownerId,
                        {
                            $set: {
                                subscription:
                                    recoveredSubscription,
                            },
                        }
                    );

                    subscription =
                        recoveredSubscription;

                    user.subscription =
                        recoveredSubscription;

                    subscriptionExpiresAt =
                        new Date(
                            subscription.expiresAt
                        ).getTime();

                    subscriptionIsActive =
                        true;
                }
            }

            const normalizedPlanId =
                String(
                    subscription.planId || ""
                )
                    .trim()
                    .toLowerCase();

            const resolvedPlanId =
                subscriptionIsActive
                    ? (
                        normalizedPlanId === "custom"
                            ? "enterprise"
                            : normalizedPlanId
                    )
                    : "";

            const resolvedPlanDetails =
                getPlanDetails(
                    resolvedPlanId
                );

            const activePlan = {
                planId:
                    subscriptionIsActive
                        ? resolvedPlanId
                        : "",

                planName:
                    subscriptionIsActive
                        ? (
                            subscription.planName ||
                            resolvedPlanDetails?.name ||
                            ""
                        )
                        : "",

                status:
                    subscriptionIsActive
                        ? "active"
                        : "none",

                startedAt:
                    subscription.startedAt ||
                    null,

                expiresAt:
                    subscription.expiresAt ||
                    null,

                nextBillingAt:
                    subscription.nextBillingAt ||
                    null,

                planLimit:
                    subscriptionIsActive
                        ? getContactLimit(
                            resolvedPlanId
                        )
                        : 0,

                addonLimit:
                    subscriptionIsActive
                        ? Number(
                            user.addons?.contacts?.quota ||
                            0
                        )
                        : 0,
            };

            const [
                contactCount,
                leadCount,
            ] = await Promise.all([
                Contact.countDocuments({
                    userId: ownerId,
                    deletedAt: null,
                }),

              Lead.countDocuments({
  userId: ownerId,
  stage: {
    $nin: ["Junk", "Junk Lead", "junk", "junk lead"],
  },
}),
            ]);

            const contactUsed =
                contactCount + leadCount;

            const contactPlanLimit =
                activePlan.planLimit ??
                getContactLimit(
                    activePlan.planId
                );

            const contactAddonLimit =
                Number(
                    activePlan.addonLimit || 0
                );

            const contactTotalLimit =
                contactPlanLimit === null
                    ? null
                    : Number(
                        contactPlanLimit || 0
                    ) +
                    contactAddonLimit;

            const contactRemaining =
                contactTotalLimit === null
                    ? null
                    : Math.max(
                        contactTotalLimit -
                        contactUsed,
                        0
                    );

            const contactAddon =
                normalizeAddon(
                    user.addons?.contacts
                );

            const teamMemberLimit =
                activePlan.planId
                    ? getTeamMemberLimit(
                        activePlan.planId
                    )
                    : 0;

            const teamMemberUsed =
                await TeamMember.countDocuments({
                    owner: ownerId,
                    memberType: "team",
                });

            const teamMemberRemaining =
                Math.max(
                    teamMemberLimit -
                    teamMemberUsed,
                    0
                );

            const totalSeats =
                teamMemberLimit + 1;

            const usedSeats =
                teamMemberUsed + 1;

            const aiPlanId =
                normalizeAIPlanId(
                    activePlan.planId
                );

            const aiPlanLimit =
                activePlan.planId
                    ? getAIChatbotLimit(
                        aiPlanId
                    )
                    : 0;

            const aiAddon =
                normalizeAddon(
                    user.addons?.ai_chat
                );

            const aiAddonLimit =
                aiAddon.enabled
                    ? aiAddon.quota
                    : 0;

            const aiTotalLimit =
                aiPlanLimit === null
                    ? null
                    : Number(
                        aiPlanLimit || 0
                    ) +
                    aiAddonLimit;

            const monthKey =
                getMonthKey();

            const aiUsage =
                await AIUsage.findOne({
                    ownerId,
                    monthKey,
                }).lean();

            const aiUsed =
                Number(
                    aiUsage?.count || 0
                );

            const aiRemaining =
                aiTotalLimit === null
                    ? null
                    : Math.max(
                        aiTotalLimit -
                        aiUsed,
                        0
                    );

            const daysRemaining =
                getDaysRemaining(
                    activePlan.expiresAt
                );

            const planDetails =
                getPlanDetails(
                    activePlan.planId
                );

            const billingHistory =
                await Order.find({
                    userId: ownerId,
                    paymentStatus: "paid",
                })
                    .sort({
                        createdAt: -1,
                    })
                    .limit(100)
                    .lean();

            const formattedHistory =
                billingHistory.map(
                    (order) => {
                        const isAddon =
                            order.orderType ===
                            "addon";

                        const itemName =
                            isAddon
                                ? (
                                    order.addonName ||
                                    (
                                        order.addonType ===
                                        "contacts"
                                            ? "Extra Contacts"
                                            : order.addonType ===
                                                "ai_chat"
                                                ? "AI Chatbot"
                                                : "Add-on"
                                    )
                                )
                                : (
                                    order.planName ||
                                    getPlanDetails(
                                        order.planId
                                    )?.name ||
                                    order.planId ||
                                    "Plan"
                                );

                        const amount =
                            Number(
                                order.amount || 0
                            );

                        const tax =
                            Number(
                                order.tax || 0
                            );

                        return {
                            id:
                                String(
                                    order._id
                                ),

                            invoiceNumber:
                                order.invoiceNumber ||
                                "",

                            date:
                                order.createdAt ||
                                null,

                            orderType:
                                order.orderType ||
                                "subscription",

                            itemName,

                            planId:
                                order.planId ||
                                "",

                            planName:
                                order.planName ||
                                "",

                            addonType:
                                order.addonType ||
                                "",

                            addonName:
                                order.addonName ||
                                "",

                            addonMonths:
                                Number(
                                    order.addonMonths ||
                                    0
                                ),

                            addonQuota:
                                Number(
                                    order.addonQuota ||
                                    0
                                ),

                            amount,

                            tax,

                            total:
                                amount,

                            currency:
                                order.currency ||
                                "INR",

                            paymentStatus:
                                order.paymentStatus,

                            razorpayPaymentId:
                                order.razorpayPaymentId ||
                                "",

                            period:
                                Number(
                                    order.period || 0
                                ),

                            periodLabel:
                                order.periodLabel ||
                                "",

                            createdAt:
                                order.createdAt ||
                                null,
                        };
                    }
                );

            return res.json({
                success: true,

                subscription: {
                    planId:
                        activePlan.planId,

                    planName:
                        activePlan.planName,

                    status:
                        activePlan.status,

                    billingCycle:
                        subscription.billingCycle ||
                        "monthly",

                    startedAt:
                        activePlan.startedAt ||
                        null,

                    expiresAt:
                        activePlan.expiresAt ||
                        null,

                    nextBillingAt:
                        activePlan.nextBillingAt ||
                        null,

                    daysRemaining,

                    amount:
                        Number(
                            subscription.amount ||
                            0
                        ),

                    currency:
                        subscription.currency ||
                        "INR",

                    setupFeePaid:
                        Boolean(
                            subscription.setupFeePaid
                        ),

                    orderId:
                        subscription.orderId ||
                        null,

                    paymentId:
                        subscription.paymentId ||
                        "",
                },

                usage: {
                    contacts: {
                        planLimit:
                            contactPlanLimit,

                        addonLimit:
                            contactAddonLimit,

                        totalLimit:
                            contactTotalLimit,

                        used:
                            contactUsed,

                        remaining:
                            contactRemaining,

                        percentage:
                            calculatePercentage(
                                contactUsed,
                                contactTotalLimit
                            ),
                    },

                    aiChatbot: {
                        planLimit:
                            aiPlanLimit,

                        addonLimit:
                            aiAddonLimit,

                        totalLimit:
                            aiTotalLimit,

                        used:
                            aiUsed,

                        remaining:
                            aiRemaining,

                        percentage:
                            calculatePercentage(
                                aiUsed,
                                aiTotalLimit
                            ),
                    },

                    teamMembers: {
                        limit:
                            teamMemberLimit,

                        used:
                            teamMemberUsed,

                        remaining:
                            teamMemberRemaining,

                        totalSeats,

                        usedSeats,

                        availableSeats:
                            teamMemberRemaining,
                    },
                },

                addons: {
                    contacts: {
                        ...contactAddon,

                        status:
                            getAddonStatus(
                                contactAddon
                            ),
                    },

                    ai_chat: {
                        ...aiAddon,

                        status:
                            getAddonStatus(
                                aiAddon
                            ),
                    },
                },

                plan: {
                    id:
                        planDetails?.id ||
                        activePlan.planId ||
                        "",

                    name:
                        planDetails?.name ||
                        activePlan.planName ||
                        "",

                    contactLimit:
                        contactTotalLimit,

                    baseContactLimit:
                        contactPlanLimit,

                    aiChatbotLimit:
                        aiTotalLimit,

                    baseAIChatbotLimit:
                        aiPlanLimit,

                    teamMemberLimit:
                        teamMemberLimit,
                },

                plans:
                    getAvailablePlans(
                        activePlan.planId
                    ),

                billingHistory:
                    formattedHistory,
            });
        } catch (error) {
            console.error(
                "GET CURRENT BILLING ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load billing information",
            });
        }
    };

exports.getPlans =
    async (req, res) => {
        try {
            const context =
                await getWorkspaceContext(req);

            let currentPlanId = "";

            if (context) {
                if (
                    !hasPermission(
                        context,
                        "billing.view"
                    )
                ) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "You do not have permission to access billing",
                    });
                }

                const user =
                    await User.findById(
                        context.workspaceOwnerId
                    )
                        .select(
                            "subscription"
                        )
                        .lean();

                currentPlanId =
                    user?.subscription?.planId ||
                    "";
            }

            const normalizedCurrentPlan =
                String(
                    currentPlanId || ""
                )
                    .trim()
                    .toLowerCase() === "custom"
                    ? "enterprise"
                    : String(
                        currentPlanId || ""
                    )
                        .trim()
                        .toLowerCase();

            const plans =
                Object.values(
                    PLANS
                ).map(
                    (plan) => ({
                        id:
                            plan.id,

                        name:
                            plan.name,

                        contactLimit:
                            getContactLimit(
                                plan.id
                            ),

                        aiChatbotLimit:
                            getAIChatbotLimit(
                                plan.id
                            ),

                        current:
                            plan.id ===
                            normalizedCurrentPlan,

                        upgrade:
                            getPlanOrder(
                                plan.id
                            ) >
                            getPlanOrder(
                                normalizedCurrentPlan
                            ),

                        available:
                            plan.id ===
                                "enterprise" ||
                            !normalizedCurrentPlan ||
                            getPlanOrder(
                                plan.id
                            ) >
                            getPlanOrder(
                                normalizedCurrentPlan
                            ),
                    })
                );

            return res.json({
                success: true,
                currentPlanId:
                    normalizedCurrentPlan,
                plans,
            });
        } catch (error) {
            console.error(
                "GET BILLING PLANS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load plans",
            });
        }
    };