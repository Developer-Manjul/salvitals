const mongoose = require("mongoose");

const User = require("../models/User");
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

const {
  getWorkspaceContext,
  hasPermission,
} = require("../utils/workspace");

const getContext = async (req) => {
  return await getWorkspaceContext(req);
};

const requirePermission = (
  context,
  permission,
  res
) => {
  if (!context) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return false;
  }

  if (!hasPermission(context, permission)) {
    res.status(403).json({
      success: false,
      message:
        "You do not have permission to perform this action.",
      permission,
    });

    return false;
  }

  return true;
};

function safeText(
  value,
  max = 5000
) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function normalizeMessage(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[!?,.]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGreeting(text) {
  const value =
    normalizeMessage(text);

  return new Set([
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
  ]).has(value);
}

function isYes(text) {
  const value =
    normalizeMessage(text);

  return new Set([
    "yes",
    "y",
    "yeah",
    "yep",
    "yup",
    "haan",
    "han",
    "ha",
    "haa",
    "ji",
    "ji haan",
    "bilkul",
    "sure",
    "okay",
    "ok",
    "yes please",
    "haan ji",
    "of course",
    "sure please",
    "please do",
    "do it",
    "book it",
  ]).has(value);
}

function isNo(text) {
  const value =
    normalizeMessage(text);

  return new Set([
    "no",
    "n",
    "nope",
    "nah",
    "nahi",
    "nahin",
    "na",
    "not now",
    "no thanks",
    "no thank you",
    "nahi chahiye",
    "abhi nahi",
  ]).has(value);
}

function isDirectAppointmentRequest(
  text
) {
  const value =
    normalizeMessage(text);

  if (!value) {
    return false;
  }

  const appointmentWords = [
    "appointment",
    "booking",
    "book appointment",
    "book an appointment",
    "book my appointment",
    "schedule appointment",
    "schedule a appointment",
    "schedule an appointment",
    "consultation",
    "consult",
    "appointment book",
    "appointment booking",
    "appointment chahiye",
    "appointment karni hai",
    "appointment krni hai",
    "appointment lena hai",
    "appointment leni hai",
    "book karna hai",
    "book krna hai",
  ];

  return appointmentWords.some(
    (word) =>
      value === word ||
      value.includes(word)
  );
}

function getGreeting(
  assistant
) {
  const assistantName =
    String(
      assistant?.assistantName ||
        "AI Assistant"
    ).trim();

  const fromName =
    String(
      assistant?.fromName || ""
    ).trim();

  if (fromName) {
    return `Hi 👋 I'm ${assistantName} from ${fromName}. How can I help you today?`;
  }

  return `Hi 👋 I'm ${assistantName}. How can I help you today?`;
}

function getAskNameMessage() {
  return "Sure. Please share your name and mobile number. Our team will connect with you shortly and help you with more information.";
}

function getAskPhoneMessage() {
  return "Thanks. Please share your mobile number.";
}

function getAppointmentConfirmationMessage() {
  return "Thanks. Our team will contact you shortly to confirm the appointment.";
}

function getNoAppointmentMessage(
  phone
) {
  if (phone) {
    return `No problem. You can contact our team directly on ${phone} for a call or WhatsApp.`;
  }

  return "No problem. You can contact our team through the contact details available on the website.";
}

function extractPhoneNumbers(text) {
  const source =
    String(text || "");

  const matches =
    source.match(
      /(?:\+?\d[\d\s().-]{7,}\d)/g
    ) || [];

  const numbers = [];

  matches.forEach(
    (match) => {
      const cleaned =
        match.replace(
          /\D/g,
          ""
        );

      if (
        cleaned.length >= 8 &&
        cleaned.length <= 15 &&
        !numbers.includes(
          cleaned
        )
      ) {
        numbers.push(cleaned);
      }
    }
  );

  return numbers;
}

function isAppointmentOfferText(
  text
) {
  const value =
    String(text || "")
      .trim()
      .toLowerCase();

  if (!value) {
    return false;
  }

  const hasAppointment =
    value.includes(
      "appointment"
    ) ||
    value.includes(
      "booking"
    ) ||
    value.includes("book");

  if (!hasAppointment) {
    return false;
  }

  return (
    value.includes(
      "would you like"
    ) ||
    value.includes(
      "shall i"
    ) ||
    value.includes(
      "can i"
    ) ||
    value.includes(
      "do you want"
    ) ||
    value.includes(
      "aap chahein"
    ) ||
    value.includes(
      "aap chahte"
    ) ||
    value.includes(
      "aap chahenge"
    ) ||
    value.includes(
      "kar du"
    ) ||
    value.includes(
      "kar doon"
    ) ||
    value.includes(
      "kar dun"
    ) ||
    value.includes(
      "karna chahenge"
    ) ||
    value.includes(
      "lena chahenge"
    ) ||
    value.includes(
      "book kar du"
    ) ||
    value.includes(
      "book kar doon"
    ) ||
    value.includes(
      "book kar dun"
    )
  );
}

function hasAppointmentOffer(
  messages
) {
  if (
    !Array.isArray(
      messages
    ) ||
    !messages.length
  ) {
    return false;
  }

  return messages.some(
    (message) => {
      if (
        message?.sender !==
        "ai"
      ) {
        return false;
      }

      return isAppointmentOfferText(
        message?.message
      );
    }
  );
}

function getLastAIMessage(
  messages
) {
  if (
    !Array.isArray(
      messages
    )
  ) {
    return null;
  }

  return (
    [...messages]
      .reverse()
      .find(
        (message) =>
          message?.sender ===
          "ai"
      ) || null
  );
}

function hasNameRequest(
  messages
) {
  const lastAI =
    getLastAIMessage(
      messages
    );

  if (!lastAI) {
    return false;
  }

  return /share your name|your name/i.test(
    String(
      lastAI.message || ""
    )
  );
}

function hasPhoneRequest(
  messages
) {
  const lastAI =
    getLastAIMessage(
      messages
    );

  if (!lastAI) {
    return false;
  }

  return /mobile number|phone number|mobile|phone/i.test(
    String(
      lastAI.message || ""
    )
  );
}

function shouldAskContactAfterGap(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    return false;
  }

  const lastTriggerIndex = [...messages]
    .map((message, index) => ({
      message,
      index,
    }))
    .reverse()
    .find(({ message }) => {
      if (message?.sender !== "ai") {
        return false;
      }

      const text = String(message?.message || "").toLowerCase();

      return (
        text.includes("would you like me to book") ||
        text.includes("book an appointment") ||
        text.includes("share your name") ||
        text.includes("share your mobile") ||
        text.includes("share your number") ||
        text.includes("mobile number") ||
        text.includes("phone number")
      );
    });

  if (!lastTriggerIndex) {
    return false;
  }

  const visitorMessagesAfterTrigger = messages
    .slice(lastTriggerIndex.index + 1)
    .filter(
      (message) => message?.sender === "visitor"
    );

  return visitorMessagesAfterTrigger.length >= 2;
}

