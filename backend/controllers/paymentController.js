const Razorpay = require("razorpay");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Order = require("../models/Order");
const User = require("../models/User");
const sendInvoiceEmail = require("../utils/sendInvoiceEmail");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function getUserId(req) {
    const authorization =
        req.headers.authorization || "";

    const token =
        authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";

    if (!token) {
        return null;
    }

    try {
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

function getNumber(...values) {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            Number.isFinite(Number(value))
        ) {
            return Number(value);
        }
    }

    return 0;
}

async function sendInvoiceIfNeeded(order) {
    if (order.invoiceEmailSentAt) {
        return false;
    }

    const user = await User.findById(order.userId);

    if (!user || !user.email) {
        return false;
    }

    try {
        await sendInvoiceEmail({
            user,
            order,
            paymentId: order.razorpayPaymentId,
        });

        order.invoiceEmailSentAt = new Date();
        order.invoiceEmailError = "";
        await order.save();

        console.log(
            "Invoice email sent successfully to:",
            user.email
        );

        return true;
    } catch (emailError) {
        order.invoiceEmailError =
            emailError.message || "Unable to send invoice email";
        await order.save();

        console.error(
            "INVOICE EMAIL ERROR:",
            emailError
        );

        return false;
    }
}

async function recoverPaidOrder(userId) {
    const pendingOrder = await Order.findOne({
        userId,
        paymentStatus: "pending",
        razorpayOrderId: { $ne: "" },
    }).sort({ createdAt: -1 });

    if (!pendingOrder) {
        return null;
    }

    const payments =
        await razorpay.orders.fetchPayments(
            pendingOrder.razorpayOrderId
        );

    const capturedPayment = payments.items?.find(
        (payment) => payment.status === "captured"
    );

    if (!capturedPayment) {
        return null;
    }

    const currentYear = new Date().getFullYear();
    const paidOrdersCount = await Order.countDocuments({
        paymentStatus: "paid",
        invoiceNumber: {
            $regex: `^SV_${currentYear}_`,
        },
    });

    pendingOrder.invoiceNumber =
        pendingOrder.invoiceNumber ||
        `SV_${currentYear}_${String(
            paidOrdersCount + 1
        ).padStart(3, "0")}`;
    pendingOrder.paymentStatus = "paid";
    pendingOrder.razorpayPaymentId = capturedPayment.id;
    await pendingOrder.save();
    await sendInvoiceIfNeeded(pendingOrder);

    return pendingOrder;
}

