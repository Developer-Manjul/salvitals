const express = require("express");

const {
  getCurrentBilling,
  getPlans,
} = require("../controllers/billingController");


const {
    getAutoPayStatus,
    createAutoPaySubscription,
    verifyAutoPayAuthorization,
} = require("../controllers/autoPayController");

const router = express.Router();

router.get("/current", getCurrentBilling);
router.get("/plans", getPlans);

router.get("/autopay/status", getAutoPayStatus);
router.post("/autopay/subscribe", createAutoPaySubscription);

router.post(
    "/autopay/verify",
    verifyAutoPayAuthorization
);

module.exports = router;