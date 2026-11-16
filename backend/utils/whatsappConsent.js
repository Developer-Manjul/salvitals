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

module.exports = {
    isExplicitWhatsAppOptIn,
};
