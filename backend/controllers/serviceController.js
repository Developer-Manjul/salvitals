const Service = require("../models/Service");
const {
    getWorkspaceContext,
    hasPermission,
} = require("../utils/workspace");

const getContext = async (req) => {
    return await getWorkspaceContext(req);
};

const requirePermission = (
    context,
    permission,
    res
) => {
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

exports.getServices = async (
    req,
    res
) => {
    try {
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "services.view",
                res
            )
        ) {
            return;
        }

        const services =
            await Service.find({
                userId:
                    context.workspaceOwnerId,
            }).sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            services,
        });
    } catch (error) {
        console.error(
            "GET SERVICES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load services",
        });
    }
};

exports.createService = async (
    req,
    res
) => {
    try {
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "services.create",
                res
            )
        ) {
            return;
        }

        const name =
            String(
                req.body?.name || ""
            ).trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Service name is required",
            });
        }

        const service =
            await Service.create({
                userId:
                    context.workspaceOwnerId,
                name,
            });

        return res.status(201).json({
            success: true,
            message:
                "Service added successfully",
            service,
        });
    } catch (error) {
        console.error(
            "CREATE SERVICE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create service",
        });
    }
};

exports.updateService = async (
    req,
    res
) => {
    try {
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "services.edit",
                res
            )
        ) {
            return;
        }

        const name =
            String(
                req.body?.name || ""
            ).trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message:
                    "Service name is required",
            });
        }

        const service =
            await Service.findOneAndUpdate(
                {
                    _id: req.params.id,
                    userId:
                        context.workspaceOwnerId,
                },
                {
                    name,
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!service) {
            return res.status(404).json({
                success: false,
                message:
                    "Service not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Service updated successfully",
            service,
        });
    } catch (error) {
        console.error(
            "UPDATE SERVICE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update service",
        });
    }
};

exports.deleteService = async (
    req,
    res
) => {
    try {
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "services.delete",
                res
            )
        ) {
            return;
        }

        const service =
            await Service.findOneAndDelete({
                _id: req.params.id,
                userId:
                    context.workspaceOwnerId,
            });

        if (!service) {
            return res.status(404).json({
                success: false,
                message:
                    "Service not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Service deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE SERVICE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete service",
        });
    }
};