const express = require("express");

const {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    addLeadNote,
    addLeadFollowUp,
    updateLeadFollowUp,
    deleteLeadFollowUp,
} = require("../controllers/leadController");

const router = express.Router();

router.get("/", getLeads);

router.get("/:id", getLead);

router.post("/:id/notes", addLeadNote);

router.post("/:id/follow-ups", addLeadFollowUp);

router.put(
    "/:id/follow-ups/:followUpId",
    updateLeadFollowUp
);

router.delete(
    "/:id/follow-ups/:followUpId",
    deleteLeadFollowUp
);

router.post("/", createLead);

router.put("/:id", updateLead);

router.delete("/:id", deleteLead);

module.exports = router;