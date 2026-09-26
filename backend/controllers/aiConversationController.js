const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const AIAssistant = require("../models/AIAssistant");
const AIConversation = require("../models/AIConversation");
const AIMessage = require("../models/AIMessage");
const AIUsage = require("../models/AIUsage");

const {
  getAIPlan,
  getMonthKey,
} = require("../utils/aiLimits");

const {
  searchKnowledge,
} = require("../services/aiKnowledgeService");

const {
  generateAIReply,
} = require("../services/aiService");

const {
  syncAILead,
} = require("../services/aiLeadService");

function getUserId(req) {
  const authorization =
    req.headers.authorization || "";

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

function safeText(value, max = 5000) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

function isGreeting(text) {
  const value = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[!?,.]+/g, "")
    .trim();

  const greetings = new Set([
    "hi",
    "hello",
    "hey",
    "hii",
    "hiii",
    "helo",
    "helloo",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
    "namaskar",
    "hi there",
    "hello there",
    "hey there",
  ]);

  return greetings.has(value);
}

function getGreeting(assistant) {
  const name =
    assistant?.assistantName ||
    "AI Assistant";

  return `Hello! 👋 I'm ${name}. How can I help you today?`;
}

function getHumanHandoverMessage() {
  return "I don't have enough verified information to answer that accurately. Our team can help you with this.";
}

async function reserveUsage(ownerId) {
  const plan =
    await getAIPlan(ownerId);

  if (!plan.limit) {
    return {
      allowed: false,
      plan,
      used: 0,
      remaining: 0,
      monthKey: getMonthKey(),
    };
  }

  const monthKey =
    getMonthKey();

  let usage =
    await AIUsage.findOne({
      ownerId,
      monthKey,
    });

  if (!usage) {
    try {
      usage =
        await AIUsage.create({
          ownerId,
          monthKey,
          count: 0,
          limit: plan.limit,
        });
    } catch (error) {
      if (error?.code === 11000) {
        usage =
          await AIUsage.findOne({
            ownerId,
            monthKey,
          });
      } else {
        throw error;
      }
    }
  }

  usage.limit =
    plan.limit;

  if (
    usage.count >=
    plan.limit
  ) {
    await usage.save();

    return {
      allowed: false,
      plan,
      used: usage.count,
      remaining: 0,
      monthKey,
    };
  }

  const updated =
    await AIUsage.findOneAndUpdate(
      {
        _id: usage._id,
        count: {
          $lt: plan.limit,
        },
      },
      {
        $inc: {
          count: 1,
        },
        $set: {
          limit: plan.limit,
        },
      },
      {
        new: true,
      }
    );

  if (!updated) {
    return {
      allowed: false,
      plan,
      used: plan.limit,
      remaining: 0,
      monthKey,
    };
  }

  return {
    allowed: true,
    plan,
    used: updated.count,
    remaining: Math.max(
      plan.limit - updated.count,
      0
    ),
    monthKey,
  };
}

async function getOrCreatePublicConversation({
  assistant,
  sessionId,
  visitor,
}) {
  let conversation =
    await AIConversation.findOne({
      assistantId:
        assistant._id,
      sessionId,
      status: {
        $ne: "closed",
      },
    }).sort({
      createdAt: -1,
    });

  if (!conversation) {
    conversation =
      await AIConversation.create({
        ownerId:
          assistant.ownerId,
        assistantId:
          assistant._id,
        visitorId:
          safeText(
            visitor?.visitorId,
            120
          ),
        sessionId:
          safeText(
            sessionId,
            200
          ),
        visitorName:
          safeText(
            visitor?.name,
            120
          ),
        visitorPhone:
          safeText(
            visitor?.phone,
            50
          ),
        visitorEmail:
          safeText(
            visitor?.email,
            160
          ),
        status:
          "active",
        mode:
          "ai",
        source:
          "Website",
        unreadForTeam:
          false,
      });
  } else {
    const updates = {};

    if (visitor?.name) {
      updates.visitorName =
        safeText(
          visitor.name,
          120
        );
    }

    if (visitor?.phone) {
      updates.visitorPhone =
        safeText(
          visitor.phone,
          50
        );
    }

    if (visitor?.email) {
      updates.visitorEmail =
        safeText(
          visitor.email,
          160
        );
    }

    if (
      Object.keys(updates).length
    ) {
      conversation =
        await AIConversation.findByIdAndUpdate(
          conversation._id,
          {
            $set: updates,
          },
          {
            new: true,
          }
        );
    }
  }

  return conversation;
}

