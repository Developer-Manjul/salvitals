const Notification = require("../models/Notification");
const {
  getWorkspaceContext,
  hasPermission,
} = require("../utils/workspace");

function requirePermission(req, res, permission) {
  return getWorkspaceContext(req).then((context) => {
    if (!context) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return null;
    }

    if (!hasPermission(context, permission)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access notifications",
      });
      return null;
    }

    return context;
  });
}

exports.getNotifications = async (req, res) => {
  const context = await requirePermission(req, res, "notifications.view");
  if (!context) return;

  try {
    const requestedLimit = Number(req.query.limit) || 20;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const notifications = await Notification.find({
      userId: context.userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  const context = await requirePermission(req, res, "notifications.view");
  if (!context) return;

  try {
    const count = await Notification.countDocuments({
      userId: context.userId,
      isRead: false,
    });

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("GET UNREAD NOTIFICATIONS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load unread notifications",
    });
  }
};

exports.markAsRead = async (req, res) => {
  const context = await requirePermission(req, res, "notifications.view");
  if (!context) return;

  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: context.userId,
      },
      {
        $set: {
          isRead: true,
        },
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to mark notification as read",
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  const context = await requirePermission(req, res, "notifications.view");
  if (!context) return;

  try {
    await Notification.updateMany(
      {
        userId: context.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read",
    });
  }
};