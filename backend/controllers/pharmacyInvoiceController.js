
const mongoose = require("mongoose");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const FormData = require("form-data");

const PharmacyInvoice = require("../models/PharmacyInvoice");
const PharmacyInvoiceCounter = require("../models/PharmacyInvoiceCounter");
const PharmacyMedicine = require("../models/PharmacyMedicine");
const User = require("../models/User");
const {
    getWorkspaceContext,
    hasPermission,
} = require("../utils/workspace");

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

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
                ? "Your CRM plan is inactive or expired. Please renew it to use Pharmacy Invoice."
                : "Your Pharmacy Invoice add-on is inactive or expired. Please renew it to continue.",
        });
        return false;
    }

    return true;
};

const requirePermission = (context, permission, res) => {
    if (!context) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return false;
    }

    if (!hasPermission(context, permission)) {
        res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action.",
        });
        return false;
    }

    return true;
};

const roundMoney = (value) =>
    Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getOwner = async (ownerId, session = null) => {
    let query = User.findById(ownerId);

    if (session) query = query.session(session);

    return query.lean();
};


const getOwnerBillingProfile = (owner) => ({
    businessName:
        owner?.displayName ||
        owner?.clinicName ||
        owner?.businessName ||
        owner?.name ||
        owner?.ownerName ||
        "SaleVitals",

    phone:
        owner?.phone ||
        owner?.mobile ||
        owner?.contactNumber ||
        "",

    email:
        owner?.email ||
        owner?.businessEmail ||
        "",

    address:
        owner?.address ||
        owner?.clinicAddress ||
        owner?.businessAddress ||
        "",

    gstin:
        owner?.gstin ||
        owner?.gstNumber ||
        owner?.gstNo ||
        "",

    // Logo fields copied from the workspace owner's profile
    clinicLogo:
        owner?.clinicLogo ||
        owner?.logo ||
        owner?.businessLogo ||
        owner?.profileImage ||
        owner?.logoUrl ||
        owner?.clinic_logo ||
        "",

    logo:
        owner?.logo ||
        owner?.clinicLogo ||
        owner?.businessLogo ||
        owner?.profileImage ||
        owner?.logoUrl ||
        owner?.clinic_logo ||
        "",

    businessLogo:
        owner?.businessLogo ||
        owner?.clinicLogo ||
        owner?.logo ||
        owner?.profileImage ||
        owner?.logoUrl ||
        "",

    profileImage:
        owner?.profileImage ||
        owner?.clinicLogo ||
        owner?.logo ||
        owner?.businessLogo ||
        owner?.logoUrl ||
        "",
});


const calculateAmounts = (price, quantity, gstRate = 0) => {
    const unitPrice = Number(price);
    const qty = Number(quantity);
    const rate = Number(gstRate);

    if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isInteger(qty) ||
        qty < 1 ||
        !Number.isFinite(rate) ||
        rate < 0 ||
        rate > 100
    ) {
        throw new Error("Invalid medicine price, quantity, or GST rate.");
    }

    const taxableAmount = roundMoney(unitPrice * qty);
    const gstAmount = roundMoney((taxableAmount * rate) / 100);

    return {
        taxableAmount,
        gstAmount,
        totalAmount: roundMoney(taxableAmount + gstAmount),
    };
};



const getNextInvoiceNumber = async (ownerId, session) => {
    const year = new Date().getFullYear();

    const counter = await PharmacyInvoiceCounter.findOneAndUpdate(
        { userId: ownerId, year },
        {
            $inc: { sequence: 1 },
            $setOnInsert: { userId: ownerId, year },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            session,
        }
    );

    return `PH/${year}/${String(counter.sequence).padStart(3, "0")}`;
};

