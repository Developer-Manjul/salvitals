const nodemailer = require("nodemailer");

const sendInvoiceEmail = async ({ user, order, paymentId }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const getNumber = (...values) => {
        for (const value of values) {
            if (
                value !== undefined &&
                value !== null &&
                value !== "" &&
                Number.isFinite(Number(value))
            ) {
                return Number(value);
            }
        }
        return 0;
    };

    const symbol = order.currency === "INR" ? "₹" : "$";

    const formatPrice = (amount) =>
        `${symbol}${Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const escapeHtml = (value) =>
        String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[char]);

    const ADDON_NAMES = {
        whatsapp_leads: "WhatsApp Lead Notifications",
        contacts: "Extra Contacts",
        ai_chat: "AI Chatbot",
        pharmacy_invoice: "Pharmacy Invoice",
    };

    const total = getNumber(
        order.amount,
        order.totalAmount,
        order.total,
        order.finalAmount,
        order.grandTotal,
        order.paidAmount,
        order.razorpayAmount ? Number(order.razorpayAmount) / 100 : 0
    );

    const setupFee = getNumber(
        order.setupFee,
        order.setupAmount,
        order.integrationFee,
        order.integrationAmount,
        order.setupIntegrationFee,
        order.onboardingFee
    );

    const tax = getNumber(
        order.tax,
        order.taxAmount,
        order.gst,
        order.gstAmount,
        order.GST
    );

    const purchasedAddons = Array.isArray(order.addons)
        ? order.addons
        : [];

    const addonRows = purchasedAddons
        .filter((addon) => addon && ADDON_NAMES[addon.addonType])
        .map((addon) => {
            const quantity = Math.max(
                1,
                Math.floor(getNumber(addon.quantity, 1))
            );

            const unitPrice = getNumber(addon.unitPrice);
            const amount = getNumber(
                addon.amount,
                unitPrice * quantity
            );

            return {
                name: ADDON_NAMES[addon.addonType],
                quantity,
                amount,
            };
        });

    const addonTotal = addonRows.reduce(
        (sum, addon) => sum + addon.amount,
        0
    );

    /*
     * Prefer the plan amount saved by the payment controller.
     * Fallback assumes total = plan + add-ons + setup + tax.
     */
    let planAmount = getNumber(
        order.planAmount,
        order.planPrice,
        order.plan_amount,
        order.baseAmount,
        order.basePrice,
        order.subscriptionAmount
    );

    if (planAmount <= 0) {
        planAmount = total - addonTotal - setupFee - tax;
    }

    if (planAmount < 0) {
        planAmount = 0;
    }

    const invoiceNumber =
        order.invoiceNumber ||
        order.invoice_number ||
        `SV-${new Date().getFullYear()}-${String(
            order._id || Date.now()
        ).slice(-6).toUpperCase()}`;

    const invoiceDate = new Date(
        order.updatedAt || order.createdAt || Date.now()
    ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const period = Math.max(
        1,
        Math.floor(getNumber(
            order.period,
            order.subscriptionPeriod,
            order.duration,
            1
        ))
    );

    const periodLabel = `${period} month${period > 1 ? "s" : ""}`;
    const websiteUrl = "https://salevitals.com";
    const logoUrl = `${websiteUrl}/logo.png`;

    const addonHtml = addonRows.map((addon) => `
        <tr>
            <td style="padding:10px 0;color:#374151;border-bottom:1px solid #dce9e9;">
                ${escapeHtml(addon.name)} × ${addon.quantity}
            </td>
            <td align="right" style="padding:10px 0;font-weight:600;color:#1f2937;border-bottom:1px solid #dce9e9;white-space:nowrap;">
                ${formatPrice(addon.amount)}
            </td>
        </tr>
    `).join("");

    console.log("========== INVOICE DEBUG ==========");
    console.log("User Email:", user.email);
    console.log("Order ID:", order._id);
    console.log("Invoice Number:", invoiceNumber);
    console.log("Plan Amount:", planAmount);
    console.log("Add-ons:", addonRows);
    console.log("Add-on Total:", addonTotal);
    console.log("Setup Fee:", setupFee);
    console.log("Tax:", tax);
    console.log("Total:", total);
    console.log("===================================");

    await transporter.sendMail({
        from: process.env.SMTP_FROM || `"SaleVitals" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Payment Successful - Invoice ${invoiceNumber}`,

        html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f7f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f8;padding:30px 12px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#fff;border:1px solid #d9e0e3;border-radius:14px;overflow:hidden;">

<tr>
<td style="padding:22px 30px;border-bottom:1px solid #e5e7eb;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td><a href="${websiteUrl}"><img src="${logoUrl}" alt="SaleVitals" style="display:block;width:150px;max-width:100%;height:auto;border:0;"></a></td>
<td align="right"><a href="${websiteUrl}" style="color:#00656A;text-decoration:none;font-weight:bold;">Visit Website →</a></td>
</tr></table>
</td>
</tr>

<tr><td style="padding:30px;">
<h1 style="margin:0 0 18px;font-size:26px;">Payment received successfully 🎉</h1>
<p>Hi ${escapeHtml(user.name || "Customer")},</p>
<p style="color:#4b5563;line-height:1.7;">Thank you for choosing SaleVitals CRM. Your payment has been received successfully.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#e6f4f4;border-left:5px solid #00656A;border-radius:8px;margin:22px 0;">
<tr><td style="padding:18px;">
<strong style="color:#00656A;font-size:17px;">Your CRM activation</strong>
<p style="margin:8px 0 0;line-height:1.7;color:#374151;">Your SaleVitals CRM activation and onboarding will be handled by our team.</p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dce3e6;border-radius:10px;">
<tr><td style="padding:20px;border-bottom:1px solid #e5e7eb;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="font-size:21px;font-weight:bold;">Invoice Details</td>
<td align="right" style="color:#6b7280;">${escapeHtml(invoiceDate)}</td>
</tr>
</table>
</td></tr>

<tr><td style="padding:0 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:12px 0;border-bottom:1px solid #edf0f2;color:#4b5563;">Invoice Number</td>
<td align="right" style="padding:12px 0;border-bottom:1px solid #edf0f2;font-weight:bold;">${escapeHtml(invoiceNumber)}</td>
</tr>
<tr>
<td style="padding:12px 0;border-bottom:1px solid #edf0f2;color:#4b5563;">Plan</td>
<td align="right" style="padding:12px 0;border-bottom:1px solid #edf0f2;font-weight:bold;">${escapeHtml(order.planName || order.planId || "Plan")}</td>
</tr>
<tr>
<td style="padding:12px 0;border-bottom:1px solid #edf0f2;color:#4b5563;">Subscription Period</td>
<td align="right" style="padding:12px 0;border-bottom:1px solid #edf0f2;font-weight:bold;">${periodLabel}</td>
</tr>
<tr>
<td style="padding:12px 0;color:#4b5563;">Payment ID</td>
<td align="right" style="padding:12px 0;font-weight:bold;word-break:break-all;">${escapeHtml(paymentId || order.razorpayPaymentId || "-")}</td>
</tr>
</table>
</td></tr>

<tr><td style="background:#f6fbfb;padding:15px 20px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:10px 0;border-bottom:1px solid #dce9e9;">Plan Amount</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid #dce9e9;font-weight:bold;">${formatPrice(planAmount)}</td>
</tr>

${addonHtml}

<tr>
<td style="padding:10px 0;border-bottom:1px solid #dce9e9;">Setup &amp; Integration</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid #dce9e9;font-weight:bold;">${formatPrice(setupFee)}</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #dce9e9;">Tax</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid #dce9e9;font-weight:bold;">${formatPrice(tax)}</td>
</tr>
<tr>
<td style="padding:22px 0 5px;font-size:22px;font-weight:bold;">Total Paid</td>
<td align="right" style="padding:22px 0 5px;font-size:25px;font-weight:bold;color:#00656A;">${formatPrice(total)}</td>
</tr>
</table>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;background:#eef8f8;border-radius:8px;">
<tr><td style="padding:18px;">
<strong style="color:#00656A;">🌱 Welcome to the SaleVitals Family!</strong>
<p style="margin-bottom:0;color:#4b5563;line-height:1.6;">If you have any questions, feel free to reply to this email.</p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding:24px;text-align:center;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;">
© ${new Date().getFullYear()} SaleVitals. All rights reserved.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
        `,
    });
};

module.exports = sendInvoiceEmail;
