const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

const Lead = require("../models/Lead");
const GoogleIntegration = require("../models/GoogleIntegration");

const {
    encrypt,
    decrypt,
} = require("../utils/encryption");

/* =========================================
   GOOGLE OAUTH CONFIG
========================================= */

const GOOGLE_ADS_SCOPE =
    "https://www.googleapis.com/auth/adwords";

const GOOGLE_OAUTH_SCOPES = [
    GOOGLE_ADS_SCOPE,
    "openid",
    "email",
    "profile",
];

/* =========================================
   USER ID FROM SALEVITALS JWT
========================================= */

function getUserId(req) {
    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    try {
        const decoded = jwt.verify(
            authorization.slice(7),
            process.env.JWT_SECRET
        );

        return (
            decoded.id ||
            decoded._id ||
            decoded.userId ||
            null
        );
    } catch (error) {
        return null;
    }
}

/* =========================================
   GOOGLE OAUTH CLIENT
========================================= */

function getGoogleOAuthClient() {
    const clientId =
        process.env.GOOGLE_CLIENT_ID || "";

    const clientSecret =
        process.env.GOOGLE_CLIENT_SECRET || "";

    const redirectUri =
        process.env.GOOGLE_REDIRECT_URI || "";

    if (
        !clientId ||
        !clientSecret ||
        !redirectUri
    ) {
        throw new Error(
            "Google OAuth environment variables are not configured"
        );
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
}

/* =========================================
   GOOGLE OAUTH CONNECT
========================================= */

exports.connect = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        /*
         * Random value prevents OAuth state reuse.
         */
        const nonce =
            crypto.randomBytes(32).toString(
                "hex"
            );

        /*
         * State contains the logged-in SaleVitals
         * user ID and is signed with JWT_SECRET.
         *
         * Google redirects back without our
         * Authorization header, so we carry the
         * SaleVitals user identity securely in state.
         */
        const state = jwt.sign(
            {
                userId: String(userId),
                nonce,
                provider: "google-ads",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "10m",
            }
        );

        const oauth2Client =
            getGoogleOAuthClient();

        const authorizationUrl =
            oauth2Client.generateAuthUrl({
                access_type: "offline",

                prompt:
                    "consent select_account",

                scope:
                    GOOGLE_OAUTH_SCOPES,

                state,

                include_granted_scopes:
                    true,
            });

        return res.json({
            success: true,
            authorizationUrl,
        });
    } catch (error) {
        console.error(
            "GOOGLE OAUTH CONNECT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to start Google Ads connection",
        });
    }
};

/* =========================================
   GOOGLE OAUTH CALLBACK
========================================= */

