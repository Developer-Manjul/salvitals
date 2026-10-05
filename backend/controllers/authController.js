const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const nodemailer = require("nodemailer");



const User = require("../models/User");

const TeamMember = require("../models/TeamMember");



const generateToken = (user) =>

  jwt.sign(

    {

      id: user._id.toString(),

      email: user.email,

      role: user.role,

      workspaceOwner: user.workspaceOwner

        ? user.workspaceOwner.toString()

       : null,

    },

    process.env.JWT_SECRET,

    {

      expiresIn: "7d",

    }

  );



const formatUserResponse = (user, teamMember = null) => ({

  id: user._id.toString(),

  name: user.name || "",

  email: user.email || "",

  clinicName: user.clinicName || "",

  phone: user.phone || "",

  phoneCountryCode: user.phoneCountryCode || "",

  speciality: user.speciality || "",

  numberOfDoctors: user.numberOfDoctors || "",

  displayName: user.displayName || "",

  address: user.address || "",

  gstin: user.gstin || "",

  zipCode: user.zipCode || "",

  website: user.website || "",

  clinicLogo: user.clinicLogo || "",

  bankName: user.bankName || "",

  accountHolderName: user.accountHolderName || "",

  accountNumber: user.accountNumber || "",

  ifscCode: user.ifscCode || "",

  upiId: user.upiId || "",



  accountSetupCompleted:

    user.accountSetupCompleted === true,



  workspaceOwner: user.workspaceOwner

    ? user.workspaceOwner.toString()

   : null,



  role: user.role,



  teamMember: teamMember

    ? {

        id: teamMember._id.toString(),



        owner: teamMember.owner

          ? teamMember.owner.toString()

         : null,



        roleId: teamMember.roleId?._id

          ? teamMember.roleId._id.toString()

         : null,



        role:

          teamMember.roleId?.name ||

          "Team Member",



        roleSlug:

          teamMember.roleId?.slug ||

          "",



        permissions:

          teamMember.roleId?.permissions ||

          [],



        memberType:

          teamMember.memberType ||

          "team",



        status:

          teamMember.status ||

          "active",



        invitationStatus:

          teamMember.invitationStatus ||

          "accepted",

      }

   : null,



  permissions: teamMember

    ? teamMember.roleId?.permissions || []

   : ["*"],



  isOwner: !user.workspaceOwner,



  isActive: user.isActive,



  emailVerified:

    !!user.emailVerified,

});



const createVerificationToken = () => {

  const rawToken = crypto.randomBytes(32).toString("hex");



  const hashedToken = crypto

    .createHash("sha256")

    .update(rawToken)

    .digest("hex");



  return {

    rawToken,

    hashedToken,

    expires: new Date(

      Date.now() + 60 * 60 * 1000

    ),

  };

};



