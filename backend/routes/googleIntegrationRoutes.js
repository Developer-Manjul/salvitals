const express = require("express");

const controller = require(
    "../controllers/googleIntegrationController"
);

const router = express.Router();

/* =========================================
   GOOGLE OAUTH
========================================= */

router.get(
    "/connect",
    controller.connect
);

router.get(
    "/callback",
    controller.callback
);

/* =========================================
   GOOGLE WEBHOOK
========================================= */

router.get(
    "/webhook",
    (req, res) => {
        return res.status(200).json({
            success: true,
            message:
                "Google Ads webhook endpoint is active",
        });
    }
);

router.post(
    "/webhook",
    controller.webhook
);

/* =========================================
   WEBHOOK SECRET
========================================= */

router.post(
    "/generate-webhook-secret",
    controller.generateWebhookSecret
);

module.exports = router;