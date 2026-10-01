const express = require("express");

const {
    getLeadSources,
    createLeadSource,
    updateLeadSource,
    deleteLeadSource,
    getLeadStages,
    createLeadStage,
    updateLeadStage,
    deleteLeadStage,
} = require("../controllers/leadSettingController");

const router = express.Router();

router.get("/sources", getLeadSources);
router.post("/sources", createLeadSource);
router.put("/sources/:id", updateLeadSource);
router.delete("/sources/:id", deleteLeadSource);

router.get("/stages", getLeadStages);
router.post("/stages", createLeadStage);
router.put("/stages/:id", updateLeadStage);
router.delete("/stages/:id", deleteLeadStage);

module.exports = router;