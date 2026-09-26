const express = require("express");
const {
  listKnowledge,
  createKnowledge,
  deleteKnowledge,
  crawlWebsite,
} = require("../controllers/aiKnowledgeController");

const router = express.Router();
router.get("/", listKnowledge);
router.post("/", createKnowledge);
router.delete("/:id", deleteKnowledge);
router.post("/crawl", crawlWebsite);
module.exports = router;
