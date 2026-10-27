const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const Order = require("../models/Order");

const AutoPayPlan = require("../models/AutoPayPlan");
const AutoPayWebhookEvent = require("../models/AutoPayWebhookEvent");
const {
    getWorkspaceContext,
} = require("../utils/workspace");



function normalizePlanId(value) {
    return String(value || "").trim().toLowerCase();
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function resolveAutoPayOwner(req, userId) {
    if (typeof getWorkspaceContext === "function") {
        const context = await getWorkspaceContext(req);

        if (!context?.workspaceOwnerId) {
            throw new Error("Unable to verify workspace ownership.");
        }

        return User.findById(context.workspaceOwnerId);
    }

    return User.findById(userId);
}

console.log("RAZORPAY KEY MODE:", {
    keyPrefix: String(process.env.RAZORPAY_KEY_ID || "").slice(0, 9),
});


if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
) {
    console.error("RAZORPAY API CREDENTIALS MISSING");
}


exports.getAutoPayStatus = async (req, res) => {
    try {
        const authorization = req.headers.authorization || "";
        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId =
            decoded.id || decoded._id || decoded.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication",
            });
        }

        const user = await User.findById(userId).select("subscription");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const subscription = user.subscription || {};

        return res.status(200).json({
            success: true,
            autoPay: {
                enabled: Boolean(subscription.autoRenew),
                status: subscription.autoRenewStatus || "disabled",
                subscriptionId: subscription.razorpaySubscriptionId || "",
                nextBillingAt: subscription.nextBillingAt || null,
                expiresAt: subscription.expiresAt || null,
            },
        });
    } catch (error) {
        console.error("AUTOPAY SUBSCRIPTION ERROR:", {
  message: error?.message,
  statusCode: error?.statusCode,
  error: error?.error,
  description: error?.description,
  response: error?.response?.data,
  stack: error?.stack,
});

        return res.status(401).json({
            success: false,
            message: "Unable to verify authentication",
        });
    }
};


async function getOrCreateAutoPayPlan({
    planKey,
    planName,
    currency,
    amount,
    periodMonths,
}) {
    const months = Number(periodMonths);
    const normalizedCurrency = String(currency || "INR").toUpperCase();
    const normalizedAmount = Number(amount);

    if (
        !Number.isInteger(months) ||
        months < 1 ||
        months > 12
    ) {
        throw new Error("Invalid AutoPay billing interval.");
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        throw new Error("Invalid AutoPay plan amount.");
    }

    if (!planKey || !planName) {
        throw new Error("AutoPay plan key and name are required.");
    }

    // Determine mode from the configured Razorpay key.
    const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();

    let mode;

    if (keyId.startsWith("rzp_live_")) {
        mode = "live";
    } else if (keyId.startsWith("rzp_test_")) {
        mode = "test";
    } else {
        throw new Error(
            "Invalid Razorpay Key ID. Expected rzp_live_ or rzp_test_."
        );
    }

    const expectedAmountPaise = Math.round(normalizedAmount * 100);

    // Keep Test and Live plan records separate.
    const modePlanKey = `${mode}_${planKey}`;

    const existingPlan = await AutoPayPlan.findOne({
        planKey: modePlanKey,
    });

    if (existingPlan) {
        if (
            Number(existingPlan.amount) !== normalizedAmount ||
            String(existingPlan.currency).toUpperCase() !== normalizedCurrency ||
            Number(existingPlan.periodMonths) !== months
        ) {
            throw new Error(
                `AutoPay plan configuration mismatch for ${modePlanKey}.`
            );
        }

        try {
            const razorpayPlan = await razorpay.plans.fetch(
                existingPlan.planId
            );

            const actualAmount = Number(razorpayPlan.item?.amount);
            const actualCurrency = String(
                razorpayPlan.item?.currency || ""
            ).toUpperCase();
            const actualPeriod = String(
                razorpayPlan.period || ""
            ).toLowerCase();
            const actualInterval = Number(razorpayPlan.interval);

            if (
                actualAmount !== expectedAmountPaise ||
                actualCurrency !== normalizedCurrency ||
                actualPeriod !== "monthly" ||
                actualInterval !== months
            ) {
                throw new Error(
                    `Razorpay plan details do not match ${modePlanKey}.`
                );
            }

            console.log("AUTOPAY PLAN VERIFIED:", {
                mode,
                planKey: modePlanKey,
                planId: existingPlan.planId,
            });

            return existingPlan;
        } catch (error) {
            console.error("AUTOPAY SAVED PLAN INVALID:", {
                mode,
                planKey: modePlanKey,
                planId: existingPlan.planId,
                statusCode: error?.statusCode,
                message: error?.message,
                description: error?.error?.description,
            });

            throw new Error(
                `Saved ${mode} AutoPay plan is invalid. Check the plan ID and Razorpay credentials before retrying.`
            );
        }
    }

    // Create a new plan using the currently configured Razorpay mode.
    const razorpayPlan = await razorpay.plans.create({
        period: "monthly",
        interval: months,
        item: {
            name: planName,
            amount: expectedAmountPaise,
            currency: normalizedCurrency,
            description:
                `SaleVitals AutoPay - ${planName} ` +
                `(${months} month${months > 1 ? "s" : ""})`,
        },
    });

    const savedPlan = await AutoPayPlan.create({
        planKey: modePlanKey,
        planId: razorpayPlan.id,
        planName,
        currency: normalizedCurrency,
        amount: normalizedAmount,
        periodMonths: months,
    });

    console.log("AUTOPAY PLAN CREATED:", {
        mode,
        planKey: modePlanKey,
        planId: razorpayPlan.id,
        planName,
        periodMonths: months,
        amount: normalizedAmount,
        currency: normalizedCurrency,
    });

    return savedPlan;
}

