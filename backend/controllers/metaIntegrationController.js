const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const MetaIntegration =
  require("../models/MetaIntegration");

const MetaOAuthState =
  require("../models/MetaOAuthState");

const Lead =
  require("../models/Lead");

const {
  encrypt,
  decrypt,
} = require("../utils/encryption");

const meta =
  require("../services/metaService");

const {
  processNewLead,
} = require("../services/leadProcessingService");

function getUserId(req) {
  const authorization =
    req.headers.authorization || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  try {
    const decoded =
      jwt.verify(
        authorization.slice(7),
        process.env.JWT_SECRET
      );

    return (
      decoded.id ||
      decoded._id ||
      decoded.userId ||
      null
    );
  } catch {
    return null;
  }
}

function requireUser(
  req,
  res
) {
  const userId =
    getUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message:
        "Authentication required",
    });

    return null;
  }

  return userId;
}

function publicIntegration(
  integration
) {
  if (!integration) {
    return null;
  }

  return {
    id:
      integration._id,

    pageId:
      integration.pageId,

    pageName:
      integration.pageName,

    instagramAccountId:
      integration.instagramAccountId,

    instagramUsername:
      integration.instagramUsername,

    instagramName:
      integration.instagramName,

    instagramProfilePicture:
      integration.instagramProfilePicture,

    facebook: {
      connected:
        Boolean(
          integration.isActive
        ),

      pageId:
        integration.pageId,

      pageName:
        integration.pageName,
    },

    instagram: {
      connected:
        Boolean(
          integration.instagramAccountId
        ),

      accountId:
        integration.instagramAccountId,

      username:
        integration.instagramUsername,

      name:
        integration.instagramName,

      profilePicture:
        integration.instagramProfilePicture,
    },

    businessId:
      integration.businessId,

    businessName:
      integration.businessName,

    isActive:
      integration.isActive,

    connectedAt:
      integration.connectedAt,

    updatedAt:
      integration.updatedAt,
  };
}

function applyInstagramDetails(
  integration,
  details
) {
  const instagram =
    details?.instagram_business_account ||
    details?.instagramBusinessAccount;

  integration.instagramAccountId =
    instagram?.id || "";

  integration.instagramUsername =
    instagram?.username || "";

  integration.instagramName =
    instagram?.name || "";

  integration.instagramProfilePicture =
    instagram?.profile_picture_url || "";
}

function cleanMetaServiceName(
  name
) {
  const value =
    String(name || "").trim();

  if (!value) {
    return "";
  }

  return value
    .split("|")[0]
    .trim();
}

async function getMetaCampaignName(
  campaignId,
  adId,
  accessToken
) {
  let resolvedCampaignId =
    String(
      campaignId || ""
    ).trim();

  let campaignName = "";
  let adName = "";

  const resolvedAdId =
    String(
      adId || ""
    ).trim();

  const graphVersion =
    process.env.META_GRAPH_VERSION ||
    process.env.META_GRAPH_API_VERSION ||
    "v25.0";

  if (
    resolvedCampaignId &&
    accessToken
  ) {
    try {
      const response =
        await axios.get(
          `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
            resolvedCampaignId
          )}`,
          {
            params: {
              fields:
                "id,name",

              access_token:
                accessToken,
            },

            timeout:
              10000,
          }
        );

      campaignName =
        String(
          response.data?.name ||
            ""
        ).trim();
    } catch (error) {
      console.error(
        "META CAMPAIGN NAME FETCH ERROR:",
        error.response?.data ||
          error.message
      );
    }
  }

  if (
    resolvedAdId &&
    accessToken &&
    !campaignName
  ) {
    try {
      const response =
        await axios.get(
          `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
            resolvedAdId
          )}`,
          {
            params: {
              fields:
                "id,name,campaign{id,name}",

              access_token:
                accessToken,
            },

            timeout:
              10000,
          }
        );

      adName =
        String(
          response.data?.name ||
            ""
        ).trim();

      const adCampaignId =
        String(
          response.data?.campaign?.id ||
            ""
        ).trim();

      const adCampaignName =
        String(
          response.data?.campaign?.name ||
            ""
        ).trim();

      if (
        !resolvedCampaignId &&
        adCampaignId
      ) {
        resolvedCampaignId =
          adCampaignId;
      }

      if (
        !campaignName &&
        adCampaignName
      ) {
        campaignName =
          adCampaignName;
      }
    } catch (error) {
      console.error(
        "META AD CAMPAIGN FETCH ERROR:",
        error.response?.data ||
          error.message
      );
    }
  }

  if (
    !campaignName &&
    adName
  ) {
    campaignName =
      adName;
  }

  return {
    campaignId:
      resolvedCampaignId,

    campaignName:
      campaignName || "",

    serviceName:
      cleanMetaServiceName(
        campaignName
      ),

    adName:
      adName || "",
  };
}