async function sendVerificationEmail(user, token) {

  if (

    !process.env.SMTP_HOST ||

    !process.env.SMTP_USER ||

    !process.env.SMTP_PASS

  ) {

    throw new Error("SMTP configuration is missing");

  }



  const transporter = nodemailer.createTransport({

    host: process.env.SMTP_HOST,

    port: Number(process.env.SMTP_PORT || 587),

    secure:

      String(process.env.SMTP_SECURE).toLowerCase() ===

      "true",

    auth: {

      user: process.env.SMTP_USER,

      pass: process.env.SMTP_PASS,

    },

  });



  try {

    await transporter.verify();

    console.log("SMTP AUTH SUCCESS");

  } catch (smtpError) {

    console.error("SMTP AUTH FAILED");

    console.error("Code:", smtpError.code);

    console.error("Response:", smtpError.response);

    throw smtpError;

  }



  const base = (

    process.env.FRONTEND_URL ||

    "https://salevitals.com"

  ).replace(/\/$/, "");



  const verificationUrl =

    `${base}/verify-email?token=${encodeURIComponent(token)}`;



  const logoUrl =

    "https://salevitals.com/logo.png";



  await transporter.sendMail({

    from: `"SaleVitals" <${

      process.env.SMTP_FROM || process.env.SMTP_USER

    }>`,

    to: user.email,

    subject: "Verify your SaleVitals email",

    html: `

<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Verify your SaleVitals email</title>

</head>



<body

  style="

    margin:0;

    padding:0;

    background:#f4f7fb;

    font-family:Arial,Helvetica,sans-serif;

  "

>



<table

  width="100%"

  cellpadding="0"

  cellspacing="0"

  border="0"

  style="

    background:#f4f7fb;

    padding:40px 15px;

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

    max-width:620px;

    background:#ffffff;

    border-radius:12px;

    overflow:hidden;

    box-shadow:0 10px 40px rgba(0,0,0,0.08);

  "

>



<tr>

<td

  style="

    background:#ffffff;

    padding:28px 35px 20px;

    text-align:center;

    border-bottom:1px solid #e5e7eb;

  "

>



<a

  href="${base}"

  target="_blank"

  style="

    text-decoration:none;

    display:block;

  "

>



<img

  src="${logoUrl}"

  alt="SaleVitals"

  width="150"

  style="

    display:block;

    width:150px;

    max-width:150px;

    height:auto;

    margin:0 auto 10px;

    border:0;

    outline:none;

    text-decoration:none;

  "

>



</a>



<div

  style="

    margin-top:2px;

    color:#173766;

    font-size:22px;

    line-height:28px;

    font-weight:700;

  "

>

  SaleVitals

</div>



</td>

</tr>



<tr>

<td

  style="

    padding:32px 60px 35px;

  "

>



<div

  style="

    width:52px;

    height:52px;

    margin:0 auto 18px;

    border-radius:50%;

    background:#eef4ff;

    text-align:center;

    line-height:52px;

    font-size:24px;

  "

>

  ✉

</div>



<h1

  style="

    margin:0 0 12px;

    text-align:center;

    color:#1f2937;

    font-size:23px;

    line-height:1.35;

    font-weight:700;

  "

>

  Verify your email address

</h1>



<p

  style="

    margin:0 0 18px;

    color:#4b5563;

    font-size:15px;

    line-height:1.7;

  "

>

  Hi ${user.name || "there"},

</p>



<p

  style="

    margin:0 0 24px;

    color:#4b5563;

    font-size:15px;

    line-height:1.7;

  "

>

  Thanks for creating your SaleVitals account!

  You're one step away from getting started.

  Please verify your email address to activate

  your account and continue setting up your

  CRM workspace.

</p>



<table

  width="100%"

  cellpadding="0"

  cellspacing="0"

  border="0"

>

<tr>

<td align="center">



<a

  href="${verificationUrl}"

  target="_blank"

  style="

    display:inline-block;

    background:#1769d1;

    color:#ffffff;

    text-decoration:none;

    padding:14px 34px;

    border-radius:5px;

    font-size:15px;

    line-height:20px;

    font-weight:700;

  "

>

  Verify My Email&nbsp; →

</a>



</td>

</tr>

</table>



<div

  style="

    margin-top:28px;

    padding:16px 18px;

    background:#eefaf4;

    border:1px solid #cceedd;

    border-radius:9px;

    color:#176b45;

    font-size:13px;

    line-height:1.6;

  "

>



<span

  style="

    font-size:17px;

    margin-right:5px;

  "

>

  ✓

</span>



<strong>

  This link is secure.

</strong>



Your verification link will expire in

<strong>

  1 hour.

</strong>



</div>



<p

  style="

    margin:25px 0 0;

    color:#6b7280;

    font-size:12px;

    line-height:1.7;

  "

>

  If you did not create a SaleVitals account,

  you can safely ignore this email.

</p>



<p

  style="

    margin:22px 0 0;

    color:#6b7280;

    font-size:11px;

    line-height:1.6;

  "

>

  If the button doesn't work, copy and paste

  the link below into your browser:

</p>



<a

  href="${verificationUrl}"

  target="_blank"

  style="

    display:block;

    margin-top:8px;

    padding:11px 12px;

    background:#f1f6ff;

    border-radius:6px;

    color:#1769d1;

    text-decoration:none;

    font-size:10px;

    line-height:1.5;

    word-break:break-all;

  "

>

  ${verificationUrl}

</a>



</td>

</tr>



<tr>

<td

  style="

    background:#f8fafc;

    padding:24px 35px;

    text-align:center;

    border-top:1px solid #e5e7eb;

  "

>



<p

  style="

    margin:0 0 9px;

    color:#374151;

    font-size:12px;

    line-height:1.6;

    font-weight:600;

  "

>

  Need help? Reply to this email or contact our

  <a

    href="mailto:support@salevitals.com"

    style="

      color:#1769d1;

      text-decoration:none;

    "

  >

    support team

  </a>.

</p>



<p

  style="

    margin:0;

    color:#9ca3af;

    font-size:10px;

    line-height:1.5;

  "

>

  SaleVitals · Secure CRM for smarter sales management

</p>



<div

  style="

    margin-top:14px;

    color:#9ca3af;

    font-size:10px;

  "

>



<a

  href="${base}"

  style="

    color:#55708f;

    text-decoration:none;

  "

>

  Visit SaleVitals

</a>



&nbsp; · &nbsp;



<a

  href="${base}/privacy-policy"

  style="

    color:#55708f;

    text-decoration:none;

  "

>

  Privacy

</a>



</div>



</td>

</tr>



</table>



<p

  style="

    margin:20px 0 0;

    color:#9ca3af;

    font-size:10px;

    text-align:center;

  "

>

  © ${new Date().getFullYear()} SaleVitals.

  All rights reserved.

</p>



</td>

</tr>

</table>



</body>

</html>

    `,

  });



  return true;

};



