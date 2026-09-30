const AIAssistant = require("../models/AIAssistant");
const AIUsage = require("../models/AIUsage");

const {
    getWorkspaceContext,
    hasPermission,
} = require("../utils/workspace");

const {
    getAIPlan,
    getMonthKey,
} = require("../utils/aiLimits");

const getContext = async (req) => {
    return await getWorkspaceContext(req);
};

const requirePermission = (
    context,
    permission,
    res
) => {
    if (!context) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });

        return false;
    }

    if (!hasPermission(context, permission)) {
        res.status(403).json({
            success: false,
            message:
                "You do not have permission to perform this action.",
            permission,
        });

        return false;
    }

    return true;
};

function cleanString(
    value,
    max = 10000
) {
    return String(value ?? "")
        .trim()
        .slice(0, max);
}

function cleanColor(value) {
    const color = String(
        value || ""
    ).trim();

    if (
        /^#[0-9A-Fa-f]{6}$/.test(
            color
        )
    ) {
        return color.toUpperCase();
    }

    return "#00656A";
}

function buildUsage(
    plan,
    used,
    monthKey
) {
    const planLimit = Number(
        plan?.planLimit || 0
    );

    const addonLimit = Number(
        plan?.addonLimit || 0
    );

    const totalLimit = Number(
        plan?.totalLimit ??
        plan?.limit ??
        0
    );

    const safeUsed = Math.max(
        Number(used || 0),
        0
    );

    return {
        used: safeUsed,
        planLimit,
        addonLimit,
        totalLimit,
        limit: totalLimit,
        remaining: Math.max(
            totalLimit - safeUsed,
            0
        ),
        month: monthKey,
    };
}

exports.getAssistant = async (
    req,
    res
) => {
    try {
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "ai.view",
                res
            )
        ) {
            return;
        }

        const ownerId =
            context.workspaceOwnerId;

        const assistant =
            await AIAssistant.findOneAndUpdate(
                {
                    ownerId,
                },
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
            Number(
                usage?.count || 0
            );

        return res.json({
            success: true,
            assistant,
            usage: buildUsage(
                plan,
                used,
                monthKey
            ),
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
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "ai.use",
                res
            )
        ) {
            return;
        }

        const ownerId =
            context.workspaceOwnerId;

        const assistant =
            await AIAssistant.findOneAndUpdate(
                {
                    ownerId,
                },
                {
                    $set: {
                        enabled:
                            req.body?.enabled !==
                            false,

                        assistantName:
                            cleanString(
                                req.body
                                    ?.assistantName,
                                120
                            ) ||
                            "AI Assistant",

                        fromName:
                            cleanString(
                                req.body
                                    ?.fromName,
                                200
                            ),

                        logoUrl:
                            cleanString(
                                req.body
                                    ?.logoUrl,
                                1000
                            ),

                        primaryColor:
                            cleanColor(
                                req.body
                                    ?.primaryColor
                            ),

                        websiteUrl:
                            cleanString(
                                req.body
                                    ?.websiteUrl,
                                500
                            ),

                        welcomeMessage:
                            cleanString(
                                req.body
                                    ?.welcomeMessage,
                                1000
                            ) ||
                            "Hello 👋 Welcome! How can I help you today?",

                        customInstructions:
                            cleanString(
                                req.body
                                    ?.customInstructions,
                                10000
                            ),

                        status:
                            req.body
                                ?.enabled ===
                            false
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
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "ai.view",
                res
            )
        ) {
            return;
        }

        const ownerId =
            context.workspaceOwnerId;

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
            Number(
                usage?.count || 0
            );

        return res.json({
            success: true,
            plan,
            usage: buildUsage(
                plan,
                used,
                monthKey
            ),
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