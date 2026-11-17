function isExplicitWhatsAppOptIn(value) {
    if (value === true) {
        return true;
    }

    if (typeof value !== "string") {
        return false;
    }

    return [
        "yes",
        "true",
        "1",
        "on",
        "i agree",
        "agreed",
        "opted in",
    ].includes(value.trim().toLowerCase());
}

function hasExplicitWhatsAppOptIn(fields = {}) {
    if (!fields || typeof fields !== "object") {
        return false;
    }

    return Object.entries(fields).some(([field, value]) => {
        const normalizedField = String(field)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_");

        return (
            normalizedField.includes("whatsapp") &&
            /(consent|opt_?in|agree|receive|subscribe)/.test(normalizedField) &&
            isExplicitWhatsAppOptIn(value)
        );
    });
}

module.exports = {
    isExplicitWhatsAppOptIn,
    hasExplicitWhatsAppOptIn,
};