exports.register = async (req, res) => {

  try {

    const {

      name,

      personName,

      email,

      workEmail,

      password,

      clinicName,

      businessName,

      phone,

      phoneCountryCode,

      speciality,

      numberOfDoctors,

      displayName,

      address,

      gstin,

      zipCode,

      website,

    } = req.body;



    const finalName = String(

      name || personName || ""

    ).trim();



    const finalEmail = String(

      email || workEmail || ""

    )

      .trim()

      .toLowerCase();



    const finalClinic = String(

      clinicName || businessName || ""

    ).trim();



    if (!finalName) {

      return res.status(400).json({

        success: false,

        message: "Name is required",

      });

    }



    if (!/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(finalEmail)) {

      return res.status(400).json({

        success: false,

        message: "Please enter a valid email",

      });

    }



    if (!finalClinic) {

      return res.status(400).json({

        success: false,

        message: "Business Name is required",

      });

    }



    if (!password || password.length < 8) {

      return res.status(400).json({

        success: false,

        message: "Password must be at least 8 characters",

      });

    }



    const existingUser = await User.findOne({

      email: finalEmail,

    });



    if (existingUser) {

      if (existingUser.emailVerified) {

        return res.status(409).json({

          success: false,

          message:

            "An account with this email already exists",

        });

      }



      const {

        rawToken,

        hashedToken,

        expires,

      } = createVerificationToken();



      existingUser.emailVerificationToken =

        hashedToken;

      existingUser.emailVerificationExpires =

        expires;



      await existingUser.save();



      await sendVerificationEmail(

        existingUser,

        rawToken

      );



      return res.status(200).json({

        success: true,

        message:

          "Your account already exists but is not verified. A new verification email has been sent.",

        emailVerificationRequired: true,

        email: existingUser.email,

      });

    }



    const {

      rawToken,

      hashedToken,

      expires,

    } = createVerificationToken();



    const user = await User.create({

      name: finalName,

      email: finalEmail,

      password: await bcrypt.hash(password, 12),

      clinicName: finalClinic,

      phone: String(phone || "").trim(),

      phoneCountryCode:

        String(phoneCountryCode || "").trim(),

      speciality:

        String(speciality || "").trim(),

      numberOfDoctors:

        String(numberOfDoctors || "").trim(),

      displayName:

        String(displayName || "").trim(),

      address:

        String(address || "").trim(),

      gstin:

        String(gstin || "")

          .trim()

          .toUpperCase(),

      zipCode:

        String(zipCode || "").trim(),

      website:

        String(website || "").trim(),

      emailVerified: false,

      emailVerificationToken: hashedToken,

      emailVerificationExpires: expires,

    });



    await sendVerificationEmail(

      user,

      rawToken

    );



    return res.status(201).json({

      success: true,

      message:

        "Account created. Please verify your email.",

      user: formatUserResponse(user),

      emailVerificationRequired: true,

    });

  } catch (error) {

    console.error("Register error:", error);



    if (error?.code === 11000) {

      return res.status(409).json({

        success: false,

        message:

          "An account with this email already exists",

      });

    }



    return res.status(500).json({

      success: false,

      message:

        "Server error while creating account",

    });

  }

};



exports.verifyEmail = async (req, res) => {

  try {

    const token = String(

      req.body.token ||

      req.query.token ||

      ""

    ).trim();



    if (!token) {

      return res.status(400).json({

        success: false,

        message:

          "Verification token is missing",

      });

    }



    const hash = crypto

      .createHash("sha256")

      .update(token)

      .digest("hex");



    const user = await User.findOne({

      emailVerificationToken: hash,

      emailVerificationExpires: {

        $gt: new Date(),

      },

    });



    if (!user) {

      return res.status(400).json({

        success: false,

        message:

          "Invalid or expired verification link",

      });

    }



    user.emailVerified = true;

    user.emailVerificationToken = "";

    user.emailVerificationExpires = null;



    await user.save();



    return res.json({

      success: true,

      message:

        "Email verified successfully",

      token: generateToken(user),

      user: formatUserResponse(user),

    });

  } catch (error) {

    console.error(

      "Verify email error:",

      error.message

    );



    return res.status(500).json({

      success: false,

      message:

        "Unable to verify email",

    });

  }

};



exports.resendVerification = async (

  req,

  res

) => {

  try {

    const email = String(

      req.body.email || ""

    )

      .trim()

      .toLowerCase();



    if (!email) {

      return res.status(400).json({

        success: false,

        message: "Email is required",

      });

    }



    const user = await User.findOne({

      email,

    });



    if (!user) {

      return res.status(404).json({

        success: false,

        message: "Account not found",

      });

    }



    if (user.emailVerified) {

      return res.status(400).json({

        success: false,

        message:

          "Email is already verified",

      });

    }



    const {

      rawToken,

      hashedToken,

      expires,

    } = createVerificationToken();



    user.emailVerificationToken =

      hashedToken;

    user.emailVerificationExpires =

      expires;



    await user.save();



    await sendVerificationEmail(

      user,

      rawToken

    );



    return res.json({

      success: true,

      message:

        "Verification email sent successfully",

    });

  } catch (error) {

    console.error(

      "Resend verification error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        "Unable to resend verification email",

    });

  }

};



