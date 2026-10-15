
const mongoose = require("mongoose");
const PharmacyMedicine = require("../models/PharmacyMedicine");
const User = require("../models/User");
const {
  getWorkspaceContext,
  hasPermission,
} = require("../utils/workspace");

const getContext = async (req) => getWorkspaceContext(req);

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

const getMedicinePermission = (action) => {
  const permissionMap = {
    view: "pharmacy.view",
    create: "pharmacy.create",
    edit: "pharmacy.edit",
    delete: "pharmacy.delete",
  };

  return permissionMap[action];
};

const getOwnerId = (context) => context?.workspaceOwnerId;

const isValidMedicineId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

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

// Supports frontend fields and Excel/CSV header variations.
const getValue = (body, aliases) => {
  if (!body || typeof body !== "object") return undefined;

  const normalizeKey = (key) =>
    String(key).toLowerCase().replace(/[^a-z0-9]/g, "");

  const aliasSet = new Set(aliases.map(normalizeKey));
  const key = Object.keys(body).find((item) =>
    aliasSet.has(normalizeKey(item))
  );

  return key === undefined ? undefined : body[key];
};

const normalizeMedicine = (body = {}) => {
  const rawName = getValue(body, [
    "name",
    "Med Name",
    "Medicine Name",
    "Medicine",
    "Item Name",
  ]);

  const rawBatch = getValue(body, [
    "batchNo",
    "Batch",
    "Batch No",
    "Batch Number",
  ]);

  const rawPackPrice = getValue(body, [
    "packPrice",
    "Pack(MRP)",
    "Pack MRP",
    "Pack Price",
    "MRP",
  ]);

  const rawStock = getValue(body, [
    "unitInStock",
    "Units in Stock",
    "Unit in Stock",
    "Stock",
    "Quantity",
    "Qty",
  ]);

  const rawExpiry = getValue(body, [
    "expiryDate",
    "Expiry",
    "Expiry Date",
  ]);

  const name = String(rawName ?? "").trim();
  const batchNo = String(rawBatch ?? "").trim();
  const packPrice = Number(rawPackPrice);
  const unitInStock = Number(rawStock);

  if (!name) {
    return { error: "Medicine name is required." };
  }

  if (!batchNo) {
    return { error: "Batch number is required." };
  }

  if (
    rawPackPrice === "" ||
    rawPackPrice === undefined ||
    rawPackPrice === null ||
    !Number.isFinite(packPrice) ||
    packPrice < 0
  ) {
    return { error: "Enter a valid pack MRP." };
  }

  if (
    rawStock === "" ||
    rawStock === undefined ||
    rawStock === null ||
    !Number.isInteger(unitInStock) ||
    unitInStock < 0
  ) {
    return {
      error: "Units in stock must be a whole number of zero or more.",
    };
  }

  const expiryText = String(rawExpiry ?? "").trim();
  let expiryDate;

  // Handles ISO dates and common spreadsheet formats such as Aug-2024.
  if (/^\d{4}-\d{2}-\d{2}$/.test(expiryText)) {
    const [year, month, day] = expiryText.split("-").map(Number);
    expiryDate = new Date(Date.UTC(year, month - 1, day));
  } else if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(expiryText)) {
    const parsed = new Date(`${expiryText} UTC`);
    if (!Number.isNaN(parsed.getTime())) {
      expiryDate = parsed;
    }
  } else if (/^[A-Za-z]{3}-\d{4}$/.test(expiryText)) {
    const parsed = new Date(`01-${expiryText} UTC`);
    if (!Number.isNaN(parsed.getTime())) {
      expiryDate = parsed;
    }
  } else {
    const parsed = new Date(expiryText);
    if (!Number.isNaN(parsed.getTime())) {
      expiryDate = parsed;
    }
  }

  if (!expiryText || !expiryDate || Number.isNaN(expiryDate.getTime())) {
    return {
      error: "A valid expiry date is required. Use YYYY-MM-DD or MMM-YYYY.",
    };
  }

  return {
    data: {
      name,
      batchNo,
      packPrice,
      unitInStock,
      expiryDate,
    },
  };
};

exports.getMedicines = async (req, res) => {
  try {
    const context = await getContext(req);

    if (!requirePermission(context, getMedicinePermission("view"), res)) {
      return;
    }

    const ownerId = getOwnerId(context);

    if (!(await requireActivePharmacyAddon(ownerId, res))) return;

    const medicines = await PharmacyMedicine.find({ userId: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, medicines });
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

    if (!requirePermission(context, getMedicinePermission("create"), res)) {
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

    if (!requirePermission(context, getMedicinePermission("edit"), res)) {
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
      { _id: medicineId, userId: ownerId },
      normalized.data,
      { new: true, runValidators: true }
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

    if (!requirePermission(context, getMedicinePermission("delete"), res)) {
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

    if (!requirePermission(context, getMedicinePermission("create"), res)) {
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
          name: getValue(item, ["name", "Med Name", "Medicine Name"]) || "",
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
