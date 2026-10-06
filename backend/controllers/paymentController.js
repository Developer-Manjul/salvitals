const Razorpay = require("razorpay");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Order = require("../models/Order");
const User = require("../models/User");
const sendInvoiceEmail = require("../utils/sendInvoiceEmail");
const {
    getWorkspaceContext,
} = require("../utils/workspace");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
    starter: {
        name: "Starter",
        inr: 1953,
        usd: 63,
    },
    growth: {
        name: "Growth",
        inr: 2953,
        usd: 93,
    },
    scale: {
        name: "Scale",
        inr: 4953,
        usd: 113,
    },
};

const DISCOUNTS = {
    1: 0,
    3: 5,
    6: 7,
    9: 9,
    12: 12,
    24: 15,
};

const ADDONS = {
    contacts: {
        name: "Extra Contacts",
        unitPrice: 500,
        quotaPerMonth: 1000,
        unitLabel: "contacts",
    },
    ai_chat: {
        name: "AI Chatbot",
        unitPrice: 500,
        quotaPerMonth: 3000,
        unitLabel: "AI conversations",
    },
};

function getUserId(req) {
    const authorization = req.headers.authorization || "";

    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(
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

function normalizePlanId(value) {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    if (normalized === "custom") {
        return "enterprise";
    }

    return normalized;
}

function getPlan(planId) {
    return (
        PLANS[
            normalizePlanId(planId)
        ] || null
    );
}

function getAddon(addonType) {
    const normalized = String(addonType || "")
        .trim()
        .toLowerCase();

    return (
        ADDONS[normalized] || null
    );
}

function getDiscountPercentage(period) {
    return (
        DISCOUNTS[
            Number(period)
        ] || 0
    );
}

function getMonthlyPrice(
    planId,
    currency
) {
    const plan = getPlan(planId);

    if (!plan) {
        return null;
    }

    return currency === "USD"
        ? plan.usd
        : plan.inr;
}

function calculateSubscription(
    planId,
    period,
    currency
) {
    const monthlyPrice = getMonthlyPrice(
        planId,
        currency
    );

    if (
        monthlyPrice === null ||
        monthlyPrice === undefined
    ) {
        return null;
    }

    const months = Number(period) || 1;

    const discountPercentage =
        getDiscountPercentage(months);

    const originalAmount =
        monthlyPrice * months;

    const discountAmount =
        Math.round(
            originalAmount *
                (discountPercentage / 100) *
                100
        ) / 100;

    const discountedAmount =
        originalAmount -
        discountAmount;

    return {
        monthlyPrice,
        months,
        discountPercentage,
        originalAmount,
        discountAmount,
        discountedAmount,
    };
}

function calculateAddon(
    addonType,
    quantity,
    currency
) {
    const addon = getAddon(addonType);

    if (!addon) {
        return null;
    }

    if (currency !== "INR") {
        return null;
    }

    const packs = Number(quantity);

    if (
        !Number.isInteger(packs) ||
        packs < 1 ||
        packs > 10
    ) {
        return null;
    }

    const amount =
        addon.unitPrice * packs;

    const quota =
        addon.quotaPerMonth * packs;

    return {
        addonType: String(addonType)
            .trim()
            .toLowerCase(),
        addonName: addon.name,
        quantity: packs,
        months: 1,
        unitPrice: addon.unitPrice,
        quotaPerMonth: addon.quotaPerMonth,
        quota,
        amount,
        currency: "INR",
    };
}

function calculateSetupFee(
    user,
    currency
) {
    if (
        user?.subscription?.setupFeePaid
    ) {
        return 0;
    }

    if (
        user?.subscription?.status ===
        "active"
    ) {
        return 0;
    }

    return currency === "INR"
        ? 699
        : 180;
}

function calculateTax(
    subtotal,
    currency
) {
    if (currency !== "INR") {
        return 0;
    }

    return Math.round(
        subtotal *
            0.18 *
            100
    ) / 100;
}

function addMonths(
    date,
    months
) {
    const result =
        new Date(date);

    const originalDate =
        result.getDate();

    result.setMonth(
        result.getMonth() +
            Number(months)
    );

    if (
        result.getDate() !==
        originalDate
    ) {
        result.setDate(0);
    }

    return result;
}

function getSubscriptionDates(
    period
) {
    const startedAt =
        new Date();

    const expiresAt =
        addMonths(
            startedAt,
            Number(period) || 1
        );

    return {
        startedAt,
        expiresAt,
        nextBillingAt:
            expiresAt,
    };
}

function getAddonDates() {
    const startedAt =
        new Date();

    const expiresAt =
        addMonths(
            startedAt,
            1
        );

    return {
        startedAt,
        expiresAt,
    };
}

async function sendInvoiceIfNeeded(
    order
) {
    if (
        order.invoiceEmailSentAt
    ) {
        return false;
    }

    const user =
        await User.findById(
            order.userId
        );

    if (
        !user ||
        !user.email
    ) {
        return false;
    }

    try {
        await sendInvoiceEmail({
            user,
            order,
            paymentId:
                order.razorpayPaymentId,
        });

        order.invoiceEmailSentAt =
            new Date();

        order.invoiceEmailError =
            "";

        await order.save();

        return true;
    } catch (emailError) {
        order.invoiceEmailError =
            emailError.message ||
            "Unable to send invoice email";

        await order.save();

        console.error(
            "INVOICE EMAIL ERROR:",
            emailError
        );

        return false;
    }
}

async function activateSubscription(
    order
) {
    const user =
        await User.findById(
            order.userId
        );

    if (!user) {
        throw new Error(
            "User not found while activating subscription"
        );
    }

    const planId =
        normalizePlanId(
            order.planId
        );

    const planName =
        planId === "enterprise"
            ? "Enterprise"
            : getPlan(planId)?.name ||
              order.planName ||
              planId;

    const period =
        Number(order.period) || 1;

    const dates =
        getSubscriptionDates(
            period
        );

    const existingSetupFeePaid =
        Boolean(
            user.subscription?.setupFeePaid
        );

    const setupFeePaid =
        existingSetupFeePaid ||
        Number(
            order.setupFee || 0
        ) > 0;

    user.subscription = {
        planId,
        planName,
        status: "active",
        billingCycle:
            period === 1
                ? "monthly"
                : `${period}-months`,
        startedAt:
            dates.startedAt,
        expiresAt:
            dates.expiresAt,
        nextBillingAt:
            dates.nextBillingAt,
        amount: Number(
            order.planAmount || 0
        ),
        currency:
            order.currency || "INR",
        orderId:
            order._id,
        razorpayOrderId:
            order.razorpayOrderId ||
            "",
        paymentId:
            order.razorpayPaymentId ||
            "",
        setupFeePaid,
    };

    await user.save();

    return user;
}

async function activateAddon(
    order
) {
    const user =
        await User.findById(
            order.userId
        );

    if (!user) {
        throw new Error(
            "User not found while activating add-on"
        );
    }

    if (
        user.subscription?.status !==
        "active"
    ) {
        throw new Error(
            "Active subscription required for add-on"
        );
    }

    const addonType =
        String(
            order.addonType || ""
        )
            .trim()
            .toLowerCase();

    if (!ADDONS[addonType]) {
        throw new Error(
            "Invalid add-on type"
        );
    }

    const addon =
        user.addons?.[
            addonType
        ] || {};

    const now =
        new Date();

    const existingExpiresAt =
        addon.expiresAt
            ? new Date(
                  addon.expiresAt
              )
            : null;

    const existingActive =
        Boolean(
            addon.enabled &&
                existingExpiresAt &&
                existingExpiresAt.getTime() >
                    now.getTime()
        );

    const purchasedQuota =
        Number(
            order.addonQuota || 0
        );

    const unitPrice =
        Number(
            order.addonUnitPrice ||
                ADDONS[
                    addonType
                ].unitPrice
        );

    let startsAt;
    let expiresAt;
    let quota;
    let used;

    if (existingActive) {
        startsAt =
            addon.startsAt
                ? new Date(
                      addon.startsAt
                  )
                : now;

        expiresAt =
            existingExpiresAt;

        quota =
            Number(
                addon.quota || 0
            ) +
            purchasedQuota;

        used =
            Number(
                addon.used || 0
            );
    } else {
        startsAt =
            now;

        expiresAt =
            addMonths(
                startsAt,
                1
            );

        quota =
            purchasedQuota;

        used = 0;
    }

    if (!user.addons) {
        user.addons = {};
    }

    user.addons[
        addonType
    ] = {
        enabled: true,
        quota,
        used,
        months: 1,
        unitPrice,
        startsAt,
        expiresAt,
        orderId:
            order._id,
        razorpayOrderId:
            order.razorpayOrderId ||
            "",
        paymentId:
            order.razorpayPaymentId ||
            "",
    };

    order.addonMonths = 1;

    order.addonStartsAt =
        startsAt;

    order.addonExpiresAt =
        expiresAt;

    order.addonQuotaUsed =
        used;

    await order.save();
    await user.save();

    return user;
}

async function activatePaidOrder(
    order
) {
    if (!order) {
        return null;
    }

    if (
        order.orderType ===
        "addon"
    ) {
        return activateAddon(
            order
        );
    }

    return activateSubscription(
        order
    );
}

async function ensureSubscriptionForPaidOrder(
    userId,
    paidOrder
) {
    if (
        !paidOrder ||
        paidOrder.orderType !==
            "subscription"
    ) {
        return null;
    }

    const user =
        await User.findById(
            userId
        );

    if (!user) {
        return null;
    }

    const subscription =
        user.subscription || {};

    const orderMatches =
        String(
            subscription.orderId ||
                ""
        ) ===
        String(
            paidOrder._id
        );

    const subscriptionActive =
        subscription.status ===
        "active";

    const samePlan =
        normalizePlanId(
            subscription.planId
        ) ===
        normalizePlanId(
            paidOrder.planId
        );

    if (
        !subscriptionActive ||
        !orderMatches ||
        !samePlan
    ) {
        return activateSubscription(
            paidOrder
        );
    }

    return user;
}

async function recoverPaidSubscriptionOrder(
    userId
) {
    const pendingOrder =
        await Order.findOne({
            userId,
            orderType:
                "subscription",
            paymentStatus:
                "pending",
            razorpayOrderId: {
                $ne: "",
            },
        }).sort({
            createdAt: -1,
        });

    if (!pendingOrder) {
        return null;
    }

    const payments =
        await razorpay.orders.fetchPayments(
            pendingOrder.razorpayOrderId
        );

    const capturedPayment =
        payments.items?.find(
            (payment) =>
                payment.status ===
                "captured"
        );

    if (!capturedPayment) {
        return null;
    }

    const currentYear =
        new Date().getFullYear();

    const paidOrdersCount =
        await Order.countDocuments({
            paymentStatus:
                "paid",
            invoiceNumber: {
                $regex:
                    `^SV_${currentYear}_`,
            },
        });

    pendingOrder.invoiceNumber =
        pendingOrder.invoiceNumber ||
        `SV_${currentYear}_${String(
            paidOrdersCount + 1
        ).padStart(3, "0")}`;

    pendingOrder.paymentStatus =
        "paid";

    pendingOrder.razorpayPaymentId =
        capturedPayment.id;

    await pendingOrder.save();

    await activateSubscription(
        pendingOrder
    );

    await sendInvoiceIfNeeded(
        pendingOrder
    );

    return pendingOrder;
}

exports.getPaymentStatus = async (req, res) => {
    try {
        const context = await getWorkspaceContext(req);
        const userId = context.workspaceOwnerId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
                payment_completed: false,
                payment_status: "unauthorized",
                status: "unauthorized",
            });
        }

        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                payment_completed: false,
                payment_status: "not_found",
                status: "not_found",
            });
        }

        let paidOrder = await Order.findOne({
            userId,
            orderType: "subscription",
            paymentStatus: "paid",
        }).sort({
            createdAt: -1,
        });

        if (!paidOrder) {
            try {
                paidOrder = await recoverPaidSubscriptionOrder(userId);
            } catch (recoveryError) {
                console.error(
                    "PAYMENT RECOVERY ERROR:",
                    recoveryError
                );
            }
        }

        if (paidOrder) {
            try {
                user = await ensureSubscriptionForPaidOrder(
                    userId,
                    paidOrder
                );
            } catch (subscriptionError) {
                console.error(
                    "SUBSCRIPTION SYNC ERROR:",
                    subscriptionError
                );
            }

            await sendInvoiceIfNeeded(paidOrder);

            const subscription = user?.subscription || {};

            return res.status(200).json({
                success: true,
                payment_completed: true,
                payment_status: "paid",
                status: "paid",
                orderId: paidOrder._id,
                planId: paidOrder.planId,
                planName: paidOrder.planName,
                invoiceNumber: paidOrder.invoiceNumber || "",
                subscription: {
                    planId:
                        subscription.planId ||
                        paidOrder.planId ||
                        "",
                    planName:
                        subscription.planName ||
                        paidOrder.planName ||
                        "",
                    status:
                        subscription.status ||
                        "active",
                    billingCycle:
                        subscription.billingCycle ||
                        "",
                    startedAt:
                        subscription.startedAt ||
                        null,
                    expiresAt:
                        subscription.expiresAt ||
                        null,
                    nextBillingAt:
                        subscription.nextBillingAt ||
                        null,
                    amount: Number(
                        subscription.amount ||
                            paidOrder.planAmount ||
                            0
                    ),
                    currency:
                        subscription.currency ||
                        paidOrder.currency ||
                        "INR",
                    setupFeePaid: Boolean(
                        subscription.setupFeePaid
                    ),
                    orderId:
                        subscription.orderId ||
                        paidOrder._id,
                    razorpayOrderId:
                        subscription.razorpayOrderId ||
                        paidOrder.razorpayOrderId ||
                        "",
                    paymentId:
                        subscription.paymentId ||
                        paidOrder.razorpayPaymentId ||
                        "",
                },
                order: {
                    _id: paidOrder._id,
                    orderType: paidOrder.orderType,
                    paymentStatus:
                        paidOrder.paymentStatus,
                    planId: paidOrder.planId,
                    planName: paidOrder.planName,
                    amount: paidOrder.amount,
                    planAmount: paidOrder.planAmount,
                    setupFee: paidOrder.setupFee,
                    tax: paidOrder.tax,
                    currency: paidOrder.currency,
                    period: paidOrder.period,
                    periodLabel:
                        paidOrder.periodLabel,
                },
            });
        }

        const subscription = user.subscription || {};

        const subscriptionIsActive =
            subscription.status === "active" &&
            subscription.expiresAt &&
            new Date(
                subscription.expiresAt
            ).getTime() > Date.now();

        if (subscriptionIsActive) {
            return res.status(200).json({
                success: true,
                payment_completed: true,
                payment_status: "paid",
                status: "paid",
                subscription: {
                    planId:
                        subscription.planId ||
                        "",
                    planName:
                        subscription.planName ||
                        "",
                    status:
                        subscription.status ||
                        "active",
                    billingCycle:
                        subscription.billingCycle ||
                        "",
                    startedAt:
                        subscription.startedAt ||
                        null,
                    expiresAt:
                        subscription.expiresAt ||
                        null,
                    nextBillingAt:
                        subscription.nextBillingAt ||
                        null,
                    amount: Number(
                        subscription.amount ||
                            0
                    ),
                    currency:
                        subscription.currency ||
                        "INR",
                    setupFeePaid: Boolean(
                        subscription.setupFeePaid
                    ),
                    orderId:
                        subscription.orderId ||
                        null,
                    razorpayOrderId:
                        subscription.razorpayOrderId ||
                        "",
                    paymentId:
                        subscription.paymentId ||
                        "",
                },
            });
        }

        return res.status(200).json({
            success: true,
            payment_completed: false,
            payment_status: "pending",
            status: "pending",
            subscription: {
                planId:
                    subscription.planId ||
                    "",
                planName:
                    subscription.planName ||
                    "",
                status:
                    subscription.status ||
                    "none",
                billingCycle:
                    subscription.billingCycle ||
                    "",
                startedAt:
                    subscription.startedAt ||
                    null,
                expiresAt:
                    subscription.expiresAt ||
                    null,
                nextBillingAt:
                    subscription.nextBillingAt ||
                    null,
                amount: Number(
                    subscription.amount ||
                        0
                ),
                currency:
                    subscription.currency ||
                    "INR",
                setupFeePaid: Boolean(
                    subscription.setupFeePaid
                ),
            },
        });
    } catch (error) {
        console.error(
            "GET PAYMENT STATUS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to check payment status",
            payment_completed: false,
            payment_status: "error",
            status: "error",
        });
    }
};

