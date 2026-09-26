const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

const Lead = require("../models/Lead");
const GoogleIntegration = require("../models/GoogleIntegration");
const { encrypt, decrypt } = require("../utils/encryption");

const GOOGLE_ADS_API_VERSION =
    process.env.GOOGLE_ADS_API_VERSION || "v25";

const GOOGLE_ADS_SCOPE =
    "https://www.googleapis.com/auth/adwords";

const GOOGLE_OAUTH_SCOPES = [
    GOOGLE_ADS_SCOPE,
    "openid",
    "email",
    "profile",
];

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
    } catch {
        return null;
    }
}

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

async function googleAdsRequest({
    url,
    method = "GET",
    accessToken,
    loginCustomerId = "",
    body,
}) {
    if (!accessToken) {
        throw new Error(
            "Google OAuth access token is missing"
        );
    }

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    };

    if (loginCustomerId) {
        headers["login-customer-id"] =
            String(loginCustomerId).replace(
                /-/g,
                ""
            );
    }

    const response = await fetch(url, {
        method,
        headers,
        body:
            body !== undefined
                ? JSON.stringify(body)
                : undefined,
    });

    const data =
        await response
            .json()
            .catch(() => ({}));

    if (!response.ok) {
        console.error(
            "GOOGLE ADS API ERROR:",
            JSON.stringify(
                data,
                null,
                2
            )
        );

        throw new Error(
            data?.error?.message ||
                "Google Ads API request failed"
        );
    }

    return data;
}

async function getAccessibleGoogleAdsAccounts(
    accessToken
) {
    const url =
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}` +
        `/customers:listAccessibleCustomers`;

    const data =
        await googleAdsRequest({
            url,
            accessToken,
        });

    const resourceNames =
        Array.isArray(
            data.resourceNames
        )
            ? data.resourceNames
            : [];

    const customerIds =
        resourceNames
            .map((resourceName) => {
                const match =
                    String(
                        resourceName
                    ).match(
                        /customers\/(\d+)/
                    );

                return match
                    ? match[1]
                    : null;
            })
            .filter(Boolean);

    const uniqueCustomerIds = [
        ...new Set(customerIds),
    ];

    const accounts = [];

    for (const customerId of uniqueCustomerIds) {
        try {
            const account =
                await getGoogleAdsCustomer(
                    accessToken,
                    customerId
                );

            accounts.push(account);
        } catch (error) {
            console.error(
                `GOOGLE ADS CUSTOMER ${customerId} ERROR:`,
                error.message
            );

            accounts.push({
                customerId,
                customerName:
                    `Google Ads Account ${customerId}`,
                currencyCode: "",
                timeZone: "",
                status: "",
            });
        }
    }

    return accounts;
}

async function getGoogleAdsCustomer(
    accessToken,
    customerId
) {
    const cleanCustomerId =
        String(customerId).replace(
            /-/g,
            ""
        );

    const url =
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}` +
        `/customers/${cleanCustomerId}/googleAds:search`;

    const query = `
        SELECT
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone,
            customer.status
        FROM customer
        LIMIT 1
    `;

    const data =
        await googleAdsRequest({
            url,
            method: "POST",
            accessToken,
            body: {
                query,
            },
        });

    const row =
        Array.isArray(
            data.results
        )
            ? data.results[0]
            : null;

    const customer =
        row?.customer || {};

    return {
        customerId: String(
            customer.id ||
                cleanCustomerId
        ),

        customerName:
            customer.descriptiveName ||
            `Google Ads Account ${cleanCustomerId}`,

        currencyCode:
            customer.currencyCode || "",

        timeZone:
            customer.timeZone || "",

        status:
            customer.status || "",
    };
}

async function getStoredIntegration(
    userId
) {
    return GoogleIntegration.findOne({
        userId,
        isActive: true,
    });
}

