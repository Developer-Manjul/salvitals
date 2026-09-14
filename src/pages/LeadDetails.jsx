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

function getInitials(name = "") {
  return name.trim().split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "L";
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function getOwner(lead, user) {
  return lead?.owner || lead?.preferredDoctor || user?.name || "—";
}

function getActivities(lead) {
  if (!lead) return [];
  const activities = [];

  if (lead.createdAt) {
    activities.push({ type: "all", icon: "✦", title: "Lead created", detail: `${lead.source || "Lead"} lead`, date: lead.createdAt });
  }

  if (lead.firstNote) {
    activities.push({ type: "notes", icon: "▱", title: "Initial note", detail: lead.firstNote, date: lead.createdAt });
  }

  (lead.notes || []).forEach((note) => {
    activities.push({ type: "notes", icon: "▱", title: "Note added", detail: note.text, date: note.createdAt, user: note.userName });
  });

  (lead.followUps || []).forEach((followUp) => {
    activities.push({ type: "all", icon: "◷", title: "Follow-up scheduled", detail: followUp.note || "Follow-up scheduled", date: followUp.date });
  });

  return activities.sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0));
}

export default function LeadDetails({ leadId, user, onBack }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadLead = async () => {
    const token = getToken();
    if (!token) {
      setError("Authentication required. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/api/leads/${leadId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load lead");
      setLead(data.lead);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [leadId]);

  const activities = useMemo(() => getActivities(lead), [lead]);
  const visibleActivities = activities.filter((activity) => activeTab === "all" || activity.type === activeTab);
  const phone = normalizePhone(lead?.phone);
  const nextFollowUp = lead?.followUps?.filter((item) => new Date(item.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const saveNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    setSaving(true);
    try {
      const response = await fetch(buildApiUrl(`/api/leads/${leadId}/notes`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text, userName: user?.name || "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save note");
      setLead(data.lead);
      setNoteText("");
      setNotice("Note saved");
    } catch (saveError) {
      setNotice(saveError.message || "Unable to save note");
    } finally {
      setSaving(false);
    }
  };

  const saveFollowUp = async (event) => {
    event.preventDefault();
    if (!followUpDate) return;
    setSaving(true);
    try {
      const response = await fetch(buildApiUrl(`/api/leads/${leadId}/follow-ups`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ date: followUpDate, note: followUpNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to schedule follow-up");
      setLead(data.lead);
      setFollowUpDate("");
      setFollowUpNote("");
      setShowFollowUp(false);
      setNotice("Follow-up scheduled");
    } catch (saveError) {
      setNotice(saveError.message || "Unable to schedule follow-up");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="lead-details-page-state">Loading lead details...</div>;
  if (error || !lead) {
    return <div className="lead-details-page-state"><strong>{error || "Lead not found"}</strong><button type="button" className="dash-btn" onClick={onBack}>Back to leads</button></div>;
  }

  return (
    <div className="lead-details-page">
      <button type="button" className="lead-details-back" onClick={onBack}>Leads &gt; {lead.name}</button>
      <section className="lead-detail-hero">
        <div className="lead-detail-identity">
          <span className="lead-detail-avatar">{getInitials(lead.name)}</span>
          <div>
            <div className="lead-detail-title-row"><h1>{lead.name}</h1><span className="lead-stage-pill">{lead.stage || "—"}</span>{lead.priority && <span className="lead-priority-pill">{lead.priority}</span>}</div>
            <p>{lead.phone || "—"} <span>•</span> {lead.email || "—"}</p>
            <div className="lead-detail-meta"><span>{lead.source || "—"}</span><span>{lead.service || "—"}</span><span>{lead.preferredDoctor || "—"}</span><span>{getOwner(lead, user)}</span></div>
          </div>
        </div>
        <div className="lead-detail-actions">
          {lead.phone && <a className="dash-btn" href={`tel:${lead.phone}`}>Call</a>}
          {lead.phone && <a className="dash-btn lead-whatsapp-btn" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          <button type="button" className="dash-btn" onClick={() => setShowFollowUp(true)}>Follow-up</button>
          <button type="button" className="dash-btn" onClick={() => document.querySelector(".lead-note-composer textarea")?.focus()}>Note</button>
          <button type="button" className="dash-btn" disabled title="Invoice functionality is not available for this lead">Invoice</button>
          {lead.email && <a className="dash-btn" href={`mailto:${lead.email}`}>Email</a>}
        </div>
        <div className="lead-detail-summary-bar">
          <div><strong>{lead.stage || "—"}</strong><span>Status</span></div>
          <div><strong>—</strong><span>Estimated value</span></div>
          <div><strong>{formatDate(lead.createdAt)}</strong><span>Created date</span></div>
          <div><strong>—</strong><span>Last contact</span></div>
          <div><strong>{nextFollowUp ? formatDate(nextFollowUp.date, true) : "—"}</strong><span>Next follow-up</span></div>
          <div><strong>—</strong><span>First response</span></div>
        </div>
      </section>

      <div className="lead-details-layout">
        <main>
          <section className="lead-note-composer">
            <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add a note about this lead — what was discussed, objections, next steps..." />
            <div><button type="button" className="lead-secondary-btn" onClick={() => setShowFollowUp(true)}>Add follow-up</button><button type="button" className="dash-btn primary" onClick={saveNote} disabled={saving || !noteText.trim()}>{saving ? "Saving..." : "Save note"}</button></div>
          </section>
          {notice && <p className="lead-detail-notice">{notice}</p>}
          <section className="lead-activity-card"><header><h2>Activity timeline</h2><div>{[["all", "All"], ["notes", "Notes"], ["calls", "Calls"], ["whatsapp", "WhatsApp"]].map(([value, label]) => <button type="button" className={activeTab === value ? "active" : ""} key={value} onClick={() => setActiveTab(value)}>{label}</button>)}</div></header><div className="lead-activity-list">{visibleActivities.length ? visibleActivities.map((activity, index) => <article key={`${activity.title}-${activity.date}-${index}`}><span className="lead-activity-icon">{activity.icon}</span><div><strong>{activity.title}</strong><p>{activity.detail}</p><small>{activity.user || getOwner(lead, user)} · {formatDate(activity.date, true)}</small></div></article>) : <p className="lead-detail-empty">No activity recorded yet.</p>}</div></section>
        </main>
        <aside>
          <section className="lead-information-card"><header><h2>Lead information</h2></header>{[["Source", lead.source], ["Service", lead.service], ["Doctor / Preferred doctor", lead.preferredDoctor], ["Assigned staff / Owner", getOwner(lead, user)], ["Priority", lead.priority], ["Next follow-up", nextFollowUp && formatDate(nextFollowUp.date, true)], ["Estimated value", lead.estimatedValue], ["Lead ID", lead._id], ["Created date", formatDate(lead.createdAt)]].map(([label, value]) => <div className="lead-information-row" key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}</section>
          {lead.firstNote && <section className="lead-information-card"><header><h2>First note</h2></header><p className="lead-first-note">{lead.firstNote}</p></section>}
        </aside>
      </div>

      {showFollowUp && <div className="lead-modal-backdrop" onClick={() => setShowFollowUp(false)}><form className="lead-follow-up-modal" onSubmit={saveFollowUp} onClick={(event) => event.stopPropagation()}><h2>Schedule follow-up</h2><label>Date and time<input type="datetime-local" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} required /></label><label>Note<textarea value={followUpNote} onChange={(event) => setFollowUpNote(event.target.value)} placeholder="Optional follow-up note" /></label><div><button type="button" className="lead-secondary-btn" onClick={() => setShowFollowUp(false)}>Cancel</button><button type="submit" className="dash-btn primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button></div></form></div>}
    </div>
  );
}