exports.createOrder =
    async (
        req,
        res
    ) => {
        try {
            const userId =
                getUserId(req);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Please sign in before payment",
                });
            }

            const user =
                await User.findById(
                    userId
                );

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message:
                        "User not found",
                });
            }

            if (
                !user.emailVerified
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Please verify your email before payment",
                });
            }

            const {
                orderType =
                    "subscription",
                currency =
                    "INR",
                planId,
                period =
                    1,
                periodLabel =
                    "",
                country =
                    "",
                addonType =
                    "",
                quantity =
                    1,
            } = req.body;

            const curr =
                String(currency)
                    .toUpperCase() ===
                "USD"
                    ? "USD"
                    : "INR";

            if (
                orderType ===
                "addon"
            ) {
                if (
                    curr !==
                    "INR"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Add-ons are currently available in INR only.",
                    });
                }

                if (
                    user.subscription?.status !==
                    "active"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Please activate a CRM plan before purchasing an add-on.",
                    });
                }

                const addonCalculation =
                    calculateAddon(
                        addonType,
                        quantity,
                        curr
                    );

                if (!addonCalculation) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid add-on or quantity selected.",
                    });
                }

                const subtotal =
                    addonCalculation.amount;

                const tax =
                    calculateTax(
                        subtotal,
                        curr
                    );

                const totalAmount =
                    Math.round(
                        (
                            subtotal +
                            tax
                        ) *
                            100
                    ) / 100;

                const razorpayAmount =
                    Math.round(
                        totalAmount *
                            100
                    );

                const addonDates =
                    getAddonDates();

                const razorpayOrder =
                    await razorpay.orders.create({
                        amount:
                            razorpayAmount,
                        currency:
                            curr,
                        receipt:
                            `salevitals_addon_${Date.now()}`,
                        notes: {
                            orderType:
                                "addon",
                            addonType:
                                addonCalculation.addonType,
                            addonName:
                                addonCalculation.addonName,
                            addonQuantity:
                                String(
                                    addonCalculation.quantity
                                ),
                            addonMonths:
                                "1",
                            addonQuota:
                                String(
                                    addonCalculation.quota
                                ),
                            addonUnitPrice:
                                String(
                                    addonCalculation.unitPrice
                                ),
                            addonStartsAt:
                                addonDates.startedAt.toISOString(),
                            addonExpiresAt:
                                addonDates.expiresAt.toISOString(),
                            subtotal:
                                String(
                                    subtotal
                                ),
                            tax:
                                String(
                                    tax
                                ),
                            totalAmount:
                                String(
                                    totalAmount
                                ),
                            userId:
                                String(
                                    userId
                                ),
                        },
                    });

                const dbOrder =
                    await Order.create({
                        userId,
                        orderType:
                            "addon",
                        planId:
                            addonCalculation.addonType,
                        planName:
                            user.subscription?.planName ||
                            "",
                        addonType:
                            addonCalculation.addonType,
                        addonName:
                            addonCalculation.addonName,
                        addonMonths:
                            1,
                        addonUnitPrice:
                            addonCalculation.unitPrice,
                        addonQuota:
                            addonCalculation.quota,
                        addonQuotaUsed:
                            0,
                        addonStartsAt:
                            addonDates.startedAt,
                        addonExpiresAt:
                            addonDates.expiresAt,
                        amount:
                            totalAmount,
                        planAmount:
                            subtotal,
                        setupFee:
                            0,
                        tax,
                        currency:
                            curr,
                        period:
                            1,
                        periodLabel:
                            `${addonCalculation.quantity} pack${
                                addonCalculation.quantity > 1
                                    ? "s"
                                    : ""
                            }`,
                        paymentStatus:
                            "pending",
                        razorpayOrderId:
                            razorpayOrder.id,
                        country:
                            country || "",
                    });

                return res.status(200).json({
                    success: true,
                    order: {
                        id:
                            razorpayOrder.id,
                        amount:
                            razorpayOrder.amount,
                        currency:
                            razorpayOrder.currency,
                        receipt:
                            razorpayOrder.receipt,
                        dbOrderId:
                            dbOrder._id.toString(),
                        orderType:
                            "addon",
                        addonType:
                            addonCalculation.addonType,
                        addonName:
                            addonCalculation.addonName,
                        addonQuantity:
                            addonCalculation.quantity,
                        addonMonths:
                            1,
                        addonQuota:
                            addonCalculation.quota,
                        addonUnitPrice:
                            addonCalculation.unitPrice,
                        subtotal,
                        tax,
                        totalAmount,
                        addonStartsAt:
                            addonDates.startedAt,
                        addonExpiresAt:
                            addonDates.expiresAt,
                    },
                });
            }

            const normalizedPlanId =
                normalizePlanId(
                    planId
                );

            const plan =
                getPlan(
                    normalizedPlanId
                );

            if (!plan) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid plan selected",
                });
            }

            const months =
                Number(period);

            if (
                !Number.isInteger(
                    months
                ) ||
                !Object.prototype.hasOwnProperty.call(
                    DISCOUNTS,
                    months
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid subscription period",
                });
            }

            const calculation =
                calculateSubscription(
                    normalizedPlanId,
                    months,
                    curr
                );

            if (!calculation) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unable to calculate plan amount",
                });
            }

            const setupFee =
                calculateSetupFee(
                    user,
                    curr
                );

            const subtotal =
                calculation.discountedAmount +
                setupFee;

            const tax =
                calculateTax(
                    subtotal,
                    curr
                );

            const totalAmount =
                Math.round(
                    (
                        subtotal +
                        tax
                    ) *
                        100
                ) / 100;

            const razorpayAmount =
                Math.round(
                    totalAmount *
                        100
                );

            const razorpayOrder =
                await razorpay.orders.create({
                    amount:
                        razorpayAmount,
                    currency:
                        curr,
                    receipt:
                        `salevitals_${Date.now()}`,
                    notes: {
                        orderType:
                            "subscription",
                        planId:
                            normalizedPlanId,
                        planName:
                            plan.name,
                        period:
                            String(
                                months
                            ),
                        periodLabel:
                            periodLabel ||
                            `${months} month${
                                months > 1
                                    ? "s"
                                    : ""
                            }`,
                        planAmount:
                            String(
                                calculation.discountedAmount
                            ),
                        originalPlanAmount:
                            String(
                                calculation.originalAmount
                            ),
                        discountPercentage:
                            String(
                                calculation.discountPercentage
                            ),
                        discountAmount:
                            String(
                                calculation.discountAmount
                            ),
                        setupFee:
                            String(
                                setupFee
                            ),
                        tax:
                            String(
                                tax
                            ),
                        cartTotal:
                            String(
                                totalAmount
                            ),
                        userId:
                            String(
                                userId
                            ),
                    },
                });

            const dbOrder =
                await Order.create({
                    userId,
                    orderType:
                        "subscription",
                    planId:
                        normalizedPlanId,
                    planName:
                        plan.name,
                    amount:
                        totalAmount,
                    planAmount:
                        calculation.discountedAmount,
                    setupFee,
                    tax,
                    currency:
                        curr,
                    period:
                        months,
                    periodLabel:
                        periodLabel ||
                        `${months} month${
                            months > 1
                                ? "s"
                                : ""
                        }`,
                    paymentStatus:
                        "pending",
                    razorpayOrderId:
                        razorpayOrder.id,
                    country:
                        country || "",
                });

            return res.status(200).json({
                success: true,
                order: {
                    id:
                        razorpayOrder.id,
                    amount:
                        razorpayOrder.amount,
                    currency:
                        razorpayOrder.currency,
                    receipt:
                        razorpayOrder.receipt,
                    dbOrderId:
                        dbOrder._id.toString(),
                    orderType:
                        "subscription",
                    totalAmount,
                    planAmount:
                        calculation.discountedAmount,
                    setupFee,
                    tax,
                    originalPlanAmount:
                        calculation.originalAmount,
                    discountPercentage:
                        calculation.discountPercentage,
                    discountAmount:
                        calculation.discountAmount,
                },
            });
        } catch (error) {
            console.error(
                "CREATE ORDER ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error?.error?.description ||
                    error?.message ||
                    "Unable to create payment order",
            });
        }
    };

