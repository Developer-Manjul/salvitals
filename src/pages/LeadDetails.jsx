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
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "L"
  );
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hour12: true }
      : {}),
  }).format(date);
}

function formatFollowUpDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFollowUpTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function getOwner(lead, user) {
  return lead?.owner || lead?.preferredDoctor || user?.name || "—";
}

/**
 * Meta lead:
 * Facebook / Instagram -> show campaign name as Service.
 *
 * Website / Manual / WhatsApp / Referral etc. -> show saved lead.service.
 *
 * Supports multiple possible backend field names so the UI keeps working
 * when campaign name is returned under any of these properties.
 */
function getLeadService(lead) {
  if (!lead) return "—";

  const source = String(lead.source || "").trim().toLowerCase();

  const isMetaLead =
    source === "facebook" ||
    source === "instagram" ||
    source === "facebook lead" ||
    source === "instagram lead";

  if (isMetaLead) {
    const campaignName =
      lead.metaCampaignName ||
      lead.campaignName ||
      lead.meta_campaign_name ||
      lead.campaign_name ||
      lead.metaCampaign?.name ||
      lead.campaign?.name ||
      lead.adCampaignName ||
      lead.ad?.campaignName ||
      "";

    if (String(campaignName).trim()) {
      return String(campaignName).trim();
    }
  }

  return lead.service || lead.treatment || "—";
}

function isFollowUpCompleted(followUp) {
  const status = String(followUp?.status || "").toLowerCase();

  return (
    status === "completed" ||
    status === "complete" ||
    status === "done"
  );
}

