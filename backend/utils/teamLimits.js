const TEAM_LIMITS = Object.freeze({
  starter: 1,
  growth: 3,
  scale: 5,
});

function normalizeTeamPlanId(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getTeamMemberLimit(planId) {
  const normalized =
    normalizeTeamPlanId(planId);

  const totalSeats =
    TEAM_LIMITS[normalized] ?? 0;

  return Math.max(
    totalSeats - 1,
    0
  );
}

module.exports = {
  TEAM_LIMITS,
  getTeamMemberLimit,
  normalizeTeamPlanId,
};