exports.connect =
  async (
    req,
    res
  ) => {
    const userId =
      requireUser(
        req,
        res
      );

    if (!userId) {
      return;
    }

    if (
      !meta.isConfigured() ||
      !process.env
        .META_TOKEN_ENCRYPTION_KEY
    ) {
      return res.status(503).json({
        success: false,
        configured: false,
        message:
          "Meta integration is not configured yet.",
      });
    }

    try {
      const state =
        crypto
          .randomBytes(32)
          .toString("hex");

      await MetaOAuthState.create({
        state,
        userId,
        expiresAt:
          new Date(
            Date.now() +
              10 *
                60 *
                1000
          ),
      });

      const authorizationUrl =
        meta.getAuthorizationUrl(
          state
        );

      if (
        String(
          req.headers.accept ||
            ""
        ).includes(
          "application/json"
        )
      ) {
        return res.json({
          success: true,
          authorizationUrl,
        });
      }

      return res.redirect(
        authorizationUrl
      );
    } catch (error) {
      console.error(
        "META CONNECT ERROR:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to start Meta connection",
      });
    }
  };

exports.callback =
  async (
    req,
    res
  ) => {
    const frontend =
      (
        process.env.FRONTEND_URL ||
        "http://localhost:5173"
      ).replace(
        /\/$/,
        ""
      );

    const stateRecord =
      await MetaOAuthState.findOne({
        state:
          req.query.state,

        expiresAt: {
          $gt:
            new Date(),
        },
      });

    if (!stateRecord) {
      return res.redirect(
        `${frontend}/dashboard?metaError=Invalid%20or%20expired%20Meta%20authorization`
      );
    }

    if (req.query.error) {
      await MetaOAuthState.deleteOne({
        _id:
          stateRecord._id,
      });

      return res.redirect(
        `${frontend}/dashboard?metaError=Meta%20authorization%20was%20cancelled`
      );
    }

    if (!req.query.code) {
      await MetaOAuthState.deleteOne({
        _id:
          stateRecord._id,
      });

      return res.redirect(
        `${frontend}/dashboard?metaError=Meta%20authorization%20code%20missing`
      );
    }

    try {
      const tokenData =
        await meta.exchangeCodeForToken(
          req.query.code
        );

      const pages =
        await meta.getPages(
          tokenData.access_token
        );

      stateRecord.accessTokenEncrypted =
        encrypt(
          tokenData.access_token
        );

      stateRecord.tokenExpiresAt =
        tokenData.expires_in
          ? new Date(
              Date.now() +
                Number(
                  tokenData.expires_in
                ) *
                  1000
            )
          : null;

      stateRecord.pages =
        (
          pages.data || []
        ).map(
          (page) => ({
            id:
              page.id,

            name:
              page.name || "",

            accessToken:
              encrypt(
                page.access_token ||
                  tokenData.access_token
              ),

            instagramAccountId:
              page
                .instagram_business_account
                ?.id || "",

            instagramUsername:
              page
                .instagram_business_account
                ?.username || "",

            instagramName:
              page
                .instagram_business_account
                ?.name || "",

            instagramProfilePicture:
              page
                .instagram_business_account
                ?.profile_picture_url ||
              "",

            businessId:
              page.business?.id ||
              "",

            businessName:
              page.business?.name ||
              "",
          })
        );

      await stateRecord.save();

      return res.redirect(
        `${frontend}/dashboard?metaSelectPage=true`
      );
    } catch (error) {
      console.error(
        "META CALLBACK ERROR:",
        error.response?.data ||
          error.message
      );

      await MetaOAuthState.deleteOne({
        _id:
          stateRecord._id,
      });

      return res.redirect(
        `${frontend}/dashboard?metaError=Unable%20to%20load%20Meta%20Pages`
      );
    }
  };

