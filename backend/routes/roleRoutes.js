const express = require("express");
const controller = require("../controllers/roleController");

const router = express.Router();

router.get("/", controller.listRoles);
router.post("/", controller.createRole);
router.put("/:id", controller.updateRole);
router.patch("/:id/status", controller.updateRoleStatus);
router.delete("/:id", controller.deleteRole);

module.exports = router;