function getObjectIdDate(id) {
  const value = String(id || "");

  if (!/^[a-fA-F0-9]{24}$/.test(value)) return null;

  const seconds = parseInt(value.substring(0, 8), 16);
  if (!Number.isFinite(seconds)) return null;

  const date = new Date(seconds * 1000);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getFollowUpCreatedAt(followUp) {
  return (
    followUp?.createdAt ||
    followUp?.created_at ||
    followUp?.createdOn ||
    followUp?.createdDate ||
    getObjectIdDate(followUp?._id)
  );
}

function getActivities(lead) {
  if (!lead) return [];

  const activities = [];

  if (lead.createdAt) {
    activities.push({
      type: "all",
      icon: "✦",
      title: "Lead created",
      detail: `${lead.source || "Lead"} lead`,
      date: lead.createdAt,
      createdAt: lead.createdAt,
    });
  }

  (lead.notes || []).forEach((note) => {
    activities.push({
      type: "notes",
      icon: "▱",
      title: "Note added",
      detail: note.text,
      date: note.createdAt,
      createdAt: note.createdAt,
      user: note.userName,
    });
  });

  (lead.followUps || []).forEach((followUp) => {
    const completed = isFollowUpCompleted(followUp);
    const createdAt = getFollowUpCreatedAt(followUp);

    activities.push({
      type: "all",
      icon: completed ? "✓" : "◷",
      title: completed
        ? "Follow-up completed"
        : "Follow-up scheduled",
      detail: followUp.note || "Follow-up scheduled",
      date: followUp.date,
      followUpDate: followUp.date,
      createdAt,
      completed,
      user: followUp.userName || followUp.createdByName,
    });
  });

  return activities.sort(
    (first, second) =>
      new Date(second.createdAt || second.date || 0) -
      new Date(first.createdAt || first.date || 0)
  );
}

function getNextFollowUp(lead) {
  if (!lead?.followUps?.length) return null;

  const now = new Date();

  return (
    lead.followUps
      .filter((item) => {
        if (!item?.date || isFollowUpCompleted(item)) return false;

        const followUpDate = new Date(item.date);

        return (
          !Number.isNaN(followUpDate.getTime()) &&
          followUpDate >= now
        );
      })
      .sort(
        (first, second) =>
          new Date(first.date) - new Date(second.date)
      )[0] || null
  );
}

function getSavedNotes(lead) {
  if (!lead?.notes?.length) return [];

  return lead.notes.filter(
    (note) => note?.text && String(note.text).trim()
  );
}

export default function LeadDetails({
  leadId,
  user,
  onBack,
  onOpenInvoice,
}) {
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
      const response = await fetch(
        buildApiUrl(`/api/leads/${leadId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load lead");
      }

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

  const visibleActivities = activities.filter((activity) => {
    if (activeTab === "all") return true;
    return activity.type === activeTab;
  });

  const savedNotes = useMemo(() => getSavedNotes(lead), [lead]);

  const phone = normalizePhone(lead?.phone);

  const serviceName = useMemo(
    () => getLeadService(lead),
    [lead]
  );

  const nextFollowUp = useMemo(
    () => getNextFollowUp(lead),
    [lead]
  );

  const openNotesTab = () => {
    setActiveTab("notes");

    setTimeout(() => {
      document
        .querySelector(".lead-activity-card")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const openInvoicePage = () => {
    if (typeof onOpenInvoice === "function") {
      onOpenInvoice();
    }
  };

  const saveNote = async () => {
    const text = noteText.trim();
    if (!text) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await fetch(
        buildApiUrl(`/api/leads/${leadId}/notes`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            text,
            userName: user?.name || "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save note");
      }

      setLead(data.lead);
      setNoteText("");
      setActiveTab("notes");
      setNotice("Note saved successfully.");
    } catch (saveError) {
      setNotice(saveError.message || "Unable to save note");
    } finally {
      setSaving(false);
    }
  };

  const saveFollowUp = async (event) => {
    event.preventDefault();

    if (!followUpDate) {
      setNotice("Please select date and time.");
      return;
    }

    const selectedDate = new Date(followUpDate);

    if (Number.isNaN(selectedDate.getTime())) {
      setNotice("Please select a valid date and time.");
      return;
    }

    if (selectedDate.getTime() < Date.now()) {
      setNotice("Please select a future date and time.");
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const response = await fetch(
        buildApiUrl(`/api/leads/${leadId}/follow-ups`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            date: selectedDate.toISOString(),
            note: followUpNote.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to schedule follow-up"
        );
      }

      setLead(data.lead);
      setFollowUpDate("");
      setFollowUpNote("");
      setShowFollowUp(false);
      setNotice("Follow-up scheduled successfully.");
    } catch (saveError) {
      setNotice(
        saveError.message || "Unable to schedule follow-up"
      );
    } finally {
      setSaving(false);
    }
  };

  const openFollowUpModal = () => {
    setNotice("");
    setFollowUpDate("");
    setFollowUpNote("");
    setShowFollowUp(true);
  };

  if (loading) {
    return (
      <div className="lead-details-page-state">
        Loading lead details...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="lead-details-page-state">
        <strong>{error || "Lead not found"}</strong>

        <button
          type="button"
          className="dash-btn"
          onClick={onBack}
        >
          Back to leads
        </button>
      </div>
    );
  }

  return (
    <div className="lead-details-page">
      <button
        type="button"
        className="lead-details-back"
        onClick={onBack}
      >
        Leads &gt; {lead.name}
      </button>

      <section className="lead-detail-hero">
        <div className="lead-detail-identity">
          <span className="lead-detail-avatar">
            {getInitials(lead.name)}
          </span>

          <div>
            <div className="lead-detail-title-row">
              <h1>{lead.name}</h1>

              <span className="lead-stage-pill">
                {lead.stage || "—"}
              </span>

              {lead.priority && (
                <span className="lead-priority-pill">
                  {lead.priority}
                </span>
              )}
            </div>

            <p>
              {lead.phone || "—"}
              <span> • </span>
              {lead.email || "—"}
            </p>

            <div className="lead-detail-meta">
              <span>{lead.source || "—"}</span>
              <span>{serviceName}</span>
              <span>{lead.preferredDoctor || "—"}</span>
              <span>{getOwner(lead, user)}</span>
            </div>
          </div>
        </div>

        <div className="lead-detail-actions">
          {lead.phone && (
            <a
              className="dash-btn"
              href={`tel:${lead.phone}`}
            >
              Call
            </a>
          )}

          {lead.phone && (
            <a
              className="dash-btn lead-whatsapp-btn"
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          )}

          <button
            type="button"
            className="dash-btn"
            onClick={openFollowUpModal}
          >
            Follow-up
          </button>

          <button
            type="button"
            className="dash-btn"
            onClick={openNotesTab}
          >
            Note
          </button>

          <button
            type="button"
            className="dash-btn"
            onClick={openInvoicePage}
          >
            Invoice
          </button>

          {lead.email && (
            <a
              className="dash-btn"
              href={`mailto:${lead.email}`}
            >
              Email
            </a>
          )}
        </div>

        <div className="lead-detail-summary-bar">
          <div>
            <strong>{lead.stage || "—"}</strong>
            <span>Status</span>
          </div>

          <div>
            <strong>{formatDate(lead.createdAt, true)}</strong>
            <span>Created date</span>
          </div>

          <div className="lead-next-follow-up-summary">
            <strong>
              {nextFollowUp
                ? formatFollowUpDate(nextFollowUp.date)
                : "—"}
            </strong>

            <span>
              {nextFollowUp
                ? formatFollowUpTime(nextFollowUp.date)
                : "—"}
            </span>

            <small>Follow-up</small>
          </div>
        </div>
      </section>

      <div className="lead-details-layout">
        <main>
          <section className="lead-note-composer">
            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Add a note about this lead — what was discussed, objections, next steps..."
            />

            <div>
              <button
                type="button"
                className="lead-secondary-btn"
                onClick={openFollowUpModal}
              >
                Add follow-up
              </button>

              <button
                type="button"
                className="dash-btn primary"
                onClick={saveNote}
                disabled={saving || !noteText.trim()}
              >
                {saving ? "Saving..." : "Save note"}
              </button>
            </div>
          </section>

          {notice && (
            <p className="lead-detail-notice">{notice}</p>
          )}

          <section className="lead-activity-card">
            <header>
              <h2>Activity timeline</h2>

              <div>
                <button
                  type="button"
                  className={activeTab === "all" ? "active" : ""}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>

                <button
                  type="button"
                  className={activeTab === "notes" ? "active" : ""}
                  onClick={() => setActiveTab("notes")}
                >
                  Notes
                </button>

                <button
                  type="button"
                  className={activeTab === "calls" ? "active" : ""}
                  onClick={() => setActiveTab("calls")}
                >
                  Calls
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "whatsapp" ? "active" : ""
                  }
                  onClick={() => setActiveTab("whatsapp")}
                >
                  WhatsApp
                </button>
              </div>
            </header>

            {activeTab === "notes" && savedNotes.length === 0 ? (
              <div className="lead-detail-empty">
                No notes recorded yet.
              </div>
            ) : (
              <div className="lead-activity-list">
                {visibleActivities.length ? (
                  visibleActivities.map((activity, index) => (
                    <article
                      key={`${activity.title}-${activity.date}-${index}`}
                      className={
                        activity.title === "Follow-up scheduled"
                          ? "lead-follow-up-activity"
                          : ""
                      }
                    >
                      <span className="lead-activity-icon">
                        {activity.icon}
                      </span>

                      <div>
                        <strong>{activity.title}</strong>

                        {activity.followUpDate && (
                          <div
                            className={`lead-follow-up-datetime ${
                              activity.completed ? "completed" : ""
                            }`}
                          >
                            {!activity.completed ? (
                              <>
                                <span>
                                  {formatFollowUpDate(
                                    activity.followUpDate
                                  )}
                                </span>
                                <span>
                                  {formatFollowUpTime(
                                    activity.followUpDate
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>Completed</span>
                                <span>
                                  {formatFollowUpDate(
                                    activity.followUpDate
                                  )}
                                  {" · "}
                                  {formatFollowUpTime(
                                    activity.followUpDate
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        <p>{activity.detail}</p>

                        <small>
                          {activity.user ||
                            getOwner(lead, user)}
                          {" · "}
                          {activity.createdAt
                            ? `Created ${formatDate(
                                activity.createdAt,
                                true
                              )}`
                            : formatDate(activity.date, true)}
                        </small>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="lead-detail-empty">
                    No activity recorded yet.
                  </p>
                )}
              </div>
            )}
          </section>
        </main>

        <aside>
          <section className="lead-information-card">
            <header>
              <h2>Lead information</h2>
            </header>

            {[
              ["Source", lead.source],
              ["Service", serviceName],
              [
                "Doctor / Preferred doctor",
                lead.preferredDoctor,
              ],
              ["Assigned staff / Owner", getOwner(lead, user)],
              ["Priority", lead.priority],
              [
                "Next follow-up",
                nextFollowUp
                  ? `${formatFollowUpDate(
                      nextFollowUp.date
                    )} · ${formatFollowUpTime(nextFollowUp.date)}`
                  : null,
              ],
              ["Lead ID", lead._id],
              [
                "Created date",
                formatDate(lead.createdAt, true),
              ],
            ].map(([label, value]) => (
              <div
                className="lead-information-row"
                key={label}
              >
                <span>{label}</span>
                <strong>{value || "—"}</strong>
              </div>
            ))}
          </section>

          {savedNotes.length > 0 && (
            <section className="lead-information-card">
              <header>
                <h2>Notes</h2>
              </header>

              <div className="lead-saved-notes">
                {savedNotes.map((note, index) => (
                  <div
                    className="lead-saved-note"
                    key={`${note.createdAt || "note"}-${index}`}
                  >
                    <p>{note.text}</p>

                    <small>
                      {note.userName ||
                        getOwner(lead, user)}
                      {note.createdAt
                        ? ` · ${formatDate(
                            note.createdAt,
                            true
                          )}`
                        : ""}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {nextFollowUp && (
            <section className="lead-information-card lead-next-follow-up-card">
              <header>
                <h2>Next follow-up</h2>
              </header>

              <div className="lead-follow-up-highlight">
                <strong>
                  {formatFollowUpDate(nextFollowUp.date)}
                </strong>

                <span>
                  {formatFollowUpTime(nextFollowUp.date)}
                </span>
              </div>

              {nextFollowUp.note && (
                <p className="lead-first-note">
                  {nextFollowUp.note}
                </p>
              )}

              <div className="lead-follow-up-actions">
                {lead.phone && (
                  <a
                    className="dash-btn"
                    href={`tel:${lead.phone}`}
                  >
                    Call
                  </a>
                )}

                {lead.phone && (
                  <a
                    className="dash-btn lead-whatsapp-btn"
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      {showFollowUp && (
        <div
          className="lead-modal-backdrop"
          onClick={() => !saving && setShowFollowUp(false)}
        >
          <form
            className="lead-follow-up-modal"
            onSubmit={saveFollowUp}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lead-follow-up-modal-header">
              <div>
                <span className="lead-follow-up-modal-label">
                  FOLLOW-UP
                </span>

                <h2>Schedule follow-up</h2>

                <p>
                  Set a date and time to follow up with{" "}
                  {lead.name}.
                </p>
              </div>

              <button
                type="button"
                className="lead-modal-close"
                onClick={() => setShowFollowUp(false)}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="lead-follow-up-form">
              <label>
                <span>Date & time</span>

                <input
                  type="datetime-local"
                  value={followUpDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(event) =>
                    setFollowUpDate(event.target.value)
                  }
                  required
                />
              </label>

              <label>
                <span>Follow-up note</span>

                <textarea
                  value={followUpNote}
                  onChange={(event) =>
                    setFollowUpNote(event.target.value)
                  }
                  placeholder="What should you discuss or follow up on?"
                />
              </label>
            </div>

            <div className="lead-follow-up-modal-footer">
              <button
                type="button"
                className="lead-secondary-btn"
                onClick={() => setShowFollowUp(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="dash-btn primary"
                disabled={saving}
              >
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