exports.login = async (req, res) => {

  try {

    const totalStart = Date.now();



    const email = String(req.body.email || "").trim().toLowerCase();

    const password = req.body.password || "";



    const userStart = Date.now();



const user = await User.findOne({ email })

  .select("_id name email password clinicName phone phoneCountryCode speciality numberOfDoctors displayName address gstin zipCode website clinicLogo bankName accountHolderName accountNumber ifscCode upiId accountSetupCompleted workspaceOwner role isActive emailVerified")

  .lean();



    console.log(`[LOGIN] User.findOne: ${Date.now() - userStart}ms`);



    if (!user) {

      return res.status(401).json({

        success: false,

        message: "Invalid email or password",

      });

    }



    const bcryptStart = Date.now();



    const passwordValid = await bcrypt.compare(

      password,

      user.password

    );



    console.log(`[LOGIN] bcrypt.compare: ${Date.now() - bcryptStart}ms`);



    if (!passwordValid) {

      return res.status(401).json({

        success: false,

        message: "Invalid email or password",

      });

    }



    if (!user.emailVerified) {

      return res.status(403).json({

        success: false,

        message: "Please verify your email before logging in.",

        emailVerificationRequired: true,

        email: user.email,

      });

    }



    if (user.isActive === false) {

      return res.status(403).json({

        success: false,

        message: "Your account is inactive",

      });

    }



    let teamMember = null;



    if (user.workspaceOwner) {

      const teamStart = Date.now();



      teamMember = await TeamMember.findOne({

        userId: user._id,

        owner: user.workspaceOwner,

        memberType: "team",

      })

        .select("_id owner roleId memberType status invitationStatus")

        .populate("roleId", "name slug permissions status")

        .lean();



      console.log(`[LOGIN] TeamMember: ${Date.now() - teamStart}ms`);



      if (!teamMember) {

        return res.status(403).json({

          success: false,

          message: "Your team membership could not be found.",

        });

      }



      if (teamMember.status !== "active") {

        return res.status(403).json({

          success: false,

          message:

            "Your team account is inactive. Please contact the workspace owner.",

        });

      }



      if (

        !teamMember.roleId ||

        teamMember.roleId.status !== "active"

      ) {

        return res.status(403).json({

          success: false,

          message:

            "Your assigned role is inactive. Please contact the workspace owner.",

        });

      }

    }



    const tokenStart = Date.now();



    const token = generateToken(user);



    console.log(`[LOGIN] generateToken: ${Date.now() - tokenStart}ms`);



    const formatStart = Date.now();



    const responseUser = formatUserResponse(

      user,

      teamMember

    );



    console.log(`[LOGIN] formatUserResponse: ${Date.now() - formatStart}ms`);



    console.log(`[LOGIN] TOTAL: ${Date.now() - totalStart}ms`);



    return res.json({

      success: true,

      token,

      user: responseUser,

      workspace: {

        ownerId: user.workspaceOwner

          ? user.workspaceOwner.toString()

         : user._id.toString(),

        isOwner: !user.workspaceOwner,

        role: teamMember?.roleId?.name || "Owner",

        roleSlug: teamMember?.roleId?.slug || "owner",

        permissions: teamMember?.roleId?.permissions || ["*"],

      },

      teamMember: teamMember

        ? {

            id: teamMember._id.toString(),

            owner: teamMember.owner

              ? teamMember.owner.toString()

             : user.workspaceOwner

                ? user.workspaceOwner.toString()

               : null,

            roleId: teamMember.roleId?._id

              ? teamMember.roleId._id.toString()

             : null,

            role: teamMember.roleId?.name || "Team Member",

            roleSlug: teamMember.roleId?.slug || "",

            permissions: teamMember.roleId?.permissions || [],

            memberType: teamMember.memberType || "team",

            status: teamMember.status || "active",

            invitationStatus:

              teamMember.invitationStatus || "accepted",

          }

       : null,

    });

  } catch (error) {

    console.error("Login error:", error.message);



    return res.status(500).json({

      success: false,

      message: "Login failed",

    });

  }

};