async function createHumanHandover({
  assistant,
  conversation,
}) {
  const messageText =
    getHumanHandoverMessage();

  const message =
    await AIMessage.create({
      ownerId:
        assistant.ownerId,
      assistantId:
        assistant._id,
      conversationId:
        conversation._id,
      sender:
        "system",
      message:
        messageText,
    });

  conversation.mode =
    "human";

  conversation.status =
    "waiting_human";

  conversation.lastMessage =
    messageText;

  conversation.lastMessageAt =
    new Date();

  conversation.unreadForTeam =
    true;

  await conversation.save();

  return message;
}

async function getConversationHistory(
  conversationId
) {
  return AIMessage.find({
    conversationId,
  })
    .sort({
      createdAt: 1,
    })
    .limit(20)
    .lean();
}

exports.publicStart =
  async (req, res) => {
    try {
      const assistantId =
        String(
          req.body?.assistantId ||
            req.query?.assistantId ||
            ""
        );

      const sessionId =
        safeText(
          req.body?.sessionId ||
            "",
          200
        );

      if (
        !mongoose.isValidObjectId(
          assistantId
        ) ||
        !sessionId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assistant or session",
        });
      }

      const assistant =
        await AIAssistant.findById(
          assistantId
        ).lean();

      if (
        !assistant ||
        !assistant.enabled ||
        assistant.status !==
          "active"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "AI Assistant is unavailable",
        });
      }

      const conversation =
        await getOrCreatePublicConversation({
          assistant,
          sessionId,
          visitor:
            req.body?.visitor ||
            {},
        });

      const messages =
        await AIMessage.find({
          conversationId:
            conversation._id,
        })
          .sort({
            createdAt: 1,
          })
          .limit(100)
          .lean();

      const plan =
        await getAIPlan(
          assistant.ownerId
        );

      const usage =
        await AIUsage.findOne({
          ownerId:
            assistant.ownerId,
          monthKey:
            getMonthKey(),
        }).lean();

      return res.json({
        success: true,
        assistant: {
          id:
            assistant._id,
          assistantName:
            assistant.assistantName ||
            "AI Assistant",
          welcomeMessage:
            assistant.welcomeMessage ||
            "Hello 👋 Welcome! How can I help you today?",
          enabled:
            assistant.enabled,
        },
        conversation,
        messages,
        usage: {
          used:
            usage?.count ||
            0,
          limit:
            plan.limit,
          remaining:
            Math.max(
              plan.limit -
                (usage?.count || 0),
              0
            ),
        },
      });
    } catch (error) {
      console.error(
        "AI PUBLIC START ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to start chat",
      });
    }
  };

