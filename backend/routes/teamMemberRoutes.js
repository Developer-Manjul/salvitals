const express = require("express");
const {
  listTeamMembers,
  createTeamMember,
  updateTeamMember,
  updateTeamMemberStatus,
  deleteTeamMember,
} = require("../controllers/teamMemberController");

const router = express.Router();

router.get("/", listTeamMembers);
router.post("/", createTeamMember);
router.put("/:id", updateTeamMember);
router.patch("/:id/status", updateTeamMemberStatus);
router.delete("/:id", deleteTeamMember);

module.exports = router;
