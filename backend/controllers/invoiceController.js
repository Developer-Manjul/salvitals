const axios = require("axios");
const PDFDocument = require("pdfkit");
const FormData = require("form-data");
const Invoice = require("../models/Invoice");
const InvoiceCounter = require("../models/InvoiceCounter");
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

const buildOwnerBillingProfile = (user) => {
    if (!user) {
        return {};
    }

    return {
        displayName: user.displayName || "",
        clinicName: user.clinicName || "",
        businessName: user.businessName || "",
        name: user.name || "",
        ownerName: user.ownerName || "",
        doctorName: user.doctorName || "",
        phone: user.phone || "",
        mobile: user.mobile || "",
        contactNumber: user.contactNumber || "",
        email: user.email || "",
        businessEmail: user.businessEmail || "",
        address: user.address || "",
        clinicAddress: user.clinicAddress || "",
        businessAddress: user.businessAddress || "",
        gstin: user.gstin || "",
        gstNumber: user.gstNumber || "",
        gstNo: user.gstNo || "",
        pan: user.pan || "",
        panNumber: user.panNumber || "",
        pan_number: user.pan_number || "",
        clinicLogo: user.clinicLogo || "",
        logo: user.logo || "",
        businessLogo: user.businessLogo || "",
        profileImage: user.profileImage || "",
        country:
            user.country ||
            user.countryName ||
            user.billingCountry ||
            "",
        countryCode:
            user.countryCode ||
            user.billingCountryCode ||
            user.country_code ||
            "",
        currency:
            user.currency ||
            user.currencyName ||
            user.billingCurrency ||
            "",
        currencyCode:
            user.currencyCode ||
            user.billingCurrencyCode ||
            user.currency_code ||
            "",
        currencySymbol:
            user.currencySymbol ||
            user.billingCurrencySymbol ||
            "",
        currencyLocale:
            user.currencyLocale ||
            user.billingCurrencyLocale ||
            "",
    };
};

const normalizeCountryCode = (value) => {
    const raw = String(value || "")
        .trim()
        .toUpperCase();

    if (!raw) return "";

    const aliases = {
        INDIA: "IN",
        INDIAN: "IN",
        "INDIA (IN)": "IN",
    };

    return aliases[raw] || raw;
};

const normalizeCurrencyCode = (value) => {
    return String(value || "")
        .trim()
        .toUpperCase();
};

const resolveCurrency = (owner) => {
    const isIndia = isIndiaAccount(owner);

    // =========================================================
    // INDIA WORKSPACE
    // =========================================================
    // India workspace MUST ALWAYS use INR.
    //
    // Even if old invoice has:
    // USD
    // $
    // CAD
    // GBP
    //
    // We completely ignore old invoice currency here.
    // =========================================================

    if (isIndia) {
        return {
            isIndia: true,
            countryCode: "IN",
            currencyCode: "INR",
            currencySymbol: "₹",
            locale: "en-IN",
            taxLabel: "GST",
        };
    }

    // =========================================================
    // NON-INDIA WORKSPACE
    // =========================================================

    let currencyCode = String(
        owner?.currencyCode ||
        owner?.billingCurrencyCode ||
        owner?.currency_code ||
        ""
    )
        .trim()
        .toUpperCase();

    // If currency code is missing, try currency name
    if (!currencyCode) {
        const currencyName = String(
            owner?.currency ||
            owner?.currencyName ||
            owner?.billingCurrency ||
            owner?.billing_currency ||
            ""
        )
            .trim()
            .toUpperCase();

        const currencyMap = {
            RUPEE: "INR",
            RUPEES: "INR",
            "INDIAN RUPEE": "INR",
            "INDIAN RUPEES": "INR",
            INR: "INR",

            DOLLAR: "USD",
            DOLLARS: "USD",
            USD: "USD",

            EURO: "EUR",
            EUROS: "EUR",
            EUR: "EUR",

            POUND: "GBP",
            POUNDS: "GBP",
            GBP: "GBP",

            DIRHAM: "AED",
            DIRHAMS: "AED",
            AED: "AED",

            CAD: "CAD",
            AUD: "AUD",
            NZD: "NZD",
            SGD: "SGD",
            SAR: "SAR",
            QAR: "QAR",
            KWD: "KWD",
            BHD: "BHD",
            OMR: "OMR",
            JPY: "JPY",
            CNY: "CNY",
            HKD: "HKD",
            MYR: "MYR",
            THB: "THB",
            ZAR: "ZAR",
            CHF: "CHF",
        };

        currencyCode =
            currencyMap[currencyName] || "";
    }

    // Non-India default
    if (!currencyCode) {
        currencyCode = "USD";
    }

    const defaults =
        CURRENCY_DEFAULTS[currencyCode] || {
            symbol: currencyCode,
            locale: "en-US",
        };

    return {
        isIndia: false,

        countryCode:
            normalizeCountryCode(
                owner?.countryCode ||
                owner?.billingCountryCode ||
                owner?.country_code ||
                owner?.country ||
                owner?.billingCountry ||
                ""
            ),

        currencyCode,

        currencySymbol:
            owner?.currencySymbol ||
            owner?.billingCurrencySymbol ||
            defaults.symbol,

        locale:
            owner?.currencyLocale ||
            owner?.billingCurrencyLocale ||
            defaults.locale,

        taxLabel: "Tax",
    };
};

const isIndiaAccount = (owner) => {
    if (!owner) {
        return false;
    }

    // ---------------------------------------------------------
    // COUNTRY
    // ---------------------------------------------------------
    const countryCode = String(
        owner.countryCode ||
        owner.billingCountryCode ||
        owner.country_code ||
        owner.billing_country_code ||
        ""
    )
        .trim()
        .toUpperCase();

    const country = String(
        owner.country ||
        owner.countryName ||
        owner.billingCountry ||
        owner.billing_country ||
        ""
    )
        .trim()
        .toLowerCase();

    // ---------------------------------------------------------
    // CURRENCY
    // ---------------------------------------------------------
    const currencyCode = String(
        owner.currencyCode ||
        owner.billingCurrencyCode ||
        owner.currency_code ||
        owner.billing_currency_code ||
        ""
    )
        .trim()
        .toUpperCase();

    const currency = String(
        owner.currency ||
        owner.currencyName ||
        owner.billingCurrency ||
        owner.billing_currency ||
        ""
    )
        .trim()
        .toUpperCase();

    // ---------------------------------------------------------
    // GST
    // Indian GSTIN is a very strong indication that the
    // workspace belongs to India.
    // ---------------------------------------------------------
    const gstin = String(
        owner.gstin ||
        owner.gstNumber ||
        owner.gstNo ||
        owner.gst_number ||
        owner.gst_number ||
        ""
    )
        .trim()
        .toUpperCase();

    // ---------------------------------------------------------
    // INDIA COUNTRY CHECK
    // ---------------------------------------------------------
    const indiaByCountry =
        countryCode === "IN" ||
        countryCode === "IND" ||
        countryCode === "INDIA" ||
        country === "india" ||
        country === "indian" ||
        country === "bharat" ||
        country === "in" ||
        country === "ind";

    // ---------------------------------------------------------
    // INDIA CURRENCY CHECK
    // ---------------------------------------------------------
    const indiaByCurrency =
        currencyCode === "INR" ||
        currency === "INR" ||
        currency === "RUPEE" ||
        currency === "RUPEES" ||
        currency === "INDIAN RUPEE" ||
        currency === "INDIAN RUPEES";

    // ---------------------------------------------------------
    // INDIA GSTIN CHECK
    //
    // Example:
    // 06AHJPY756E1ZY
    // ---------------------------------------------------------
    const indiaByGST =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
            gstin
        );

    return (
        indiaByCountry ||
        indiaByCurrency ||
        indiaByGST
    );
};