exports.forgotPassword = async (req, res) => {

  try {

    console.log("========== FORGOT PASSWORD ==========");

    console.log("REQUEST BODY:", req.body);



    const email = String(

      req.body.email || ""

    )

      .trim()

      .toLowerCase();



    console.log("RESET EMAIL:", email);



    if (!email) {

      return res.status(400).json({

        success: false,

        message: "Email is required",

      });

    }



    const user = await User.findOne({

      email,

    });



    if (!user) {

      console.log("RESET EMAIL ACCOUNT NOT FOUND:", email);



    return res.jso

    }



    const rawToken = crypto

      .randomBytes(32)

      .toString("hex");



    const hashedToken = crypto

      .createHash("sha256")

      .update(rawToken)

      .digest("hex");



    const expires = new Date(

      Date.now() + 60 * 60 * 1000

    );



    user.passwordResetToken = hashedToken;

    user.passwordResetExpires = expires;



    await user.save();



    console.log("RESET TOKEN SAVED FOR:", user.email);



    if (

      !process.env.SMTP_HOST ||

      !process.env.SMTP_USER ||

      !process.env.SMTP_PASS

    ) {

      throw new Error(

        "SMTP configuration is missing"

      );

    }



    const transporter = nodemailer.createTransport({

      host: process.env.SMTP_HOST,

      port: Number(

        process.env.SMTP_PORT || 587

      ),

      secure:

        String(

          process.env.SMTP_SECURE

        ).toLowerCase() === "true",

      auth: {

        user: process.env.SMTP_USER,

        pass: process.env.SMTP_PASS,

      },

    });



    try {

      await transporter.verify();



      console.log(

        "FORGOT PASSWORD SMTP AUTH SUCCESS"

      );

    } catch (smtpError) {

      console.error(

        "FORGOT PASSWORD SMTP AUTH FAILED"

      );

      console.error(

        "SMTP CODE:",

        smtpError.code

      );

      console.error(

        "SMTP RESPONSE:",

        smtpError.response

      );

      throw smtpError;

    }



    const base = (

      process.env.FRONTEND_URL ||

      "http://localhost:5173"

    ).replace(/\/$/, "");



    const resetUrl =

      `${base}/reset-password?token=${encodeURIComponent(

        rawToken

      )}`;



    console.log(

      "RESET URL:",

      resetUrl

    );



    const logoUrl =

      "https://salevitals.com/logo.png";



    const info = await transporter.sendMail({

      from: `"SaleVitals" <${

        process.env.SMTP_FROM ||

        process.env.SMTP_USER

      }>`,

      to: user.email,

      subject:

        "Reset your SaleVitals password",

      html: `

<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta

    name="viewport"

    content="width=device-width, initial-scale=1.0"

  >

  <title>Reset your SaleVitals password</title>

</head>



<body

  style="

    margin:0;

    padding:0;

    background:#f4f7fb;

    font-family:Arial,Helvetica,sans-serif;

  "

>



<table

  width="100%"

  cellpadding="0"

  cellspacing="0"

  border="0"

  style="

    background:#f4f7fb;

    padding:40px 15px;

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

    max-width:620px;

    background:#ffffff;

    border-radius:12px;

    overflow:hidden;

    box-shadow:0 10px 40px rgba(0,0,0,0.08);

  "

>



<tr>

<td

  style="

    padding:28px 35px 20px;

    text-align:center;

    border-bottom:1px solid #e5e7eb;

  "

>



<a

  href="${base}"

  target="_blank"

  style="

    text-decoration:none;

    display:block;

  "

>



<img

  src="${logoUrl}"

  alt="SaleVitals"

  width="150"

  style="

    display:block;

    width:150px;

    max-width:150px;

    height:auto;

    margin:0 auto;

    border:0;

  "

>



</a>



</td>

</tr>



<tr>

<td

  style="

    padding:32px 60px 35px;

  "

>



<div

  style="

    width:52px;

    height:52px;

    margin:0 auto 18px;

    border-radius:50%;

    background:#eef4ff;

    text-align:center;

    line-height:52px;

    font-size:24px;

  "

>

  🔐

</div>



<h1

  style="

    margin:0 0 12px;

    text-align:center;

    color:#1f2937;

    font-size:23px;

    line-height:1.35;

    font-weight:700;

  "

>

  Reset your password

</h1>



<p

  style="

    margin:0 0 18px;

    color:#4b5563;

    font-size:15px;

    line-height:1.7;

  "

>

  Hi ${user.name || "there"},

</p>



<p

  style="

    margin:0 0 24px;

    color:#4b5563;

    font-size:15px;

    line-height:1.7;

  "

>

  We received a request to reset your

  SaleVitals account password. Click the

  button below to create a new password.

</p>



<table

  width="100%"

  cellpadding="0"

  cellspacing="0"

  border="0"

>

<tr>

<td align="center">



<a

  href="${resetUrl}"

  target="_blank"

  style="

    display:inline-block;

    background:#1769d1;

    color:#ffffff;

    text-decoration:none;

    padding:14px 34px;

    border-radius:5px;

    font-size:15px;

    line-height:20px;

    font-weight:700;

  "

>

  Reset My Password →

</a>



</td>

</tr>

</table>



<div

  style="

    margin-top:28px;

    padding:16px 18px;

    background:#eefaf4;

    border:1px solid #cceedd;

    border-radius:9px;

    color:#176b45;

    font-size:13px;

    line-height:1.6;

  "

>

  ✓

  <strong>This link is secure.</strong>

  Your password reset link will expire

  in <strong>1 hour.</strong>

</div>



<p

  style="

    margin:25px 0 0;

    color:#6b7280;

    font-size:12px;

    line-height:1.7;

  "

>

  If you did not request a password reset,

  you can safely ignore this email.

</p>



<p

  style="

    margin:22px 0 0;

    color:#6b7280;

    font-size:11px;

    line-height:1.6;

  "

>

  If the button doesn't work, copy and paste

  the link below into your browser:

</p>



<a

  href="${resetUrl}"

  target="_blank"

  style="

    display:block;

    margin-top:8px;

    padding:11px 12px;

    background:#f1f6ff;

    border-radius:6px;

    color:#1769d1;

    text-decoration:none;

    font-size:10px;

    line-height:1.5;

    word-break:break-all;

  "

>

  ${resetUrl}

</a>



</td>

</tr>



<tr>

<td

  style="

    background:#f8fafc;

    padding:24px 35px;

    text-align:center;

    border-top:1px solid #e5e7eb;

  "

>



<p

  style="

    margin:0 0 9px;

    color:#374151;

    font-size:12px;

    line-height:1.6;

    font-weight:600;

  "

>

  Need help? Reply to this email or contact

  our

  <a

    href="mailto:support@salevitals.com"

    style="

      color:#1769d1;

      text-decoration:none;

    "

  >

    support team

  </a>.

</p>



<p

  style="

    margin:0;

    color:#9ca3af;

    font-size:10px;

  "

>

  SaleVitals · Secure CRM for smarter sales management

</p>



</td>

</tr>



</table>



<p

  style="

    margin:20px 0 0;

    color:#9ca3af;

    font-size:10px;

  "

>

  © ${new Date().getFullYear()} SaleVitals.

  All rights reserved.

</p>



</td>

</tr>

</table>



</body>

</html>

      `,

    });



    console.log(

      "PASSWORD RESET EMAIL SENT:",

      info.messageId

    );



    console.log(

      "PASSWORD RESET EMAIL RESPONSE:",

      info.response

    );



    return res.json({

      success: true,

      message:

        "If an account exists with this email, a password reset link has been sent.",

    });

  } catch (error) {

    console.error(

      "Forgot password error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        "Unable to process password reset request",

    });

  }

};



