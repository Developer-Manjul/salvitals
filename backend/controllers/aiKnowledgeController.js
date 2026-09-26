const jwt = require("jsonwebtoken");
const AIAssistant = require("../models/AIAssistant");
const AIKnowledge = require("../models/AIKnowledge");
const { crawlWebsite } = require("../services/websiteCrawler");

function getUserId(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      authorization.slice(7),
      process.env.JWT_SECRET
    );

    return (
      decoded.id ||
      decoded._id ||
      decoded.userId ||
      null
    );
  } catch (_) {
    return null;
  }
}

exports.listKnowledge = async (req, res) => {
  try {
    const ownerId = getUserId(req);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const assistant = await AIAssistant.findOne({
      ownerId,
    });

    if (!assistant) {
      return res.json({
        success: true,
        knowledge: [],
      });
    }

    const knowledge = await AIKnowledge.find({
      ownerId,
      assistantId: assistant._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      knowledge,
    });
  } catch (error) {
    console.error(
      "LIST AI KNOWLEDGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load knowledge",
    });
  }
};

exports.createKnowledge = async (req, res) => {
  try {
    const ownerId = getUserId(req);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const assistant = await AIAssistant.findOne({
      ownerId,
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "AI Assistant not configured",
      });
    }

    const type = [
      "faq",
      "service",
      "custom",
    ].includes(req.body?.type)
      ? req.body.type
      : "custom";

    const title = String(
      req.body?.title || ""
    )
      .trim()
      .slice(0, 200);

    const content = String(
      req.body?.content || ""
    )
      .trim()
      .slice(0, 20000);

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Knowledge content is required",
      });
    }

    const sourceUrl = String(
      req.body?.sourceUrl || ""
    )
      .trim()
      .slice(0, 500);

    const knowledge =
      await AIKnowledge.create({
        ownerId,
        assistantId: assistant._id,
        type,
        title,
        content,
        sourceUrl,
        active: true,
      });

    return res.status(201).json({
      success: true,
      knowledge,
    });
  } catch (error) {
    console.error(
      "CREATE AI KNOWLEDGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to save knowledge",
    });
  }
};

exports.deleteKnowledge = async (req, res) => {
  try {
    const ownerId = getUserId(req);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const assistant =
      await AIAssistant.findOne({
        ownerId,
      });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "AI Assistant not configured",
      });
    }

    const result =
      await AIKnowledge.deleteOne({
        _id: req.params.id,
        ownerId,
        assistantId: assistant._id,
      });

    if (!result.deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Knowledge not found",
      });
    }

    return res.json({
      success: true,
      message: "Knowledge deleted",
    });
  } catch (error) {
    console.error(
      "DELETE AI KNOWLEDGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete knowledge",
    });
  }
};

exports.crawlWebsite = async (req, res) => {
  try {
    const ownerId = getUserId(req);

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const assistant =
      await AIAssistant.findOne({
        ownerId,
      });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: "AI Assistant not configured",
      });
    }

    const websiteUrl = String(
      req.body?.websiteUrl ||
        assistant.websiteUrl ||
        ""
    ).trim();

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "Website URL is required",
      });
    }

    let parsed;

    try {
      parsed = new URL(websiteUrl);
    } catch (_) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid website URL",
      });
    }

    if (
      !["http:", "https:"].includes(
        parsed.protocol
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Website URL must use http or https",
      });
    }

    const result =
      await crawlWebsite({
        ownerId,
        assistantId: assistant._id,
        websiteUrl,
        maxPages: 30,
      });

    await AIAssistant.updateOne(
      {
        _id: assistant._id,
        ownerId,
      },
      {
        $set: {
          websiteUrl,
        },
      }
    );

    return res.json({
      success: true,
      message: `Website synced: ${result.pages} pages`,
      result,
    });
  } catch (error) {
    console.error(
      "CRAWL AI WEBSITE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to crawl website",
    });
  }
};