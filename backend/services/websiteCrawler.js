const axios = require("axios");
const { URL } = require("url");
const cheerio = require("cheerio");
const AIKnowledge = require("../models/AIKnowledge");

function normalizeUrl(value, baseUrl = null) {
  try {
    const url = baseUrl
      ? new URL(value, baseUrl)
      : new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    url.hash = "";
    url.search = "";

    url.hostname = url.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    url.pathname = url.pathname
      .replace(/\/{2,}/g, "/");

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch (_) {
    return null;
  }
}

function normalizeHost(hostname) {
  return String(hostname || "")
    .toLowerCase()
    .replace(/^www\./, "");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeText(value) {
  return cleanText(
    String(value || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
  );
}

function isFileUrl(url) {
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg|ico|zip|rar|doc|docx|xls|xlsx|csv|ppt|pptx|mp4|mp3|wav|avi|mov|webm)$/i.test(
    new URL(url).pathname
  );
}

function isUsefulText(text) {
  const value = cleanText(text);

  if (!value) return false;
  if (value.length < 2) return false;

  const alphaNumeric = value.replace(
    /[^a-z0-9]/gi,
    ""
  );

  return alphaNumeric.length >= 2;
}

function getPageTitle($, fallback) {
  const title = cleanText(
    $("title").first().text()
  );

  const h1 = cleanText(
    $("h1").first().text()
  );

  return title || h1 || fallback;
}

function getMainContainer($) {
  const selectors = [
    "main",
    "article",
    '[role="main"]',
    ".main-content",
    ".page-content",
    ".content-area",
    ".site-content",
    ".entry-content",
    ".post-content",
    ".single-content",
    "#main-content",
    "#content"
  ];

  for (const selector of selectors) {
    const element = $(selector).first();

    if (element.length) {
      return element;
    }
  }

  return $("body").first();
}

function removeNoise($, root) {
  root
    .find(
      [
        "script",
        "style",
        "noscript",
        "svg",
        "iframe",
        "canvas",
        "template",
        "form",
        "video",
        "audio",
        "source",
        "picture",
        "button",
        "input",
        "select",
        "textarea"
      ].join(",")
    )
    .remove();

  root
    .find(
      [
        "[aria-hidden='true']",
        "[hidden]",
        ".cookie",
        ".cookies",
        ".cookie-banner",
        ".cookie-consent",
        ".popup",
        ".modal",
        ".newsletter",
        ".subscribe-popup",
        ".social-share",
        ".share-buttons",
        ".breadcrumb"
      ].join(",")
    )
    .remove();

  root
    .find(
      [
        "nav",
        ".navbar",
        ".navigation",
        ".menu",
        ".main-menu",
        ".mobile-menu",
        ".header-menu",
        ".footer-menu",
        ".sidebar-menu"
      ].join(",")
    )
    .remove();
}

function extractBlocks($, root) {
  const blocks = [];

  const selectors = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "li",
    "dt",
    "dd",
    "blockquote",
    "figcaption",
    "td",
    "th"
  ];

  root.find(selectors.join(",")).each((index, element) => {
    const tag = String(
      element.tagName || ""
    ).toLowerCase();

    const text = decodeText(
      $(element).text()
    );

    if (!isUsefulText(text)) return;

    if (
      ["li", "p", "dd", "dt", "blockquote", "figcaption", "td", "th"].includes(tag) &&
      text.length < 8
    ) {
      return;
    }

    blocks.push({
      index,
      tag,
      text,
      isHeading: /^h[1-6]$/.test(tag)
    });
  });

  if (!blocks.length) {
    const fallback = decodeText(
      root.text()
    );

    if (fallback) {
      return [
        {
          index: 0,
          tag: "body",
          text: fallback,
          isHeading: false
        }
      ];
    }
  }

  return blocks;
}

function buildSections(blocks) {
  const sections = [];
  let currentHeading = "";

  for (const block of blocks) {
    if (block.isHeading) {
      currentHeading = block.text;

      sections.push({
        heading: currentHeading,
        text: currentHeading
      });

      continue;
    }

    sections.push({
      heading: currentHeading,
      text: block.text
    });
  }

  return sections;
}

function normalizeForDuplicate(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removeDuplicateBlocks(sections, globalSeen) {
  const unique = [];

  for (const section of sections) {
    const normalized = normalizeForDuplicate(
      section.text
    );

    if (!normalized) continue;

    if (normalized.length < 20) {
      unique.push(section);
      continue;
    }

    if (globalSeen.has(normalized)) {
      continue;
    }

    globalSeen.add(normalized);
    unique.push(section);
  }

  return unique;
}

function buildTextBlocks(sections) {
  const blocks = [];

  for (const section of sections) {
    const heading = cleanText(
      section.heading
    );

    const text = cleanText(
      section.text
    );

    if (!text) continue;

    if (
      heading &&
      text !== heading
    ) {
      blocks.push(
        `Section: ${heading}\n${text}`
      );
    } else {
      blocks.push(text);
    }
  }

  return blocks;
}

function splitLongText(text, maxLength) {
  const value = cleanText(text);

  if (!value) return [];

  if (value.length <= maxLength) {
    return [value];
  }

  const sentences = value.match(
    /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g
  ) || [value];

  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const part = cleanText(sentence);

    if (!part) continue;

    if (
      current &&
      current.length + part.length + 1 > maxLength
    ) {
      chunks.push(current.trim());
      current = part;
      continue;
    }

    if (
      !current &&
      part.length > maxLength
    ) {
      let remaining = part;

      while (remaining.length > maxLength) {
        let cut = remaining.lastIndexOf(
          " ",
          maxLength
        );

        if (cut < Math.floor(maxLength * 0.6)) {
          cut = maxLength;
        }

        chunks.push(
          remaining.slice(0, cut).trim()
        );

        remaining = remaining
          .slice(cut)
          .trim();
      }

      current = remaining;
      continue;
    }

    current = current
      ? `${current} ${part}`
      : part;
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks;
}

function createChunks(
  blocks,
  maxLength = 1800
) {
  const chunks = [];
  let current = "";

  for (const block of blocks) {
    const text = cleanText(block);

    if (!text) continue;

    if (
      current &&
      current.length + text.length + 2 > maxLength
    ) {
      chunks.push(current.trim());
      current = "";
    }

    if (text.length > maxLength) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }

      const longChunks = splitLongText(
        text,
        maxLength
      );

      chunks.push(...longChunks);
      continue;
    }

    current = current
      ? `${current}\n\n${text}`
      : text;
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks.filter(
    (chunk) => chunk.length >= 40
  );
}

function extractLinks($, baseUrl, rootHost) {
  const links = new Set();

  $("a[href]").each((_, element) => {
    const href = String(
      $(element).attr("href") || ""
    ).trim();

    if (!href) return;

    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return;
    }

    const normalized = normalizeUrl(
      href,
      baseUrl
    );

    if (!normalized) return;

    try {
      const parsed = new URL(normalized);

      if (
        normalizeHost(parsed.hostname) !==
        rootHost
      ) {
        return;
      }

      if (isFileUrl(normalized)) {
        return;
      }

      links.add(normalized);
    } catch (_) {}
  });

  return [...links];
}

