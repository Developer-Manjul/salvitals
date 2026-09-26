require("dotenv").config();

const mongoose = require("mongoose");
const axios = require("axios");

const MetaIntegration = require("../models/MetaIntegration");
const Lead = require("../models/Lead");

const {
  decrypt,
} = require("../utils/encryption");


const GRAPH_VERSION =
  process.env.META_GRAPH_VERSION ||
  process.env.META_GRAPH_API_VERSION ||
  "v25.0";


async function getCampaignName(
  campaignId,
  accessToken
) {
  if (!campaignId || !accessToken) {
    return "";
  }

  try {
    const response =
      await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/${campaignId}`,
        {
          params: {
            fields: "id,name",
            access_token:
              accessToken,
          },

          timeout: 10000,
        }
      );

    return String(
      response.data?.name || ""
    ).trim();
  } catch (error) {
    console.error(
      "CAMPAIGN API ERROR:",
      error.response?.data ||
        error.message
    );

    return "";
  }
}


async function getCampaignFromAd(
  adId,
  accessToken
) {
  if (!adId || !accessToken) {
    return null;
  }

  try {
    const response =
      await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/${adId}`,
        {
          params: {
            fields:
              "id,campaign{id,name}",

            access_token:
              accessToken,
          },

          timeout: 10000,
        }
      );

    const campaign =
      response.data?.campaign;

    if (!campaign) {
      return null;
    }

    return {
      id:
        String(
          campaign.id || ""
        ).trim(),

      name:
        String(
          campaign.name || ""
        ).trim(),
    };
  } catch (error) {
    console.error(
      "AD API ERROR:",
      error.response?.data ||
        error.message
    );

    return null;
  }
}


async function main() {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection variable not found."
      );
    }

    await mongoose.connect(
      mongoUri
    );

    console.log(
      "MongoDB connected."
    );

    const integrations =
      await MetaIntegration.find({
        isActive: true,
      });

    console.log(
      "Active Meta integrations:",
      integrations.length
    );


    let totalChecked = 0;
    let totalUpdated = 0;


    for (
      const integration of integrations
    ) {
      let accessToken = "";

      try {
        accessToken =
          decrypt(
            integration.accessTokenEncrypted
          );
      } catch (error) {
        console.error(
          "TOKEN DECRYPT ERROR:",
          integration._id,
          error.message
        );

        continue;
      }


      if (!accessToken) {
        console.log(
          "No Meta access token for integration:",
          integration._id
        );

        continue;
      }


      const leads =
  await Lead.find({
    userId:
      integration.userId,

    $and: [
      {
        $or: [
          {
            service: "",
          },
          {
            service: {
              $exists: false,
            },
          },
          {
            service: null,
          },
        ],
      },

      {
        $or: [
          {
            metaCampaignId: {
              $exists: true,
              $ne: "",
            },
          },
          {
            metaAdId: {
              $exists: true,
              $ne: "",
            },
          },
        ],
      },
    ],
  });


      console.log(
        `User ${integration.userId}: ${leads.length} leads to check`
      );


      for (
        const lead of leads
      ) {
        totalChecked++;


        let campaignId =
          String(
            lead.metaCampaignId ||
              ""
          ).trim();

        let campaignName =
          "";


        /*
        |--------------------------------------------------------------------------
        | FIRST: campaign_id
        |--------------------------------------------------------------------------
        */

        if (campaignId) {
          console.log(
            "Checking campaign:",
            campaignId
          );

          campaignName =
            await getCampaignName(
              campaignId,
              accessToken
            );
        }


        /*
        |--------------------------------------------------------------------------
        | FALLBACK: ad_id -> campaign
        |--------------------------------------------------------------------------
        */

        if (
          !campaignName &&
          lead.metaAdId
        ) {
          console.log(
            "Checking ad:",
            lead.metaAdId
          );

          const campaign =
            await getCampaignFromAd(
              lead.metaAdId,
              accessToken
            );

          if (campaign) {
            campaignId =
              campaign.id;

            campaignName =
              campaign.name;
          }
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE LEAD
        |--------------------------------------------------------------------------
        */

        if (campaignName) {
          lead.service =
            campaignName;

          if (campaignId) {
            lead.metaCampaignId =
              campaignId;
          }

          await lead.save();

          totalUpdated++;

          console.log(
            "UPDATED:",
            lead.name,
            "|",
            lead.source,
            "|",
            campaignName
          );
        } else {
          console.log(
            "CAMPAIGN NOT FOUND:",
            lead.name,
            "|",
            lead.source,
            "| Ad:",
            lead.metaAdId || "-",
            "| Campaign:",
            lead.metaCampaignId || "-"
          );
        }
      }
    }


    console.log(
      "--------------------------------"
    );

    console.log(
      "TOTAL CHECKED:",
      totalChecked
    );

    console.log(
      "TOTAL UPDATED:",
      totalUpdated
    );

    console.log(
      "Meta campaign repair completed."
    );


    await mongoose.disconnect();

  } catch (error) {
    console.error(
      "REPAIR SCRIPT ERROR:",
      error.response?.data ||
        error.message
    );

    await mongoose.disconnect();

    process.exit(1);
  }
}


main();