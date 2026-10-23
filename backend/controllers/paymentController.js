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
        inr: 1453,
        usd: 63,
    },
    growth: {
        name: "Growth",
       inr: 2453,
        usd: 93,
    },
    scale: {
        name: "Scale",
        inr: 4453,
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
    whatsapp_leads: {
        name: "WhatsApp Lead Notifications",
        unitPrice: 1000,
        quotaPerMonth: 600,
        unitLabel: "WhatsApp lead notifications",
    },

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

    pharmacy_invoice: {
        name: "Pharmacy Invoice",
        unitPrice: 1000,
        quotaPerMonth: 0,
        unitLabel: "invoices",
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
    const normalizedType = String(addonType || "")
        .trim()
        .toLowerCase();

    const addon = getAddon(normalizedType);

    if (!addon) {
        return null;
    }

    if (currency !== "INR") {
        return null;
    }

    const isPharmacyInvoice =
        normalizedType === "pharmacy_invoice";

    let packs = 1;

    if (!isPharmacyInvoice) {
        packs = Number(quantity);

        if (
            !Number.isInteger(packs) ||
            packs < 1 ||
            packs > 10
        ) {
            return null;
        }
    }

    const amount = isPharmacyInvoice
        ? 1000
        : addon.unitPrice * packs;

    const quota = isPharmacyInvoice
        ? 0
        : addon.quotaPerMonth * packs;

    return {
        addonType: normalizedType,
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
    
    const previousSubscription = user.subscription || {};

            const previousPlanIsActive =
                previousSubscription.status === "active" &&
                previousSubscription.expiresAt &&
                new Date(previousSubscription.expiresAt).getTime() > Date.now();

            if (user.addons) {
                for (const addonType of [
                    "contacts",
                    "ai_chat",
                    "pharmacy_invoice",
                ]) {
                    if (user.addons[addonType]) {
                        user.addons[addonType].enabled = false;
                    }
                }
            }

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

  
    // Activate add-ons purchased with the subscription.
    const purchasedAddons = Array.isArray(order.addons)
        ? order.addons
        : [];

    if (
        purchasedAddons.length > 0 &&
        order.addonActivationStatus !== "activated"
    ) {
        const now = new Date();

        for (const purchased of purchasedAddons) {
            const type = purchased.addonType;
            const config = ADDONS[type];

            if (!config || !user.addons?.[type]) {
                throw new Error(`Invalid add-on: ${type}`);
            }

            const addon = user.addons[type];
            const isPharmacy = type === "pharmacy_invoice";

            const existingExpiry = addon.expiresAt
                ? new Date(addon.expiresAt)
                : null;

            const existingActive =
                addon.enabled &&
                existingExpiry &&
                existingExpiry.getTime() > now.getTime();

            const startsAt = existingActive
                ? addon.startsAt || now
                : now;

            const expiresAt = existingActive
                ? addMonths(existingExpiry, 1)
                : addMonths(now, 1);

            addon.enabled = true;
            addon.quota = isPharmacy
                ? 0
                : Number(existingActive ? addon.quota || 0 : 0) +
                  Number(purchased.quota || 0);
            addon.used = existingActive
                ? Number(addon.used || 0)
                : 0;
            addon.months = 1;
            addon.unitPrice = Number(
                purchased.unitPrice || config.unitPrice
            );
            addon.startsAt = startsAt;
            addon.expiresAt = expiresAt;
            addon.orderId = order._id;
            addon.razorpayOrderId = order.razorpayOrderId || "";
            addon.paymentId = order.razorpayPaymentId || "";
        }

        order.addonActivationStatus = "activated";
        await order.save();
    }


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

    const subscription = user.subscription || {};

        const subscriptionIsActive =
            subscription.status === "active" &&
            subscription.expiresAt &&
            new Date(subscription.expiresAt).getTime() > Date.now();

        if (!subscriptionIsActive) {
            throw new Error(
                "An active, non-expired subscription is required for add-on"
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

    const alreadyActivated = await Order.exists({
    _id: order._id,
    orderType: "addon",
    addonActivationStatus: "activated",
});

if (alreadyActivated) {
    return await User.findById(order.userId);
}

    const addon =
        user.addons?.[
            addonType
        ] || {};
    
    const isPharmacyInvoice =
    addonType === "pharmacy_invoice";

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

    const purchasedQuota = isPharmacyInvoice
    ? 0
    : Number(order.addonQuota || 0);

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

       expiresAt = addMonths(existingExpiresAt, 1);

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

   await user.save();

order.addonActivationStatus = "activated";
await order.save();

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


exports.createOrder = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please sign in before payment",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before payment",
            });
        }

        const {
            orderType = "subscription",
            currency = "INR",
            planId,
            period = 1,
            periodLabel = "",
            country = "",
            addonType = "",
            quantity = 1,
            selectedAddons = [],
            voucherCode = "",
        } = req.body;

        const curr =
            String(currency).toUpperCase() === "USD"
                ? "USD"
                : "INR";

        // ADD-ON PURCHASE: vouchers do not apply.
        if (orderType === "addon") {
            if (curr !== "INR") {
                return res.status(400).json({
                    success: false,
                    message: "Add-ons are currently available in INR only.",
                });
            }

            const subscription = user.subscription || {};

            const subscriptionIsActive =
                subscription.status === "active" &&
                subscription.expiresAt &&
                new Date(subscription.expiresAt).getTime() > Date.now();

            if (!subscriptionIsActive) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please activate or renew your CRM plan before purchasing an add-on.",
                });
            }

            const addonCalculation = calculateAddon(
                addonType,
                quantity,
                curr
            );

            if (!addonCalculation) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid add-on or quantity selected.",
                });
            }

            const subtotal = addonCalculation.amount;
            const tax = calculateTax(subtotal, curr);
            const totalAmount =
                Math.round((subtotal + tax) * 100) / 100;
            const razorpayAmount = Math.round(totalAmount * 100);
            const addonDates = getAddonDates();

            const razorpayOrder = await razorpay.orders.create({
                amount: razorpayAmount,
                currency: curr,
                receipt: `salevitals_addon_${Date.now()}`,
                notes: {
                    orderType: "addon",
                    addonType: addonCalculation.addonType,
                    addonName: addonCalculation.addonName,
                    addonQuantity: String(addonCalculation.quantity),
                    addonMonths: "1",
                    addonQuota: String(addonCalculation.quota),
                    addonUnitPrice: String(addonCalculation.unitPrice),
                    addonStartsAt: addonDates.startedAt.toISOString(),
                    addonExpiresAt: addonDates.expiresAt.toISOString(),
                    subtotal: String(subtotal),
                    tax: String(tax),
                    totalAmount: String(totalAmount),
                    userId: String(userId),
                },
            });

            const dbOrder = await Order.create({
                userId,
                orderType: "addon",
                planId: addonCalculation.addonType,
                planName: user.subscription?.planName || "",
                addonType: addonCalculation.addonType,
                addonName: addonCalculation.addonName,
                addonMonths: 1,
                addonUnitPrice: addonCalculation.unitPrice,
                addonQuota: addonCalculation.quota,
                addonQuotaUsed: 0,
                addonStartsAt: addonDates.startedAt,
                addonExpiresAt: addonDates.expiresAt,
                amount: totalAmount,
                planAmount: subtotal,
                setupFee: 0,
                tax,
                currency: curr,
                period: 1,
                periodLabel: `${addonCalculation.quantity} pack${
                    addonCalculation.quantity > 1 ? "s" : ""
                }`,
                paymentStatus: "pending",
                razorpayOrderId: razorpayOrder.id,
                country: country || "",
            });

            return res.status(200).json({
                success: true,
                order: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    receipt: razorpayOrder.receipt,
                    dbOrderId: dbOrder._id.toString(),
                    orderType: "addon",
                    addonType: addonCalculation.addonType,
                    addonName: addonCalculation.addonName,
                    addonQuantity: addonCalculation.quantity,
                    addonMonths: 1,
                    addonQuota: addonCalculation.quota,
                    addonUnitPrice: addonCalculation.unitPrice,
                    subtotal,
                    tax,
                    totalAmount,
                    addonStartsAt: addonDates.startedAt,
                    addonExpiresAt: addonDates.expiresAt,
                },
            });
        }

        // SUBSCRIPTION ORDER
        const normalizedPlanId = normalizePlanId(planId);
        const plan = getPlan(normalizedPlanId);

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan selected",
            });
        }

        const months = Number(period);

        if (
            !Number.isInteger(months) ||
            !Object.prototype.hasOwnProperty.call(DISCOUNTS, months)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid subscription period",
            });
        }

        const calculation = calculateSubscription(
            normalizedPlanId,
            months,
            curr
        );

        if (!calculation) {
            return res.status(400).json({
                success: false,
                message: "Unable to calculate plan amount",
            });
        }

        let appliedVoucherCode = "";
        let voucherDiscount = 0;

        const enteredVoucherCode = String(voucherCode || "")
            .trim()
            .toUpperCase();

        if (enteredVoucherCode) {
            if (curr !== "INR") {
                return res.status(400).json({
                    success: false,
                    message: "Vouchers are available for INR payments only.",
                });
            }

            if (enteredVoucherCode !== "SV-FIRST01") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid voucher code.",
                });
            }

            const assignedVoucher = user.assignedVoucher || {};

            if (assignedVoucher.isUsed) {
                return res.status(400).json({
                    success: false,
                    message: "This voucher has already been used.",
                });
            }

            // Existing paid subscription means no first-purchase voucher.
            const previousPaidSubscription = await Order.exists({
                userId: user._id,
                orderType: "subscription",
                paymentStatus: "paid",
            });

            if (previousPaidSubscription) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Voucher is valid only for your first subscription purchase.",
                });
            }

            // Also reject users whose account already has an active plan.
            if (user.subscription?.status === "active") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Voucher is only available for a new subscription purchase.",
                });
            }

            voucherDiscount = Math.min(
                500,
                Math.max(
                    0,
                    Number(assignedVoucher.discountAmount) || 500
                ),
                Math.max(
                    0,
                    Number(calculation.discountedAmount) || 0
                )
            );

            appliedVoucherCode = enteredVoucherCode;
        }

        const setupFee = calculateSetupFee(user, curr);

        if (!Array.isArray(selectedAddons)) {
            return res.status(400).json({
                success: false,
                message: "Invalid add-ons selection.",
            });
        }

        const allowedAddonTypes = [
            "whatsapp_leads",
            "contacts",
            "ai_chat",
            "pharmacy_invoice",
        ];

        const calculatedAddons = [];

        for (const item of selectedAddons) {
            const addonTypeSelected = item?.addonType;
            const addonQuantity = Number(item?.quantity ?? 1);

            if (
                !allowedAddonTypes.includes(addonTypeSelected) ||
                !Number.isInteger(addonQuantity) ||
                addonQuantity < 1 ||
                addonQuantity > 10
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid add-on or quantity selected.",
                });
            }

            if (
                calculatedAddons.some(
                    (addon) => addon.addonType === addonTypeSelected
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate add-on selected.",
                });
            }

            const addonCalculation = calculateAddon(
                addonTypeSelected,
                addonQuantity,
                curr
            );

            if (!addonCalculation) {
                return res.status(400).json({
                    success: false,
                    message: "Unable to calculate add-on amount.",
                });
            }

            calculatedAddons.push({
                addonType: addonCalculation.addonType,
                quantity: addonCalculation.quantity,
                unitPrice: addonCalculation.unitPrice,
                quota: addonCalculation.quota,
                amount: addonCalculation.amount,
            });
        }

        const addonsAmount = calculatedAddons.reduce(
            (sum, addon) => sum + addon.amount,
            0
        );

        const planAmountAfterVoucher = Math.max(
            0,
            calculation.discountedAmount - voucherDiscount
        );

        const subtotal =
            planAmountAfterVoucher + setupFee + addonsAmount;

        const tax = calculateTax(subtotal, curr);

        const totalAmount =
            Math.round((subtotal + tax) * 100) / 100;

        const razorpayAmount = Math.round(totalAmount * 100);

        const razorpayOrder = await razorpay.orders.create({
            amount: razorpayAmount,
            currency: curr,
            receipt: `salevitals_${Date.now()}`,
            notes: {
                orderType: "subscription",
                planId: normalizedPlanId,
                planName: plan.name,
                period: String(months),
                periodLabel:
                    periodLabel ||
                    `${months} month${months > 1 ? "s" : ""}`,
                planAmount: String(planAmountAfterVoucher),
                originalPlanAmount: String(calculation.originalAmount),
                discountPercentage: String(calculation.discountPercentage),
                discountAmount: String(calculation.discountAmount),
                voucherCode: appliedVoucherCode,
                voucherDiscount: String(voucherDiscount),
                setupFee: String(setupFee),
                tax: String(tax),
                cartTotal: String(totalAmount),
                addonsAmount: String(addonsAmount),
                addons: JSON.stringify(calculatedAddons),
                userId: String(userId),
            },
        });

        const dbOrder = await Order.create({
            userId,
            orderType: "subscription",
            planId: normalizedPlanId,
            planName: plan.name,
            amount: totalAmount,
            planAmount: planAmountAfterVoucher,
            voucherCode: appliedVoucherCode,
            voucherDiscount,
            setupFee,
            tax,
            currency: curr,
            period: months,
            periodLabel:
                periodLabel ||
                `${months} month${months > 1 ? "s" : ""}`,
            addons: calculatedAddons,
            paymentStatus: "pending",
            razorpayOrderId: razorpayOrder.id,
            country: country || "",
        });

        return res.status(200).json({
            success: true,
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
                dbOrderId: dbOrder._id.toString(),
                orderType: "subscription",
                totalAmount,
                planAmount: planAmountAfterVoucher,
                voucherCode: appliedVoucherCode,
                voucherDiscount,
                setupFee,
                tax,
                originalPlanAmount: calculation.originalAmount,
                discountPercentage: calculation.discountPercentage,
                discountAmount: calculation.discountAmount,
            },
        });
    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);

        return res.status(500).json({
            success: false,
            message:
                error?.error?.description ||
                error?.message ||
                "Unable to create payment order",
        });
    }
};




