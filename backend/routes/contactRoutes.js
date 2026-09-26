const express = require("express");
const controller = require("../controllers/contactController");

const router = express.Router();

router.get("/usage", controller.getUsage);
router.get("/", controller.getContacts);
router.post("/", controller.createContact);
router.post("/from-lead/:leadId", controller.convertLead);
router.delete("/:id", controller.deleteContact);

module.exports = router;