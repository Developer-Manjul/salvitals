const jwt = require("jsonwebtoken");
const AIAssistant = require("../models/AIAssistant");
const AIUsage = require("../models/AIUsage");
const {
  getAIPlan,
  getMonthKey,
} = require("../utils/aiLimits");

function getUserId(req) {
  const authorization =
    req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      authorization.slice(7),
      process.env.JWT_SECRET
    );

    return (
      decoded.id ||
      decoded._id ||
      decoded.userId ||
      null
    );
  } catch (_) {
    return null;
  }
}

function cleanString(value, max = 10000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function cleanColor(value) {
  const color = String(value || "").trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase();
  }

  return "#00656A";
}

exports.getAssistant = async (req, res) => {
  try {
    const ownerId = getUserId(req);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const assistant =
      await AIAssistant.findOneAndUpdate(
        { ownerId },
        {
          $setOnInsert: {
            ownerId,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    const plan = await getAIPlan(ownerId);

    const monthKey = getMonthKey();

    const usage =
      await AIUsage.findOne({
        ownerId,
        monthKey,
      }).lean();

    return res.json({
      success: true,

      assistant,

      usage: {
        used: usage?.count || 0,
        limit: plan.limit,
        remaining: Math.max(
          (plan.limit || 0) -
            (usage?.count || 0),
          0
        ),
        month: monthKey,
      },

      plan,
    });
  } catch (error) {
    console.error(
      "GET AI ASSISTANT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load AI Assistant settings",
    });
  }
};

exports.updateAssistant = async (
  req,
  res
) => {
  try {
    const ownerId = getUserId(req);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const assistant =
      await AIAssistant.findOneAndUpdate(
        { ownerId },

        {
          $set: {
            enabled:
              req.body?.enabled !== false,

            assistantName:
              cleanString(
                req.body?.assistantName,
                120
              ) || "AI Assistant",

            logoUrl:
              cleanString(
                req.body?.logoUrl,
                1000
              ),

            primaryColor:
              cleanColor(
                req.body?.primaryColor
              ),

            websiteUrl:
              cleanString(
                req.body?.websiteUrl,
                500
              ),

            welcomeMessage:
              cleanString(
                req.body?.welcomeMessage,
                1000
              ) ||
              "Hello 👋 Welcome! How can I help you today?",

            customInstructions:
              cleanString(
                req.body?.customInstructions,
                10000
              ),

            status:
              req.body?.enabled === false
                ? "disabled"
                : "active",
          },

          $setOnInsert: {
            ownerId,
          },
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

    return res.json({
      success: true,
      message:
        "AI Assistant settings saved",
      assistant,
    });
  } catch (error) {
    console.error(
      "UPDATE AI ASSISTANT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save AI Assistant settings",
    });
  }
};

exports.getUsage = async (
  req,
  res
) => {
  try {
    const ownerId = getUserId(req);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const plan =
      await getAIPlan(ownerId);

    const monthKey =
      getMonthKey();

    const usage =
      await AIUsage.findOne({
        ownerId,
        monthKey,
      }).lean();

    const used =
      usage?.count || 0;

    return res.json({
      success: true,

      plan,

      usage: {
        used,
        limit: plan.limit,
        remaining: Math.max(
          plan.limit - used,
          0
        ),
        month: monthKey,
      },
    });
  } catch (error) {
    console.error(
      "GET AI USAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load AI usage",
    });
  }
};