exports.createAutoPaySubscription = async (req, res) => {
    try {
        if (process.env.AUTOPAY_ENABLED !== "true") {
            return res.status(503).json({
                success: false,
                message: "AutoPay is currently disabled.",
            });
        }

        const authorization = req.headers.authorization || "";
        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id || decoded.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication.",
            });
        }

        const user = await User.findById(userId);

        if (!user || !user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "A verified account is required.",
            });
        }

        const { planId, period = 1, orderId } = req.body || {};
        const normalizedPlan = String(planId || "").trim().toLowerCase();
        const months = Number(period);

        const prices = {
            starter: { name: "Starter", inr: 1453 },
            growth: { name: "Growth", inr: 2453 },
            scale: { name: "Scale", inr: 4453 },
        };

        const discounts = {
            1: 0,
            3: 5,
            6: 7,
            9: 9,
            12: 12,
        };

        if (
            !orderId ||
            !mongoose.Types.ObjectId.isValid(orderId) ||
            !prices[normalizedPlan] ||
            !Object.prototype.hasOwnProperty.call(discounts, months)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order, plan, or billing period.",
            });
        }

        const context = await getWorkspaceContext(req);

        if (!context?.workspaceOwnerId) {
            return res.status(403).json({
                success: false,
                message: "Unable to verify workspace ownership.",
            });
        }

        const owner = await User.findById(context.workspaceOwnerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Workspace owner not found.",
            });
        }

        // Load and validate the original paid order.
        const order = await Order.findById(orderId)
            .select(
                "_id userId orderType paymentStatus planId period billingPeriodEnd addons planAmount currency"
            )
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "The original subscription order was not found.",
            });
        }

        console.log("AUTOPAY ORDER DEBUG:", {
            orderId: String(order._id),
            userId: String(order.userId),
            workspaceOwnerId: String(owner._id),
            orderType: order.orderType || null,
            paymentStatus: order.paymentStatus,
            planId: order.planId,
            period: order.period,
            addons: order.addons || [],
        });

        if (String(order.userId) !== String(owner._id)) {
            return res.status(403).json({
                success: false,
                message: "The order does not belong to this workspace.",
            });
        }

        if (String(order.paymentStatus || "").toLowerCase() !== "paid") {
            return res.status(400).json({
                success: false,
                message: "AutoPay requires a successfully paid order.",
            });
        }

        const storedPlan = String(order.planId || "")
            .trim()
            .toLowerCase();

        const storedPeriod = Number(order.period);

        const isLegacySubscriptionOrder =
            !order.orderType &&
            storedPlan === normalizedPlan &&
            storedPeriod === months;

        if (
            (
                String(order.orderType || "").toLowerCase() !== "subscription" &&
                !isLegacySubscriptionOrder
            ) ||
            storedPlan !== normalizedPlan ||
            storedPeriod !== months
        ) {
            return res.status(400).json({
                success: false,
                message: "The paid order does not match the selected subscription.",
            });
        }

        // Verify the active subscription.
        const subscription = owner.subscription || {};
        const existingExpiry = subscription.expiresAt
            ? new Date(subscription.expiresAt)
            : null;

        const activePlan =
            String(subscription.status || "").toLowerCase() === "active" &&
            existingExpiry &&
            Number.isFinite(existingExpiry.getTime()) &&
            existingExpiry.getTime() > Date.now();

        if (!activePlan) {
            return res.status(409).json({
                success: false,
                message: "The current CRM plan is not active.",
            });
        }

        if (
            String(subscription.planId || "").toLowerCase() !== normalizedPlan
        ) {
            return res.status(409).json({
                success: false,
                message: "AutoPay plan does not match the active CRM plan.",
            });
        }

        // Calculate recurring price.
        const discountedPlanAmount = Math.round(
            prices[normalizedPlan].inr *
                months *
                (1 - discounts[months] / 100) *
                100
        ) / 100;

        // Only monthly subscription add-ons recur automatically.
        // Contacts and AI chatbot are pack-based add-ons, not monthly
        // subscriptions in the current checkout UI.
        const monthlyAddonPrices = {
            pharmacy_invoice: 1000,
            whatsapp_leads: 1000,
        };

        const includedAddons = [];
        let addonsTotal = 0;
        const now = new Date();

        for (const addonType of Object.keys(monthlyAddonPrices)) {
            const addon = owner.addons?.[addonType];

            if (!addon || addon.enabled !== true) {
                continue;
            }

            const expiry = addon.expiresAt
                ? new Date(addon.expiresAt)
                : null;

            if (
                !expiry ||
                !Number.isFinite(expiry.getTime()) ||
                expiry.getTime() <= now.getTime()
            ) {
                continue;
            }

            const monthlyAmount = Number(
                addon.unitPrice || monthlyAddonPrices[addonType]
            );

            if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
                throw new Error(
                    `Invalid monthly add-on price: ${addonType}`
                );
            }

            addonsTotal += monthlyAmount * months;

            includedAddons.push({
                addonType,
                quantity: 1,
                monthlyAmount,
            });
        }

        addonsTotal = Math.round(addonsTotal * 100) / 100;

        const recurringSubtotal = Math.round(
            (discountedPlanAmount + addonsTotal) * 100
        ) / 100;

        const recurringTax = Math.round(
            recurringSubtotal * 0.18 * 100
        ) / 100;

        const recurringAmount = Math.round(
            (recurringSubtotal + recurringTax) * 100
        ) / 100;

        const expectedAmountPaise = Math.round(recurringAmount * 100);

        console.log("AUTOPAY VERIFIED CALCULATION:", {
            planId: normalizedPlan,
            months,
            planAmount: discountedPlanAmount,
            includedAddons,
            addonsTotal,
            subtotal: recurringSubtotal,
            tax: recurringTax,
            recurringAmount,
            expectedAmountPaise,
        });

        // Use the verified paid period end.
        const paidExpiry = order.billingPeriodEnd
            ? new Date(order.billingPeriodEnd)
            : existingExpiry;

        if (
            !paidExpiry ||
            !Number.isFinite(paidExpiry.getTime()) ||
            paidExpiry.getTime() <= Date.now()
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "The paid subscription expiry could not be verified.",
            });
        }

        const startAt = Math.floor(paidExpiry.getTime() / 1000);
        const totalCount = Math.floor(120 / months);

        // Check an existing Razorpay subscription before creating another.
        const existingSubscriptionId = String(
            subscription.razorpaySubscriptionId || ""
        ).trim();

        if (existingSubscriptionId) {
            let existingRazorpaySubscription;

            try {
                existingRazorpaySubscription =
                    await razorpay.subscriptions.fetch(existingSubscriptionId);
            } catch (error) {
                console.error("AUTOPAY FETCH ERROR:", {
                    subscriptionId: existingSubscriptionId,
                    message: error.message,
                });

                return res.status(503).json({
                    success: false,
                    message:
                        "Unable to verify the existing AutoPay subscription.",
                });
            }

            const status = String(
                existingRazorpaySubscription?.status || ""
            ).toLowerCase();

            console.log("AUTOPAY EXISTING SUBSCRIPTION:", {
                subscriptionId: existingSubscriptionId,
                status,
            });

            if (status === "created") {
                let oldPlan;

                try {
                    const oldPlanId = existingRazorpaySubscription.plan_id;

                    if (!oldPlanId) {
                        throw new Error("Existing subscription has no plan ID.");
                    }

                    oldPlan = await razorpay.plans.fetch(oldPlanId);
                } catch (error) {
                    console.error("AUTOPAY OLD PLAN FETCH ERROR:", error.message);

                    return res.status(409).json({
                        success: false,
                        message:
                            "The existing AutoPay plan could not be verified. Do not authorize the pending subscription.",
                    });
                }

                const oldAmountPaise = Number(oldPlan.item?.amount);
                const oldCurrency = String(
                    oldPlan.item?.currency || ""
                ).toUpperCase();

                const oldPeriod = String(
                    oldPlan.period || ""
                ).toLowerCase();

                const oldInterval = Number(oldPlan.interval);

                console.log("AUTOPAY EXISTING PLAN COMPARISON:", {
                    subscriptionId: existingSubscriptionId,
                    oldPlanId: oldPlan.id,
                    oldAmountPaise,
                    expectedAmountPaise,
                    oldCurrency,
                    oldPeriod,
                    oldInterval,
                    months,
                });

                if (
                    oldAmountPaise === expectedAmountPaise &&
                    oldCurrency === "INR" &&
                    oldPeriod === "monthly" &&
                    oldInterval === months
                ) {
                    return res.status(200).json({
                        success: true,
                        subscriptionId: existingSubscriptionId,
                        keyId: process.env.RAZORPAY_KEY_ID,
                        planName: prices[normalizedPlan].name,
                        periodMonths: months,
                        resumeAuthorization: true,
                        recurringAmount,
                        currency: "INR",
                        message:
                            "The existing AutoPay subscription matches the verified amount.",
                    });
                }

                // Do not resume or silently replace a mismatched mandate.
                return res.status(409).json({
                    success: false,
                    message:
                        "A pending AutoPay subscription has a different amount. Cancel it safely in Razorpay before creating a replacement.",
                    subscriptionId: existingSubscriptionId,
                    existingAmount: Number.isFinite(oldAmountPaise)
                        ? oldAmountPaise / 100
                        : null,
                    expectedAmount: recurringAmount,
                });
            }

            if (
                ["active", "authenticated", "pending", "halted", "paused"].includes(
                    status
                )
            ) {
                return res.status(409).json({
                    success: false,
                    message: `The existing AutoPay subscription is ${status}.`,
                    subscriptionId: existingSubscriptionId,
                });
            }

            if (!["cancelled", "completed", "expired"].includes(status)) {
                return res.status(409).json({
                    success: false,
                    message:
                        "The existing AutoPay status is not confirmed. Contact support before creating another subscription.",
                });
            }

            // Clear only a terminal subscription confirmed by Razorpay.
            subscription.autoRenew = false;
            subscription.autoRenewStatus = status;
            subscription.razorpaySubscriptionId = "";
            subscription.razorpayPlanId = "";
        }

        const planKey = [
            normalizedPlan,
            months,
            "INR",
            expectedAmountPaise,
        ].join("_");

        const savedPlan = await getOrCreateAutoPayPlan({
            planKey,
            planName:
                `SaleVitals ${prices[normalizedPlan].name} - ${months} month(s)`,
            currency: "INR",
            amount: recurringAmount,
            periodMonths: months,
        });

        if (
            !savedPlan?.planId ||
            Math.round(Number(savedPlan.amount) * 100) !==
                expectedAmountPaise ||
            String(savedPlan.currency || "").toUpperCase() !== "INR" ||
            Number(savedPlan.periodMonths) !== months
        ) {
            throw new Error(
                "Saved AutoPay plan does not match the calculated amount."
            );
        }

        const razorpayPlan = await razorpay.plans.fetch(savedPlan.planId);

        if (
            Number(razorpayPlan.item?.amount) !== expectedAmountPaise ||
            String(razorpayPlan.item?.currency || "").toUpperCase() !== "INR" ||
            String(razorpayPlan.period || "").toLowerCase() !== "monthly" ||
            Number(razorpayPlan.interval) !== months
        ) {
            throw new Error(
                "Razorpay plan amount or billing interval mismatch."
            );
        }

        let razorpaySubscription;

        try {
            console.log("AUTOPAY CREATING SUBSCRIPTION:", {
                planId: savedPlan.planId,
                amount: recurringAmount,
                startAt,
                totalCount,
            });

            razorpaySubscription = await razorpay.subscriptions.create({
                plan_id: savedPlan.planId,
                total_count: totalCount,
                customer_notify: true,
                start_at: startAt,
                notes: {
                    userId: String(owner._id),
                    orderId: String(order._id),
                    planId: normalizedPlan,
                    periodMonths: String(months),
                    includedAddons: JSON.stringify(includedAddons),
                    subtotal: String(recurringSubtotal),
                    tax: String(recurringTax),
                    total: String(recurringAmount),
                    setupFeeIncluded: "false",
                },
            });

            console.log("AUTOPAY SUBSCRIPTION CREATED:", {
                subscriptionId: razorpaySubscription.id,
                status: razorpaySubscription.status,
                planId: razorpaySubscription.plan_id,
            });
        } catch (error) {
            console.error("AUTOPAY RAZORPAY CREATE ERROR:", {
                message: error?.message,
                statusCode: error?.statusCode,
                description:
                    error?.error?.description || error?.description,
                code: error?.error?.code || error?.code,
            });

            throw error;
        }

        owner.subscription = {
            ...(typeof subscription.toObject === "function"
                ? subscription.toObject()
                : subscription),
            autoRenew: false,
            autoRenewStatus: "pending",
            razorpaySubscriptionId: razorpaySubscription.id,
            razorpayPlanId: savedPlan.planId,
        };

        await owner.save();

        return res.status(200).json({
            success: true,
            subscriptionId: razorpaySubscription.id,
            keyId: process.env.RAZORPAY_KEY_ID,
            planName: prices[normalizedPlan].name,
            periodMonths: months,
            includedAddons,
            subtotal: recurringSubtotal,
            tax: recurringTax,
            recurringAmount,
            currency: "INR",
            startAt,
            message:
                "AutoPay subscription created for the verified plan expiry.",
        });
    } catch (error) {
        console.error("AUTOPAY SUBSCRIPTION ERROR:", {
            message: error?.message,
            statusCode: error?.statusCode,
            description: error?.description,
            response: error?.response?.data,
            stack: error?.stack,
        });

        return res.status(500).json({
            success: false,
            message: "Unable to create AutoPay subscription.",
            error:
                error?.error?.description ||
                error?.description ||
                error?.message ||
                "Unknown Razorpay error",
        });
    }
};