exports.getPaymentStatus =
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
                        "Authentication required",
                    payment_completed:
                        false,
                    payment_status:
                        "unauthorized",
                    status:
                        "unauthorized",
                });
            }

            const user =
                await User.findById(
                    userId
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found",
                    payment_completed:
                        false,
                    payment_status:
                        "not_found",
                    status:
                        "not_found",
                });
            }

            let paidOrder =
                await Order.findOne({
                    userId:
                        userId,

                    paymentStatus:
                        "paid",
                }).sort({
                    createdAt:
                        -1,
                });

            if (!paidOrder) {
                try {
                    paidOrder = await recoverPaidOrder(userId);
                } catch (recoveryError) {
                    console.error(
                        "PAYMENT RECOVERY ERROR:",
                        recoveryError
                    );
                }
            }

            if (paidOrder) {
                await sendInvoiceIfNeeded(paidOrder);

                console.log(
                    "================================="
                );

                console.log(
                    "PAYMENT STATUS CHECK"
                );

                console.log(
                    "USER ID:",
                    userId
                );

                console.log(
                    "USER EMAIL:",
                    user.email
                );

                console.log(
                    "PAID ORDER:",
                    paidOrder._id
                );

                console.log(
                    "PLAN:",
                    paidOrder.planName
                );

                console.log(
                    "PAYMENT STATUS:",
                    paidOrder.paymentStatus
                );

                console.log(
                    "================================="
                );

                return res.status(200).json({
                    success: true,

                    payment_completed:
                        true,

                    payment_status:
                        "paid",

                    status:
                        "paid",

                    orderId:
                        paidOrder._id,

                    planId:
                        paidOrder.planId,

                    planName:
                        paidOrder.planName,

                    invoiceNumber:
                        paidOrder.invoiceNumber || "",

                    order: {
                        _id: paidOrder._id,
                        paymentStatus:
                            paidOrder.paymentStatus,
                        planId: paidOrder.planId,
                        planName: paidOrder.planName,
                    },
                });
            }

            console.log(
                "================================="
            );

            console.log(
                "PAYMENT STATUS CHECK"
            );

            console.log(
                "USER ID:",
                userId
            );

            console.log(
                "USER EMAIL:",
                user.email
            );

            console.log(
                "NO PAID ORDER FOUND"
            );

            console.log(
                "================================="
            );

            return res.status(200).json({
                success: true,

                payment_completed:
                    false,

                payment_status:
                    "pending",

                status:
                    "pending",
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

                payment_completed:
                    false,

                payment_status:
                    "error",

                status:
                    "error",
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
                amount,
                currency = "INR",
                planId,
                planName,
                period = 1,
                periodLabel = "",
                country = "",
                planAmount = 0,
                setupFee = 0,
                tax = 0,
            } = req.body;

            const totalAmount =
                getNumber(amount);

            const finalPlanAmount =
                getNumber(planAmount);

            const finalSetupFee =
                getNumber(setupFee);

            const finalTax =
                getNumber(tax);

            if (
                !Number.isFinite(
                    totalAmount
                ) ||
                totalAmount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment amount",
                });
            }

            const curr =
                String(currency)
                    .toUpperCase() === "USD"
                    ? "USD"
                    : "INR";

            console.log(
                "\n================================"
            );

            console.log(
                "CART PAYMENT RECEIVED"
            );

            console.log(
                "Plan:",
                planId
            );

            console.log(
                "Plan Name:",
                planName
            );

            console.log(
                "Period:",
                period
            );

            console.log(
                "Currency:",
                curr
            );

            console.log(
                "Plan Amount:",
                finalPlanAmount
            );

            console.log(
                "Setup Fee:",
                finalSetupFee
            );

            console.log(
                "Tax:",
                finalTax
            );

            console.log(
                "Total Amount:",
                totalAmount
            );

            console.log(
                "================================\n"
            );

            const razorpayAmount =
                Math.round(
                    totalAmount * 100
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
                        planId:
                            String(
                                planId || ""
                            ),

                        planName:
                            String(
                                planName || ""
                            ),

                        period:
                            String(
                                period
                            ),

                        periodLabel:
                            String(
                                periodLabel || ""
                            ),

                        planAmount:
                            String(
                                finalPlanAmount
                            ),

                        setupFee:
                            String(
                                finalSetupFee
                            ),

                        tax:
                            String(
                                finalTax
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

                    planId:
                        planId || "",

                    planName:
                        planName || "",

                    amount:
                        totalAmount,

                    planAmount:
                        finalPlanAmount,

                    setupFee:
                        finalSetupFee,

                    tax:
                        finalTax,

                    currency:
                        curr,

                    period:
                        Number(period) || 1,

                    periodLabel:
                        periodLabel || "",

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

                    totalAmount,

                    planAmount:
                        finalPlanAmount,

                    setupFee:
                        finalSetupFee,

                    tax:
                        finalTax,
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

            let order =
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
                        paidOrdersCount + 1
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

            const user =
                await User.findById(
                    order.userId
                );

            console.log(
                "================================="
            );

            console.log(
                "INVOICE USER DEBUG"
            );

            console.log(
                "ORDER ID:",
                order._id
            );

            console.log(
                "ORDER USER ID:",
                order.userId
            );

            console.log(
                "USER FOUND:",
                user
                    ? user._id
                    : "NOT FOUND"
            );

            console.log(
                "USER EMAIL:",
                user
                    ? user.email
                    : "NO EMAIL"
            );

            console.log(
                "INVOICE NUMBER:",
                order.invoiceNumber
            );

            console.log(
                "PLAN AMOUNT:",
                order.planAmount
            );

            console.log(
                "SETUP FEE:",
                order.setupFee
            );

            console.log(
                "TAX:",
                order.tax
            );

            console.log(
                "TOTAL:",
                order.amount
            );

            console.log(
                "================================="
            );

            await sendInvoiceIfNeeded(order);

            return res.status(200).json({
                success: true,

                message:
                    "Payment verified successfully",

                order,
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