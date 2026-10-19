import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/api";

function getToken() {
  return (
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("vitalsToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    ""
  );
}

function getUser() {
  const saved =
    sessionStorage.getItem("user") ||
    sessionStorage.getItem("vitalsUser") ||
    localStorage.getItem("user") ||
    localStorage.getItem("vitalsUser");

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

const FOLLOW_UP_STATUS_OPTIONS = [
  {
    value: "No answer",
    label: "Not Answered",
  },
  {
    value: "Changed mind",
    label: "Mind Changed",
  },
  {
    value: "Treatment completed",
    label: "Surgery Done",
  },
];

const COMPLETED_FOLLOW_UP_STATUSES = [
  "No answer",
  "Changed mind",
  "Treatment completed",
  "Converted",
];

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
  ).trim();

  return COMPLETED_FOLLOW_UP_STATUSES.includes(
    status
  );
}

function followUpStatusLabel(status) {
  const value = String(
    status || ""
  ).trim();

  const option = FOLLOW_UP_STATUS_OPTIONS.find(
    (item) => item.value === value
  );

  return option?.label || value || "Scheduled";
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


function FollowUpDetails({
  item,
  healthcare = false,
  onBack,
  onSaved,
  onReschedule,
}) {
  const [status, setStatus] = useState(item?.status || "Scheduled");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSaved, setStatusSaved] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");
  const [noteError, setNoteError] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [savingNewNote, setSavingNewNote] = useState(false);

  useEffect(() => {
    setStatus(item?.status || "Scheduled");
    setStatusError("");
    setStatusSaved(false);
  }, [item?._id, item?.status]);

  const lead = item?.lead || {};
  const notes = Array.isArray(lead?.notes) ? lead.notes : [];
  const phone = normalizePhone(item?.phone || lead?.phone);
  const leadId = item?.leadId || lead?._id;

  const saveStatus = async () => {
    if (!item?.leadId || !item?._id) {
      setStatusError("Follow-up ID not found.");
      return;
    }
    const token = getToken();
    if (!token) {
      setStatusError("Your session has expired.");
      return;
    }
    if (!COMPLETED_FOLLOW_UP_STATUSES.includes(status)) {
      setStatusError("Please select a status.");
      return;
    }
    try {
      setSavingStatus(true);
      setStatusError("");
      setStatusSaved(false);
      const response = await fetch(
        buildApiUrl(`/api/leads/${item.leadId}/follow-ups/${item._id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: item.date,
            note: item.note || "",
            service: item.service || "",
            reminder: item.reminder !== false,
            purpose: item.purpose || "Follow-up",
            channel: item.channel || "Call",
            assignedTo: item.assignedTo || item.owner || "",
            priority: item.priority || "Medium",
            status,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to update follow-up status.");
      const updatedFollowUp = data?.followUp || data?.data || { ...item, status };
      const nextStatus = updatedFollowUp?.status || status;
      setStatus(nextStatus);
      setStatusSaved(true);
      if (typeof onSaved === "function") {
        await onSaved({ ...item, ...updatedFollowUp, status: nextStatus });
      }
    } catch (error) {
      setStatusError(error.message || "Unable to update follow-up status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const callLead = () => {
    const value = item?.phone || lead?.phone;
    if (value) window.location.href = `tel:${value}`;
  };

  const whatsappLead = () => {
    if (!phone) return;
    const number = phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
  };

  const saveNewNote = async () => {
    const text = newNoteText.trim();
    if (!text || !leadId || savingNewNote) return;

    const token = getToken();
    if (!token) {
      setNoteError("Your session has expired.");
      setNoteMessage("");
      return;
    }

    try {
      setSavingNewNote(true);
      setNoteError("");
      setNoteMessage("");

      const currentUser = getUser();
      const response = await fetch(
        buildApiUrl(`/api/leads/${leadId}/notes`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text,
            userName: currentUser?.name || "",
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save note.");
      }

      setNewNoteText("");
      setNoteMessage("Note saved successfully.");

      if (typeof onSaved === "function") {
        await onSaved({
          ...item,
          lead: data?.lead || {
            ...lead,
            notes: [
              ...notes,
              {
                text,
                userName: currentUser?.name || "",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        });
      }
    } catch (error) {
      setNoteError(error.message || "Unable to save note.");
    } finally {
      setSavingNewNote(false);
    }
  };

  const openEditNote = (note, index) => {
    if (!note || !leadId) return;
    setEditingNote({ ...note, _index: index });
    setEditNoteText(note?.text || note?.note || "");
    setNoteError("");
    setNoteMessage("");
  };

  const closeEditNote = () => {
    if (savingNoteEdit) return;
    setEditingNote(null);
    setEditNoteText("");
  };

  const saveEditedNote = async (event) => {
    event.preventDefault();
    const text = editNoteText.trim();
    if (!text || !editingNote || !leadId) return;
    const token = getToken();
    if (!token) {
      setNoteError("Your session has expired.");
      return;
    }
    const noteId = String(editingNote?._id || editingNote?.id || `note-${editingNote._index}`);
    if (noteId.startsWith("note-")) {
      setNoteError("This note has no saved ID and cannot be edited from this screen.");
      return;
    }
    try {
      setSavingNoteEdit(true);
      setNoteError("");
      setNoteMessage("");
      const response = await fetch(
        buildApiUrl(`/api/leads/${leadId}/notes/${noteId}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text, userName: editingNote?.userName || "" }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to edit note.");
      setEditingNote(null);
      setEditNoteText("");
      setNoteMessage("Note edited successfully.");
      if (typeof onSaved === "function") {
        await onSaved({ ...item, lead: data?.lead || item?.lead });
      }
    } catch (error) {
      setNoteError(error.message || "Unable to edit note.");
    } finally {
      setSavingNoteEdit(false);
    }
  };

  const terminal = isCompleted({ status });
  const scheduledDate = item?.date;
  const createdAt = item?.createdAt || item?.created_at;
  const ownerName = item?.owner || item?.assignedTo || "Unassigned";

  return (
    <div className="followup-detail-page lead-details-page">
      <style>{`
        .followup-detail-page { padding: 24px 28px 48px; min-height:100%; background:#f6f9fc; color:#172033; box-sizing:border-box; }
        .followup-detail-topbar { display:flex; align-items:center; justify-content:space-between; gap:14px; margin:0 auto 14px; max-width:1240px; }
        .followup-detail-back { border:0; background:transparent; color:#315ea8; font-size:13px; font-weight:500; cursor:pointer; padding:5px 0; }
        .followup-detail-top-actions { display:flex; gap:8px; }
        .followup-detail-top-actions button { min-height:34px; padding:0 12px; border:1px solid #dbe3ef; border-radius:8px; background:#fff; color:#29405f; display:inline-flex; align-items:center; gap:7px; cursor:pointer; font-size:12px; }
        .followup-detail-top-actions button:disabled { opacity:.5; cursor:not-allowed; }
        .followup-detail-profile { max-width:1240px; margin:0 auto 14px; background:#fff; border:1px solid #dfe7f2; border-radius:14px; padding:16px 18px; display:flex; align-items:center; gap:12px; box-shadow:0 8px 24px rgba(31,56,88,.04); }
        .followup-detail-avatar { width:44px; height:44px; border-radius:13px; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; flex-shrink:0; }
        .followup-detail-profile-main { min-width:0; }
        .followup-detail-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .followup-detail-title-row h1 { margin:0; font-size:19px; line-height:1.25; color:#111827; font-weight:700; }
        .followup-detail-status,.followup-detail-priority { display:inline-flex; align-items:center; min-height:23px; padding:0 9px; border-radius:999px; font-size:10px; font-weight:700; }
        .followup-detail-status.active { background:#fff4dc; color:#9b6400; } .followup-detail-status.completed { background:#eaf8ef; color:#168346; }
        .followup-detail-priority.low { background:#edf7ff; color:#2d6a9f; } .followup-detail-priority.medium { background:#fff4e6; color:#a96713; } .followup-detail-priority.high { background:#fff0f0; color:#c53030; }
        .followup-detail-profile-meta { margin-top:7px; display:flex; flex-wrap:wrap; gap:6px 14px; color:#64748b; font-size:11px; }
        .followup-detail-layout { max-width:1240px; margin:0 auto; display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:14px; align-items:start; }
        .followup-detail-main,.followup-detail-sidebar { display:flex; flex-direction:column; gap:14px; min-width:0; }
        .followup-detail-card { overflow:hidden; border:1px solid #dfe7f2; border-radius:14px; background:#fff; box-shadow:0 8px 24px rgba(31,56,88,.045); }
        .followup-detail-card-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:15px 16px; border-bottom:1px solid #e8edf4; }
        .followup-detail-card-head h2 { margin:0; color:#111827; font-size:13px; font-weight:700; }
        .followup-detail-card-head p { margin:5px 0 0; color:#8190a5; font-size:10px; line-height:1.45; }
        .followup-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
        .followup-detail-field { padding:13px 16px; min-width:0; border-bottom:1px solid #e8edf4; }
        .followup-detail-field:nth-child(odd) { border-right:1px solid #e8edf4; }
        .followup-detail-field:nth-last-child(-n+2) { border-bottom:0; }
        .followup-detail-field span,.followup-detail-note-primary>span,.followup-detail-note>span { display:block; color:#8190a5; font-size:10px; margin-bottom:6px; }
        .followup-detail-field strong { display:block; color:#172033; font-size:11px; font-weight:650; overflow-wrap:anywhere; }
        .followup-detail-note-primary { padding:15px 16px; }
        .followup-detail-note-primary p,.followup-detail-note p { margin:0; color:#40516a; font-size:12px; line-height:1.6; white-space:pre-wrap; overflow-wrap:anywhere; }
        .followup-detail-notes-list { border-top:1px solid #e8edf4; }
        .followup-detail-notes-title { padding:14px 16px 8px; color:#172033; font-size:12px; font-weight:700; }
        .followup-detail-note { padding:12px 16px; border-top:1px solid #edf1f6; }
        .followup-detail-note:first-of-type { border-top:0; }
        .followup-detail-note-head { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:8px; }
        .followup-detail-note small { display:block; margin-top:7px; color:#8190a5; font-size:10px; }
        .followup-note-edit-btn { flex:0 0 auto; border:1px solid #d8e3f0; border-radius:8px; background:#fff; color:#2563eb; padding:6px 10px; display:inline-flex; align-items:center; gap:6px; font-size:11px; cursor:pointer; }
        .followup-note-composer { padding:12px; border:1px solid #dfe7f2; border-radius:14px; background:#fff; box-shadow:0 8px 24px rgba(31,56,88,.045); }
        .followup-note-composer textarea { display:block; width:100%; min-height:74px; resize:vertical; box-sizing:border-box; padding:12px; border:1px solid #d8e3f0; border-radius:9px; outline:none; color:#172033; font:inherit; font-size:12px; line-height:1.5; }
        .followup-note-composer textarea:focus { border-color:#8ab0ff; box-shadow:0 0 0 3px rgba(37,99,235,.08); }
        .followup-note-composer-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:10px; }
        .followup-note-composer-actions button { min-height:34px; padding:0 13px; border:1px solid #d8e3f0; border-radius:8px; background:#fff; color:#40516a; font-size:12px; cursor:pointer; }
        .followup-note-composer-actions button.primary { border-color:#2563eb; background:#2563eb; color:#fff; }
        .followup-note-composer-actions button:disabled { opacity:.55; cursor:not-allowed; }
        .followup-detail-timeline { padding:0 16px; }
        .followup-timeline-item { display:flex; gap:12px; position:relative; padding:15px 0; border-bottom:1px solid #e8edf4; }
        .followup-timeline-item:last-child { padding-bottom:15px; border-bottom:0; }
        .followup-timeline-dot { width:9px; height:9px; margin-top:4px; border:1px solid #2563eb; background:#edf5ff; border-radius:50%; flex:0 0 9px; }
        .followup-timeline-item strong { color:#172033; font-size:11px; font-weight:700; }
        .followup-timeline-item p { margin:6px 0 0; color:#8190a5; font-size:10px; }
        .followup-activity-head { align-items:center; flex-wrap:wrap; }
        .followup-activity-filters { display:flex; align-items:center; gap:5px; }
        .followup-activity-filters span { display:inline-flex; align-items:center; justify-content:center; min-height:28px; padding:0 10px; border-radius:8px; color:#64748b; font-size:10px; white-space:nowrap; }
        .followup-activity-filters span.active { background:#edf4ff; color:#2563eb; font-weight:700; }
        .followup-activity-timeline { padding-top:2px; padding-bottom:2px; }
        .followup-activity-event { gap:12px; }
        .followup-timeline-icon { position:relative; z-index:1; width:23px; height:23px; flex:0 0 23px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#edf4ff; color:#2563eb; margin-top:0; }
        .followup-timeline-icon.note { background:#edf4ff; font-size:16px; }
        .followup-timeline-icon.created { font-weight:700; font-size:16px; }
        .followup-activity-content { flex:1; min-width:0; }
        .followup-activity-content p { margin:7px 0 0; color:#40516a; font-size:11px; line-height:1.55; overflow-wrap:anywhere; }
        .followup-activity-content small { display:block; margin-top:7px; color:#8190a5; font-size:10px; }
        .followup-activity-badges { display:flex; gap:6px; margin-top:8px; }
        .followup-activity-badges span { display:inline-flex; padding:4px 7px; border:1px solid #dbe7fb; border-radius:5px; background:#f8fbff; color:#315ea8; font-size:9px; font-weight:600; }
        .followup-activity-content .followup-activity-note-text { white-space:pre-wrap; }
        .followup-activity-event-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .followup-status-body { padding:14px 15px 15px; }
        .followup-status-body label { display:block; margin:0 0 7px; color:#52627a; font-size:10px; }
        .followup-status-body select { width:100%; height:36px; padding:0 10px; border:1px solid #d8e3f0; border-radius:8px; color:#34445c; background:#fff; font-size:11px; outline:none; }
        .followup-status-save { width:100%; min-height:36px; margin-top:9px; border:0; border-radius:8px; background:#2563eb; color:#fff; font-size:12px; font-weight:600; cursor:pointer; }
        .followup-status-save:disabled { opacity:.6; cursor:not-allowed; }
        .followup-status-error,.followup-status-success { margin-top:8px; font-size:11px; line-height:1.4; } .followup-status-error { color:#c53030; } .followup-status-success { color:#168346; }
        .followup-quick-actions { display:flex; flex-direction:column; gap:7px; padding:12px 15px 15px; }
        .followup-quick-actions button { width:100%; min-height:34px; padding:0 10px; border:1px solid #d8e3f0; border-radius:8px; background:#fff; color:#29405f; display:flex; align-items:center; justify-content:flex-start; gap:8px; font-size:11px; cursor:pointer; }
        .followup-quick-actions button:disabled { opacity:.5; cursor:not-allowed; }
        .followup-note-modal-backdrop { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(15,23,42,.48); }
        .followup-note-modal { width:min(520px,100%); background:#fff; border:1px solid #dfe7f2; border-radius:16px; box-shadow:0 24px 70px rgba(15,23,42,.24); overflow:hidden; }
        .followup-note-modal-head { padding:18px 20px; border-bottom:1px solid #e8edf4; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .followup-note-modal-head h2 { margin:0; font-size:16px; color:#172033; } .followup-note-modal-head p { margin:5px 0 0; color:#8190a5; font-size:11px; }
        .followup-note-modal-close { border:0; background:transparent; color:#64748b; font-size:23px; line-height:1; cursor:pointer; }
        .followup-note-modal-body { padding:18px 20px; } .followup-note-modal-body label { display:block; margin-bottom:8px; color:#40516a; font-size:12px; font-weight:600; }
        .followup-note-modal-body textarea { width:100%; min-height:140px; resize:vertical; padding:11px 12px; border:1px solid #d8e3f0; border-radius:9px; font:inherit; font-size:13px; line-height:1.5; box-sizing:border-box; outline:none; }
        .followup-note-modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:14px 20px; border-top:1px solid #e8edf4; }
        .followup-note-modal-footer button { min-height:36px; padding:0 14px; border-radius:8px; border:1px solid #d8e3f0; background:#fff; color:#40516a; cursor:pointer; font-size:12px; }
        .followup-note-modal-footer button.primary { border-color:#2563eb; background:#2563eb; color:#fff; } .followup-note-modal-footer button:disabled { opacity:.6; cursor:not-allowed; }
        @media(max-width:900px) { .followup-detail-layout { grid-template-columns:minmax(0,1fr) 290px; } .followup-detail-page { padding:20px 16px 36px; } }
        @media(max-width:700px) { .followup-detail-layout { grid-template-columns:1fr; } .followup-detail-topbar { align-items:flex-start; } .followup-detail-top-actions { gap:5px; } .followup-detail-top-actions button { padding:0 8px; } .followup-detail-profile { align-items:flex-start; padding:14px; } .followup-detail-title-row h1 { font-size:17px; } .followup-detail-grid { grid-template-columns:1fr 1fr; } }
        @media(max-width:420px) { .followup-detail-topbar { flex-direction:column; } .followup-detail-grid { grid-template-columns:1fr; } .followup-detail-field:nth-child(odd) { border-right:0; } .followup-detail-field:nth-last-child(2) { border-bottom:1px solid #e8edf4; } }
      `}</style>

      <div className="followup-detail-topbar">
        <button type="button" className="followup-detail-back" onClick={onBack}>← Back to follow-ups</button>
        <div className="followup-detail-top-actions">
          <button type="button" onClick={callLead} disabled={!phone}><Icon name="phone" size={14} /> Call</button>
          <button type="button" onClick={whatsappLead} disabled={!phone}><Icon name="whatsapp" size={14} /> WhatsApp</button>
        </div>
      </div>

      <section className="followup-detail-profile">
        <div className="followup-detail-avatar">{getInitials(item?.name || lead?.name)}</div>
        <div className="followup-detail-profile-main">
          <div className="followup-detail-title-row">
            <h1>{item?.name || lead?.name || "Unnamed lead"}</h1>
            <span className={`followup-detail-status ${terminal ? "completed" : "active"}`}>{followUpStatusLabel(status)}</span>
            <span className={`followup-detail-priority ${String(item?.priority || "Medium").toLowerCase()}`}>{item?.priority || "Medium"}</span>
          </div>
          <div className="followup-detail-profile-meta">
            {(item?.phone || lead?.phone) && <span>{item?.phone || lead?.phone}</span>}
            {(item?.email || lead?.email) && <span>{item?.email || lead?.email}</span>}
            <span>{item?.service || item?.treatment || lead?.service || lead?.treatment || "—"}</span>
            <span>{item?.channel || "Call"}</span>
          </div>
        </div>
      </section>

      {(noteMessage || noteError) && <div style={{maxWidth:1240,margin:"0 auto 12px",fontSize:12,color:noteError ? "#c53030" : "#168346"}}>{noteError || noteMessage}</div>}

      <div className="followup-detail-layout">
        <main className="followup-detail-main">
          <section className="followup-detail-card">
            <div className="followup-detail-card-head"><div><h2>Follow-up details</h2><p>Complete record of this follow-up.</p></div></div>
            <div className="followup-detail-grid">
              <div className="followup-detail-field"><span>Scheduled date</span><strong>{formatDate(scheduledDate)}</strong></div>
              <div className="followup-detail-field"><span>Scheduled time</span><strong>{formatTime(scheduledDate)}</strong></div>
              <div className="followup-detail-field"><span>Created</span><strong>{formatDateTime(createdAt)}</strong></div>
              <div className="followup-detail-field"><span>Assigned to</span><strong>{ownerName}</strong></div>
              <div className="followup-detail-field"><span>Source</span><strong>{lead?.source || lead?.leadSource || lead?.sourceName || "—"}</strong></div>
              <div className="followup-detail-field"><span>Priority</span><strong>{item?.priority || lead?.priority || "Medium"}</strong></div>
              <div className="followup-detail-field"><span>{healthcare ? "Treatment" : "Service"}</span><strong>{item?.service || item?.treatment || lead?.service || lead?.treatment || "—"}</strong></div>
              <div className="followup-detail-field"><span>Purpose</span><strong>{item?.purpose || "Follow-up"}</strong></div>
            </div>
          </section>

             <section className="followup-note-composer">
            <textarea
              value={newNoteText}
              onChange={(event) => setNewNoteText(event.target.value)}
              placeholder="Add a note about this follow-up — what was discussed, patient response, objections, next steps..."
              aria-label="Add a note about this follow-up"
            />
            <div className="followup-note-composer-actions">
              <button
                type="button"
                className="primary"
                onClick={saveNewNote}
                disabled={savingNewNote || !newNoteText.trim() || !leadId}
              >
                {savingNewNote ? "Saving..." : "Save note"}
              </button>
            </div>
          </section>

          <section className="followup-detail-card followup-activity-card">
            <div className="followup-detail-card-head followup-activity-head">
              <div><h2>Activity timeline</h2><p>Notes and important events for this follow-up.</p></div>
              <div className="followup-activity-filters" aria-label="Activity types">
                <span className="active">All</span><span>Notes</span><span>Calls</span><span>WhatsApp</span>
              </div>
            </div>
            <div className="followup-detail-timeline followup-activity-timeline">
              <div className="followup-timeline-item followup-activity-event">
                <span className="followup-timeline-icon"><Icon name="calendar" size={14}/></span>
                <div className="followup-activity-content">
                  <strong>Follow-up scheduled</strong>
                  <div className="followup-activity-badges"><span>{formatDate(scheduledDate)}</span><span>{formatTime(scheduledDate)}</span></div>
                  <p>Follow-up scheduled for {formatDateTime(scheduledDate)}</p>
                  <small>{ownerName} · Created {formatDateTime(createdAt)}</small>
                </div>
              </div>

              {item?.note && (
                <div className="followup-timeline-item followup-activity-event">
                  <span className="followup-timeline-icon note"><span aria-hidden="true">▱</span></span>
                  <div className="followup-activity-content">
                    <strong>Follow-up note added</strong>
                    <p className="followup-activity-note-text">{item.note}</p>
                    <small>{ownerName} · {formatDateTime(createdAt)}</small>
                  </div>
                </div>
              )}

              {notes.length ? notes.map((note, index) => (
                <div className="followup-timeline-item followup-activity-event" key={note?._id || note?.id || `note-${index}`}>
                  <span className="followup-timeline-icon note"><span aria-hidden="true">▱</span></span>
                  <div className="followup-activity-content">
                    <div className="followup-activity-event-heading">
                      <strong>Note added</strong>
                      <button type="button" className="followup-note-edit-btn" onClick={() => openEditNote(note,index)} disabled={savingNoteEdit || !leadId} title="Edit note"><span aria-hidden="true">✎</span> Edit</button>
                    </div>
                    <p className="followup-activity-note-text">{note?.text || note?.note || "—"}</p>
                    <small>{note?.userName || "User"} · Created {formatDateTime(note?.updatedAt || note?.createdAt)}</small>
                  </div>
                </div>
              )) : null}

              {item?.firstNote && (
                <div className="followup-timeline-item followup-activity-event">
                  <span className="followup-timeline-icon note"><span aria-hidden="true">▱</span></span>
                  <div className="followup-activity-content"><strong>Original lead note</strong><p className="followup-activity-note-text">{item.firstNote}</p></div>
                </div>
              )}

              <div className="followup-timeline-item followup-activity-event">
                <span className="followup-timeline-icon created"><span aria-hidden="true">+</span></span>
                <div className="followup-activity-content">
                  <strong>Current status: {followUpStatusLabel(status)}</strong>
                  <p>Scheduled for {formatDateTime(scheduledDate)}</p>
                  <small>{ownerName}</small>
                </div>
              </div>
            </div>
          </section>
       


        </main>

        <aside className="followup-detail-sidebar">
          <section className="followup-detail-card followup-status-card">
            <div className="followup-detail-card-head"><div><h2>Update status</h2><p>Mark what happened with this follow-up.</p></div></div>
            <div className="followup-status-body">
              <label htmlFor="followup-status">Status</label>
              <select id="followup-status" value={COMPLETED_FOLLOW_UP_STATUSES.includes(status) ? status : ""} onChange={(event) => {setStatus(event.target.value);setStatusSaved(false);setStatusError("");}}>
                <option value="">Change status</option>
                {FOLLOW_UP_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {statusError && <div className="followup-status-error">{statusError}</div>}
              {statusSaved && <div className="followup-status-success">Status updated successfully.</div>}
              <button type="button" className="followup-status-save" onClick={saveStatus} disabled={savingStatus}>{savingStatus ? "Saving..." : "Save status"}</button>
            </div>
          </section>
          <section className="followup-detail-card">
            <div className="followup-detail-card-head"><div><h2>Quick actions</h2></div></div>
            <div className="followup-quick-actions">
              <button type="button" onClick={callLead} disabled={!phone}><Icon name="phone" size={15}/> Call lead</button>
              <button type="button" onClick={whatsappLead} disabled={!phone}><Icon name="whatsapp" size={15}/> WhatsApp</button>
              <button type="button" onClick={() => typeof onReschedule === "function" && onReschedule(item)}><Icon name="calendar" size={15}/> Reschedule</button>
            </div>
          </section>
        </aside>
      </div>

      {editingNote && (
        <div className="followup-note-modal-backdrop" onClick={closeEditNote}>
          <form className="followup-note-modal" onSubmit={saveEditedNote} onClick={(event) => event.stopPropagation()}>
            <div className="followup-note-modal-head"><div><h2>Edit note</h2><p>Update this lead note.</p></div><button type="button" className="followup-note-modal-close" onClick={closeEditNote} disabled={savingNoteEdit} aria-label="Close">×</button></div>
            <div className="followup-note-modal-body"><label htmlFor="followup-edit-note">Note</label><textarea id="followup-edit-note" value={editNoteText} onChange={(event) => setEditNoteText(event.target.value)} autoFocus required/></div>
            {noteError && <div style={{padding:"0 20px 12px",color:"#c53030",fontSize:12}}>{noteError}</div>}
            <div className="followup-note-modal-footer"><button type="button" onClick={closeEditNote} disabled={savingNoteEdit}>Cancel</button><button type="submit" className="primary" disabled={savingNoteEdit || !editNoteText.trim()}>{savingNoteEdit ? "Saving..." : "Save changes"}</button></div>
          </form>
        </div>
      )}
    </div>
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

  const [selectedFollowUp, setSelectedFollowUp] =
    useState(null);

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

  const [updatingStatusId, setUpdatingStatusId] =
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

  const updateFollowUpStatus = async (
    item,
    nextStatus
  ) => {
    if (
      !item?.leadId ||
      !item?._id ||
      !COMPLETED_FOLLOW_UP_STATUSES.includes(
        nextStatus
      )
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Your session has expired.");
      return;
    }

    try {
      setUpdatingStatusId(item._id);
      setError("");

      const response = await fetch(
        buildApiUrl(
          `/api/leads/${item.leadId}/follow-ups/${item._id}`
        ),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: item.date,
            note: item.note || "",
            service: item.service || "",
            reminder: item.reminder !== false,
            purpose: item.purpose || "Follow-up",
            channel: item.channel || "Call",
            assignedTo:
              item.assignedTo ||
              item.owner ||
              "",
            priority: item.priority || "Medium",
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Unable to update follow-up status."
        );
      }

      await loadFollowUps();
    } catch (err) {
      console.error(
        "UPDATE FOLLOW UP STATUS ERROR:",
        err
      );

      setError(
        err.message ||
        "Unable to update follow-up status."
      );
    } finally {
      setUpdatingStatusId("");
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

  const openFollowUpDetails = (item) => {
    if (!item) return;
    setSelectedFollowUp(item);
  };

  const closeFollowUpDetails = () => {
    setSelectedFollowUp(null);
  };

  const handleFollowUpSaved = async (
    updatedItem
  ) => {
    setSelectedFollowUp(updatedItem);
    await loadFollowUps();
  };

  const handleFollowUpReschedule = (
    item
  ) => {
    setSelectedFollowUp(null);
    openSchedule(
      item?.lead || selectedLead || null,
      item
    );
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

  if (selectedFollowUp) {
    return (
      <FollowUpDetails
        item={selectedFollowUp}
        healthcare={healthcare}
        onBack={closeFollowUpDetails}
        onSaved={handleFollowUpSaved}
        onReschedule={handleFollowUpReschedule}
      />
    );
  }

  return (
    <div className="followups-page">
      <style>{`
        .followup-row-status-control {
          position: relative;
          width: 132px;
          height: 38px;
          flex: 0 0 132px;
          display: flex;
          align-items: center;
          border: 1px solid #dce4ef;
          border-radius: 9px;
          background: #ffffff;
          box-sizing: border-box;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .followup-row-status-control:hover {
          border-color: #bfd0e6;
          background: #fbfdff;
        }

        .followup-row-status-control:focus-within {
          border-color: #5a83df;
          box-shadow: 0 0 0 3px rgba(90, 131, 223, .10);
        }

        .followup-row-status-dot {
          width: 7px;
          height: 7px;
          margin-left: 11px;
          border-radius: 50%;
          flex: 0 0 7px;
          background: #aeb9c8;
          pointer-events: none;
        }

        .followup-row-status-dot.completed {
          background: #20a464;
          box-shadow: 0 0 0 3px rgba(32, 164, 100, .10);
        }

        .followup-row-status-dot.pending {
          background: #f0a52b;
          box-shadow: 0 0 0 3px rgba(240, 165, 43, .10);
        }

        .followup-row-status-select {
          width: 100%;
          height: 36px;
          min-width: 0;
          padding: 0 28px 0 8px;
          border: 0;
          border-radius: 8px;
          outline: none;
          background: transparent;
          color: #33445d;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image:
            linear-gradient(45deg, transparent 50%, #7b8ba1 50%),
            linear-gradient(135deg, #7b8ba1 50%, transparent 50%);
          background-position:
            calc(100% - 15px) 15px,
            calc(100% - 10px) 15px;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
        }

        .followup-row-status-select:disabled {
          opacity: .6;
          cursor: wait;
        }

        .followup-row-status-select option {
          background: #fff;
          color: #26364d;
          font-size: 12px;
          font-weight: 500;
        }

        .followup-actions {
          align-items: center;
        }

        @media (max-width: 900px) {
          .followup-row-status-control {
            width: 124px;
            flex-basis: 124px;
          }
        }

        @media (max-width: 680px) {
          .followup-row-status-control {
            width: 100%;
            flex-basis: 100%;
          }
        }
      `}</style>
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
                      className={`followup-row ${status} ${String(focusFollowUpId) ===
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
                              openFollowUpDetails(
                                item
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
                                  ? followUpStatusLabel(
                                    item.status ||
                                    "Completed"
                                  )
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
                         <div className="followup-row-status-control">
                          <span
                            className={`followup-row-status-dot ${
                              isCompleted(item)
                                ? "completed"
                                : "pending"
                            }`}
                          />

                          <select
                            className="followup-row-status-select"
                            value={
                              FOLLOW_UP_STATUS_OPTIONS.some(
                                (option) =>
                                  option.value === item.status
                              )
                                ? item.status
                                : ""
                            }
                            onChange={(event) =>
                              updateFollowUpStatus(
                                item,
                                event.target.value
                              )
                            }
                            disabled={
                              updatingStatusId === item._id
                            }
                            aria-label="Update follow-up status"
                          >
                            <option value="">
                              Status
                            </option>

                            {FOLLOW_UP_STATUS_OPTIONS.map(
                              (option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
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