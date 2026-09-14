const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function isConfigured() {
  return Boolean(
    process.env.META_APP_ID &&
    process.env.META_APP_SECRET &&
    process.env.META_REDIRECT_URI &&
    process.env.META_WEBHOOK_VERIFY_TOKEN
  );
}

async function graphRequest(path, options = {}) {
  const url = new URL(path.startsWith("http") ? path : `${GRAPH_BASE}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") url.searchParams.set(key, value);
    });
  }
  const response = await fetch(url, { method: options.method || "GET", headers: options.headers, body: options.body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error?.message || "Meta Graph API request failed");
  return data;
}

exports.isConfigured = isConfigured;
exports.getAuthorizationUrl = (state) => {
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", process.env.META_APP_ID || "");
  url.searchParams.set("redirect_uri", process.env.META_REDIRECT_URI || "");
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", ["pages_show_list", "pages_read_engagement", "leads_retrieval", "business_management", "instagram_basic"].join(","));
  return url.toString();
};

exports.exchangeCodeForToken = (code) => graphRequest("/oauth/access_token", {
  params: { client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: process.env.META_REDIRECT_URI, code },
});

exports.getPages = (accessToken) => graphRequest("/me/accounts", {
  params: { fields: "id,name,access_token,instagram_business_account{id,username},business{id,name}", access_token: accessToken },
});

exports.getPageDetails = (pageId, accessToken) => graphRequest(`/${encodeURIComponent(pageId)}`, {
  params: { fields: "id,name,instagram_business_account{id,username},business{id,name}", access_token: accessToken },
});

exports.getLeadDetails = (leadId, accessToken) => graphRequest(`/${encodeURIComponent(leadId)}`, {
  params: { fields: "id,created_time,field_data,form_id,ad_id,campaign_id", access_token: accessToken },
});

exports.refreshConnection = async (integration, accessToken) => exports.getPageDetails(integration.pageId, accessToken);
exports.graphRequest = graphRequest;