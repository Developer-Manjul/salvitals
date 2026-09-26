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

function normalizePhone(phone = "") {
  return String(phone || "").replace(/\D/g, "");
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatCalendarTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
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
    service:
      followUp?.service ||
      lead.service ||
      "",
    owner:
      followUp?.assignedTo ||
      lead.owner ||
      "Unassigned",
    date: followUp?.date,
    createdAt:
      followUp?.createdAt ||
      followUp?.created_at ||
      lead?.createdAt ||
      null,
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

function isCompleted(item) {
  const status = String(
    item?.status || ""
  ).toLowerCase();

  return (
    status === "completed" ||
    status === "complete" ||
    status === "done"
  );
}

function getFollowUpStatus(item) {
  if (isCompleted(item)) {
    return "completed";
  }

  const time = new Date(item.date).getTime();

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

function Icon({ name, size = 17 }) {
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

    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    chevronLeft: (
      <path d="m15 18-6-6 6-6" />
    ),

    chevronRight: (
      <path d="m9 18 6-6-6-6" />
    ),

    phone: (
      <path d="M6.6 3.8 9 3l2 4.5-2 1.5a15.5 15.5 0 0 0 6 6l1.5-2 4.5 2-.8 2.4a2.4 2.4 0 0 1-2.7 1.5C10.6 18.2 5.8 13.4 3.1 6.5A2.4 2.4 0 0 1 4.6 3.8Z" />
    ),

    whatsapp: (
      <>
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z" />
        <path d="M8.5 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c.7 1.2 1.7 2.1 3 2.7l.6-.7c.2-.2.4-.3.7-.1l1.8.8c.3.1.4.3.4.6v.5c0 .3 0 .6-.5.8-1 .5-2.2.2-3.2-.3-1.3-.7-3.1-2.4-4-3.6-.7-1-1.1-2.2-.7-3.8Z" />
      </>
    ),

    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),

    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {paths[name] || paths.calendar}
    </svg>
  );
}