exports.verifyPayment =
    async (
        req,
        res
    ) => {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            } = req.body;

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Payment details are missing",
                });
            }

            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env
                            .RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${razorpay_order_id}|${razorpay_payment_id}`
                    )
                    .digest(
                        "hex"
                    );

            if (
                generatedSignature !==
                razorpay_signature
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment signature",
                });
            }

            const order =
                await Order.findOne({
                    razorpayOrderId:
                        razorpay_order_id,
                });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found",
                });
            }

            const currentYear =
                new Date().getFullYear();

            if (
                !order.invoiceNumber
            ) {
                const paidOrdersCount =
                    await Order.countDocuments({
                        paymentStatus:
                            "paid",
                        invoiceNumber: {
                            $regex:
                                `^SV_${currentYear}_`,
                        },
                    });

                const invoiceSequence =
                    String(
                        paidOrdersCount +
                            1
                    ).padStart(
                        3,
                        "0"
                    );

                order.invoiceNumber =
                    `SV_${currentYear}_${invoiceSequence}`;
            }

            order.paymentStatus =
                "paid";

            order.razorpayPaymentId =
                razorpay_payment_id;

            order.razorpaySignature =
                razorpay_signature;

            await order.save();

            let user =
                await User.findById(
                    order.userId
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found",
                });
            }

            user =
                await activatePaidOrder(
                    order
                );

            await sendInvoiceIfNeeded(
                order
            );

            return res.status(200).json({
                success: true,
                message:
                    order.orderType ===
                    "addon"
                        ? "Add-on payment verified successfully"
                        : "Payment verified successfully",
                order,
                orderType:
                    order.orderType,
                addon:
                    order.orderType ===
                    "addon"
                        ? {
                            type:
                                order.addonType,
                            name:
                                order.addonName,
                            quantity:
                                Math.max(
                                    1,
                                    Math.round(
                                        Number(
                                            order.addonQuota ||
                                            0
                                        ) /
                                        Number(
                                            ADDONS[
                                                order.addonType
                                            ]?.quotaPerMonth ||
                                            1
                                        )
                                    )
                                ),
                            months:
                                1,
                            quota:
                                order.addonQuota,
                            used:
                                user
                                    ?.addons?.[
                                    order.addonType
                                ]?.used ||
                                0,
                            startsAt:
                                user
                                    ?.addons?.[
                                    order.addonType
                                ]?.startsAt ||
                                order.addonStartsAt,
                            expiresAt:
                                user
                                    ?.addons?.[
                                    order.addonType
                                ]?.expiresAt ||
                                order.addonExpiresAt,
                        }
                        : null,
                subscription:
                    user?.subscription
                        ? {
                            planId:
                                user
                                    .subscription
                                    .planId ||
                                "",
                            planName:
                                user
                                    .subscription
                                    .planName ||
                                "",
                            status:
                                user
                                    .subscription
                                    .status ||
                                "active",
                            billingCycle:
                                user
                                    .subscription
                                    .billingCycle ||
                                "",
                            startedAt:
                                user
                                    .subscription
                                    .startedAt ||
                                null,
                            expiresAt:
                                user
                                    .subscription
                                    .expiresAt ||
                                null,
                            nextBillingAt:
                                user
                                    .subscription
                                    .nextBillingAt ||
                                null,
                            amount:
                                Number(
                                    user
                                        .subscription
                                        .amount ||
                                    0
                                ),
                            currency:
                                user
                                    .subscription
                                    .currency ||
                                "INR",
                            setupFeePaid:
                                Boolean(
                                    user
                                        .subscription
                                        .setupFeePaid
                                ),
                        }
                        : null,
            });
        } catch (error) {
            console.error(
                "VERIFY PAYMENT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to verify payment",
            });
        }
    };