exports.resetPassword = async (req, res) => {

  try {

    const token = String(

      req.body.token || ""

    ).trim();



    const password = String(

      req.body.password || ""

    );



    const confirmPassword = String(

      req.body.confirmPassword || ""

    );



    if (!token) {

      return res.status(400).json({

        success: false,

        message:

          "Reset token is missing",

      });

    }



    if (!password || password.length < 8) {

      return res.status(400).json({

        success: false,

        message:

          "Password must be at least 8 characters",

      });

    }



    if (password !== confirmPassword) {

      return res.status(400).json({

        success: false,

        message:

          "Passwords do not match",

      });

    }



    const hashedToken = crypto

      .createHash("sha256")

      .update(token)

      .digest("hex");



    const user = await User.findOne({

      passwordResetToken: hashedToken,

      passwordResetExpires: {

        $gt: new Date(),

      },

    });



    if (!user) {

      return res.status(400).json({

        success: false,

        message:

          "Invalid or expired password reset link",

      });

    }



    user.password = await bcrypt.hash(

      password,

      12

    );



    user.passwordResetToken = "";

    user.passwordResetExpires = null;



    await user.save();



    return res.json({

      success: true,

      message:

        "Password reset successfully. You can now sign in.",

    });

  } catch (error) {

    console.error(

      "Reset password error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        "Unable to reset password",

    });

  }

};



exports.completeSetup = async (

  req,

  res

) => {

  try {

    const authorization =

      req.headers.authorization || "";



    if (!authorization.startsWith("Bearer ")) {

      return res.status(401).json({

        success: false,

        message:

          "Authentication required",

      });

    }



    const decoded = jwt.verify(

      authorization.slice(7),

      process.env.JWT_SECRET

    );



    const user = await User.findById(

      decoded.id

    );



    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }



    const {

      displayName,

      address,

      gstin,

      zipCode,

      website,

      clinicLogo,

    } = req.body;



    user.displayName =

      String(displayName || "").trim();



    user.address =

      String(address || "").trim();



    user.gstin =

      String(gstin || "")

        .trim()

        .toUpperCase();



    user.zipCode =

      String(zipCode || "").trim();



    user.website =

      String(website || "").trim();



    user.clinicLogo =

      String(clinicLogo || "").trim();



    user.accountSetupCompleted = true;



    await user.save();



    return res.json({

      success: true,

      user: formatUserResponse(user),

    });

  } catch (error) {

    console.error(

      "Complete setup error:",

      error.message

    );



    return res.status(401).json({

      success: false,

      message:

        "Invalid or expired authentication token",

    });

  }

};



