import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/api";
import "../styles/follow-ups.scss";

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
  try {
    return JSON.parse(
      localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("vitalsUser") ||
        sessionStorage.getItem("vitalsUser") ||
        "null"
    );
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

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function normalizeFollowUp(item) {
  return {
    ...item,
    leadName:
      item.leadName ||
      item.name ||
      item.lead?.name ||
      "Unknown lead",
    phone:
      item.phone ||
      item.lead?.phone ||
      "",
    service:
      item.service ||
      item.lead?.service ||
      "",
    doctor:
      item.doctor ||
      item.preferredDoctor ||
      item.lead?.preferredDoctor ||
      "",
    assignedTo:
      item.assignedTo ||
      item.owner ||
      item.assignedStaff ||
      "",
    purpose:
      item.purpose ||
      item.note ||
      "",
    note:
      item.note ||
      "",
    priority:
      item.priority ||
      "Medium",
    channel:
      item.channel ||
      "Call",
    date:
      item.date ||
      item.followUpDate ||
      item.scheduledAt ||
      item.createdAt,
    status:
      String(
        item.status || "pending"
      ).toLowerCase(),
  };
}

function getFollowUpStatus(item) {
  if (
    item.status === "completed" ||
    item.status === "complete" ||
    item.status === "done"
  ) {
    return "completed";
  }

  if (!item.date) {
    return "upcoming";
  }

  const date = new Date(item.date);
  const now = new Date();

  if (date < now) {
    return "overdue";
  }

  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
    ? "today"
    : "upcoming";
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "L"
  );
}

function normalizePhone(phone) {
  return String(phone || "").replace(
    /[^\d]/g,
    ""
  );
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

  const icons = {
    list: (
      <>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="17"
          rx="2"
        />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </>
    ),

    automation: (
      <>
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="m16.24 16.24 2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="m4.93 19.07 2.83-2.83" />
        <path d="m16.24 7.76 2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    ),

    whatsapp: (
      <>
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z" />
        <path d="M8.5 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c.7 1.2 1.7 2.1 3 2.7l.6-.7c.2-.2.4-.3.7-.1l1.8.8c.3.1.4.3.4.6v.5c0 .3 0 .6-.5.8-1 .5-2.2.2-3.2-.3-1.3-.7-3.1-2.4-4-3.6-.7-1-1.1-2.2-.7-3.8Z" />
      </>
    ),

    more: (
      <>
        <circle
          cx="12"
          cy="5"
          r="1"
          fill="currentColor"
        />
        <circle
          cx="12"
          cy="12"
          r="1"
          fill="currentColor"
        />
        <circle
          cx="12"
          cy="19"
          r="1"
          fill="currentColor"
        />
      </>
    ),

    repeat: (
      <>
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="m7 23-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    flag: (
      <>
        <path d="M5 21V4" />
        <path d="M5 4c4-3 7 3 14 0v9c-7 3-10-3-14 0" />
      </>
    ),

    note: (
      <>
        <rect
          x="4"
          y="3"
          width="16"
          height="18"
          rx="2"
        />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    x: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),

    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.user}
    </svg>
  );
}