exports.verifyPayment = async (req, res) => {
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
                message: "Payment details are missing",
            });
        }

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }

        const order = await Order.findOne({
            razorpayOrderId: razorpay_order_id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const markVoucherUsed = async (paidOrder) => {
            if (
                paidOrder.orderType !== "subscription" ||
                !paidOrder.voucherCode
            ) {
                return true;
            }

            const normalizedCode = String(
                paidOrder.voucherCode
            ).trim().toUpperCase();

            if (normalizedCode !== "SV-FIRST01") {
                console.error(
                    "UNEXPECTED VOUCHER CODE:",
                    normalizedCode
                );
                return false;
            }

            // First try to consume the matching assigned voucher atomically.
            const updatedUser = await User.findOneAndUpdate(
                {
                    _id: paidOrder.userId,
                    "assignedVoucher.code": normalizedCode,
                    "assignedVoucher.isUsed": false,
                },
                {
                    $set: {
                        "assignedVoucher.isUsed": true,
                        "assignedVoucher.usedAt": new Date(),
                        "assignedVoucher.orderId": paidOrder._id,
                    },
                },
                { new: true }
            );

            if (updatedUser) {
                return true;
            }

            // Idempotent retry for the same order.
            const alreadyUsedByThisOrder = await User.findOne({
                _id: paidOrder.userId,
                "assignedVoucher.code": normalizedCode,
                "assignedVoucher.isUsed": true,
                "assignedVoucher.orderId": paidOrder._id,
            });

            if (alreadyUsedByThisOrder) {
                return true;
            }

            // Public voucher users may not have an assignedVoucher record.
            // Do not silently claim usage was recorded if it was not.
            console.error(
                "VOUCHER USAGE NOT RECORDED:",
                {
                    orderId: String(paidOrder._id),
                    userId: String(paidOrder.userId),
                    voucherCode: normalizedCode,
                }
            );

            return false;
        };

        // Idempotent retry for already-paid orders.
        if (order.paymentStatus === "paid") {
            if (
                order.orderType === "addon" &&
                order.addonActivationStatus !== "activated"
            ) {
                try {
                    await activateAddon(order);

                    order.addonActivationStatus = "activated";
                    await order.save();

                    return res.status(200).json({
                        success: true,
                        message: "Add-on activation completed",
                        order,
                        orderType: order.orderType,
                    });
                } catch (error) {
                    console.error(
                        "ADD-ON RETRY ACTIVATION ERROR:",
                        error.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Payment received, but add-on activation failed. Please retry.",
                    });
                }
            }

            if (
                order.orderType === "subscription" &&
                order.voucherCode
            ) {
                const voucherMarked = await markVoucherUsed(order);

                if (!voucherMarked) {
                    console.error(
                        "Voucher usage could not be confirmed:",
                        order._id
                    );
                }
            }

            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                order,
                orderType: order.orderType,
            });
        }

        const currentYear = new Date().getFullYear();

        if (!order.invoiceNumber) {
            const paidOrdersCount = await Order.countDocuments({
                paymentStatus: "paid",
                invoiceNumber: {
                    $regex: `^SV_${currentYear}_`,
                },
            });

            const invoiceSequence = String(
                paidOrdersCount + 1
            ).padStart(3, "0");

            order.invoiceNumber =
                `SV_${currentYear}_${invoiceSequence}`;
        }

        order.paymentStatus = "paid";
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;

        await order.save();

        let user = await User.findById(order.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (
            order.orderType === "subscription" &&
            order.voucherCode
        ) {
            const voucherMarked = await markVoucherUsed(order);

            if (!voucherMarked) {
                console.error(
                    "Voucher usage could not be confirmed for paid order:",
                    order._id
                );
            }
        }

        user = await activatePaidOrder(order);

        if (order.orderType === "addon") {
            order.addonActivationStatus = "activated";
            await order.save();
        }

        await sendInvoiceIfNeeded(order);

        return res.status(200).json({
            success: true,
            message:
                order.orderType === "addon"
                    ? "Add-on payment verified successfully"
                    : "Payment verified successfully",
            order,
            orderType: order.orderType,

            addon:
                order.orderType === "addon"
                    ? {
                        type: order.addonType,
                        name: order.addonName,
                        quantity: Math.max(
                            1,
                            Math.round(
                                Number(order.addonQuota || 0) /
                                Number(
                                    ADDONS[order.addonType]
                                        ?.quotaPerMonth || 1
                                )
                            )
                        ),
                        months: 1,
                        quota: order.addonQuota,
                        used:
                            user?.addons?.[order.addonType]?.used || 0,
                        startsAt:
                            user?.addons?.[order.addonType]?.startsAt ||
                            order.addonStartsAt,
                        expiresAt:
                            user?.addons?.[order.addonType]?.expiresAt ||
                            order.addonExpiresAt,
                    }
                    : null,

            purchasedAddons:
                order.orderType === "subscription"
                    ? (order.addons || []).map((addon) => ({
                        type: addon.addonType,
                        quantity: addon.quantity,
                        quota: addon.quota,
                        unitPrice: addon.unitPrice,
                        amount: addon.amount,
                        months: 1,
                        startsAt:
                            user?.addons?.[addon.addonType]?.startsAt || null,
                        expiresAt:
                            user?.addons?.[addon.addonType]?.expiresAt || null,
                    }))
                    : [],

            subscription: user?.subscription
                ? {
                    planId: user.subscription.planId || "",
                    planName: user.subscription.planName || "",
                    status: user.subscription.status || "active",
                    billingCycle: user.subscription.billingCycle || "",
                    startedAt: user.subscription.startedAt || null,
                    expiresAt: user.subscription.expiresAt || null,
                    nextBillingAt:
                        user.subscription.nextBillingAt || null,
                    amount: Number(user.subscription.amount || 0),
                    currency: user.subscription.currency || "INR",
                    setupFeePaid: Boolean(
                        user.subscription.setupFeePaid
                    ),
                }
                : null,
        });
    } catch (error) {
        console.error("VERIFY PAYMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to verify payment",
        });
    }
};

