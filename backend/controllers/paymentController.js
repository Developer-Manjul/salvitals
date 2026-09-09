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
            } = req.body;

            const totalAmount =
                Number(amount);

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
                "CART TOTAL:",
                totalAmount
            );

            console.log(
                "RAZORPAY AMOUNT:",
                Math.round(
                    totalAmount * 100
                )
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

                    currency:
                        curr,

                    period:
                        Number(period) || 1,

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
                await Order.findOneAndUpdate(
                    {
                        razorpayOrderId:
                            razorpay_order_id,
                    },
                    {
                        paymentStatus:
                            "paid",

                        razorpayPaymentId:
                            razorpay_payment_id,

                        razorpaySignature:
                            razorpay_signature,
                    },
                    {
                        new:
                            true,
                    }
                );

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found",
                });
            }

            const user =
    await User.findById(
        order.userId
    );

console.log("=================================");
console.log("INVOICE USER DEBUG");
console.log("ORDER ID:", order._id);
console.log("ORDER USER ID:", order.userId);
console.log(
    "USER FOUND:",
    user ? user._id : "NOT FOUND"
);
console.log(
    "USER EMAIL:",
    user ? user.email : "NO EMAIL"
);
console.log("=================================");

if (
    user &&
    user.email
) {
    try {

        await sendInvoiceEmail({
            user,
            order,
            paymentId:
                razorpay_payment_id,
        });

        console.log(
            "Invoice email sent successfully to:",
            user.email
        );

    } catch (emailError) {

        console.error(
            "INVOICE EMAIL ERROR:",
            emailError
        );

    }
}
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