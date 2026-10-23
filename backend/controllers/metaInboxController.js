
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

const isValidObjectId = (id) => {
    return /^[a-f\d]{24}$/i.test(String(id || ""));
};

// GET /api/integrations/meta/inbox
exports.getConversations = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requireInboxPermission(context, "inbox.view", res)) {
            return;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 30)
        );

        const filter = {
            userId: context.workspaceOwnerId,
        };

        const platform = String(req.query.platform || "")
            .trim()
            .toLowerCase();

        if (["facebook", "instagram"].includes(platform)) {
            filter.platform = platform;
        }

        const status = String(req.query.status || "")
            .trim()
            .toLowerCase();

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
        console.error(
            "META INBOX CONVERSATIONS ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load inbox conversations",
        });
    }
};

// GET /api/integrations/meta/inbox/:id/messages
// Opening a conversation clears its unread count.
exports.getConversationMessages = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requireInboxPermission(context, "inbox.view", res)) {
            return;
        }

        const conversationId = String(req.params.id || "");

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
            });
        }

        const conversation = await MetaConversation.findOne({
            _id: conversationId,
            userId: context.workspaceOwnerId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 50)
        );

        const messageFilter = {
            userId: context.workspaceOwnerId,
            conversationId: conversation._id,
        };

        const [messages, total] = await Promise.all([
            MetaMessage.find(messageFilter)
                .sort({ sentAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            MetaMessage.countDocuments(messageFilter),
        ]);

        // Clear unread count after successfully loading this conversation.
        if (conversation.unreadCount !== 0) {
            await MetaConversation.updateOne(
                {
                    _id: conversation._id,
                    userId: context.workspaceOwnerId,
                },
                {
                    $set: { unreadCount: 0 },
                }
            );

            conversation.unreadCount = 0;
        }

        return res.status(200).json({
            success: true,
            conversation,
            // Oldest message first for the chat UI.
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(
            "META INBOX MESSAGES ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load conversation messages",
        });
    }
};

// PATCH /api/integrations/meta/inbox/:id/read
exports.markConversationAsRead = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requireInboxPermission(context, "inbox.view", res)) {
            return;
        }

        const conversationId = String(req.params.id || "");

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
            });
        }

        const conversation = await MetaConversation.findOneAndUpdate(
            {
                _id: conversationId,
                userId: context.workspaceOwnerId,
            },
            {
                $set: { unreadCount: 0 },
            },
            {
                new: true,
            }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        return res.status(200).json({
            success: true,
            conversationId: String(conversation._id),
            unreadCount: conversation.unreadCount,
        });
    } catch (error) {
        console.error(
            "META INBOX MARK READ ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to mark conversation as read",
        });
    }
};
