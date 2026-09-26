import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/api";

function getToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("vitalsToken") ||
        sessionStorage.getItem("vitalsToken") ||
        ""
    );
}

function getUser() {
    const saved =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

function isHealthcare(user) {
    return (
        String(user?.speciality || "").toLowerCase() ===
        "healthcare"
    );
}

function getInitials(name = "") {
    const value = String(name || "").trim();

    if (!value) return "U";

    return (
        value
            .split(/\s+/)
            .map((item) => item.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U"
    );
}

function dateKey(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatCalendarTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

function getMonthStart(date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
    );
}

function getMonthEnd(date) {
    return new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    );
}

function buildCalendarDays(monthDate) {
    const start = getMonthStart(monthDate);
    const end = getMonthEnd(monthDate);
    const firstDay = start.getDay();
    const totalDays = end.getDate();

    const previousMonthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        0
    );

    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
        const date = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth() - 1,
            previousMonthEnd.getDate() - i
        );

        days.push({
            date,
            currentMonth: false,
        });
    }

    for (let day = 1; day <= totalDays; day++) {
        days.push({
            date: new Date(
                monthDate.getFullYear(),
                monthDate.getMonth(),
                day
            ),
            currentMonth: true,
        });
    }

    let nextDay = 1;

    while (days.length < 42) {
        days.push({
            date: new Date(
                monthDate.getFullYear(),
                monthDate.getMonth() + 1,
                nextDay
            ),
            currentMonth: false,
        });

        nextDay++;
    }

    return days;
}

function getFollowUpStatus(item) {
    const status = String(
        item?.status || ""
    ).toLowerCase();

    if (
        status === "completed" ||
        status === "complete" ||
        status === "done"
    ) {
        return "completed";
    }

    const time = new Date(
        item?.date
    ).getTime();

    if (!Number.isFinite(time)) {
        return "upcoming";
    }

    if (time < Date.now()) {
        return "overdue";
    }

    const today = new Date();
    const target = new Date(item.date);

    if (
        target.getFullYear() === today.getFullYear() &&
        target.getMonth() === today.getMonth() &&
        target.getDate() === today.getDate()
    ) {
        return "today";
    }

    return "upcoming";
}

function normalizeFollowUp(
    lead,
    followUp,
    index
) {
    return {
        ...followUp,
        _id:
            followUp?._id ||
            `${lead._id}-followup-${index}`,
        leadId: lead._id,
        lead,
        name:
            lead.name ||
            "Unnamed lead",
        phone:
            lead.phone || "",
        email:
            lead.email || "",
        service:
            followUp?.service ||
            lead.service ||
            "",
        date:
            followUp?.date,
        note:
            followUp?.note || "",
        purpose:
            followUp?.purpose ||
            followUp?.note ||
            "Follow-up",
        status:
            followUp?.status ||
            "Scheduled",
    };
}

function Icon({
    name,
    size = 18,
}) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const paths = {
        calendar: (
            <>
                <rect
                    x="3"
                    y="4"
                    width="18"
                    height="17"
                    rx="2"
                />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </>
        ),
        chevronLeft: (
            <path d="m15 18-6-6 6-6" />
        ),
        chevronRight: (
            <path d="m9 18 6-6-6-6" />
        ),
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
    };

    return (
        <svg {...common}>
            {paths[name] || paths.calendar}
        </svg>
    );
}

