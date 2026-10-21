const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const Order = require("../models/Order");

const AutoPayPlan = require("../models/AutoPayPlan");
const AutoPayWebhookEvent = require("../models/AutoPayWebhookEvent");


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
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
                message: "Authentication required",
            });
        }

        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id || decoded.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication",
            });
        }

        const user = await User.findById(userId);

        if (!user || !user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "A verified account is required.",
            });
        }

        const { planId, period = 1 } = req.body;
        const normalizedPlan = String(planId || "").toLowerCase();
        const months = Number(period);

        const prices = {
            starter: { name: "Starter", inr: 1953 },
            growth: { name: "Growth", inr: 2953 },
            scale: { name: "Scale", inr: 4953 },
        };

        const discounts = {
            1: 0,
            3: 5,
            6: 7,
            9: 9,
            12: 12,
            24: 15,
        };

        if (
            !prices[normalizedPlan] ||
            !Object.prototype.hasOwnProperty.call(discounts, months)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan or billing period.",
            });
        }

        const subscription = user.subscription || {};

        const existingExpiry = subscription.expiresAt
            ? new Date(subscription.expiresAt)
            : null;

        const activePlan =
            subscription.status === "active" &&
            existingExpiry &&
            Number.isFinite(existingExpiry.getTime()) &&
            existingExpiry.getTime() > Date.now();

        // Block creating another subscription if AutoPay is already active.
        const existingAutoPayStatus = subscription.autoRenewStatus;
        const hasExistingSubscription = Boolean(
            subscription.razorpaySubscriptionId
        );

        if (
            hasExistingSubscription &&
            subscription.autoRenew === true &&
            ["authenticated", "active"].includes(existingAutoPayStatus)
        ) {
            return res.status(409).json({
                success: false,
                message: "AutoPay is already enabled for this account.",
            });
        }

        const monthlyPlanPrice = prices[normalizedPlan].inr;

        const discountedPlanAmount =
            Math.round(
                monthlyPlanPrice *
                    months *
                    (1 - discounts[months] / 100) *
                    100
            ) / 100;

        // Calculate saved, active add-ons from the user's account.
        const addonPrices = {
            contacts: 500,
            ai_chat: 500,
            pharmacy_invoice: 1000,
            whatsapp_leads: 1000,
        };

        const userAddons = user.addons || {};
        const now = Date.now();

        let addonsMonthly = 0;
        const includedAddons = [];

        for (const [addonType, addonPrice] of Object.entries(addonPrices)) {
            const addon = userAddons[addonType];

            if (!addon || addon.enabled !== true) {
                continue;
            }

            if (addon.status && addon.status !== "active") {
                continue;
            }

            const expiry = addon.expiresAt
                ? new Date(addon.expiresAt).getTime()
                : 0;

            if (!expiry || !Number.isFinite(expiry) || expiry <= now) {
                continue;
            }

            const isMonthlyAddon = [
                "pharmacy_invoice",
                "whatsapp_leads",
            ].includes(addonType);

            const rawQuantity = Number(
                addon.quantity ??
                    addon.quantityPurchased ??
                    addon.packs ??
                    1
            );

            if (
                !Number.isFinite(rawQuantity) ||
                !Number.isInteger(rawQuantity) ||
                rawQuantity < 1 ||
                rawQuantity > 10
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid saved quantity for add-on: ${addonType}`,
                });
            }

            const quantity = isMonthlyAddon ? 1 : rawQuantity;
            const monthlyAmount = addonPrice * quantity;

            addonsMonthly += monthlyAmount;

            includedAddons.push({
                addonType,
                quantity,
                monthlyAmount,
            });
        }

        // Apply discount to plan only; add-ons are charged per month.
        const recurringSubtotal =
            Math.round(
                (discountedPlanAmount + addonsMonthly * months) * 100
            ) / 100;

        const recurringTax =
            Math.round(recurringSubtotal * 0.18 * 100) / 100;

        const recurringAmount =
            Math.round((recurringSubtotal + recurringTax) * 100) / 100;

        const planKey = [
            normalizedPlan,
            months,
            "INR",
            Math.round(recurringAmount * 100),
        ].join("_");

        const savedPlan = await getOrCreateAutoPayPlan({
            planKey,
            planName: `SaleVitals ${prices[normalizedPlan].name} - ${months} month(s)`,
            currency: "INR",
            amount: recurringAmount,
            periodMonths: months,
        });

        // Existing active customers should start after their current plan expires.
        const startAt = activePlan
            ? Math.floor(existingExpiry.getTime() / 1000)
            : undefined;

        console.log("AUTOPAY DATE DEBUG:", {
            activePlan: Boolean(activePlan),
            expiresAt: subscription.expiresAt,
            existingExpiryISO: existingExpiry?.toISOString() || null,
            startAtUnix: startAt || null,
            startAtDate: startAt
                ? new Date(startAt * 1000).toISOString()
                : null,
            periodMonths: months,
        });

        // Approximately 120 months of billing cycles.
        const totalCount = Math.floor(120 / months);

        console.log("AUTOPAY SCHEDULE:", {
            currentPlanExpiry: existingExpiry?.toISOString() || null,
            startAt: startAt
                ? new Date(startAt * 1000).toISOString()
                : null,
            totalCount,
            months,
            planId: savedPlan.planId,
            recurringAmount,
        });

        const razorpaySubscription = await razorpay.subscriptions.create({
            plan_id: savedPlan.planId,
            total_count: totalCount,
            customer_notify: true,
            ...(startAt ? { start_at: startAt } : {}),
            notes: {
                userId: String(user._id),
                planId: normalizedPlan,
                periodMonths: String(months),
                includedAddons: JSON.stringify(includedAddons),
                subtotal: String(recurringSubtotal),
                tax: String(recurringTax),
                total: String(recurringAmount),
            },
        });

        console.log("RAZORPAY CREATED SUBSCRIPTION:", {
            id: razorpaySubscription.id,
            status: razorpaySubscription.status,
            start_at: razorpaySubscription.start_at
                ? new Date(
                      razorpaySubscription.start_at * 1000
                  ).toISOString()
                : null,
            charge_at: razorpaySubscription.charge_at
                ? new Date(
                      razorpaySubscription.charge_at * 1000
                  ).toISOString()
                : null,
            end_at: razorpaySubscription.end_at
                ? new Date(
                      razorpaySubscription.end_at * 1000
                  ).toISOString()
                : null,
            total_count: razorpaySubscription.total_count,
        });

        // Save pending authorization without changing current plan expiry.
        subscription.autoRenew = false;
        subscription.autoRenewStatus = "pending";
        subscription.razorpaySubscriptionId = razorpaySubscription.id;
        subscription.razorpayPlanId = savedPlan.planId;

        user.subscription = subscription;
        await user.save();

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
            startAt: startAt || null,
            message:
                "Subscription created. Customer authorization is still required.",
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
    let webhookEventRecord = null;

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

        const received = Buffer.from(String(signature), "hex");
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

        if (!event || typeof event !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing webhook event",
            });
        }

        const eventId = req.headers["x-razorpay-event-id"];

        if (!eventId || typeof eventId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing Razorpay event ID",
            });
        }

        const subscriptionEntity =
            payload.subscription?.entity || {};
        const paymentEntity =
            payload.payment?.entity || {};
        const webhookNotes = subscriptionEntity.notes || {};

        try {
            webhookEventRecord = await AutoPayWebhookEvent.create({
                eventId,
                eventType: event,
                razorpaySubscriptionId: subscriptionEntity.id || "",
                status: "received",
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(200).json({
                    success: true,
                    received: true,
                    duplicate: true,
                });
            }
            throw error;
        }

        console.log("VERIFIED RAZORPAY WEBHOOK EVENT:", event);

        // Handle a successful recurring subscription charge.
        if (event === "subscription.charged") {
            const razorpaySubscriptionId = subscriptionEntity.id || "";
            const razorpayPaymentId = paymentEntity.id || "";

            if (!razorpaySubscriptionId || !razorpayPaymentId) {
                throw new Error("Subscription charge is missing payment details.");
            }

            // A charged event must refer to a captured payment.
            if (paymentEntity.status !== "captured") {
                throw new Error("AutoPay payment is not captured.");
            }

            // Avoid processing the same payment more than once.
            const duplicatePayment = await Order.findOne({
                razorpayPaymentId,
                isAutoRenewal: true,
            });

            if (duplicatePayment) {
                webhookEventRecord.status = "processed";
                webhookEventRecord.processedAt = new Date();
                await webhookEventRecord.save();

                return res.status(200).json({
                    success: true,
                    received: true,
                    duplicatePayment: true,
                });
            }

            const user = await User.findOne({
                "subscription.razorpaySubscriptionId":
                    razorpaySubscriptionId,
            });

            if (!user) {
                throw new Error("AutoPay subscription does not match a user.");
            }

            if (
                webhookNotes.userId &&
                String(webhookNotes.userId) !== String(user._id)
            ) {
                throw new Error("AutoPay subscription user mismatch.");
            }

            const savedPlan = await AutoPayPlan.findOne({
                planId: user.subscription.razorpayPlanId,
            });

            if (
                !savedPlan ||
                !Number.isInteger(savedPlan.periodMonths) ||
                savedPlan.periodMonths < 1
            ) {
                throw new Error("Saved AutoPay plan is invalid.");
            }

            const paidAmount = Number(paymentEntity.amount) / 100;

            if (
                !Number.isFinite(paidAmount) ||
                paidAmount <= 0 ||
                paymentEntity.currency !== savedPlan.currency ||
                Math.round(paidAmount * 100) !==
                    Math.round(Number(savedPlan.amount) * 100)
            ) {
                throw new Error("AutoPay payment amount or currency mismatch.");
            }

            const now = new Date();
            const existingExpiry = user.subscription.expiresAt
                ? new Date(user.subscription.expiresAt)
                : null;

            const periodStart =
                existingExpiry && existingExpiry > now
                    ? existingExpiry
                    : now;

            const periodEnd = new Date(periodStart);
            periodEnd.setUTCMonth(
                periodEnd.getUTCMonth() + savedPlan.periodMonths
            );

            // The configured plan amount includes 18% tax.
            const tax = Math.round(
                (paidAmount - paidAmount / 1.18) * 100
            ) / 100;
            const planAmount = Math.round((paidAmount - tax) * 100) / 100;

            // Create the paid renewal order.
            const order = await Order.create({
                userId: user._id,
                orderType: "subscription",
                planId: user.subscription.planId,
                planName:
                    user.subscription.planName || savedPlan.planName,
                amount: paidAmount,
                planAmount,
                tax,
                currency: savedPlan.currency,
                period: savedPlan.periodMonths,
                periodLabel: `${savedPlan.periodMonths} month(s)`,
                paymentStatus: "paid",
                razorpayPaymentId,
                isAutoRenewal: true,
                razorpaySubscriptionId,
                billingPeriodStart: periodStart,
                billingPeriodEnd: periodEnd,
            });

            user.subscription.expiresAt = periodEnd;
            user.subscription.nextBillingAt = periodEnd;
            user.subscription.status = "active";
            user.subscription.autoRenew = true;
            user.subscription.autoRenewStatus = "active";
            user.subscription.lastRenewalPaymentId = razorpayPaymentId;
            user.subscription.orderId = order._id;
            user.subscription.amount = paidAmount;
            user.subscription.currency = savedPlan.currency;

            await user.save();

            console.log("AutoPay renewal processed:", {
                userId: String(user._id),
                orderId: String(order._id),
                razorpayPaymentId,
                expiresAt: periodEnd,
            });
        }

        // Update subscription state from Razorpay lifecycle events.
        if (
            event === "subscription.activated" ||
            event === "subscription.authenticated" ||
            event === "subscription.halted" ||
            event === "subscription.cancelled" ||
            event === "subscription.paused"
        ) {
            const subscriptionId = subscriptionEntity.id || "";

            if (subscriptionId) {
                const user = await User.findOne({
                    "subscription.razorpaySubscriptionId": subscriptionId,
                });

                if (user) {
                    if (event === "subscription.activated") {
                        user.subscription.autoRenewStatus = "active";
                        // Do not enable renewals until a successful charge
                        // has been processed by subscription.charged.
                    } else if (event === "subscription.authenticated") {
                        user.subscription.autoRenewStatus = "authenticated";
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

        webhookEventRecord.status = "processed";
        webhookEventRecord.processedAt = new Date();
        await webhookEventRecord.save();

        return res.status(200).json({
            success: true,
            received: true,
        });
    } catch (error) {
        console.error("AUTOPAY WEBHOOK ERROR:", error.message);

        if (webhookEventRecord) {
            try {
                webhookEventRecord.status = "failed";
                webhookEventRecord.errorMessage = error.message;
                await webhookEventRecord.save();
            } catch (saveError) {
                console.error("AUTOPAY EVENT SAVE ERROR:", saveError.message);
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

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
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

        user.subscription.autoRenewStatus = "authenticated";
        user.subscription.autoRenewAuthorizedAt = new Date();
        user.subscription.lastRenewalPaymentId = razorpay_payment_id;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Authorization verified. Renewal activation is not yet complete.",
        });
    } catch (error) {
        console.error("AUTOPAY AUTH VERIFICATION ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to verify AutoPay authorization.",
        });
    }
};
