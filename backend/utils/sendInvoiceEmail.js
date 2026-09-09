const nodemailer=require("nodemailer");

const sendInvoiceEmail=async({user,order,paymentId})=>{

const transporter=nodemailer.createTransport({
host:process.env.SMTP_HOST,
port:Number(process.env.SMTP_PORT),
secure:process.env.SMTP_SECURE==="true",
auth:{
user:process.env.SMTP_USER,
pass:process.env.SMTP_PASS,
},
});

const symbol=order.currency==="INR"?"₹":"$";

const invoiceNumber=`SV-${String(order._id).slice(-8).toUpperCase()}`;

const planAmount=Number(order.planAmount||0);
const setupFee=Number(order.setupFee||0);
const tax=Number(order.tax||0);
const total=Number(order.amount||0);

await transporter.sendMail({
from:process.env.SMTP_FROM,
to:user.email,
subject:`Payment Successful - Invoice ${invoiceNumber}`,
html:`
<div style="margin:0;padding:30px;background:#f5f7f8;font-family:Arial,sans-serif">

<div style="max-width:650px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">

<div style="background:#00656A;padding:30px;color:#fff">
<h1 style="margin:0">SaleVitals</h1>
<p style="margin:8px 0 0">Payment Successful</p>
</div>

<div style="padding:35px">

<h2>Payment received successfully 🎉</h2>

<p>Hi ${user.name||"Customer"},</p>

<p>Thank you for choosing SaleVitals CRM. Your payment has been received successfully.</p>

<div style="background:#E6F4F4;padding:20px;border-left:4px solid #00656A;margin:25px 0">

<strong>Your CRM activation</strong>

<p style="margin-bottom:0">
Your SaleVitals CRM will be activated soon. Our team will connect with you within 24 hours to complete your onboarding, setup and integration.
</p>

</div>

<h3>Invoice Details</h3>

<table width="100%" style="border-collapse:collapse">

<tr>
<td style="padding:10px 0">Invoice Number</td>
<td align="right">${invoiceNumber}</td>
</tr>

<tr>
<td style="padding:10px 0">Plan</td>
<td align="right">${order.planName||order.planId}</td>
</tr>

<tr>
<td style="padding:10px 0">Subscription Period</td>
<td align="right">${order.period} month${Number(order.period)>1?"s":""}</td>
</tr>

<tr>
<td style="padding:10px 0">Payment ID</td>
<td align="right">${paymentId}</td>
</tr>

<tr>
<td colspan="2">
<hr style="border:0;border-top:1px solid #e5e7eb">
</td>
</tr>

<tr>
<td style="padding:10px 0">Plan Amount</td>
<td align="right">${symbol}${planAmount.toLocaleString()}</td>
</tr>

<tr>
<td style="padding:10px 0">Setup & Integration</td>
<td align="right">${symbol}${setupFee.toLocaleString()}</td>
</tr>

<tr>
<td style="padding:10px 0">Tax</td>
<td align="right">${symbol}${tax.toLocaleString()}</td>
</tr>

<tr>
<td colspan="2">
<hr style="border:0;border-top:1px solid #e5e7eb">
</td>
</tr>

<tr>
<td style="font-size:20px;font-weight:bold;padding:15px 0">Total Paid</td>
<td align="right" style="font-size:22px;font-weight:bold;color:#00656A">
${symbol}${total.toLocaleString()}
</td>
</tr>

</table>

</div>

<div style="background:#f8fafb;padding:20px;text-align:center;color:#6b7280">
<strong>SaleVitals CRM</strong>
<br><br>
Your payment has been successfully received.
</div>

</div>

</div>
`,
});

};

module.exports=sendInvoiceEmail;