const express = require("express");
const {
  listConversations,
  getConversation,
  unreadCount,
  takeOver,
  humanReply,
  closeConversation,
} = require("../controllers/aiConversationController");

const router = express.Router();
router.get("/", listConversations);
router.get("/unread-count", unreadCount);
router.get("/:id", getConversation);
router.post("/:id/take-over", takeOver);
router.post("/:id/reply", humanReply);
router.post("/:id/close", closeConversation);
module.exports = router;
