const express = require("express");
const controller = require("../controllers/metaIntegrationController");

const router = express.Router();

router.get("/connect", controller.connect);
router.get("/callback", controller.callback);
router.get("/status", controller.status);
router.get("/pages", controller.pages);
router.post("/select-page", controller.selectPage);
router.post("/disconnect", controller.disconnect);
router.post("/refresh", controller.refresh);
router.get("/webhook", controller.verifyWebhook);
router.post("/webhook", controller.receiveWebhook);

module.exports = router;