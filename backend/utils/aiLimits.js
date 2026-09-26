const Order = require("../models/Order");

const AI_CHATBOT_LIMITS = Object.freeze({
  starter: 500,
  growth: 1500,
  scale: 3000,
});

function normalizeAIPlanId(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "custom") return "enterprise";
  return normalized;
}

function getAIChatbotLimit(planId) {
  return AI_CHATBOT_LIMITS[normalizeAIPlanId(planId)] || 0;
}

async function getAIPlan(userId) {
  const order = await Order.findOne({
    userId,
    paymentStatus: "paid",
  }).sort({ createdAt: -1 });

  if (!order) {
    return { planId: null, planName: "No active plan", limit: 0 };
  }

  const planId = normalizeAIPlanId(order.planId || order.planName);
  const planName = planId === "enterprise"
    ? "Enterprise"
    : planId.charAt(0).toUpperCase() + planId.slice(1);

  return {
    planId,
    planName,
    limit: getAIChatbotLimit(planId),
  };
}

function getMonthKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

module.exports = {
  AI_CHATBOT_LIMITS,
  getAIChatbotLimit,
  getAIPlan,
  getMonthKey,
  normalizeAIPlanId,
};
