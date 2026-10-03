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
    };
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
              customerName: String(customerName || "").trim(),
              customerPhone,
          }
        : null;

    if (patientFilter) {
        const existingPatient = await Invoice.findOne({
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

    return allowed.includes(paymentMode) ? paymentMode : "";
};

const normalizeItems = (items) => {
    return items.map((item) => ({
        serviceId: item.serviceId || "",
        serviceName: item.serviceName || "Service",
        quantity: Number(item.quantity) || 1,
        cost: Number(item.cost) || 0,
        gst: Number(item.gst) || 0,
        baseAmount: Number(item.baseAmount) || 0,
        gstAmount: Number(item.gstAmount) || 0,
        total: Number(item.total) || 0,
    }));
};

exports.getInvoices = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requirePermission(context, "invoices.view", res)) {
            return;
        }

        const workspaceOwnerId = context.workspaceOwnerId;

        const owner = await getWorkspaceOwner(workspaceOwnerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Workspace owner account not found.",
            });
        }

        const ownerBillingProfile =
            buildOwnerBillingProfile(owner);

        const invoices = await Invoice.find({
            userId: workspaceOwnerId,
        })
            .sort({
                createdAt: -1,
            })
            .lean();

        const normalizedInvoices = invoices.map((invoice) => ({
            ...invoice,
            billedBy: ownerBillingProfile,
            paymentMode: invoice.paymentMode || "",
        }));

        return res.json({
            success: true,
            invoices: normalizedInvoices,
        });
    } catch (error) {
        console.error("GET INVOICES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load invoices.",
        });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requirePermission(context, "invoices.create", res)) {
            return;
        }

        const workspaceOwnerId = context.workspaceOwnerId;

        const owner = await getWorkspaceOwner(workspaceOwnerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Workspace owner account not found.",
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
            total,
            status,
        } = req.body;

        if (!customerName || !String(customerName).trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required.",
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one invoice item is required.",
            });
        }

        const patientId = await resolvePatientId({
            workspaceOwnerId,
            customerId,
            customerName,
            customerPhone,
        });

        const invoice = await Invoice.create({
            userId: workspaceOwnerId,

            invoiceNumber:
                invoiceNumber || `INV-${Date.now()}`,

            invoiceDate: invoiceDate
                ? new Date(invoiceDate)
                : new Date(),

            customerId: customerId || "",

            patientId,

            customerName: String(customerName).trim(),

            customerEmail: customerEmail || "",

            customerPhone: customerPhone || "",

            customerAddress: customerAddress || "",

            paymentMode: normalizePaymentMode(paymentMode),

            notes: notes || "",

            billedBy: ownerBillingProfile,

            items: normalizeItems(items),

            subtotal: Number(subtotal) || 0,

            gstAmount: Number(gstAmount) || 0,

            total: Number(total) || 0,

            status: status || "Draft",
        });

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully.",
            invoice,
        });
    } catch (error) {
        console.error("CREATE INVOICE ERROR:", error);

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

        if (!requirePermission(context, "invoices.edit", res)) {
            return;
        }

        const workspaceOwnerId = context.workspaceOwnerId;

        const owner = await getWorkspaceOwner(workspaceOwnerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Workspace owner account not found.",
            });
        }

        const ownerBillingProfile =
            buildOwnerBillingProfile(owner);

        const invoice = await Invoice.findOne({
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
            total,
            status,
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

        const nextCustomerId = customerId || "";

        const nextCustomerName =
            String(customerName).trim();

        const nextCustomerPhone =
            customerPhone || "";

        const samePatient =
            String(invoice.customerId || "") ===
                String(nextCustomerId) &&
            invoice.customerName ===
                nextCustomerName &&
            invoice.customerPhone ===
                nextCustomerPhone;

        const patientId =
            samePatient && invoice.patientId
                ? invoice.patientId
                : await resolvePatientId({
                      workspaceOwnerId,
                      customerId: nextCustomerId,
                      customerName: nextCustomerName,
                      customerPhone: nextCustomerPhone,
                  });

        Object.assign(invoice, {
            invoiceNumber:
                invoiceNumber ||
                invoice.invoiceNumber,

            invoiceDate: invoiceDate
                ? new Date(invoiceDate)
                : invoice.invoiceDate,

            customerId: nextCustomerId,

            patientId,

            customerName: nextCustomerName,

            customerEmail: customerEmail || "",

            customerPhone: nextCustomerPhone,

            customerAddress:
                customerAddress || "",

            paymentMode: normalizePaymentMode(
                paymentMode
            ),

            notes: notes || "",

            billedBy: ownerBillingProfile,

            items: normalizeItems(items),

            subtotal: Number(subtotal) || 0,

            gstAmount: Number(gstAmount) || 0,

            total: Number(total) || 0,

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
        console.error("UPDATE INVOICE ERROR:", error);

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
        const context = await getContext(req);

        if (!requirePermission(context, "invoices.delete", res)) {
            return;
        }

        const workspaceOwnerId =
            context.workspaceOwnerId;

        const invoiceId =
            req.params.invoiceId;

        const invoice = await Invoice.findOne({
            _id: invoiceId,
            userId: workspaceOwnerId,
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found.",
            });
        }

        await Invoice.deleteOne({
            _id: invoiceId,
            userId: workspaceOwnerId,
        });

        return res.json({
            success: true,
            message: "Invoice deleted successfully.",
        });
    } catch (error) {
        console.error("DELETE INVOICE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete invoice.",
        });
    }
};

