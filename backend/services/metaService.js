const GRAPH_VERSION =
  process.env.META_GRAPH_API_VERSION ||
  process.env.META_GRAPH_VERSION ||
  "v25.0";

const GRAPH_BASE =
  `https://graph.facebook.com/${GRAPH_VERSION}`;

const REQUIRED_PERMISSIONS = [
  "leads_retrieval",
  "pages_manage_metadata",
  "pages_show_list",
  "pages_read_engagement",
  "ads_management",
  "instagram_basic",
  "instagram_manage_messages",
  "pages_messaging",
];

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
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body,
  });

  const data = await response
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

exports.isConfigured = isConfigured;

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

  url.searchParams.set(
    "override_default_response_type",
    "true"
  );

  url.searchParams.set(
    "auth_type",
    "rerequest"
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

exports.getPages = async (accessToken) => {
  const pagesMap = new Map();

  const addPages = (items = [], business = null) => {
    for (const page of items) {
      if (!page?.id) {
        continue;
      }

      const existing = pagesMap.get(String(page.id));

      pagesMap.set(String(page.id), {
        ...(existing || {}),
        ...page,
        businessId:
          page.business?.id ||
          existing?.businessId ||
          business?.id ||
          "",
        businessName:
          page.business?.name ||
          existing?.businessName ||
          business?.name ||
          "",
      });
    }
  };

  try {
    const directPages = await graphRequest(
      "/me/accounts",
      {
        params: {
          fields:
            "id,name,access_token,instagram_business_account,business",
          access_token: accessToken,
          limit: 100,
        },
      }
    );

    addPages(directPages?.data || []);

    console.log(
      "META DIRECT PAGES:",
      (directPages?.data || []).map((page) => ({
        id: page.id,
        name: page.name,
        hasPageAccessToken: Boolean(page.access_token),
      }))
    );
  } catch (error) {
    console.error(
      "META DIRECT PAGES ERROR:",
      error.metaError || error.message
    );
  }

  try {
    const businesses = await graphRequest(
      "/me/businesses",
      {
        params: {
          fields: "id,name",
          access_token: accessToken,
          limit: 100,
        },
      }
    );

    console.log(
      "META BUSINESSES:",
      businesses?.data || []
    );

    for (const business of businesses?.data || []) {
      for (const edge of ["owned_pages", "client_pages"]) {
        try {
          const businessPages =
            await graphRequest(
              `/${encodeURIComponent(
                business.id
              )}/${edge}`,
              {
                params: {
                  fields:
                    "id,name,access_token,instagram_business_account,business",
                  access_token: accessToken,
                  limit: 100,
                },
              }
            );

          console.log(
            `META BUSINESS ${edge.toUpperCase()}:`,
            business.id,
            (businessPages?.data || []).map(
              (page) => ({
                id: page.id,
                name: page.name,
                hasPageAccessToken:
                  Boolean(page.access_token),
              })
            )
          );

          addPages(
            businessPages?.data || [],
            business
          );
        } catch (error) {
          console.error(
            `META BUSINESS ${edge.toUpperCase()} ERROR:`,
            business.id,
            error.metaError || error.message
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "META BUSINESS LIST ERROR:",
      error.metaError || error.message
    );
  }

  const pages = Array.from(
    pagesMap.values()
  );

  console.log(
    "META FINAL PAGES:",
    pages.map((page) => ({
      id: page.id,
      name: page.name,
      hasPageAccessToken:
        Boolean(page.access_token),
      businessId:
        page.businessId || "",
      businessName:
        page.businessName || "",
    }))
  );

  return {
    data: pages,
  };
};

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
              "id,name,instagram_business_account,business",

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
    `/${encodeURIComponent(
      pageId
    )}/subscribed_apps`,
    {
      method: "POST",

      params: {
        subscribed_fields:
          "leadgen",

        access_token:
          pageAccessToken,
      },
    }
  );


exports.subscribePageToMessages = (
  pageId,
  pageAccessToken
) =>
  graphRequest(
    `/${encodeURIComponent(pageId)}/subscribed_apps`,
    {
      method: "POST",
      params: {
        subscribed_fields: "messages",
        access_token: pageAccessToken,
      },
    }
  );

  exports.getInstagramMessageSubscriptions = (
    instagramAccountId,
    accessToken
) =>
    graphRequest(
        `/${encodeURIComponent(instagramAccountId)}/subscribed_apps`,
        {
            method: "GET",
            params: {
                access_token: accessToken,
            },
        }
    );

exports.getPageMessageSubscriptions = (
    pageId,
    pageAccessToken
) =>
    graphRequest(
        `/${encodeURIComponent(pageId)}/subscribed_apps`,
        {
            method: "GET",
            params: {
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

exports.requiredPermissions =
  REQUIRED_PERMISSIONS;

  
exports.sendConversationMessage = async ({
  pageId,
  recipientId,
  text,
  accessToken,
}) => {
  if (!pageId || !recipientId || !text || !accessToken) {
    throw new Error("Missing required Meta message fields");
  }

  return graphRequest(
    `/${encodeURIComponent(pageId)}/messages`,
    {
      method: "POST",
      params: {
        access_token: accessToken,
      },
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    }
  );
};

exports.getMessagingParticipantProfile = async ({
    platform,
    participantId,
    pageAccessToken,
}) => {
    if (!participantId || !pageAccessToken) {
        console.warn("META PARTICIPANT PROFILE SKIPPED:", {
            platform,
            hasParticipantId: Boolean(participantId),
            hasAccessToken: Boolean(pageAccessToken),
        });
        return null;
    }

    const isInstagram = platform === "instagram";

    try {
        const fields = isInstagram
            ? "name,username,profile_picture_url"
            : "first_name,last_name,profile_pic";

        const profile = await graphRequest(
            `/${encodeURIComponent(participantId)}`,
            {
                params: {
                    fields,
                    access_token: pageAccessToken,
                },
            }
        );

        // Facebook and Instagram return different picture fields.
        const name = isInstagram
            ? profile.username || profile.name || ""
            : [profile.first_name, profile.last_name]
                  .filter(Boolean)
                  .join(" ");

        const picture = isInstagram
            ? profile.profile_picture_url || ""
            : profile.profile_pic || "";

        const result = {
            name: String(name).trim(),
            picture: String(picture).trim(),
        };

        console.log("META PARTICIPANT PROFILE RESULT:", {
            platform,
            participantId,
            hasName: Boolean(result.name),
            hasPicture: Boolean(result.picture),
        });

        return result;
    } catch (error) {
        console.error(
            "META PARTICIPANT PROFILE FETCH ERROR:",
            JSON.stringify({
                platform,
                participantId,
                status: error.status,
                metaError: error.metaError,
            }, null, 2)
        );

        return null;
    }
};

