const LeadSource = require("../models/LeadSource");
const LeadStage = require("../models/LeadStage");

const {
    getWorkspaceContext,
    hasPermission,
} = require("../utils/workspace");

const slugify = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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
            message: "You do not have permission to perform this action.",
            permission,
        });
        return false;
    }

    return true;
};

const ensureWorkspaceDefaults = async (owner) => {
    const systemSources = await LeadSource.find({
        isSystem: true,
    }).lean();

    for (const source of systemSources) {
        await LeadSource.updateOne(
            {
                owner,
                slug: source.slug,
            },
            {
                $setOnInsert: {
                    owner,
                    name: source.name,
                    slug: source.slug,
                    icon:
                        source.icon ||
                        "fa-solid fa-bullhorn",
                    color:
                        source.color ||
                        "blue",
                    colorHex:
                        source.colorHex ||
                        "",
                    status:
                        source.status ||
                        "active",
                    isSystem: false,
                    locked: false,
                },
            },
            {
                upsert: true,
            }
        );
    }

    const systemStages = await LeadStage.find({
        isSystem: true,
    }).lean();

    for (const stage of systemStages) {
        await LeadStage.updateOne(
            {
                owner,
                slug: stage.slug,
            },
            {
                $setOnInsert: {
                    owner,
                    name: stage.name,
                    slug: stage.slug,
                    color:
                        stage.color ||
                        "blue",
                    colorHex:
                        stage.colorHex ||
                        "",
                    status:
                        stage.status ||
                        "active",
                    isSystem: false,
                },
            },
            {
                upsert: true,
            }
        );
    }
};

exports.getLeadSources = async (req, res) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.view",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        await ensureWorkspaceDefaults(owner);

        const sources =
            await LeadSource.find({
                owner,
            })
                .sort({
                    createdAt: 1,
                })
                .lean();

        return res.status(200).json({
            success: true,
            sources,
        });
    } catch (error) {
        console.error(
            "GET LEAD SOURCES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load lead sources",
        });
    }
};

exports.createLeadSource = async (
    req,
    res
) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.create",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        const name = String(
            req.body.name || ""
        ).trim();

        const color = String(
            req.body.color || "blue"
        ).trim();

        const colorHex = String(
            req.body.colorHex || ""
        ).trim();

        const icon = String(
            req.body.icon ||
            "fa-solid fa-bullhorn"
        ).trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Source name is required.",
            });
        }

        const slug =
            slugify(name);

        const existing =
            await LeadSource.findOne({
                owner,
                slug,
            }).lean();

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "A lead source with this name already exists.",
            });
        }

        const source =
            await LeadSource.create({
                owner,
                name,
                slug,
                icon,
                color,
                colorHex,
                status: "active",
                isSystem: false,
                locked: false,
            });

        return res.status(201).json({
            success: true,
            source,
        });
    } catch (error) {
        console.error(
            "CREATE LEAD SOURCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create lead source",
        });
    }
};

exports.updateLeadSource = async (
    req,
    res
) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.edit",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        const source =
            await LeadSource.findOne({
                _id: req.params.id,
                owner,
                isSystem: false,
            });

        if (!source) {
            return res.status(404).json({
                success: false,
                message:
                    "Custom lead source not found.",
            });
        }

        const name =
            req.body.name !== undefined
                ? String(
                    req.body.name
                ).trim()
                : source.name;

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Source name is required.",
            });
        }

        const slug =
            slugify(name);

        const duplicate =
            await LeadSource.findOne({
                _id: {
                    $ne: source._id,
                },
                owner,
                slug,
            }).lean();

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message:
                    "A lead source with this name already exists.",
            });
        }

        source.name = name;
        source.slug = slug;

        if (
            req.body.icon !==
            undefined
        ) {
            source.icon =
                String(
                    req.body.icon
                ).trim();
        }

        if (
            req.body.color !==
            undefined
        ) {
            source.color =
                String(
                    req.body.color
                ).trim();
        }

        if (
            req.body.colorHex !==
            undefined
        ) {
            source.colorHex =
                String(
                    req.body.colorHex
                ).trim();
        }

        if (
            req.body.status !==
            undefined
        ) {
            source.status =
                req.body.status ===
                "inactive"
                    ? "inactive"
                    : "active";
        }

        await source.save();

        return res.status(200).json({
            success: true,
            source,
        });
    } catch (error) {
        console.error(
            "UPDATE LEAD SOURCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update lead source",
        });
    }
};

