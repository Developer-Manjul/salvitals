const express = require("express");

const {
    createWebsiteApiKey,
    getWebsiteApiKeys,
    toggleWebsiteApiKey,
    deleteWebsiteApiKey,
    createWebsiteLead,
} = require("../controllers/leadIntegrationController");

const router =
    express.Router();

router.post(
    "/website/api-key",
    createWebsiteApiKey
);

router.get(
    "/website/api-keys",
    getWebsiteApiKeys
);

router.patch(
    "/website/api-key/:id",
    toggleWebsiteApiKey
);

router.delete(
    "/website/api-key/:id",
    deleteWebsiteApiKey
);

router.post(
    "/website/lead",
    createWebsiteLead
);

module.exports = router;