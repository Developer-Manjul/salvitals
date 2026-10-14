const mongoose = require("mongoose");
const PharmacyMedicine = require("../models/PharmacyMedicine");
const User = require("../models/User");
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
            message: "You do not have permission to perform this action.",
            permission,
        });
        return false;
    }

    return true;
};

const normalizeMedicine = (body = {}) => {
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const quantity = Number(body.quantity);
    const expiryDate = new Date(body.expiryDate);

    if (!name) {
        return { error: "Medicine name is required." };
    }

    if (
        body.price === "" ||
        body.price === undefined ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return { error: "Enter a valid medicine price." };
    }

    if (
        body.quantity === "" ||
        body.quantity === undefined ||
        !Number.isInteger(quantity) ||
        quantity < 0
    ) {
        return { error: "Quantity must be a whole number of zero or more." };
    }

    if (
        !body.expiryDate ||
        Number.isNaN(expiryDate.getTime())
    ) {
        return { error: "A valid expiry date is required." };
    }

    return {
        data: {
            name,
            price,
            quantity,
            expiryDate,
        },
    };
};

const getMedicinePermission = (context, action) => {
    const permissionMap = {
        view: "pharmacy.view",
        create: "pharmacy.create",
        edit: "pharmacy.edit",
        delete: "pharmacy.delete",
    };

    return permissionMap[action];
};

const getOwnerId = (context) => context?.workspaceOwnerId;

const requireActivePharmacyAddon = async (ownerId, res) => {
    const owner = await User.findById(ownerId)
        .select("subscription addons.pharmacy_invoice")
        .lean();

    if (!owner) {
        res.status(404).json({
            success: false,
            message: "Workspace owner not found.",
        });
        return false;
    }

    const subscription = owner.subscription || {};
    const addon = owner.addons?.pharmacy_invoice || {};
    const now = Date.now();

    const subscriptionIsActive =
        subscription.status === "active" &&
        subscription.expiresAt &&
        new Date(subscription.expiresAt).getTime() > now;

    const addonIsActive =
        addon.enabled === true &&
        addon.expiresAt &&
        new Date(addon.expiresAt).getTime() > now;

    if (!subscriptionIsActive || !addonIsActive) {
        res.status(403).json({
            success: false,
            message: !subscriptionIsActive
                ? "Your CRM plan is inactive or expired. Please renew it to use Pharmacy."
                : "Your Pharmacy Invoice add-on is inactive or expired. Please renew it to continue.",
        });
        return false;
    }

    return true;
};

const isValidMedicineId = (id) =>
    mongoose.Types.ObjectId.isValid(id);

exports.getMedicines = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                getMedicinePermission(context, "view"),
                res
            )
        ) {
            return;
        }

        const userId = getOwnerId(context);

        if (!(await requireActivePharmacyAddon(userId, res))) return;

        const medicines = await PharmacyMedicine.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            medicines,
        });
    } catch (error) {
        console.error("GET PHARMACY MEDICINES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load medicines.",
        });
    }
};

exports.createMedicine = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                getMedicinePermission(context, "create"),
                res
            )
        ) {
            return;
        }

        const ownerId = getOwnerId(context);
        if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        const normalized = normalizeMedicine(req.body);

        if (normalized.error) {
            return res.status(400).json({
                success: false,
                message: normalized.error,
            });
        }

        const medicine = await PharmacyMedicine.create({
            ...normalized.data,
           userId: ownerId,
        });

        return res.status(201).json({
            success: true,
            message: "Medicine added successfully.",
            medicine,
        });
    } catch (error) {
        console.error("CREATE PHARMACY MEDICINE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add medicine.",
        });
    }
};

exports.updateMedicine = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                getMedicinePermission(context, "edit"),
                res
            )
        ) {
            return;
        }

        const ownerId = getOwnerId(context);
    if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        const { medicineId } = req.params;

        if (!isValidMedicineId(medicineId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medicine ID.",
            });
        }

        const normalized = normalizeMedicine(req.body);

        if (normalized.error) {
            return res.status(400).json({
                success: false,
                message: normalized.error,
            });
        }

        const medicine = await PharmacyMedicine.findOneAndUpdate(
            {
                _id: medicineId,
              userId: ownerId,
            },
            normalized.data,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        return res.json({
            success: true,
            message: "Medicine updated successfully.",
            medicine,
        });
    } catch (error) {
        console.error("UPDATE PHARMACY MEDICINE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update medicine.",
        });
    }
};

exports.deleteMedicine = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                getMedicinePermission(context, "delete"),
                res
            )
        ) {
            return;
        }
        
        const ownerId = getOwnerId(context);
        if (!(await requireActivePharmacyAddon(ownerId, res))) return;
                const { medicineId } = req.params;

        if (!isValidMedicineId(medicineId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid medicine ID.",
            });
        }

        const medicine = await PharmacyMedicine.findOneAndDelete({
            _id: medicineId,
           userId: ownerId,
        });

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found.",
            });
        }

        return res.json({
            success: true,
            message: "Medicine deleted successfully.",
        });
    } catch (error) {
        console.error("DELETE PHARMACY MEDICINE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete medicine.",
        });
    }
};

exports.importMedicines = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                getMedicinePermission(context, "create"),
                res
            )
        ) {
            return;
        }

        const ownerId = getOwnerId(context);
if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        const medicines = req.body.medicines;

        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide a non-empty medicines array.",
            });
        }

        if (medicines.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Import is limited to 1,000 medicines per request.",
            });
        }

        const documents = [];
        const errors = [];

        medicines.forEach((item, index) => {
            const normalized = normalizeMedicine(item);

            if (normalized.error) {
                errors.push({
                    row: index + 2,
                    name: item?.name || "",
                    message: normalized.error,
                });
                return;
            }

            documents.push({
                ...normalized.data,
              userId: ownerId,
            });
        });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some rows have invalid data. Nothing was imported.",
                errors,
            });
        }

        const imported = await PharmacyMedicine.insertMany(documents, {
            ordered: true,
        });

        return res.status(201).json({
            success: true,
            message: `${imported.length} medicines imported successfully.`,
            count: imported.length,
            medicines: imported,
        });
    } catch (error) {
        console.error("IMPORT PHARMACY MEDICINES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to import medicines.",
        });
    }
};