exports.callback = async (req, res) => {
    try {
        const {
            code,
            state,
            error,
        } = req.query;

        /*
         * User cancelled Google permission screen.
         */
        if (error) {
            console.error(
                "GOOGLE OAUTH ERROR:",
                error
            );

            return res.redirect(
                `${process.env.FRONTEND_URL}/settings/integrations?google=cancelled`
            );
        }

        if (!code || !state) {
            return res.status(400).send(
                "Google OAuth code or state is missing"
            );
        }

        /* =========================================
           VERIFY STATE
        ========================================== */

        let stateData;

        try {
            stateData = jwt.verify(
                state,
                process.env.JWT_SECRET
            );
        } catch (stateError) {
            console.error(
                "GOOGLE OAUTH INVALID STATE:",
                stateError
            );

            return res.status(400).send(
                "Invalid or expired Google OAuth state"
            );
        }

        if (
            !stateData.userId ||
            stateData.provider !==
                "google-ads"
        ) {
            return res.status(400).send(
                "Invalid Google OAuth state"
            );
        }

        const userId =
            stateData.userId;

        /* =========================================
           EXCHANGE AUTHORIZATION CODE
        ========================================== */

        const oauth2Client =
            getGoogleOAuthClient();

        const {
            tokens,
        } = await oauth2Client.getToken(
            code
        );

        if (!tokens.access_token) {
            throw new Error(
                "Google did not return an access token"
            );
        }

        oauth2Client.setCredentials(
            tokens
        );

        console.log(
            "GOOGLE OAUTH TOKENS RECEIVED"
        );

        /* =========================================
           GOOGLE USER INFORMATION
        ========================================== */

        let googleUserId = "";
        let googleEmail = "";

        /*
         * token info gives us the Google user
         * identity associated with the token.
         */
        try {
            const tokenInfo =
                await oauth2Client.getTokenInfo(
                    tokens.access_token
                );

            googleUserId =
                tokenInfo.sub ||
                tokenInfo.user_id ||
                "";

            googleEmail =
                tokenInfo.email ||
                "";
        } catch (tokenInfoError) {
            console.error(
                "GOOGLE TOKEN INFO ERROR:",
                tokenInfoError
            );
        }

        /*
         * Fallback to Google OAuth userinfo API
         * if email was not available in token info.
         */
        if (
            !googleEmail ||
            !googleUserId
        ) {
            try {
                const oauth2 =
                    google.oauth2({
                        auth: oauth2Client,
                        version: "v2",
                    });

                const {
                    data,
                } =
                    await oauth2.userinfo.get();

                googleUserId =
                    googleUserId ||
                    data.id ||
                    "";

                googleEmail =
                    googleEmail ||
                    data.email ||
                    "";
            } catch (userInfoError) {
                console.error(
                    "GOOGLE USER INFO ERROR:",
                    userInfoError
                );
            }
        }

        /* =========================================
           ENCRYPT TOKENS
        ========================================== */

        const encryptedAccessToken =
            encrypt(
                tokens.access_token
            );

        let encryptedRefreshToken =
            "";

        /*
         * Google normally returns refresh_token
         * when offline access is granted.
         *
         * On subsequent authorization Google may
         * omit it. In that case we preserve the
         * previously stored refresh token.
         */
        if (tokens.refresh_token) {
            encryptedRefreshToken =
                encrypt(
                    tokens.refresh_token
                );
        }

        const tokenExpiresAt =
            tokens.expiry_date
                ? new Date(
                    tokens.expiry_date
                )
                : null;

        /* =========================================
           SAVE / UPDATE GOOGLE INTEGRATION
        ========================================== */

        let integration =
            await GoogleIntegration.findOne({
                userId,
            });

        if (integration) {
            integration.googleUserId =
                googleUserId ||
                integration.googleUserId ||
                "";

            integration.googleEmail =
                googleEmail ||
                integration.googleEmail ||
                "";

            integration.accessTokenEncrypted =
                encryptedAccessToken;

            /*
             * Only replace refresh token when
             * Google actually returned a new one.
             */
            if (
                encryptedRefreshToken
            ) {
                integration.refreshTokenEncrypted =
                    encryptedRefreshToken;
            }

            integration.tokenExpiresAt =
                tokenExpiresAt;

            integration.isActive =
                true;

            integration.connectedAt =
                new Date();

            await integration.save();
        } else {
            /*
             * Customer ID is intentionally NOT
             * supplied by the user.
             *
             * It will be discovered from Google
             * Ads after OAuth.
             */
            integration =
                await GoogleIntegration.create({
                    userId,

                    googleUserId,

                    googleEmail,

                    customerId:
                        "PENDING",

                    customerName:
                        "",

                    loginCustomerId:
                        "",

                    accessTokenEncrypted:
                        encryptedAccessToken,

                    refreshTokenEncrypted:
                        encryptedRefreshToken,

                    tokenExpiresAt,

                    isActive:
                        true,

                    connectedAt:
                        new Date(),
                });
        }

        console.log(
            "GOOGLE ADS OAUTH CONNECTED:",
            {
                userId,
                googleUserId,
                googleEmail,
                integrationId:
                    integration._id,
            }
        );

        /* =========================================
           REDIRECT BACK TO SALEVITALS
        ========================================== */

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        return res.redirect(
            `${frontendUrl}/settings/integrations?google=connected`
        );
    } catch (error) {
        console.error(
            "GOOGLE OAUTH CALLBACK ERROR:",
            error
        );

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        return res.redirect(
            `${frontendUrl}/settings/integrations?google=error`
        );
    }
};

/* =========================================
   GOOGLE WEBHOOK
========================================= */

