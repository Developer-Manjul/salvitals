const express = require("express");
const { getConfig, script } = require("../controllers/aiWidgetController");
const {
  publicStart,
  publicMessage,
  publicMessages,
} = require("../controllers/aiConversationController");

const router = express.Router();
router.get("/config/:assistantId", getConfig);
router.get("/script.js", script);
router.post("/start", publicStart);
router.post("/message", publicMessage);
router.get("/messages", publicMessages);
module.exports = router;