const prepareItems = async (items, ownerId, session) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Add at least one medicine to the invoice.");
    }

    const prepared = [];

    for (const item of items) {
        const { medicineId, quantity, unitType = "Pack" } = item;

        if (!isValidId(medicineId)) {
            throw new Error("Invalid medicine selected.");
        }

        if (!["Pack", "Piece"].includes(unitType)) {
            throw new Error("Select Pack or Piece for each medicine.");
        }

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty < 1) {
            throw new Error("Medicine quantity must be a positive whole number.");
        }

        const medicine = await PharmacyMedicine.findOne({
            _id: medicineId,
            userId: ownerId,
        })
            .session(session)
            .lean();

        if (!medicine) {
            throw new Error("A selected medicine was not found in your inventory.");
        }

        const packPrice = Number(medicine.packPrice);
        const packSize = Number(medicine.packSize);
        const packsInStock = Number(medicine.unitInStock);
        const looseUnits = Number(medicine.looseUnits || 0);
        const gstRate = Number(medicine.gst || 0);

        if (
            !Number.isFinite(packPrice) ||
            packPrice < 0 ||
            !Number.isInteger(packSize) ||
            packSize < 1
        ) {
            throw new Error(`Invalid price or pack size for "${medicine.name}".`);
        }

        if (
            !Number.isInteger(packsInStock) ||
            packsInStock < 0 ||
            !Number.isInteger(looseUnits) ||
            looseUnits < 0 ||
            looseUnits >= packSize
        ) {
            throw new Error(`Invalid stock for "${medicine.name}".`);
        }

        if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
            throw new Error(`Invalid GST rate for "${medicine.name}".`);
        }

        const availableUnits = packsInStock * packSize + looseUnits;
        const unitsDeducted =
            unitType === "Pack" ? qty * packSize : qty;

        if (unitsDeducted > availableUnits) {
            throw new Error(
                `Insufficient stock for "${medicine.name}". Available: ${availableUnits} pieces (${packsInStock} packs and ${looseUnits} loose pieces).`
            );
        }

        const price =
            unitType === "Pack"
                ? packPrice
                : roundMoney(packPrice / packSize);

        const amounts = calculateAmounts(price, qty, gstRate);

        prepared.push({
            medicineId: medicine._id,
            medicineName: medicine.name,
            unitType,
            packSize,
            unitsDeducted,
            price,
            quantity: qty,
            gstRate,
            taxableAmount: amounts.taxableAmount,
            gstAmount: amounts.gstAmount,
            totalAmount: amounts.totalAmount,
        });
    }

    const subtotal = roundMoney(
        prepared.reduce((sum, item) => sum + item.taxableAmount, 0)
    );

    const gstAmount = roundMoney(
        prepared.reduce((sum, item) => sum + item.gstAmount, 0)
    );

    const preRoundTotal = roundMoney(subtotal + gstAmount);
    const total = Math.round(preRoundTotal);
    const roundOff = roundMoney(total - preRoundTotal);

    return {
        items: prepared,
        subtotal,
        gstAmount,
        roundOff,
        total,
    };
};

const deductStock = async (items, ownerId, session) => {
    for (const item of items) {
        const medicineId = item.medicineId?._id || item.medicineId;
        const unitsToDeduct = Number(item.unitsDeducted);

        if (
            !isValidId(medicineId) ||
            !Number.isInteger(unitsToDeduct) ||
            unitsToDeduct < 1
        ) {
            throw new Error(`Invalid stock deduction for "${item.medicineName}".`);
        }

        const medicine = await PharmacyMedicine.findOne({
            _id: medicineId,
            userId: ownerId,
        }).session(session);

        if (!medicine) {
            throw new Error(`Medicine "${item.medicineName}" was not found in inventory.`);
        }

        const packSize = Number(medicine.packSize);
        const availableUnits =
            Number(medicine.unitInStock) * packSize +
            Number(medicine.looseUnits || 0);

        if (unitsToDeduct > availableUnits) {
            throw new Error(`Insufficient stock for "${medicine.name}".`);
        }

        const remainingUnits = availableUnits - unitsToDeduct;

        medicine.unitInStock = Math.floor(remainingUnits / packSize);
        medicine.looseUnits = remainingUnits % packSize;

        await medicine.save({ session });
    }
};

const restoreStock = async (items, ownerId, session) => {
    for (const item of items) {
        const medicineId = item.medicineId?._id || item.medicineId;

        if (!isValidId(medicineId)) {
            throw new Error(`Invalid medicine ID for "${item.medicineName}".`);
        }

        const medicine = await PharmacyMedicine.findOne({
            _id: medicineId,
            userId: ownerId,
        }).session(session);

        if (!medicine) {
            throw new Error(
                `Cannot restore stock for "${item.medicineName}". The medicine may have been deleted.`
            );
        }

        const packSize = Number(medicine.packSize);

        // Purane invoices mein unitsDeducted nahi hoga;
        // unhein purani pack-based quantity se restore karo.
        const unitsToRestore =
            Number(item.unitsDeducted) ||
            Number(item.quantity) * Number(item.packSize || packSize);

        if (
            !Number.isInteger(packSize) ||
            packSize < 1 ||
            !Number.isInteger(unitsToRestore) ||
            unitsToRestore < 1
        ) {
            throw new Error(`Invalid stock restore quantity for "${item.medicineName}".`);
        }

        const currentUnits =
            Number(medicine.unitInStock) * packSize +
            Number(medicine.looseUnits || 0);

        const restoredUnits = currentUnits + unitsToRestore;

        medicine.unitInStock = Math.floor(restoredUnits / packSize);
        medicine.looseUnits = restoredUnits % packSize;

        await medicine.save({ session });
    }
};


