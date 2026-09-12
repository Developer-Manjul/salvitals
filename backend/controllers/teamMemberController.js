const jwt = require("jsonwebtoken");
const TeamMember = require("../models/TeamMember");

const getUserId = (req) => {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const decoded = jwt.verify(
    authorization.slice(7),
    process.env.JWT_SECRET
  );

  return decoded.id;
};

exports.listTeamMembers = async (req, res) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const members = await TeamMember.find({ owner })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("List team members error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

exports.createTeamMember = async (req, res) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, speciality, phone, email } = req.body;

    if (!String(name || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    const member = await TeamMember.create({
      owner,
      name: String(name).trim(),
      speciality: String(speciality || "").trim(),
      phone: String(phone || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      status: "active",
    });

    return res.status(201).json({
      success: true,
      member,
    });
  } catch (error) {
    console.error("Create team member error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to add team member.",
    });
  }
};

exports.updateTeamMemberStatus = async (req, res) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const status = req.body.status === "inactive" ? "inactive" : "active";
    const member = await TeamMember.findOneAndUpdate(
      { _id: req.params.id, owner },
      { status },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found.",
      });
    }

    return res.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error("Update team member status error:", error);
    return res.status(400).json({
      success: false,
      message: "Unable to update team member status.",
    });
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, speciality, phone, email } = req.body;

    if (!String(name || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    const member = await TeamMember.findOneAndUpdate(
      { _id: req.params.id, owner },
      {
        name: String(name).trim(),
        speciality: String(speciality || "").trim(),
        phone: String(phone || "").trim(),
        email: String(email || "").trim().toLowerCase(),
      },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found.",
      });
    }

    return res.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error("Update team member error:", error);
    return res.status(400).json({
      success: false,
      message: "Unable to update team member.",
    });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const owner = getUserId(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const member = await TeamMember.findOneAndDelete({
      _id: req.params.id,
      owner,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found.",
      });
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete team member error:", error);
    return res.status(400).json({
      success: false,
      message: "Unable to delete team member.",
    });
  }
};
