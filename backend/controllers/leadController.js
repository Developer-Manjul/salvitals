const Lead = require("../models/Lead");

const {
    getWorkspaceContext,
    hasPermission,
} = require("../utils/workspace");

const getContext = async (req) => {
    return await getWorkspaceContext(req);
};

const requirePermission = (context, permission, res) => {
    if (!context) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });
        return false;
    }

    if (!hasPermission(context, permission)) {
        res.status(403).json({
            success: false,
            message:
                "You do not have permission to perform this action.",
            permission,
        });
        return false;
    }

    return true;
};

exports.getLeads = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "leads.view",
                res
            )
        ) {
            return;
        }

        const leads = await Lead.find({
            userId: context.workspaceOwnerId,
        }).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            leads,
        });
    } catch (error) {
        console.error("GET LEADS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load leads",
        });
    }
};

exports.createLead = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "leads.create",
                res
            )
        ) {
            return;
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
                message: "Lead name is required",
            });
        }

        if (!phone?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        const lead = await Lead.create({
            userId: context.workspaceOwnerId,
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

        await processNewLeadSafely(lead);

        return res.status(201).json({
            success: true,
            message: "Lead created successfully",
            lead,
        });
    } catch (error) {
        console.error("CREATE LEAD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create lead",
        });
    }
};

exports.updateLead = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "leads.edit",
                res
            )
        ) {
            return;
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
                message: "Lead name is required",
            });
        }

        if (!phone?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        const lead = await Lead.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: context.workspaceOwnerId,
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
                message: "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            lead,
        });
    } catch (error) {
        console.error("UPDATE LEAD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update lead",
        });
    }
};

exports.deleteLead = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "leads.delete",
                res
            )
        ) {
            return;
        }

        const lead = await Lead.findOneAndDelete({
            _id: req.params.id,
            userId: context.workspaceOwnerId,
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lead deleted successfully",
        });
    } catch (error) {
        console.error("DELETE LEAD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete lead",
        });
    }
};

exports.getLead = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "leads.view",
                res
            )
        ) {
            return;
        }

        const lead = await Lead.findOne({
            _id: req.params.id,
            userId: context.workspaceOwnerId,
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            lead,
        });
    } catch (error) {
        console.error("GET LEAD ERROR:", error);

        return res.status(404).json({
            success: false,
            message: "Lead not found",
        });
    }
};

exports.addLeadNote = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "leads.edit",
                res
            )
        ) {
            return;
        }

        const text = String(
            req.body?.text || ""
        ).trim();

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Note is required",
            });
        }

        const lead = await Lead.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: context.workspaceOwnerId,
            },
            {
                $push: {
                    notes: {
                        text,
                        userName:
                            String(
                                req.body?.userName || ""
                            ).trim(),
                        editHistory: [],
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
                message: "Lead not found",
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
            message: "Unable to add note",
        });
    }
};

exports.updateLeadNote = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "leads.edit",
                res
            )
        ) {
            return;
        }

        const text = String(
            req.body?.text || ""
        ).trim();

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Note is required",
            });
        }

        const lead = await Lead.findOne({
            _id: req.params.id,
            userId: context.workspaceOwnerId,
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        const note = lead.notes.id(
            req.params.noteId
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        const oldText = String(
            note.text || ""
        ).trim();

        if (oldText === text) {
            return res.status(400).json({
                success: false,
                message: "No changes made to note",
            });
        }

        if (!Array.isArray(note.editHistory)) {
            note.editHistory = [];
        }

        note.editHistory.push({
            oldText,
            newText: text,
            editedBy: String(
                req.body?.userName ||
                    context?.user?.name ||
                    ""
            ).trim(),
            editedAt: new Date(),
        });

        note.text = text;

        await lead.save();

        return res.status(200).json({
            success: true,
            message: "Note updated successfully",
            lead,
        });
    } catch (error) {
        console.error(
            "UPDATE LEAD NOTE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update note",
        });
    }
};

