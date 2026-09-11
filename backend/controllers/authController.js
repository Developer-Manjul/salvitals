const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");


/* =====================================================
   JWT TOKEN
===================================================== */

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );


/* =====================================================
   USER RESPONSE
===================================================== */

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

  clinicLogo: user.clinicLogo || "",

  accountSetupCompleted: user.accountSetupCompleted === true,

  role: user.role,

  isActive: user.isActive,

  emailVerified: !!user.emailVerified,
});


/* =====================================================
   CREATE VERIFICATION TOKEN
===================================================== */

const createVerificationToken = () => {

  const rawToken =
    crypto
      .randomBytes(32)
      .toString("hex");


  const hashedToken =
    crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");


  return {

    rawToken,

    hashedToken,

    // 1 HOUR
    expires:
      new Date(
        Date.now() +
        60 * 60 * 1000
      ),

  };

};


/* =====================================================
   SEND VERIFICATION EMAIL
===================================================== */

async function sendVerificationEmail(user, token) {

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {

    throw new Error(
      "SMTP configuration is missing"
    );

  }


  const transporter =
    nodemailer.createTransport({

      host:
        process.env.SMTP_HOST,

      port:
        Number(
          process.env.SMTP_PORT || 587
        ),

      secure:
        String(
          process.env.SMTP_SECURE
        ) === "true",

      auth: {

        user:
          process.env.SMTP_USER,

        pass:
          process.env.SMTP_PASS,

      },

    });


  const base =
    (
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    )
      .replace(/\/$/, "");


  const verificationUrl =
    `${base}/verify-email?token=${encodeURIComponent(
      token
    )}`;


  await transporter.sendMail({

    from:
      `"SaleVitals" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,

    to:
      user.email,

    subject:
      "Verify your SaleVitals email",


    html: `
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
            border-radius:16px;
            overflow:hidden;
            box-shadow:
              0 10px 40px
              rgba(0,0,0,0.08);
          "
        >


          <!-- =========================
               HEADER
          ========================== -->

          <tr>

            <td
              style="
                background:
                  linear-gradient(
                    135deg,
                    #315b9d,
                    #23467d
                  );

                padding:
                  32px 40px;

                text-align:center;
              "
            >

              <div
                style="
                  display:inline-block;

                  width:52px;
                  height:52px;

                  line-height:52px;

                  border-radius:14px;

                  background:#ffffff;

                  color:#315b9d;

                  font-size:24px;

                  font-weight:700;

                  margin-bottom:12px;
                "
              >
                S
              </div>


              <div
                style="
                  color:#ffffff;

                  font-size:26px;

                  font-weight:700;

                  letter-spacing:0.3px;
                "
              >
                SaleVitals
              </div>


              <div
                style="
                  color:
                    rgba(255,255,255,0.75);

                  font-size:13px;

                  margin-top:7px;
                "
              >
                Grow smarter. Sell better.
              </div>


            </td>

          </tr>



          <!-- =========================
               CONTENT
          ========================== -->

          <tr>

            <td
              style="
                padding:
                  48px 45px
                  40px;
              "
            >


              <!-- ICON -->

              <div
                style="
                  width:70px;
                  height:70px;

                  margin:
                    0 auto
                    25px;

                  border-radius:50%;

                  background:#eef4ff;

                  text-align:center;

                  line-height:70px;

                  font-size:32px;
                "
              >
                👋
              </div>



              <!-- HEADING -->

              <h1
                style="
                  margin:
                    0 0
                    20px;

                  text-align:center;

                  color:#1f2937;

                  font-size:28px;

                  line-height:1.3;

                  font-weight:700;
                "
              >
                Welcome to SaleVitals
              </h1>



              <!-- TEXT -->

              <p
                style="
                  margin:
                    0 0
                    18px;

                  color:#4b5563;

                  font-size:16px;

                  line-height:1.7;
                "
              >
                Thanks for creating your
                SaleVitals account.
              </p>



              <p
                style="
                  margin:
                    0 0
                    30px;

                  color:#4b5563;

                  font-size:16px;

                  line-height:1.7;
                "
              >
                You're one step away from
                getting started.

                Please verify your email
                address to activate your
                account and continue
                setting up your CRM workspace.
              </p>



              <!-- BUTTON -->

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

                      style="
                        display:inline-block;

                        background:
                          linear-gradient(
                            135deg,
                            #315b9d,
                            #23467d
                          );

                        color:#ffffff;

                        text-decoration:none;

                        padding:
                          16px
                          34px;

                        border-radius:8px;

                        font-size:16px;

                        font-weight:700;

                        box-shadow:
                          0 8px 20px
                          rgba(
                            49,
                            91,
                            157,
                            0.25
                          );
                      "
                    >
                      ✓ Verify My Email
                    </a>

                  </td>

                </tr>

              </table>



              <!-- EXPIRY BOX -->

              <div
                style="
                  margin-top:35px;

                  padding:18px 20px;

                  background:#fff8e8;

                  border:
                    1px solid
                    #f6dfa4;

                  border-radius:10px;

                  color:#7a5b12;

                  font-size:14px;

                  line-height:1.6;
                "
              >
                ⏰

                <strong>
                  Important:
                </strong>

                This verification link will
                expire in
                <strong>
                  1 hour.
                </strong>

              </div>



              <!-- SECURITY MESSAGE -->

              <p
                style="
                  margin-top:30px;

                  color:#6b7280;

                  font-size:13px;

                  line-height:1.7;
                "
              >
                If you did not create a
                SaleVitals account, you can
                safely ignore this email.
              </p>



              <!-- LINK FALLBACK -->

              <p
                style="
                  margin-top:25px;

                  color:#9ca3af;

                  font-size:12px;

                  line-height:1.6;
                  word-break:break-all;
                "
              >
                If the button doesn't work,
                copy and paste this link into
                your browser:
                <br>

                <a
                  href="${verificationUrl}"
                  style="
                    color:#315b9d;
                    text-decoration:none;
                  "
                >
                  ${verificationUrl}
                </a>

              </p>


            </td>

          </tr>



          <!-- =========================
               FOOTER
          ========================== -->

          <tr>

            <td
              style="
                background:#f8fafc;

                padding:
                  25px
                  40px;

                text-align:center;

                border-top:
                  1px solid
                  #e5e7eb;
              "
            >

              <p
                style="
                  margin:0 0 8px;

                  color:#374151;

                  font-size:14px;

                  font-weight:600;
                "
              >
                SaleVitals Team
              </p>


              <p
                style="
                  margin:0;

                  color:#9ca3af;

                  font-size:12px;
                "
              >
                Secure CRM for smarter
                sales management
              </p>


            </td>

          </tr>


        </table>


        <p
          style="
            margin-top:22px;

            color:#9ca3af;

            font-size:12px;
          "
        >
          © ${new Date().getFullYear()}
          SaleVitals.
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

}


/* =====================================================
   REGISTER
===================================================== */

exports.register =
  async (req, res) => {

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
        String(
          name ||
          personName ||
          ""
        ).trim();


      const finalEmail =
        String(
          email ||
          workEmail ||
          ""
        )
          .trim()
          .toLowerCase();


      const finalClinic =
        String(
          clinicName ||
          businessName ||
          ""
        ).trim();


      if (!finalName) {

        return res
          .status(400)
          .json({

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

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please enter a valid email",

          });

      }


      if (!finalClinic) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Business Name is required",

          });

      }


      if (
        !password ||
        password.length < 8
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Password must be at least 8 characters",

          });

      }


      const existingUser =
        await User.findOne({

          email:
            finalEmail,

        });


      /* =========================================
         USER ALREADY EXISTS
      ========================================== */

      if (existingUser) {


        if (
          existingUser.emailVerified
        ) {

          return res
            .status(409)
            .json({

              success: false,

              message:
                "An account with this email already exists",

            });

        }


        const {

          rawToken,

          hashedToken,

          expires,

        } =
          createVerificationToken();


        existingUser.emailVerificationToken =
          hashedToken;


        existingUser.emailVerificationExpires =
          expires;


        await existingUser.save();


        await sendVerificationEmail(
          existingUser,
          rawToken
        );


        return res
          .status(200)
          .json({

            success: true,

            message:
              "Your account already exists but is not verified. A new verification email has been sent.",

            emailVerificationRequired:
              true,

            email:
              existingUser.email,

          });

      }


      /* =========================================
         CREATE NEW USER
      ========================================== */

      const {

        rawToken,

        hashedToken,

        expires,

      } =
        createVerificationToken();


      const user =
        await User.create({

          name:
            finalName,

          email:
            finalEmail,


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


          emailVerified:
            false,


          emailVerificationToken:
            hashedToken,


          emailVerificationExpires:
            expires,

        });


      await sendVerificationEmail(
        user,
        rawToken
      );


      return res
        .status(201)
        .json({

          success: true,

          message:
            "Account created. Please verify your email.",


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

        return res
          .status(409)
          .json({

            success: false,

            message:
              "An account with this email already exists",

          });

      }


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Server error while creating account",

        });

    }

  };