exports.status =
  async (
    req,
    res
  ) => {
    const userId =
      requireUser(
        req,
        res
      );

    if (!userId) {
      return;
    }

    const integration =
      await MetaIntegration.findOne({
        userId,
        isActive: true,
      }).sort({
        updatedAt: -1,
      });

    if (
      integration &&
      !integration.instagramAccountId
    ) {
      try {
        const details =
          await meta.getPageDetails(
            integration.pageId,
            decrypt(
              integration
                .accessTokenEncrypted
            )
          );

        applyInstagramDetails(
          integration,
          details
        );

        await integration.save();
      } catch (error) {
        console.error(
          "META INSTAGRAM DETECTION ERROR:",
          error.message
        );
      }
    }

    return res.json({
      configured:
        meta.isConfigured() &&
        Boolean(
          process.env
            .META_TOKEN_ENCRYPTION_KEY
        ),

      connected:
        Boolean(
          integration
        ),

      integration:
        publicIntegration(
          integration
        ),
    });
  };

exports.pages =
  async (
    req,
    res
  ) => {
    const userId =
      requireUser(
        req,
        res
      );

    if (!userId) {
      return;
    }

    const state =
      await MetaOAuthState.findOne({
        userId,

        expiresAt: {
          $gt:
            new Date(),
        },
      }).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,

      pages:
        (
          state?.pages ||
          []
        ).map(
          ({
            accessToken,
            ...page
          }) => page
        ),
    });
  };

exports.selectPage =
  async (
    req,
    res
  ) => {
    const userId =
      requireUser(
        req,
        res
      );

    if (!userId) {
      return;
    }

    try {
      const state =
        await MetaOAuthState.findOne({
          userId,

          expiresAt: {
            $gt:
              new Date(),
          },
        }).sort({
          createdAt: -1,
        });

      const page =
        state?.pages?.find(
          (item) =>
            item.id ===
            String(
              req.body?.pageId ||
                ""
            )
        );

      if (
        !state ||
        !page
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Meta Page selection expired or unavailable",
        });
      }

      let pageDetails =
        null;

      try {
        pageDetails =
          await meta.getPageDetails(
            page.id,
            decrypt(
              page.accessToken
            )
          );
      } catch (error) {
        console.error(
          "META INSTAGRAM DETECTION ERROR:",
          error.message
        );
      }

      const integration =
        await MetaIntegration.findOneAndUpdate(
          {
            userId,
            pageId:
              page.id,
          },
          {
            userId,

            pageId:
              page.id,

            pageName:
              page.name,

            instagramAccountId:
              page.instagramAccountId,

            instagramUsername:
              page.instagramUsername,

            instagramName:
              page.instagramName,

            instagramProfilePicture:
              page.instagramProfilePicture,

            businessId:
              page.businessId,

            businessName:
              page.businessName,

            accessTokenEncrypted:
              page.accessToken,

            tokenExpiresAt:
              state.tokenExpiresAt,

            isActive:
              true,

            connectedAt:
              new Date(),
          },
          {
            upsert:
              true,

            new:
              true,

            setDefaultsOnInsert:
              true,
          }
        );

      if (pageDetails) {
        applyInstagramDetails(
          integration,
          pageDetails
        );

        await integration.save();
      }

      try {
        const subscription =
          await meta.subscribePageToLeadgen(
            page.id,
            decrypt(
              page.accessToken
            )
          );

        console.log(
          "META LEADGEN SUBSCRIPTION SUCCESS:",
          page.id,
          subscription
        );
      } catch (
        subscriptionError
      ) {
        console.error(
          "META LEADGEN SUBSCRIPTION ERROR:",
          subscriptionError.metaError ||
            subscriptionError.message
        );

        return res.status(409).json({
          success: false,

          message:
            "Meta Page connected, but Lead Ads webhook subscription failed.",

          details:
            subscriptionError.metaError ||
            subscriptionError.message,
        });
      }

      await MetaOAuthState.deleteOne({
        _id:
          state._id,
      });

      return res.json({
        success: true,

        integration:
          publicIntegration(
            integration
          ),
      });
    } catch (error) {
      console.error(
        "META PAGE SELECT ERROR:",
        error.response?.data ||
          error.message
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to connect Meta Page",
      });
    }
  };

exports.disconnect =
  async (
    req,
    res
  ) => {
    const userId =
      requireUser(
        req,
        res
      );

    if (!userId) {
      return;
    }

    await MetaIntegration.updateMany(
      {
        userId,
      },
      {
        $set: {
          isActive:
            false,
        },
      }
    );

    return res.json({
      success: true,

      message:
        "Meta connection disconnected",
    });
  };

