const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const LeadApiKey = require("../models/LeadApiKey");
const Lead = require("../models/Lead");

function getUserId(req) {
    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    const token =
        authorization.slice(7);

    try {
        const decoded =
            jwt.verify(
                token,
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

function hashApiKey(apiKey) {
    return crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");
}

function getClientIp(req) {
    const forwarded =
        String(
            req.headers["x-forwarded-for"] || ""
        );

    return (
        forwarded.split(",")[0].trim() ||
        req.ip ||
        ""
    );
}

exports.createWebsiteApiKey = async (
    req,
    res
) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const name =
            String(
                req.body?.name || "Website"
            ).trim() || "Website";

        const rawKey =
            `sv_live_${crypto.randomBytes(32).toString("hex")}`;

        const keyHash =
            hashApiKey(rawKey);

        const keyPrefix =
            rawKey.slice(0, 16);

        const apiKey =
            await LeadApiKey.create({
                userId,
                name,
                keyHash,
                keyPrefix,
                isActive: true,
            });

        return res.status(201).json({
            success: true,
            message:
                "Website API key created successfully",
            apiKey: {
                id: apiKey._id,
                name: apiKey.name,
                key: rawKey,
                keyPrefix: apiKey.keyPrefix,
                isActive: apiKey.isActive,
                createdAt: apiKey.createdAt,
            },
        });
    } catch (error) {
        console.error(
            "CREATE WEBSITE API KEY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create website API key",
        });
    }
};

exports.getWebsiteApiKeys = async (
    req,
    res
) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const apiKeys =
            await LeadApiKey.find({
                userId,
            })
                .select(
                    "_id name keyPrefix isActive createdAt updatedAt"
                )
                .sort({
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            apiKeys,
        });
    } catch (error) {
        console.error(
            "GET WEBSITE API KEYS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load website API keys",
        });
    }
};

exports.toggleWebsiteApiKey = async (
    req,
    res
) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const apiKey =
            await LeadApiKey.findOne({
                _id: req.params.id,
                userId,
            });

        if (!apiKey) {
            return res.status(404).json({
                success: false,
                message:
                    "API key not found",
            });
        }

        apiKey.isActive =
            !apiKey.isActive;

        await apiKey.save();

        return res.status(200).json({
            success: true,
            message:
                apiKey.isActive
                    ? "API key activated"
                    : "API key disabled",
            apiKey: {
                id: apiKey._id,
                name: apiKey.name,
                keyPrefix:
                    apiKey.keyPrefix,
                isActive:
                    apiKey.isActive,
            },
        });
    } catch (error) {
        console.error(
            "TOGGLE WEBSITE API KEY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update API key",
        });
    }
};

exports.deleteWebsiteApiKey = async (
    req,
    res
) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const apiKey =
            await LeadApiKey.findOneAndDelete({
                _id: req.params.id,
                userId,
            });

        if (!apiKey) {
            return res.status(404).json({
                success: false,
                message:
                    "API key not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "API key deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE WEBSITE API KEY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete API key",
        });
    }
};

exports.createWebsiteLead = async (
    req,
    res
) => {
    try {
        const apiKey =
            String(
                req.headers["x-api-key"] || ""
            ).trim();

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message:
                    "Website API key is required",
            });
        }

        const keyHash =
            hashApiKey(apiKey);

        const integration =
            await LeadApiKey.findOne({
                keyHash,
                isActive: true,
            });

        if (!integration) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid or inactive website API key",
            });
        }

        const {
            name,
            email,
            phone,
            service,
            landingPage,
            pageUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            firstNote,
        } = req.body;

        if (!String(name || "").trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Lead name is required",
            });
        }

        if (!String(phone || "").trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required",
            });
        }

        const lead =
            await Lead.create({
                userId:
                    integration.userId,

                name:
                    String(name).trim(),

                email:
                    String(email || "").trim(),

                phone:
                    String(phone).trim(),

                source:
                    "Website",

                service:
                    String(service || "").trim(),

                owner: "",

                stage:
                    "New",

                preferredDoctor: "",

                landingPage:
                    String(landingPage || "").trim(),

                pageUrl:
                    String(pageUrl || "").trim(),

                utmSource:
                    String(utmSource || "").trim(),

                utmMedium:
                    String(utmMedium || "").trim(),

                utmCampaign:
                    String(utmCampaign || "").trim(),

                utmTerm:
                    String(utmTerm || "").trim(),

                utmContent:
                    String(utmContent || "").trim(),

                ipAddress:
                    getClientIp(req),

                firstNote:
                    String(firstNote || "").trim(),
            });

        return res.status(201).json({
            success: true,
            message:
                "Lead received successfully",
            lead: {
                id: lead._id,
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                source: lead.source,
                service: lead.service,
                stage: lead.stage,
                createdAt: lead.createdAt,
            },
        });
    } catch (error) {
        console.error(
            "CREATE WEBSITE LEAD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create website lead",
        });
    }
};