/* =====================================================
   VERIFY EMAIL
===================================================== */

exports.verifyEmail =
  async (req, res) => {

    try {

      const token =
        String(

          req.body.token ||
          req.query.token ||
          ""

        ).trim();


      if (!token) {

        return res
          .status(400)
          .json({

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

        return res
          .status(400)
          .json({

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


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to verify email",

        });

    }

  };


/* =====================================================
   RESEND VERIFICATION EMAIL
===================================================== */

exports.resendVerification =
  async (req, res) => {

    try {

      const email =
        String(
          req.body.email || ""
        )
          .trim()
          .toLowerCase();


      if (!email) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Email is required",

          });

      }


      const user =
        await User.findOne({

          email,

        });


      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Account not found",

          });

      }


      if (
        user.emailVerified
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Email is already verified",

          });

      }


      const {

        rawToken,

        hashedToken,

        expires,

      } =
        createVerificationToken();


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
        error.message
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to resend verification email",

        });

    }

  };


/* =====================================================
   LOGIN
===================================================== */

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

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Invalid email or password",

          });

      }


      /* EMAIL NOT VERIFIED */

      if (
        !user.emailVerified
      ) {

        return res
          .status(403)
          .json({

            success: false,

            message:
              "Please verify your email before logging in.",

            emailVerificationRequired:
              true,

            email:
              user.email,

          });

      }


      /* ACCOUNT INACTIVE */

      if (
        user.isActive === false
      ) {

        return res
          .status(403)
          .json({

            success: false,

            message:
              "Your account is inactive",

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


      console.error(
        "Login error:",
        error.message
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Login failed",

        });

    }

  };