function looksLikeName(text) {
  const value =
    String(text || "").trim();

  if (
    !value ||
    value.length > 100
  ) {
    return false;
  }

  if (/\d/.test(value)) {
    return false;
  }

  if (
    /https?:\/\//i.test(
      value
    )
  ) {
    return false;
  }

  if (/[?!]/.test(value)) {
    return false;
  }

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (
    words.length < 1 ||
    words.length > 5
  ) {
    return false;
  }

  const invalidNameWords =
    new Set([
      "yes",
      "no",
      "okay",
      "ok",
      "thanks",
      "thank",
      "hello",
      "hi",
      "hey",
      "number",
      "phone",
      "mobile",
      "appointment",
      "book",
      "booking",
      "cost",
      "price",
      "how",
      "what",
      "why",
      "when",
      "where",
    ]);

  if (
    words.some((word) =>
      invalidNameWords.has(
        word.toLowerCase()
      )
    )
  ) {
    return false;
  }

  return true;
}

function buildKnowledgeSearchQuery(
  currentMessage,
  previousMessages
) {
  const current =
    safeText(
      currentMessage,
      1200
    );

  const visitorContext =
    previousMessages
      .filter(
        (message) =>
          message?.sender ===
          "visitor"
      )
      .slice(-4)
      .map(
        (message) =>
          safeText(
            message?.message,
            500
          )
      )
      .filter(Boolean);

  const parts = [
    ...visitorContext,
    current,
  ];

  return [
    ...new Set(parts),
  ]
    .join(" ")
    .trim()
    .slice(0, 2500);
}

async function getOwnerProfile(
  ownerId
) {
  try {
    return await User.findById(
      ownerId
    )
      .select(
        "clinicName businessName name phone mobile whatsappNumber"
      )
      .lean();
  } catch (_) {
    return null;
  }
}