exports.getProfile = async (req, res) => {

  try {

    const authorization = req.headers.authorization || "";



    if (!authorization.startsWith("Bearer ")) {

      return res.status(401).json({

        success: false,

        message: "Authentication required",

      });

    }



    const token = authorization.slice(7);



    const decoded = jwt.verify(

      token,

      process.env.JWT_SECRET

    );



   const user = await User.findById(decoded.id).select(

  "-password -emailVerificationToken -emailVerificationExpires"

);



    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }



    let teamMember = null;



    if (user.workspaceOwner) {

      teamMember = await TeamMember.findOne({

        userId: user._id,

        owner: user.workspaceOwner,

        memberType: "team",

      })

        .populate(

          "roleId",

          "name slug permissions status"

        )

        .lean();



      if (!teamMember) {

        return res.status(403).json({

          success: false,

          message:

            "Your team membership could not be found.",

        });

      }



      if (teamMember.status !== "active") {

        return res.status(403).json({

          success: false,

          message:

            "Your team account is inactive.",

        });

      }



      if (

        !teamMember.roleId ||

        teamMember.roleId.status !== "active"

      ) {

        return res.status(403).json({

          success: false,

          message:

            "Your assigned role is inactive.",

        });

      }

    }



    const responseUser = formatUserResponse(

      user,

      teamMember

    );



    return res.status(200).json({

      success: true,



      user: responseUser,



      workspace: {

        ownerId: user.workspaceOwner

          ? user.workspaceOwner.toString()

         : user._id.toString(),



        isOwner: !user.workspaceOwner,



        role:

          teamMember?.roleId?.name ||

          "Owner",



        roleSlug:

          teamMember?.roleId?.slug ||

          "owner",



        permissions:

          teamMember?.roleId?.permissions ||

          ["*"],

      },



      teamMember: teamMember

        ? {

            id: teamMember._id.toString(),



            owner: teamMember.owner

              ? teamMember.owner.toString()

             : user.workspaceOwner

                ? user.workspaceOwner.toString()

               : null,



            roleId: teamMember.roleId?._id

              ? teamMember.roleId._id.toString()

             : null,



            role:

              teamMember.roleId?.name ||

              "Team Member",



            roleSlug:

              teamMember.roleId?.slug ||

              "",



            permissions:

              teamMember.roleId?.permissions ||

              [],



            memberType:

              teamMember.memberType ||

              "team",



            status:

              teamMember.status ||

              "active",



            invitationStatus:

              teamMember.invitationStatus ||

              "accepted",

          }

       : null,

    });

  } catch (error) {

    console.error(

      "Get profile error:",

      error

    );



    return res.status(401).json({

      success: false,

      message:

        "Invalid or expired authentication token",

    });

  }

};



exports.getProfileLogo = async (req, res) => {

  try {

    const authorization = req.headers.authorization || "";



    if (!authorization.startsWith("Bearer ")) {

      return res.status(401).json({

        success: false,

        message: "Authentication required",

      });

    }



    const decoded = jwt.verify(

      authorization.slice(7),

      process.env.JWT_SECRET

    );



    const user = await User.findById(decoded.id)

      .select("_id clinicLogo")

      .lean();



    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }



    return res.json({

      success: true,

      clinicLogo: user.clinicLogo || "",

    });

  } catch (error) {

    console.error("Get profile logo error:", error.message);



    return res.status(401).json({

      success: false,

      message: "Invalid or expired authentication token",

    });

  }

};



exports.updateProfile = async (

  req,

  res

) => {

  try {

    const authorization =

      req.headers.authorization || "";



    if (!authorization.startsWith("Bearer ")) {

      return res.status(401).json({

        success: false,

        message:

          "Authentication required",

      });

    }



    const token =

      authorization.slice(7);



    const decoded = jwt.verify(

      token,

      process.env.JWT_SECRET

    );



    const user = await User.findById(

      decoded.id

    );



    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }



    const {

      name,

      clinicName,

      phone,

      phoneCountryCode,

      speciality,

      numberOfDoctors,

      displayName,

      address,

      gstin,

      zipCode,

      website,

      clinicLogo,

      bankName,

      accountHolderName,

      accountNumber,

      ifscCode,

      upiId,

    } = req.body;



    if (name !== undefined) {

      user.name = String(name).trim();

    }



    if (clinicName !== undefined) {

      user.clinicName =

        String(clinicName).trim();

    }



    if (phone !== undefined) {

      user.phone =

        String(phone).trim();

    }



    if (phoneCountryCode !== undefined) {

      user.phoneCountryCode =

        String(phoneCountryCode).trim();

    }



    if (speciality !== undefined) {

      user.speciality =

        String(speciality).trim();

    }



    if (numberOfDoctors !== undefined) {

      user.numberOfDoctors =

        String(numberOfDoctors).trim();

    }



    if (displayName !== undefined) {

      user.displayName =

        String(displayName).trim();

    }



    if (address !== undefined) {

      user.address =

        String(address).trim();

    }



    if (gstin !== undefined) {

      user.gstin =

        String(gstin)

          .trim()

          .toUpperCase();

    }



    if (zipCode !== undefined) {

      user.zipCode =

        String(zipCode).trim();

    }



    if (website !== undefined) {

      user.website =

        String(website).trim();

    }



    if (clinicLogo !== undefined) {

      user.clinicLogo =

        String(clinicLogo).trim();

    }



    if (bankName !== undefined) {

      user.bankName =

        String(bankName).trim();

    }



    if (accountHolderName !== undefined) {

      user.accountHolderName =

        String(accountHolderName).trim();

    }



    if (accountNumber !== undefined) {

      user.accountNumber =

        String(accountNumber).trim();

    }



    if (ifscCode !== undefined) {

      user.ifscCode =

        String(ifscCode)

          .trim()

          .toUpperCase();

    }



    if (upiId !== undefined) {

      user.upiId =

        String(upiId).trim();

    }



    await user.save();



    const updatedUser =

      await User.findById(user._id).select(

        "-password -emailVerificationToken -emailVerificationExpires"

      );



    return res.status(200).json({

      success: true,

      message:

        "Clinic profile updated successfully",

      user: updatedUser,

    });

  } catch (error) {

    console.error(

      "Update profile error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        error.message ||

        "Unable to update clinic profile",

    });

  }

};