export default function Calendar({
    user: passedUser,
    onOpenLeadDetails,
}) {
    const user =
        passedUser || getUser();

    const healthcare =
        isHealthcare(user);

    const [leads, setLeads] =
        useState([]);

    const [services, setServices] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [
        calendarMonth,
        setCalendarMonth,
    ] = useState(new Date());

    const [showModal, setShowModal] =
        useState(false);

    const [
        selectedLeadId,
        setSelectedLeadId,
    ] = useState("");

    const [leadSearch, setLeadSearch] =
        useState("");

    const [
        showLeadResults,
        setShowLeadResults,
    ] = useState(false);

    const [form, setForm] =
        useState({
            date: "",
            time: "",
            service: "",
            note: "",
        });

    const [saving, setSaving] =
        useState(false);

    const [formError, setFormError] =
        useState("");

    const loadCalendarData =
        async () => {
            const token = getToken();

            if (!token) {
                setLoading(false);
                setError(
                    "Authentication required. Please sign in again."
                );
                return;
            }

            try {
                setLoading(true);
                setError("");

                const [
                    leadsResponse,
                    servicesResponse,
                ] = await Promise.all([
                    fetch(
                        buildApiUrl(
                            "/api/leads"
                        ),
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                    fetch(
                        buildApiUrl(
                            "/api/services"
                        ),
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    ),
                ]);

                const leadsData =
                    await leadsResponse.json();

                const servicesData =
                    await servicesResponse.json();

                if (!leadsResponse.ok) {
                    throw new Error(
                        leadsData?.message ||
                            "Unable to load leads."
                    );
                }

                setLeads(
                    Array.isArray(
                        leadsData?.leads
                    )
                        ? leadsData.leads
                        : []
                );

                if (
                    servicesResponse.ok &&
                    servicesData?.success !== false
                ) {
                    setServices(
                        Array.isArray(
                            servicesData?.services
                        )
                            ? servicesData.services
                            : []
                    );
                } else {
                    setServices([]);
                }
            } catch (err) {
                console.error(
                    "LOAD CALENDAR ERROR:",
                    err
                );

                setError(
                    err.message ||
                        "Unable to load calendar."
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadCalendarData();
    }, []);

    const allFollowUps =
        useMemo(() => {
            const items = [];

            leads.forEach((lead) => {
                if (
                    !Array.isArray(
                        lead.followUps
                    )
                ) {
                    return;
                }

                lead.followUps.forEach(
                    (
                        followUp,
                        index
                    ) => {
                        items.push(
                            normalizeFollowUp(
                                lead,
                                followUp,
                                index
                            )
                        );
                    }
                );
            });

            return items.sort(
                (a, b) =>
                    new Date(
                        a.date
                    ).getTime() -
                    new Date(
                        b.date
                    ).getTime()
            );
        }, [leads]);

    const calendarDays =
        useMemo(
            () =>
                buildCalendarDays(
                    calendarMonth
                ),
            [calendarMonth]
        );

    const calendarFollowUps =
        useMemo(() => {
            const map = {};

            allFollowUps.forEach(
                (item) => {
                    const key =
                        dateKey(
                            item.date
                        );

                    if (!key) return;

                    if (!map[key]) {
                        map[key] = [];
                    }

                    map[key].push(item);
                }
            );

            return map;
        }, [allFollowUps]);

    const updateForm = (
        field,
        value
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const openSchedule = () => {
        setSelectedLeadId("");
        setLeadSearch("");
        setShowLeadResults(false);

        setForm({
            date: "",
            time: "",
            service: "",
            note: "",
        });

        setFormError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setFormError("");
        setShowLeadResults(false);
    };

    const filteredLeadOptions =
        useMemo(() => {
            const query =
                leadSearch
                    .trim()
                    .toLowerCase();

            if (!query) {
                return [];
            }

            return leads
                .filter((lead) => {
                    const name =
                        String(
                            lead?.name ||
                                ""
                        ).toLowerCase();

                    const phone =
                        String(
                            lead?.phone ||
                                ""
                        ).toLowerCase();

                    const email =
                        String(
                            lead?.email ||
                                ""
                        ).toLowerCase();

                    return (
                        name.includes(
                            query
                        ) ||
                        phone.includes(
                            query
                        ) ||
                        email.includes(
                            query
                        )
                    );
                })
                .slice(0, 8);
        }, [
            leads,
            leadSearch,
        ]);

    const selectLead = (
        lead
    ) => {
        if (!lead?._id) {
            return;
        }

        setSelectedLeadId(
            lead._id
        );

        setLeadSearch(
            lead.name || ""
        );

        setShowLeadResults(false);
        setFormError("");

        const leadService =
            String(
                lead?.service ||
                    ""
            ).trim();

        const matchingService =
            services.find(
                (service) =>
                    String(
                        service?.name ||
                            ""
                    )
                        .trim()
                        .toLowerCase() ===
                    leadService.toLowerCase()
            );

        setForm(
            (previous) => ({
                ...previous,
                service:
                    matchingService?.name ||
                    leadService ||
                    "",
            })
        );
    };

    const handleLeadSearch =
        (event) => {
            const value =
                event.target.value;

            setLeadSearch(value);
            setSelectedLeadId("");
            setFormError("");

            if (value.trim()) {
                setShowLeadResults(true);
            } else {
                setShowLeadResults(false);
            }
        };

    const createNewLeadFromSearch =
        async () => {
            const name =
                leadSearch.trim();

            if (!name) {
                return;
            }

            const token =
                getToken();

            if (!token) {
                setFormError(
                    "Your session has expired. Please sign in again."
                );
                return;
            }

            try {
                setSaving(true);
                setFormError("");

                const response =
                    await fetch(
                        buildApiUrl(
                            "/api/leads"
                        ),
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(
                                {
                                    name,
                                    phone: "",
                                    email: "",
                                    source: "Manual",
                                    service: "",
                                    owner:
                                        user?.name ||
                                        "",
                                    stage: "New",
                                    preferredDoctor:
                                        healthcare
                                            ? user?.name ||
                                              ""
                                            : "",
                                    firstNote:
                                        "",
                                }
                            ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Unable to create lead."
                    );
                }

                const createdLead =
                    data?.lead;

                if (
                    !createdLead?._id
                ) {
                    throw new Error(
                        "Lead was created but no lead ID was returned."
                    );
                }

                setLeads(
                    (previous) => [
                        createdLead,
                        ...previous,
                    ]
                );

                setSelectedLeadId(
                    createdLead._id
                );

                setLeadSearch(
                    createdLead.name ||
                        name
                );

                setShowLeadResults(
                    false
                );

                setForm(
                    (previous) => ({
                        ...previous,
                        service:
                            createdLead.service ||
                            "",
                    })
                );
            } catch (err) {
                console.error(
                    "CREATE CALENDAR LEAD ERROR:",
                    err
                );

                setFormError(
                    err.message ||
                        "Unable to create lead."
                );
            } finally {
                setSaving(false);
            }
        };

    const saveFollowUp =
        async (event) => {
            event.preventDefault();

            if (!selectedLeadId) {
                setFormError(
                    healthcare
                        ? "Please select a patient."
                        : "Please select a lead."
                );
                return;
            }

            if (!form.date) {
                setFormError(
                    "Please select a date."
                );
                return;
            }

            if (!form.time) {
                setFormError(
                    "Please select a time."
                );
                return;
            }

            if (!form.service) {
                setFormError(
                    healthcare
                        ? "Please select a treatment."
                        : "Please select a service."
                );
                return;
            }

            const token =
                getToken();

            if (!token) {
                setFormError(
                    "Your session has expired. Please sign in again."
                );
                return;
            }

            try {
                setSaving(true);
                setFormError("");

                const [
                    year,
                    month,
                    day,
                ] = form.date
                    .split("-")
                    .map(Number);

                const [
                    hours,
                    minutes,
                ] = form.time
                    .split(":")
                    .map(Number);

                const dateTime =
                    new Date(
                        year,
                        month - 1,
                        day,
                        hours,
                        minutes,
                        0,
                        0
                    );

                if (
                    Number.isNaN(
                        dateTime.getTime()
                    )
                ) {
                    throw new Error(
                        "Invalid date or time selected."
                    );
                }

                const response =
                    await fetch(
                        buildApiUrl(
                            `/api/leads/${selectedLeadId}/follow-ups`
                        ),
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(
                                {
                                    date:
                                        dateTime.toISOString(),
                                    service:
                                        form.service,
                                    note:
                                        form.note.trim(),
                                    reminder:
                                        true,
                                }
                            ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Unable to schedule follow-up."
                    );
                }

                setShowModal(false);
                setSelectedLeadId("");
                setLeadSearch("");
                setShowLeadResults(
                    false
                );

                setForm({
                    date: "",
                    time: "",
                    service: "",
                    note: "",
                });

                await loadCalendarData();
            } catch (err) {
                console.error(
                    "SAVE CALENDAR FOLLOW UP ERROR:",
                    err
                );

                setFormError(
                    err.message ||
                        "Unable to schedule follow-up."
                );
            } finally {
                setSaving(false);
            }
        };

    const previousMonth =
        () => {
            setCalendarMonth(
                new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() -
                        1,
                    1
                )
            );
        };

    const nextMonth = () => {
        setCalendarMonth(
            new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() +
                    1,
                1
            )
        );
    };

    const goToToday = () => {
        setCalendarMonth(
            new Date()
        );
    };

    const calendarTitle =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                month: "long",
                year: "numeric",
            }
        ).format(calendarMonth);

    const todayKey =
        dateKey(new Date());

    const openLead = (
        leadId
    ) => {
        if (
            typeof onOpenLeadDetails ===
            "function"
        ) {
            onOpenLeadDetails(
                leadId
            );
        }
    };

    return (
        <div className="followups-page calendar-page">
            <div className="followups-head">
                <div>
                    <p className="followups-breadcrumb">
                        People / Calendar
                    </p>

                    <h1>
                        Calendar
                    </h1>

                    <p className="followups-subtitle">
                        View and manage all scheduled
                        follow-ups
                    </p>
                </div>

                <div className="followups-head-actions">
                    <button
                        type="button"
                        className="followups-schedule-btn"
                        onClick={
                            openSchedule
                        }
                    >
                        <Icon
                            name="plus"
                            size={16}
                        />
                        Schedule
                        follow-up
                    </button>
                </div>
            </div>

            <section className="followups-calendar-card">
                <div className="followups-calendar-head">
                    <div className="followups-calendar-title">
                        <button
                            type="button"
                            onClick={
                                previousMonth
                            }
                        >
                            <Icon
                                name="chevronLeft"
                                size={18}
                            />
                        </button>

                        <h2>
                            {
                                calendarTitle
                            }
                        </h2>

                        <button
                            type="button"
                            onClick={
                                nextMonth
                            }
                        >
                            <Icon
                                name="chevronRight"
                                size={18}
                            />
                        </button>
                    </div>

                    <div className="followups-calendar-actions">
                        <button
                            type="button"
                            onClick={
                                goToToday
                            }
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            onClick={
                                openSchedule
                            }
                        >
                            <Icon
                                name="plus"
                                size={15}
                            />
                            Schedule
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="followups-empty">
                        Loading calendar...
                    </div>
                ) : error ? (
                    <div className="followups-empty error">
                        {error}
                    </div>
                ) : (
                    <>
                        <div className="followups-calendar-weekdays">
                            {[
                                "SUN",
                                "MON",
                                "TUE",
                                "WED",
                                "THU",
                                "FRI",
                                "SAT",
                            ].map(
                                (day) => (
                                    <div
                                        key={
                                            day
                                        }
                                    >
                                        {day}
                                    </div>
                                )
                            )}
                        </div>

                        <div className="followups-calendar-grid">
                            {calendarDays.map(
                                ({
                                    date,
                                    currentMonth,
                                }) => {
                                    const key =
                                        dateKey(
                                            date
                                        );

                                    const dayItems =
                                        calendarFollowUps[
                                            key
                                        ] || [];

                                    return (
                                        <div
                                            className={`followups-calendar-day ${
                                                currentMonth
                                                    ? ""
                                                    : "outside"
                                            } ${
                                                key ===
                                                todayKey
                                                    ? "today"
                                                    : ""
                                            }`}
                                            key={
                                                key
                                            }
                                        >
                                            <div className="followups-calendar-day-number">
                                                {
                                                    date.getDate()
                                                }
                                            </div>

                                            <div className="followups-calendar-events">
                                                {dayItems
                                                    .slice(
                                                        0,
                                                        4
                                                    )
                                                    .map(
                                                        (
                                                            item
                                                        ) => {
                                                            const status =
                                                                getFollowUpStatus(
                                                                    item
                                                                );

                                                            return (
                                                                <button
                                                                    type="button"
                                                                    className={`followups-calendar-event ${status}`}
                                                                    key={
                                                                        item._id
                                                                    }
                                                                    onClick={() =>
                                                                        openLead(
                                                                            item.leadId
                                                                        )
                                                                    }
                                                                >
                                                                    <span>
                                                                        {formatCalendarTime(
                                                                            item.date
                                                                        )}
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </strong>

                                                                    <small>
                                                                        {item.purpose ||
                                                                            "Follow-up"}
                                                                    </small>
                                                                </button>
                                                            );
                                                        }
                                                    )}

                                                {dayItems.length >
                                                    4 && (
                                                    <span className="followups-calendar-more">
                                                        +
                                                        {" "}
                                                        {dayItems.length -
                                                            4}{" "}
                                                        more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </>
                )}
            </section>

            {showModal && (
                <div
                    className="followup-modal-overlay"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="followup-modal">
                        <div className="followup-modal-head">
                            <div>
                                <span>
                                    FOLLOW-UP
                                </span>

                                <h2>
                                    Schedule
                                    follow-up
                                </h2>

                                <p>
                                    Keep the lead moving
                                    with the next action.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                saveFollowUp
                            }
                        >
                            <div className="followup-modal-body">
                                <div className="followup-form-group">
                                    <label>
                                        {healthcare
                                            ? "Lead / Patient"
                                            : "Lead"}
                                    </label>

                                    <div className="followup-lead-search-wrap">
                                        <input
                                            type="text"
                                            value={
                                                leadSearch
                                            }
                                            onChange={
                                                handleLeadSearch
                                            }
                                            onBlur={() => {
                                                setTimeout(
                                                    () => {
                                                        setShowLeadResults(
                                                            false
                                                        );
                                                    },
                                                    180
                                                );
                                            }}
                                            placeholder={
                                                healthcare
                                                    ? "Search patient name or phone..."
                                                    : "Search lead name or phone..."
                                            }
                                            autoComplete="off"
                                        />

                                        {showLeadResults &&
                                            leadSearch.trim() && (
                                                <div className="followup-lead-dropdown">
                                                    {filteredLeadOptions.length >
                                                    0 ? (
                                                        filteredLeadOptions.map(
                                                            (
                                                                lead
                                                            ) => (
                                                                <button
                                                                    type="button"
                                                                    className={`followup-lead-option ${
                                                                        selectedLeadId ===
                                                                        lead._id
                                                                            ? "selected"
                                                                            : ""
                                                                    }`}
                                                                    key={
                                                                        lead._id
                                                                    }
                                                                    onMouseDown={(
                                                                        event
                                                                    ) => {
                                                                        event.preventDefault();

                                                                        selectLead(
                                                                            lead
                                                                        );
                                                                    }}
                                                                >
                                                                    <span className="followup-lead-avatar">
                                                                        {getInitials(
                                                                            lead.name
                                                                        )}
                                                                    </span>

                                                                    <span className="followup-lead-option-content">
                                                                        <strong>
                                                                            {lead.name ||
                                                                                "Unnamed lead"}
                                                                        </strong>

                                                                        <small>
                                                                            {lead.phone ||
                                                                                lead.email ||
                                                                                "No contact details"}
                                                                        </small>
                                                                    </span>
                                                                </button>
                                                            )
                                                        )
                                                    ) : (
                                                        <div className="followup-lead-no-result">
                                                            No matching
                                                            lead found.
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="followup-add-lead-btn"
                                                        onMouseDown={(
                                                            event
                                                        ) => {
                                                            event.preventDefault();

                                                            createNewLeadFromSearch();
                                                        }}
                                                    >
                                                        <span>
                                                            +
                                                        </span>

                                                        <span>
                                                            Add "
                                                            {
                                                                leadSearch.trim()
                                                            }
                                                            "

                                                            <small>
                                                                Create
                                                                new{" "}
                                                                {healthcare
                                                                    ? "patient"
                                                                    : "lead"}
                                                            </small>
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div className="followup-form-grid">
                                    <div className="followup-form-group">
                                        <label>
                                            Date
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                form.date
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateForm(
                                                    "date",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="followup-form-group">
                                        <label>
                                            Time
                                        </label>

                                        <input
                                            type="time"
                                            value={
                                                form.time
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateForm(
                                                    "time",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="followup-form-group">
                                    <label>
                                        {healthcare
                                            ? "Treatment"
                                            : "Service"}
                                    </label>

                                    <select
                                        value={
                                            form.service
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "service",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            {healthcare
                                                ? "Select treatment"
                                                : "Select service"}
                                        </option>

                                        {services.map(
                                            (
                                                service
                                            ) => (
                                                <option
                                                    key={
                                                        service._id
                                                    }
                                                    value={
                                                        service.name
                                                    }
                                                >
                                                    {
                                                        service.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="followup-form-group">
                                    <label>
                                        Note
                                    </label>

                                    <textarea
                                        rows="4"
                                        value={
                                            form.note
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateForm(
                                                "note",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Add a note for this follow-up..."
                                    />
                                </div>

                                {formError && (
                                    <div className="followup-form-error">
                                        {
                                            formError
                                        }
                                    </div>
                                )}
                            </div>

                            <div className="followup-modal-footer">
                                <button
                                    type="button"
                                    className="followup-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="followup-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Scheduling..."
                                        : "Schedule follow-up"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}