const CURRENCY_DEFAULTS = {
    INR: {
        symbol: "₹",
        locale: "en-IN",
    },
    USD: {
        symbol: "$",
        locale: "en-US",
    },
    EUR: {
        symbol: "€",
        locale: "de-DE",
    },
    GBP: {
        symbol: "£",
        locale: "en-GB",
    },
    AED: {
        symbol: "د.إ",
        locale: "ar-AE",
    },
    CAD: {
        symbol: "CA$",
        locale: "en-CA",
    },
    AUD: {
        symbol: "A$",
        locale: "en-AU",
    },
    NZD: {
        symbol: "NZ$",
        locale: "en-NZ",
    },
    SGD: {
        symbol: "S$",
        locale: "en-SG",
    },
    SAR: {
        symbol: "﷼",
        locale: "ar-SA",
    },
    QAR: {
        symbol: "ر.ق",
        locale: "ar-QA",
    },
    KWD: {
        symbol: "د.ك",
        locale: "ar-KW",
    },
    BHD: {
        symbol: "د.ب",
        locale: "ar-BH",
    },
    OMR: {
        symbol: "ر.ع.",
        locale: "ar-OM",
    },
    JPY: {
        symbol: "¥",
        locale: "ja-JP",
    },
    CNY: {
        symbol: "¥",
        locale: "zh-CN",
    },
    HKD: {
        symbol: "HK$",
        locale: "en-HK",
    },
    MYR: {
        symbol: "RM",
        locale: "ms-MY",
    },
    THB: {
        symbol: "฿",
        locale: "th-TH",
    },
    ZAR: {
        symbol: "R",
        locale: "en-ZA",
    },
    CHF: {
        symbol: "CHF",
        locale: "de-CH",
    },
};

const normalizeItems = (
    items,
    taxLabel = "GST"
) => {
    return (
        Array.isArray(items)
            ? items
            : []
    ).map((item) => {
        const taxRate = Number(
            item.taxRate ??
                item.gst ??
                0
        ) || 0;

        const taxAmount = Number(
            item.taxAmount ??
                item.gstAmount ??
                0
        ) || 0;

        return {
            serviceId:
                item.serviceId || "",

            serviceName:
                item.serviceName ||
                "Service",

            quantity:
                Number(item.quantity) || 1,

            cost:
                Number(item.cost) || 0,

            gst:
                taxRate,

            baseAmount:
                Number(
                    item.baseAmount
                ) || 0,

            gstAmount:
                taxAmount,

            total:
                Number(item.total) || 0,

            taxLabel,

            taxRate,

            taxAmount,
        };
    });
};

