const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    memberType: {
      type: String,
      enum: ["doctor", "team"],
      required: true,
      default: "team",
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    inviteToken: {
      type: String,
      default: "",
      index: true,
    },

    inviteExpiresAt: {
      type: Date,
      default: null,
    },

    invitedAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    invitationStatus: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "expired",
      ],
      default: "pending",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TeamMember",
  teamMemberSchema
);