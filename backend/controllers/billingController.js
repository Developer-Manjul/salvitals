const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Contact = require("../models/Contact");
const Order = require("../models/Order");
const TeamMember = require("../models/TeamMember");
const AIUsage = require("../models/AIUsage");

const {
    getActivePlan,
    getContactLimit,
} = require("../utils/contactLimits");

const {
    getTeamMemberLimit,
} = require("../utils/teamLimits");

const {
    getAIChatbotLimit,
    normalizeAIPlanId,
} = require("../utils/aiLimits");

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

function getUserId(req) {
    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    try {
        const token =
            authorization.slice(7);

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        return (
            decoded.id ||
            decoded._id ||
            decoded.userId ||
            null
        );
    } catch (error) {
        return null;
    }
}

function getDaysRemaining(expiresAt) {
    if (!expiresAt) {
        return null;
    }

    const expiry =
        new Date(expiresAt).getTime();

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
    const normalized =
        String(planId || "")
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
    const currentIndex =
        getPlanOrder(currentPlanId);

    return Object.values(PLANS).map(
        (plan) => {
            const planIndex =
                getPlanOrder(plan.id);

            return {
                id: plan.id,

                name: plan.name,

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
                    currentPlanId,

                upgrade:
                    currentIndex >= 0 &&
                    planIndex > currentIndex,

                available:
                    plan.id === "enterprise" ||
                    currentIndex < 0 ||
                    planIndex > currentIndex,
            };
        }
    );
}

function getMonthKey(date = new Date()) {
    const year =
        date.getUTCFullYear();

    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0");

    return `${year}-${month}`;
}

function calculatePercentage(
    used,
    limit
) {
    if (
        limit === null ||
        limit === undefined ||
        Number(limit) <= 0
    ) {
        return 0;
    }

    return Math.min(
        Math.round(
            (Number(used) /
                Number(limit)) *
                100
        ),
        100
    );
}

function normalizeAddon(
    addon
) {
    if (
        !addon ||
        !addon.enabled
    ) {
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

    const quota =
        Math.max(
            Number(addon.quota || 0),
            0
        );

    const used =
        Math.min(
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

        remaining:
            Math.max(
                quota - used,
                0
            ),

        months:
            Number(
                addon.months || 0
            ),

        unitPrice:
            Number(
                addon.unitPrice || 0
            ),

        startsAt:
            addon.startsAt || null,

        expiresAt:
            addon.expiresAt || null,

        orderId:
            addon.orderId || null,

        razorpayOrderId:
            addon.razorpayOrderId ||
            "",

        paymentId:
            addon.paymentId ||
            "",
    };
}

function getAddonStatus(
    addon
) {
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

exports.getCurrentBilling =
    async (req, res) => {
        try {
            const userId =
                getUserId(req);

            if (!userId) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Authentication required",
                    });
            }

            const user =
                await User.findById(
                    userId
                )
                    .select(
                        "name email subscription addons"
                    )
                    .lean();

            if (!user) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "User not found",
                    });
            }

            const activePlan =
                await getActivePlan(
                    userId
                );

            const contactUsed =
                await Contact.countDocuments({
                    userId,
                    deletedAt: null,
                });

            const contactPlanLimit =
                activePlan.planLimit ??
                getContactLimit(
                    activePlan.planId
                );

            const contactAddonLimit =
                Number(
                    activePlan.addonLimit ||
                        0
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
                    owner: userId,
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
                    ownerId: userId,
                    monthKey,
                })
                    .lean();

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

            const subscription =
                user.subscription ||
                {};

            const billingHistory =
                await Order.find({
                    userId,
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
                                order.amount ||
                                    0
                            );

                        const tax =
                            Number(
                                order.tax ||
                                    0
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
                                    order.period ||
                                        0
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

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Unable to load billing information",
                });
        }
    };

exports.getPlans =
    async (req, res) => {
        try {
            const userId =
                getUserId(req);

            let currentPlanId =
                "";

            if (userId) {
                const user =
                    await User.findById(
                        userId
                    )
                        .select(
                            "subscription"
                        )
                        .lean();

                currentPlanId =
                    user?.subscription
                        ?.planId ||
                    "";
            }

            const normalizedCurrentPlan =
                String(
                    currentPlanId || ""
                )
                    .trim()
                    .toLowerCase() ===
                "custom"
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

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Unable to load plans",
                });
        }
    };