exports.publicMessage =
  async (req, res) => {
    try {
      const assistantId =
        String(
          req.body?.assistantId ||
            ""
        );

      const sessionId =
        safeText(
          req.body?.sessionId ||
            "",
          200
        );

      const messageText =
        safeText(
          req.body?.message,
          5000
        );

      if (
        !mongoose.isValidObjectId(
          assistantId
        ) ||
        !sessionId ||
        !messageText
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Assistant, session and message are required",
        });
      }

      const assistant =
        await AIAssistant.findById(
          assistantId
        );

      if (
        !assistant ||
        !assistant.enabled ||
        assistant.status !==
          "active"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "AI Assistant is unavailable",
        });
      }

      const conversation =
        await getOrCreatePublicConversation({
          assistant,
          sessionId,
          visitor:
            req.body?.visitor ||
            {},
        });

      if (
        conversation.status ===
        "closed"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This conversation is closed",
        });
      }

      const usage =
        await reserveUsage(
          assistant.ownerId
        );

      if (!usage.allowed) {
        return res.status(429).json({
          success: false,
          code:
            usage.plan.limit
              ? "MONTHLY_LIMIT_REACHED"
              : "NO_ACTIVE_PLAN",
          message:
            usage.plan.limit
              ? `Your monthly AI chatbot limit of ${usage.plan.limit} messages has been reached.`
              : "An active Starter, Growth or Scale plan is required to use the AI chatbot.",
          usage: {
            used:
              usage.used,
            limit:
              usage.plan.limit,
            remaining:
              usage.remaining,
          },
        });
      }

      const visitorMessage =
        await AIMessage.create({
          ownerId:
            assistant.ownerId,
          assistantId:
            assistant._id,
          conversationId:
            conversation._id,
          sender:
            "visitor",
          message:
            messageText,
        });

      if (req.body?.visitor) {
        await syncAILead({
          ownerId:
            assistant.ownerId,
          conversation: {
            ...conversation.toObject(),
            ...req.body.visitor,
          },
          service:
            safeText(
              req.body?.service,
              160
            ),
        });
      }

      if (
        conversation.mode ===
          "human" ||
        conversation.status ===
          "waiting_human"
      ) {
        const replyText =
          "Thanks. Your message has been sent to our team. A team member will reply shortly.";

        const reply =
          await AIMessage.create({
            ownerId:
              assistant.ownerId,
            assistantId:
              assistant._id,
            conversationId:
              conversation._id,
            sender:
              "system",
            message:
              replyText,
          });

        conversation.lastMessage =
          replyText;

        conversation.lastMessageAt =
          new Date();

        conversation.unreadForTeam =
          true;

        await conversation.save();

        const updatedConversation =
          await AIConversation.findById(
            conversation._id
          ).lean();

        return res.json({
          success: true,
          message:
            reply,
          conversation:
            updatedConversation,
          usage: {
            used:
              usage.used,
            limit:
              usage.plan.limit,
            remaining:
              usage.remaining,
          },
          visitorMessage,
        });
      }

      if (
        isGreeting(
          messageText
        )
      ) {
        const replyText =
          getGreeting(
            assistant
          );

        const reply =
          await AIMessage.create({
            ownerId:
              assistant.ownerId,
            assistantId:
              assistant._id,
            conversationId:
              conversation._id,
            sender:
              "ai",
            message:
              replyText,
          });

        conversation.lastMessage =
          replyText;

        conversation.lastMessageAt =
          new Date();

        conversation.mode =
          "ai";

        conversation.status =
          "active";

        conversation.unreadForTeam =
          false;

        await conversation.save();

        const updatedConversation =
          await AIConversation.findById(
            conversation._id
          ).lean();

        return res.json({
          success: true,
          message:
            reply,
          conversation:
            updatedConversation,
          usage: {
            used:
              usage.used,
            limit:
              usage.plan.limit,
            remaining:
              usage.remaining,
          },
          visitorMessage,
        });
      }

      let knowledge = [];

      try {
        knowledge =
          await searchKnowledge({
            ownerId:
              assistant.ownerId,
            assistantId:
              assistant._id,
            query:
              messageText,
            limit: 5,
          });
      } catch (knowledgeError) {
        console.error(
          "AI KNOWLEDGE SEARCH ERROR:",
          knowledgeError
        );

        knowledge = [];
      }

      const history =
        await getConversationHistory(
          conversation._id
        );

      const aiResult =
        await generateAIReply({
          assistant,
          history,
          userMessage:
            messageText,
          knowledge,
        });

      if (
        aiResult?.needsHuman ||
        !aiResult?.text
      ) {
        const reply =
          await createHumanHandover({
            assistant,
            conversation,
          });

        const updatedConversation =
          await AIConversation.findById(
            conversation._id
          ).lean();

        return res.json({
          success: true,
          message:
            reply,
          conversation:
            updatedConversation,
          usage: {
            used:
              usage.used,
            limit:
              usage.plan.limit,
            remaining:
              usage.remaining,
          },
          visitorMessage,
        });
      }

      const reply =
        await AIMessage.create({
          ownerId:
            assistant.ownerId,
          assistantId:
            assistant._id,
          conversationId:
            conversation._id,
          sender:
            "ai",
          message:
            aiResult.text,
        });

      conversation.mode =
        "ai";

      conversation.status =
        "active";

      conversation.lastMessage =
        aiResult.text;

      conversation.lastMessageAt =
        new Date();

      conversation.unreadForTeam =
        false;

      await conversation.save();

      const updatedConversation =
        await AIConversation.findById(
          conversation._id
        ).lean();

      return res.json({
        success: true,
        message:
          reply,
        conversation:
          updatedConversation,
        usage: {
          used:
            usage.used,
          limit:
            usage.plan.limit,
          remaining:
            usage.remaining,
        },
        visitorMessage,
      });
    } catch (error) {
      console.error(
        "AI PUBLIC MESSAGE ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process AI message",
      });
    }
  };

