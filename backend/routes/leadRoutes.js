const express = require("express");

const {
    getLeads,
    createLead,
    updateLead,
    deleteLead,
} = require("../controllers/leadController");

const router =
    express.Router();

router.get(
    "/",
    getLeads
);

router.post(
    "/",
    createLead
);

router.put(
    "/:id",
    updateLead
);

router.delete(
    "/:id",
    deleteLead
);

module.exports =
    router;