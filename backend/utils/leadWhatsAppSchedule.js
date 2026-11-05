function normalizedScheduleMode(settings) {
    if (settings?.scheduleMode === "all_day" ||
        settings?.scheduleMode === "24_hours") {
        return "all_day";
    }

    if (settings?.scheduleMode === "custom") {
        return "custom";
    }

    return settings?.sendOutsideWindow === true ? "all_day" : "custom";
}

function isValidTime(value) {
    return typeof value === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidTimezone(timezone) {
    if (!timezone) return false;

    try {
        new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
        return true;
    } catch {
        return false;
    }
}

function isWithinAllowedWindow(settings, now = new Date()) {
    if (normalizedScheduleMode(settings) === "all_day") {
        return true;
    }

    if (!isValidTimezone(settings.timezone) ||
        !isValidTime(settings.startTime) ||
        !isValidTime(settings.endTime)) {
        return false;
    }

    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: settings.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(now);

    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    const current = hour * 60 + minute;
    const [startHour, startMinute] = settings.startTime.split(":").map(Number);
    const [endHour, endMinute] = settings.endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (start === end) return false;
    if (start < end) return current >= start && current < end;
    return current >= start || current < end;
}

module.exports = {
    isValidTime,
    isValidTimezone,
    isWithinAllowedWindow,
    normalizedScheduleMode,
};