exports.refresh =
  async (
    req,
    res
  ) => {
    const userId =
      requireUser(
        req,
        res
      );

    if (!userId) {
      return;
    }

    try {
      const integration =
        await MetaIntegration.findOne({
          userId,

          isActive:
            true,
        });

      if (!integration) {
        return res.status(404).json({
          success: false,

          message:
            "Meta connection not found",
        });
      }

      const details =
        await meta.refreshConnection(
          integration,

          decrypt(
            integration
              .accessTokenEncrypted
          )
        );

      integration.pageName =
        details.name ||
        integration.pageName;

      applyInstagramDetails(
        integration,
        details
      );

      await integration.save();

      return res.json({
        success: true,

        integration:
          publicIntegration(
            integration
          ),
      });
    } catch (error) {
      console.error(
        "META REFRESH ERROR:",
        error.message
      );

      return res.status(409).json({
        success: false,

        message:
          "Meta connection needs to be reconnected.",
      });
    }
  };

exports.verifyWebhook =
  (
    req,
    res
  ) => {
    if (
      req.query[
        "hub.verify_token"
      ] !==
      process.env
        .META_WEBHOOK_VERIFY_TOKEN
    ) {
      return res.sendStatus(
        403
      );
    }

    return res
      .status(200)
      .send(
        req.query[
          "hub.challenge"
        ]
      );
  };

function fieldMap(
  fieldData = []
) {
  return fieldData.reduce(
    (
      result,
      field
    ) => {
      const key =
        String(
          field?.name || ""
        )
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            "_"
          );

      result[key] =
        field?.values?.[0] ||
        "";

      return result;
    },
    {}
  );
}

function detectMetaLeadSource(
  value = {},
  req,
  metaLead = {}
) {
  const platform =
    String(
      metaLead?.platform ||
        value?.platform ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    platform === "ig" ||
    platform === "instagram"
  ) {
    return "Instagram";
  }

  if (
    platform === "fb" ||
    platform === "facebook"
  ) {
    return "Facebook";
  }

  if (
    value?.instagram_account_id ||
    value?.instagram_account?.id ||
    String(
      value?.source || ""
    ).toLowerCase() ===
      "instagram" ||
    req.body?.object ===
      "instagram"
  ) {
    return "Instagram";
  }

  return "Facebook";
}

exports.receiveWebhook =
  async (
    req,
    res
  ) => {
    res.sendStatus(200);

    try {
      for (
        const entry of
        req.body?.entry ||
        []
      ) {
        const pageId =
          String(
            entry.id || ""
          );

        if (!pageId) {
          continue;
        }

        const integration =
          await MetaIntegration.findOne({
            pageId,

            isActive:
              true,
          });

        if (!integration) {
          console.log(
            "META WEBHOOK PAGE NOT CONNECTED:",
            pageId
          );

          continue;
        }

        for (
          const change of
          entry.changes ||
          []
        ) {
          const value =
            change.value || {};

          const leadId =
            value.leadgen_id ||
            value.lead_id;

          if (!leadId) {
            continue;
          }

          console.log(
            "META WEBHOOK LEAD RECEIVED:",
            leadId,
            "PAGE:",
            pageId,
            "USER:",
            integration.userId
          );

          const token =
            decrypt(
              integration
                .accessTokenEncrypted
            );

          const metaLead =
            await meta.getLeadDetails(
              leadId,
              token
            );

          const fields =
            fieldMap(
              metaLead.field_data
            );

          const adId =
            String(
              metaLead?.ad_id ||
                value?.ad_id ||
                ""
            ).trim();

          const campaignId =
            String(
              metaLead?.campaign_id ||
                value?.campaign_id ||
                ""
            ).trim();

          const campaignResult =
            await getMetaCampaignName(
              campaignId,
              adId,
              token
            );

          const resolvedCampaignId =
            campaignResult.campaignId;

          const campaignName =
            campaignResult.campaignName;

          const serviceName =
            campaignResult.serviceName;

          const existing =
            await Lead.findOne({
              userId:
                integration.userId,

              metaLeadId:
                String(
                  leadId
                ),
            });

          if (existing) {
            if (
              serviceName &&
              !String(
                existing.service ||
                  ""
              ).trim()
            ) {
              existing.service =
                serviceName;

              if (
                resolvedCampaignId &&
                !String(
                  existing.metaCampaignId ||
                    ""
                ).trim()
              ) {
                existing.metaCampaignId =
                  resolvedCampaignId;
              }

              if (
                adId &&
                !String(
                  existing.metaAdId ||
                    ""
                ).trim()
              ) {
                existing.metaAdId =
                  adId;
              }

              await existing.save();
            }

            await processNewLead(
              existing
            );

            console.log(
              "META WEBHOOK DUPLICATE LEAD:",
              leadId
            );

            continue;
          }

          const source =
            detectMetaLeadSource(
              value,
              req,
              metaLead
            );

          const name =
            fields.full_name ||
            [
              fields.first_name,
              fields.last_name,
            ]
              .filter(Boolean)
              .join(" ");

          const phone =
            fields.phone_number ||
            fields.phone ||
            "";

          const email =
            fields.email ||
            "";

          const service =
            serviceName ||
            fields.service ||
            fields.treatment ||
            "";

          const landingPage =
            fields.form_name ||
            integration.pageName ||
            "";

          const lead =
            await Lead.create({
              userId:
                integration.userId,

              metaLeadId:
                String(
                  leadId
                ),

              metaPageId:
                pageId,

              metaFormId:
                metaLead.form_id ||
                value.form_id ||
                "",

              metaAdId:
                adId,

              metaCampaignId:
                resolvedCampaignId,

              name,

              email,

              phone,

              source,

              stage:
                "New",

              service,

              landingPage,

              pageUrl:
                fields.page_url ||
                fields.website ||
                "",

              utmSource:
                source.toLowerCase(),

              utmMedium:
                "paid_social",

              firstNote:
                `Lead received from ${source} Lead Ads`,
            });

          await processNewLead(
            lead
          );

          console.log(
            "META WEBHOOK LEAD SAVED:",
            leadId,
            "SOURCE:",
            source,
            "PAGE:",
            pageId,
            "USER:",
            integration.userId
          );
        }
      }
    } catch (error) {
      console.error(
        "META WEBHOOK PROCESSING ERROR:",
        error.response?.data ||
          error.message
      );
    }
  };