async function getValidGoogleAccessToken(
    integration
) {
    if (!integration) {
        throw new Error(
            "Google Ads integration not found"
        );
    }

    if (
        !integration.refreshTokenEncrypted
    ) {
        throw new Error(
            "Google refresh token is missing. Please reconnect Google Ads."
        );
    }

    const refreshToken =
        decrypt(
            integration.refreshTokenEncrypted
        );

    if (!refreshToken) {
        throw new Error(
            "Google refresh token could not be decrypted. Please reconnect Google Ads."
        );
    }

    const oauth2Client =
        getGoogleOAuthClient();

    oauth2Client.setCredentials({
        refresh_token:
            refreshToken,
    });

    const tokenResponse =
        await oauth2Client.getAccessToken();

    const accessToken =
        typeof tokenResponse ===
        "string"
            ? tokenResponse
            : tokenResponse?.token;

    if (!accessToken) {
        throw new Error(
            "Unable to refresh Google access token. Please reconnect Google Ads."
        );
    }

    integration.accessTokenEncrypted =
        encrypt(accessToken);

    if (
        oauth2Client.credentials
            ?.expiry_date
    ) {
        integration.tokenExpiresAt =
            new Date(
                oauth2Client
                    .credentials
                    .expiry_date
            );
    } else {
        integration.tokenExpiresAt =
            new Date(
                Date.now() +
                    60 * 60 * 1000
            );
    }

    await integration.save();

    return accessToken;
}

