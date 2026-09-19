const jwt = require("jsonwebtoken");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const FormData = require("form-data");

const Invoice = require("../models/Invoice");
const User = require("../models/User");


/* =====================================================
   GET USER ID
===================================================== */

function getUserId(req) {

    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    try {

        const decoded = jwt.verify(
            authorization.slice(7),
            process.env.JWT_SECRET
        );

        return (
            decoded.id ||
            decoded._id ||
            decoded.userId ||
            null
        );

    } catch (error) {

        console.error(
            "INVOICE JWT ERROR:",
            error.message
        );

        return null;
    }
}


/* =====================================================
   GET ALL INVOICES
===================================================== */

exports.getInvoices = async (req, res) => {

    try {

        const userId = getUserId(req);

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }


        const invoices =
            await Invoice.find({
                userId,
            })
            .sort({
                createdAt: -1,
            })
            .lean();


        return res.json({

            success: true,

            invoices,

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


/* =====================================================
   CREATE INVOICE
===================================================== */

exports.createInvoice = async (req, res) => {

    try {

        const userId = getUserId(req);

        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required",

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

            notes,

            billedBy,

            items,

            subtotal,
            gstAmount,
            total,

            status,

        } = req.body;


        /* =========================================
           VALIDATION
        ========================================= */

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


        /* =========================================
           CREATE
        ========================================= */

        const invoice =
            await Invoice.create({

                userId,

                invoiceNumber:
                    invoiceNumber ||
                    `INV-${Date.now()}`,

                invoiceDate:
                    invoiceDate
                        ? new Date(invoiceDate)
                        : new Date(),

                customerId:
                    customerId || "",

                customerName:
                    String(customerName).trim(),

                customerEmail:
                    customerEmail || "",

                customerPhone:
                    customerPhone || "",

                customerAddress:
                    customerAddress || "",

                notes:
                    notes || "",

                billedBy:
                    billedBy || {},

                items:
                    items.map((item) => ({

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
                            Number(item.gst) || 0,

                        baseAmount:
                            Number(
                                item.baseAmount
                            ) || 0,

                        gstAmount:
                            Number(
                                item.gstAmount
                            ) || 0,

                        total:
                            Number(item.total) || 0,

                    })),

                subtotal:
                    Number(subtotal) || 0,

                gstAmount:
                    Number(gstAmount) || 0,

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


/* =====================================================
   DELETE INVOICE
===================================================== */

exports.deleteInvoice = async (req, res) => {

    try {

        const userId = getUserId(req);

        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required",

            });
        }


        const invoiceId =
            req.params.invoiceId;


        const invoice =
            await Invoice.findOne({

                _id: invoiceId,

                userId,

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

            userId,

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


/* =====================================================
   GENERATE PDF
===================================================== */

function generateInvoicePDF(
    invoice,
    user
) {

    return new Promise(
        (resolve, reject) => {

            try {

                const doc =
                    new PDFDocument({

                        size: "A4",

                        margin: 45,

                    });


                const chunks = [];


                doc.on(
                    "data",
                    (chunk) => {

                        chunks.push(chunk);

                    }
                );


                doc.on(
                    "end",
                    () => {

                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        );

                    }
                );


                doc.on(
                    "error",
                    reject
                );


                const businessName =
                    invoice.billedBy?.displayName ||
                    invoice.billedBy?.businessName ||
                    user?.displayName ||
                    user?.clinicName ||
                    user?.businessName ||
                    user?.name ||
                    "SaleVitals";


                const businessPhone =
                    invoice.billedBy?.phone ||
                    user?.phone ||
                    "";


                const businessEmail =
                    invoice.billedBy?.email ||
                    user?.email ||
                    "";


                const businessAddress =
                    invoice.billedBy?.address ||
                    user?.address ||
                    "";


                const gstin =
                    invoice.billedBy?.gstin ||
                    user?.gstin ||
                    "";


                const money = (value) => {

                    return `₹${Number(
                        value || 0
                    ).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}`;

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


                /* =================================
                   HEADER
                ================================= */

                doc
                    .fontSize(22)
                    .font("Helvetica-Bold")
                    .fillColor("#173766")
                    .text(
                        businessName
                    );


                doc
                    .fontSize(9)
                    .font("Helvetica")
                    .fillColor("#666666")
                    .text(
                        "TAX INVOICE"
                    );


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

                    doc.text(
                        businessAddress
                    );

                }


                if (gstin) {

                    doc.text(
                        `GSTIN: ${gstin}`
                    );

                }


                doc.moveDown();


                /* =================================
                   INVOICE DETAILS
                ================================= */

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


                doc.moveDown();


                /* =================================
                   CUSTOMER
                ================================= */

                doc
                    .fontSize(11)
                    .font("Helvetica-Bold")
                    .text(
                        "Bill To"
                    );


                doc
                    .fontSize(10)
                    .font("Helvetica")
                    .text(
                        customerName
                    );


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


                /* =================================
                   ITEMS HEADER
                ================================= */

                let y = doc.y;


                doc
                    .rect(
                        45,
                        y,
                        502,
                        28
                    )
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


                /* =================================
                   ITEMS
                ================================= */

                const items =
                    Array.isArray(
                        invoice.items
                    )
                        ? invoice.items
                        : [];


                items.forEach(
                    (item) => {

                        const serviceName =
                            item.serviceName ||
                            "Service";


                        const quantity =
                            Number(
                                item.quantity
                            ) || 1;


                        const gst =
                            Number(
                                item.gst
                            ) || 0;


                        const amount =
                            Number(
                                item.total
                            ) || 0;


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
                            String(
                                quantity
                            ),
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
                            .moveTo(
                                45,
                                y - 8
                            )
                            .lineTo(
                                547,
                                y - 8
                            )
                            .strokeColor(
                                "#dddddd"
                            )
                            .stroke();

                    }
                );


                /* =================================
                   TOTALS
                ================================= */

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


                /* =================================
                   NOTES
                ================================= */

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


                /* =================================
                   FOOTER
                ================================= */

                doc
                    .fontSize(8)
                    .fillColor("#777777")
                    .text(
                        "This is a computer generated invoice.",
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

        }
    );
}


/* =====================================================
   SEND INVOICE ON WHATSAPP
===================================================== */

exports.sendInvoiceToWhatsApp =
    async (req, res) => {

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


            const invoiceId =
                req.params.invoiceId;


            const invoice =
                await Invoice.findOne({

                    _id: invoiceId,

                    userId,

                });


            if (!invoice) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Invoice not found.",

                });

            }


            /* =================================
               PHONE
            ================================= */

            let phone =
                String(
                    invoice.customerPhone || ""
                ).replace(
                    /\D/g,
                    ""
                );


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

                phone =
                    `91${phone}`;

            }


            /* =================================
               WHATSAPP CONFIG
            ================================= */

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
                "v23.0";


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


            /* =================================
               USER
            ================================= */

            const user =
                await User.findById(
                    userId
                ).lean();


            /* =================================
               PDF
            ================================= */

            const pdfBuffer =
                await generateInvoicePDF(
                    invoice,
                    user
                );


            /* =================================
               UPLOAD PDF
            ================================= */

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
                        `${invoice.invoiceNumber || "invoice"}.pdf`,

                    contentType:
                        "application/pdf",
                }
            );


            const uploadResponse =
                await axios.post(

                    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/media`,

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
                uploadResponse
                    ?.data
                    ?.id;


            if (!mediaId) {

                throw new Error(
                    "WhatsApp PDF upload failed."
                );

            }


            /* =================================
               MESSAGE
            ================================= */

            const businessName =
                invoice.billedBy?.displayName ||
                invoice.billedBy?.businessName ||
                user?.displayName ||
                user?.clinicName ||
                user?.businessName ||
                user?.name ||
                "SaleVitals";


            const message =
                req.body?.message ||
                `Hello ${invoice.customerName || "Customer"}, 👋

Thank you for choosing ${businessName}.

Your invoice ${invoice.invoiceNumber || ""} is ready. Please find the invoice PDF attached with this message.

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


            /* =================================
               SEND WHATSAPP
            ================================= */

            const whatsappResponse =
                await axios.post(

                    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,

                    {

                        messaging_product:
                            "whatsapp",

                        recipient_type:
                            "individual",

                        to: phone,

                        type:
                            "document",

                        document: {

                            id: mediaId,

                            caption:
                                message,

                            filename:
                                `${invoice.invoiceNumber || "invoice"}.pdf`,

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


            /* =================================
               SAVE WHATSAPP STATUS
            ================================= */

            invoice.status =
                "Sent";


            invoice.whatsappSentAt =
                new Date();


            invoice.whatsappMessageId =
                whatsappResponse
                    ?.data
                    ?.messages?.[0]
                    ?.id || "";


            await invoice.save();


            return res.json({

                success: true,

                message:
                    "Invoice PDF sent successfully on WhatsApp.",

                whatsappNumber:
                    phone,

                whatsappMessageId:
                    invoice.whatsappMessageId,

            });

        } catch (error) {

            console.error(
                "SEND INVOICE WHATSAPP ERROR:",
                error.response?.data ||
                error.message ||
                error
            );


            return res.status(
                error.response?.status || 500
            ).json({

                success: false,

                message:
                    error.response?.data?.error?.message ||
                    error.message ||
                    "Unable to send invoice on WhatsApp.",

            });

        }
    };