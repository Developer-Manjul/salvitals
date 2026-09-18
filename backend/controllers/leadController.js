const jwt = require("jsonwebtoken");
const Lead = require("../models/Lead");
const { processNewLead } = require("../services/leadProcessingService");

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

exports.getLeads = async (
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

        const leads =
            await Lead.find({
                userId,
            }).sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            leads,
        });
    } catch (error) {
        console.error(
            "GET LEADS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load leads",
        });
    }
};

exports.createLead = async (
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

        const {
            name,
            email,
            phone,
            source,
            service,
            owner,
            stage,
            preferredDoctor,
            landingPage,
            pageUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            ipAddress,
            firstNote,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Lead name is required",
            });
        }

        if (!phone?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required",
            });
        }

        const lead =
            await Lead.create({
                userId,
                name: name.trim(),
                email: email?.trim() || "",
                phone: phone.trim(),
                source: source?.trim() || "Manual",
                service: service?.trim() || "",
                owner: owner?.trim() || "",
                stage: stage?.trim() || "New",
                preferredDoctor:
                    preferredDoctor?.trim() || "",
                landingPage:
                    landingPage?.trim() || "",
                pageUrl:
                    pageUrl?.trim() || "",
                utmSource:
                    utmSource?.trim() || "",
                utmMedium:
                    utmMedium?.trim() || "",
                utmCampaign:
                    utmCampaign?.trim() || "",
                utmTerm:
                    utmTerm?.trim() || "",
                utmContent:
                    utmContent?.trim() || "",
                ipAddress:
                    ipAddress?.trim() || "",
                firstNote:
                    firstNote?.trim() || "",
            });

        await processNewLead(lead);

        return res.status(201).json({
            success: true,
            message:
                "Lead created successfully",
            lead,
        });
    } catch (error) {
        console.error(
            "CREATE LEAD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create lead",
        });
    }
};

exports.updateLead = async (
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

        const {
            name,
            email,
            phone,
            source,
            service,
            owner,
            stage,
            preferredDoctor,
            landingPage,
            pageUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            ipAddress,
            firstNote,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Lead name is required",
            });
        }

        if (!phone?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required",
            });
        }

        const lead =
            await Lead.findOneAndUpdate(
                {
                    _id: req.params.id,
                    userId,
                },
                {
                    name: name.trim(),
                    email: email?.trim() || "",
                    phone: phone.trim(),
                    source: source?.trim() || "Manual",
                    service: service?.trim() || "",
                    owner: owner?.trim() || "",
                    stage: stage?.trim() || "New",
                    preferredDoctor:
                        preferredDoctor?.trim() || "",
                    landingPage:
                        landingPage?.trim() || "",
                    pageUrl:
                        pageUrl?.trim() || "",
                    utmSource:
                        utmSource?.trim() || "",
                    utmMedium:
                        utmMedium?.trim() || "",
                    utmCampaign:
                        utmCampaign?.trim() || "",
                    utmTerm:
                        utmTerm?.trim() || "",
                    utmContent:
                        utmContent?.trim() || "",
                    ipAddress:
                        ipAddress?.trim() || "",
                    firstNote:
                        firstNote?.trim() || "",
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message:
                    "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Lead updated successfully",
            lead,
        });
    } catch (error) {
        console.error(
            "UPDATE LEAD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update lead",
        });
    }
};

exports.deleteLead = async (
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

        const lead =
            await Lead.findOneAndDelete({
                _id: req.params.id,
                userId,
            });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message:
                    "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Lead deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE LEAD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete lead",
        });
    }
};

exports.getLead = async (
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

        const lead =
            await Lead.findOne({
                _id: req.params.id,
                userId,
            });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message:
                    "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            lead,
        });
    } catch (error) {
        console.error(
            "GET LEAD ERROR:",
            error
        );

        return res.status(404).json({
            success: false,
            message:
                "Lead not found",
        });
    }
};

exports.addLeadNote = async (
    req,
    res
) => {
    try {
        const userId =
            getUserId(req);

        const text =
            String(
                req.body?.text || ""
            ).trim();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        if (!text) {
            return res.status(400).json({
                success: false,
                message:
                    "Note is required",
            });
        }

        const lead =
            await Lead.findOneAndUpdate(
                {
                    _id: req.params.id,
                    userId,
                },
                {
                    $push: {
                        notes: {
                            text,
                            userName:
                                req.body?.userName ||
                                "",
                        },
                    },
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message:
                    "Lead not found",
            });
        }

        return res.status(201).json({
            success: true,
            lead,
        });
    } catch (error) {
        console.error(
            "ADD LEAD NOTE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to add note",
        });
    }
};

exports.addLeadFollowUp = async (
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

        const date =
            new Date(
                req.body?.date
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Follow-up date is required",
            });
        }

        const purpose =
            String(
                req.body?.purpose || ""
            ).trim();

        const channel =
            String(
                req.body?.channel || "Call"
            ).trim();

        const assignedTo =
            String(
                req.body?.assignedTo || ""
            ).trim();

        const priority =
            String(
                req.body?.priority || "Medium"
            ).trim();

        const note =
            String(
                req.body?.note || ""
            ).trim();

        const reminder =
            req.body?.reminder !== false;

        const repeatWeekly =
            req.body?.repeatWeekly === true;

        const allowedPriorities = [
            "Low",
            "Medium",
            "High",
        ];

        const allowedChannels = [
            "Call",
            "WhatsApp",
            "Email",
            "In person",
        ];

        const finalPriority =
            allowedPriorities.includes(
                priority
            )
                ? priority
                : "Medium";

        const finalChannel =
            allowedChannels.includes(
                channel
            )
                ? channel
                : "Call";

        const lead =
            await Lead.findOneAndUpdate(
                {
                    _id: req.params.id,
                    userId,
                },
                {
                    $push: {
                        followUps: {
                            date,
                            note,
                            purpose,
                            channel: finalChannel,
                            assignedTo,
                            priority: finalPriority,
                            reminder,
                            repeatWeekly,
                            status: "Scheduled",
                        },
                    },
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message:
                    "Lead not found",
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Follow-up scheduled successfully",
            lead,
        });
    } catch (error) {
        console.error(
            "ADD LEAD FOLLOW-UP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to schedule follow-up",
        });
    }
};