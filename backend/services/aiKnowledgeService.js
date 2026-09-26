const AIKnowledge = require("../models/AIKnowledge");

/*
|--------------------------------------------------------------------------
| TEXT NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, " and ")
    .replace(/&quot;/gi, " ")
    .replace(/&#39;/gi, " ")
    .replace(/&#x27;/gi, " ")
    .replace(/[₹$€£]/g, " currency ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| TOKENIZE
|--------------------------------------------------------------------------
*/

function tokenize(value) {
  return [
    ...new Set(
      normalizeText(value)
        .split(/\s+/)
        .filter((word) => word.length >= 2)
    ),
  ];
}

/*
|--------------------------------------------------------------------------
| STOP WORDS
|--------------------------------------------------------------------------
*/

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "am",
  "was",
  "were",
  "be",
  "been",
  "being",

  "do",
  "does",
  "did",
  "can",
  "could",
  "would",
  "should",
  "will",
  "shall",
  "may",
  "might",
  "must",

  "please",
  "tell",
  "me",
  "give",
  "show",
  "know",
  "want",
  "need",

  "i",
  "we",
  "you",
  "your",
  "my",
  "our",

  "this",
  "that",
  "these",
  "those",
  "it",
  "its",

  "to",
  "of",
  "for",
  "in",
  "on",
  "at",
  "from",
  "with",
  "and",
  "or",
  "but",
  "about",

  "there",
  "here",

  "what",
  "which",
  "who",
  "where",
  "when",
  "why",
  "how",

  "has",
  "have",
  "had",

  "not",
  "no",
  "yes",

  "if",
  "then",
  "than",
  "also",
  "very",
  "just",
  "more",
  "some",
  "any",
  "all",

  "hello",
  "hi",
  "hey",

  "hai",
  "hain",
  "tha",
  "thi",
  "the",
  "h",

  "kya",
  "ka",
  "ki",
  "ke",
  "ko",
  "se",
  "me",
  "mein",
  "mai",
  "par",
  "pe",
  "aur",
  "ya",
  "ye",
  "wo",
  "woh",

  "mujhe",
  "mujhko",
  "aap",
  "apka",
  "apki",
  "apke",

  "mera",
  "meri",
  "mere",

  "batao",
  "bata",
  "bataye",

  "chahiye",

  "kar",
  "karo",
  "kr",
  "kya",
]);

function meaningfulTokens(value) {
  return tokenize(value).filter(
    (token) => !STOP_WORDS.has(token)
  );
}

/*
|--------------------------------------------------------------------------
| GENERIC QUERY CONCEPTS
|--------------------------------------------------------------------------
|
| These describe the visitor's information intent.
| They contain NO business-specific facts.
|--------------------------------------------------------------------------
*/

const CONCEPTS = {
  price: [
    "price",
    "pricing",
    "cost",
    "fee",
    "fees",
    "charge",
    "charges",
    "rate",
    "rates",
    "amount",
    "rupees",
    "rs",
    "inr",
    "currency",
    "kitna",
    "kitne",
    "paisa",
    "paise",
  ],

  availability: [
    "available",
    "availability",
    "timing",
    "timings",
    "time",
    "opening",
    "open",
    "opened",
    "closing",
    "closed",
    "hours",
    "schedule",
    "working",
    "today",
    "tomorrow",
    "morning",
    "afternoon",
    "evening",
    "night",
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "weekend",
    "kab",
    "samay",
  ],

  appointment: [
    "appointment",
    "booking",
    "book",
    "reserve",
    "reservation",
    "schedule",
    "consultation",
    "consult",
    "meeting",
    "demo",
    "call",
    "enquiry",
    "inquiry",
    "register",
    "registration",
  ],

  credentials: [
    "qualification",
    "qualifications",
    "qualified",
    "education",
    "educational",
    "degree",
    "degrees",
    "study",
    "studied",
    "graduate",
    "graduation",
    "postgraduate",
    "background",
    "experience",
    "experienced",
    "years of experience",
    "training",
    "trained",
    "certification",
    "certifications",
    "certificate",
    "certified",
    "fellowship",
    "fellowships",
    "membership",
    "memberships",
    "credential",
    "credentials",
  ],

  person: [
    "person",
    "people",
    "team",
    "member",
    "owner",
    "founder",
    "expert",
    "specialist",
    "consultant",
    "manager",
    "staff",
    "employee",
    "doctor",
    "lawyer",
    "agent",
    "advisor",
    "director",
    "name",
  ],

  location: [
    "location",
    "address",
    "where",
    "located",
    "place",
    "office",
    "branch",
    "branches",
    "area",
    "city",
    "directions",
    "map",
    "near",
  ],

  service: [
    "service",
    "services",
    "product",
    "products",
    "solution",
    "solutions",
    "treatment",
    "treatments",
    "package",
    "packages",
    "plan",
    "plans",
    "offering",
    "offerings",
  ],

  contact: [
    "contact",
    "phone",
    "mobile",
    "number",
    "email",
    "whatsapp",
    "call",
    "reach",
    "connect",
  ],

  policy: [
    "policy",
    "policies",
    "refund",
    "cancellation",
    "cancel",
    "return",
    "returns",
    "terms",
    "condition",
    "conditions",
    "rules",
    "guarantee",
    "warranty",
  ],

  process: [
    "process",
    "procedure",
    "steps",
    "step",
    "how",
    "working",
    "works",
    "method",
    "way",
    "documents",
    "requirement",
    "requirements",
  ],
};

