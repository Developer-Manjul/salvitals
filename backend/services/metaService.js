const GRAPH_VERSION =
  process.env.META_GRAPH_API_VERSION ||
  process.env.META_GRAPH_VERSION ||
  "v25.0";

const GRAPH_BASE =
  `https://graph.facebook.com/${GRAPH_VERSION}`;

function isConfigured() {
  return Boolean(
    process.env.META_APP_ID &&
    process.env.META_APP_SECRET &&
    process.env.META_REDIRECT_URI &&
    process.env.META_WEBHOOK_VERIFY_TOKEN &&
    process.env.META_CONFIG_ID
  );
}

async function graphRequest(path, options = {}) {
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${GRAPH_BASE}${path}`
  );

  if (options.params) {
    Object.entries(options.params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          url.searchParams.set(
            key,
            String(value)
          );
        }
      }
    );
  }

  const response = await fetch(url, {
    method:
      options.method || "GET",

    headers:
      options.headers || {},

    body:
      options.body,
  });

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok || data.error) {
    const error = new Error(
      data.error?.message ||
        "Meta Graph API request failed"
    );

    error.status =
      data.error?.code ||
      response.status;

    error.metaError =
      data.error ||
      null;

    throw error;
  }

  return data;
}

exports.isConfigured =
  isConfigured;

exports.getAuthorizationUrl = (state) => {
  const url = new URL(
    `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`
  );

  url.searchParams.set(
    "client_id",
    process.env.META_APP_ID || ""
  );

  url.searchParams.set(
    "redirect_uri",
    process.env.META_REDIRECT_URI || ""
  );

  url.searchParams.set(
    "config_id",
    process.env.META_CONFIG_ID || ""
  );

  url.searchParams.set(
    "state",
    state
  );

  url.searchParams.set(
    "response_type",
    "code"
  );

  return url.toString();
};


exports.exchangeCodeForToken =
  (code) =>
    graphRequest(
      "/oauth/access_token",
      {
        params: {
          client_id:
            process.env.META_APP_ID,

          client_secret:
            process.env.META_APP_SECRET,

          redirect_uri:
            process.env.META_REDIRECT_URI,

          code,
        },
      }
    );

exports.getPages =
  (accessToken) =>
    graphRequest(
      "/me/accounts",
      {
        params: {
          fields:
  "id,name,access_token,instagram_business_account",

          access_token:
            accessToken,
        },
      }
    );

exports.getPageDetails =
  async (
    pageId,
    accessToken
  ) => {
    const details =
      await graphRequest(
        `/${encodeURIComponent(
          pageId
        )}`,
        {
          params: {
            fields:
  "id,name,instagram_business_account",

            access_token:
              accessToken,
          },
        }
      );

    const instagramAccountId =
      details
        ?.instagram_business_account
        ?.id || "";

    if (instagramAccountId) {
      try {
        const instagram =
          await graphRequest(
            `/${encodeURIComponent(
              instagramAccountId
            )}`,
            {
              params: {
                fields:
                  "id,username,name,profile_picture_url",

                access_token:
                  accessToken,
              },
            }
          );

        details.instagram_business_account = {
          id:
            instagram.id ||
            instagramAccountId,

          username:
            instagram.username ||
            "",

          name:
            instagram.name ||
            "",

          profile_picture_url:
            instagram.profile_picture_url ||
            "",
        };
      } catch (error) {
        console.error(
          "META INSTAGRAM PROFILE ERROR:",
          error.metaError ||
            error.message
        );
      }
    }

    console.log(
      "META PAGE DETAILS:",
      {
        pageId:
          details?.id ||
          String(pageId),

        instagramAccountId:
          details
            ?.instagram_business_account
            ?.id || "",

        instagramUsername:
          details
            ?.instagram_business_account
            ?.username || "",
      }
    );

    return details;
  };

exports.getLeadDetails =
  (
    leadId,
    accessToken
  ) =>
    graphRequest(
      `/${encodeURIComponent(
        leadId
      )}`,
      {
        params: {
          fields:
            "id,created_time,field_data,form_id,ad_id,campaign_id,platform",

          access_token:
            accessToken,
        },
      }
    );

exports.subscribePageToLeadgen = (
  pageId,
  pageAccessToken
) =>
  graphRequest(
    `/${encodeURIComponent(pageId)}/subscribed_apps`,
    {
      method: "POST",
      params: {
        subscribed_fields: "leadgen",
        access_token: pageAccessToken,
      },
    }
  );

exports.getPageLeadgenSubscription =
  (
    pageId,
    pageAccessToken
  ) =>
    graphRequest(
      `/${encodeURIComponent(
        pageId
      )}/subscribed_apps`,
      {
        params: {
          access_token:
            pageAccessToken,
        },
      }
    );

exports.refreshConnection =
  async (
    integration,
    accessToken
  ) =>
    exports.getPageDetails(
      integration.pageId,
      accessToken
    );

exports.graphRequest =
  graphRequest;