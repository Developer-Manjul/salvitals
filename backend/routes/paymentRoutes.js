const express = require(
    "express"
);


console.log(
    "PAYMENT ROUTES FILE LOADED"
);


const {
    createOrder,
    verifyPayment,
} = require(
    "../controllers/paymentController"
);


const router =
    express.Router();


// ================================
// TEST ROUTE
// ================================

router.get(
    "/test",
    (req, res) => {

        console.log(
            "PAYMENT TEST ROUTE HIT"
        );


        return res.status(200).json({
            success: true,
            message:
                "Payment route is working",
        });

    }
);


// ================================
// CREATE ORDER
// ================================

router.post(
    "/create-order",
    (req, res, next) => {

        console.log(
            "CREATE ORDER ROUTE HIT"
        );


        return createOrder(
            req,
            res,
            next
        );

    }
);


// ================================
// VERIFY PAYMENT
// ================================

router.post(
    "/verify",
    (req, res, next) => {

        console.log(
            "VERIFY PAYMENT ROUTE HIT"
        );


        return verifyPayment(
            req,
            res,
            next
        );

    }
);


module.exports =
    router;