/*
|--------------------------------------------------------------------------
| CONCEPT MATCH
|--------------------------------------------------------------------------
*/

function hasConcept(text, concept) {
  const normalized = normalizeText(text);

  const words = CONCEPTS[concept] || [];

  return words.some((word) => {
    const normalizedWord =
      normalizeText(word);

    if (!normalizedWord) {
      return false;
    }

    /*
    |--------------------------------------------------------------------------
    | Exact word/phrase matching
    |--------------------------------------------------------------------------
    */

    const pattern =
      new RegExp(
        `(^|\\s)${escapeRegExp(
          normalizedWord
        )}(?=\\s|$)`,
        "i"
      );

    return pattern.test(normalized);
  });
}

function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
|--------------------------------------------------------------------------
| QUERY CONCEPTS
|--------------------------------------------------------------------------
*/

function getQueryConcepts(query) {
  const concepts = [];

  for (const concept of Object.keys(CONCEPTS)) {
    if (
      hasConcept(
        query,
        concept
      )
    ) {
      concepts.push(concept);
    }
  }

  return concepts;
}

/*
|--------------------------------------------------------------------------
| INTENT
|--------------------------------------------------------------------------
*/

function getIntent(query) {
  const concepts =
    getQueryConcepts(query);

  /*
  |--------------------------------------------------------------------------
  | More specific intents first
  |--------------------------------------------------------------------------
  */

  if (
    concepts.includes(
      "credentials"
    )
  ) {
    return "credentials";
  }

  if (
    concepts.includes(
      "availability"
    )
  ) {
    return "availability";
  }

  if (
    concepts.includes("price")
  ) {
    return "price";
  }

  if (
    concepts.includes(
      "appointment"
    )
  ) {
    return "appointment";
  }

  if (
    concepts.includes("person")
  ) {
    return "person";
  }

  if (
    concepts.includes("location")
  ) {
    return "location";
  }

  if (
    concepts.includes("contact")
  ) {
    return "contact";
  }

  if (
    concepts.includes("policy")
  ) {
    return "policy";
  }

  if (
    concepts.includes("process")
  ) {
    return "process";
  }

  if (
    concepts.includes("service")
  ) {
    return "service";
  }

  return "general";
}

/*
|--------------------------------------------------------------------------
| QUERY TERMS
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We only use words actually present in the visitor's question.
| We do NOT add every synonym from a concept.
|
|--------------------------------------------------------------------------
*/

function getQueryTerms(query) {
  return [
    ...new Set(
      meaningfulTokens(query)
    ),
  ];
}

/*
|--------------------------------------------------------------------------
| DOCUMENT FREQUENCY
|--------------------------------------------------------------------------
*/

function buildDocumentFrequency(items) {
  const frequency = new Map();

  for (const item of items) {
    const text =
      normalizeText(
        `${item.title || ""} ${
          item.content || ""
        }`
      );

    const tokens =
      new Set(
        meaningfulTokens(text)
      );

    for (const token of tokens) {
      frequency.set(
        token,
        (frequency.get(token) || 0) + 1
      );
    }
  }

  return frequency;
}