const formatInvoiceMoney = (
    value,
    invoice = {},
    settings = null
) => {
    const resolved = settings || {
        currencyCode: invoice.currencyCode || "INR",
        currencySymbol:
            invoice.currencySymbol ||
            CURRENCY_DEFAULTS[invoice.currencyCode]?.symbol ||
            "₹",
        locale:
            invoice.currencyLocale ||
            (invoice.currencyCode === "INR"
                ? "en-IN"
                : "en-US"),
    };

    const code = String(
        resolved.currencyCode || "USD"
    ).toUpperCase();

    const locale = resolved.locale || "en-US";

    const symbol =
        resolved.currencySymbol ||
        CURRENCY_DEFAULTS[code]?.symbol ||
        code;

    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(value || 0));
    } catch (error) {
        return `${symbol}${Number(value || 0).toLocaleString(
            locale,
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    }
};

const getWorkspaceOwner = async (workspaceOwnerId) => {
    if (!workspaceOwnerId) {
        return null;
    }

    return await User.findById(workspaceOwnerId).lean();
};

const getNextPatientId = async (workspaceOwnerId) => {
    let counter;

    try {
        counter = await InvoiceCounter.findOneAndUpdate(
            {
                userId: workspaceOwnerId,
            },
            {
                $inc: {
                    sequence: 1,
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: false,
            }
        );
    } catch (error) {
        if (error.code !== 11000) {
            throw error;
        }

        counter = await InvoiceCounter.findOneAndUpdate(
            {
                userId: workspaceOwnerId,
            },
            {
                $inc: {
                    sequence: 1,
                },
            },
            {
                new: true,
            }
        );
    }

    return `K${String(counter.sequence).padStart(3, "0")}`;
};

const resolvePatientId = async ({
    workspaceOwnerId,
    customerId,
    customerName,
    customerPhone,
}) => {
    const patientFilter = customerId
        ? {
              customerId,
          }
        : customerPhone
        ? {
              customerId: "",
              customerName: String(
                  customerName || ""
              ).trim(),
              customerPhone,
          }
        : null;

    if (patientFilter) {
        const existingPatient =
            await Invoice.findOne({
                userId: workspaceOwnerId,
                ...patientFilter,
                patientId: {
                    $ne: "",
                },
            })
                .select("patientId")
                .lean();

        if (existingPatient?.patientId) {
            return existingPatient.patientId;
        }
    }

    return getNextPatientId(workspaceOwnerId);
};

const normalizePaymentMode = (value) => {
    const allowed = [
        "Credit Card",
        "Debit Card",
        "Cash",
        "UPI",
        "Bank Transfer",
    ];

    const paymentMode = String(value || "").trim();

    return allowed.includes(paymentMode)
        ? paymentMode
        : "";
};
exports.getInvoices = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "invoices.view",
                res
            )
        ) {
            return;
        }

        const workspaceOwnerId =
            context.workspaceOwnerId;

        const owner =
            await getWorkspaceOwner(
                workspaceOwnerId
            );

        if (!owner) {
            return res.status(404).json({
                success: false,
                message:
                    "Workspace owner account not found.",
            });
        }

        const ownerBillingProfile =
            buildOwnerBillingProfile(owner);

        const invoices =
            await Invoice.find({
                userId: workspaceOwnerId,
            })
                .sort({
                    createdAt: -1,
                })
                .lean();

        /*
         * IMPORTANT:
         * Invoice currency should always follow
         * the workspace owner's country/currency.
         *
         * India owner:
         * INR + ₹ + en-IN + GST
         *
         * Outside India:
         * Owner's configured currency.
         */
        const invoiceSettings =
            resolveCurrency(owner);

        const normalizedInvoices =
            invoices.map((invoice) => ({
                ...invoice,

                billedBy:
                    ownerBillingProfile,

                paymentMode:
                    invoice.paymentMode || "",

                countryCode:
                    invoiceSettings.countryCode,

                currencyCode:
                    invoiceSettings.currencyCode,

                currencySymbol:
                    invoiceSettings.currencySymbol,

                currencyLocale:
                    invoiceSettings.locale,

                taxLabel:
                    invoiceSettings.taxLabel,

                taxAmount:
                    Number(
                        invoice.taxAmount ??
                            invoice.gstAmount
                    ) || 0,
            }));

        return res.json({
            success: true,
            invoices: normalizedInvoices,
        });
    } catch (error) {
        console.error(
            "GET INVOICES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load invoices.",
        });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "invoices.create",
                res
            )
        ) {
            return;
        }

        const workspaceOwnerId =
            context.workspaceOwnerId;

        const owner =
            await getWorkspaceOwner(
                workspaceOwnerId
            );

        if (!owner) {
            return res.status(404).json({
                success: false,
                message:
                    "Workspace owner account not found.",
            });
        }

        const ownerBillingProfile =
            buildOwnerBillingProfile(owner);

        const {
            invoiceNumber,
            invoiceDate,
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            paymentMode,
            notes,
            items,
            subtotal,
            gstAmount,
            taxAmount,
            total,
            status,
            taxLabel,
            taxRate,
            currencyCode,
            currencySymbol,
            currencyLocale,
            countryCode,
        } = req.body;

        if (
            !customerName ||
            !String(customerName).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Customer name is required.",
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one invoice item is required.",
            });
        }

        const patientId =
            await resolvePatientId({
                workspaceOwnerId,
                customerId,
                customerName,
                customerPhone,
            });

        const invoiceSettings =
            resolveCurrency(owner);
        const requestedCountryCode =
            normalizeCountryCode(
                countryCode
            );

        const requestedCurrencyCode =
            normalizeCurrencyCode(
                currencyCode
            );

        const isIndiaInvoice =
            invoiceSettings.isIndia ||
            requestedCountryCode === "IN" ||
            requestedCurrencyCode === "INR" ||
            String(taxLabel || "").toUpperCase() ===
                "GST";

        const finalCountryCode =
            isIndiaInvoice
                ? "IN"
                : invoiceSettings.countryCode ||
                  requestedCountryCode ||
                  "";

        const finalCurrencyCode =
            isIndiaInvoice
                ? "INR"
                : invoiceSettings.currencyCode ||
                  requestedCurrencyCode ||
                  "USD";

        const finalCurrencySymbol =
            isIndiaInvoice
                ? "₹"
                : invoiceSettings.currencySymbol ||
                  currencySymbol ||
                  "";

        const finalCurrencyLocale =
            isIndiaInvoice
                ? "en-IN"
                : invoiceSettings.locale ||
                  currencyLocale ||
                  "en-US";

        const finalTaxLabel =
            isIndiaInvoice
                ? "GST"
                : invoiceSettings.taxLabel ||
                  "Tax";

        const invoice =
            await Invoice.create({
                userId:
                    workspaceOwnerId,

                invoiceNumber:
                    invoiceNumber ||
                    `INV-${Date.now()}`,

                invoiceDate:
                    invoiceDate
                        ? new Date(invoiceDate)
                        : new Date(),

                customerId:
                    customerId || "",

                patientId,

                customerName:
                    String(
                        customerName
                    ).trim(),

                customerEmail:
                    customerEmail || "",

                customerPhone:
                    customerPhone || "",

                customerAddress:
                    customerAddress || "",

                paymentMode:
                    normalizePaymentMode(
                        paymentMode
                    ),

                notes:
                    notes || "",

                /*
                 * Always save workspace owner's
                 * billing profile.
                 */
                billedBy:
                    ownerBillingProfile,

                items:
                    normalizeItems(
                        items,
                        finalTaxLabel
                    ),

                subtotal:
                    Number(subtotal) || 0,

                gstAmount:
                    Number(
                        taxAmount ?? gstAmount
                    ) || 0,

                taxAmount:
                    Number(
                        taxAmount ?? gstAmount
                    ) || 0,

                taxLabel:
                    finalTaxLabel,

                countryCode:
                    finalCountryCode,

                currencyCode:
                    finalCurrencyCode,

                currencySymbol:
                    finalCurrencySymbol,

                currencyLocale:
                    finalCurrencyLocale,

                total:
                    Number(total) || 0,

                status:
                    status || "Draft",
            });

        return res.status(201).json({
            success: true,
            message:
                "Invoice created successfully.",
            invoice,
        });
    } catch (error) {
        console.error(
            "CREATE INVOICE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to create invoice.",
        });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        const context = await getContext(req);

        if (
            !requirePermission(
                context,
                "invoices.edit",
                res
            )
        ) {
            return;
        }

        const workspaceOwnerId =
            context.workspaceOwnerId;

        const owner =
            await getWorkspaceOwner(
                workspaceOwnerId
            );

        if (!owner) {
            return res.status(404).json({
                success: false,
                message:
                    "Workspace owner account not found.",
            });
        }

        const ownerBillingProfile =
            buildOwnerBillingProfile(owner);

        const invoice =
            await Invoice.findOne({
                _id: req.params.invoiceId,
                userId: workspaceOwnerId,
            });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found.",
            });
        }

        const {
            invoiceNumber,
            invoiceDate,
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            paymentMode,
            notes,
            items,
            subtotal,
            gstAmount,
            taxAmount,
            total,
            status,
            taxLabel,
            taxRate,
            currencyCode,
            currencySymbol,
            currencyLocale,
            countryCode,
        } = req.body;

        if (
            !customerName ||
            !String(customerName).trim() ||
            !Array.isArray(items) ||
            !items.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Customer name and at least one invoice item are required.",
            });
        }

        const nextCustomerId =
            customerId || "";

        const nextCustomerName =
            String(customerName).trim();

        const nextCustomerPhone =
            customerPhone || "";

        const samePatient =
            String(
                invoice.customerId || ""
            ) ===
                String(nextCustomerId) &&
            invoice.customerName ===
                nextCustomerName &&
            invoice.customerPhone ===
                nextCustomerPhone;

        const patientId =
            samePatient &&
            invoice.patientId
                ? invoice.patientId
                : await resolvePatientId({
                      workspaceOwnerId,
                      customerId:
                          nextCustomerId,
                      customerName:
                          nextCustomerName,
                      customerPhone:
                          nextCustomerPhone,
                  });

        const invoiceSettings =
            resolveCurrency(owner);


        const requestedCountryCode =
            normalizeCountryCode(
                countryCode
            );

        const requestedCurrencyCode =
            normalizeCurrencyCode(
                currencyCode
            );

        const isIndiaInvoice =
            invoiceSettings.isIndia ||
            requestedCountryCode === "IN" ||
            requestedCurrencyCode === "INR" ||
            String(
                taxLabel || ""
            ).toUpperCase() === "GST";

        const finalCountryCode =
            isIndiaInvoice
                ? "IN"
                : invoiceSettings.countryCode ||
                  requestedCountryCode ||
                  "";

        const finalCurrencyCode =
            isIndiaInvoice
                ? "INR"
                : invoiceSettings.currencyCode ||
                  requestedCurrencyCode ||
                  "USD";

        const finalCurrencySymbol =
            isIndiaInvoice
                ? "₹"
                : invoiceSettings.currencySymbol ||
                  currencySymbol ||
                  "";

        const finalCurrencyLocale =
            isIndiaInvoice
                ? "en-IN"
                : invoiceSettings.locale ||
                  currencyLocale ||
                  "en-US";

        const finalTaxLabel =
            isIndiaInvoice
                ? "GST"
                : invoiceSettings.taxLabel ||
                  "Tax";

        Object.assign(invoice, {
            invoiceNumber:
                invoiceNumber ||
                invoice.invoiceNumber,

            invoiceDate:
                invoiceDate
                    ? new Date(invoiceDate)
                    : invoice.invoiceDate,

            customerId:
                nextCustomerId,

            patientId,

            customerName:
                nextCustomerName,

            customerEmail:
                customerEmail || "",

            customerPhone:
                nextCustomerPhone,

            customerAddress:
                customerAddress || "",

            paymentMode:
                normalizePaymentMode(
                    paymentMode
                ),

            notes:
                notes || "",

            /*
             * Always keep workspace owner's
             * billing profile.
             */
            billedBy:
                ownerBillingProfile,

            items:
                normalizeItems(
                    items,
                    finalTaxLabel
                ),

            subtotal:
                Number(subtotal) || 0,

            gstAmount:
                Number(
                    taxAmount ?? gstAmount
                ) || 0,

            taxAmount:
                Number(
                    taxAmount ?? gstAmount
                ) || 0,

            taxLabel:
                finalTaxLabel,

            countryCode:
                finalCountryCode,

            currencyCode:
                finalCurrencyCode,

            currencySymbol:
                finalCurrencySymbol,

            currencyLocale:
                finalCurrencyLocale,

            total:
                Number(total) || 0,

            status:
                status ||
                invoice.status,
        });

        await invoice.save();

        return res.json({
            success: true,
            invoice,
        });
    } catch (error) {
        console.error(
            "UPDATE INVOICE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to update invoice.",
        });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "invoices.delete",
                res
            )
        ) {
            return;
        }

        const workspaceOwnerId =
            context.workspaceOwnerId;

        const invoiceId =
            req.params.invoiceId;

        const invoice =
            await Invoice.findOne({
                _id: invoiceId,
                userId: workspaceOwnerId,
            });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Invoice not found.",
            });
        }

        await Invoice.deleteOne({
            _id: invoiceId,
            userId: workspaceOwnerId,
        });

        return res.json({
            success: true,
            message:
                "Invoice deleted successfully.",
        });
    } catch (error) {
        console.error(
            "DELETE INVOICE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete invoice.",
        });
    }
};

async function getInvoiceLogoBuffer(logo) {
    const value =
        String(logo || "").trim();

    if (!value) {
        return null;
    }

    try {
        if (
            value.startsWith(
                "data:image/"
            )
        ) {
            const base64 =
                value.split(",")[1];

            return base64
                ? Buffer.from(
                      base64,
                      "base64"
                  )
                : null;
        }

        if (
            /^https?:\/\//i.test(value)
        ) {
            const response =
                await axios.get(value, {
                    responseType:
                        "arraybuffer",
                    timeout: 10000,
                });

            return Buffer.from(
                response.data
            );
        }

        const fs = require("fs");
        const path = require("path");

        const candidates = [
            value,
            path.join(
                process.cwd(),
                value.replace(
                    /^\/+/,
                    ""
                )
            ),
        ];

        for (
            const candidate of candidates
        ) {
            if (
                fs.existsSync(candidate)
            ) {
                return fs.readFileSync(
                    candidate
                );
            }
        }
    } catch (error) {
        console.error(
            "INVOICE LOGO ERROR:",
            error.message
        );
    }

    return null;
}
function generateInvoicePDF(
    invoice,
    owner
) {
    return new Promise(
        async (
            resolve,
            reject
        ) => {
            try {
                const doc =
                    new PDFDocument({
                        size: "A4",
                        margin: 45,
                        autoFirstPage: true,
                    });
                
                // =========================================================
// UNICODE FONT - ₹ £ € $ SUPPORT
// =========================================================
const fs = require("fs");
const path = require("path");

const regularFontPath = path.join(
    process.cwd(),
    "fonts",
    "DejaVuSans.ttf"
);

const boldFontPath = path.join(
    process.cwd(),
    "fonts",
    "DejaVuSans-Bold.ttf"
);

const hasUnicodeFont =
    fs.existsSync(regularFontPath) &&
    fs.existsSync(boldFontPath);

if (hasUnicodeFont) {
    doc.registerFont(
        "InvoiceRegular",
        regularFontPath
    );

    doc.registerFont(
        "InvoiceBold",
        boldFontPath
    );
}

                const chunks = [];

                doc.on(
                    "data",
                    (chunk) =>
                        chunks.push(chunk)
                );

                doc.on(
                    "end",
                    () =>
                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        )
                );

                doc.on(
                    "error",
                    reject
                );

                const billingProfile =
                    buildOwnerBillingProfile(
                        owner
                    );

                /*
                 * IMPORTANT:
                 * Currency must always come from
                 * CURRENT WORKSPACE OWNER.
                 *
                 * Do NOT use invoice.currencyCode here.
                 * Old invoices may contain USD/$ even when
                 * the workspace is now an India account.
                 */
                const invoiceSettings =
                    resolveCurrency({
                        ...owner,

                        countryCode:
                            owner?.countryCode ||
                            owner?.billingCountryCode ||
                            owner?.country_code ||
                            owner?.country ||
                            owner?.billingCountry,

                        country:
                            owner?.country ||
                            owner?.countryName ||
                            owner?.billingCountry,

                        currencyCode:
                            owner?.currencyCode ||
                            owner?.billingCurrencyCode ||
                            owner?.currency_code,

                        currencySymbol:
                            owner?.currencySymbol ||
                            owner?.billingCurrencySymbol,

                        currencyLocale:
                            owner?.currencyLocale ||
                            owner?.billingCurrencyLocale,
                    });

               const pdfInvoice = {
    ...invoice,

    countryCode:
        invoiceSettings.countryCode,

    currencyCode:
        invoiceSettings.currencyCode,

    currencySymbol:
        invoiceSettings.currencySymbol,

    currencyLocale:
        invoiceSettings.locale,

    taxLabel:
        invoiceSettings.isIndia
            ? "GST"
            : "Tax",
};

                const businessName =
                    billingProfile.displayName ||
                    billingProfile.clinicName ||
                    billingProfile.businessName ||
                    billingProfile.name ||
                    "SaleVitals";

                const businessPhone =
                    billingProfile.phone ||
                    billingProfile.mobile ||
                    billingProfile.contactNumber ||
                    "";

                const businessEmail =
                    billingProfile.email ||
                    billingProfile.businessEmail ||
                    "";

                const businessAddress =
                    billingProfile.address ||
                    billingProfile.clinicAddress ||
                    billingProfile.businessAddress ||
                    "";

                const businessLogo =
                    billingProfile.clinicLogo ||
                    billingProfile.logo ||
                    billingProfile.businessLogo ||
                    billingProfile.profileImage ||
                    "";

              const taxLabel =
    invoiceSettings.isIndia
        ? "GST"
        : (
            invoice.taxLabel ||
            invoiceSettings.taxLabel
        );

                const gstin =
                    invoiceSettings.isIndia
                        ? billingProfile.gstin ||
                          billingProfile.gstNumber ||
                          billingProfile.gstNo ||
                          ""
                        : "";

                const customerName =
                    invoice.customerName ||
                    "Customer";

                const invoiceNumber =
                    invoice.invoiceNumber ||
                    "";

                const paymentMode =
                    invoice.paymentMode ||
                    "";

                const invoiceDate =
                    invoice.invoiceDate
                        ? new Date(
                              invoice.invoiceDate
                          ).toLocaleDateString(
                              "en-IN",
                              {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                              }
                          )
                        : "-";

                /*
                 * IMPORTANT:
                 * Use pdfInvoice here so old USD invoice
                 * will still print using owner's current INR.
                 */
   const money = (value) => {
    const amount = Number(value) || 0;

    // =========================================================
    // INDIA
    // ALWAYS INR
    // =========================================================

    if (invoiceSettings.isIndia) {
        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        ).format(amount);
    }

    // =========================================================
    // OTHER COUNTRIES
    // =========================================================

    return new Intl.NumberFormat(
        invoiceSettings.locale || "en-US",
        {
            style: "currency",
            currency:
                invoiceSettings.currencyCode ||
                "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(amount);
};
                const logoBuffer =
                    await getInvoiceLogoBuffer(
                        businessLogo
                    );

                const pageLeft = 45;

                const pageRight = 547;

                const contentWidth =
                    pageRight -
                    pageLeft;

                /*
                 * LOGO
                 */
                if (logoBuffer) {
                    try {
                        doc.image(
                            logoBuffer,
                            pageLeft,
                            45,
                            {
                                fit: [
                                    55,
                                    55,
                                ],
                                align:
                                    "left",
                                valign:
                                    "center",
                            }
                        );
                    } catch (
                        error
                    ) {
                        console.error(
                            "INVOICE LOGO RENDER ERROR:",
                            error.message
                        );
                    }
                }

                const headerX =
                    logoBuffer
                        ? 115
                        : pageLeft;

                /*
                 * BUSINESS NAME
                 */
                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(20)
                    .fillColor(
                        "#173766"
                    )
                    .text(
                        businessName,
                        headerX,
                        48,
                        {
                            width:
                                contentWidth -
                                (
                                    headerX -
                                    pageLeft
                                ),
                        }
                    );

                /*
                 * TAX INVOICE
                 */
                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(8)
                    .fillColor(
                        "#666666"
                    )
                    .text(
                        "TAX INVOICE",
                        headerX,
                        73
                    );

                let headerY = 88;

                /*
                 * PHONE
                 */
                if (businessPhone) {
                    doc
                        .font(
                            "Helvetica"
                        )
                        .fontSize(8)
                        .fillColor(
                            "#666666"
                        )
                        .text(
                            `Phone: ${businessPhone}`,
                            headerX,
                            headerY
                        );

                    headerY += 12;
                }

                /*
                 * EMAIL
                 */
                if (businessEmail) {
                    doc.text(
                        `Email: ${businessEmail}`,
                        headerX,
                        headerY
                    );

                    headerY += 12;
                }

                /*
                 * ADDRESS
                 */
                if (businessAddress) {
                    doc.text(
                        businessAddress,
                        headerX,
                        headerY,
                        {
                            width:
                                contentWidth -
                                (
                                    headerX -
                                    pageLeft
                                ),
                        }
                    );

                    headerY += 12;
                }

                /*
                 * GSTIN
                 *
                 * Only India workspace gets GSTIN.
                 */
                if (gstin) {
                    doc.text(
                        `GSTIN: ${gstin}`,
                        headerX,
                        headerY
                    );

                    headerY += 12;
                }

                /*
                 * HEADER LINE
                 */
                const lineY =
                    Math.max(
                        headerY + 10,
                        125
                    );

                doc
                    .moveTo(
                        pageLeft,
                        lineY
                    )
                    .lineTo(
                        pageRight,
                        lineY
                    )
                    .lineWidth(1.2)
                    .strokeColor(
                        "#173766"
                    )
                    .stroke();

                /*
                 * CUSTOMER / INVOICE INFO
                 */
                const infoY =
                    lineY + 20;

                /*
                 * BILLED TO
                 */
                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(8)
                    .fillColor(
                        "#173766"
                    )
                    .text(
                        "BILLED TO",
                        pageLeft,
                        infoY
                    );

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(10)
                    .fillColor(
                        "#111827"
                    )
                    .text(
                        customerName,
                        pageLeft,
                        infoY + 18
                    );

                let customerY =
                    infoY + 34;

                /*
                 * PAYMENT MODE
                 */
                if (paymentMode) {
                    doc
                        .font(
                            "Helvetica"
                        )
                        .fontSize(8)
                        .fillColor(
                            "#555555"
                        )
                        .text(
                            `Payment Mode: ${paymentMode}`,
                            pageLeft,
                            customerY
                        );

                    customerY += 12;
                }

                /*
                 * CUSTOMER PHONE
                 */
                if (
                    invoice.customerPhone
                ) {
                    doc.text(
                        `Phone: ${invoice.customerPhone}`,
                        pageLeft,
                        customerY
                    );

                    customerY += 12;
                }

                /*
                 * CUSTOMER EMAIL
                 */
                if (
                    invoice.customerEmail
                ) {
                    doc.text(
                        `Email: ${invoice.customerEmail}`,
                        pageLeft,
                        customerY
                    );

                    customerY += 12;
                }

                /*
                 * CUSTOMER ADDRESS
                 */
                if (
                    invoice.customerAddress
                ) {
                    doc.text(
                        invoice.customerAddress,
                        pageLeft,
                        customerY,
                        {
                            width: 220,
                        }
                    );

                    customerY += 12;
                }

                /*
                 * INVOICE DETAILS
                 */
                const detailsX = 330;

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(8)
                    .fillColor(
                        "#173766"
                    )
                    .text(
                        "INVOICE DETAILS",
                        detailsX,
                        infoY
                    );

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(10)
                    .fillColor(
                        "#111827"
                    )
                    .text(
                        invoiceNumber,
                        detailsX,
                        infoY + 18
                    );

                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(8)
                    .fillColor(
                        "#64748b"
                    )
                    .text(
                        `Invoice date: ${invoiceDate}`,
                        detailsX,
                        infoY + 34
                    );

                /*
                 * PATIENT ID
                 */
                if (
                    invoice.patientId
                ) {
                    doc.text(
                        `Patient ID: ${invoice.patientId}`,
                        detailsX,
                        infoY + 46
                    );
                }

                /*
                 * TABLE START
                 */
                let y =
                    Math.max(
                        customerY,
                        infoY + 70
                    ) + 18;

                const headerHeight = 28;

                /*
                 * TABLE HEADER
                 */
                doc
                    .roundedRect(
                        pageLeft,
                        y,
                        contentWidth,
                        headerHeight,
                        5
                    )
                    .fill("#173766");

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(8)
                    .fillColor(
                        "#ffffff"
                    )
                    .text(
                        "#",
                        pageLeft + 10,
                        y + 9
                    );

                doc.text(
                    "DESCRIPTION OF SERVICE",
                    pageLeft + 35,
                    y + 9,
                    {
                        width: 250,
                    }
                );

                doc.text(
                    "QTY",
                    330,
                    y + 9
                );

                doc.text(
                    taxLabel.toUpperCase(),
                    385,
                    y + 9
                );

                doc.text(
                    "AMOUNT",
                    455,
                    y + 9
                );

                y += 38;

                /*
                 * ITEMS
                 */
                const items =
                    Array.isArray(
                        invoice.items
                    )
                        ? invoice.items
                        : [];

                items.forEach(
                    (
                        item,
                        index
                    ) => {
                        const serviceName =
                            item.serviceName ||
                            "Service";

                        const quantity =
                            Number(
                                item.quantity
                            ) || 1;

                        const taxRate =
                            Number(
                                item.taxRate ??
                                    item.gst
                            ) || 0;

                        const amount =
                            Number(
                                item.total
                            ) || 0;

                        /*
                         * ITEM NUMBER
                         */
                        doc
                            .font(
                                "Helvetica"
                            )
                            .fontSize(8.5)
                            .fillColor(
                                "#111827"
                            )
                            .text(
                                String(
                                    index + 1
                                ),
                                pageLeft +
                                    10,
                                y
                            );

                        /*
                         * SERVICE NAME
                         */
                        doc.text(
                            serviceName,
                            pageLeft +
                                35,
                            y,
                            {
                                width: 250,
                                ellipsis:
                                    true,
                            }
                        );

                        /*
                         * QUANTITY
                         */
                        doc.text(
                            String(
                                quantity
                            ),
                            330,
                            y
                        );

                        /*
                         * TAX RATE
                         */
                        doc.text(
                            `${taxRate}%`,
                            385,
                            y
                        );

                        /*
                         * AMOUNT
                         *
                         * This now uses owner's currency.
                         */
                        if (hasUnicodeFont) {
                            doc.font("InvoiceRegular");
                        } else {
                            doc.font("Helvetica");
                        }

                        doc.text(
                            money(amount),
                            455,
                            y
                        );

                        y += 28;

                        /*
                         * ROW LINE
                         */
                        doc
                            .moveTo(
                                pageLeft,
                                y - 8
                            )
                            .lineTo(
                                pageRight,
                                y - 8
                            )
                            .lineWidth(
                                0.5
                            )
                            .strokeColor(
                                "#dddddd"
                            )
                            .stroke();
                    }
                );

                y += 8;

                /*
                 * SUMMARY
                 */
                const summaryX = 350;

                const summaryWidth = 197;

                /*
                 * SUBTOTAL
                 */
                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(9)
                    .fillColor(
                        "#64748b"
                    )
                    .text(
                        "Subtotal",
                        summaryX,
                        y
                    );

                doc
                    if (hasUnicodeFont) {
                doc.font("InvoiceBold");
            } else {
                doc.font("Helvetica-Bold");
            }

            doc
                .fillColor("#111827")
                .text(
                    money(
                        invoice.subtotal
                    ),
                    455,
                    y
                );

                y += 22;

                /*
                 * SUMMARY LINE
                 */
                doc
                    .moveTo(
                        summaryX,
                        y - 5
                    )
                    .lineTo(
                        pageRight,
                        y - 5
                    )
                    .lineWidth(
                        0.5
                    )
                    .strokeColor(
                        "#e2e8f0"
                    )
                    .stroke();

                /*
                 * TAX / GST
                 */
                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(9)
                    .fillColor(
                        "#64748b"
                    )
                    .text(
                        taxLabel,
                        summaryX,
                        y + 5
                    );

                if (hasUnicodeFont) {
                doc.font("InvoiceBold");
            } else {
                doc.font("Helvetica-Bold");
            }

            doc
                .fillColor("#111827")
                .text(
                    money(
                        invoice.taxAmount ??
                            invoice.gstAmount
                    ),
                    455,
                    y + 5
                );

                y += 35;

                /*
                 * GRAND TOTAL BOX
                 */
                doc
                    .roundedRect(
                        summaryX,
                        y,
                        summaryWidth,
                        38,
                        5
                    )
                    .fill("#172033");

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(11)
                    .fillColor(
                        "#ffffff"
                    )
                    .text(
                        "Grand Total",
                        summaryX + 10,
                        y + 12
                    );

                if (hasUnicodeFont) {
                    doc.font("InvoiceBold");
                } else {
                    doc.font("Helvetica-Bold");
                }

                doc
                    .fontSize(13)
                    .fillColor("#ffffff")
                    .text(
                        money(
                            invoice.total
                        ),
                        425,
                        y + 10,
                        {
                            width: 112,
                            align: "right",
                        }
                    );

                y += 58;

                /*
                 * NOTES
                 */
                if (invoice.notes) {
                    doc
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(9)
                        .fillColor(
                            "#173766"
                        )
                        .text(
                            "Notes",
                            pageLeft,
                            y
                        );

                    doc
                        .font(
                            "Helvetica"
                        )
                        .fontSize(8.5)
                        .fillColor(
                            "#555555"
                        )
                        .text(
                            invoice.notes,
                            pageLeft,
                            y + 16,
                            {
                                width:
                                    contentWidth,
                            }
                        );

                    y += 48;
                }

                /*
                 * FOOTER
                 */
                const footerY =
                    Math.min(
                        Math.max(
                            y + 10,
                            735
                        ),
                        785
                    );

                doc
                    .moveTo(
                        pageLeft,
                        footerY
                    )
                    .lineTo(
                        pageRight,
                        footerY
                    )
                    .lineWidth(
                        0.6
                    )
                    .strokeColor(
                        "#d9e0e8"
                    )
                    .stroke();

                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(7.5)
                    .fillColor(
                        "#777777"
                    )
                    .text(
                        "Thank you for your business.",
                        pageLeft,
                        footerY + 15
                    );

                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(7.5)
                    .fillColor(
                        "#777777"
                    )
                    .text(
                        "Powered by SaleVitals",
                        pageLeft,
                        footerY + 15,
                        {
                            width:
                                contentWidth,
                            align:
                                "right",
                        }
                    );

                /*
                 * FINISH PDF
                 */
                doc.end();

            } catch (error) {
                reject(error);
            }
        }
    );
}

exports.downloadInvoicePDF = async (
    req,
    res
) => {
    try {
        const context =
            await getContext(req);

        if (
            !requirePermission(
                context,
                "invoices.view",
                res
            )
        ) {
            return;
        }

        // =====================================================
        // IMPORTANT
        // ALWAYS USE WORKSPACE OWNER
        // =====================================================

        const workspaceOwnerId =
            context.workspaceOwnerId;

        const invoice =
            await Invoice.findOne({
                _id: req.params.invoiceId,
                userId: workspaceOwnerId,
            }).lean();

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message:
                    "Invoice not found.",
            });
        }

        // =====================================================
        // GET WORKSPACE OWNER
        // =====================================================

        const owner =
            await getWorkspaceOwner(
                workspaceOwnerId
            );

        if (!owner) {
            return res.status(404).json({
                success: false,
                message:
                    "Workspace owner account not found.",
            });
        }

        // =====================================================
        // RESOLVE CURRENCY ONLY FROM OWNER
        //
        // DO NOT TRUST OLD INVOICE CURRENCY
        // =====================================================

        const invoiceSettings =
            resolveCurrency({
                ...owner,

                countryCode:
                    owner?.countryCode ||
                    owner?.billingCountryCode ||
                    owner?.country_code ||
                    owner?.billing_country_code ||
                    owner?.country ||
                    owner?.billingCountry,

                country:
                    owner?.country ||
                    owner?.countryName ||
                    owner?.billingCountry ||
                    owner?.billing_country,

                currencyCode:
                    owner?.currencyCode ||
                    owner?.billingCurrencyCode ||
                    owner?.currency_code ||
                    owner?.billing_currency_code,

                currency:
                    owner?.currency ||
                    owner?.currencyName ||
                    owner?.billingCurrency ||
                    owner?.billing_currency,

                currencySymbol:
                    owner?.currencySymbol ||
                    owner?.billingCurrencySymbol,

                currencyLocale:
                    owner?.currencyLocale ||
                    owner?.billingCurrencyLocale,

                gstin:
                    owner?.gstin ||
                    owner?.gstNumber ||
                    owner?.gstNo ||
                    owner?.gst_number,
            });

        // =====================================================
        // PDF ONLY INVOICE
        //
        // Database invoice will NOT be changed.
        // =====================================================

        const pdfInvoice = {
            ...invoice,

            countryCode:
                invoiceSettings.countryCode,

            currencyCode:
                invoiceSettings.currencyCode,

            currencySymbol:
                invoiceSettings.currencySymbol,

            currencyLocale:
                invoiceSettings.locale,

            taxLabel:
                invoiceSettings.isIndia
                    ? "GST"
                    : "Tax",
        };

        // =====================================================
        // PDF OWNER
        //
        // Force INR for India workspace.
        // =====================================================

        const pdfOwner =
            invoiceSettings.isIndia
                ? {
                      ...owner,

                      countryCode: "IN",
                      country: "India",

                      currencyCode: "INR",
                      currencySymbol: "₹",
                      currencyLocale: "en-IN",

                      gstin:
                          owner?.gstin ||
                          owner?.gstNumber ||
                          owner?.gstNo ||
                          owner?.gst_number ||
                          "",
                  }
                : owner;

        // =====================================================
        // GENERATE PDF
        // =====================================================

        const pdf =
            await generateInvoicePDF(
                pdfInvoice,
                pdfOwner
            );

        // =====================================================
        // FILE NAME
        // =====================================================

        const filename =
            `${String(
                invoice.invoiceNumber ||
                    "invoice"
            ).replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            )}.pdf`;

        // =====================================================
        // RESPONSE
        // =====================================================

        res.status(200);

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Length",
            pdf.length
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        return res.end(pdf);

    } catch (error) {
        console.error(
            "DOWNLOAD INVOICE PDF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to generate invoice PDF.",
        });
    }
};

exports.sendInvoiceToWhatsApp =
    async (req, res) => {
        try {
            const context =
                await getContext(req);

            if (
                !requirePermission(
                    context,
                    "invoices.send",
                    res
                )
            ) {
                return;
            }

            const workspaceOwnerId =
                context.workspaceOwnerId;

            const invoiceId =
                req.params.invoiceId;

            const invoice =
                await Invoice.findOne({
                    _id: invoiceId,
                    userId:
                        workspaceOwnerId,
                });

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Invoice not found.",
                });
            }

            let phone = String(
                invoice.customerPhone ||
                    ""
            ).replace(/\D/g, "");

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Customer WhatsApp number is missing.",
                });
            }

            if (
                phone.length === 10 &&
                /^[6-9]/.test(phone)
            ) {
                phone = `91${phone}`;
            }

            const accessToken =
                process.env
                    .WHATSAPP_ACCESS_TOKEN ||
                process.env
                    .META_WHATSAPP_ACCESS_TOKEN ||
                process.env
                    .META_ACCESS_TOKEN ||
                "";

            const phoneNumberId =
                process.env
                    .WHATSAPP_PHONE_NUMBER_ID ||
                process.env
                    .META_WHATSAPP_PHONE_NUMBER_ID ||
                "";

            const graphVersion =
                process.env
                    .META_GRAPH_VERSION ||
                "v25.0";

            if (
                !accessToken ||
                !phoneNumberId
            ) {
                return res.status(503).json({
                    success: false,
                    message:
                        "WhatsApp Business API is not configured in backend .env.",
                });
            }

            const owner =
                await getWorkspaceOwner(
                    workspaceOwnerId
                );

            if (!owner) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Workspace owner account not found.",
                });
            }

            const pdfBuffer =
                await generateInvoicePDF(
                    invoice,
                    owner
                );

            const form =
                new FormData();

            form.append(
                "messaging_product",
                "whatsapp"
            );

            form.append(
                "file",
                pdfBuffer,
                {
                    filename: `${
                        invoice.invoiceNumber ||
                        "invoice"
                    }.pdf`,
                    contentType:
                        "application/pdf",
                }
            );

            const mediaUrl =
                `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/media`;

            const uploadResponse =
                await axios.post(
                    mediaUrl,
                    form,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                            ...form.getHeaders(),
                        },
                        maxContentLength:
                            Infinity,
                        maxBodyLength:
                            Infinity,
                    }
                );

            const mediaId =
                uploadResponse?.data?.id;
            
            console.log("WHATSAPP MEDIA UPLOAD:", {
                status: uploadResponse?.status,
                mediaId,
                data: uploadResponse?.data,
            });

            if (!mediaId) {
                throw new Error(
                    "WhatsApp PDF upload failed."
                );
            }

            const ownerBillingProfile =
                buildOwnerBillingProfile(
                    owner
                );

            const businessName =
                ownerBillingProfile.displayName ||
                ownerBillingProfile.clinicName ||
                ownerBillingProfile.businessName ||
                ownerBillingProfile.name ||
                "SaleVitals";

            const invoiceSettings =
                resolveCurrency({
                    ...owner,
                    countryCode:
                        invoice.countryCode ||
                        owner?.countryCode,
                    country:
                        invoice.country ||
                        owner?.country,
                    currencyCode:
                        invoice.currencyCode ||
                        owner?.currencyCode,
                    currencySymbol:
                        invoice.currencySymbol ||
                        owner?.currencySymbol,
                    currencyLocale:
                        invoice.currencyLocale ||
                        owner?.currencyLocale,
                });

            const invoiceForMessage = {
                ...(typeof invoice.toObject ===
                "function"
                    ? invoice.toObject()
                    : invoice),

                currencyCode:
                    invoice.currencyCode ||
                    invoiceSettings.currencyCode,

                currencySymbol:
                    invoice.currencySymbol ||
                    invoiceSettings.currencySymbol,

                currencyLocale:
                    invoice.currencyLocale ||
                    invoiceSettings.locale,
            };

            const paymentMode =
                invoice.paymentMode ||
                "Not specified";

            const message =
                req.body?.message ||
                `Hello ${
                    invoice.customerName ||
                    "Customer"
                }, 👋