async function getClientName(
  assistant,
  ownerProfile
) {
  return String(
    assistant?.clientName ||
      assistant?.businessName ||
      assistant?.clinicName ||
      ownerProfile?.clinicName ||
      ownerProfile?.businessName ||
      ""
  ).trim();
}

async function findClientContactNumber({
  assistant,
  ownerProfile,
}) {
  const directCandidates = [
    assistant?.whatsappNumber,
    assistant?.contactPhone,
    assistant?.phone,
    assistant?.mobile,
    ownerProfile?.whatsappNumber,
    ownerProfile?.phone,
    ownerProfile?.mobile,
  ];

  for (
    const candidate of directCandidates
  ) {
    const numbers =
      extractPhoneNumbers(
        candidate
      );

    if (numbers.length) {
      return numbers[0];
    }

    const normalized =
      normalizePhone(
        candidate
      );

    if (
      normalized.replace(
        /\D/g,
        ""
      ).length >= 8
    ) {
      return normalized;
    }
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
          "contact phone number mobile WhatsApp call us contact details",
        limit: 8,
      });
  } catch (_) {
    knowledge = [];
  }

  const text =
    knowledge
      .map(
        (item) =>
          `${item?.title || ""}\n${item?.content || ""}\n${item?.sourceUrl || ""}`
      )
      .join("\n");

  const numbers =
    extractPhoneNumbers(
      text
    );

  return numbers.length
    ? numbers[0]
    : "";
}