exports.publicMessages =
  async (req, res) => {
    try {
      const assistantId =
        String(
          req.query?.assistantId ||
            ""
        );

      const sessionId =
        safeText(
          req.query?.sessionId ||
            "",
          200
        );

      if (
        !mongoose.isValidObjectId(
          assistantId
        ) ||
        !sessionId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid chat",
        });
      }

      const conversation =
        await AIConversation.findOne({
          assistantId,
          sessionId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      if (!conversation) {
        return res.json({
          success: true,
          conversation:
            null,
          messages: [],
        });
      }

      const messages =
        await AIMessage.find({
          conversationId:
            conversation._id,
        })
          .sort({
            createdAt: 1,
          })
          .limit(200)
          .lean();

      return res.json({
        success: true,
        conversation,
        messages,
      });
    } catch (error) {
      console.error(
        "AI PUBLIC MESSAGES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load chat",
      });
    }
  };

exports.listConversations =
  async (req, res) => {
    try {
      const ownerId =
        getUserId(req);

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const conversations =
        await AIConversation.find({
          ownerId,
        })
          .sort({
            lastMessageAt: -1,
          })
          .limit(100)
          .lean();

      return res.json({
        success: true,
        conversations,
      });
    } catch (error) {
      console.error(
        "LIST AI CONVERSATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load AI conversations",
      });
    }
  };

exports.getConversation =
  async (req, res) => {
    try {
      const ownerId =
        getUserId(req);

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const conversation =
        await AIConversation.findOne({
          _id:
            req.params.id,
          ownerId,
        }).lean();

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found",
        });
      }

      const messages =
        await AIMessage.find({
          conversationId:
            conversation._id,
        })
          .sort({
            createdAt: 1,
          })
          .limit(500)
          .lean();

      await AIConversation.updateOne(
        {
          _id:
            conversation._id,
          ownerId,
        },
        {
          $set: {
            unreadForTeam:
              false,
          },
        }
      );

      return res.json({
        success: true,
        conversation,
        messages,
      });
    } catch (error) {
      console.error(
        "GET AI CONVERSATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load conversation",
      });
    }
  };

exports.unreadCount =
  async (req, res) => {
    try {
      const ownerId =
        getUserId(req);

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const count =
        await AIConversation.countDocuments({
          ownerId,
          unreadForTeam:
            true,
          status: {
            $ne: "closed",
          },
        });

      return res.json({
        success: true,
        count,
      });
    } catch (error) {
      console.error(
        "AI UNREAD COUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load AI unread count",
      });
    }
  };

exports.takeOver =
  async (req, res) => {
    try {
      const ownerId =
        getUserId(req);

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const conversation =
        await AIConversation.findOneAndUpdate(
          {
            _id:
              req.params.id,
            ownerId,
            status: {
              $ne: "closed",
            },
          },
          {
            $set: {
              mode:
                "human",
              status:
                "waiting_human",
              unreadForTeam:
                false,
            },
          },
          {
            new: true,
          }
        );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found",
        });
      }

      return res.json({
        success: true,
        conversation,
      });
    } catch (error) {
      console.error(
        "AI TAKEOVER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to take over conversation",
      });
    }
  };

exports.humanReply =
  async (req, res) => {
    try {
      const ownerId =
        getUserId(req);

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const text =
        safeText(
          req.body?.message,
          5000
        );

      if (!text) {
        return res.status(400).json({
          success: false,
          message:
            "Message is required",
        });
      }

      const conversation =
        await AIConversation.findOne({
          _id:
            req.params.id,
          ownerId,
          status: {
            $ne: "closed",
          },
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found",
        });
      }

      conversation.mode =
        "human";

      conversation.status =
        "waiting_human";

      conversation.unreadForTeam =
        false;

      conversation.lastMessage =
        text;

      conversation.lastMessageAt =
        new Date();

      await conversation.save();

      const message =
        await AIMessage.create({
          ownerId,
          assistantId:
            conversation.assistantId,
          conversationId:
            conversation._id,
          sender:
            "human",
          message:
            text,
        });

      return res.json({
        success: true,
        message,
        conversation,
      });
    } catch (error) {
      console.error(
        "AI HUMAN REPLY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send human reply",
      });
    }
  };

exports.closeConversation =
  async (req, res) => {
    try {
      const ownerId =
        getUserId(req);

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const conversation =
        await AIConversation.findOneAndUpdate(
          {
            _id:
              req.params.id,
            ownerId,
          },
          {
            $set: {
              status:
                "closed",
              mode:
                "human",
              unreadForTeam:
                false,
            },
          },
          {
            new: true,
          }
        );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found",
        });
      }

      return res.json({
        success: true,
        conversation,
      });
    } catch (error) {
      console.error(
        "AI CLOSE CONVERSATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to close conversation",
      });
    }
  };