const getInvoiceForOwner = async (invoiceId, ownerId, session = null) => {
    if (!isValidId(invoiceId)) return null;

    let query = PharmacyInvoice.findOne({
        _id: invoiceId,
        userId: ownerId,
    });

    if (session) query = query.session(session);

    return query;
};

// --------------------------------------------------
// GET ALL INVOICES / HISTORY
// GET /api/pharmacy-invoices
// --------------------------------------------------

exports.getInvoices = async (req, res) => {
    try {
        const context = await getWorkspaceContext(req);

        if (!requirePermission(context, "pharmacy.view", res)) return;

        const ownerId = getOwnerId(context);

        const invoices = await PharmacyInvoice.find({
            userId: ownerId,
        })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            invoices,
        });
    } catch (error) {
        console.error("Pharmacy invoice history error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load pharmacy invoices.",
        });
    }
};

// --------------------------------------------------
// GET SINGLE INVOICE
// GET /api/pharmacy-invoices/:invoiceId
// --------------------------------------------------

exports.getInvoiceById = async (req, res) => {
    try {
        const context = await getWorkspaceContext(req);

        if (!requirePermission(context, "pharmacy.view", res)) return;

        const ownerId = getOwnerId(context);

        if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        const invoice = await getInvoiceForOwner(
            req.params.invoiceId,
            ownerId
        );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy invoice not found.",
            });
        }

        res.json({
            success: true,
            invoice,
        });
    } catch (error) {
        console.error("Get pharmacy invoice error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load invoice.",
        });
    }
};





exports.createInvoice = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const context = await getWorkspaceContext(req);

        if (!requirePermission(context, "pharmacy.create", res)) return;

        const ownerId = getOwnerId(context);

        if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        const {
            customerName,
            phone = "",
            email = "",
            address = "",
            paymentMode = "",
            invoiceDate,
            items,
            notes = "",
            status = "Unpaid",
            discountType = "Percentage",
            discountValue = 0,
        } = req.body;

        // Customer validation
        if (!String(customerName || "").trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required.",
            });
        }

        // Invoice status validation
        if (!["Draft", "Paid", "Unpaid", "Cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice status.",
            });
        }

        // Payment mode validation
        const allowedPaymentModes = [
            "Cash",
            "UPI",
            "Card",
            "Credit Card",
            "Debit Card",
            "Bank Transfer",
            "Cheque",
            "Other",
        ];
        const parsedPaymentMode = String(paymentMode || "").trim();

        if (
            parsedPaymentMode &&
            !allowedPaymentModes.includes(parsedPaymentMode)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment mode.",
            });
        }

        // Discount type validation
        if (!["Percentage", "Fixed"].includes(discountType)) {
            return res.status(400).json({
                success: false,
                message: "Discount type must be Percentage or Fixed.",
            });
        }

        // Discount value validation
        const parsedDiscountValue = Number(discountValue);

        if (
            !Number.isFinite(parsedDiscountValue) ||
            parsedDiscountValue < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Discount value must be a valid non-negative number.",
            });
        }

        if (
            discountType === "Percentage" &&
            parsedDiscountValue > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Percentage discount cannot exceed 100%.",
            });
        }

        // Invoice date validation
        const parsedDate = invoiceDate
            ? new Date(invoiceDate)
            : new Date();

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice date.",
            });
        }

        let createdInvoice;

        await session.withTransaction(async () => {
            // Prepare invoice items and calculate subtotal + GST
            const prepared = await prepareItems(items, ownerId, session);

            // Amount after GST, before discount
            const amountBeforeDiscount =
                Number(prepared.subtotal || 0) +
                Number(prepared.gstAmount || 0);

            // Calculate discount after GST
            let discountAmount = 0;

            if (discountType === "Percentage") {
                discountAmount =
                    (amountBeforeDiscount * parsedDiscountValue) / 100;
            } else {
                discountAmount = parsedDiscountValue;
            }

            // Discount cannot exceed the invoice amount
            discountAmount = Math.min(
                Math.max(0, discountAmount),
                amountBeforeDiscount
            );

            // Round discount to two decimal places
            discountAmount =
                Math.round(
                    (discountAmount + Number.EPSILON) * 100
                ) / 100;

            // Amount after discount
            const amountAfterDiscount =
                amountBeforeDiscount - discountAmount;

            // Final total rounded to nearest rupee
            const finalTotal = Math.round(amountAfterDiscount);

            // Round-off difference
            const roundOff =
                Math.round(
                    (finalTotal - amountAfterDiscount + Number.EPSILON) *
                        100
                ) / 100;

            // Deduct stock inside the transaction
            await deductStock(prepared.items, ownerId, session);

            // Generate invoice number
            const invoiceNumber = await getNextInvoiceNumber(
                ownerId,
                session
            );

            // Save invoice
            const [invoice] = await PharmacyInvoice.create(
                [
                    {
                        userId: ownerId,
                        invoiceNumber,

                        customerName: String(customerName).trim(),
                        phone: String(phone || "").trim(),
                        email: String(email || "").trim(),
                        address: String(address || "").trim(),
                        paymentMode: parsedPaymentMode,

                        invoiceDate: parsedDate,
                        items: prepared.items,

                        subtotal: prepared.subtotal,
                        gstAmount: prepared.gstAmount,

                        discountType,
                        discountValue: parsedDiscountValue,
                        discountAmount,

                        roundOff,
                        total: finalTotal,

                        notes: String(notes || ""),
                        status,
                    },
                ],
                { session }
            );

            createdInvoice = invoice;
        });

        return res.status(201).json({
            success: true,
            message: "Pharmacy invoice created successfully.",
            invoice: createdInvoice,
        });
    } catch (error) {
        console.error("Create pharmacy invoice error:", error);

        return res.status(400).json({
            success: false,
            message:
                error.message || "Failed to create pharmacy invoice.",
        });
    } finally {
        await session.endSession();
    }
};