async function reserveUsage(
  ownerId
) {
  const plan =
    await getAIPlan(
      ownerId
    );

  const totalLimit =
    Number(
      plan.totalLimit ??
        plan.limit ??
        0
    );

  if (!totalLimit) {
    return {
      allowed: false,
      plan,
      used: 0,
      remaining: 0,
      monthKey:
        getMonthKey(),
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
          limit: totalLimit,
        });
    } catch (error) {
      if (
        error?.code ===
        11000
      ) {
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

  if (!usage) {
    return {
      allowed: false,
      plan,
      used: 0,
      remaining: 0,
      monthKey,
    };
  }

  usage.limit =
    totalLimit;

  if (
    usage.count >=
    totalLimit
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
          $lt: totalLimit,
        },
      },
      {
        $inc: {
          count: 1,
        },
        $set: {
          limit: totalLimit,
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
      used: totalLimit,
      remaining: 0,
      monthKey,
    };
  }

  return {
    allowed: true,
    plan,
    used: updated.count,
    remaining:
      Math.max(
        totalLimit -
          updated.count,
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
        status: "active",
        mode: "ai",
        source: safeText(
          visitor?.pageUrl ||
          visitor?.sourceUrl ||
          visitor?.landingPage ||
          "",
          1000
        ),
        unreadForTeam: false,
      });
  } else {
    const updates = {};

    if (
      visitor?.pageUrl ||
      visitor?.sourceUrl ||
      visitor?.landingPage
    ) {
      updates.source = safeText(
        visitor?.pageUrl ||
        visitor?.sourceUrl ||
        visitor?.landingPage ||
        "",
        1000
      );
    }

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
      Object.keys(
        updates
      ).length
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

async function getConversationHistory(
  conversationId
) {
  return AIMessage.find({
    conversationId,
  })
    .sort({
      createdAt: 1,
    })
    .limit(30)
    .lean();
}

async function saveAIReply({
  assistant,
  conversation,
  text,
}) {
  const reply =
    await AIMessage.create({
      ownerId:
        assistant.ownerId,
      assistantId:
        assistant._id,
      conversationId:
        conversation._id,
      sender: "ai",
      message: text,
    });

  conversation.mode =
    "ai";

  conversation.status =
    "active";

  conversation.lastMessage =
    text;

  conversation.lastMessageAt =
    new Date();

  conversation.unreadForTeam =
    false;

  await conversation.save();

  return reply;
}

exports.publicStart =
  async (req, res) => {
    try {
      const assistantId =
        String(
          req.body
            ?.assistantId ||
            req.query
              ?.assistantId ||
            ""
        );

      const sessionId =
        safeText(
          req.body
            ?.sessionId ||
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

      const ownerProfile =
        await getOwnerProfile(
          assistant.ownerId
        );

      const clientName =
        await getClientName(
          assistant,
          ownerProfile
        );

      const conversation =
        await getOrCreatePublicConversation(
          {
            assistant,
            sessionId,
            visitor:
              req.body
                ?.visitor ||
              {},
          }
        );

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

      return res.json({
        success: true,
        assistant: {
          id: assistant._id,
          assistantName:
            assistant.assistantName ||
            "AI Assistant",
          fromName:
            assistant.fromName ||
            "",
          clientName,
          welcomeMessage:
            assistant.welcomeMessage ||
            getGreeting(
              assistant
            ),
          enabled:
            assistant.enabled,
        },
        conversation,
        messages,
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
        await getOrCreatePublicConversation(
          {
            assistant,
            sessionId,
            visitor:
              req.body
                ?.visitor ||
              {},
          }
        );

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

      const visitorMessage =
        await AIMessage.create({
          ownerId:
            assistant.ownerId,
          assistantId:
            assistant._id,
          conversationId:
            conversation._id,
          sender: "visitor",
          message:
            messageText,
        });

      if (req.body?.visitor) {
        await syncAILead({
          ownerId:
            assistant.ownerId,
          conversation: {
            ...conversation.toObject(),
            ...req.body
              .visitor,
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
            sender: "system",
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
          message: reply,
          conversation:
            updatedConversation,
          visitorMessage,
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
        });
      }

      const ownerProfile =
        await getOwnerProfile(
          assistant.ownerId
        );

      const history =
        await getConversationHistory(
          conversation._id
        );

      const previousMessages =
        history.filter(
          (message) =>
            String(
              message?._id
            ) !==
            String(
              visitorMessage._id
            )
        );

      if (
        isGreeting(
          messageText
        )
      ) {
        const reply =
          await saveAIReply({
            assistant,
            conversation,
            text:
              getGreeting(
                assistant
              ),
          });

        const updatedConversation =
          await AIConversation.findById(
            conversation._id
          ).lean();

        return res.json({
          success: true,
          message: reply,
          conversation:
            updatedConversation,
          visitorMessage,
        });
      }

      if (
        isDirectAppointmentRequest(
          messageText
        )
      ) {
        const reply =
          await saveAIReply({
            assistant,
            conversation,
            text:
              getAskNameMessage(),
          });

        const updatedConversation =
          await AIConversation.findById(
            conversation._id
          ).lean();

        return res.json({
          success: true,
          message: reply,
          conversation:
            updatedConversation,
          visitorMessage,
        });
      }

      if (
        hasAppointmentOffer(
          previousMessages
        )
      ) {
        if (
          isYes(
            messageText
          )
        ) {
          const reply =
            await saveAIReply({
              assistant,
              conversation,
              text:
                getAskNameMessage(),
            });

          const updatedConversation =
            await AIConversation.findById(
              conversation._id
            ).lean();

          return res.json({
            success: true,
            message: reply,
            conversation:
              updatedConversation,
            visitorMessage,
          });
        }

        if (
          isNo(
            messageText
          )
        ) {
          const contactNumber =
            await findClientContactNumber(
              {
                assistant,
                ownerProfile,
              }
            );

          const reply =
            await saveAIReply({
              assistant,
              conversation,
              text:
                getNoAppointmentMessage(
                  contactNumber
                ),
            });

          const updatedConversation =
            await AIConversation.findById(
              conversation._id
            ).lean();

          return res.json({
            success: true,
            message: reply,
            conversation:
              updatedConversation,
            visitorMessage,
          });
        }
      }

      if (
        hasNameRequest(
          previousMessages
        ) &&
        looksLikeName(
          messageText
        )
      ) {
        conversation.visitorName =
          safeText(
            messageText,
            120
          );

        await conversation.save();

        const reply =
          await saveAIReply({
            assistant,
            conversation,
            text:
              getAskPhoneMessage(),
          });

        await syncAILead({
          ownerId:
            assistant.ownerId,
          conversation:
            conversation.toObject(),
          service:
            safeText(
              req.body?.service,
              160
            ),
        });

        const updatedConversation =
          await AIConversation.findById(
            conversation._id
          ).lean();

        return res.json({
          success: true,
          message: reply,
          conversation:
            updatedConversation,
          visitorMessage,
        });
      }

      if (
        hasPhoneRequest(
          previousMessages
        )
      ) {
        const phoneNumbers =
          extractPhoneNumbers(
            messageText
          );

        if (
          phoneNumbers.length
        ) {
          conversation.visitorPhone =
            phoneNumbers[0];

          await conversation.save();

          await syncAILead({
            ownerId:
              assistant.ownerId,
            conversation:
              conversation.toObject(),
            service:
              safeText(
                req.body?.service,
                160
              ),
          });

          const reply =
            await saveAIReply({
              assistant,
              conversation,
              text:
                getAppointmentConfirmationMessage(),
            });

          const updatedConversation =
            await AIConversation.findById(
              conversation._id
            ).lean();

          return res.json({
            success: true,
            message: reply,
            conversation:
              updatedConversation,
            visitorMessage,
          });
        }
      }

      const knowledgeSearchQuery =
        buildKnowledgeSearchQuery(
          messageText,
          previousMessages
        );

      console.log(
        "AI KNOWLEDGE QUERY:",
        knowledgeSearchQuery
      );

      let knowledge = [];

      try {
        knowledge =
          await searchKnowledge({
            ownerId:
              assistant.ownerId,
            assistantId:
              assistant._id,
            query:
              knowledgeSearchQuery,
            limit: 5,
          });
      } catch (
        knowledgeError
      ) {
        console.error(
          "AI KNOWLEDGE SEARCH ERROR:",
          knowledgeError
        );

        knowledge = [];
      }

      const aiResult =
        await generateAIReply({
          assistant,
          history:
            previousMessages,
          userMessage:
            messageText,
          knowledge,
        });

      if (
        !aiResult?.shouldReply ||
        !aiResult?.text
      ) {
        return res.json({
          success: true,
          message: null,
          conversation,
          visitorMessage,
          silent: false,
          aiError:
            aiResult?.error ||
            "AI_REPLY_NOT_GENERATED",
        });
      }

      const replyText =
        String(
          aiResult.text
        ).trim();
      
     if (!replyText) {
  return res.json({
    success: true,
    message: null,
    conversation,
    visitorMessage,
    silent: false,
    aiError:
      "EMPTY_AI_RESPONSE",
  });
}

        const shouldRequestContact =
          hasAppointmentOffer(previousMessages) &&
          !conversation.visitorName &&
          !conversation.visitorPhone &&
        shouldAskContactAfterGap([
          ...previousMessages,
          visitorMessage,
        ])
        const reply =
          await saveAIReply({
            assistant,
            conversation,
            text: replyText,
          });

        if (shouldRequestContact) {
          await saveAIReply({
            assistant,
            conversation,
            text:
              "Please share your name and mobile number. Our team will connect with you shortly and provide more information.",
          });
        }

      const updatedConversation =
        await AIConversation.findById(
          conversation._id
        ).lean();

      return res.json({
        success: true,
        message: reply,
        conversation:
          updatedConversation,
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
          conversation: null,
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
      const context =
        await getContext(req);

      if (
        !requirePermission(
          context,
          "ai.view",
          res
        )
      ) {
        return;
      }

      const ownerId =
        context.workspaceOwnerId;

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
      const context =
        await getContext(req);

      if (
        !requirePermission(
          context,
          "ai.view",
          res
        )
      ) {
        return;
      }

      const ownerId =
        context.workspaceOwnerId;

      let conversation =
        await AIConversation.findOne({
          _id: req.params.id,
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
          _id: conversation._id,
          ownerId,
        },
        {
          $set: {
            unreadForTeam:
              false,
          },
        }
      );

      conversation =
        await AIConversation.findOne({
          _id: conversation._id,
          ownerId,
        }).lean();

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
      const context =
        await getContext(req);

      if (
        !requirePermission(
          context,
          "ai.view",
          res
        )
      ) {
        return;
      }

      const ownerId =
        context.workspaceOwnerId;

      const count =
        await AIConversation.countDocuments(
          {
            ownerId,
            unreadForTeam: true,
            status: {
              $ne: "closed",
            },
          }
        );

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
      const context =
        await getContext(req);

      if (
        !requirePermission(
          context,
          "ai.use",
          res
        )
      ) {
        return;
      }

      const ownerId =
        context.workspaceOwnerId;

      const conversation =
        await AIConversation.findOneAndUpdate(
          {
            _id: req.params.id,
            ownerId,
            status: {
              $ne: "closed",
            },
          },
          {
            $set: {
              mode: "human",
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
      const context =
        await getContext(req);

      if (
        !requirePermission(
          context,
          "ai.use",
          res
        )
      ) {
        return;
      }

      const ownerId =
        context.workspaceOwnerId;

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
          _id: req.params.id,
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
          sender: "human",
          message: text,
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
      const context =
        await getContext(req);

      if (
        !requirePermission(
          context,
          "ai.use",
          res
        )
      ) {
        return;
      }

      const ownerId =
        context.workspaceOwnerId;

      const conversation =
        await AIConversation.findOneAndUpdate(
          {
            _id: req.params.id,
            ownerId,
          },
          {
            $set: {
              status: "closed",
              mode: "human",
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