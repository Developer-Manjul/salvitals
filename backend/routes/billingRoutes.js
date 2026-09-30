const express = require("express");

const {
  getCurrentBilling,
  getPlans,
} = require("../controllers/billingController");

const router = express.Router();

router.get("/current", getCurrentBilling);
router.get("/plans", getPlans);

module.exports = router;