exports.deleteLeadSource = async (
    req,
    res
) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.delete",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        const source =
            await LeadSource.findOne({
                _id: req.params.id,
                owner,
                isSystem: false,
            });

        if (!source) {
            return res.status(404).json({
                success: false,
                message:
                    "Custom lead source not found.",
            });
        }

        await LeadSource.deleteOne({
            _id: source._id,
            owner,
        });

        return res.status(200).json({
            success: true,
            message:
                "Lead source deleted successfully.",
        });
    } catch (error) {
        console.error(
            "DELETE LEAD SOURCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete lead source",
        });
    }
};

exports.getLeadStages = async (
    req,
    res
) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.view",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        await ensureWorkspaceDefaults(owner);

        const stages =
            await LeadStage.find({
                owner,
            })
                .sort({
                    createdAt: 1,
                })
                .lean();

        return res.status(200).json({
            success: true,
            stages,
        });
    } catch (error) {
        console.error(
            "GET LEAD STAGES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to load lead stages",
        });
    }
};

exports.createLeadStage = async (
    req,
    res
) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.create",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        const name = String(
            req.body.name || ""
        ).trim();

        const color = String(
            req.body.color || "blue"
        ).trim();

        const colorHex = String(
            req.body.colorHex || ""
        ).trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Stage name is required.",
            });
        }

        const slug =
            slugify(name);

        const existing =
            await LeadStage.findOne({
                owner,
                slug,
            }).lean();

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "A lead stage with this name already exists.",
            });
        }

        const stage =
            await LeadStage.create({
                owner,
                name,
                slug,
                color,
                colorHex,
                status: "active",
                isSystem: false,
            });

        return res.status(201).json({
            success: true,
            stage,
        });
    } catch (error) {
        console.error(
            "CREATE LEAD STAGE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create lead stage",
        });
    }
};

exports.updateLeadStage = async (
    req,
    res
) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.edit",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        const stage =
            await LeadStage.findOne({
                _id: req.params.id,
                owner,
                isSystem: false,
            });

        if (!stage) {
            return res.status(404).json({
                success: false,
                message:
                    "Custom lead stage not found.",
            });
        }

        const name =
            req.body.name !== undefined
                ? String(
                    req.body.name
                ).trim()
                : stage.name;

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Stage name is required.",
            });
        }

        const slug =
            slugify(name);

        const duplicate =
            await LeadStage.findOne({
                _id: {
                    $ne: stage._id,
                },
                owner,
                slug,
            }).lean();

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message:
                    "A lead stage with this name already exists.",
            });
        }

        stage.name = name;
        stage.slug = slug;

        if (
            req.body.color !==
            undefined
        ) {
            stage.color =
                String(
                    req.body.color
                ).trim();
        }

        if (
            req.body.colorHex !==
            undefined
        ) {
            stage.colorHex =
                String(
                    req.body.colorHex
                ).trim();
        }

        if (
            req.body.status !==
            undefined
        ) {
            stage.status =
                req.body.status ===
                "inactive"
                    ? "inactive"
                    : "active";
        }

        await stage.save();

        return res.status(200).json({
            success: true,
            stage,
        });
    } catch (error) {
        console.error(
            "UPDATE LEAD STAGE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update lead stage",
        });
    }
};

exports.deleteLeadStage = async (
    req,
    res
) => {
    try {
        const context =
            await getWorkspaceContext(req);

        if (
            !requirePermission(
                context,
                "leads.delete",
                res
            )
        ) {
            return;
        }

        const owner =
            context.workspaceOwnerId;

        const stage =
            await LeadStage.findOne({
                _id: req.params.id,
                owner,
                isSystem: false,
            });

        if (!stage) {
            return res.status(404).json({
                success: false,
                message:
                    "Custom lead stage not found.",
            });
        }

        await LeadStage.deleteOne({
            _id: stage._id,
            owner,
        });

        return res.status(200).json({
            success: true,
            message:
                "Lead stage deleted successfully.",
        });
    } catch (error) {
        console.error(
            "DELETE LEAD STAGE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete lead stage",
        });
    }
};