exports.updateInvoice = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const context = await getWorkspaceContext(req);

        if (!requirePermission(context, "pharmacy.edit", res)) return;

        const ownerId = getOwnerId(context);

        if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        let updatedInvoice;

        await session.withTransaction(async () => {
            const invoice = await getInvoiceForOwner(
                req.params.invoiceId,
                ownerId,
                session
            );

            if (!invoice) {
                throw new Error("Pharmacy invoice not found.");
            }

            if (invoice.status === "Cancelled") {
                throw new Error("Cancelled invoices cannot be edited.");
            }

            const {
                customerName,
                phone,
                email,
                address,
                paymentMode,
                invoiceDate,
                items,
                notes,
                status,
                discountType,
                discountValue,
            } = req.body;

            // Customer validation
            if (
                customerName !== undefined &&
                !String(customerName || "").trim()
            ) {
                throw new Error("Customer name is required.");
            }

            // Status validation
            if (
                status !== undefined &&
                !["Draft", "Paid", "Unpaid", "Cancelled"].includes(status)
            ) {
                throw new Error("Invalid invoice status.");
            }

            // Payment mode validation
            const allowedPaymentModes = [
                "Cash",
                "UPI",
                "Card",
                "Credit Card",
                "Debit Card",
                "Bank Transfer",
                "Cheque",
                "Other",
            ];

            if (paymentMode !== undefined) {
                const parsedPaymentMode = String(paymentMode || "").trim();

                if (
                    parsedPaymentMode &&
                    !allowedPaymentModes.includes(parsedPaymentMode)
                ) {
                    throw new Error("Invalid payment mode.");
                }

                invoice.paymentMode = parsedPaymentMode;
            }

            // Invoice date validation
            if (invoiceDate !== undefined) {
                const parsedDate = new Date(invoiceDate);

                if (Number.isNaN(parsedDate.getTime())) {
                    throw new Error("Invalid invoice date.");
                }

                invoice.invoiceDate = parsedDate;
            }

            // Discount type
            const nextDiscountType =
                discountType !== undefined
                    ? discountType
                    : invoice.discountType || "Percentage";

            if (!["Percentage", "Fixed"].includes(nextDiscountType)) {
                throw new Error(
                    "Discount type must be Percentage or Fixed."
                );
            }

            // Discount value
            const nextDiscountValue =
                discountValue !== undefined
                    ? Number(discountValue)
                    : Number(invoice.discountValue || 0);

            if (
                !Number.isFinite(nextDiscountValue) ||
                nextDiscountValue < 0
            ) {
                throw new Error(
                    "Discount value must be a valid non-negative number."
                );
            }

            if (
                nextDiscountType === "Percentage" &&
                nextDiscountValue > 100
            ) {
                throw new Error(
                    "Percentage discount cannot exceed 100%."
                );
            }

            // Update medicine items and stock when items are supplied
            if (items !== undefined) {
                await restoreStock(invoice.items, ownerId, session);

                const prepared = await prepareItems(
                    items,
                    ownerId,
                    session
                );

                await deductStock(prepared.items, ownerId, session);

                invoice.items = prepared.items;
                invoice.subtotal = prepared.subtotal;
                invoice.gstAmount = prepared.gstAmount;
            }

            // Preserve subtotal and GST if only customer/payment/discount changes
            const subtotal = Number(invoice.subtotal || 0);
            const gstAmount = Number(invoice.gstAmount || 0);

            if (
                !Number.isFinite(subtotal) ||
                !Number.isFinite(gstAmount) ||
                subtotal < 0 ||
                gstAmount < 0
            ) {
                throw new Error("Invalid invoice subtotal or GST amount.");
            }

            // Apply discount after GST
            const amountBeforeDiscount = subtotal + gstAmount;

            let calculatedDiscount =
                nextDiscountType === "Percentage"
                    ? (amountBeforeDiscount * nextDiscountValue) / 100
                    : nextDiscountValue;

            // Discount cannot exceed the invoice amount
            calculatedDiscount = Math.min(
                Math.max(0, calculatedDiscount),
                amountBeforeDiscount
            );

            calculatedDiscount =
                Math.round(
                    (calculatedDiscount + Number.EPSILON) * 100
                ) / 100;

            const amountAfterDiscount =
                amountBeforeDiscount - calculatedDiscount;

            const finalTotal = Math.round(amountAfterDiscount);

            const roundOff =
                Math.round(
                    (finalTotal - amountAfterDiscount + Number.EPSILON) *
                        100
                ) / 100;

            // Save discount and final totals
            invoice.discountType = nextDiscountType;
            invoice.discountValue = nextDiscountValue;
            invoice.discountAmount = calculatedDiscount;
            invoice.roundOff = roundOff;
            invoice.total = finalTotal;

            // Update customer details
            if (customerName !== undefined) {
                invoice.customerName = String(customerName).trim();
            }

            if (phone !== undefined) {
                invoice.phone = String(phone || "").trim();
            }

            if (email !== undefined) {
                invoice.email = String(email || "").trim();
            }

            if (address !== undefined) {
                invoice.address = String(address || "").trim();
            }

            if (notes !== undefined) {
                invoice.notes = String(notes || "");
            }

            if (status !== undefined) {
                invoice.status = status;
            }

            await invoice.save({ session });

            updatedInvoice = invoice;
        });

        return res.json({
            success: true,
            message: "Pharmacy invoice updated successfully.",
            invoice: updatedInvoice,
        });
    } catch (error) {
        console.error("Update pharmacy invoice error:", error);

        const statusCode =
            error.message === "Pharmacy invoice not found." ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to update invoice.",
        });
    } finally {
        await session.endSession();
    }
};


