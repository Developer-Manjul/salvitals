const Order = require("../models/Order");

const PLAN_LIMITS = Object.freeze({
  starter: 500,
  growth: 1500,
  scale: 2500,
});

function normalizePlanId(value) {
  const normalized = String(value || "starter").trim().toLowerCase();
  if (normalized === "custom") return "enterprise";
  return normalized;
}

function getContactLimit(planId) {
  const normalized = normalizePlanId(planId);
  if (normalized === "enterprise") {
    const configured = Number(process.env.ENTERPRISE_CONTACT_LIMIT || 0);
    return configured > 0 ? configured : null;
  }
  return PLAN_LIMITS[normalized] || PLAN_LIMITS.starter;
}

async function getActivePlan(userId) {
  const order = await Order.findOne({
    userId,
    paymentStatus: "paid",
  }).sort({ createdAt: -1 });

  if (!order) {
    return {
      planId: null,
      planName: "No active plan",
      limit: 0,
    };
  }

  const planId = normalizePlanId(order.planId || order.planName);
  const planName = planId === "enterprise"
    ? "Enterprise"
    : planId.charAt(0).toUpperCase() + planId.slice(1);

  return {
    planId,
    planName,
    limit: getContactLimit(planId),
  };
}

module.exports = { getActivePlan, getContactLimit, normalizePlanId };