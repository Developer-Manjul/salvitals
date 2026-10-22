
const MetaConversation = require("../models/MetaConversation");
const MetaMessage = require("../models/MetaMessage");

const {
    getWorkspaceContext,
    hasPermission,
} = require("../utils/workspace");

const getContext = async (req) => {
    return await getWorkspaceContext(req);
};

const requireInboxPermission = (context, permission, res) => {
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
            message: "You do not have permission to access the inbox.",
            permission,
        });
        return false;
    }

    return true;
};

// GET /api/integrations/meta/inbox
exports.getConversations = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requireInboxPermission(context, "inbox.view", res)) {
            return;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

        const filter = {
            userId: context.workspaceOwnerId,
        };

        const platform = String(req.query.platform || "").toLowerCase();

        if (["facebook", "instagram"].includes(platform)) {
            filter.platform = platform;
        }

        const status = String(req.query.status || "").toLowerCase();

        if (["open", "closed"].includes(status)) {
            filter.status = status;
        }

        const [conversations, total] = await Promise.all([
            MetaConversation.find(filter)
                .sort({ lastMessageAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            MetaConversation.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            conversations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("META INBOX CONVERSATIONS ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to load inbox conversations",
        });
    }
};

// GET /api/integrations/meta/inbox/:id/messages
exports.getConversationMessages = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requireInboxPermission(context, "inbox.view", res)) {
            return;
        }

        const conversationId = String(req.params.id || "");

        if (!/^[a-f\d]{24}$/i.test(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
            });
        }

        const conversation = await MetaConversation.findOne({
            _id: conversationId,
            userId: context.workspaceOwnerId,
        }).lean();

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

        const [messages, total] = await Promise.all([
            MetaMessage.find({
                userId: context.workspaceOwnerId,
                conversationId: conversation._id,
            })
                .sort({ sentAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            MetaMessage.countDocuments({
                userId: context.workspaceOwnerId,
                conversationId: conversation._id,
            }),
        ]);

        return res.status(200).json({
            success: true,
            conversation,
            // Oldest to newest, so the chat UI can render naturally.
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("META INBOX MESSAGES ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to load conversation messages",
        });
    }
};
