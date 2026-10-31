const User = require("../models/User");
const Contact = require("../models/Contact");
const Lead = require("../models/Lead");
const Order = require("../models/Order");
const TeamMember = require("../models/TeamMember");
const AIUsage = require("../models/AIUsage");
const PharmacyInvoice = require("../models/PharmacyInvoice");

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
    const now = Date.now();

    const expiresAt = addon?.expiresAt
        ? new Date(addon.expiresAt).getTime()
        : null;

    const isActive =
        Boolean(addon?.enabled) &&
        expiresAt !== null &&
        !Number.isNaN(expiresAt) &&
        expiresAt > now;

    if (!isActive) {
        return {
            enabled: false,
            quota: 0,
            used: 0,
            remaining: 0,
            months: Number(addon?.months || 0),
            unitPrice: Number(addon?.unitPrice || 0),
            startsAt: addon?.startsAt || null,
            expiresAt: addon?.expiresAt || null,
            orderId: addon?.orderId || null,
            razorpayOrderId: addon?.razorpayOrderId || "",
            paymentId: addon?.paymentId || "",
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
        razorpayOrderId: addon.razorpayOrderId || "",
        paymentId: addon.paymentId || "",
    };
}



function getAddonStatus(addon, isPlanActive = true) {
    if (!isPlanActive || !addon?.enabled) {
        return "inactive";
    }

    const expiresAt = addon.expiresAt
        ? new Date(addon.expiresAt).getTime()
        : NaN;

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        return "expired";
    }

    const startsAt = addon.startsAt
        ? new Date(addon.startsAt).getTime()
        : NaN;

    if (!Number.isFinite(startsAt) || startsAt > Date.now()) {
        return "inactive";
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

    const expiresAt = new Date(startedAt);

    expiresAt.setDate(
        expiresAt.getDate() + (period * 30)
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



exports.getCurrentBilling = async (req, res) => {
    try {
        const context = await requireBillingPermission(req, res);

        if (!context) {
            return;
        }

        const ownerId = context.workspaceOwnerId;

        const pharmacyInvoiceUsed = await PharmacyInvoice.countDocuments({
            userId: ownerId,
        });

        let user = await User.findById(ownerId)
            .select("name email subscription addons")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        let subscription = user.subscription || {};

        let subscriptionExpiresAt = subscription.expiresAt
            ? new Date(subscription.expiresAt).getTime()
            : null;

        let subscriptionIsActive =
            String(subscription.status || "").toLowerCase() === "active" &&
            subscriptionExpiresAt &&
            subscriptionExpiresAt > Date.now();

        // Recover subscription from the latest paid order if necessary.
        if (!subscriptionIsActive) {
            const latestPaidOrder = await Order.findOne({
                userId: ownerId,
                paymentStatus: "paid",
                $or: [
                    { orderType: "subscription" },
                    { orderType: { $exists: false } },
                    { orderType: null },
                    { orderType: "" },
                ],
            })
                .sort({ createdAt: -1 })
                .lean();

            const recoveredSubscription =
                buildSubscriptionFromOrder(latestPaidOrder);

            if (recoveredSubscription) {
                await User.findByIdAndUpdate(ownerId, {
                    $set: {
                        subscription: recoveredSubscription,
                    },
                });

                subscription = recoveredSubscription;
                user.subscription = recoveredSubscription;

                subscriptionExpiresAt = subscription.expiresAt
                    ? new Date(subscription.expiresAt).getTime()
                    : null;

                subscriptionIsActive =
                    String(subscription.status || "").toLowerCase() === "active" &&
                    Number.isFinite(subscriptionExpiresAt) &&
                    subscriptionExpiresAt > Date.now();
            }
        }

        // Recover the actual billing period from the original paid order.
        let billingPeriod = Number(
            subscription.period ||
            subscription.periodMonths ||
            0
        );

        let originalOrder = null;

        if (subscription.orderId) {
            originalOrder = await Order.findOne({
                _id: subscription.orderId,
                userId: ownerId,
                paymentStatus: "paid",
            })
                .select(
                    "_id period periodLabel orderType planId planName billingPeriodEnd"
                )
                .lean();
        }

        // Fallback for older subscriptions whose orderId is missing.
        if (!originalOrder) {
            const normalizedPlan = String(subscription.planId || "")
                .trim()
                .toLowerCase();

            originalOrder = await Order.findOne({
                userId: ownerId,
                paymentStatus: "paid",
                planId: normalizedPlan,
                $or: [
                    { orderType: "subscription" },
                    { orderType: { $exists: false } },
                    { orderType: null },
                    { orderType: "" },
                ],
            })
                .sort({ createdAt: -1 })
                .select(
                    "_id period periodLabel orderType planId planName billingPeriodEnd"
                )
                .lean();
        }

        if (originalOrder) {
            const orderPeriod = Number(originalOrder.period || 0);

            if ([1, 3, 6, 9, 12].includes(orderPeriod)) {
                billingPeriod = orderPeriod;
            } else {
                const label = String(
                    originalOrder.periodLabel || ""
                ).trim().toLowerCase();

                const labelMap = {
                    monthly: 1,
                    "1 month": 1,
                    quarterly: 3,
                    "3 months": 3,
                    "3 month": 3,
                    "half-yearly": 6,
                    "6 months": 6,
                    "9 months": 9,
                    yearly: 12,
                    annually: 12,
                    "12 months": 12,
                };

                if (labelMap[label]) {
                    billingPeriod = labelMap[label];
                }
            }
        }

        if (![1, 3, 6, 9, 12].includes(billingPeriod)) {
            const startDate = subscription.startedAt
                ? new Date(subscription.startedAt)
                : null;

            const expiryDate = subscription.expiresAt
                ? new Date(subscription.expiresAt)
                : null;

            if (
                startDate &&
                expiryDate &&
                Number.isFinite(startDate.getTime()) &&
                Number.isFinite(expiryDate.getTime())
            ) {
                const monthDifference =
                    (expiryDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (expiryDate.getMonth() - startDate.getMonth());

                if ([1, 3, 6, 9, 12].includes(monthDifference)) {
                    billingPeriod = monthDifference;
                }
            }
        }

        const billingCycleMap = {
            1: "monthly",
            3: "quarterly",
            6: "half-yearly",
            9: "9 months",
            12: "yearly",
        };

        const billingCycle =
            billingCycleMap[billingPeriod] || "";

        // Disable all add-ons when the CRM subscription is inactive.
        if (!subscriptionIsActive) {
            await User.findByIdAndUpdate(ownerId, {
                $set: {
                    "addons.contacts.enabled": false,
                    "addons.ai_chat.enabled": false,
                    "addons.pharmacy_invoice.enabled": false,
                    "addons.whatsapp_leads.enabled": false,
                },
            });

            if (user.addons) {
                if (user.addons.contacts) {
                    user.addons.contacts.enabled = false;
                }

                if (user.addons.ai_chat) {
                    user.addons.ai_chat.enabled = false;
                }

                if (user.addons.pharmacy_invoice) {
                    user.addons.pharmacy_invoice.enabled = false;
                }

                if (user.addons.whatsapp_leads) {
                    user.addons.whatsapp_leads.enabled = false;
                }
            }
        }

        const normalizedPlanId = String(subscription.planId || "")
            .trim()
            .toLowerCase();

        const resolvedPlanId = subscriptionIsActive
            ? (
                normalizedPlanId === "custom"
                    ? "enterprise"
                    : normalizedPlanId
            )
            : "";

        const resolvedPlanDetails = getPlanDetails(resolvedPlanId);

        const activePlan = {
            planId: subscriptionIsActive ? resolvedPlanId : "",

            planName: subscriptionIsActive
                ? (
                    subscription.planName ||
                    resolvedPlanDetails?.name ||
                    ""
                )
                : "",

            status: subscriptionIsActive ? "active" : "none",

            startedAt: subscription.startedAt || null,

            expiresAt: subscription.expiresAt || null,

            nextBillingAt: subscription.nextBillingAt || null,

            planLimit: subscriptionIsActive
                ? getContactLimit(resolvedPlanId)
                : 0,

            addonLimit: subscriptionIsActive
                ? Number(user.addons?.contacts?.quota || 0)
                : 0,
        };

        const [contactCount, leadCount] = await Promise.all([
            Contact.countDocuments({
                userId: ownerId,
                deletedAt: null,
            }),

            Lead.countDocuments({
                userId: ownerId,
                stage: {
                    $nin: [
                        "Junk",
                        "Junk Lead",
                        "junk",
                        "junk lead",
                    ],
                },
            }),
        ]);

        const contactUsed = contactCount;

        const contactPlanLimit =
            activePlan.planLimit ?? getContactLimit(activePlan.planId);

        const contactAddonLimit = Number(
            activePlan.addonLimit || 0
        );

        const contactTotalLimit = contactPlanLimit === null
            ? null
            : Number(contactPlanLimit || 0) + contactAddonLimit;

        const contactRemaining = contactTotalLimit === null
            ? null
            : Math.max(contactTotalLimit - contactUsed, 0);

        const contactAddon = normalizeAddon(user.addons?.contacts);

        const teamMemberLimit = activePlan.planId
            ? getTeamMemberLimit(activePlan.planId)
            : 0;

        const teamMemberUsed = await TeamMember.countDocuments({
            owner: ownerId,
            memberType: "team",
        });

        const teamMemberRemaining = Math.max(
            teamMemberLimit - teamMemberUsed,
            0
        );

        const totalSeats = teamMemberLimit + 1;
        const usedSeats = teamMemberUsed + 1;

        const aiPlanId = normalizeAIPlanId(activePlan.planId);

        const aiPlanLimit = activePlan.planId
            ? getAIChatbotLimit(aiPlanId)
            : 0;

        const aiAddon = normalizeAddon(user.addons?.ai_chat);
        const pharmacyInvoiceAddon = normalizeAddon(
            user.addons?.pharmacy_invoice
        );
        const whatsappLeadsAddon = normalizeAddon(
            user.addons?.whatsapp_leads
        );

        const isPlanActive =
            activePlan.status === "active" &&
            activePlan.expiresAt &&
            new Date(activePlan.expiresAt).getTime() > Date.now();

        const aiAddonLimit = aiAddon.enabled
            ? aiAddon.quota
            : 0;

        const aiTotalLimit = aiPlanLimit === null
            ? null
            : Number(aiPlanLimit || 0) + aiAddonLimit;

        const monthKey = getMonthKey();

        const aiUsage = await AIUsage.findOne({
            ownerId,
            monthKey,
        }).lean();

        const aiUsed = Number(aiUsage?.count || 0);

        const aiRemaining = aiTotalLimit === null
            ? null
            : Math.max(aiTotalLimit - aiUsed, 0);

        const daysRemaining = getDaysRemaining(activePlan.expiresAt);

        const planDetails = getPlanDetails(activePlan.planId);

        const billingHistory = await Order.find({
            userId: ownerId,
            paymentStatus: "paid",
        })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        const formattedHistory = billingHistory.map((order) => {
            const isAddon = order.orderType === "addon";

            const itemName = isAddon
                ? (
                    order.addonName ||
                    (
                        order.addonType === "contacts"
                            ? "Extra Contacts"
                            : order.addonType === "ai_chat"
                                ? "AI Chatbot"
                                : order.addonType === "pharmacy_invoice"
                                    ? "Pharmacy Invoice"
                                    : order.addonType === "whatsapp_leads"
                                        ? "WhatsApp Lead Notifications"
                                        : "Add-on"
                    )
                )
                : (
                    order.planName ||
                    getPlanDetails(order.planId)?.name ||
                    order.planId ||
                    "Plan"
                );

            const amount = Number(order.amount || 0);
            const tax = Number(order.tax || 0);

            return {
                id: String(order._id),
                invoiceNumber: order.invoiceNumber || "",
                date: order.createdAt || null,
                orderType: order.orderType || "subscription",
                itemName,
                planId: order.planId || "",
                planName: order.planName || "",
                addonType: order.addonType || "",
                addonName: order.addonName || "",
                addonMonths: Number(order.addonMonths || 0),
                addonQuota: Number(order.addonQuota || 0),
                amount,
                tax,
                total: amount,
                currency: order.currency || "INR",
                paymentStatus: order.paymentStatus,
                razorpayPaymentId: order.razorpayPaymentId || "",
                period: Number(order.period || 0),
                periodLabel: order.periodLabel || "",
                createdAt: order.createdAt || null,
            };
        });

        return res.json({
            success: true,

            subscription: {
                planId: activePlan.planId,
                planName: activePlan.planName,
                status: activePlan.status,

                billingCycle,
                period: billingPeriod,
                periodMonths: billingPeriod,

                startedAt: activePlan.startedAt || null,
                expiresAt: activePlan.expiresAt || null,
                nextBillingAt: activePlan.nextBillingAt || null,
                daysRemaining,

                amount: Number(subscription.amount || 0),
                currency: subscription.currency || "INR",
                setupFeePaid: Boolean(subscription.setupFeePaid),

                orderId: subscription.orderId
                    ? String(subscription.orderId)
                    : originalOrder?._id
                        ? String(originalOrder._id)
                        : null,

                paymentId: subscription.paymentId || "",
            },

            usage: {
                contacts: {
                    planLimit: contactPlanLimit,
                    addonLimit: contactAddonLimit,
                    totalLimit: contactTotalLimit,
                    used: contactUsed,
                    remaining: contactRemaining,
                    percentage: calculatePercentage(
                        contactUsed,
                        contactTotalLimit
                    ),
                },

                aiChatbot: {
                    planLimit: aiPlanLimit,
                    addonLimit: aiAddonLimit,
                    totalLimit: aiTotalLimit,
                    used: aiUsed,
                    remaining: aiRemaining,
                    percentage: calculatePercentage(
                        aiUsed,
                        aiTotalLimit
                    ),
                },

                teamMembers: {
                    limit: teamMemberLimit,
                    used: teamMemberUsed,
                    remaining: teamMemberRemaining,
                    totalSeats,
                    usedSeats,
                    availableSeats: teamMemberRemaining,
                },
            },

            addons: {
                contacts: {
                    ...contactAddon,
                    status: getAddonStatus(contactAddon, isPlanActive),
                },

                ai_chat: {
                    ...aiAddon,
                    status: getAddonStatus(aiAddon, isPlanActive),
                },

                pharmacy_invoice: {
                    ...pharmacyInvoiceAddon,
                    status: getAddonStatus(
                        pharmacyInvoiceAddon,
                        isPlanActive
                    ),
                        used: pharmacyInvoiceUsed,
                },

                whatsapp_leads: {
                    ...whatsappLeadsAddon,
                    status: getAddonStatus(
                        whatsappLeadsAddon,
                        isPlanActive
                    ),
                },
            },

            plan: {
                id: planDetails?.id || activePlan.planId || "",
                name: planDetails?.name || activePlan.planName || "",
                contactLimit: contactTotalLimit,
                baseContactLimit: contactPlanLimit,
                aiChatbotLimit: aiTotalLimit,
                baseAIChatbotLimit: aiPlanLimit,
                teamMemberLimit,
            },

            plans: getAvailablePlans(activePlan.planId),
            billingHistory: formattedHistory,
        });

    } catch (error) {
        console.error("GET CURRENT BILLING ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load billing information",
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