function generateInvoicePDF(invoice, owner) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 45,
                autoFirstPage: true,
            });

            const chunks = [];

            doc.on("data", (chunk) => {
                chunks.push(chunk);
            });

            doc.on("end", () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on("error", reject);

            const billingProfile =
                buildOwnerBillingProfile(owner);

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

            const gstin =
                billingProfile.gstin ||
                billingProfile.gstNumber ||
                billingProfile.gstNo ||
                "";

            const paymentMode =
                invoice.paymentMode ||
                "";

            const money = (value) => {
                return `₹${Number(
                    value || 0
                ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
            };

            const customerName =
                invoice.customerName ||
                "Customer";

            const invoiceNumber =
                invoice.invoiceNumber ||
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

            doc
                .fontSize(20)
                .font("Helvetica-Bold")
                .fillColor("#173766")
                .text(businessName);

            doc
                .fontSize(8)
                .font("Helvetica")
                .fillColor("#666666")
                .text("TAX INVOICE");

            if (businessPhone) {
                doc.text(
                    `Phone: ${businessPhone}`
                );
            }

            if (businessEmail) {
                doc.text(
                    `Email: ${businessEmail}`
                );
            }

            if (businessAddress) {
                doc.text(businessAddress);
            }

            if (gstin) {
                doc.text(`GSTIN: ${gstin}`);
            }

            doc.moveDown();

            doc
                .fillColor("#000000")
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(
                    `Invoice Number: ${invoiceNumber}`
                );

            doc
                .font("Helvetica")
                .text(
                    `Invoice Date: ${invoiceDate}`
                );

            if (invoice.patientId) {
                doc.text(
                    `Patient ID: ${invoice.patientId}`
                );
            }

            doc.moveDown();

            doc
                .fontSize(11)
                .font("Helvetica-Bold")
                .text("Bill To");

            doc
                .fontSize(10)
                .font("Helvetica")
                .text(customerName);

            if (paymentMode) {
                doc.text(
                    `Payment Mode: ${paymentMode}`
                );
            }

            if (invoice.customerPhone) {
                doc.text(
                    `Phone: ${invoice.customerPhone}`
                );
            }

            if (invoice.customerEmail) {
                doc.text(
                    `Email: ${invoice.customerEmail}`
                );
            }

            if (invoice.customerAddress) {
                doc.text(
                    invoice.customerAddress
                );
            }

            doc.moveDown();

            let y = doc.y;

            doc
                .rect(45, y, 502, 28)
                .fill("#173766");

            doc
                .fillColor("#ffffff")
                .fontSize(9)
                .font("Helvetica-Bold");

            doc.text(
                "Service",
                55,
                y + 9
            );

            doc.text(
                "Qty",
                330,
                y + 9
            );

            doc.text(
                "GST",
                385,
                y + 9
            );

            doc.text(
                "Amount",
                455,
                y + 9
            );

            y += 38;

            const items =
                Array.isArray(invoice.items)
                    ? invoice.items
                    : [];

            items.forEach((item) => {
                const serviceName =
                    item.serviceName ||
                    "Service";

                const quantity =
                    Number(item.quantity) ||
                    1;

                const gst =
                    Number(item.gst) || 0;

                const amount =
                    Number(item.total) || 0;

                doc
                    .fillColor("#000000")
                    .fontSize(9)
                    .font("Helvetica")
                    .text(
                        serviceName,
                        55,
                        y,
                        {
                            width: 250,
                        }
                    );

                doc.text(
                    String(quantity),
                    330,
                    y
                );

                doc.text(
                    `${gst}%`,
                    385,
                    y
                );

                doc.text(
                    money(amount),
                    455,
                    y
                );

                y += 28;

                doc
                    .moveTo(45, y - 8)
                    .lineTo(547, y - 8)
                    .strokeColor("#dddddd")
                    .stroke();
            });

            y += 15;

            doc
                .fontSize(10)
                .font("Helvetica")
                .fillColor("#000000")
                .text(
                    `Subtotal: ${money(
                        invoice.subtotal
                    )}`,
                    350,
                    y
                );

            y += 20;

            doc.text(
                `GST: ${money(
                    invoice.gstAmount
                )}`,
                350,
                y
            );

            y += 28;

            doc
                .fontSize(13)
                .font("Helvetica-Bold")
                .text(
                    `Grand Total: ${money(
                        invoice.total
                    )}`,
                    330,
                    y
                );

            if (invoice.notes) {
                y += 45;

                doc
                    .fontSize(10)
                    .font("Helvetica-Bold")
                    .text(
                        "Notes",
                        45,
                        y
                    );

                y += 18;

                doc
                    .fontSize(9)
                    .font("Helvetica")
                    .text(
                        invoice.notes,
                        45,
                        y,
                        {
                            width: 500,
                        }
                    );
            }

            doc
                .fontSize(8)
                .fillColor("#777777")
                .text(
                    "Powered by SaleVitals",
                    45,
                    760,
                    {
                        align: "center",
                        width: 502,
                    }
                );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

exports.downloadInvoicePDF = async (req, res) => {
    try {
        const context = await getContext(req);

        if (!requirePermission(context, "invoices.view", res)) {
            return;
        }

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
                message: "Invoice not found.",
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

        const pdf =
            await generateInvoicePDF(
                invoice,
                owner
            );

        const filename =
            `${String(
                invoice.invoiceNumber ||
                    "invoice"
            ).replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            )}.pdf`;

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

exports.sendInvoiceToWhatsApp = async (
    req,
    res
) => {
    try {
        const context = await getContext(req);

        if (!requirePermission(context, "invoices.send", res)) {
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
                message: "Invoice not found.",
            });
        }

        let phone = String(
            invoice.customerPhone || ""
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
            process.env.WHATSAPP_ACCESS_TOKEN ||
            process.env.META_WHATSAPP_ACCESS_TOKEN ||
            process.env.META_ACCESS_TOKEN ||
            "";

        const phoneNumberId =
            process.env.WHATSAPP_PHONE_NUMBER_ID ||
            process.env.META_WHATSAPP_PHONE_NUMBER_ID ||
            "";

        const graphVersion =
            process.env.META_GRAPH_VERSION ||
            "v25.0";

        if (!accessToken || !phoneNumberId) {
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
                filename:
                    `${
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

        if (!mediaId) {
            throw new Error(
                "WhatsApp PDF upload failed."
            );
        }

        const ownerBillingProfile =
            buildOwnerBillingProfile(owner);

        const businessName =
            ownerBillingProfile.displayName ||
            ownerBillingProfile.clinicName ||
            ownerBillingProfile.businessName ||
            ownerBillingProfile.name ||
            "SaleVitals";

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

Invoice Amount: ₹${Number(
                invoice.total || 0
            ).toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
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

                        filename:
                            `${
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
            whatsappResponse
                ?.data
                ?.messages?.[0]
                ?.id || "";

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
            whatsappNumber: phone,
            whatsappMessageId,
        });
    } catch (error) {
        console.error(
            "SEND INVOICE WHATSAPP ERROR:",
            error
        );

        return res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message:
                error.response?.data?.error
                    ?.message ||
                error.message ||
                "Unable to send invoice on WhatsApp.",
        });
    }
};