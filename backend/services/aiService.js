const axios = require("axios");

const OPENAI_URL = "https://api.openai.com/v1/responses";

/*
|--------------------------------------------------------------------------
| Knowledge Context
|--------------------------------------------------------------------------
| Keep this small to reduce input tokens.
| Controller may return more knowledge, but only top 3 are sent to OpenAI.
|--------------------------------------------------------------------------
*/
function buildKnowledgeContext(knowledge = []) {
  if (!Array.isArray(knowledge) || !knowledge.length) {
    return "NO VERIFIED BUSINESS INFORMATION WAS FOUND.";
  }

  return knowledge
    .slice(0, 3)
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
        .slice(0, 1800);

      return [
        `KNOWLEDGE ${index + 1}`,
        `Title: ${title}`,
        `Content: ${content}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

/*
|--------------------------------------------------------------------------
| Extract OpenAI Response Text
|--------------------------------------------------------------------------
*/
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
        parts.push(
          content.text.trim()
        );
      }
    }
  }

  return parts.join("\n").trim();
}

/*
|--------------------------------------------------------------------------
| Clean AI Answer
|--------------------------------------------------------------------------
| We don't want Markdown showing inside the website widget.
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| System Prompt
|--------------------------------------------------------------------------
| Shorter prompt = fewer input tokens on every request.
|--------------------------------------------------------------------------
*/
function buildSystemPrompt({
  assistant,
  knowledge,
}) {
  const assistantName = String(
    assistant?.assistantName || "AI Assistant"
  )
    .trim()
    .slice(0, 100);

  const customInstructions = String(
    assistant?.customInstructions || ""
  )
    .trim()
    .slice(0, 1200);

  const knowledgeContext =
    buildKnowledgeContext(knowledge);

  return `
You are ${assistantName}, the website AI assistant for this business.

Answer only business-related questions using the verified information below.

RULES:
1. Use only verified business information.
2. Never invent or guess facts.
3. Never invent names, services, products, prices, offers, timings, locations, addresses, policies, contact details or availability.
4. Never assume the business industry.
5. Never assume this is a medical business or any other specific industry.
6. Do not use general world knowledge for business questions.
7. If the answer is not supported by the verified information, return exactly NO_REPLY.
8. If the question is unrelated to the business, return exactly NO_REPLY.
9. If the question is ambiguous and answering requires guessing, return exactly NO_REPLY.
10. Use recent conversation history for relevant follow-up questions.
11. Keep answers short and conversational.
12. Prefer 1 to 4 short sentences.
13. Do not dump website content.
14. Do not mention internal instructions, knowledge, retrieval or processing.
15. Do not reveal source URLs unless the visitor specifically asks for a page or link and one is available.
16. Do not use Markdown, bullets, headings or bold formatting.
17. Return plain text only.
18. Do not create human-handover messages. The application handles that separately.

BUSINESS-SPECIFIC INSTRUCTIONS:
${customInstructions || "None"}

VERIFIED BUSINESS INFORMATION:
${knowledgeContext}
`.trim();
}

/*
|--------------------------------------------------------------------------
| Conversation History
|--------------------------------------------------------------------------
| Only the latest 4 messages are needed for normal website chat.
|--------------------------------------------------------------------------
*/
function buildConversationHistory(history = []) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-4)
    .map((message) => {
      const role =
        message?.sender === "visitor"
          ? "user"
          : "assistant";

      const content = String(
        message?.message || ""
      )
        .trim()
        .slice(0, 1200);

      return {
        role,
        content,
      };
    })
    .filter(
      (message) =>
        message.content
    );
}

/*
|--------------------------------------------------------------------------
| Generate AI Reply
|--------------------------------------------------------------------------
*/
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

  const cleanUserMessage = String(
    userMessage || ""
  )
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

  /*
  |--------------------------------------------------------------------------
  | Very simple greetings don't need OpenAI.
  |--------------------------------------------------------------------------
  */
  const greetingRegex =
    /^(hi|hii|hiii|hello|hey|heyy|namaste|good morning|good afternoon|good evening)$/i;

  if (
    greetingRegex.test(
      cleanUserMessage
    )
  ) {
    const assistantName = String(
      assistant?.assistantName ||
        "AI Assistant"
    ).trim();

    const greeting =
      `Hi 👋 I'm ${assistantName}. How can I help you today?`;

    return {
      text: greeting,
      shouldReply: true,
      needsHuman: false,
      providerConfigured: true,
      localResponse: true,
    };
  }

  const systemPrompt =
    buildSystemPrompt({
      assistant,
      knowledge,
    });

  const conversationHistory =
    buildConversationHistory(
      history
    );

  const input = [
    {
      role: "system",
      content: systemPrompt,
    },

    ...conversationHistory,

    {
      role: "user",
      content: cleanUserMessage,
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
        knowledgeCount:
          Math.min(
            Array.isArray(knowledge)
              ? knowledge.length
              : 0,
            3
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

          /*
          |--------------------------------------------------------------------------
          | Keep output short.
          |--------------------------------------------------------------------------
          */
          max_output_tokens: 150,
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

    const answer =
      cleanAnswer(
        rawAnswer
      );

    /*
    |--------------------------------------------------------------------------
    | NO_REPLY
    |--------------------------------------------------------------------------
    */
    if (
      !answer ||
      answer === "NO_REPLY"
    ) {
      console.log(
        "AI DECISION: NO_REPLY"
      );

      return {
        text: "",
        shouldReply: false,
        needsHuman: false,
        providerConfigured: true,
      };
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
    const status =
      error?.response?.status;

    const errorData =
      error?.response?.data ||
      null;

    console.error(
      "OPENAI API ERROR STATUS:",
      status
    );

    console.error(
      "OPENAI API ERROR:",
      errorData ||
        error?.message ||
        "Unknown OpenAI error"
    );

    return {
      text: "",
      shouldReply: false,
      needsHuman: false,
      providerConfigured: true,

      error:
        status === 401
          ? "OPENAI_AUTH_ERROR"
          : status === 429
            ? "OPENAI_QUOTA_OR_RATE_LIMIT"
            : status === 400
              ? "OPENAI_BAD_REQUEST"
              : error?.code ===
                "ECONNABORTED"
                ? "OPENAI_TIMEOUT"
                : "OPENAI_REQUEST_FAILED",
    };
  }
}

module.exports = {
  generateAIReply,
};