exports.addLeadFollowUp = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "followups.create",
                res
            )
        ) {
            return;
        }

        const date = new Date(req.body?.date);

        if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
                success: false,
                message:
                    "Follow-up date is required",
            });
        }

        const purpose = String(
            req.body?.purpose || ""
        ).trim();

        const channel = String(
            req.body?.channel || "Call"
        ).trim();

        const assignedTo = String(
            req.body?.assignedTo || ""
        ).trim();

        const priority = String(
            req.body?.priority || "Medium"
        ).trim();

        const note = String(
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

        const lead = await Lead.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: context.workspaceOwnerId,
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
                message: "Lead not found",
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

exports.updateLeadFollowUp = async (
    req,
    res
) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "followups.edit",
                res
            )
        ) {
            return;
        }

        const lead = await Lead.findOne({
            _id: req.params.id,
            userId: context.workspaceOwnerId,
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        const followUp = lead.followUps.id(
            req.params.followUpId
        );

        if (!followUp) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found",
            });
        }

        if (req.body.date !== undefined) {
            const date = new Date(
                req.body.date
            );

            if (Number.isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid follow-up date is required",
                });
            }

            followUp.date = date;
        }

        if (req.body.purpose !== undefined) {
            followUp.purpose = String(
                req.body.purpose || ""
            ).trim();
        }

        if (req.body.channel !== undefined) {
            const channel = String(
                req.body.channel || "Call"
            ).trim();

            const allowedChannels = [
                "Call",
                "WhatsApp",
                "Email",
                "In person",
            ];

            if (
                allowedChannels.includes(
                    channel
                )
            ) {
                followUp.channel = channel;
            }
        }

        if (req.body.assignedTo !== undefined) {
            followUp.assignedTo = String(
                req.body.assignedTo || ""
            ).trim();
        }

        if (req.body.priority !== undefined) {
            const priority = String(
                req.body.priority || ""
            ).trim();

            const allowedPriorities = [
                "Low",
                "Medium",
                "High",
            ];

            if (
                allowedPriorities.includes(
                    priority
                )
            ) {
                followUp.priority = priority;
            }
        }

        if (req.body.note !== undefined) {
            followUp.note = String(
                req.body.note || ""
            ).trim();
        }

        if (req.body.reminder !== undefined) {
            followUp.reminder =
                req.body.reminder === true;
        }

        if (
            req.body.repeatWeekly !==
            undefined
        ) {
            followUp.repeatWeekly =
                req.body.repeatWeekly === true;
        }

        if (req.body.status !== undefined) {
            const allowedStatuses = [
                "Scheduled",
                "Completed",
                "Cancelled",
            ];

            const status = String(
                req.body.status || ""
            ).trim();

            if (
                allowedStatuses.includes(
                    status
                )
            ) {
                followUp.status = status;
            }
        }

        await lead.save();

        return res.status(200).json({
            success: true,
            message:
                "Follow-up updated successfully",
            lead,
        });
    } catch (error) {
        console.error(
            "UPDATE LEAD FOLLOW-UP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update follow-up",
        });
    }
};

exports.deleteLeadFollowUp = async (
    req,
    res
) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "followups.delete",
                res
            )
        ) {
            return;
        }

        const lead = await Lead.findOne({
            _id: req.params.id,
            userId: context.workspaceOwnerId,
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        const followUp = lead.followUps.id(
            req.params.followUpId
        );

        if (!followUp) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found",
            });
        }

        followUp.deleteOne();

        await lead.save();

        return res.status(200).json({
            success: true,
            message:
                "Follow-up deleted successfully",
            lead,
        });
    } catch (error) {
        console.error(
            "DELETE LEAD FOLLOW-UP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete follow-up",
        });
    }
};

async function processNewLeadSafely(lead) {
    try {
        await processNewLead(lead);
    } catch (error) {
        console.error(
            "PROCESS NEW LEAD ERROR:",
            error
        );
    }
}