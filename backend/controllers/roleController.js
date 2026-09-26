const jwt = require("jsonwebtoken");
const Role = require("../models/Role");

const getUserId = (req) => {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      authorization.slice(7),
      process.env.JWT_SECRET
    );

    return decoded.id;
  } catch (error) {
    return null;
  }
};

exports.listRoles = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const roles = await Role.find({
      status: "active",
      isSystemRole: true,
    })
      .select("_id name slug permissions isSystemRole status")
      .sort({
        name: 1,
      })
      .lean();

    return res.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error("List roles error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load roles.",
    });
  }
};

exports.createRole = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Roles are predefined by SaleVitals and cannot be created.",
  });
};

exports.updateRole = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "System roles are managed by SaleVitals and cannot be modified.",
  });
};

exports.updateRoleStatus = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "System roles are managed by SaleVitals and cannot be modified.",
  });
};

exports.deleteRole = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "System roles cannot be deleted.",
  });
};