exports.debugLeads =
  async (
    req,
    res
  ) => {
    const userId =
      requireUser(
        req,
        res
      );

    if (!userId) {
      return;
    }

    try {
      const integration =
        await MetaIntegration.findOne({
          userId,

          pageId:
            "115210158180056",

          isActive:
            true,
        });

      if (!integration) {
        return res.status(404).json({
          success: false,

          message:
            "Preeti Meta integration not found",
        });
      }

      const accessToken =
        decrypt(
          integration
            .accessTokenEncrypted
        );

      const graphVersion =
        process.env.META_GRAPH_VERSION ||
        process.env.META_GRAPH_API_VERSION ||
        "v25.0";

      const url =
        `https://graph.facebook.com/${graphVersion}/${integration.pageId}/leadgen_forms`;

      const response =
        await axios.get(
          url,
          {
            params: {
              fields:
                "id,name,leads.limit(20){id,created_time}",

              access_token:
                accessToken,
            },

            timeout:
              15000,
          }
        );

      const forms =
        response.data?.data ||
        [];

      const leads = [];

      for (
        const form of forms
      ) {
        for (
          const lead of
          form.leads?.data ||
          []
        ) {
          leads.push({
            leadgen_id:
              lead.id,

            created_time:
              lead.created_time,

            form_id:
              form.id,

            form_name:
              form.name,
          });
        }
      }

      return res.json({
        success: true,

        pageId:
          integration.pageId,

        pageName:
          integration.pageName,

        total:
          leads.length,

        leads,
      });
    } catch (error) {
      console.error(
        "META DEBUG LEADS ERROR:",
        error.response?.data ||
          error.message
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch Meta leads",

        error:
          error.response?.data ||
          error.message,
      });
    }
  };

exports.debugLeadgenSubscription =
  async (req, res) => {
    const userId =
      requireUser(req, res);

    if (!userId) {
      return;
    }

    try {
      const integration =
        await MetaIntegration.findOne({
          pageId: "115210158180056",
        });

      console.log(
        "DEBUG PREETI INTEGRATION:",
        integration
      );

      if (!integration) {
        return res.status(404).json({
          success: false,
          message:
            "Preeti Meta integration not found",
        });
      }

      const accessToken =
        decrypt(
          integration.accessTokenEncrypted
        );

      const subscription =
        await meta.getPageLeadgenSubscription(
          integration.pageId,
          accessToken
        );

      return res.json({
        success: true,
        pageId:
          integration.pageId,
        pageName:
          integration.pageName,
        userId:
          integration.userId,
        subscription,
      });
    } catch (error) {
      console.error(
        "META DEBUG SUBSCRIPTION ERROR:",
        error.metaError ||
          error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to check Meta Leadgen subscription",
        error:
          error.metaError ||
          error.message,
      });
    }
  };