exports.connect = async (
    req,
    res
) => {
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

        const nonce =
            crypto
                .randomBytes(32)
                .toString("hex");

        const state =
            jwt.sign(
                {
                    userId:
                        String(
                            userId
                        ),
                    nonce,
                    provider:
                        "google-ads",
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:
                        "10m",
                }
            );

        const oauth2Client =
            getGoogleOAuthClient();

        const authorizationUrl =
            oauth2Client.generateAuthUrl({
                access_type:
                    "offline",
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

exports.callback = async (
    req,
    res
) => {
    const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";

    try {
        const {
            code,
            state,
            error,
        } = req.query;

        if (error) {
            return res.redirect(
                `${frontendUrl}/dashboard?google=cancelled`
            );
        }

        if (!code || !state) {
            return res
                .status(400)
                .send(
                    "Google OAuth code or state is missing"
                );
        }

        let stateData;

        try {
            stateData =
                jwt.verify(
                    state,
                    process.env.JWT_SECRET
                );
        } catch {
            return res
                .status(400)
                .send(
                    "Invalid or expired Google OAuth state"
                );
        }

        if (
            !stateData.userId ||
            stateData.provider !==
                "google-ads"
        ) {
            return res
                .status(400)
                .send(
                    "Invalid Google OAuth state"
                );
        }

        const userId =
            stateData.userId;

        const oauth2Client =
            getGoogleOAuthClient();

        const {
            tokens,
        } =
            await oauth2Client.getToken(
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

        const accessTokenResponse =
            await oauth2Client.getAccessToken();

        const accessToken =
            typeof accessTokenResponse ===
            "string"
                ? accessTokenResponse
                : accessTokenResponse?.token;

        if (!accessToken) {
            throw new Error(
                "Unable to obtain a valid Google access token"
            );
        }

        let googleUserId = "";
        let googleEmail = "";
        let tokenInfo = null;

        try {
            tokenInfo =
                await oauth2Client.getTokenInfo(
                    accessToken
                );

            googleUserId =
                tokenInfo.sub ||
                tokenInfo.user_id ||
                "";

            googleEmail =
                tokenInfo.email ||
                "";
        } catch (error) {
            console.error(
                "GOOGLE TOKEN INFO ERROR:",
                error.message
            );
        }

        if (
            !googleEmail ||
            !googleUserId
        ) {
            try {
                const oauth2 =
                    google.oauth2({
                        auth:
                            oauth2Client,
                        version:
                            "v2",
                    });

                const { data } =
                    await oauth2.userinfo.get();

                googleUserId =
                    googleUserId ||
                    data.id ||
                    "";

                googleEmail =
                    googleEmail ||
                    data.email ||
                    "";
            } catch (error) {
                console.error(
                    "GOOGLE USER INFO ERROR:",
                    error.message
                );
            }
        }

        console.log(
            "GOOGLE TOKEN READY:",
            {
                hasAccessToken:
                    Boolean(
                        accessToken
                    ),
                tokenLength:
                    accessToken.length,
                tokenType:
                    tokenInfo?.type ||
                    "",
                scopes:
                    tokenInfo?.scope ||
                    "",
            }
        );

        const encryptedAccessToken =
            encrypt(
                accessToken
            );

        let encryptedRefreshToken =
            "";

        if (
            tokens.refresh_token
        ) {
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

        let integration =
            await GoogleIntegration.findOne({
                userId,
            });

        if (
            !encryptedRefreshToken &&
            integration?.refreshTokenEncrypted
        ) {
            encryptedRefreshToken =
                integration.refreshTokenEncrypted;
        }

        const accounts =
            await getAccessibleGoogleAdsAccounts(
                accessToken
            );

        if (!integration) {
            integration =
                new GoogleIntegration({
                    userId,

                    googleUserId,

                    googleEmail,

                    customerId:
                        accounts.length ===
                        1
                            ? accounts[0]
                                  .customerId
                            : "PENDING",

                    customerName:
                        accounts.length ===
                        1
                            ? accounts[0]
                                  .customerName
                            : "",

                    loginCustomerId:
                        "",

                    accessTokenEncrypted:
                        encryptedAccessToken,

                    refreshTokenEncrypted:
                        encryptedRefreshToken,

                    tokenExpiresAt,

                    isActive: true,

                    connectedAt:
                        new Date(),

                    availableAccounts:
                        accounts,
                });
        } else {
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

            if (
                encryptedRefreshToken
            ) {
                integration.refreshTokenEncrypted =
                    encryptedRefreshToken;
            }

            integration.tokenExpiresAt =
                tokenExpiresAt;

            integration.availableAccounts =
                accounts;

            integration.isActive =
                true;

            integration.connectedAt =
                new Date();

            if (
                accounts.length ===
                1
            ) {
                integration.customerId =
                    accounts[0]
                        .customerId;

                integration.customerName =
                    accounts[0]
                        .customerName;
            } else {
                integration.customerId =
                    "PENDING";

                integration.customerName =
                    "";
            }
        }

        await integration.save();

        if (!accounts.length) {
            return res.redirect(
                `${frontendUrl}/dashboard?google=no_accounts`
            );
        }

        return res.redirect(
            `${frontendUrl}/dashboard?google=select_account`
        );
    } catch (error) {
        console.error(
            "GOOGLE OAUTH CALLBACK ERROR:",
            error
        );

        return res.redirect(
            `${frontendUrl}/dashboard?google=error`
        );
    }
};

exports.getAccounts = async (
    req,
    res
) => {
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

        const integration =
            await GoogleIntegration.findOne({
                userId,
                isActive: true,
            });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message:
                    "Google Ads is not connected",
                connected: false,
                accounts: [],
            });
        }

        const accessToken =
            await getValidGoogleAccessToken(
                integration
            );

        const accounts =
            await getAccessibleGoogleAdsAccounts(
                accessToken
            );

        integration.availableAccounts =
            accounts;

        await integration.save();

        const selectedCustomerId =
            integration.customerId !==
            "PENDING"
                ? integration.customerId
                : "";

        const selectedAccount =
            selectedCustomerId
                ? accounts.find(
                      (account) =>
                          String(
                              account.customerId
                          ) ===
                          String(
                              selectedCustomerId
                          )
                  ) || null
                : null;

        return res.json({
            success: true,

            connected:
                Boolean(
                    integration.isActive
                ),

            accounts,

            selectedCustomerId,

            selectedAccount,
        });
    } catch (error) {
        console.error(
            "GOOGLE GET ACCOUNTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to fetch Google Ads accounts",
        });
    }
};

