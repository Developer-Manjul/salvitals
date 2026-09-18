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

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatCalendarTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

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

    const time = new Date(item?.date).getTime();

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

function normalizeFollowUp(lead, followUp, index) {
    return {
        ...followUp,
        _id:
            followUp?._id ||
            `${lead._id}-followup-${index}`,
        leadId: lead._id,
        lead,
        name: lead.name || "Unnamed lead",
        phone: lead.phone || "",
        email: lead.email || "",
        service: lead.service || "",
        owner:
            followUp?.assignedTo ||
            lead.owner ||
            "Unassigned",
        date: followUp?.date,
        note: followUp?.note || "",
        purpose:
            followUp?.purpose ||
            followUp?.note ||
            "Follow-up",
        channel:
            followUp?.channel ||
            "Call",
        priority:
            followUp?.priority ||
            "Medium",
        status:
            followUp?.status ||
            "Scheduled",
    };
}

function Icon({ name, size = 18 }) {
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
    const user = passedUser || getUser();

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [calendarMonth, setCalendarMonth] =
        useState(new Date());

    const [showModal, setShowModal] =
        useState(false);

    const [selectedLeadId, setSelectedLeadId] =
        useState("");

    const [form, setForm] =
        useState({
            date: "",
            time: "",
            purpose: "",
            channel: "Call",
            assignedTo: "",
            priority: "Medium",
            note: "",
            reminder: true,
            repeatWeekly: false,
        });

    const [saving, setSaving] =
        useState(false);

    const [formError, setFormError] =
        useState("");

    const loadCalendarData = async () => {
        const token = getToken();

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                buildApiUrl("/api/leads"),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to load calendar."
                );
            }

            setLeads(
                Array.isArray(data.leads)
                    ? data.leads
                    : []
            );
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

    const allFollowUps = useMemo(() => {
        const items = [];

        leads.forEach((lead) => {
            if (!Array.isArray(lead.followUps)) {
                return;
            }

            lead.followUps.forEach(
                (followUp, index) => {
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
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );
    }, [leads]);

    const calendarDays = useMemo(
        () => buildCalendarDays(calendarMonth),
        [calendarMonth]
    );

    const calendarFollowUps = useMemo(() => {
        const map = {};

        allFollowUps.forEach((item) => {
            const key = dateKey(item.date);

            if (!key) return;

            if (!map[key]) {
                map[key] = [];
            }

            map[key].push(item);
        });

        return map;
    }, [allFollowUps]);

    const assignees = useMemo(() => {
        return [
            ...new Set(
                leads
                    .map((lead) => lead.owner)
                    .filter(Boolean)
            ),
        ];
    }, [leads]);

    const selectedLead = leads.find(
        (lead) => lead._id === selectedLeadId
    );

    const updateForm = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const openSchedule = (lead = null) => {
        const targetLead =
            lead ||
            selectedLead ||
            leads[0] ||
            null;

        setSelectedLeadId(
            targetLead?._id || ""
        );

        setForm({
            date: "",
            time: "",
            purpose: "",
            channel: "Call",
            assignedTo:
                targetLead?.owner || "",
            priority: "Medium",
            note: "",
            reminder: true,
            repeatWeekly: false,
        });

        setFormError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setFormError("");
    };

    const saveFollowUp = async (event) => {
        event.preventDefault();

        if (!selectedLeadId) {
            setFormError(
                "Please select a lead."
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

        const token = getToken();

        if (!token) {
            setFormError(
                "Your session has expired."
            );
            return;
        }

        try {
            setSaving(true);
            setFormError("");

            const dateTime = new Date(
                `${form.date}T${form.time}`
            );

            const response = await fetch(
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
                    body: JSON.stringify({
                        date: dateTime.toISOString(),
                        note: form.note,
                        purpose: form.purpose,
                        channel: form.channel,
                        assignedTo: form.assignedTo,
                        priority: form.priority,
                        reminder: form.reminder,
                        repeatWeekly:
                            form.repeatWeekly,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to schedule follow-up."
                );
            }

            setShowModal(false);
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

    const previousMonth = () => {
        setCalendarMonth(
            new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() - 1,
                1
            )
        );
    };

    const nextMonth = () => {
        setCalendarMonth(
            new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() + 1,
                1
            )
        );
    };

    const goToToday = () => {
        setCalendarMonth(new Date());
    };

    const calendarTitle =
        new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric",
        }).format(calendarMonth);

    const todayKey = dateKey(new Date());

    const openLead = (leadId) => {
        if (
            typeof onOpenLeadDetails ===
            "function"
        ) {
            onOpenLeadDetails(leadId);
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
                        View and manage all scheduled follow-ups
                    </p>
                </div>

                <div className="followups-head-actions">

                    <button
                        type="button"
                        className="followups-schedule-btn"
                        onClick={() => openSchedule()}
                    >
                        <Icon
                            name="plus"
                            size={16}
                        />
                        Schedule follow-up
                    </button>

                </div>

            </div>

            <section className="followups-calendar-card">

                <div className="followups-calendar-head">

                    <div className="followups-calendar-title">

                        <button
                            type="button"
                            onClick={previousMonth}
                        >
                            <Icon
                                name="chevronLeft"
                                size={18}
                            />
                        </button>

                        <h2>
                            {calendarTitle}
                        </h2>

                        <button
                            type="button"
                            onClick={nextMonth}
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
                            onClick={goToToday}
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            onClick={() => openSchedule()}
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
                            ].map((day) => (
                                <div key={day}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="followups-calendar-grid">

                            {calendarDays.map(
                                ({
                                    date,
                                    currentMonth,
                                }) => {
                                    const key = dateKey(date);

                                    const dayItems =
                                        calendarFollowUps[key] ||
                                        [];

                                    return (
                                        <div
                                            className={`followups-calendar-day ${currentMonth
                                                ? ""
                                                : "outside"
                                                } ${key === todayKey
                                                    ? "today"
                                                    : ""
                                                }`}
                                            key={key}
                                        >

                                            <div className="followups-calendar-day-number">
                                                {date.getDate()}
                                            </div>

                                            <div className="followups-calendar-events">

                                                {dayItems
                                                    .slice(0, 4)
                                                    .map((item) => {
                                                        const status =
                                                            getFollowUpStatus(
                                                                item
                                                            );

                                                        return (
                                                            <button
                                                                type="button"
                                                                className={`followups-calendar-event ${status} priority-${String(
                                                                    item.priority ||
                                                                    "Medium"
                                                                ).toLowerCase()}`}
                                                                key={item._id}
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
                                                                    {item.name}
                                                                </strong>

                                                                <small>
                                                                    {item.purpose ||
                                                                        "Follow-up"}
                                                                </small>
                                                            </button>
                                                        );
                                                    })}

                                                {dayItems.length > 4 && (
                                                    <span className="followups-calendar-more">
                                                        +{" "}
                                                        {dayItems.length - 4}{" "}
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
                    onMouseDown={(event) => {
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
                                    Schedule follow-up
                                </h2>

                                <p>
                                    Keep the lead moving with
                                    the next action.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={saveFollowUp}>

                            <div className="followup-modal-body">

                                <div className="followup-form-group">
                                    <label>
                                        {isHealthcare(user)
                                            ? "Lead / Patient"
                                            : "Lead"}
                                    </label>

                                    {selectedLead ? (
                                        <div className="followup-selected-lead">
                                            <span>
                                                {getInitials(
                                                    selectedLead.name
                                                )}
                                            </span>

                                            <strong>
                                                {selectedLead.name ||
                                                    "Unnamed lead"}
                                            </strong>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedLeadId}
                                            onChange={(event) => {
                                                const id =
                                                    event.target.value;

                                                setSelectedLeadId(id);

                                                const lead =
                                                    leads.find(
                                                        (item) =>
                                                            item._id === id
                                                    );

                                                if (lead) {
                                                    updateForm(
                                                        "assignedTo",
                                                        lead.owner || ""
                                                    );
                                                }
                                            }}
                                        >
                                            <option value="">
                                                {isHealthcare(user)
                                                    ? "Select lead / patient"
                                                    : "Select lead"}
                                            </option>

                                            {leads.map((lead) => (
                                                <option
                                                    value={lead._id}
                                                    key={lead._id}
                                                >
                                                    {lead.name}
                                                    {lead.phone
                                                        ? ` · ${lead.phone}`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="followup-form-grid">

                                    <div className="followup-form-group">
                                        <label>
                                            Date
                                        </label>

                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={(event) =>
                                                updateForm(
                                                    "date",
                                                    event.target.value
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
                                            value={form.time}
                                            onChange={(event) =>
                                                updateForm(
                                                    "time",
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                </div>

                                <div className="followup-form-grid">

                                    <div className="followup-form-group">
                                        <label>
                                            Purpose
                                        </label>

                                        <input
                                            type="text"
                                            value={form.purpose}
                                            onChange={(event) =>
                                                updateForm(
                                                    "purpose",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="e.g. Confirm consultation"
                                        />
                                    </div>

                                    <div className="followup-form-group">
                                        <label>
                                            Channel
                                        </label>

                                        <select
                                            value={form.channel}
                                            onChange={(event) =>
                                                updateForm(
                                                    "channel",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Call">
                                                Call
                                            </option>
                                            <option value="WhatsApp">
                                                WhatsApp
                                            </option>
                                            <option value="Email">
                                                Email
                                            </option>
                                            <option value="In person">
                                                In person
                                            </option>
                                        </select>
                                    </div>

                                </div>

                                {isHealthcare(user) && (
                                    <div className="followup-form-group">
                                        <label>
                                            Treatment / Service
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                selectedLead?.service ||
                                                ""
                                            }
                                            readOnly
                                            placeholder="Lead service"
                                        />
                                    </div>
                                )}

                                <div className="followup-form-grid">

                                    <div className="followup-form-group">
                                        <label>
                                            Assign to
                                        </label>

                                        <select
                                            value={form.assignedTo}
                                            onChange={(event) =>
                                                updateForm(
                                                    "assignedTo",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Unassigned
                                            </option>

                                            {assignees.map(
                                                (person) => (
                                                    <option
                                                        value={person}
                                                        key={person}
                                                    >
                                                        {person}
                                                    </option>
                                                )
                                            )}

                                            {selectedLead?.owner &&
                                                !assignees.includes(
                                                    selectedLead.owner
                                                ) && (
                                                    <option
                                                        value={
                                                            selectedLead.owner
                                                        }
                                                    >
                                                        {selectedLead.owner}
                                                    </option>
                                                )}
                                        </select>
                                    </div>

                                    <div className="followup-form-group">
                                        <label>
                                            Priority
                                        </label>

                                        <select
                                            value={form.priority}
                                            onChange={(event) =>
                                                updateForm(
                                                    "priority",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Low">
                                                Low
                                            </option>
                                            <option value="Medium">
                                                Medium
                                            </option>
                                            <option value="High">
                                                High
                                            </option>
                                        </select>
                                    </div>

                                </div>

                                <div className="followup-form-group">
                                    <label>
                                        Note
                                    </label>

                                    <textarea
                                        rows="4"
                                        value={form.note}
                                        onChange={(event) =>
                                            updateForm(
                                                "note",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Add a note for this follow-up..."
                                    />
                                </div>

                                <div className="followup-modal-options">

                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.reminder}
                                            onChange={(event) =>
                                                updateForm(
                                                    "reminder",
                                                    event.target.checked
                                                )
                                            }
                                        />

                                        <span>
                                            Reminder
                                        </span>
                                    </label>

                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                form.repeatWeekly
                                            }
                                            onChange={(event) =>
                                                updateForm(
                                                    "repeatWeekly",
                                                    event.target.checked
                                                )
                                            }
                                        />

                                        <span>
                                            Repeat weekly
                                        </span>
                                    </label>

                                </div>

                                {formError && (
                                    <div className="followup-form-error">
                                        {formError}
                                    </div>
                                )}

                            </div>

                            <div className="followup-modal-footer">

                                <button
                                    type="button"
                                    className="followup-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="followup-save-btn"
                                    disabled={saving}
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
