const express = require("express");

console.log("PAYMENT ROUTES FILE LOADED");

const {
    createOrder,
    verifyPayment,
    getPaymentStatus,
} = require("../controllers/paymentController");

const {
    getAutoPayStatus,
    handleAutoPayWebhook,
} = require("../controllers/autoPayController");

const router = express.Router();

router.post(
    "/autopay/webhook",
    handleAutoPayWebhook
);

router.get(
    "/test",
    (req, res) => {
        console.log("PAYMENT TEST ROUTE HIT");

        return res.status(200).json({
            success: true,
            message: "Payment route is working",
        });
    }
);

router.get(
    "/status",
    (req, res, next) => {
        console.log("PAYMENT STATUS ROUTE HIT");

        return getPaymentStatus(
            req,
            res,
            next
        );
    }
);

router.get(
    "/autopay/status",
    getAutoPayStatus
);

router.post(
    "/create-order",
    (req, res, next) => {
        console.log("CREATE ORDER ROUTE HIT");

        return createOrder(
            req,
            res,
            next
        );
    }
);

router.post(
    "/verify",
    (req, res, next) => {
        console.log("VERIFY PAYMENT ROUTE HIT");

        return verifyPayment(
            req,
            res,
            next
        );
    }
);

module.exports = router;