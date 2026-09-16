const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");

function getUserId(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return null;

  try {
    const decoded = jwt.verify(
      authorization.slice(7),
      process.env.JWT_SECRET
    );
    return decoded.id || decoded._id || decoded.userId || null;
  } catch (error) {
    return null;
  }
}

function requireUser(req, res) {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required" });
  }
  return userId;
}

exports.getNotifications = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const requestedLimit = Number(req.query.limit) || 20;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load notifications" });
  }
};

exports.getUnreadCount = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return res.json({ success: true, count });
  } catch (error) {
    console.error("GET UNREAD NOTIFICATIONS ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load unread notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, notification });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to mark notification as read" });
  }
};

exports.markAllAsRead = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Unable to mark notifications as read" });
  }
};