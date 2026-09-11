const jwt = require("jsonwebtoken");
const Service = require("../models/Service");

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

exports.getServices = async (
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

        const services =
            await Service.find({
                userId,
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
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Service name is required",
            });
        }

        const service =
            await Service.create({
                userId,
                name: name.trim(),
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
        } = req.body;

        if (!name?.trim()) {
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
                    userId,
                },
                {
                    name:
                        name.trim(),
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
        const userId =
            getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const service =
            await Service.findOneAndDelete({
                _id: req.params.id,
                userId,
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