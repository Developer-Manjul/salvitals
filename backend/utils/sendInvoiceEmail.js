const nodemailer = require("nodemailer");


const sendInvoiceEmail = async ({
    user,
    order,
    paymentId,
}) => {

    /* =========================================
       SMTP TRANSPORTER
    ========================================= */

    const transporter =
        nodemailer.createTransport({

            host:
                process.env.SMTP_HOST,

            port:
                Number(
                    process.env.SMTP_PORT || 587
                ),

            secure:
                process.env.SMTP_SECURE === "true",

            auth: {

                user:
                    process.env.SMTP_USER,

                pass:
                    process.env.SMTP_PASS,

            },

        });


    /* =========================================
       HELPERS
    ========================================= */

    const getNumber =
        (...values) => {

            for (
                const value
                of values
            ) {

                if (
                    value !== undefined &&
                    value !== null &&
                    value !== "" &&
                    !isNaN(
                        Number(value)
                    )
                ) {

                    return Number(value);

                }

            }

            return 0;

        };


    /* =========================================
       CURRENCY
    ========================================= */

    const symbol =
        order.currency === "INR"
            ? "₹"
            : "$";


    /* =========================================
       TOTAL AMOUNT

       Multiple possible field names check
    ========================================= */

    const total =
        getNumber(

            order.amount,

            order.totalAmount,

            order.total,

            order.finalAmount,

            order.grandTotal,

            order.paidAmount,

            order.razorpayAmount
                ? Number(
                    order.razorpayAmount
                ) / 100
                : 0

        );


    /* =========================================
       SETUP / INTEGRATION FEE
    ========================================= */

    const setupFee =
        getNumber(

            order.setupFee,

            order.setupAmount,

            order.integrationFee,

            order.integrationAmount,

            order.setupIntegrationFee,

            order.onboardingFee

        );


    /* =========================================
       TAX
    ========================================= */

    const tax =
        getNumber(

            order.tax,

            order.taxAmount,

            order.gst,

            order.gstAmount,

            order.GST

        );


    /* =========================================
       PLAN AMOUNT

       If database does not contain separate
       plan amount, calculate from total.
    ========================================= */

    let planAmount =
        getNumber(

            order.planAmount,

            order.planPrice,

            order.plan_amount,

            order.baseAmount,

            order.basePrice,

            order.price,

            order.subscriptionAmount

        );


    /*
       FALLBACK:

       If no plan amount is stored,
       Total = Plan + Setup + Tax
    */

    if (
        planAmount <= 0
    ) {

        planAmount =
            total -
            setupFee -
            tax;

    }


    /*
       Safety fallback
    */

    if (
        planAmount < 0
    ) {

        planAmount = total;

    }


    /* =========================================
       INVOICE NUMBER

       Prefer saved DB invoice number.
    ========================================= */

    const invoiceNumber =
        order.invoiceNumber ||
        order.invoice_number ||
        `SV-${new Date().getFullYear()}-${String(
            order._id || Date.now()
        )
            .slice(-6)
            .toUpperCase()}`;


    /* =========================================
       FORMAT PRICE
    ========================================= */

    const formatPrice =
        (amount) =>
            `${symbol}${Number(
                amount || 0
            ).toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            )}`;


    /* =========================================
       INVOICE DATE
    ========================================= */

    const invoiceDate =
        new Date(

            order.updatedAt ||
            order.createdAt ||
            Date.now()

        ).toLocaleDateString(

            "en-IN",

            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }

        );


    /* =========================================
       PERIOD
    ========================================= */

    const period =
        getNumber(

            order.period,

            order.subscriptionPeriod,

            order.duration,

            1

        );


    const periodLabel =
        `${period} month${
            period > 1
                ? "s"
                : ""
        }`;


    /* =========================================
       WEBSITE
    ========================================= */

    const websiteUrl =
        "https://salevitals.com";


    /* =========================================
       LOGO
    ========================================= */

    const logoUrl =
        `${websiteUrl}/logo.png`;


    /* =========================================
       DEBUG
    ========================================= */

    console.log(
        "========== INVOICE DEBUG =========="
    );

    console.log(
        "User Email:",
        user.email
    );

    console.log(
        "Order ID:",
        order._id
    );

    console.log(
        "Invoice Number:",
        invoiceNumber
    );

    console.log(
        "Plan Amount:",
        planAmount
    );

    console.log(
        "Setup Fee:",
        setupFee
    );

    console.log(
        "Tax:",
        tax
    );

    console.log(
        "Total:",
        total
    );

    console.log(
        "==================================="
    );


    /* =========================================
       SEND EMAIL
    ========================================= */

    await transporter.sendMail({

        from:

            process.env.SMTP_FROM ||

            `"SaleVitals" <${process.env.SMTP_USER}>`,


        to:
            user.email,


        subject:
            `Payment Successful - Invoice ${invoiceNumber}`,


        html:

            `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

</head>


<body
    style="
        margin:0;
        padding:0;
        background:#f4f7f8;
        font-family:Arial, Helvetica, sans-serif;
        color:#1f2937;
    "
>


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background:#f4f7f8;
        padding:35px 15px;
    "
>

<tr>

<td align="center">


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width:720px;
        background:#ffffff;
        border:1px solid #d9e0e3;
        border-radius:16px;
        overflow:hidden;
    "
>


<!-- HEADER -->

<tr>

<td
    style="
        background:#ffffff;
        padding:22px 40px;
        border-bottom:1px solid #e5e7eb;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>

<tr>


<td
    align="left"
    valign="middle"
>

<a
    href="${websiteUrl}"
    target="_blank"
    style="
        text-decoration:none;
    "
>

<img
    src="${logoUrl}"
    alt="SaleVitals"
    style="
        display:block;
        max-width:170px;
        width:170px;
        height:auto;
        border:0;
    "
>

</a>

</td>


<td
    align="right"
    valign="middle"
>

<a
    href="${websiteUrl}"
    target="_blank"
    style="
        display:inline-block;
        padding:13px 24px;
        border:1px solid #00656A;
        border-radius:8px;
        color:#00656A;
        font-size:16px;
        font-weight:700;
        text-decoration:none;
    "
>

Visit Website →

</a>

</td>


</tr>

</table>

</td>

</tr>


<!-- CONTENT -->

<tr>

<td
    style="
        padding:32px 40px 25px;
    "
>


<h1
    style="
        margin:0 0 20px;
        font-size:28px;
        line-height:1.35;
        color:#1f2937;
    "
>

Payment received successfully 🎉

</h1>


<p
    style="
        margin:0 0 15px;
        font-size:16px;
        color:#374151;
    "
>

Hi ${user.name || "Customer"},

</p>


<p
    style="
        margin:0 0 28px;
        font-size:16px;
        line-height:1.7;
        color:#4b5563;
    "
>

Thank you for choosing SaleVitals CRM.
Your payment has been received successfully.

</p>


<!-- ACTIVATION -->

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background:#e6f4f4;
        border-left:5px solid #00656A;
        border-radius:10px;
        margin-bottom:25px;
    "
>

<tr>

<td
    style="
        padding:20px 22px;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>

<tr>


<td
    valign="top"
    width="55"
>

<div
    style="
        width:45px;
        height:45px;
        border-radius:50%;
        background:#00656A;
        color:#ffffff;
        text-align:center;
        line-height:45px;
        font-size:22px;
    "
>

◷

</div>

</td>


<td valign="top">


<div
    style="
        font-size:18px;
        font-weight:700;
        color:#00656A;
        margin-bottom:7px;
    "
>

Your CRM activation

</div>


<div
    style="
        font-size:15px;
        line-height:1.7;
        color:#374151;
    "
>

Your SaleVitals CRM will be activated soon.
Our team will connect with you soon to complete your onboarding,
setup and integration.

</div>


</td>


</tr>

</table>

</td>

</tr>

</table>


<!-- INVOICE -->

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        border:1px solid #dce3e6;
        border-radius:12px;
        overflow:hidden;
    "
>


<!-- INVOICE HEADER -->

<tr>

<td
    style="
        padding:22px 22px 15px;
        border-bottom:1px solid #e5e7eb;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>

<tr>


<td
    style="
        font-size:22px;
        font-weight:700;
        color:#1f2937;
    "
>

Invoice Details

</td>


<td
    align="right"
    style="
        font-size:15px;
        color:#6b7280;
    "
>

Invoice Date:
${invoiceDate}

</td>


</tr>

</table>

</td>

</tr>


<!-- BASIC DETAILS -->

<tr>

<td
    style="
        padding:0 22px;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>


<tr>

<td
    style="
        padding:14px 0;
        color:#4b5563;
        border-bottom:1px solid #edf0f2;
    "
>

Invoice Number

</td>


<td
    align="right"
    style="
        padding:14px 0;
        font-weight:600;
        color:#1f2937;
        border-bottom:1px solid #edf0f2;
    "
>

${invoiceNumber}

</td>

</tr>


<tr>

<td
    style="
        padding:14px 0;
        color:#4b5563;
        border-bottom:1px solid #edf0f2;
    "
>

Plan

</td>


<td
    align="right"
    style="
        padding:14px 0;
        font-weight:600;
        color:#1f2937;
        border-bottom:1px solid #edf0f2;
    "
>

${order.planName || order.planId || "Plan"}

</td>

</tr>


<tr>

<td
    style="
        padding:14px 0;
        color:#4b5563;
        border-bottom:1px solid #edf0f2;
    "
>

Subscription Period

</td>


<td
    align="right"
    style="
        padding:14px 0;
        font-weight:600;
        color:#1f2937;
        border-bottom:1px solid #edf0f2;
    "
>

${periodLabel}

</td>

</tr>


<tr>

<td
    style="
        padding:14px 0;
        color:#4b5563;
    "
>

Payment ID

</td>


<td
    align="right"
    style="
        padding:14px 0;
        font-weight:600;
        color:#1f2937;
        word-break:break-all;
    "
>

${paymentId || "-"}

</td>

</tr>


</table>

</td>

</tr>


<!-- PRICE DETAILS -->

<tr>

<td
    style="
        background:#f6fbfb;
        padding:15px 22px 20px;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>


<tr>

<td
    style="
        padding:10px 0;
        color:#374151;
        border-bottom:1px solid #dce9e9;
    "
>

Plan Amount

</td>


<td
    align="right"
    style="
        padding:10px 0;
        font-weight:600;
        color:#1f2937;
        border-bottom:1px solid #dce9e9;
    "
>

${formatPrice(planAmount)}

</td>

</tr>


<tr>

<td
    style="
        padding:10px 0;
        color:#374151;
        border-bottom:1px solid #dce9e9;
    "
>

Setup &amp; Integration

</td>


<td
    align="right"
    style="
        padding:10px 0;
        font-weight:600;
        color:#1f2937;
        border-bottom:1px solid #dce9e9;
    "
>

${formatPrice(setupFee)}

</td>

</tr>


<tr>

<td
    style="
        padding:10px 0;
        color:#374151;
        border-bottom:1px solid #dce9e9;
    "
>

Tax

</td>


<td
    align="right"
    style="
        padding:10px 0;
        font-weight:600;
        color:#1f2937;
        border-bottom:1px solid #dce9e9;
    "
>

${formatPrice(tax)}

</td>

</tr>


<tr>

<td
    style="
        padding:22px 0 5px;
        font-size:23px;
        font-weight:700;
        color:#1f2937;
    "
>

Total Paid

</td>


<td
    align="right"
    style="
        padding:22px 0 5px;
        font-size:28px;
        font-weight:800;
        color:#00656A;
    "
>

${formatPrice(total)}

</td>

</tr>


</table>

</td>

</tr>


</table>


<!-- WELCOME -->

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        margin-top:24px;
        background:#eef8f8;
        border-radius:10px;
    "
>

<tr>

<td
    style="
        padding:20px 22px;
    "
>


<div
    style="
        font-size:17px;
        font-weight:700;
        color:#00656A;
        margin-bottom:8px;
    "
>

🌱 Welcome to the SaleVitals Family!

</div>


<div
    style="
        font-size:15px;
        line-height:1.6;
        color:#4b5563;
    "
>

We're excited to have you on board.
If you have any questions, feel free to reply to this email.

</div>


</td>

</tr>

</table>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td
    style="
        padding:28px 30px;
        text-align:center;
        border-top:1px solid #e5e7eb;
        background:#ffffff;
    "
>


<div
    style="
        font-size:13px;
        color:#6b7280;
    "
>

© ${new Date().getFullYear()}
SaleVitals.
All rights reserved.

</div>


</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>
            `,

    });


};


module.exports =
    sendInvoiceEmail;