exports.selectAccount = async (
    req,
    res
) => {
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

        const customerId =
            String(
                req.body?.customerId ||
                    ""
            ).trim();

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message:
                    "Google Ads customer ID is required",
            });
        }

        const integration =
            await GoogleIntegration.findOne({
                userId,
                isActive: true,
            });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message:
                    "Google Ads is not connected",
            });
        }

        const accounts =
            Array.isArray(
                integration.availableAccounts
            )
                ? integration.availableAccounts
                : [];

        const selectedAccount =
            accounts.find(
                (account) =>
                    String(
                        account.customerId
                    ) ===
                    customerId
            );

        if (!selectedAccount) {
            return res.status(400).json({
                success: false,
                message:
                    "Selected Google Ads account is not available",
            });
        }

        integration.customerId =
            selectedAccount.customerId;

        integration.customerName =
            selectedAccount.customerName;

        integration.isActive =
            true;

        await integration.save();

        return res.json({
            success: true,

            message:
                "Google Ads account connected successfully",

            account: {
                customerId:
                    selectedAccount.customerId,

                customerName:
                    selectedAccount.customerName,

                currencyCode:
                    selectedAccount.currencyCode,

                timeZone:
                    selectedAccount.timeZone,

                status:
                    selectedAccount.status,
            },
        });
    } catch (error) {
        console.error(
            "GOOGLE SELECT ACCOUNT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to select Google Ads account",
        });
    }
};

exports.disconnect = async (
    req,
    res
) => {
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

        const integration =
            await GoogleIntegration.findOne({
                userId,
            });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message:
                    "Google Ads integration not found",
            });
        }

        integration.isActive =
            false;

        integration.customerId =
            "PENDING";

        integration.customerName =
            "";

        integration.loginCustomerId =
            "";

        integration.availableAccounts =
            [];

        await integration.save();

        return res.json({
            success: true,
            message:
                "Google Ads disconnected successfully",
        });
    } catch (error) {
        console.error(
            "GOOGLE DISCONNECT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to disconnect Google Ads",
        });
    }
};

exports.webhook = async (
    req,
    res
) => {
    try {
        const payload =
            req.body || {};

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

        if (
            payload.is_test === true
        ) {
            return res
                .status(200)
                .json({});
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

        const integration =
            await GoogleIntegration.findOne({
                webhookSecret:
                    googleKey,
                isActive: true,
            });

        if (!integration) {
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

        const existing =
            await Lead.findOne({
                userId:
                    integration.userId,
                googleLeadId,
            });

        if (existing) {
            return res
                .status(200)
                .json({});
        }

        const columns =
            Array.isArray(
                payload.user_column_data
            )
                ? payload.user_column_data
                : [];

        const fieldMap = {};

        for (const column of columns) {
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

        if (
            !name &&
            !phone &&
            !email
        ) {
            return res.status(400).json({
                message:
                    "Google lead does not contain contact information",
            });
        }

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
                    payload.gcl_id ||
                    "",

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

        return res
            .status(200)
            .json({});
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

exports.generateWebhookSecret =
    async (req, res) => {
        try {
            const userId =
                getUserId(req);

            if (!userId) {
                return res
                    .status(401)
                    .json({
                        success:
                            false,
                        message:
                            "Authentication required",
                    });
            }

            const webhookSecret =
                crypto
                    .randomBytes(
                        32
                    )
                    .toString(
                        "hex"
                    );

            let integration =
                await GoogleIntegration.findOne({
                    userId,
                });

            if (integration) {
                integration.webhookSecret =
                    webhookSecret;

                await integration.save();
            } else {
                integration =
                    await GoogleIntegration.create(
                        {
                            userId,

                            customerId:
                                "PENDING",

                            webhookSecret,

                            isActive:
                                false,
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