async function fetchPage(url) {
  const response = await axios.get(url, {
    timeout: 20000,
    maxContentLength: 8 * 1024 * 1024,
    maxBodyLength: 8 * 1024 * 1024,
    responseType: "text",
    headers: {
      "User-Agent":
        "SaleVitals-AI-Crawler/2.0",
      Accept:
        "text/html,application/xhtml+xml"
    },
    validateStatus: (status) =>
      status >= 200 && status < 400
  });

  const contentType = String(
    response.headers["content-type"] || ""
  ).toLowerCase();

  if (
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml+xml")
  ) {
    return null;
  }

  return String(
    response.data || ""
  );
}

async function crawlWebsite({
  ownerId,
  assistantId,
  websiteUrl,
  maxPages = 30
}) {
  const startUrl = normalizeUrl(
    websiteUrl
  );

  if (!startUrl) {
    throw new Error(
      "Invalid website URL"
    );
  }

  const start = new URL(startUrl);
  const rootHost = normalizeHost(
    start.hostname
  );

  const queue = [startUrl];
  const queued = new Set([startUrl]);
  const visited = new Set();
  const pages = [];
  const globalSeenBlocks = new Set();

  while (
    queue.length &&
    visited.size < maxPages
  ) {
    const current = queue.shift();

    if (!current) continue;
    if (visited.has(current)) continue;

    visited.add(current);

    let html = "";

    try {
      html = await fetchPage(current);
    } catch (error) {
      console.error(
        "CRAWL PAGE ERROR:",
        current,
        error?.message || error
      );
      continue;
    }

    if (!html) continue;

    const $ = cheerio.load(
      html,
      {
        decodeEntities: true
      }
    );

    const title = getPageTitle(
      $,
      current
    );

    const root = getMainContainer($);

    if (!root || !root.length) {
      continue;
    }

    removeNoise($, root);

    const blocks = extractBlocks(
      $,
      root
    );

    const sections = buildSections(
      blocks
    );

    const uniqueSections =
      removeDuplicateBlocks(
        sections,
        globalSeenBlocks
      );

    const textBlocks =
      buildTextBlocks(
        uniqueSections
      );

    const chunks = createChunks(
      textBlocks,
      1800
    );

    if (chunks.length) {
      pages.push({
        url: current,
        title,
        chunks
      });
    }

    const links = extractLinks(
      $,
      current,
      rootHost
    );

    for (const link of links) {
      if (visited.has(link)) continue;
      if (queued.has(link)) continue;

      queued.add(link);

      if (
        queue.length <
        maxPages * 4
      ) {
        queue.push(link);
      }
    }
  }

  if (!pages.length) {
    throw new Error(
      "No readable website content was found"
    );
  }

  const docs = [];

  for (const page of pages) {
    page.chunks.forEach(
      (chunk, index) => {
        docs.push({
          ownerId,
          assistantId,
          type: "website",
          title:
            page.chunks.length > 1
              ? `${page.title} (${index + 1})`
              : page.title,
          content: chunk,
          sourceUrl: page.url,
          metadata: {
            crawledAt: new Date(),
            chunk: index + 1,
            totalChunks:
              page.chunks.length,
            pageUrl: page.url,
            pageTitle: page.title
          },
          active: true
        });
      }
    );
  }

  if (!docs.length) {
    throw new Error(
      "Website content could not be converted into knowledge"
    );
  }

  await AIKnowledge.deleteMany({
    ownerId,
    assistantId,
    type: "website"
  });

  await AIKnowledge.insertMany(
    docs
  );

  return {
    pages: pages.length,
    chunks: docs.length
  };
}

module.exports = {
  crawlWebsite
};