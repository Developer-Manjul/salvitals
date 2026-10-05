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

function normalizeStage(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\\-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getNoteId(note, index) {
  return String(
    note?._id ||
      note?.id ||
      `note-${index}`
  );
}

function getNoteHistory(note) {
  if (!note) return [];

  if (Array.isArray(note.editHistory)) {
    return note.editHistory;
  }

  if (Array.isArray(note.history)) {
    return note.history;
  }

  return [];
}

function getOwner(lead, user) {
  return (
    lead?.owner ||
    lead?.preferredDoctor ||
    user?.name ||
    "—"
  );
}

function getLeadService(lead) {
  if (!lead) return "—";

  const source = String(lead.source || "")
    .trim()
    .toLowerCase();

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
  const status = String(
    followUp?.status || ""
  ).toLowerCase();

  return (
    status === "completed" ||
    status === "complete" ||
    status === "done"
  );
}

function getObjectIdDate(id) {
  const value = String(id || "");

  if (!/^[a-fA-F0-9]{24}$/.test(value)) {
    return null;
  }

  const seconds = parseInt(
    value.substring(0, 8),
    16
  );

  if (!Number.isFinite(seconds)) {
    return null;
  }

  const date = new Date(seconds * 1000);

  return Number.isNaN(date.getTime())
    ? null
    : date;
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

  (lead.notes || []).forEach((note, index) => {
    const history = getNoteHistory(note);

    const lastEdit =
      history.length > 0
        ? history[history.length - 1]
        : null;

    activities.push({
      type: "notes",
      icon: "▱",
      title: "Note added",
      detail: note.text,
      date:
        lastEdit?.editedAt ||
        lastEdit?.updatedAt ||
        note.updatedAt ||
        note.createdAt,
      createdAt:
        lastEdit?.editedAt ||
        lastEdit?.updatedAt ||
        note.updatedAt ||
        note.createdAt,
      user:
        lastEdit?.editedBy ||
        lastEdit?.userName ||
        note.userName,
      noteId: getNoteId(note, index),
      noteIndex: index,
      note,
      edited: history.length > 0,
    });
  });

  (lead.followUps || []).forEach((followUp) => {
    const completed =
      isFollowUpCompleted(followUp);

    const createdAt =
      getFollowUpCreatedAt(followUp);

    activities.push({
      type: "all",
      icon: completed ? "✓" : "◷",
      title: completed
        ? "Follow-up completed"
        : "Follow-up scheduled",
      detail:
        followUp.note ||
        "Follow-up scheduled",
      date: followUp.date,
      followUpDate: followUp.date,
      createdAt,
      completed,
      user:
        followUp.userName ||
        followUp.createdByName,
    });
  });

  return activities.sort(
    (first, second) =>
      new Date(
        second.createdAt ||
          second.date ||
          0
      ) -
      new Date(
        first.createdAt ||
          first.date ||
          0
      )
  );
}

function getNextFollowUp(lead) {
  if (!lead?.followUps?.length) {
    return null;
  }

  const now = new Date();

  return (
    lead.followUps
      .filter((item) => {
        if (
          !item?.date ||
          isFollowUpCompleted(item)
        ) {
          return false;
        }

        const followUpDate =
          new Date(item.date);

        return (
          !Number.isNaN(
            followUpDate.getTime()
          ) &&
          followUpDate >= now
        );
      })
      .sort(
        (first, second) =>
          new Date(first.date) -
          new Date(second.date)
      )[0] || null
  );
}

function getSavedNotes(lead) {
  if (!lead?.notes?.length) {
    return [];
  }

  return lead.notes.filter(
    (note) =>
      note?.text &&
      String(note.text).trim()
  );
}

function EditIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 20H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5C16.8978 3.10218 17.4374 2.87868 18 2.87868C18.5626 2.87868 19.1022 3.10218 19.5 3.5C19.8978 3.89782 20.1213 4.43739 20.1213 5C20.1213 5.56261 19.8978 6.10218 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LeadDetails({
  leadId,
  user,
  onBack,
  onOpenInvoice,
}) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [activeTab, setActiveTab] =
    useState("all");

  const [noteText, setNoteText] =
    useState("");

  const [showFollowUp, setShowFollowUp] =
    useState(false);

  const [followUpDate, setFollowUpDate] =
    useState("");

  const [followUpNote, setFollowUpNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [savingStage, setSavingStage] =
    useState(false);

  const [stages, setStages] =
    useState([]);

  const [loadingStages, setLoadingStages] =
    useState(true);

  const [editingNote, setEditingNote] =
    useState(null);

  const [editNoteText, setEditNoteText] =
    useState("");

  const [savingNoteEdit, setSavingNoteEdit] =
    useState(false);

  const loadLead = async () => {
    const token = getToken();

    if (!token) {
      setError(
        "Authentication required. Please sign in again."
      );
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        buildApiUrl(
          `/api/leads/${leadId}`
        ),
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
            "Unable to load lead"
        );
      }

      setLead(data.lead);
      setError("");
    } catch (loadError) {
      setError(
        loadError.message ||
          "Unable to load lead"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [leadId]);

  useEffect(() => {
    const loadStages = async () => {
      const token = getToken();

      if (!token) {
        setLoadingStages(false);
        return;
      }

      try {
        const response = await fetch(
          buildApiUrl(
            "/api/lead-settings/stages"
          ),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (
          response.ok &&
          data.success
        ) {
          setStages(
            (data.stages || []).filter(
              (item) =>
                item?.status !==
                "inactive"
            )
          );
        }
      } catch (stageError) {
        console.error(
          "LOAD LEAD STAGES ERROR:",
          stageError
        );
      } finally {
        setLoadingStages(false);
      }
    };

    loadStages();
  }, [leadId]);

  const availableStages = useMemo(() => {
    const current = String(
      lead?.stage || "New"
    ).trim();

    const result = [...stages];

    if (
      current &&
      !result.some(
        (item) =>
          normalizeStage(item.name) ===
          normalizeStage(current)
      )
    ) {
      result.unshift({
        _id: `current-${current}`,
        name: current,
      });
    }

    return result;
  }, [stages, lead?.stage]);

  const activities = useMemo(
    () => getActivities(lead),
    [lead]
  );

  const visibleActivities =
    activities.filter((activity) => {
      if (activeTab === "all") {
        return true;
      }

      return (
        activity.type === activeTab
      );
    });

  const savedNotes = useMemo(
    () => getSavedNotes(lead),
    [lead]
  );

  const phone = normalizePhone(
    lead?.phone
  );

  const serviceName = useMemo(
    () => getLeadService(lead),
    [lead]
  );

  const nextFollowUp = useMemo(
    () => getNextFollowUp(lead),
    [lead]
  );

  const latestNote =
    savedNotes.length > 0
      ? savedNotes[savedNotes.length - 1]
      : null;

  const openNotesTab = () => {
    setActiveTab("notes");

    setTimeout(() => {
      document
        .querySelector(
          ".lead-activity-card"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const openInvoicePage = () => {
    if (
      typeof onOpenInvoice ===
      "function"
    ) {
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
        buildApiUrl(
          `/api/leads/${leadId}/notes`
        ),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            text,
            userName:
              user?.name || "",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save note"
        );
      }

      setLead(data.lead);
      setNoteText("");
      setActiveTab("notes");
      setNotice(
        "Note saved successfully."
      );
    } catch (saveError) {
      setNotice(
        saveError.message ||
          "Unable to save note"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateLeadStage = async (
    stage
  ) => {
    if (
      !stage ||
      stage === lead?.stage ||
      savingStage
    ) {
      return;
    }

    setSavingStage(true);
    setNotice("");

    try {
      const response = await fetch(
        buildApiUrl(
          `/api/leads/${leadId}`
        ),
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            name: lead?.name || "",
            email: lead?.email || "",
            phone: lead?.phone || "",
            source: lead?.source || "",
            service: lead?.service || "",
            owner:
              lead?.owner ||
              user?.name ||
              "",
            stage,
            preferredDoctor:
              lead?.preferredDoctor ||
              "",
            landingPage:
              lead?.landingPage ||
              "",
            pageUrl:
              lead?.pageUrl || "",
            utmSource:
              lead?.utmSource || "",
            utmMedium:
              lead?.utmMedium || "",
            utmCampaign:
              lead?.utmCampaign || "",
            utmTerm:
              lead?.utmTerm || "",
            utmContent:
              lead?.utmContent || "",
            ipAddress:
              lead?.ipAddress || "",
            firstNote:
              lead?.firstNote || "",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update status"
        );
      }

      setLead(data.lead);

      setNotice(
        "Lead status updated successfully."
      );
    } catch (updateError) {
      setNotice(
        updateError.message ||
          "Unable to update status"
      );
    } finally {
      setSavingStage(false);
    }
  };

  const openEditNote = (
    note,
    index
  ) => {
    if (!note) return;

    setEditingNote({
      ...note,
      _index: index,
    });

    setEditNoteText(
      note?.text || ""
    );

    setNotice("");
  };

  const openLatestNoteEditor = () => {
    if (!latestNote) {
      setNotice(
        "No note available to edit."
      );
      return;
    }

    const index =
      lead?.notes?.findIndex(
        (item) =>
          String(
            item?._id ||
              item?.id ||
              ""
          ) ===
          String(
            latestNote?._id ||
              latestNote?.id ||
              ""
          )
      );

    openEditNote(
      latestNote,
      index >= 0
        ? index
        : lead.notes.length - 1
    );
  };

  const closeEditNote = () => {
    if (savingNoteEdit) {
      return;
    }

    setEditingNote(null);
    setEditNoteText("");
  };

  const saveEditedNote = async (
    event
  ) => {
    event.preventDefault();

    const text =
      editNoteText.trim();

    if (
      !text ||
      !editingNote
    ) {
      return;
    }

    setSavingNoteEdit(true);
    setNotice("");

    try {
      const noteId = getNoteId(
        editingNote,
        editingNote._index
      );

      const response = await fetch(
        buildApiUrl(
          `/api/leads/${leadId}/notes/${noteId}`
        ),
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            text,
            userName:
              user?.name || "",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to edit note"
        );
      }

      setLead(data.lead);
      setEditingNote(null);
      setEditNoteText("");
      setActiveTab("notes");

      setNotice(
        "Note edited successfully."
      );
    } catch (editError) {
      setNotice(
        editError.message ||
          "Unable to edit note"
      );
    } finally {
      setSavingNoteEdit(false);
    }
  };

  const saveFollowUp = async (
    event
  ) => {
    event.preventDefault();

    if (!followUpDate) {
      setNotice(
        "Please select date and time."
      );
      return;
    }

    const selectedDate =
      new Date(followUpDate);

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      setNotice(
        "Please select a valid date and time."
      );
      return;
    }

    if (
      selectedDate.getTime() <
      Date.now()
    ) {
      setNotice(
        "Please select a future date and time."
      );
      return;
    }

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
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            date:
              selectedDate.toISOString(),
            note:
              followUpNote.trim(),
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

      setLead(data.lead);
      setFollowUpDate("");
      setFollowUpNote("");
      setShowFollowUp(false);

      setNotice(
        "Follow-up scheduled successfully."
      );
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

              <select
                className="lead-stage-pill lead-stage-select"
                value={
                  lead.stage || "New"
                }
                onChange={(event) =>
                  updateLeadStage(
                    event.target.value
                  )
                }
                disabled={
                  savingStage ||
                  loadingStages
                }
                aria-label="Lead status"
              >
                {availableStages.map(
                  (stage) => (
                    <option
                      key={String(
                        stage._id ||
                          stage.name
                      )}
                      value={stage.name}
                    >
                      {stage.name}
                    </option>
                  )
                )}
              </select>

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
              <span>
                {lead.source || "—"}
              </span>

              <span>
                {serviceName}
              </span>

              <span>
                {lead.preferredDoctor ||
                  "—"}
              </span>

              <span>
                {getOwner(
                  lead,
                  user
                )}
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
            onClick={
              openFollowUpModal
            }
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

            <span>
              Created date
            </span>
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

            <small>
              Follow-up
            </small>
          </div>
        </div>
      </section>

      <div className="lead-details-layout">
        <main>
          <section className="lead-note-composer">
            <textarea
              value={noteText}
              onChange={(event) =>
                setNoteText(
                  event.target.value
                )
              }
              placeholder="Add a note about this lead — what was discussed, objections, next steps..."
            />

            <div>
              <button
                type="button"
                className="lead-secondary-btn"
                onClick={
                  openFollowUpModal
                }
              >
                Add follow-up
              </button>

              <button
                type="button"
                className="dash-btn primary"
                onClick={saveNote}
                disabled={
                  saving ||
                  !noteText.trim()
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

          <section
            className="lead-activity-card"
            style={{
              overflow: "hidden",
              borderRadius: "16px",
              border: "1px solid #dfe7f2",
              background: "#ffffff",
              boxShadow:
                "0 8px 24px rgba(31, 56, 88, 0.06)",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "18px 22px",
                borderBottom:
                  "1px solid #e8edf4",
                background: "#ffffff",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#172033",
                }}
              >
                Activity timeline
              </h2>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  ["all", "All"],
                  ["notes", "Notes"],
                  ["calls", "Calls"],
                  ["whatsapp", "WhatsApp"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setActiveTab(value)
                    }
                    style={{
                      border: "0",
                      borderRadius: "9px",
                      padding: "8px 12px",
                      background:
                        activeTab === value
                          ? "#edf5ff"
                          : "transparent",
                      color:
                        activeTab === value
                          ? "#2563eb"
                          : "#64748b",
                      fontSize: "12px",
                      fontWeight:
                        activeTab === value
                          ? 700
                          : 500,
                      cursor: "pointer",
                      transition:
                        "all .2s ease",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </header>

            {activeTab === "notes" &&
            savedNotes.length === 0 ? (
              <div className="lead-detail-empty">
                No notes recorded yet.
              </div>
            ) : (
              <div
                className="lead-activity-list"
                style={{
                  padding:
                    "4px 22px",
                }}
              >
                {visibleActivities.length ? (
                  visibleActivities.map(
                    (
                      activity,
                      index
                    ) => {
                      const isNote =
                        Boolean(
                          activity.note
                        );

                      return (
                        <article
                          key={`${activity.title}-${activity.date}-${index}`}
                          className={
                            activity.title ===
                            "Follow-up scheduled"
                              ? "lead-follow-up-activity"
                              : ""
                          }
                          style={{
                            display: "flex",
                            alignItems:
                              "flex-start",
                            gap: "14px",
                            padding:
                              "18px 0",
                            borderBottom:
                              index <
                              visibleActivities.length -
                                1
                                ? "1px solid #edf1f6"
                                : "none",
                          }}
                        >
                          <span
                            className="lead-activity-icon"
                            style={{
                              flex:
                                "0 0 30px",
                              width: "30px",
                              height: "30px",
                              minWidth:
                                "30px",
                              borderRadius:
                                "50%",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                "#edf5ff",
                              color:
                                "#2563eb",
                              fontSize:
                                "13px",
                              marginTop:
                                "1px",
                            }}
                          >
                            {activity.icon}
                          </span>

                          <div
                            className="lead-activity-content"
                            style={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <div
                              className="lead-activity-title-row"
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "space-between",
                                gap: "14px",
                                width:
                                  "100%",
                                minHeight:
                                  "30px",
                              }}
                            >
                              <strong
                                style={{
                                  color:
                                    "#172033",
                                  fontSize:
                                    "13px",
                                  fontWeight:
                                    700,
                                }}
                              >
                                {
                                  activity.title
                                }
                              </strong>

                              {isNote && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditNote(
                                      activity.note,
                                      activity.noteIndex
                                    )
                                  }
                                  disabled={
                                    savingNoteEdit
                                  }
                                  aria-label="Edit note"
                                  title="Edit note"
                                  style={{
                                    flex:
                                      "0 0 auto",
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    gap: "7px",
                                    height:
                                      "34px",
                                    padding:
                                      "0 13px",
                                    border:
                                      "1px solid #d8e3f0",
                                    borderRadius:
                                      "9px",
                                    background:
                                      "#ffffff",
                                    color:
                                      "#2563eb",
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      600,
                                    cursor:
                                      savingNoteEdit
                                        ? "not-allowed"
                                        : "pointer",
                                    boxShadow:
                                      "0 2px 6px rgba(37, 99, 235, 0.06)",
                                  }}
                                >
                                  <EditIcon
                                    size={13}
                                  />
                                  <span>
                                    Edit
                                  </span>
                                </button>
                              )}
                            </div>

                            {activity.followUpDate && (
                              <div
                                className={`lead-follow-up-datetime ${
                                  activity.completed
                                    ? "completed"
                                    : ""
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
                                    <span>
                                      Completed
                                    </span>

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

                            <p
                              style={{
                                margin:
                                  "7px 0 6px",
                                color:
                                  "#40516a",
                                fontSize:
                                  "13px",
                                lineHeight:
                                  1.5,
                              }}
                            >
                              {
                                activity.detail
                              }
                            </p>

                            <small
                              style={{
                                display:
                                  "block",
                                color:
                                  "#8190a5",
                                fontSize:
                                  "10.5px",
                                lineHeight:
                                  1.4,
                              }}
                            >
                              {activity.user ||
                                getOwner(
                                  lead,
                                  user
                                )}
                              {" · "}
                              {activity.createdAt
                                ? `Created ${formatDate(
                                    activity.createdAt,
                                    true
                                  )}`
                                : formatDate(
                                    activity.date,
                                    true
                                  )}
                            </small>
                          </div>
                        </article>
                      );
                    }
                  )
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
              <h2>
                Lead information
              </h2>
            </header>

            {[
              [
                "Source",
                lead.source,
              ],
              [
                "Source URL",
                lead.pageUrl,
              ],
              [
                "Service",
                serviceName,
              ],
              [
                "Doctor / Preferred doctor",
                lead.preferredDoctor,
              ],
              [
                "Assigned staff / Owner",
                getOwner(
                  lead,
                  user
                ),
              ],
              [
                "Priority",
                lead.priority,
              ],
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
                "Lead ID",
                lead._id,
              ],
              [
                "Created date",
                formatDate(
                  lead.createdAt,
                  true
                ),
              ],
            ].map(
              ([label, value]) => (
                <div
                  className="lead-information-row"
                  key={label}
                >
                  <span>
                    {label}
                  </span>

                  <strong>
                    {value || "—"}
                  </strong>
                </div>
              )
            )}
          </section>

          {savedNotes.length > 0 && (
            <section
              className="lead-information-card lead-notes-card"
              style={{
                overflow: "hidden",
                borderRadius: "16px",
                border:
                  "1px solid #dfe7f2",
                background:
                  "#ffffff",
                boxShadow:
                  "0 8px 24px rgba(31, 56, 88, 0.06)",
                marginTop: "16px",
              }}
            >
              <header
                className="lead-notes-card-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  padding:
                    "17px 16px",
                  borderBottom:
                    "1px solid #e8edf4",
                  background:
                    "#ffffff",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color:
                      "#172033",
                  }}
                >
                  Notes
                </h2>

                <button
                  type="button"
                  className="lead-notes-edit-btn"
                  onClick={
                    openLatestNoteEditor
                  }
                  disabled={
                    savingNoteEdit
                  }
                  aria-label="Edit latest note"
                  title="Edit note"
                  style={{
                    width: "38px",
                    height: "38px",
                    padding: 0,
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    border:
                      "1px solid #8db9ff",
                    borderRadius:
                      "9px",
                    background:
                      "#f7fbff",
                    color:
                      "#2563eb",
                    cursor:
                      savingNoteEdit
                        ? "not-allowed"
                        : "pointer",
                    transition:
                      "all .2s ease",
                  }}
                >
                  <EditIcon size={17} />
                </button>
              </header>

              <div
                className="lead-saved-notes"
                style={{
                  padding:
                    "20px 16px 18px",
                }}
              >
                {savedNotes.map(
                  (
                    note,
                    index
                  ) => (
                    <div
                      className="lead-saved-note"
                      key={`${note._id || note.createdAt || "note"}-${index}`}
                      style={{
                        padding:
                          "0",
                      }}
                    >
                      <p
                        style={{
                          margin:
                            "0 0 9px",
                          color:
                            "#40516a",
                          fontSize:
                            "13px",
                          lineHeight:
                            1.6,
                          fontWeight:
                            400,
                        }}
                      >
                        {note.text}
                      </p>

                      <small
                        style={{
                          display:
                            "block",
                          color:
                            "#8190a5",
                          fontSize:
                            "10.5px",
                        }}
                      >
                        {note.userName ||
                          getOwner(
                            lead,
                            user
                          )}

                        {note.createdAt
                          ? ` · ${formatDate(
                              note.createdAt,
                              true
                            )}`
                          : ""}
                      </small>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {nextFollowUp && (
            <section className="lead-information-card lead-next-follow-up-card">
              <header>
                <h2>
                  Next follow-up
                </h2>
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
                  {
                    nextFollowUp.note
                  }
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
            !saving &&
            setShowFollowUp(false)
          }
        >
          <form
            className="lead-follow-up-modal"
            onSubmit={
              saveFollowUp
            }
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
                  Set a date and time
                  to follow up with{" "}
                  {lead.name}.
                </p>
              </div>

              <button
                type="button"
                className="lead-modal-close"
                onClick={() =>
                  setShowFollowUp(
                    false
                  )
                }
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="lead-follow-up-form">
              <label>
                <span>
                  Date & time
                </span>

                <input
                  type="datetime-local"
                  value={
                    followUpDate
                  }
                  min={
                    new Date()
                      .toISOString()
                      .slice(0, 16)
                  }
                  onChange={(
                    event
                  ) =>
                    setFollowUpDate(
                      event.target
                        .value
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Follow-up note
                </span>

                <textarea
                  value={
                    followUpNote
                  }
                  onChange={(
                    event
                  ) =>
                    setFollowUpNote(
                      event.target
                        .value
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
                  setShowFollowUp(
                    false
                  )
                }
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

      {editingNote && (
        <div
          className="lead-modal-backdrop"
          onClick={closeEditNote}
        >
          <form
            className="lead-follow-up-modal lead-note-edit-modal"
            onSubmit={
              saveEditedNote
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="lead-follow-up-modal-header">
              <div>
                <span className="lead-follow-up-modal-label">
                  NOTE
                </span>

                <h2>
                  Edit note
                </h2>

                <p>
                  Update your note.
                </p>
              </div>

              <button
                type="button"
                className="lead-modal-close"
                onClick={
                  closeEditNote
                }
                disabled={
                  savingNoteEdit
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="lead-follow-up-form">
              <label>
                <span>Note</span>

                <textarea
                  value={
                    editNoteText
                  }
                  onChange={(
                    event
                  ) =>
                    setEditNoteText(
                      event.target
                        .value
                    )
                  }
                  autoFocus
                  required
                />
              </label>
            </div>

            <div className="lead-follow-up-modal-footer">
              <button
                type="button"
                className="lead-secondary-btn"
                onClick={
                  closeEditNote
                }
                disabled={
                  savingNoteEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="dash-btn primary"
                disabled={
                  savingNoteEdit ||
                  !editNoteText.trim()
                }
              >
                {savingNoteEdit
                  ? "Saving..."
                  : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}