Thank you for choosing ${businessName}.
Your invoice ${
                    invoice.invoiceNumber ||
                    ""
                } is ready. Please find the invoice PDF attached with this message.
Invoice Date: ${
                    invoice.invoiceDate
                        ? new Date(
                              invoice.invoiceDate
                          ).toLocaleDateString(
                              "en-IN",
                              {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                              }
                          )
                        : "-"
                }
Payment Mode: ${paymentMode}
${
    invoice.taxLabel ||
    invoiceSettings.taxLabel
}: ${formatInvoiceMoney(
                    invoice.taxAmount ??
                        invoice.gstAmount,
                    invoiceForMessage
                )}
Invoice Amount: ${formatInvoiceMoney(
                    invoice.total,
                    invoiceForMessage
                )}
If you have any questions regarding the invoice, please reply to this WhatsApp message.
Regards,
${businessName}`;

            const messagesUrl =
                `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

            const whatsappResponse =
                await axios.post(
                    messagesUrl,
                    {
                        messaging_product:
                            "whatsapp",

                        recipient_type:
                            "individual",

                        to: phone,

                        type: "document",

                        document: {
                            id: mediaId,
                            caption: message,
                            filename: `${
                                invoice.invoiceNumber ||
                                "invoice"
                            }.pdf`,
                        },
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                            "Content-Type":
                                "application/json",
                        },
                    }
                );

            const whatsappMessageId =
                whatsappResponse?.data
                    ?.messages?.[0]?.id ||
                "";
            
            console.log("WHATSAPP SEND RESPONSE:", {
                status: whatsappResponse?.status,
                data: whatsappResponse?.data,
                messageId: whatsappMessageId,
                phone,
            });

            invoice.status = "Sent";

            invoice.whatsappSentAt =
                new Date();

            invoice.whatsappMessageId =
                whatsappMessageId;

            invoice.billedBy =
                ownerBillingProfile;

            await invoice.save();

            return res.json({
                success: true,
                message:
                    "Invoice PDF sent successfully on WhatsApp.",
                whatsappNumber:
                    phone,
                whatsappMessageId,
            });
       } catch (error) {
            console.error(
                "SEND INVOICE WHATSAPP ERROR:",
                error.response?.data || error.message
            );

            return res.status(
                error.response?.status ||
                    500
            ).json({
                success: false,
                message:
                    error.response?.data
                        ?.error?.message ||
                    error.message ||
                    "Unable to send invoice on WhatsApp.",
            });
        }
    };