const express = require("express");
const router = express.Router();

const {
    getSettings,
    saveSettings,
} = require("../controllers/leadWhatsAppController");

router.get("/settings", getSettings);
router.put("/settings", saveSettings);

module.exports = router;