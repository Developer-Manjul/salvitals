function parseLocalDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isLeadWithinDateRange(value, fromDate = "", toDate = "") {
  if (!fromDate && !toDate) return true;

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;

  const start = fromDate ? parseLocalDate(fromDate) : null;
  const end = toDate ? parseLocalDate(toDate) : null;

  if ((fromDate && !start) || (toDate && !end)) return false;

  if (start && end && start.getTime() > end.getTime()) return false;
  if (start && timestamp < start.getTime()) return false;

  if (end) {
    end.setDate(end.getDate() + 1);
    if (timestamp >= end.getTime()) return false;
  }

  return true;
}
