const express = require("express");
const controller = require("../controllers/googleIntegrationController");

console.log(
    "GOOGLE CONTROLLER EXPORTS:",
    Object.keys(controller)
);

const router = express.Router();

router.get("/connect", controller.connect);
router.get("/callback", controller.callback);
router.get("/accounts", controller.getAccounts);
router.post("/select-account", controller.selectAccount);
router.post("/disconnect", controller.disconnect);

router.get("/webhook", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Google Ads webhook endpoint is active",
    });
});

router.post("/webhook", controller.webhook);

router.post(
    "/generate-webhook-secret",
    controller.generateWebhookSecret
);

module.exports = router;