/* =====================================================
   COMPLETE ACCOUNT SETUP
===================================================== */

exports.completeSetup =
  async (req, res) => {

    try {

      const authorization =
        req.headers.authorization || "";

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

      const user = await User.findById(decoded.id);

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

      user.displayName = String(displayName || "").trim();
      user.address = String(address || "").trim();
      user.gstin = String(gstin || "").trim().toUpperCase();
      user.zipCode = String(zipCode || "").trim();
      user.website = String(website || "").trim();
      user.clinicLogo = String(clinicLogo || "").trim();
      user.accountSetupCompleted = true;

      await user.save();

      return res.json({
        success: true,
        user: formatUserResponse(user),
      });

    } catch (error) {

      console.error("Complete setup error:", error.message);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });

    }

  };

  exports.getProfile = async (req, res) => {
    try {
        const authorization =
            req.headers.authorization || "";

        if (!authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const token =
            authorization.slice(7);

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User.findById(
                decoded.id
            ).select(
                "-password -emailVerificationToken -emailVerificationExpires"
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user,
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


exports.updateProfile = async (req, res) => {
    try {
        const authorization =
            req.headers.authorization || "";

        if (!authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const token =
            authorization.slice(7);

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User.findById(
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
        } = req.body;

        if (name !== undefined) {
            user.name =
                String(name).trim();
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

        await user.save();

        const updatedUser =
            await User.findById(
                user._id
            ).select(
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