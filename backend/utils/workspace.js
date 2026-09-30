const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TeamMember = require("../models/TeamMember");

const getTokenUser = (req) => {
  const authorization =
    req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token =
      authorization.slice(7);

    return jwt.verify(
      token,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return null;
  }
};

const getWorkspaceContext = async (req) => {
  const decoded = getTokenUser(req);

  if (!decoded?.id) {
    return null;
  }

  const user =
    await User.findById(decoded.id).lean();

  if (!user) {
    return null;
  }

  if (user.isActive === false) {
    return null;
  }

  const isOwner =
    !user.workspaceOwner;

  const workspaceOwnerId =
    isOwner
      ? user._id.toString()
      : user.workspaceOwner.toString();

  if (isOwner) {
    return {
      user,

      userId:
        user._id.toString(),

      workspaceOwnerId,

      isOwner: true,

      isTeamMember: false,

      teamMember: null,

      role: {
        name: "Owner",
        slug: "owner",
        permissions: ["*"],
      },

      permissions: ["*"],
    };
  }

  const teamMember =
    await TeamMember.findOne({
      userId: user._id,
      owner: user.workspaceOwner,
      memberType: "team",
      status: "active",
      invitationStatus: "accepted",
    })
      .populate(
        "roleId",
        "name slug permissions status isSystemRole"
      )
      .lean();

  if (!teamMember) {
    return null;
  }

  if (!teamMember.roleId) {
    return null;
  }

  if (
    teamMember.roleId.status !== "active"
  ) {
    return null;
  }

  const permissions = Array.isArray(
    teamMember.roleId.permissions
  )
    ? teamMember.roleId.permissions
    : [];

  return {
    user,

    userId:
      user._id.toString(),

    workspaceOwnerId,

    isOwner: false,

    isTeamMember: true,

    teamMember,

    role: teamMember.roleId,

    permissions,
  };
};

const hasPermission = (
  context,
  permission
) => {
  if (!context) {
    return false;
  }

  if (context.isOwner) {
    return true;
  }

  if (
    !Array.isArray(
      context.permissions
    )
  ) {
    return false;
  }

  if (
    context.permissions.includes("*")
  ) {
    return true;
  }

  return context.permissions.includes(
    permission
  );
};

const requirePermission = (
  context,
  permission
) => {
  return hasPermission(
    context,
    permission
  );
};

module.exports = {
  getTokenUser,
  getWorkspaceContext,
  hasPermission,
  requirePermission,
};