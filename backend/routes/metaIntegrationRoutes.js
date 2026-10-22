const express = require("express");

const controller = require("../controllers/metaIntegrationController");
const inboxController = require("../controllers/metaInboxController");

const router = express.Router();

router.get(
  "/connect",
  controller.connect
);

router.get(
  "/callback",
  controller.callback
);

router.get(
  "/status",
  controller.status
);

router.get(
  "/pages",
  controller.pages
);

router.post(
  "/select-page",
  controller.selectPage
);


router.post(
  "/resubscribe-messages",
  controller.resubscribeMessages
);

router.post(
  "/disconnect",
  controller.disconnect
);

router.post(
  "/refresh",
  controller.refresh
);

router.get(
  "/debug/leadgen-subscription",
  controller.debugLeadgenSubscription
);

router.get(
  "/debug/permissions",
  controller.debugMetaPermissions
);

router.get(
  "/webhook",
  controller.verifyWebhook
);



router.post(
  "/webhook",
  controller.receiveWebhook
);



router.get(
  "/inbox",
  inboxController.getConversations
);

router.get(
  "/inbox/:id/messages",
  inboxController.getConversationMessages
);



module.exports = router;