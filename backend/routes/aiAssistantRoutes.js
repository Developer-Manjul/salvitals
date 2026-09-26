const express = require("express");
const { getAssistant, updateAssistant, getUsage } = require("../controllers/aiAssistantController");

const router = express.Router();
router.get("/", getAssistant);
router.put("/", updateAssistant);
router.get("/usage", getUsage);
module.exports = router;