exports.deleteInvoice = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const context = await getWorkspaceContext(req);

        if (!requirePermission(context, "pharmacy.delete", res)) return;

        const ownerId = getOwnerId(context);

       if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        await session.withTransaction(async () => {
            const invoice = await getInvoiceForOwner(
                req.params.invoiceId,
                ownerId,
                session
            );

            if (!invoice) {
                throw new Error("Pharmacy invoice not found.");
            }

            await restoreStock(invoice.items, ownerId, session);

            await PharmacyInvoice.deleteOne(
                { _id: invoice._id, userId: ownerId },
                { session }
            );
        });

        res.json({
            success: true,
            message: "Pharmacy invoice deleted and stock restored.",
        });
    } catch (error) {
        console.error("Delete pharmacy invoice error:", error);

        const statusCode =
            error.message === "Pharmacy invoice not found." ? 404 : 400;

        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to delete invoice.",
        });
    } finally {
        await session.endSession();
    }
};


async function getInvoiceLogoBuffer(logo) {
    const value = String(logo || "").trim();

    if (!value) return null;

    try {
        if (value.startsWith("data:image/")) {
            const base64 = value.split(",")[1];
            return base64 ? Buffer.from(base64, "base64") : null;
        }

        if (/^https?:\/\//i.test(value)) {
            const response = await axios.get(value, {
                responseType: "arraybuffer",
                timeout: 10000,
            });

            return Buffer.from(response.data);
        }

        const fs = require("fs");
        const path = require("path");

        const candidates = [
            value,
            path.join(process.cwd(), value.replace(/^\/+/, "")),
        ];

        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return fs.readFileSync(candidate);
            }
        }
    } catch (error) {
        console.error("PHARMACY LOGO ERROR:", error.message);
    }

    return null;
}