/*
|--------------------------------------------------------------------------
| TOKEN WEIGHT
|--------------------------------------------------------------------------
*/

function getTokenWeight(
  token,
  documentFrequency,
  totalDocuments
) {
  const frequency =
    documentFrequency.get(token) || 0;

  if (!frequency) {
    return 8;
  }

  const ratio =
    totalDocuments / frequency;

  let weight =
    Math.log(ratio + 1) * 5;

  /*
  |--------------------------------------------------------------------------
  | Very common business words
  |--------------------------------------------------------------------------
  */

  const genericWords =
    new Set([
      "clinic",
      "hospital",
      "doctor",
      "service",
      "services",
      "product",
      "products",
      "company",
      "business",
      "team",
      "care",
      "best",
      "india",
      "delhi",
      "gurgaon",
      "office",
      "contact",
      "about",
    ]);

  if (
    genericWords.has(token)
  ) {
    weight *= 0.25;
  }

  return Math.max(
    Math.min(weight, 15),
    1
  );
}

/*
|--------------------------------------------------------------------------
| IMPORTANT PHRASES
|--------------------------------------------------------------------------
*/

function getImportantPhrases(query) {
  const normalized =
    normalizeText(query);

  const phrases = [];

  const phrasePatterns = [
    /\bhow much\b/g,
    /\bhow many\b/g,
    /\bhow long\b/g,
    /\bwhat time\b/g,
    /\bwhat is\b/g,
    /\bwho is\b/g,
    /\bwhere is\b/g,
    /\bwhen can\b/g,
    /\bwhen is\b/g,
    /\bcan i\b/g,
    /\bdo you\b/g,
    /\bis there\b/g,

    /\bkitne baje\b/g,
    /\bkitne ka\b/g,
    /\bkitne ki\b/g,
    /\bkitne ke\b/g,

    /\bkaise\b/g,
  ];

  for (const pattern of phrasePatterns) {
    const matches =
      normalized.match(pattern);

    if (matches) {
      phrases.push(
        ...matches
      );
    }
  }

  return [
    ...new Set(phrases),
  ];
}

/*
|--------------------------------------------------------------------------
| GENERIC CREDENTIAL SIGNALS
|--------------------------------------------------------------------------
|
| These are generic indicators of qualification/education/experience.
| They do NOT assume any particular industry.
|--------------------------------------------------------------------------
*/

const CREDENTIAL_SIGNALS = [
  "qualification",
  "qualifications",
  "education",
  "educational",
  "degree",
  "degrees",
  "college",
  "university",
  "school",
  "studied",
  "graduate",
  "graduated",
  "postgraduate",
  "training",
  "trained",
  "certification",
  "certified",
  "certificate",
  "experience",
  "experienced",
  "fellowship",
  "membership",
  "credential",
  "credentials",
];

/*
|--------------------------------------------------------------------------
| PERSON SIGNALS
|--------------------------------------------------------------------------
*/

const PERSON_SIGNALS = [
  "doctor",
  "dr",
  "surgeon",
  "lawyer",
  "founder",
  "owner",
  "director",
  "manager",
  "specialist",
  "expert",
  "consultant",
  "advisor",
  "team",
  "staff",
  "member",
];

/*
|--------------------------------------------------------------------------
| SCORE KNOWLEDGE
|--------------------------------------------------------------------------
*/

