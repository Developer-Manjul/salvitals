const express = require("express");
const controller = require("../controllers/notificationController");

const router = express.Router();

router.get("/", controller.getNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.patch("/:id/read", controller.markAsRead);
router.patch("/read-all", controller.markAllAsRead);

module.exports = router;