const generateInvoicePDF = async (invoice, owner) => {
    const profile = getOwnerBillingProfile(owner);

    const money = (value) =>
        `Rs. ${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatDate = (value) =>
        new Date(value || Date.now()).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const logoValue =
        profile.clinicLogo ||
        profile.logo ||
        profile.businessLogo ||
        profile.profileImage ||
        owner?.clinicLogo ||
        owner?.logo ||
        owner?.businessLogo ||
        owner?.profileImage ||
        "";

    let logoBuffer = null;

    try {
        if (logoValue && typeof getInvoiceLogoBuffer === "function") {
            logoBuffer = await getInvoiceLogoBuffer(logoValue);
        }
    } catch (error) {
        console.warn("Pharmacy invoice logo error:", error.message);
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 45,
                bufferPages: true,
                info: {
                    Title: invoice.invoiceNumber || "Invoice",
                    Author: profile.businessName || "SaleVitals",
                },
            });

            const chunks = [];

            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("error", reject);
            doc.on("end", () => resolve(Buffer.concat(chunks)));

            const left = 45;
            const right = 550;
            const pageWidth = right - left;

            const drawLine = (y, color = "#D9E0E8", width = 0.7) => {
                doc.moveTo(left, y)
                    .lineTo(right, y)
                    .strokeColor(color)
                    .lineWidth(width)
                    .stroke();
            };

            // Business logo and details
            const logoX = left;
            const logoY = 40;
            const logoSize = 68;
            const headerX = logoBuffer ? left + 78 : left;
            const headerWidth = right - headerX;

            if (logoBuffer) {
                try {
                    doc.image(logoBuffer, logoX, logoY, {
                        fit: [logoSize, logoSize],
                    });
                } catch (error) {
                    console.warn(
                        "Unable to render pharmacy logo:",
                        error.message
                    );
                }
            }

            doc.fillColor("#173766")
                .font("Helvetica-Bold")
                .fontSize(21)
                .text(profile.businessName || "SaleVitals", headerX, 45, {
                    width: headerWidth,
                });

            doc.fillColor("#555555")
                .font("Helvetica")
                .fontSize(9);

            let headerY = 75;

            const businessLines = [
                profile.address,
                profile.phone ? `Phone: ${profile.phone}` : "",
                profile.email ? `Email: ${profile.email}` : "",
            ].filter(Boolean);

            for (const line of businessLines) {
                doc.text(line, headerX, headerY, {
                    width: headerWidth,
                    ellipsis: true,
                });
                headerY += 13;
            }

            let y = Math.max(headerY + 16, 135);
            drawLine(y, "#173766", 1.4);
            y += 24;

            // Billed To / Invoice Details
            const detailsY = y;

            doc.fillColor("#173766")
                .font("Helvetica-Bold")
                .fontSize(9)
                .text("BILLED TO", left, detailsY);

            doc.text("INVOICE DETAILS", 300, detailsY);

            const customerNameY = detailsY + 22;

            doc.fillColor("#222222")
                .font("Helvetica-Bold")
                .fontSize(11)
                .text(invoice.customerName || "Customer", left, customerNameY, {
                    width: 220,
                    ellipsis: true,
                });

            doc.text(invoice.invoiceNumber || "-", 300, customerNameY, {
                width: 250,
                ellipsis: true,
            });

            let customerY = customerNameY + 19;

            doc.fillColor("#555555")
                .font("Helvetica")
                .fontSize(9);

            const customerLines = [
                invoice.phone ? `Phone: ${invoice.phone}` : "",
                invoice.email ? `Email: ${invoice.email}` : "",
                invoice.address || "",
            ].filter(Boolean);

            for (const line of customerLines) {
                doc.text(line, left, customerY, {
                    width: 220,
                    ellipsis: true,
                });
                customerY += 13;
            }

            const invoiceDetailsY = customerNameY + 19;

            doc.text(
                `Invoice date: ${formatDate(invoice.invoiceDate)}`,
                300,
                invoiceDetailsY,
                { width: 250 }
            );

            doc.text(
                `Payment Mode: ${invoice.paymentMode || "Not specified"}`,
                300,
                invoiceDetailsY + 15,
                { width: 250 }
            );

            y =
                Math.max(
                    customerY,
                    invoiceDetailsY + 35,
                    detailsY + 75
                ) + 20;

            const col = {
                number: left,
                medicine: left + 28,
                unit: left + 205,
                qty: left + 250,
                rate: left + 292,
                taxable: left + 345,
                amount: left + 425,
            };

            const tableHeaderHeight = 30;

            doc.roundedRect(left, y, pageWidth, tableHeaderHeight, 6)
                .fill("#173766");

            doc.fillColor("#FFFFFF")
                .font("Helvetica-Bold")
                .fontSize(7);

            doc.text("#", col.number + 5, y + 10, {
                width: 18,
            });

            doc.text("MEDICINE", col.medicine, y + 10, {
                width: 120,
            });

            doc.text("UNIT", col.unit, y + 10, {
                width: 38,
            });

            doc.text("QTY", col.qty, y + 10, {
                width: 28,
                align: "right",
            });

            doc.text("RATE", col.rate, y + 10, {
                width: 48,
                align: "right",
            });

            doc.text("TAXABLE", col.taxable, y + 10, {
                width: 65,
                align: "right",
            });

            doc.text("TOTAL", col.amount, y + 10, {
                width: 65,
                align: "right",
            });

            y += tableHeaderHeight + 8;

            const items = Array.isArray(invoice.items) ? invoice.items : [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (y > 680) {
                    doc.addPage();
                    y = 50;
                }

                const medicineName = item.medicineName || "Medicine";
                const unitType = item.unitType || "Pack";
                const quantity = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const taxableAmount = Number(item.taxableAmount || 0);
                const gstAmount = Number(item.gstAmount || 0);

                const totalAmount = Number(
                    item.totalAmount ?? taxableAmount + gstAmount
                );

                doc.fillColor("#222222")
                    .font("Helvetica")
                    .fontSize(7);

                doc.text(String(i + 1), col.number + 5, y, {
                    width: 18,
                });

                doc.text(medicineName, col.medicine, y, {
                    width: 120,
                    height: 28,
                    ellipsis: true,
                });

                doc.text(unitType, col.unit, y, {
                    width: 38,
                });

                doc.text(String(quantity), col.qty, y, {
                    width: 28,
                    align: "right",
                });

                doc.text(money(price), col.rate, y, {
                    width: 48,
                    align: "right",
                });

                doc.text(money(taxableAmount), col.taxable, y, {
                    width: 65,
                    align: "right",
                });

                doc.text(money(totalAmount), col.amount, y, {
                    width: 65,
                    align: "right",
                });

                y += 29;
            }

            y += 15;

            if (y > 650) {
                doc.addPage();
                y = 50;
            }

            // Invoice summary
            const summaryX = 330;
            const summaryWidth = 220;
            const labelWidth = 110;
            const valueWidth = 110;

            const discountType = invoice.discountType || "Percentage";
            const discountValue = Number(invoice.discountValue || 0);
            const discountAmount = Number(invoice.discountAmount || 0);
            const roundOff = Number(invoice.roundOff || 0);
            const subtotal = Number(invoice.subtotal || 0);
            const gstAmount = Number(invoice.gstAmount || 0);

            doc.font("Helvetica")
                .fontSize(9)
                .fillColor("#444444");

            // Subtotal
            doc.text("Subtotal", summaryX, y, {
                width: labelWidth,
            });

            doc.text(money(subtotal), summaryX + labelWidth, y, {
                width: valueWidth,
                align: "right",
            });

            y += 18;

            // GST total stays in summary only
            doc.fillColor("#444444")
                .text("GST", summaryX, y, {
                    width: labelWidth,
                });

            doc.text(money(gstAmount), summaryX + labelWidth, y, {
                width: valueWidth,
                align: "right",
            });

            y += 18;

            // Discount: same color as other summary rows
            const discountLabel =
                discountType === "Percentage"
                    ? `Discount (${discountValue}%)`
                    : `Discount (${money(discountValue)})`;

            doc.fillColor("#444444")
                .text(discountLabel, summaryX, y, {
                    width: labelWidth,
                });

            doc.text(
                discountAmount > 0
                    ? `- ${money(discountAmount)}`
                    : money(0),
                summaryX + labelWidth,
                y,
                {
                    width: valueWidth,
                    align: "right",
                }
            );

            y += 18;

            // Round off
            doc.fillColor("#444444")
                .text("Round Off", summaryX, y, {
                    width: labelWidth,
                });

            doc.text(money(roundOff), summaryX + labelWidth, y, {
                width: valueWidth,
                align: "right",
            });

            y += 23;

            // Grand total
            doc.roundedRect(summaryX, y, summaryWidth, 40, 7)
                .fill("#172033");

            doc.fillColor("#FFFFFF")
                .font("Helvetica-Bold")
                .fontSize(11)
                .text("Grand Total", summaryX + 10, y + 12, {
                    width: 90,
                });

            doc.fontSize(12)
                .text(money(invoice.total), summaryX + 100, y + 11, {
                    width: 110,
                    align: "right",
                });

            y += 55;

            // Optional notes
            if (invoice.notes) {
                if (y > 680) {
                    doc.addPage();
                    y = 50;
                }

                doc.fillColor("#173766")
                    .font("Helvetica-Bold")
                    .fontSize(9)
                    .text("NOTES", left, y);

                y += 15;

                doc.fillColor("#444444")
                    .font("Helvetica")
                    .fontSize(9)
                    .text(invoice.notes, left, y, {
                        width: pageWidth,
                    });

                y = doc.y + 15;
            }

            // Footer
            if (y > 740) {
                doc.addPage();
                y = 50;
            }

            // Footer divider line
                const footerY = Math.min(Math.max(y + 25, 750), 775);

                doc.moveTo(left, footerY - 12)
                    .lineTo(right, footerY - 12)
                    .strokeColor("#D9E0E8")
                    .lineWidth(0.8)
                    .stroke();

                // Footer text - bold
                doc.fillColor("#64748B")
                    .font("Helvetica-Bold")
                    .fontSize(8)
                    .text("Thank you for your business.", left, footerY, {
                        width: pageWidth / 2,
                    });

                doc.text("Powered by SaleVitals", left + pageWidth / 2, footerY, {
                    width: pageWidth / 2,
                    align: "right",
                });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};




exports.downloadInvoicePDF = async (req, res) => {
    try {
       const context = await getWorkspaceContext(req);

        if (!requirePermission(context, "pharmacy.view", res)) return;

        const ownerId = getOwnerId(context);

        if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        const invoice = await getInvoiceForOwner(
            req.params.invoiceId,
            ownerId
        );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy invoice not found.",
            });
        }

        const owner = await getOwner(ownerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Workspace owner not found.",
            });
        }

        const pdfBuffer = await generateInvoicePDF(invoice, owner);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${invoice.invoiceNumber.replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            )}.pdf"`
        );

        res.send(pdfBuffer);
    } catch (error) {
        console.error("Pharmacy invoice PDF error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate invoice PDF.",
        });
    }
};