export default function FollowUps() {
  const [user] = useState(() => getUser());

  const [followUps, setFollowUps] =
    useState([]);

  const [leads, setLeads] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("today");

  const [search, setSearch] =
    useState("");

  const [showSchedule, setShowSchedule] =
    useState(false);

  const [selectedLeadId, setSelectedLeadId] =
    useState("");

  const [followUpDate, setFollowUpDate] =
    useState("");

  const [followUpTime, setFollowUpTime] =
    useState("");

  const [purpose, setPurpose] =
    useState("");

  const [channel, setChannel] =
    useState("Call");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [priority, setPriority] =
    useState("Medium");

  const [note, setNote] =
    useState("");

  const [reminder, setReminder] =
    useState(true);

  const [repeatWeekly, setRepeatWeekly] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const healthcare =
    isHealthcare(user);

  const loadData = async () => {
    const token = getToken();

    if (!token) {
      setError(
        "Authentication required. Please sign in again."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        buildApiUrl("/api/leads"),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load leads"
        );
      }

      const loadedLeads =
        Array.isArray(data.leads)
          ? data.leads
          : [];

      const allFollowUps = [];

      loadedLeads.forEach((lead) => {
        (lead.followUps || []).forEach(
          (followUp) => {
            allFollowUps.push(
              normalizeFollowUp({
                ...followUp,
                leadId: lead._id,
                lead,
                leadName: lead.name,
                phone: lead.phone,
                service: lead.service,
                doctor:
                  lead.preferredDoctor,
                assignedTo:
                  followUp.assignedTo ||
                  lead.owner ||
                  lead.preferredDoctor ||
                  user?.name ||
                  "",
              })
            );
          }
        );
      });

      setLeads(loadedLeads);
      setFollowUps(allFollowUps);
    } catch (loadError) {
      setError(
        loadError.message ||
          "Unable to load follow-ups"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      today: followUps.filter(
        (item) =>
          getFollowUpStatus(item) ===
          "today"
      ).length,

      overdue: followUps.filter(
        (item) =>
          getFollowUpStatus(item) ===
          "overdue"
      ).length,

      upcoming: followUps.filter(
        (item) =>
          getFollowUpStatus(item) ===
          "upcoming"
      ).length,

      completed: followUps.filter(
        (item) =>
          getFollowUpStatus(item) ===
          "completed"
      ).length,
    };
  }, [followUps]);

  const filteredFollowUps =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return followUps.filter((item) => {
        const status =
          getFollowUpStatus(item);

        if (
          activeTab !== "all" &&
          status !== activeTab
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          item.leadName,
          item.phone,
          item.service,
          item.doctor,
          item.assignedTo,
          item.purpose,
          item.note,
          item.channel,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );
      });
    }, [
      followUps,
      activeTab,
      search,
    ]);

  const teamOptions =
    useMemo(() => {
      const names = [];

      leads.forEach((lead) => {
        if (lead.owner) {
          names.push(lead.owner);
        }

        if (lead.preferredDoctor) {
          names.push(
            lead.preferredDoctor
          );
        }
      });

      if (user?.name) {
        names.push(user.name);
      }

      return [
        ...new Set(
          names.filter(Boolean)
        ),
      ];
    }, [leads, user]);

  const openScheduleModal = () => {
    setNotice("");
    setSelectedLeadId("");
    setFollowUpDate("");
    setFollowUpTime("");
    setPurpose("");
    setChannel("Call");
    setAssignedTo("");
    setPriority("Medium");
    setNote("");
    setReminder(true);
    setRepeatWeekly(false);
    setShowSchedule(true);
  };

  const openScheduleForLead = (
    lead
  ) => {
    setNotice("");

    setSelectedLeadId(
      lead?._id || ""
    );

    setFollowUpDate("");
    setFollowUpTime("");
    setPurpose("");
    setChannel("Call");

    setAssignedTo(
      lead?.owner ||
        lead?.preferredDoctor ||
        user?.name ||
        ""
    );

    setPriority("Medium");
    setNote("");
    setReminder(true);
    setRepeatWeekly(false);
    setShowSchedule(true);
  };

  const saveFollowUp = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedLeadId) {
      setNotice(
        "Please select a lead."
      );
      return;
    }

    if (
      !followUpDate ||
      !followUpTime
    ) {
      setNotice(
        "Please select date and time."
      );
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const date =
        `${followUpDate}T${followUpTime}`;

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
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              date,
              note: note.trim(),
              purpose:
                purpose.trim(),
              channel,
              assignedTo,
              priority,
              reminder,
              repeatWeekly,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to schedule follow-up"
        );
      }

      setShowSchedule(false);
      setNotice(
        "Follow-up scheduled successfully."
      );

      await loadData();
    } catch (saveError) {
      setNotice(
        saveError.message ||
          "Unable to schedule follow-up"
      );
    } finally {
      setSaving(false);
    }
  };

  const callLead = (phone) => {
    if (!phone) return;

    window.location.href =
      `tel:${phone}`;
  };

  const whatsappLead = (
    phone
  ) => {
    const normalized =
      normalizePhone(phone);

    if (!normalized) return;

    window.open(
      `https://wa.me/${normalized}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const purposeOptions =
    healthcare
      ? [
          "Confirm consultation slot",
          "Share treatment estimate",
          "Post-consult follow-up",
          "Payment reminder",
          "Reschedule appointment",
          "Answer pricing query",
          "Send pre-procedure instructions",
          "Feedback call after treatment",
        ]
      : [
          "Confirm meeting",
          "Share quotation",
          "Follow up on proposal",
          "Payment reminder",
          "Reschedule meeting",
          "Answer pricing query",
          "Product or service follow-up",
          "Customer feedback",
        ];

  const tabItems = [
    [
      "today",
      "Today",
      stats.today,
    ],
    [
      "upcoming",
      "Upcoming",
      stats.upcoming,
    ],
    [
      "overdue",
      "Overdue",
      stats.overdue,
    ],
    [
      "completed",
      "Completed",
      stats.completed,
    ],
  ];

  return (
    <div className="follow-ups-page">

      <div className="follow-ups-page-header">

        <div>
          <p className="follow-ups-eyebrow">
            CRM ACTIVITY
          </p>

          <h1>
            Follow-ups
          </h1>

          <p>
            {stats.today} due today ·{" "}
            {stats.overdue} overdue · keep every lead moving
          </p>
        </div>

        <div className="follow-ups-header-actions">

          <button
            type="button"
            className="follow-ups-view-btn active"
          >
            <Icon
              name="list"
              size={16}
            />
            List
          </button>

          <button
            type="button"
            className="follow-ups-view-btn"
          >
            <Icon
              name="calendar"
              size={16}
            />
            Calendar
          </button>

          <button
            type="button"
            className="follow-ups-view-btn"
          >
            <Icon
              name="automation"
              size={16}
            />
            Automations
          </button>

          <button
            type="button"
            className="follow-ups-schedule-btn"
            onClick={
              openScheduleModal
            }
          >
            <Icon
              name="plus"
              size={17}
            />
            Schedule follow-up
          </button>

        </div>
      </div>

      <div className="follow-ups-stats">

        <button
          type="button"
          className={
            activeTab === "today"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("today")
          }
        >
          <span className="stat-icon today">
            <Icon
              name="clock"
              size={17}
            />
          </span>

          <span className="stat-content">
            <strong>
              {stats.today}
            </strong>

            <small>
              Due today
            </small>
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "overdue"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("overdue")
          }
        >
          <span className="stat-icon overdue">
            !
          </span>

          <span className="stat-content">
            <strong>
              {stats.overdue}
            </strong>

            <small>
              Overdue
            </small>
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "upcoming"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("upcoming")
          }
        >
          <span className="stat-icon upcoming">
            <Icon
              name="calendar"
              size={17}
            />
          </span>

          <span className="stat-content">
            <strong>
              {stats.upcoming}
            </strong>

            <small>
              Upcoming
            </small>
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "completed"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("completed")
          }
        >
          <span className="stat-icon completed">
            <Icon
              name="check"
              size={17}
            />
          </span>

          <span className="stat-content">
            <strong>
              {stats.completed}
            </strong>

            <small>
              Completed
            </small>
          </span>
        </button>

      </div>

      {notice && (
        <div className="follow-ups-notice">
          {notice}
        </div>
      )}

      {error && (
        <div className="follow-ups-error">
          {error}
        </div>
      )}

      <section className="follow-ups-list-card">

        <div className="follow-ups-tabs">

          {tabItems.map(
            ([value, label, count]) => (
              <button
                type="button"
                key={value}
                className={
                  activeTab === value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(value)
                }
              >
                {label}

                <span>
                  {count}
                </span>
              </button>
            )
          )}

        </div>

        <div className="follow-ups-toolbar">

          <div className="follow-search">
            <Icon
              name="user"
              size={16}
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search patient or lead..."
            />
          </div>

          <select defaultValue="">
            <option value="">
              Assigned to
            </option>

            {teamOptions.map(
              (name) => (
                <option
                  value={name}
                  key={name}
                >
                  {name}
                </option>
              )
            )}
          </select>

          <select defaultValue="">
            <option value="">
              Priority
            </option>
            <option value="High">
              High
            </option>
            <option value="Medium">
              Medium
            </option>
            <option value="Low">
              Low
            </option>
          </select>

          <select defaultValue="">
            <option value="">
              Channel
            </option>
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

          <strong className="follow-up-total">
            {filteredFollowUps.length} follow-ups
          </strong>

        </div>

        <div className="follow-ups-list">

          {loading ? (
            <div className="follow-ups-empty">
              Loading follow-ups...
            </div>
          ) : filteredFollowUps.length ? (
            filteredFollowUps.map(
              (item) => {
                const status =
                  getFollowUpStatus(
                    item
                  );

                const priorityClass =
                  String(
                    item.priority ||
                      "Medium"
                  ).toLowerCase();

                return (
                  <article
                    className={`follow-up-row ${status} priority-${priorityClass}`}
                    key={
                      item._id ||
                      `${item.leadId}-${item.date}`
                    }
                  >

                    <div className="follow-up-priority-line" />

                    <div className="follow-up-check">
                      <input
                        type="checkbox"
                        checked={
                          status ===
                          "completed"
                        }
                        readOnly
                      />
                    </div>

                    <div className="follow-up-avatar">
                      {getInitials(
                        item.leadName
                      )}
                    </div>

                    <div className="follow-up-main">

                      <div className="follow-up-name-row">

                        <strong>
                          {item.leadName}
                        </strong>

                        {status ===
                          "today" && (
                          <span className="follow-up-status today">
                            <i />
                            Due today
                          </span>
                        )}

                        {status ===
                          "overdue" && (
                          <span className="follow-up-status overdue">
                            Overdue
                          </span>
                        )}

                        {status ===
                          "upcoming" && (
                          <span className="follow-up-status upcoming">
                            Upcoming
                          </span>
                        )}

                        {status ===
                          "completed" && (
                          <span className="follow-up-status completed">
                            Completed
                          </span>
                        )}

                        <span
                          className={`follow-up-priority ${priorityClass}`}
                        >
                          {item.priority ||
                            "Medium"}
                        </span>

                      </div>

                      <p className="follow-up-purpose">
                        {item.purpose ||
                          item.note ||
                          "Follow up with lead"}
                      </p>

                      <div className="follow-up-meta">

                        {item.phone && (
                          <button
                            type="button"
                            className="follow-meta-item clickable"
                            onClick={() =>
                              callLead(
                                item.phone
                              )
                            }
                          >
                            <Icon
                              name="phone"
                              size={14}
                            />
                            {item.phone}
                          </button>
                        )}

                        {item.assignedTo && (
                          <span className="follow-meta-item">
                            <span className="mini-avatar">
                              {getInitials(
                                item.assignedTo
                              )}
                            </span>

                            {item.assignedTo}
                          </span>
                        )}

                        {item.channel && (
                          <span className="follow-meta-item">

                            {item.channel ===
                            "WhatsApp" ? (
                              <Icon
                                name="whatsapp"
                                size={14}
                              />
                            ) : (
                              <Icon
                                name="phone"
                                size={14}
                              />
                            )}

                            {item.channel}
                          </span>
                        )}

                        {healthcare &&
                          item.service && (
                            <span className="follow-service">
                              {item.service}
                            </span>
                          )}

                      </div>

                    </div>

                    <div className="follow-up-date">

                      <strong>
                        {status ===
                        "today"
                          ? "Today"
                          : formatDate(
                              item.date
                            )}
                      </strong>

                      <span>
                        {formatTime(
                          item.date
                        )}
                      </span>

                    </div>

                    <div className="follow-up-actions">

                      {item.phone && (
                        <button
                          type="button"
                          className="follow-action call"
                          title="Call"
                          onClick={() =>
                            callLead(
                              item.phone
                            )
                          }
                        >
                          <Icon
                            name="phone"
                            size={17}
                          />
                        </button>
                      )}

                      {item.phone && (
                        <button
                          type="button"
                          className="follow-action whatsapp"
                          title="WhatsApp"
                          onClick={() =>
                            whatsappLead(
                              item.phone
                            )
                          }
                        >
                          <Icon
                            name="whatsapp"
                            size={17}
                          />
                        </button>
                      )}

                      <button
                        type="button"
                        className="follow-action"
                        title="Schedule follow-up"
                        onClick={() =>
                          openScheduleForLead(
                            item.lead
                          )
                        }
                      >
                        <Icon
                          name="calendar"
                          size={17}
                        />
                      </button>

                      <button
                        type="button"
                        className="follow-action"
                        title="More actions"
                      >
                        <Icon
                          name="more"
                          size={17}
                        />
                      </button>

                    </div>

                  </article>
                );
              }
            )
          ) : (
            <div className="follow-ups-empty">

              <div className="follow-empty-icon">
                <Icon
                  name="calendar"
                  size={26}
                />
              </div>

              <strong>
                No follow-ups found
              </strong>

              <span>
                Schedule a follow-up for a lead
                to see it here.
              </span>

              <button
                type="button"
                className="follow-ups-schedule-btn"
                onClick={
                  openScheduleModal
                }
              >
                <Icon
                  name="plus"
                  size={16}
                />
                Schedule follow-up
              </button>

            </div>
          )}

        </div>

      </section>

      {showSchedule && (
        <div
          className="follow-up-modal-backdrop"
          onClick={() =>
            setShowSchedule(false)
          }
        >

          <form
            className="follow-up-schedule-modal"
            onSubmit={saveFollowUp}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="follow-up-modal-header">

              <div>
                <span>
                  FOLLOW-UP
                </span>

                <h2>
                  Schedule follow-up
                </h2>

                <p>
                  Set the next action for this lead.
                </p>
              </div>

              <button
                type="button"
                className="follow-up-modal-close"
                onClick={() =>
                  setShowSchedule(false)
                }
              >
                <Icon
                  name="x"
                  size={18}
                />
              </button>

            </div>

            <div className="follow-up-modal-body">

              <label className="follow-up-full-field">
                <span>
                  {healthcare
                    ? "Patient / lead"
                    : "Lead"}
                </span>

                <select
                  value={selectedLeadId}
                  onChange={(event) =>
                    setSelectedLeadId(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select lead
                  </option>

                  {leads.map(
                    (lead) => (
                      <option
                        key={lead._id}
                        value={lead._id}
                      >
                        {lead.name}
                        {healthcare &&
                        lead.service
                          ? ` — ${lead.service}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="follow-up-form-grid">

                <label>
                  <span>
                    Date
                  </span>

                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(event) =>
                      setFollowUpDate(
                        event.target.value
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    Time
                  </span>

                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(event) =>
                      setFollowUpTime(
                        event.target.value
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    Purpose
                  </span>

                  <select
                    value={purpose}
                    onChange={(event) =>
                      setPurpose(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select purpose
                    </option>

                    {purposeOptions.map(
                      (item) => (
                        <option
                          value={item}
                          key={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Channel
                  </span>

                  <select
                    value={channel}
                    onChange={(event) =>
                      setChannel(
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
                </label>

                <label>
                  <span>
                    Assign to
                  </span>

                  <select
                    value={assignedTo}
                    onChange={(event) =>
                      setAssignedTo(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select
                    </option>

                    {teamOptions.map(
                      (name) => (
                        <option
                          value={name}
                          key={name}
                        >
                          {name}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Priority
                  </span>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
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
                </label>

              </div>

              <label className="follow-up-note-field">

                <span>
                  Note
                </span>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(
                      event.target.value
                    )
                  }
                  placeholder="Add a note..."
                />

              </label>

              <div className="follow-up-options">

                <label>
                  <input
                    type="checkbox"
                    checked={reminder}
                    onChange={(event) =>
                      setReminder(
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Remind me 30 minutes before
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={repeatWeekly}
                    onChange={(event) =>
                      setRepeatWeekly(
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Repeat weekly
                  </span>
                </label>

              </div>

            </div>

            <div className="follow-up-modal-footer">

              <button
                type="button"
                className="follow-modal-cancel"
                onClick={() =>
                  setShowSchedule(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="follow-modal-submit"
                disabled={saving}
              >
                <Icon
                  name="calendar"
                  size={16}
                />

                {saving
                  ? "Scheduling..."
                  : "Schedule follow-up"}
              </button>

            </div>

          </form>

        </div>
      )}

    </div>
  );
}