exports.getTeamInvitation = async (

  req,

  res

) => {

  try {

    const token = String(

      req.query.token || ""

    ).trim();



    if (!token) {

      return res.status(400).json({

        success: false,

        message:

          "Invitation token is missing",

      });

    }



    const hash = crypto

      .createHash("sha256")

      .update(token)

      .digest("hex");



    const member =

      await TeamMember.findOne({

        inviteToken: hash,

        inviteExpiresAt: {

          $gt: new Date(),

        },

        invitationStatus: "pending",

        memberType: "team",

      })

        .populate(

          "roleId",

          "name permissions"

        )

        .lean();



    if (!member) {

      return res.status(400).json({

        success: false,

        message:

          "Invalid or expired invitation link",

      });

    }



    return res.json({

      success: true,

      invitation: {

        name: member.name,

        email: member.email,

        role:

          member.roleId?.name ||

          "Team Member",

        expiresAt:

          member.inviteExpiresAt,

      },

    });

  } catch (error) {

    console.error(

      "Get team invitation error:",

      error

    );



    return res.status(500).json({

      success: false,

      message:

        "Unable to verify invitation",

    });

  }

};



exports.acceptTeamInvitation = async (

  req,

  res

) => {

  try {

    const token = String(

      req.body.token || ""

    ).trim();



    const password = String(

      req.body.password || ""

    );



    const confirmPassword = String(

      req.body.confirmPassword || ""

    );



    if (!token) {

      return res.status(400).json({

        success: false,

        message:

          "Invitation token is missing",

      });

    }



    if (!password || password.length < 8) {

      return res.status(400).json({

        success: false,

        message:

          "Password must be at least 8 characters",

      });

    }



    if (password !== confirmPassword) {

      return res.status(400).json({

        success: false,

        message:

          "Passwords do not match",

      });

    }



    const hash = crypto

      .createHash("sha256")

      .update(token)

      .digest("hex");



    const member =

      await TeamMember.findOne({

        inviteToken: hash,

        inviteExpiresAt: {

          $gt: new Date(),

        },

        invitationStatus: "pending",

        memberType: "team",

      }).populate(

        "roleId",

        "name permissions status"

      );



    if (!member) {

      return res.status(400).json({

        success: false,

        message:

          "Invalid or expired invitation link",

      });

    }



    if (member.userId) {

      return res.status(409).json({

        success: false,

        message:

          "This invitation has already been accepted",

      });

    }



    const existingUser =

      await User.findOne({

        email: member.email,

      });



    if (existingUser) {

      return res.status(409).json({

        success: false,

        message:

          "An account with this email already exists",

      });

    }



    const owner =

      await User.findById(

        member.owner

      ).select(

        "clinicName isActive subscription"

      );



    if (!owner) {

      return res.status(404).json({

        success: false,

        message:

          "Workspace owner account was not found.",

      });

    }



    if (owner.isActive === false) {

      return res.status(403).json({

        success: false,

        message:

          "The workspace owner account is inactive.",

      });

    }



    const hashedPassword =

      await bcrypt.hash(

        password,

        12

      );



    const user =

      await User.create({

        name: member.name,

        email: member.email,

        password: hashedPassword,



        clinicName:

          owner.clinicName || "",



        phone:

          member.phone || "",



        emailVerified: true,



        accountSetupCompleted: true,



        role: "user",



        isActive: true,



        workspaceOwner:

          owner._id,

      });



    member.userId = user._id;

    member.acceptedAt = new Date();

    member.invitationStatus = "accepted";

    member.inviteToken = "";

    member.inviteExpiresAt = null;



    await member.save();



    const responseUser =

  formatUserResponse(

    user,

    member

  );



    return res.status(201).json({

      success: true,



      message:

        "Invitation accepted successfully. Your account has been created.",



      token:

        generateToken(user),



      user: responseUser,



      teamMember: {

        id: member._id.toString(),



        owner:

          owner._id.toString(),



        roleId:

          member.roleId?._id

            ? member.roleId._id.toString()

           : null,



        role:

          member.roleId?.name ||

          "Team Member",



        permissions:

          member.roleId?.permissions ||

          [],

      },

    });

  } catch (error) {

    console.error(

      "Accept team invitation error:",

      error

    );



    if (error?.code === 11000) {

      return res.status(409).json({

        success: false,

        message:

          "An account with this email already exists",

      });

    }



    return res.status(500).json({

      success: false,

      message:

        "Unable to accept invitation",

    });

  }

};