exports.sendInvoiceToWhatsApp = async (req, res) => {
    try {
       const context = await getWorkspaceContext(req);

        if (!requirePermission(context, "pharmacy.view", res)) return;

        const ownerId = getOwnerId(context);

        if (!(await requireActivePharmacyAddon(ownerId, res))) return;

        const invoice = await getInvoiceForOwner(
            req.params.invoiceId,
            ownerId
        );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy invoice not found.",
            });
        }

        const phoneInput = String(req.body.phone || invoice.phone || "");
        let phone = phoneInput.replace(/\D/g, "");

        if (phone.length === 10 && /^[6-9]/.test(phone)) {
            phone = `91${phone}`;
        } else if (phone.startsWith("0") && phone.length === 11) {
            phone = `91${phone.slice(1)}`;
        }

        if (!/^[1-9]\d{9,14}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid customer WhatsApp number with country code if needed.",
            });
        }

        const accessToken =
            process.env.WHATSAPP_ACCESS_TOKEN ||
            process.env.META_WHATSAPP_ACCESS_TOKEN ||
            process.env.META_ACCESS_TOKEN;

        const phoneNumberId =
            process.env.WHATSAPP_PHONE_NUMBER_ID ||
            process.env.META_WHATSAPP_PHONE_NUMBER_ID;

        const graphVersion =
            process.env.META_GRAPH_VERSION || "v22.0";

        if (!accessToken || !phoneNumberId) {
            return res.status(503).json({
                success: false,
                message: "WhatsApp Business API is not configured.",
            });
        }

        const owner = await getOwner(ownerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Workspace owner not found.",
            });
        }

        const pdfBuffer = await generateInvoicePDF(invoice, owner);

        const form = new FormData();

        form.append("messaging_product", "whatsapp");
        form.append("type", "application/pdf");
        form.append(
            "file",
            pdfBuffer,
            {
                filename: `${invoice.invoiceNumber.replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                )}.pdf`,
                contentType: "application/pdf",
            }
        );

        const uploadResponse = await axios.post(
            `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/media`,
            form,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    ...form.getHeaders(),
                },
                timeout: 30000,
            }
        );

        const mediaId = uploadResponse.data?.id;

        if (!mediaId) {
            throw new Error("WhatsApp did not return a PDF media ID.");
        }

        await axios.post(
            `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "document",
                document: {
                    id: mediaId,
                    filename: `${invoice.invoiceNumber}.pdf`,
                    caption: `Your pharmacy invoice ${invoice.invoiceNumber}`,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        res.json({
            success: true,
            message: "Invoice PDF sent to WhatsApp successfully.",
        });
    } catch (error) {
        console.error(
            "Send pharmacy invoice WhatsApp error:",
            error.response?.data || error.message
        );

        res.status(502).json({
            success: false,
            message:
                error.response?.data?.error?.message ||
                "Failed to send invoice through WhatsApp. Check the WhatsApp Business API configuration.",
        });
    }
};