exports.handleAutoPayWebhook = async (req, res) => {
    let processingEventId = null;

    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("AUTOPAY WEBHOOK SECRET NOT CONFIGURED");
            return res.status(500).json({
                success: false,
                message: "Webhook is not configured",
            });
        }

        const signature = req.headers["x-razorpay-signature"];

        if (!signature || !Buffer.isBuffer(req.rawBody)) {
            return res.status(400).json({
                success: false,
                message: "Missing webhook signature or raw body",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(req.rawBody)
            .digest("hex");

        let received;
        try {
            received = Buffer.from(String(signature), "hex");
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid webhook signature",
            });
        }

        const expected = Buffer.from(expectedSignature, "hex");

        if (
            received.length !== expected.length ||
            !crypto.timingSafeEqual(received, expected)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid webhook signature",
            });
        }

        const event = req.body?.event;
        const payload = req.body?.payload || {};
        const eventId = req.headers["x-razorpay-event-id"];

        if (!event || typeof event !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing webhook event",
            });
        }

        if (!eventId || typeof eventId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing Razorpay event ID",
            });
        }

        const subscriptionEntity = payload.subscription?.entity || {};
        const paymentEntity = payload.payment?.entity || {};
        const webhookNotes = subscriptionEntity.notes || {};

        // Claim a new event, or allow a failed event to be retried.
        let webhookEventRecord = await AutoPayWebhookEvent.findOneAndUpdate(
            {
                eventId,
                status: "failed",
            },
            {
                $set: {
                    eventType: event,
                    razorpaySubscriptionId: subscriptionEntity.id || "",
                    status: "received",
                    errorMessage: "",
                    processedAt: null,
                },
            },
            { new: true }
        );

        if (!webhookEventRecord) {
            try {
                webhookEventRecord = await AutoPayWebhookEvent.create({
                    eventId,
                    eventType: event,
                    razorpaySubscriptionId: subscriptionEntity.id || "",
                    status: "received",
                });
            } catch (error) {
                if (error.code === 11000) {
                    const existingEvent = await AutoPayWebhookEvent.findOne({
                        eventId,
                    }).lean();

                    if (existingEvent?.status === "processed") {
                        return res.status(200).json({
                            success: true,
                            received: true,
                            duplicate: true,
                        });
                    }

                    // Another request may currently be processing this event.
                    return res.status(503).json({
                        success: false,
                        received: true,
                        message: "Webhook event is already being processed.",
                    });
                }

                throw error;
            }
        }

        processingEventId = webhookEventRecord._id;

        console.log("VERIFIED RAZORPAY WEBHOOK EVENT:", event);

        if (event === "subscription.charged") {
            const razorpaySubscriptionId = subscriptionEntity.id || "";
            const razorpayPaymentId = paymentEntity.id || "";

            if (!razorpaySubscriptionId || !razorpayPaymentId) {
                throw new Error(
                    "Subscription charge is missing payment details."
                );
            }

            if (
                String(paymentEntity.status || "").toLowerCase() !==
                "captured"
            ) {
                throw new Error("AutoPay payment is not captured.");
            }

            const user = await User.findOne({
                "subscription.razorpaySubscriptionId":
                    razorpaySubscriptionId,
            });

            if (!user) {
                throw new Error(
                    "AutoPay subscription does not match a user."
                );
            }

            if (
                webhookNotes.userId &&
                String(webhookNotes.userId) !== String(user._id)
            ) {
                throw new Error("AutoPay subscription user mismatch.");
            }

            const savedPlan = await AutoPayPlan.findOne({
                planId: user.subscription.razorpayPlanId,
            }).lean();

            if (
                !savedPlan ||
                !Number.isInteger(savedPlan.periodMonths) ||
                savedPlan.periodMonths < 1 ||
                savedPlan.periodMonths > 12
            ) {
                throw new Error("Saved AutoPay plan is invalid.");
            }

            const paidAmount = Number(paymentEntity.amount) / 100;
            const paidCurrency = String(
                paymentEntity.currency || ""
            ).toUpperCase();
            const savedCurrency = String(
                savedPlan.currency || ""
            ).toUpperCase();

            if (
                !Number.isFinite(paidAmount) ||
                paidAmount <= 0 ||
                paidCurrency !== savedCurrency ||
                Math.round(paidAmount * 100) !==
                    Math.round(Number(savedPlan.amount) * 100)
            ) {
                throw new Error(
                    "AutoPay payment amount or currency mismatch."
                );
            }

            // Recover the Order if an earlier attempt created it.
            let order = await Order.findOne({
                razorpayPaymentId,
                isAutoRenewal: true,
            });

            let periodStart;
            let periodEnd;

            if (order) {
                periodStart = order.billingPeriodStart;
                periodEnd = order.billingPeriodEnd;

                if (
                    !periodStart ||
                    !periodEnd ||
                    !Number.isFinite(new Date(periodStart).getTime()) ||
                    !Number.isFinite(new Date(periodEnd).getTime())
                ) {
                    throw new Error(
                        "Existing AutoPay order has invalid billing dates."
                    );
                }

                periodStart = new Date(periodStart);
                periodEnd = new Date(periodEnd);
            } else {
                const now = new Date();
                const currentExpiry = user.subscription.expiresAt
                    ? new Date(user.subscription.expiresAt)
                    : null;

                periodStart =
                    currentExpiry &&
                    Number.isFinite(currentExpiry.getTime()) &&
                    currentExpiry > now
                        ? currentExpiry
                        : now;

                periodEnd = new Date(periodStart);
                periodEnd.setUTCMonth(
                    periodEnd.getUTCMonth() + savedPlan.periodMonths
                );

                const tax =
                    Math.round(
                        (paidAmount - paidAmount / 1.18) * 100
                    ) / 100;

                const planAmount =
                    Math.round((paidAmount - tax) * 100) / 100;

                order = await Order.create({
                    userId: user._id,
                    orderType: "subscription",
                    planId: user.subscription.planId,
                    planName:
                        user.subscription.planName || savedPlan.planName,
                    amount: paidAmount,
                    planAmount,
                    tax,
                    currency: savedCurrency,
                    period: savedPlan.periodMonths,
                    periodLabel: `${savedPlan.periodMonths} month(s)`,
                    paymentStatus: "paid",
                    razorpayPaymentId,
                    isAutoRenewal: true,
                    razorpaySubscriptionId,
                    billingPeriodStart: periodStart,
                    billingPeriodEnd: periodEnd,
                });
            }

            // Idempotency check: do not apply the same billing period twice.
            const currentExpiry = user.subscription.expiresAt
                ? new Date(user.subscription.expiresAt)
                : null;

            if (
                currentExpiry &&
                Number.isFinite(currentExpiry.getTime()) &&
                currentExpiry >= periodEnd
            ) {
                await AutoPayWebhookEvent.updateOne(
                    { _id: processingEventId },
                    {
                        $set: {
                            status: "processed",
                            processedAt: new Date(),
                            errorMessage: "",
                        },
                    }
                );

                return res.status(200).json({
                    success: true,
                    received: true,
                    duplicatePayment: true,
                    message: "This billing period has already been applied.",
                });
            }

            // Validate add-on notes before changing the user.
            let includedAddons;

            try {
                includedAddons = JSON.parse(
                    webhookNotes.includedAddons || "[]"
                );
            } catch {
                throw new Error(
                    "AutoPay included add-ons data is invalid."
                );
            }

            if (!Array.isArray(includedAddons)) {
                throw new Error(
                    "AutoPay included add-ons data is invalid."
                );
            }

            const allowedAddonTypes = new Set([
                "contacts",
                "ai_chat",
                "pharmacy_invoice",
                "whatsapp_leads",
            ]);

            const now = new Date();

            for (const item of includedAddons) {
                const addonType = String(item?.addonType || "");

                if (!allowedAddonTypes.has(addonType)) {
                    throw new Error(
                        `Invalid AutoPay add-on: ${addonType}`
                    );
                }

                const addon = user.addons?.[addonType];

                if (!addon) {
                    throw new Error(
                        `Add-on record not found: ${addonType}`
                    );
                }

                const oldExpiry = addon.expiresAt
                    ? new Date(addon.expiresAt)
                    : null;

                const isStillActive =
                    addon.enabled === true &&
                    oldExpiry &&
                    Number.isFinite(oldExpiry.getTime()) &&
                    oldExpiry > now;

                // Extend an active add-on from its expiry.
                // Otherwise align it with the renewed billing period.
                const addonStart = isStillActive
                    ? oldExpiry
                    : periodStart;

                const addonEnd = new Date(addonStart);
                addonEnd.setUTCMonth(
                    addonEnd.getUTCMonth() + savedPlan.periodMonths
                );

                addon.enabled = true;
                addon.startsAt = isStillActive
                    ? addon.startsAt || periodStart
                    : periodStart;
                addon.expiresAt = addonEnd;
                addon.months =
                    Number(addon.months || 0) +
                    savedPlan.periodMonths;
                addon.orderId = order._id;
                addon.paymentId = razorpayPaymentId;
            }

            user.subscription.expiresAt = periodEnd;
            user.subscription.nextBillingAt = periodEnd;
            user.subscription.status = "active";
            user.subscription.autoRenew = true;
            user.subscription.autoRenewStatus = "active";
            user.subscription.lastRenewalPaymentId = razorpayPaymentId;
            user.subscription.orderId = order._id;
            user.subscription.amount = paidAmount;
            user.subscription.currency = savedCurrency;

            await user.save();

            console.log("AutoPay renewal processed:", {
                userId: String(user._id),
                orderId: String(order._id),
                razorpayPaymentId,
                expiresAt: periodEnd,
            });
        }

        const lifecycleEvents = [
            "subscription.activated",
            "subscription.authenticated",
            "subscription.halted",
            "subscription.cancelled",
            "subscription.paused",
        ];

        if (lifecycleEvents.includes(event)) {
            const subscriptionId = subscriptionEntity.id || "";

            if (subscriptionId) {
                const user = await User.findOne({
                    "subscription.razorpaySubscriptionId": subscriptionId,
                });

                if (user) {
                    if (event === "subscription.activated") {
                        user.subscription.autoRenewStatus = "active";
                        user.subscription.autoRenew = true;
                    } else if (event === "subscription.authenticated") {
                        user.subscription.autoRenewStatus = "authenticated";
                        user.subscription.autoRenew = false;
                    } else if (event === "subscription.halted") {
                        user.subscription.autoRenewStatus = "halted";
                        user.subscription.autoRenew = false;
                    } else if (event === "subscription.cancelled") {
                        user.subscription.autoRenewStatus = "cancelled";
                        user.subscription.autoRenew = false;
                    } else if (event === "subscription.paused") {
                        user.subscription.autoRenewStatus = "halted";
                        user.subscription.autoRenew = false;
                    }

                    await user.save();
                }
            }
        }

        await AutoPayWebhookEvent.updateOne(
            { _id: processingEventId },
            {
                $set: {
                    status: "processed",
                    processedAt: new Date(),
                    errorMessage: "",
                },
            }
        );

        return res.status(200).json({
            success: true,
            received: true,
        });
    } catch (error) {
        console.error("AUTOPAY WEBHOOK ERROR:", {
            message: error?.message,
            stack: error?.stack,
        });

        if (processingEventId) {
            try {
                await AutoPayWebhookEvent.updateOne(
                    { _id: processingEventId },
                    {
                        $set: {
                            status: "failed",
                            errorMessage: String(error?.message || "Unknown error"),
                        },
                    }
                );
            } catch (saveError) {
                console.error(
                    "AUTOPAY EVENT SAVE ERROR:",
                    saveError.message
                );
            }
        }

        return res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
};


