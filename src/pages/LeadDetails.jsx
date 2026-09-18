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
    name
      .trim()
      .split(/\s+/)
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
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
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

function isFollowUpCompleted(followUp) {
  const status = String(followUp?.status || "").toLowerCase();

  return (
    status === "completed" ||
    status === "complete" ||
    status === "done"
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
    });
  }

  (lead.notes || []).forEach((note) => {
    activities.push({
      type: "notes",
      icon: "▱",
      title: "Note added",
      detail: note.text,
      date: note.createdAt,
      user: note.userName,
    });
  });

  (lead.followUps || []).forEach((followUp) => {
    const completed = isFollowUpCompleted(followUp);

    activities.push({
      type: "all",
      icon: completed ? "✓" : "◷",
      title: completed
        ? "Follow-up completed"
        : "Follow-up scheduled",
      detail: followUp.note || "Follow-up scheduled",
      date: followUp.date,
      followUpDate: followUp.date,
      completed,
      user: followUp.userName || followUp.createdByName,
    });
  });

  return activities.sort(
    (first, second) =>
      new Date(second.date || 0) - new Date(first.date || 0)
  );
}

function getNextFollowUp(lead) {
  if (!lead?.followUps?.length) return null;

  const now = new Date();

  return (
    lead.followUps
      .filter((item) => {
        if (!item?.date) return false;
        if (isFollowUpCompleted(item)) return false;

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
    (note) => note?.text && note.text.trim()
  );
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
        throw new Error(
          data.message || "Unable to load lead"
        );
      }

      setLead(data.lead);
      setError("");
    } catch (loadError) {
      setError(
        loadError.message || "Unable to load lead"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [leadId]);

  const activities = useMemo(
    () => getActivities(lead),
    [lead]
  );

  const visibleActivities = activities.filter(
    (activity) =>
      activeTab === "all" ||
      activity.type === activeTab
  );

  const savedNotes = useMemo(
    () => getSavedNotes(lead),
    [lead]
  );

  const phone = normalizePhone(lead?.phone);

  const nextFollowUp = useMemo(
    () => getNextFollowUp(lead),
    [lead]
  );

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
        throw new Error(
          data.message || "Unable to save note"
        );
      }

      setLead(data.lead);
      setNoteText("");
      setNotice("Note saved successfully.");
    } catch (saveError) {
      setNotice(
        saveError.message || "Unable to save note"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveFollowUp = async (event) => {
    event.preventDefault();

    if (!followUpDate) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await fetch(
        buildApiUrl(
          `/api/leads/${leadId}/follow-ups`
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            date: followUpDate,
            note: followUpNote.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to schedule follow-up"
        );
      }

      setLead(data.lead);
      setFollowUpDate("");
      setFollowUpNote("");
      setShowFollowUp(false);
      setNotice("Follow-up scheduled successfully.");
    } catch (saveError) {
      setNotice(
        saveError.message ||
          "Unable to schedule follow-up"
      );
    } finally {
      setSaving(false);
    }
  };

  const openFollowUpModal = () => {
    setNotice("");
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
        <strong>
          {error || "Lead not found"}
        </strong>

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
              <span>{lead.service || "—"}</span>
              <span>
                {lead.preferredDoctor || "—"}
              </span>
              <span>
                {getOwner(lead, user)}
              </span>
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
            onClick={() =>
              document
                .querySelector(
                  ".lead-note-composer textarea"
                )
                ?.focus()
            }
          >
            Note
          </button>

          <button
            type="button"
            className="dash-btn"
            disabled
            title="Invoice functionality is not available for this lead"
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
            <strong>
              {lead.stage || "—"}
            </strong>
            <span>Status</span>
          </div>

          <div>
            <strong>
              {formatDate(
                lead.createdAt,
                true
              )}
            </strong>
            <span>Created date</span>
          </div>

          <div className="lead-next-follow-up-summary">
            <strong>
              {nextFollowUp
                ? formatFollowUpDate(
                    nextFollowUp.date
                  )
                : "—"}
            </strong>

            <span>
              {nextFollowUp
                ? formatFollowUpTime(
                    nextFollowUp.date
                  )
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
              onChange={(event) =>
                setNoteText(event.target.value)
              }
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
                disabled={
                  saving || !noteText.trim()
                }
              >
                {saving
                  ? "Saving..."
                  : "Save note"}
              </button>
            </div>
          </section>

          {notice && (
            <p className="lead-detail-notice">
              {notice}
            </p>
          )}

          <section className="lead-activity-card">
            <header>
              <h2>Activity timeline</h2>

              <div>
                {[
                  ["all", "All"],
                  ["notes", "Notes"],
                  ["calls", "Calls"],
                  ["whatsapp", "WhatsApp"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    className={
                      activeTab === value
                        ? "active"
                        : ""
                    }
                    key={value}
                    onClick={() =>
                      setActiveTab(value)
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </header>

            <div className="lead-activity-list">
              {visibleActivities.length ? (
                visibleActivities.map(
                  (activity, index) => (
                    <article
                      key={`${activity.title}-${activity.date}-${index}`}
                      className={
                        activity.title ===
                        "Follow-up scheduled"
                          ? "lead-follow-up-activity"
                          : ""
                      }
                    >
                      <span className="lead-activity-icon">
                        {activity.icon}
                      </span>

                      <div>
                        <strong>
                          {activity.title}
                        </strong>

                        {activity.title ===
                          "Follow-up scheduled" &&
                          activity.followUpDate && (
                            <div className="lead-follow-up-datetime">
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
                            </div>
                          )}

                        {activity.title ===
                          "Follow-up completed" &&
                          activity.followUpDate && (
                            <div className="lead-follow-up-datetime completed">
                              <span>
                                Completed
                              </span>

                              <span>
                                {formatFollowUpDate(
                                  activity.followUpDate
                                )}{" "}
                                ·{" "}
                                {formatFollowUpTime(
                                  activity.followUpDate
                                )}
                              </span>
                            </div>
                          )}

                        <p>
                          {activity.detail}
                        </p>

                        <small>
                          {activity.user ||
                            getOwner(
                              lead,
                              user
                            )}{" "}
                          ·{" "}
                          {formatDate(
                            activity.date,
                            true
                          )}
                        </small>
                      </div>
                    </article>
                  )
                )
              ) : (
                <p className="lead-detail-empty">
                  No activity recorded yet.
                </p>
              )}
            </div>
          </section>
        </main>

        <aside>
          <section className="lead-information-card">
            <header>
              <h2>Lead information</h2>
            </header>

            {[
              ["Source", lead.source],
              ["Service", lead.service],
              [
                "Doctor / Preferred doctor",
                lead.preferredDoctor,
              ],
              [
                "Assigned staff / Owner",
                getOwner(lead, user),
              ],
              ["Priority", lead.priority],
              [
                "Next follow-up",
                nextFollowUp
                  ? `${formatFollowUpDate(
                      nextFollowUp.date
                    )} · ${formatFollowUpTime(
                      nextFollowUp.date
                    )}`
                  : null,
              ],
              [
                "Estimated value",
                lead.estimatedValue,
              ],
              ["Lead ID", lead._id],
              [
                "Created date",
                formatDate(
                  lead.createdAt,
                  true
                ),
              ],
            ].map(([label, value]) => (
              <div
                className="lead-information-row"
                key={label}
              >
                <span>{label}</span>

                <strong>
                  {value || "—"}
                </strong>
              </div>
            ))}
          </section>

          {savedNotes.length > 0 && (
            <section className="lead-information-card">
              <header>
                <h2>First note</h2>
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
                  {formatFollowUpDate(
                    nextFollowUp.date
                  )}
                </strong>

                <span>
                  {formatFollowUpTime(
                    nextFollowUp.date
                  )}
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
          onClick={() =>
            setShowFollowUp(false)
          }
        >
          <form
            className="lead-follow-up-modal"
            onSubmit={saveFollowUp}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="lead-follow-up-modal-header">
              <div>
                <span className="lead-follow-up-modal-label">
                  FOLLOW-UP
                </span>

                <h2>
                  Schedule follow-up
                </h2>

                <p>
                  Set a date and time to follow
                  up with {lead.name}.
                </p>
              </div>

              <button
                type="button"
                className="lead-modal-close"
                onClick={() =>
                  setShowFollowUp(false)
                }
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
                  onChange={(event) =>
                    setFollowUpDate(
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Follow-up note</span>

                <textarea
                  value={followUpNote}
                  onChange={(event) =>
                    setFollowUpNote(
                      event.target.value
                    )
                  }
                  placeholder="What should you discuss or follow up on?"
                />
              </label>
            </div>

            <div className="lead-follow-up-modal-footer">
              <button
                type="button"
                className="lead-secondary-btn"
                onClick={() =>
                  setShowFollowUp(false)
                }
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