const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const TeamMember = require("../models/TeamMember");
const Role = require("../models/Role");

const { getActivePlan } = require("../utils/contactLimits");
const { getTeamMemberLimit } = require("../utils/teamLimits");

/*
|--------------------------------------------------------------------------
| Get logged-in user ID
|--------------------------------------------------------------------------
*/

const getUserId = (req) => {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7);

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  return decoded.id;
};

/*
|--------------------------------------------------------------------------
| Create invitation token
|--------------------------------------------------------------------------
*/

const createInviteToken = () => {
  const rawToken = crypto
    .randomBytes(32)
    .toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return {
    rawToken,
    hashedToken,
    expires: new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ),
  };
};

/*
|--------------------------------------------------------------------------
| Send invitation email
|--------------------------------------------------------------------------
*/

const sendInvitationEmail = async ({
  member,
  role,
  token,
}) => {
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

  const base = (
    process.env.FRONTEND_URL ||
    "https://salevitals.com"
  ).replace(/\/$/, "");

  const invitationUrl =
    `${base}/team-invite?token=${encodeURIComponent(
      token
    )}`;

  await transporter.sendMail({
    from: `"SaleVitals" <${
      process.env.SMTP_FROM ||
      process.env.SMTP_USER
    }>`,
    to: member.email,
    subject:
      "You're invited to join SaleVitals",

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>SaleVitals Team Invitation</title>
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

<div
  style="
    color:#173766;
    font-size:25px;
    line-height:32px;
    font-weight:700;
  "
>
  SaleVitals
</div>

<div
  style="
    margin-top:4px;
    color:#6b7280;
    font-size:11px;
    line-height:16px;
  "
>
  SECURE CLINIC GROWTH CRM
</div>

</td>
</tr>

<tr>
<td style="padding:35px 55px 40px;">

<div
  style="
    width:54px;
    height:54px;
    margin:0 auto 18px;
    border-radius:50%;
    background:#eef4ff;
    text-align:center;
    line-height:54px;
    font-size:25px;
  "
>
  ✉
</div>

<h1
  style="
    margin:0 0 14px;
    text-align:center;
    color:#1f2937;
    font-size:24px;
    line-height:1.35;
  "
>
  You're invited to join SaleVitals
</h1>

<p
  style="
    margin:0 0 18px;
    color:#4b5563;
    font-size:15px;
    line-height:1.7;
  "
>
  Hi ${member.name || "there"},
</p>

<p
  style="
    margin:0 0 20px;
    color:#4b5563;
    font-size:15px;
    line-height:1.7;
  "
>
  You have been invited to join a SaleVitals
  workspace as
  <strong>${role?.name || "Team Member"}</strong>.
</p>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    margin:20px 0;
    background:#f8fafc;
    border:1px solid #e5e7eb;
    border-radius:8px;
  "
>
<tr>
<td
  style="
    padding:16px 18px;
    color:#374151;
    font-size:14px;
    line-height:1.6;
  "
>
  <strong>Name:</strong> ${member.name}<br>
  <strong>Email:</strong> ${member.email}<br>
  <strong>Role:</strong> ${
    role?.name || "Team Member"
  }
</td>
</tr>
</table>

<p
  style="
    margin:0 0 25px;
    color:#4b5563;
    font-size:15px;
    line-height:1.7;
  "
>
  Click the button below to accept the invitation
  and create your SaleVitals login account.
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
  href="${invitationUrl}"
  target="_blank"
  style="
    display:inline-block;
    background:#1769d1;
    color:#ffffff;
    text-decoration:none;
    padding:14px 34px;
    border-radius:6px;
    font-size:15px;
    line-height:20px;
    font-weight:700;
  "
>
  Accept Invitation →
</a>

</td>
</tr>
</table>

<div
  style="
    margin-top:28px;
    padding:15px 18px;
    background:#fff8eb;
    border:1px solid #f5dfad;
    border-radius:8px;
    color:#8a6116;
    font-size:13px;
    line-height:1.6;
  "
>
  This invitation link will expire in
  <strong>24 hours.</strong>
</div>

<p
  style="
    margin:25px 0 0;
    color:#6b7280;
    font-size:12px;
    line-height:1.7;
  "
>
  If you were not expecting this invitation,
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
  href="${invitationUrl}"
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
  ${invitationUrl}
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
    margin:0;
    color:#9ca3af;
    font-size:10px;
    line-height:1.5;
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

/*
|--------------------------------------------------------------------------
| LIST TEAM MEMBERS / DOCTORS
|--------------------------------------------------------------------------
*/

exports.listTeamMembers = async (
  req,
  res
) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const filter = {
      owner,
    };

    if (
      req.query.type === "doctor" ||
      req.query.type === "team"
    ) {
      filter.memberType =
        req.query.type;
    }

    const members =
      await TeamMember.find(filter)
        .populate(
          "roleId",
          "name permissions status"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    let teamUsage = null;

    /*
     * IMPORTANT
     *
     * getTeamMemberLimit() returns ONLY
     * team-member seats.
     *
     * Growth:
     * total plan seats = 3
     * owner = 1
     * team members = 2
     */

    if (
      req.query.type === "team"
    ) {
      const activePlan =
        await getActivePlan(owner);

      const teamMemberLimit =
        getTeamMemberLimit(
          activePlan.planId
        );

      const teamMemberUsed =
        await TeamMember.countDocuments({
          owner,
          memberType: "team",
        });

      const totalSeats =
        teamMemberLimit + 1;

      const usedSeats =
        teamMemberUsed + 1;

      const availableTeamMembers =
        Math.max(
          teamMemberLimit -
            teamMemberUsed,
          0
        );

      teamUsage = {
        planId:
          activePlan.planId,

        planName:
          activePlan.planName,

        /*
         * Team members allowed
         *
         * Growth = 2
         * Scale  = 4
         */
        limit:
          teamMemberLimit,

        used:
          teamMemberUsed,

        available:
          availableTeamMembers,

        /*
         * Total users including owner
         *
         * Growth = 3
         * Scale  = 5
         */
        totalSeats,

        /*
         * Current users including owner
         *
         * No team member = 1
         * One team member = 2
         */
        usedSeats,

        availableSeats:
          availableTeamMembers,
      };
    }

    return res.json({
      success: true,
      members,
      teamUsage,
    });
  } catch (error) {
    console.error(
      "List team members error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token",
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE TEAM MEMBER / DOCTOR
|--------------------------------------------------------------------------
*/

exports.createTeamMember = async (
  req,
  res
) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const memberType =
      req.body.memberType === "doctor"
        ? "doctor"
        : "team";

    const name = String(
      req.body.name || ""
    ).trim();

    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      req.body.phone || ""
    ).trim();

    const speciality = String(
      req.body.speciality || ""
    ).trim();

    const roleId = String(
      req.body.roleId || ""
    ).trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          memberType === "doctor"
            ? "Doctor name is required."
            : "Team member name is required.",
      });
    }

    if (
      memberType === "team" &&
      !email
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (
      memberType === "team" &&
      !roleId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a role.",
      });
    }

    let role = null;

    /*
     * TEAM ROLE VALIDATION
     */

    if (
      memberType === "team"
    ) {
      role =
        await Role.findOne({
          _id: roleId,
          owner,
          status: "active",
        });

      if (!role) {
        return res.status(400).json({
          success: false,
          message:
            "Selected role was not found or is inactive.",
        });
      }

      /*
       * PLAN LIMIT
       *
       * getTeamMemberLimit()
       * already returns TEAM MEMBER
       * limit, excluding owner.
       *
       * Growth = 2 team members
       * Scale  = 4 team members
       */

      const activePlan =
        await getActivePlan(owner);

      const teamMemberLimit =
        getTeamMemberLimit(
          activePlan.planId
        );

      const currentTeamMemberCount =
        await TeamMember.countDocuments({
          owner,
          memberType: "team",
        });

      /*
       * IMPORTANT:
       *
       * Do NOT add owner here.
       *
       * We are comparing:
       *
       * team members used
       * vs
       * team members allowed
       */

      if (
        teamMemberLimit <= 0 ||
        currentTeamMemberCount >=
          teamMemberLimit
      ) {
        const totalSeats =
          teamMemberLimit + 1;

        const usedSeats =
          currentTeamMemberCount + 1;

        return res.status(403).json({
          success: false,

          code:
            "TEAM_MEMBER_LIMIT_REACHED",

          message:
            activePlan.planId
              ? `Your ${
                  activePlan.planName
                } plan includes ${
                  totalSeats
                } user${
                  totalSeats === 1
                    ? ""
                    : "s"
                } including the owner. You can add up to ${
                  teamMemberLimit
                } team member${
                  teamMemberLimit === 1
                    ? ""
                    : "s"
                }.`
              : "You need an active subscription plan to add team members.",

          plan: {
            planId:
              activePlan.planId,

            planName:
              activePlan.planName,

            totalSeats,

            usedSeats,

            teamMemberLimit,

            teamMemberUsed:
              currentTeamMemberCount,

            available:
              Math.max(
                teamMemberLimit -
                  currentTeamMemberCount,
                0
              ),
          },
        });
      }
    }

    /*
     * DUPLICATE EMAIL CHECK
     */

    if (email) {
      const existingMember =
        await TeamMember.findOne({
          owner,
          email,
          memberType,
        });

      if (existingMember) {
        return res.status(409).json({
          success: false,
          message:
            "A member with this email already exists.",
        });
      }
    }

    /*
     * CREATE MEMBER
     */

    const member =
      await TeamMember.create({
        owner,

        memberType,

        name,

        roleId:
          memberType === "team"
            ? role._id
            : null,

        phone:
          memberType === "doctor"
            ? phone
            : "",

        email,

        status: "active",

        invitationStatus:
          memberType === "team"
            ? "pending"
            : "accepted",
      });

    /*
     * SEND TEAM INVITATION
     */

    if (
      memberType === "team"
    ) {
      try {
        const {
          rawToken,
          hashedToken,
          expires,
        } =
          createInviteToken();

        member.inviteToken =
          hashedToken;

        member.inviteExpiresAt =
          expires;

        member.invitedAt =
          new Date();

        member.invitationStatus =
          "pending";

        await member.save();

        await sendInvitationEmail({
          member,
          role,
          token: rawToken,
        });
      } catch (emailError) {
        console.error(
          "Team invitation email error:",
          emailError
        );

        await TeamMember.deleteOne({
          _id: member._id,
          owner,
        });

        return res.status(500).json({
          success: false,
          message:
            emailError.message ||
            "Unable to send invitation email.",
        });
      }
    }

    /*
     * RETURN POPULATED MEMBER
     */

    const populatedMember =
      await TeamMember.findById(
        member._id
      )
        .populate(
          "roleId",
          "name permissions status"
        )
        .lean();

    return res.status(201).json({
      success: true,

      message:
        memberType === "team"
          ? "Team member added and invitation sent successfully."
          : "Doctor added successfully.",

      member:
        populatedMember,
    });
  } catch (error) {
    console.error(
      "Create team member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to add team member.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE TEAM MEMBER STATUS
|--------------------------------------------------------------------------
*/

exports.updateTeamMemberStatus =
  async (req, res) => {
    try {
      const owner =
        getUserId(req);

      if (!owner) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const status =
        req.body.status ===
        "inactive"
          ? "inactive"
          : "active";

      const member =
        await TeamMember.findOneAndUpdate(
          {
            _id: req.params.id,
            owner,
          },
          {
            status,
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          "roleId",
          "name permissions status"
        );

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Team member not found.",
        });
      }

      return res.json({
        success: true,
        member,
      });
    } catch (error) {
      console.error(
        "Update team member status error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          "Unable to update team member status.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE TEAM MEMBER / DOCTOR
|--------------------------------------------------------------------------
*/

exports.updateTeamMember =
  async (req, res) => {
    try {
      const owner =
        getUserId(req);

      if (!owner) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const member =
        await TeamMember.findOne({
          _id: req.params.id,
          owner,
        });

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Team member not found.",
        });
      }

      const name = String(
        req.body.name || ""
      ).trim();

      const email = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            "Name is required.",
        });
      }

      if (
        member.memberType ===
          "team" &&
        !email
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required.",
        });
      }

      /*
       * DOCTOR UPDATE
       */

      if (
        member.memberType ===
        "doctor"
      ) {
        member.name =
          name;

        member.speciality =
          String(
            req.body.speciality ||
              ""
          ).trim();

        member.phone =
          String(
            req.body.phone ||
              ""
          ).trim();

        member.email =
          email;
      }

      /*
       * TEAM UPDATE
       */

      else {
        const roleId =
          String(
            req.body.roleId ||
              ""
          ).trim();

        if (!roleId) {
          return res.status(400).json({
            success: false,
            message:
              "Please select a role.",
          });
        }

        const role =
          await Role.findOne({
            _id: roleId,
            owner,
            status: "active",
          });

        if (!role) {
          return res.status(400).json({
            success: false,
            message:
              "Selected role was not found or is inactive.",
          });
        }

        member.name =
          name;

        member.email =
          email;

        member.roleId =
          role._id;
      }

      await member.save();

      const updatedMember =
        await TeamMember.findById(
          member._id
        )
          .populate(
            "roleId",
            "name permissions status"
          )
          .lean();

      return res.json({
        success: true,
        member:
          updatedMember,
      });
    } catch (error) {
      console.error(
        "Update team member error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to update team member.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE TEAM MEMBER / DOCTOR
|--------------------------------------------------------------------------
*/

exports.deleteTeamMember =
  async (req, res) => {
    try {
      const owner =
        getUserId(req);

      if (!owner) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const member =
        await TeamMember.findOneAndDelete({
          _id: req.params.id,
          owner,
        });

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "Team member not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Team member deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete team member error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          "Unable to delete team member.",
      });
    }
  };