function scoreKnowledge(
  query,
  item,
  documentFrequency,
  totalDocuments
) {
  const queryText =
    normalizeText(query);

  if (!queryText) {
    return 0;
  }

  const originalTitle =
    String(
      item.title || ""
    );

  const originalContent =
    String(
      item.content || ""
    );

  const title =
    normalizeText(
      originalTitle
    );

  const content =
    normalizeText(
      originalContent
    );

  const fullText =
    `${title} ${content}`;

  const intent =
    getIntent(query);

  const queryTerms =
    getQueryTerms(query);

  const queryTokens =
    meaningfulTokens(query);

  const importantPhrases =
    getImportantPhrases(query);

  let score = 0;

  /*
  |--------------------------------------------------------------------------
  | EXACT MATCH
  |--------------------------------------------------------------------------
  */

  if (
    title === queryText
  ) {
    score += 200;
  }

  if (
    title.includes(queryText)
  ) {
    score += 120;
  }

  if (
    content.includes(queryText)
  ) {
    score += 45;
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT PHRASES
  |--------------------------------------------------------------------------
  */

  for (const phrase of importantPhrases) {
    if (
      title.includes(phrase)
    ) {
      score += 20;
    }

    if (
      content.includes(phrase)
    ) {
      score += 8;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TOKEN MATCH
  |--------------------------------------------------------------------------
  */

  let titleMatches = 0;
  let contentMatches = 0;

  for (const token of queryTerms) {
    const weight =
      getTokenWeight(
        token,
        documentFrequency,
        totalDocuments
      );

    if (
      title.includes(token)
    ) {
      score += weight * 6;
      titleMatches++;
    }

    if (
      content.includes(token)
    ) {
      score += weight;
      contentMatches++;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | QUERY COVERAGE
  |--------------------------------------------------------------------------
  */

  if (
    queryTokens.length
  ) {
    const titleCoverage =
      titleMatches /
      queryTokens.length;

    const contentCoverage =
      contentMatches /
      queryTokens.length;

    if (
      titleCoverage >= 0.25
    ) {
      score += 15;
    }

    if (
      titleCoverage >= 0.5
    ) {
      score += 30;
    }

    if (
      contentCoverage >= 0.5
    ) {
      score += 20;
    }

    if (
      contentCoverage >= 0.75
    ) {
      score += 35;
    }

    if (
      contentCoverage >= 0.9
    ) {
      score += 45;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CREDENTIALS
  |--------------------------------------------------------------------------
  */

  if (
    intent === "credentials"
  ) {
    /*
    |--------------------------------------------------------------------------
    | Title containing education/qualification signals
    |--------------------------------------------------------------------------
    */

    for (
      const signal of CREDENTIAL_SIGNALS
    ) {
      if (
        title.includes(signal)
      ) {
        score += 75;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Content containing education signals
    |--------------------------------------------------------------------------
    */

    let credentialMatches = 0;

    for (
      const signal of CREDENTIAL_SIGNALS
    ) {
      if (
        content.includes(signal)
      ) {
        credentialMatches++;
      }
    }

    if (
      credentialMatches >= 1
    ) {
      score += 45;
    }

    if (
      credentialMatches >= 2
    ) {
      score += 35;
    }

    if (
      credentialMatches >= 3
    ) {
      score += 30;
    }

    /*
    |--------------------------------------------------------------------------
    | Education-style content
    |--------------------------------------------------------------------------
    */

    const educationPatterns = [
      /\bcollege\b/i,
      /\buniversity\b/i,
      /\bdegree\b/i,
      /\bqualification\b/i,
      /\beducation\b/i,
      /\bgraduat/i,
      /\bpostgraduat/i,
      /\bcertif/i,
      /\btraining\b/i,
      /\bfellowship\b/i,
      /\bmembership\b/i,
    ];

    let educationPatternMatches = 0;

    for (
      const pattern of educationPatterns
    ) {
      if (
        pattern.test(
          originalContent
        )
      ) {
        educationPatternMatches++;
      }
    }

    if (
      educationPatternMatches >= 1
    ) {
      score += 50;
    }

    if (
      educationPatternMatches >= 2
    ) {
      score += 35;
    }

    if (
      educationPatternMatches >= 3
    ) {
      score += 30;
    }

    /*
    |--------------------------------------------------------------------------
    | Experience
    |--------------------------------------------------------------------------
    */

    if (
      /\b\d+\+?\s*(years?|yrs?)\s*(of)?\s*experience\b/i.test(
        originalContent
      )
    ) {
      score += 45;
    }

    if (
      /\bexperience\b/i.test(
        originalContent
      )
    ) {
      score += 20;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PERSON
  |--------------------------------------------------------------------------
  */

  if (
    intent === "person"
  ) {
    /*
    |--------------------------------------------------------------------------
    | Person-related title
    |--------------------------------------------------------------------------
    */

    let titlePersonSignals = 0;

    for (
      const signal of PERSON_SIGNALS
    ) {
      if (
        title.includes(signal)
      ) {
        titlePersonSignals++;
      }
    }

    if (
      titlePersonSignals >= 1
    ) {
      score += 70;
    }

    if (
      titlePersonSignals >= 2
    ) {
      score += 25;
    }

    /*
    |--------------------------------------------------------------------------
    | Person-related content
    |--------------------------------------------------------------------------
    */

    let contentPersonSignals = 0;

    for (
      const signal of PERSON_SIGNALS
    ) {
      if (
        content.includes(signal)
      ) {
        contentPersonSignals++;
      }
    }

    if (
      contentPersonSignals >= 1
    ) {
      score += 30;
    }

    if (
      contentPersonSignals >= 2
    ) {
      score += 20;
    }

    /*
    |--------------------------------------------------------------------------
    | Name-like pattern
    |--------------------------------------------------------------------------
    */

    if (
      /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/.test(
        originalContent
      )
    ) {
      score += 25;
    }

    if (
      /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/.test(
        originalTitle
      )
    ) {
      score += 40;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | AVAILABILITY
  |--------------------------------------------------------------------------
  */

  if (
    intent === "availability"
  ) {
    if (
      hasConcept(
        title,
        "availability"
      )
    ) {
      score += 70;
    }

    if (
      hasConcept(
        content,
        "availability"
      )
    ) {
      score += 35;
    }

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    for (
      const day of days
    ) {
      if (
        queryText.includes(day) &&
        content.includes(day)
      ) {
        score += 70;
      }
    }

    if (
      /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i.test(
        originalContent
      )
    ) {
      score += 30;
    }

    if (
      content.includes("open") ||
      content.includes("closed") ||
      content.includes("opening") ||
      content.includes("closing")
    ) {
      score += 30;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PRICE
  |--------------------------------------------------------------------------
  */

  if (
    intent === "price"
  ) {
    if (
      hasConcept(
        title,
        "price"
      )
    ) {
      score += 65;
    }

    if (
      hasConcept(
        content,
        "price"
      )
    ) {
      score += 35;
    }

    if (
      /₹\s?\d[\d,]*/i.test(
        originalContent
      ) ||
      /\b\d[\d,]*\s?(rs|inr|rupees)\b/i.test(
        originalContent
      )
    ) {
      score += 40;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | APPOINTMENT
  |--------------------------------------------------------------------------
  */

  if (
    intent === "appointment"
  ) {
    if (
      hasConcept(
        title,
        "appointment"
      )
    ) {
      score += 60;
    }

    if (
      hasConcept(
        content,
        "appointment"
      )
    ) {
      score += 35;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  if (
    intent === "location"
  ) {
    if (
      hasConcept(
        title,
        "location"
      )
    ) {
      score += 60;
    }

    if (
      hasConcept(
        content,
        "location"
      )
    ) {
      score += 30;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CONTACT
  |--------------------------------------------------------------------------
  */

  if (
    intent === "contact"
  ) {
    if (
      hasConcept(
        title,
        "contact"
      )
    ) {
      score += 60;
    }

    if (
      hasConcept(
        content,
        "contact"
      )
    ) {
      score += 35;
    }

    if (
      /\b\d{7,15}\b/.test(
        content
      )
    ) {
      score += 20;
    }

    if (
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
        originalContent
      )
    ) {
      score += 20;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | POLICY
  |--------------------------------------------------------------------------
  */

  if (
    intent === "policy"
  ) {
    if (
      hasConcept(
        title,
        "policy"
      )
    ) {
      score += 60;
    }

    if (
      hasConcept(
        content,
        "policy"
      )
    ) {
      score += 35;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PROCESS
  |--------------------------------------------------------------------------
  */

  if (
    intent === "process"
  ) {
    if (
      hasConcept(
        title,
        "process"
      )
    ) {
      score += 60;
    }

    if (
      hasConcept(
        content,
        "process"
      )
    ) {
      score += 30;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SERVICE
  |--------------------------------------------------------------------------
  */

  if (
    intent === "service"
  ) {
    if (
      hasConcept(
        title,
        "service"
      )
    ) {
      score += 55;
    }

    if (
      hasConcept(
        content,
        "service"
      )
    ) {
      score += 30;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TITLE RELEVANCE
  |--------------------------------------------------------------------------
  */

  if (
    title.length > 0 &&
    queryTokens.some(
      (token) =>
        title.includes(token)
    )
  ) {
    score += 20;
  }

  /*
  |--------------------------------------------------------------------------
  | GENERIC PAGE PENALTY
  |--------------------------------------------------------------------------
  */

  const genericPages = [
    "home",
    "homepage",
    "welcome",
    "about us",
    "contact us",
  ];

  if (
    genericPages.includes(title) &&
    queryTokens.length < 3
  ) {
    score -= 20;
  }

  return Math.max(
    Math.round(score),
    0
  );
}

/*
|--------------------------------------------------------------------------
| RESULT DIVERSITY
|--------------------------------------------------------------------------
|
| Avoid returning:
| same-url (1)
| same-url (2)
| same-url (3)
| same-url (4)
|
| Maximum 2 chunks from the same URL.
|--------------------------------------------------------------------------
*/

function diversifyResults(
  scoredResults,
  limit
) {
  const selected = [];
  const sourceCounts =
    new Map();

  /*
  |--------------------------------------------------------------------------
  | First pass:
  | Best result from every source
  |--------------------------------------------------------------------------
  */

  for (
    const result of scoredResults
  ) {
    if (
      selected.length >= limit
    ) {
      break;
    }

    const source =
      String(
        result.item?.sourceUrl ||
          "manual"
      )
        .trim()
        .toLowerCase();

    const count =
      sourceCounts.get(source) || 0;

    if (count === 0) {
      selected.push(result);
      sourceCounts.set(
        source,
        1
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Second pass:
  | Allow maximum 2 chunks per source
  |--------------------------------------------------------------------------
  */

  if (
    selected.length < limit
  ) {
    for (
      const result of scoredResults
    ) {
      if (
        selected.length >= limit
      ) {
        break;
      }

      if (
        selected.includes(result)
      ) {
        continue;
      }

      const source =
        String(
          result.item?.sourceUrl ||
            "manual"
        )
          .trim()
          .toLowerCase();

      const count =
        sourceCounts.get(source) || 0;

      if (count >= 2) {
        continue;
      }

      selected.push(result);

      sourceCounts.set(
        source,
        count + 1
      );
    }
  }

  return selected;
}

/*
|--------------------------------------------------------------------------
| SEARCH KNOWLEDGE
|--------------------------------------------------------------------------
*/

async function searchKnowledge({
  ownerId,
  assistantId,
  query,
  limit = 5,
}) {
  const cleanQuery =
    String(query || "").trim();

  if (!cleanQuery) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Tenant isolation
  |--------------------------------------------------------------------------
  */

  const items =
    await AIKnowledge.find({
      ownerId,
      assistantId,
      active: true,
    })
      .sort({
        updatedAt: -1,
      })
      .lean();

  if (!items.length) {
    console.log(
      "KNOWLEDGE SEARCH:",
      {
        query: cleanQuery,
        intent: "general",
        totalKnowledgeItems: 0,
        matchedItems: 0,
        results: [],
      }
    );

    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Search statistics
  |--------------------------------------------------------------------------
  */

  const documentFrequency =
    buildDocumentFrequency(
      items
    );

  const totalDocuments =
    items.length;

  const intent =
    getIntent(
      cleanQuery
    );

  /*
  |--------------------------------------------------------------------------
  | Score all knowledge
  |--------------------------------------------------------------------------
  */

  const scoredResults =
    items
      .map((item) => ({
        item,

        score:
          scoreKnowledge(
            cleanQuery,
            item,
            documentFrequency,
            totalDocuments
          ),
      }))
      .filter(
        ({ score }) =>
          score >= 15
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  /*
  |--------------------------------------------------------------------------
  | Diverse results
  |--------------------------------------------------------------------------
  */

  const results =
    diversifyResults(
      scoredResults,
      limit
    ).map(
      ({ item, score }) => ({
        ...item,
        _knowledgeScore:
          score,
      })
    );

  /*
  |--------------------------------------------------------------------------
  | Debug Log
  |--------------------------------------------------------------------------
  */

  console.log(
    "KNOWLEDGE SEARCH:",
    {
      query: cleanQuery,

      intent,

      totalKnowledgeItems:
        items.length,

      matchedItems:
        scoredResults.length,

      results:
        results.map(
          (item) => ({
            title:
              item.title,

            type:
              item.type,

            score:
              item._knowledgeScore,

            sourceUrl:
              item.sourceUrl,
          })
        ),
    }
  );

  return results;
}

module.exports = {
  searchKnowledge,
};