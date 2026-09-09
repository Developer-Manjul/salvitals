const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

const formatUserResponse = (user) => ({
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
  role: user.role,
  isActive: user.isActive,
  emailVerified: !!user.emailVerified,
});

async function sendVerificationEmail(user, token) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return false;
  }

  const transporter =
    nodemailer.createTransport({
      host: process.env.SMTP_HOST,

      port: Number(
        process.env.SMTP_PORT || 587
      ),

      secure:
        String(
          process.env.SMTP_SECURE
        ) === "true",

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

  const base =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  const verificationUrl =
    `${base}/verify-email?token=${encodeURIComponent(
      token
    )}`;

  await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      process.env.SMTP_USER,

    to: user.email,

    subject:
      "Verify your SaleVitals email",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
      ">
        <h2>
          Welcome to SaleVitals
        </h2>

        <p>
          Thank you for creating your account.
        </p>

        <p>
          Please verify your email address
          to continue setting up your account.
        </p>

        <p style="
          margin: 30px 0;
        ">
          <a
            href="${verificationUrl}"
            style="
              display: inline-block;
              padding: 14px 24px;
              background: #315b9d;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
            "
          >
            Verify Email
          </a>
        </p>

        <p>
          This verification link expires
          in 24 hours.
        </p>

        <p>
          SaleVitals Team
        </p>
      </div>
    `,
  });

  return true;
}

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

    const finalName =
      (
        name ||
        personName ||
        ""
      ).trim();

    const finalEmail =
      (
        email ||
        workEmail ||
        ""
      )
        .trim()
        .toLowerCase();

    const finalClinic =
      (
        clinicName ||
        businessName ||
        ""
      ).trim();

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message:
          "Name is required",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        finalEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email",
      });
    }

    if (!finalClinic) {
      return res.status(400).json({
        success: false,
        message:
          "Business Name is required",
      });
    }

    if (
      !password ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters",
      });
    }

    if (
      phone &&
      !/^\+?[0-9]{7,15}$/.test(
        String(phone).trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid phone number",
      });
    }

    const existingUser =
      await User.findOne({
        email: finalEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const rawToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const user =
      await User.create({
        name: finalName,
        email: finalEmail,

        password:
          await bcrypt.hash(
            password,
            12
          ),

        clinicName:
          finalClinic,

        phone:
          String(
            phone || ""
          ).trim(),

        phoneCountryCode:
          String(
            phoneCountryCode || ""
          ).trim(),

        speciality:
          String(
            speciality || ""
          ).trim(),

        numberOfDoctors:
          String(
            numberOfDoctors || ""
          ).trim(),

        displayName:
          String(
            displayName || ""
          ).trim(),

        address:
          String(
            address || ""
          ).trim(),

        gstin:
          String(
            gstin || ""
          )
            .trim()
            .toUpperCase(),

        zipCode:
          String(
            zipCode || ""
          ).trim(),

        website:
          String(
            website || ""
          ).trim(),

        emailVerified: false,

        emailVerificationToken:
          hashedToken,

        emailVerificationExpires:
          new Date(
            Date.now() +
            24 * 60 * 60 * 1000
          ),
      });

    let verificationEmailSent =
      false;

    try {
      verificationEmailSent =
        await sendVerificationEmail(
          user,
          rawToken
        );
    } catch (error) {
      console.error(
        "Verification email error:",
        error.message
      );
    }

    return res.status(201).json({
      success: true,

      message:
        verificationEmailSent
          ? "Account created. Please verify your email."
          : "Account created. Email delivery failed.",

      token:
        generateToken(user),

      user:
        formatUserResponse(user),

      emailVerificationRequired:
        true,
    });

  } catch (error) {

    console.error(
      "Register error:",
      error
    );

    if (
      error?.code === 11000
    ) {
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

exports.verifyEmail =
  async (req, res) => {

    try {

      const token =
        String(
          req.body.token || ""
        );

      if (!token) {
        return res.status(400).json({
          success: false,
          message:
            "Verification token is missing",
        });
      }

      const hash =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

      const user =
        await User.findOne({
          emailVerificationToken:
            hash,

          emailVerificationExpires: {
            $gt:
              new Date(),
          },
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired verification link",
        });
      }

      user.emailVerified =
        true;

      user.emailVerificationToken =
        undefined;

      user.emailVerificationExpires =
        undefined;

      await user.save();

      return res.json({
        success: true,
        message:
          "Email verified successfully",

        token:
          generateToken(user),

        user:
          formatUserResponse(user),
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

exports.resendVerification =
  async (req, res) => {

    try {

      const user =
        await User.findOne({
          email:
            String(
              req.body.email || ""
            )
              .trim()
              .toLowerCase(),
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Account not found",
        });
      }

      if (user.emailVerified) {
        return res.json({
          success: true,
          message:
            "Email is already verified",
        });
      }

      const rawToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      user.emailVerificationToken =
        crypto
          .createHash("sha256")
          .update(rawToken)
          .digest("hex");

      user.emailVerificationExpires =
        new Date(
          Date.now() +
          24 * 60 * 60 * 1000
        );

      await user.save();

      const sent =
        await sendVerificationEmail(
          user,
          rawToken
        );

      return res.json({
        success: true,

        message:
          sent
            ? "Verification email sent"
            : "Email delivery failed",
      });

    } catch (error) {

      console.error(
        "Resend verification error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to resend verification email",
      });
    }
  };

exports.login =
  async (req, res) => {

    try {

      const email =
        String(
          req.body.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        req.body.password || "";

      const user =
        await User.findOne({
          email,
        });

      if (
        !user ||
        !(
          await bcrypt.compare(
            password,
            user.password
          )
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      return res.json({
        success: true,

        token:
          generateToken(user),

        user:
          formatUserResponse(user),
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          "Login failed",
      });
    }
  };