export default function FollowUps({
  user: passedUser,
  initialLead = null,
  onOpenLeadDetails,
  focusFollowUpId = "",
  onFocusComplete,
}) {
  const user =
    passedUser ||
    getUser();

  const healthcare =
    isHealthcare(user);

  const [leads, setLeads] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [activeTab, setActiveTab] =
    useState("today");

  const [view, setView] =
    useState("list");

  const [search, setSearch] =
    useState("");

  const [assignedFilter, setAssignedFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [channelFilter, setChannelFilter] =
    useState("");

  const [calendarMonth, setCalendarMonth] =
    useState(new Date());

  const [showModal, setShowModal] =
    useState(false);

  const [isRescheduling, setIsRescheduling] =
    useState(false);

  const [selectedFollowUpId, setSelectedFollowUpId] =
    useState("");

  const [selectedLeadId, setSelectedLeadId] =
    useState(
      initialLead?._id || ""
    );

  const [leadSearch, setLeadSearch] =
    useState(
      initialLead?.name || ""
    );

  const [showLeadResults, setShowLeadResults] =
    useState(false);

  const [isNewLead, setIsNewLead] =
    useState(false);

  const [form, setForm] =
    useState({
      date: "",
      time: "",
      purpose: "",
      channel: "Call",
      assignedTo: "",
      priority: "Medium",
      service: "",
      note: "",
      reminder: true,
      repeatWeekly: false,
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadFollowUps = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
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
          buildApiUrl("/api/leads"),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          buildApiUrl("/api/services"),
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

      if (!leadsResponse.ok) {
        throw new Error(
          leadsData?.message ||
          "Unable to load follow-ups."
        );
      }

      setLeads(
        Array.isArray(leadsData.leads)
          ? leadsData.leads
          : []
      );

      if (servicesResponse.ok) {
        const servicesData =
          await servicesResponse.json();

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
        "LOAD FOLLOW UPS ERROR:",
        err
      );

      setError(
        err.message ||
        "Unable to load follow-ups."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
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

  const stats = useMemo(() => {
    let today = 0;
    let overdue = 0;
    let upcoming = 0;
    let completed = 0;

    allFollowUps.forEach((item) => {
      const status =
        getFollowUpStatus(item);

      if (status === "today") {
        today++;
      }

      if (status === "overdue") {
        overdue++;
      }

      if (status === "upcoming") {
        upcoming++;
      }

      if (status === "completed") {
        completed++;
      }
    });

    return {
      today,
      overdue,
      upcoming,
      completed,
    };
  }, [allFollowUps]);

  const filteredFollowUps =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return allFollowUps.filter(
        (item) => {
          const status =
            getFollowUpStatus(item);

          const matchesTab =
            activeTab === "all" ||
            status === activeTab;

          const matchesSearch =
            !query ||
            String(
              item.name || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              item.phone || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              item.purpose || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              item.service || ""
            )
              .toLowerCase()
              .includes(query);

          const matchesAssigned =
            !assignedFilter ||
            item.owner ===
              assignedFilter;

          const matchesPriority =
            !priorityFilter ||
            item.priority ===
              priorityFilter;

          const matchesChannel =
            !channelFilter ||
            item.channel ===
              channelFilter;

          return (
            matchesTab &&
            matchesSearch &&
            matchesAssigned &&
            matchesPriority &&
            matchesChannel
          );
        }
      );
    }, [
      allFollowUps,
      activeTab,
      search,
      assignedFilter,
      priorityFilter,
      channelFilter,
    ]);

  useEffect(() => {
    if (!focusFollowUpId || loading) {
      return;
    }

    setActiveTab("all");

    const timer = window.setTimeout(() => {
      const rows = Array.from(
        document.querySelectorAll(
          "[data-followup-id]"
        )
      );

      const target = rows.find(
        (row) =>
          row.getAttribute(
            "data-followup-id"
          ) === String(focusFollowUpId)
      );

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        target.classList.add(
          "followup-row-focused"
        );

        window.setTimeout(() => {
          target.classList.remove(
            "followup-row-focused"
          );
        }, 5000);
      }

      if (typeof onFocusComplete === "function") {
        onFocusComplete();
      }
    }, 120);

    return () =>
      window.clearTimeout(timer);
  }, [
    focusFollowUpId,
    loading,
    filteredFollowUps.length,
    onFocusComplete,
  ]);

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

  const assignees =
    useMemo(() => {
      return [
        ...new Set(
          allFollowUps
            .map((item) => item.owner)
            .filter(Boolean)
        ),
      ];
    }, [allFollowUps]);

  const matchingLeads = useMemo(() => {
    const query =
      leadSearch.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return leads
      .filter((lead) => {
        const name =
          String(
            lead.name || ""
          ).toLowerCase();

        const phone =
          String(
            lead.phone || ""
          ).toLowerCase();

        return (
          name.includes(query) ||
          phone.includes(query)
        );
      })
      .slice(0, 8);
  }, [leads, leadSearch]);

  const exactLeadExists = useMemo(() => {
    const query =
      leadSearch.trim().toLowerCase();

    if (!query) {
      return false;
    }

    return leads.some(
      (lead) =>
        String(
          lead.name || ""
        )
          .trim()
          .toLowerCase() === query
    );
  }, [leads, leadSearch]);

  const selectedLead =
    leads.find(
      (lead) =>
        lead._id === selectedLeadId
    ) || null;

  const openSchedule = (
    lead = null,
    existingFollowUp = null
  ) => {
    const targetLead =
      lead ||
      (existingFollowUp
        ? initialLead
        : null);

    setSelectedLeadId(
      targetLead?._id || ""
    );

    setLeadSearch(
      targetLead?.name || ""
    );

    setShowLeadResults(false);
    setIsNewLead(false);

    setIsRescheduling(
      Boolean(existingFollowUp)
    );

    setSelectedFollowUpId(
      existingFollowUp?._id || ""
    );

    let existingDate = "";
    let existingTime = "";

    if (existingFollowUp?.date) {
      const existing = new Date(
        existingFollowUp.date
      );

      if (!Number.isNaN(existing.getTime())) {
        const year =
          existing.getFullYear();

        const month = String(
          existing.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          existing.getDate()
        ).padStart(2, "0");

        const hours = String(
          existing.getHours()
        ).padStart(2, "0");

        const minutes = String(
          existing.getMinutes()
        ).padStart(2, "0");

        existingDate =
          `${year}-${month}-${day}`;

        existingTime =
          `${hours}:${minutes}`;
      }
    }

    setForm({
      date: existingDate,
      time: existingTime,
      purpose:
        existingFollowUp?.purpose ||
        "",
      channel:
        existingFollowUp?.channel ||
        "Call",
      assignedTo:
        existingFollowUp?.assignedTo ||
        "",
      priority:
        existingFollowUp?.priority ||
        targetLead?.priority ||
        "Medium",
      service:
        existingFollowUp?.service ||
        targetLead?.service ||
        "",
      note:
        existingFollowUp?.note ||
        "",
      reminder: true,
      repeatWeekly: false,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setIsRescheduling(false);
    setSelectedFollowUpId("");
    setShowLeadResults(false);
    setIsNewLead(false);
    setError("");
  };

  const updateForm = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const selectExistingLead = (
    lead
  ) => {
    setSelectedLeadId(
      lead._id
    );

    setLeadSearch(
      lead.name || ""
    );

    setIsNewLead(false);
    setShowLeadResults(false);

    updateForm(
      "service",
      lead.service || ""
    );
  };

  const selectNewLead = () => {
    const name =
      leadSearch.trim();

    if (!name) {
      return;
    }

    setSelectedLeadId("");
    setIsNewLead(true);
    setShowLeadResults(false);
  };

  const createNewLead = async () => {
    const token = getToken();
    const name =
      leadSearch.trim();

    if (!token) {
      throw new Error(
        "Your session has expired."
      );
    }

    if (!name) {
      throw new Error(
        "Please enter a name."
      );
    }

    const response = await fetch(
      buildApiUrl("/api/leads"),
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone: "",
          email: "",
          service:
            form.service || "",
          source: "Manual",
          status: "New",
        }),
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

    const newLead =
      data?.lead ||
      data?.data ||
      data;

    if (!newLead?._id) {
      throw new Error(
        "Lead was created but ID was not returned."
      );
    }

    return newLead;
  };

  const saveFollowUp = async (
    event
  ) => {
    event.preventDefault();

    if (!leadSearch.trim()) {
      setError(
        healthcare
          ? "Please enter a patient name."
          : "Please enter a lead name."
      );
      return;
    }

    if (!form.date) {
      setError("Please select a date.");
      return;
    }

    if (!form.time) {
      setError("Please select a time.");
      return;
    }

    if (!form.service) {
      setError(
        healthcare
          ? "Please select treatment."
          : "Please select service."
      );
      return;
    }

    if (!form.priority) {
      setError("Please select a priority.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Your session has expired.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      let leadId = selectedLeadId;

      if (isNewLead && !leadId) {
        const newLead = await createNewLead();

        leadId = newLead._id;

        setSelectedLeadId(newLead._id);

        setLeads((previous) => [
          newLead,
          ...previous,
        ]);
      }

      if (!leadId) {
        setError(
          "Please select an existing lead or add a new name."
        );
        return;
      }

      const dateTime = new Date(
        `${form.date}T${form.time}`
      );

      if (Number.isNaN(dateTime.getTime())) {
        setError(
          "Please select a valid date and time."
        );
        return;
      }

      const payload = {
        date: dateTime.toISOString(),
        note: form.note.trim(),
        service: form.service || "",
        reminder: true,
        purpose:
          form.purpose.trim() ||
          form.note.trim() ||
          "Follow-up",
        channel:
          form.channel || "Call",
        assignedTo:
          form.assignedTo || "",
        priority:
          form.priority || "Medium",
      };

      const endpoint = isRescheduling
        ? `/api/leads/${leadId}/follow-ups/${selectedFollowUpId}`
        : `/api/leads/${leadId}/follow-ups`;

      const response = await fetch(
        buildApiUrl(endpoint),
        {
          method: isRescheduling
            ? "PUT"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isRescheduling
              ? "Unable to reschedule follow-up."
              : "Unable to schedule follow-up.")
        );
      }

      setShowModal(false);
      setShowLeadResults(false);
      setIsNewLead(false);
      setIsRescheduling(false);
      setSelectedFollowUpId("");

      await loadFollowUps();
    } catch (err) {
      console.error(
        "SAVE FOLLOW UP ERROR:",
        err
      );

      setError(
        err.message ||
          (isRescheduling
            ? "Unable to reschedule follow-up."
            : "Unable to schedule follow-up.")
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteFollowUp = async (item) => {
    if (!item?.leadId || !item?._id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the follow-up for ${item.name || "this lead"}?`
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Your session has expired.");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        buildApiUrl(
          `/api/leads/${item.leadId}/follow-ups/${item._id}`
        ),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to delete follow-up."
        );
      }

      await loadFollowUps();
    } catch (err) {
      console.error(
        "DELETE FOLLOW UP ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete follow-up."
      );
    }
  };

  const callLead = (phone) => {
    if (!phone) return;

    window.location.href =
      `tel:${phone}`;
  };

  const whatsappLead = (phone) => {
    const normalized =
      normalizePhone(phone);

    if (!normalized) return;

    const number =
      normalized.length === 10
        ? `91${normalized}`
        : normalized;

    window.open(
      `https://wa.me/${number}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openLead = (leadId) => {
    if (
      typeof onOpenLeadDetails ===
      "function"
    ) {
      onOpenLeadDetails(
        leadId
      );
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

  return (
    <div className="followups-page">
      <div className="followups-head">
        <div>
          <p className="followups-breadcrumb">
            Acquire / Follow-ups
          </p>

          <h1>Follow-ups</h1>

          <p className="followups-subtitle">
            {stats.today} due today ·{" "}
            {stats.overdue} overdue · keep
            every lead moving
          </p>
        </div>

        <div className="followups-head-actions">
          <div className="followups-view-switch">
            <button
              type="button"
              className={
                view === "list"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("list")
              }
            >
              <Icon
                name="list"
                size={16}
              />
              List
            </button>

            <button
              type="button"
              className={
                view === "calendar"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("calendar")
              }
            >
              <Icon
                name="calendar"
                size={16}
              />
              Calendar
            </button>
          </div>

          <button
            type="button"
            className="followups-schedule-btn"
            onClick={() =>
              openSchedule()
            }
          >
            <Icon
              name="plus"
              size={16}
            />
            Schedule follow-up
          </button>
        </div>
      </div>

      <div className="followups-stats">
        <div className="followup-stat today">
          <span>
            <Icon
              name="calendar"
              size={16}
            />
          </span>

          <strong>
            {stats.today}
          </strong>

          <small>
            Due today
          </small>
        </div>

        <div className="followup-stat overdue">
          <span>!</span>

          <strong>
            {stats.overdue}
          </strong>

          <small>
            Overdue
          </small>
        </div>

        <div className="followup-stat upcoming">
          <span>
            <Icon
              name="calendar"
              size={16}
            />
          </span>

          <strong>
            {stats.upcoming}
          </strong>

          <small>
            Upcoming
          </small>
        </div>

        <div className="followup-stat completed">
          <span>✓</span>

          <strong>
            {stats.completed}
          </strong>

          <small>
            Completed
          </small>
        </div>
      </div>

      {view === "calendar" ? (
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
                {calendarTitle}
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
                onClick={() =>
                  openSchedule()
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
                const key =
                  dateKey(date);

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
                      key === todayKey
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
                        .map(
                          (item) => {
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
        </section>
      ) : (
        <section className="followups-list-card">
          <div className="followups-tabs">
            <button
              type="button"
              className={
                activeTab === "today"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "today"
                )
              }
            >
              Today
              <b>
                {stats.today}
              </b>
            </button>

            <button
              type="button"
              className={
                activeTab === "upcoming"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "upcoming"
                )
              }
            >
              Upcoming
              <b>
                {stats.upcoming}
              </b>
            </button>

            <button
              type="button"
              className={
                activeTab === "overdue"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "overdue"
                )
              }
            >
              Overdue
              <b>
                {stats.overdue}
              </b>
            </button>

            <button
              type="button"
              className={
                activeTab === "completed"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "completed"
                )
              }
            >
              Completed
              <b>
                {stats.completed}
              </b>
            </button>

            <button
              type="button"
              className={
                activeTab === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("all")
              }
            >
              All
              <b>
                {allFollowUps.length}
              </b>
            </button>
          </div>

          <div className="followups-filters">
            <input
              type="search"
              placeholder="Search patient or lead..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            <select
              value={assignedFilter}
              onChange={(event) =>
                setAssignedFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                Assigned to
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
            </select>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                Priority
              </option>

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

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(
                  event.target.value
                )
              }
            >
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

            <span className="followups-result-count">
              {filteredFollowUps.length}{" "}
              follow-ups
            </span>
          </div>

          {loading ? (
            <div className="followups-empty">
              Loading follow-ups...
            </div>
          ) : error ? (
            <div className="followups-empty error">
              {error}
            </div>
          ) : filteredFollowUps.length ===
            0 ? (
            <div className="followups-empty">
              <div>
                <Icon
                  name="calendar"
                  size={30}
                />
              </div>

              <strong>
                No follow-ups found
              </strong>

              <p>
                Schedule a follow-up
                for a lead to see it
                here.
              </p>

              <button
                type="button"
                onClick={() =>
                  openSchedule()
                }
              >
                Schedule follow-up
              </button>
            </div>
          ) : (
            <div className="followups-rows">
              {filteredFollowUps.map(
                (item) => {
                  const status =
                    getFollowUpStatus(
                      item
                    );

                  return (
                    <div
                      className={`followup-row ${status} ${
                        String(focusFollowUpId) ===
                        String(item._id)
                          ? "followup-row-focus-target"
                          : ""
                      }`}
                      data-followup-id={String(item._id)}
                      key={item._id}
                    >
                      <div
                        className={`followup-avatar priority-${String(
                          item.priority ||
                            "Medium"
                        ).toLowerCase()}`}
                      >
                        {getInitials(
                          item.name
                        )}
                      </div>

                      <div className="followup-main">
                        <div className="followup-name-line">
                          <button
                            type="button"
                            className="followup-lead-name"
                            onClick={() =>
                              openLead(
                                item.leadId
                              )
                            }
                          >
                            {item.name}
                          </button>

                          <span
                            className={`followup-status-badge ${status}`}
                          >
                            {status ===
                            "today"
                              ? "Due today"
                              : status ===
                                "overdue"
                              ? "Overdue"
                              : status ===
                                "completed"
                              ? "Completed"
                              : "Upcoming"}
                          </span>

                          <span
                            className={`followup-priority ${String(
                              item.priority ||
                                "Medium"
                            ).toLowerCase()}`}
                          >
                            {item.priority ||
                              "Medium"}
                          </span>
                        </div>

                        <div className="followup-purpose">
                          {item.purpose ||
                            "Follow-up"}
                        </div>

                        <div className="followup-meta">
                          {item.phone && (
                            <span>
                              <Icon
                                name="phone"
                                size={13}
                              />
                              {
                                item.phone
                              }
                            </span>
                          )}

                          {item.owner && (
                            <span>
                              {item.owner}
                            </span>
                          )}

                          {item.service && (
                            <span className="followup-service">
                              {
                                item.service
                              }
                            </span>
                          )}

                          {healthcare &&
                            item.lead
                              ?.preferredDoctor && (
                              <span>
                                {
                                  item
                                    .lead
                                    .preferredDoctor
                                }
                              </span>
                            )}

                          {item.createdAt && (
                            <span className="followup-created-time">
                              Created{" "}
                              {formatDateTime(
                                item.createdAt
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="followup-date">
                        <strong>
                          {formatDate(
                            item.date
                          )}
                        </strong>

                        <span>
                          {formatTime(
                            item.date
                          )}
                        </span>
                      </div>

                      <div className="followup-actions">
                        <button
                          type="button"
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

                          <span>
                            Call
                          </span>
                        </button>

                        <button
                          type="button"
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

                          <span>
                            WhatsApp
                          </span>
                        </button>

                        <button
                          type="button"
                          title="Reschedule follow-up"
                          onClick={() =>
                            openSchedule(
                              item.lead,
                              item
                            )
                          }
                        >
                          <Icon
                            name="calendar"
                            size={17}
                          />

                          <span>
                            Reschedule
                          </span>
                        </button>

                        <button
                          type="button"
                          className="followup-delete-btn"
                          title="Delete follow-up"
                          aria-label="Delete follow-up"
                          onClick={() =>
                            deleteFollowUp(item)
                          }
                        >
                          <Icon
                            name="trash"
                            size={17}
                          />
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      )}

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
                  {isRescheduling
                    ? "Reschedule follow-up"
                    : "Schedule follow-up"}
                </h2>

                <p>
                  {isRescheduling
                    ? "Update the date, time and note for this follow-up."
                    : "Keep the lead moving with the next action."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
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

                  {isRescheduling ? (
                    <div className="followup-selected-lead">
                      <span>
                        {getInitials(
                          selectedLead?.name ||
                            initialLead?.name ||
                            ""
                        )}
                      </span>

                      <strong>
                        {selectedLead?.name ||
                          initialLead?.name ||
                          "Unnamed lead"}
                      </strong>
                    </div>
                  ) : (
                    <div className="followup-lead-search">
                      <div className="followup-lead-search-input">
                        <Icon
                          name="search"
                          size={16}
                        />

                        <input
                          type="text"
                          value={
                            leadSearch
                          }
                          placeholder={
                            healthcare
                              ? "Search or enter patient name..."
                              : "Search or enter lead name..."
                          }
                          onChange={(
                            event
                          ) => {
                            const value =
                              event.target
                                .value;

                            setLeadSearch(
                              value
                            );
                            setSelectedLeadId(
                              ""
                            );
                            setIsNewLead(
                              false
                            );
                            setShowLeadResults(
                              value.trim()
                                .length >
                                0
                            );
                          }}
                          autoComplete="off"
                          required
                        />
                      </div>

                      {showLeadResults &&
                        leadSearch.trim() && (
                          <div className="followup-lead-results">
                            {matchingLeads.length >
                              0 && (
                              <div className="followup-search-results-list">
                                {matchingLeads.map(
                                  (
                                    lead
                                  ) => (
                                    <button
                                      type="button"
                                      className="followup-lead-result"
                                      key={
                                        lead._id
                                      }
                                      onClick={() =>
                                        selectExistingLead(
                                          lead
                                        )
                                      }
                                    >
                                      <span className="followup-lead-result-avatar">
                                        {getInitials(
                                          lead.name
                                        )}
                                      </span>

                                      <span className="followup-lead-result-content">
                                        <strong>
                                          {lead.name ||
                                            "Unnamed lead"}
                                        </strong>

                                        {lead.phone && (
                                          <small>
                                            {
                                              lead.phone
                                            }
                                          </small>
                                        )}
                                      </span>
                                    </button>
                                  )
                                )}
                              </div>
                            )}

                            {!exactLeadExists && (
                              <button
                                type="button"
                                className="followup-add-new-lead"
                                onClick={
                                  selectNewLead
                                }
                              >
                                <span className="followup-add-icon">
                                  +
                                </span>

                                <div>
                                  <strong>
                                    Add "
                                    {leadSearch.trim()}
                                    "
                                  </strong>

                                  <small>
                                    Create new{" "}
                                    {healthcare
                                      ? "patient"
                                      : "lead"}
                                  </small>
                                </div>
                              </button>
                            )}
                          </div>
                        )}

                      {isNewLead &&
                        leadSearch.trim() && (
                          <div className="followup-new-lead-selected">
                            New{" "}
                            {healthcare
                              ? "patient"
                              : "lead"}{" "}
                            will be created:
                            {" "}
                            <strong>
                              {
                                leadSearch.trim()
                              }
                            </strong>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="followup-form-grid">
                  <div className="followup-form-group">
                    <label>
                      Schedule Date
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
                          event.target
                            .value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="followup-form-group">
                    <label>
                      Schedule Time
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
                          event.target
                            .value
                        )
                      }
                      required
                    />
                  </div>
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
                    required
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
                        event.target
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
                      (service) => (
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
                    rows="3"
                    value={
                      form.note
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "note",
                        event.target
                          .value
                      )
                    }
                    placeholder="Add a note for this follow-up..."
                  />
                </div>

                {error && (
                  <div className="followup-form-error">
                    {error}
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
                    ? isRescheduling
                      ? "Rescheduling..."
                      : "Scheduling..."
                    : isRescheduling
                    ? "Reschedule follow-up"
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