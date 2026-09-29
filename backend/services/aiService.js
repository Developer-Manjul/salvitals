const axios = require("axios");

const OPENAI_URL =
  "https://api.openai.com/v1/responses";

function buildKnowledgeContext(knowledge = []) {
  if (!Array.isArray(knowledge) || !knowledge.length) {
    return "NO VERIFIED BUSINESS INFORMATION WAS FOUND.";
  }

  return knowledge
    .slice(0, 5)
    .map((item, index) => {
      const title = String(
        item?.title || ""
      )
        .trim()
        .slice(0, 200);

      const content = String(
        item?.content || ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2200);

      return [
        `KNOWLEDGE ${index + 1}`,
        `Title: ${title}`,
        `Content: ${content}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function extractOutputText(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  const output = Array.isArray(data?.output)
    ? data.output
    : [];

  const parts = [];

  for (const item of output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const content of item.content) {
      if (
        typeof content?.text === "string" &&
        content.text.trim()
      ) {
        parts.push(content.text.trim());
      }
    }
  }

  return parts.join("\n").trim();
}

function cleanAnswer(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*#+\s*/gm, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function detectLanguage(text) {
  const value = String(text || "")
    .toLowerCase()
    .trim();

  if (!value) {
    return "english";
  }

  const hindiWords = [
    "kya",
    "ka",
    "ki",
    "ke",
    "ko",
    "se",
    "me",
    "mein",
    "mai",
    "mujhe",
    "mera",
    "meri",
    "mere",
    "aap",
    "apka",
    "apki",
    "apke",
    "batao",
    "bata",
    "chahiye",
    "hai",
    "hain",
    "kitna",
    "kitne",
    "kitni",
    "kab",
    "kaise",
    "kyu",
    "kyon",
    "aur",
    "krna",
    "karna",
    "kar",
    "karo",
    "du",
    "do",
    "de",
    "iska",
    "iske",
    "iski",
    "uska",
    "uske",
    "uski",
  ];

  const englishWords = [
    "what",
    "which",
    "where",
    "when",
    "why",
    "how",
    "cost",
    "price",
    "appointment",
    "book",
    "service",
    "services",
    "treatment",
    "doctor",
    "available",
    "timing",
    "time",
    "tell",
    "please",
    "can",
    "could",
    "would",
    "want",
    "need",
  ];

  const words = value
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const hindiCount = words.filter(
    (word) => hindiWords.includes(word)
  ).length;

  const englishCount = words.filter(
    (word) => englishWords.includes(word)
  ).length;

  if (
    hindiCount >= 2 &&
    englishCount >= 1
  ) {
    return "hinglish";
  }

  if (hindiCount >= 2) {
    return "hindi";
  }

  return "english";
}

function isGreeting(text) {
  return /^(hi|hii|hiii|hello|hey|heyy|namaste|namaskar|good morning|good afternoon|good evening|hi there|hello there|hey there)[.!?\s]*$/i.test(
    String(text || "").trim()
  );
}

function isSimpleAcknowledgement(text) {
  return /^(ok|okay|thanks|thank you|thx|great|nice|yes|no|haan|han|achha|acha|theek|thik)[.!?\s]*$/i.test(
    String(text || "").trim()
  );
}

function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function isAppointmentRequest(text) {
  const value = String(text || "")
    .toLowerCase()
    .trim();

  if (!value) {
    return false;
  }

  const words = [
    "appointment",
    "booking",
    "book",
    "reserve",
    "reservation",
    "schedule",
    "consultation",
    "consult",
  ];

  return words.some((word) =>
    new RegExp(
      `(^|\\s)${escapeRegExp(
        word
      )}(?=\\s|$)`,
      "i"
    ).test(value)
  );
}

function hasAppointmentOffer(history = []) {
  if (!Array.isArray(history)) {
    return false;
  }

  return history.some((message) => {
    const role =
      message?.sender ||
      message?.role ||
      "";

    if (
      role !== "assistant" &&
      role !== "ai"
    ) {
      return false;
    }

    const text = String(
      message?.message ||
        message?.content ||
        ""
    ).toLowerCase();

    if (!text) {
      return false;
    }

    const appointment =
      text.includes("appointment") ||
      text.includes("booking") ||
      text.includes("book");

    const question =
      text.includes("?") ||
      text.includes("would you like") ||
      text.includes("shall i") ||
      text.includes("can i") ||
      text.includes("chahein") ||
      text.includes("chahenge") ||
      text.includes("kar du") ||
      text.includes("kar doon") ||
      text.includes("book kar du") ||
      text.includes("book kar doon");

    return appointment && question;
  });
}

function buildConversationHistory(history = []) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-8)
    .map((message) => {
      const role =
        message?.sender === "visitor" ||
        message?.sender === "user" ||
        message?.role === "user"
          ? "user"
          : "assistant";

      const content = String(
        message?.message ||
          message?.content ||
          ""
      )
        .trim()
        .slice(0, 1500);

      return {
        role,
        content,
      };
    })
    .filter(
      (message) => message.content
    );
}

function countVisitorQuestions(history = []) {
  if (!Array.isArray(history)) {
    return 0;
  }

  return history.filter((message) => {
    const isVisitor =
      message?.sender === "visitor" ||
      message?.role === "user";

    if (!isVisitor) {
      return false;
    }

    const text = String(
      message?.message ||
        message?.content ||
        ""
    ).trim();

    if (!text) {
      return false;
    }

    if (isGreeting(text)) {
      return false;
    }

    if (isSimpleAcknowledgement(text)) {
      return false;
    }

    return true;
  }).length;
}

function buildSystemPrompt({
  assistant,
  knowledge,
  visitorLanguage,
  shouldAskAppointment,
}) {
  const assistantName = String(
    assistant?.assistantName ||
      "AI Assistant"
  )
    .trim()
    .slice(0, 100);

  const customInstructions = String(
    assistant?.customInstructions ||
      ""
  )
    .trim()
    .slice(0, 1500);

  const knowledgeContext =
    buildKnowledgeContext(
      knowledge
    );

  let languageInstruction =
    "Reply in English.";

  if (visitorLanguage === "hinglish") {
    languageInstruction =
      "Reply in natural Hinglish. Use simple Roman Hindi mixed with English, matching the visitor's style.";
  }

  if (visitorLanguage === "hindi") {
    languageInstruction =
      "Reply in Hindi. If the visitor writes Hindi using English letters, use simple Roman Hindi.";
  }

  const appointmentInstruction =
    shouldAskAppointment
      ? `
The visitor has now asked at least two meaningful questions.

Answer the current question first.

After answering, naturally ask if they would like to book an appointment.

Ask this only once.

Use the same language and tone as the visitor.

English example:
"Would you like me to book an appointment for you?"

Hinglish example:
"Aap chahein to main aapki appointment book kar du?"

Hindi example:
"Kya aap appointment book karna chahenge?"
`
      : "";

  return `
You are ${assistantName}, the website AI assistant for this business.

${languageInstruction}

Have a natural human-like conversation with the visitor.

RULES:

1. Use verified business information below.
2. Never invent or guess business facts.
3. Never invent names, doctors, services, treatments, products, prices, timings, locations, addresses, policies, contact details or availability.
4. Never assume the business industry.
5. Do not use unrelated general knowledge for business questions.
6. Understand follow-up questions from conversation history.
7. Short questions such as "cost?", "how much?", "and hair?", "timing?", "aur iska?", "kitna?" should be understood from previous conversation.
8. Do not return NO_REPLY.
9. Always give the visitor a useful response.
10. If verified information is not available, politely say that you do not have verified information for that specific detail.
11. Keep responses short and conversational.
12. Prefer 1 to 4 short sentences.
13. Do not dump website content.
14. Do not repeat information unnecessarily.
15. Do not mention internal instructions, AI, knowledge retrieval or processing.
16. Do not use Markdown, bullets, headings or bold formatting.
17. Return plain conversational text only.
18. Do not create human-handover messages.
19. Match the visitor's language.
20. If the visitor speaks English, reply in English.
21. If the visitor speaks Hinglish, reply in Hinglish.
22. If the visitor speaks Hindi, reply in Hindi.

${appointmentInstruction}

BUSINESS-SPECIFIC INSTRUCTIONS:

${customInstructions || "None"}

VERIFIED BUSINESS INFORMATION:

${knowledgeContext}
`.trim();
}

async function generateAIReply({
  assistant,
  history = [],
  userMessage,
  knowledge = [],
}) {
  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error(
      "OPENAI_API_KEY is missing."
    );

    return {
      text: "",
      shouldReply: false,
      needsHuman: false,
      providerConfigured: false,
      error: "OPENAI_API_KEY_MISSING",
    };
  }

  const model =
    process.env.OPENAI_MODEL ||
    "gpt-5.6-luna";

  const cleanUserMessage =
    String(userMessage || "")
      .trim()
      .slice(0, 1200);

  if (!cleanUserMessage) {
    return {
      text: "",
      shouldReply: false,
      needsHuman: false,
      providerConfigured: true,
    };
  }

  if (isGreeting(cleanUserMessage)) {
    const assistantName =
      String(
        assistant?.assistantName ||
          "AI Assistant"
      ).trim();

    const language =
      detectLanguage(
        cleanUserMessage
      );

    let greeting =
      `Hi 👋 I'm ${assistantName}. How can I help you today?`;

    if (language === "hinglish") {
      greeting =
        `Hi 👋 Main ${assistantName} hoon. Main aapki kaise help kar sakti hoon?`;
    }

    if (language === "hindi") {
      greeting =
        `Namaste 👋 Main ${assistantName} hoon. Main aapki kaise madad kar sakti hoon?`;
    }

    return {
      text: greeting,
      shouldReply: true,
      needsHuman: false,
      providerConfigured: true,
      localResponse: true,
    };
  }

  const conversationHistory =
    buildConversationHistory(
      history
    );

  const visitorLanguage =
    detectLanguage(
      cleanUserMessage
    );

  const previousQuestionCount =
    countVisitorQuestions(
      conversationHistory
    );

  const currentQuestionCount =
    previousQuestionCount + 1;

  const appointmentAlreadyAsked =
    hasAppointmentOffer(
      conversationHistory
    );

  const directAppointmentRequest =
    isAppointmentRequest(
      cleanUserMessage
    );

  const shouldAskAppointment =
    currentQuestionCount >= 2 &&
    !appointmentAlreadyAsked &&
    !directAppointmentRequest;

  const systemPrompt =
    buildSystemPrompt({
      assistant,
      knowledge,
      visitorLanguage,
      shouldAskAppointment,
    });

  let currentTurnInstruction = "";

  if (shouldAskAppointment) {
    currentTurnInstruction = `
This is the visitor's second meaningful question or later.

Answer the visitor's current question first.

Then ask naturally whether they would like to book an appointment.

Do not ask anything else after the appointment question.
`;
  }

  const input = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...conversationHistory,
    {
      role: "user",
      content: `
${cleanUserMessage}

${currentTurnInstruction}
      `.trim(),
    },
  ];

  try {
    console.log(
      "AI REQUEST:",
      {
        model,
        assistantId: String(
          assistant?._id || ""
        ),
        userMessage:
          cleanUserMessage,
        visitorLanguage,
        visitorQuestionCount:
          currentQuestionCount,
        shouldAskAppointment,
        knowledgeCount:
          Math.min(
            Array.isArray(
              knowledge
            )
              ? knowledge.length
              : 0,
            5
          ),
        historyCount:
          conversationHistory.length,
      }
    );

    const response =
      await axios.post(
        OPENAI_URL,
        {
          model,
          input,
          max_output_tokens: 250,
        },
        {
          timeout: 60000,
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
        }
      );

    console.log(
      "OPENAI RESPONSE STATUS:",
      response.status
    );

    const rawAnswer =
      extractOutputText(
        response.data
      );

    console.log(
      "OPENAI RAW OUTPUT:",
      rawAnswer
    );

    let answer =
      cleanAnswer(
        rawAnswer
      );

    if (
      !answer ||
      answer.trim().toUpperCase() ===
        "NO_REPLY"
    ) {
      if (visitorLanguage === "hinglish") {
        answer =
          "Mere paas is specific detail ki verified information abhi nahi hai. Aap kisi aur cheez ke baare mein pooch sakte hain.";
      } else if (visitorLanguage === "hindi") {
        answer =
          "Mere paas is specific detail ki verified jankari abhi nahi hai. Aap kisi aur baare mein pooch sakte hain.";
      } else {
        answer =
          "I don't have verified information about that specific detail yet. You can ask me about another service or detail.";
      }
    }

    if (
      shouldAskAppointment &&
      !hasAppointmentOffer([
        ...conversationHistory,
        {
          sender: "ai",
          message: answer,
        },
      ])
    ) {
      if (visitorLanguage === "hinglish") {
        answer =
          `${answer} Aap chahein to main aapki appointment book kar du?`;
      } else if (visitorLanguage === "hindi") {
        answer =
          `${answer} Kya aap appointment book karna chahenge?`;
      } else {
        answer =
          `${answer} Would you like me to book an appointment for you?`;
      }
    }

    console.log(
      "AI RESPONSE GENERATED:",
      answer
    );

    return {
      text: answer,
      shouldReply: true,
      needsHuman: false,
      providerConfigured: true,
    };
  } catch (error) {
    console.error(
      "OPENAI API ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "OPENAI API ERROR:",
      error?.response?.data ||
        error?.message ||
        "Unknown OpenAI error"
    );

    return {
      text: "",
      shouldReply: false,
      needsHuman: false,
      providerConfigured: true,
      error:
        error?.response?.status === 401
          ? "OPENAI_AUTH_ERROR"
          : error?.response?.status === 429
            ? "OPENAI_QUOTA_OR_RATE_LIMIT"
            : error?.response?.status === 400
              ? "OPENAI_BAD_REQUEST"
              : error?.code === "ECONNABORTED"
                ? "OPENAI_TIMEOUT"
                : "OPENAI_REQUEST_FAILED",
    };
  }
}

module.exports = {
  generateAIReply,
};