exports.verifyAutoPayAuthorization = async (req, res) => {
    try {
        if (process.env.AUTOPAY_ENABLED !== "true") {
            return res.status(503).json({
                success: false,
                message: "AutoPay is currently disabled.",
            });
        }

        const authorization = req.headers.authorization || "";
        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id || decoded.userId;

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
        } = req.body || {};

        if (
            !userId ||
            !razorpay_payment_id ||
            !razorpay_subscription_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Authorization details are incomplete.",
            });
        }

        const user = await User.findById(userId);

        if (
            !user ||
            user.subscription?.razorpaySubscriptionId !==
                razorpay_subscription_id
        ) {
            return res.status(400).json({
                success: false,
                message: "Subscription does not match this account.",
            });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            console.error("RAZORPAY_KEY_SECRET is missing.");

            return res.status(503).json({
                success: false,
                message: "Payment verification is not configured.",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(
                `${razorpay_payment_id}|${razorpay_subscription_id}`
            )
            .digest("hex");

        const received = Buffer.from(razorpay_signature, "hex");
        const expected = Buffer.from(expectedSignature, "hex");

        if (
            received.length !== expected.length ||
            !crypto.timingSafeEqual(received, expected)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid authorization signature.",
            });
        }

        // Signature verified. Keep billing activation tied to
        // Razorpay subscription lifecycle events/webhook.
        user.subscription.autoRenewStatus = "authenticated";
        user.subscription.autoRenewAuthorizedAt = new Date();
        user.subscription.lastRenewalPaymentId = razorpay_payment_id;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "AutoPay authorization verified successfully.",
            autoRenewStatus: user.subscription.autoRenewStatus,
        });
    } catch (error) {
        console.error(
            "AUTOPAY AUTH VERIFICATION ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify AutoPay authorization.",
        });
    }
};

