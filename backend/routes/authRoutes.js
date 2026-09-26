const express = require("express");

const {
    register,
    login,
    verifyEmail,
    resendVerification,
    completeSetup,
    getProfile,
    updateProfile,
    getTeamInvitation,
    acceptTeamInvitation,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/verify-email", verifyEmail);

router.post(
    "/resend-verification",
    resendVerification
);

router.post(
    "/complete-setup",
    completeSetup
);

router.get(
    "/profile",
    getProfile
);

router.put(
    "/profile",
    updateProfile
);

// =========================================
// TEAM INVITATION
// =========================================

router.get(
    "/team-invite",
    getTeamInvitation
);

router.post(
    "/team-invite/accept",
    acceptTeamInvitation
);

module.exports = router;