exports.webhook = async (req, res) => {
    try {
        const payload =
            req.body || {};

        console.log(
            "================================="
        );

        console.log(
            "GOOGLE ADS WEBHOOK RECEIVED"
        );

        console.log(
            JSON.stringify(
                payload,
                null,
                2
            )
        );

        console.log(
            "================================="
        );

        /*
         * Google test request.
         */
        if (
            payload.is_test === true
        ) {
            return res.status(200).json(
                {}
            );
        }

        const googleKey =
            String(
                payload.google_key ||
                    ""
            ).trim();

        if (!googleKey) {
            return res.status(400).json({
                message:
                    "Google webhook key is missing",
            });
        }

        /*
         * Find SaleVitals Google integration
         * using the Google webhook secret.
         */
        const integration =
            await GoogleIntegration.findOne(
                {
                    webhookSecret:
                        googleKey,

                    isActive:
                        true,
                }
            );

        if (!integration) {
            console.error(
                "GOOGLE WEBHOOK INVALID KEY"
            );

            return res.status(400).json({
                message:
                    "Invalid Google webhook key",
            });
        }

        const googleLeadId =
            String(
                payload.lead_id ||
                    ""
            ).trim();

        if (!googleLeadId) {
            return res.status(400).json({
                message:
                    "Google lead ID is missing",
            });
        }

        /* =========================================
           DUPLICATE PROTECTION
        ========================================== */

        const existing =
            await Lead.findOne({
                userId:
                    integration.userId,

                googleLeadId,
            });

        if (existing) {
            console.log(
                "GOOGLE ADS DUPLICATE LEAD:",
                googleLeadId
            );

            return res.status(200).json(
                {}
            );
        }

        /* =========================================
           USER SUBMITTED FORM DATA
        ========================================== */

        const columns =
            Array.isArray(
                payload.user_column_data
            )
                ? payload.user_column_data
                : [];

        const fieldMap = {};

        for (
            const column of columns
        ) {
            const key =
                String(
                    column?.column_id ||
                        ""
                )
                    .trim()
                    .toUpperCase();

            const value =
                column?.string_value ||
                "";

            if (key) {
                fieldMap[key] =
                    value;
            }
        }

        const name =
            fieldMap.FULL_NAME ||
            [
                fieldMap.FIRST_NAME,
                fieldMap.LAST_NAME,
            ]
                .filter(Boolean)
                .join(" ");

        const phone =
            fieldMap.PHONE_NUMBER ||
            fieldMap.PHONE ||
            "";

        const email =
            fieldMap.EMAIL ||
            fieldMap.EMAIL_ADDRESS ||
            "";

        const service =
            fieldMap.SERVICE ||
            fieldMap.TREATMENT ||
            fieldMap.INTEREST ||
            "";

        /* =========================================
           VALIDATION
        ========================================== */

        if (
            !name &&
            !phone &&
            !email
        ) {
            console.error(
                "GOOGLE ADS LEAD HAS NO CONTACT DATA"
            );

            return res.status(400).json({
                message:
                    "Google lead does not contain contact information",
            });
        }

        /* =========================================
           CREATE CRM LEAD
        ========================================== */

        const lead =
            await Lead.create({
                userId:
                    integration.userId,

                googleLeadId,

                googleCustomerId:
                    integration.customerId ===
                    "PENDING"
                        ? ""
                        : integration.customerId,

                googleCampaignId:
                    payload.campaign_id
                        ? String(
                            payload.campaign_id
                        )
                        : "",

                googleAdGroupId:
                    payload.adgroup_id
                        ? String(
                            payload.adgroup_id
                        )
                        : "",

                googleAdId:
                    payload.creative_id
                        ? String(
                            payload.creative_id
                        )
                        : "",

                googleAssetId:
                    payload.asset_group_id
                        ? String(
                            payload.asset_group_id
                        )
                        : "",

                googleGclid:
                    payload.gcl_id || "",

                name:
                    name ||
                    "Google Ads Lead",

                email,

                phone,

                source:
                    "Google Ads",

                stage:
                    "New",

                service,

                landingPage:
                    payload.form_id
                        ? `Google Lead Form ${payload.form_id}`
                        : "Google Lead Form",

                utmSource:
                    "google",

                utmMedium:
                    "paid",

                utmCampaign:
                    payload.campaign_id
                        ? String(
                            payload.campaign_id
                        )
                        : "",

                firstNote:
                    "Lead received from Google Ads Lead Form",
            });

        console.log(
            "GOOGLE ADS LEAD SAVED:",
            lead._id,

            "GOOGLE LEAD:",
            googleLeadId,

            "USER:",
            integration.userId
        );

        return res.status(200).json(
            {}
        );
    } catch (error) {
        console.error(
            "GOOGLE ADS WEBHOOK ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to process Google Ads lead",
        });
    }
};

/* =========================================
   GENERATE GOOGLE WEBHOOK SECRET
========================================= */

exports.generateWebhookSecret =
    async (req, res) => {
        try {
            const userId =
                getUserId(req);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required",
                });
            }

            const webhookSecret =
                crypto
                    .randomBytes(32)
                    .toString("hex");

            let integration =
                await GoogleIntegration.findOne(
                    {
                        userId,
                    }
                );

            if (integration) {
                integration.webhookSecret =
                    webhookSecret;

                integration.isActive =
                    true;

                await integration.save();
            } else {
                /*
                 * Customer ID is intentionally
                 * pending until Google OAuth/account
                 * discovery is completed.
                 */
                integration =
                    await GoogleIntegration.create(
                        {
                            userId,

                            customerId:
                                "PENDING",

                            webhookSecret,

                            isActive:
                                true,
                        }
                    );
            }

            return res.json({
                success: true,
                webhookSecret,
            });
        } catch (error) {
            console.error(
                "GOOGLE WEBHOOK SECRET ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to generate Google webhook secret",
            });
        }
    };