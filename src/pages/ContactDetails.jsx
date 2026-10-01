import { useEffect, useState } from "react";
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

function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function displayValue(value) {
  return cleanText(value) || "—";
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name) {
  const value = cleanText(name);

  if (!value) {
    return "C";
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getSource(contact) {
  const source = cleanText(
    contact?.source ||
      contact?.leadSource ||
      contact?.originalSource ||
      ""
  );

  const platform = cleanText(
    contact?.metaPlatform ||
      contact?.platform ||
      contact?.leadPlatform ||
      contact?.channel ||
      ""
  );

  const combined = `${source} ${platform}`
    .trim()
    .toLowerCase();

  if (
    combined.includes("instagram") ||
    combined === "ig"
  ) {
    return "Instagram";
  }

  if (
    combined.includes("facebook") ||
    combined === "fb"
  ) {
    return "Facebook";
  }

  if (combined.includes("whatsapp")) {
    return "WhatsApp";
  }

  if (combined.includes("google")) {
    return "Google";
  }

  if (
    combined.includes("website") ||
    combined.includes("web")
  ) {
    return "Website";
  }

  if (combined.includes("manual")) {
    return "Manual";
  }

  return source || "Other";
}

function InfoItem({ label, value }) {
  return (
    <div className="contact-detail-item">
      <span className="contact-detail-label">
        {label}
      </span>

      <strong className="contact-detail-value">
        {displayValue(value)}
      </strong>
    </div>
  );
}

export default function ContactDetails({
  contactId: propContactId = "",
  onBack,
}) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getContactId = () => {
    if (propContactId) {
      return String(propContactId);
    }

    const parts = window.location.pathname
      .split("/")
      .filter(Boolean);

    return parts[parts.length - 1] || "";
  };

  const contactId = getContactId();

  useEffect(() => {
    const loadDetails = async () => {
      if (!contactId) {
        setError("Contact ID not found.");
        setLoading(false);
        return;
      }

      const token = getToken();

      if (!token) {
        setError("Authentication required.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          buildApiUrl(`/api/contacts/${contactId}`),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load contact details"
          );
        }

        setContact(data.contact || null);
      } catch (error) {
        setError(
          error.message ||
            "Unable to load contact details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [contactId]);

  const goBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/dashboard";
  };

  if (loading) {
    return (
      <div className="contact-details-page">
        <div className="contact-details-state">
          Loading contact...
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="contact-details-page">
        <button
          type="button"
          className="contact-details-back"
          onClick={goBack}
        >
          ← Back to contacts
        </button>

        <div className="contact-details-state contact-details-error">
          {error || "Contact not found."}
        </div>
      </div>
    );
  }

  const name =
    cleanText(contact.name) ||
    "Unnamed contact";

  const source = getSource(contact);

  const doctor = cleanText(
    contact.doctor ||
      contact.preferredDoctor ||
      ""
  );

  const owner = cleanText(
    contact.owner || ""
  );

  const notes = Array.isArray(contact.notes)
    ? contact.notes
    : [];

  const followUps = Array.isArray(
    contact.followUps
  )
    ? contact.followUps
    : [];

  const isLead =
    contact.recordType === "lead" ||
    contact.sourceRecord === "lead";

  return (
    <div className="contact-details-page">
      <div className="contact-details-top">
        <button
          type="button"
          className="contact-details-back"
          onClick={goBack}
        >
          ← Back to contacts
        </button>
      </div>

      <section className="contact-profile-card">
        <div className="contact-profile-avatar">
          {getInitials(name)}
        </div>

        <div className="contact-profile-main">
          <div className="contact-profile-title-row">
            <h1>{name}</h1>

            <span
              className={`contact-record-badge ${
                isLead ? "lead" : "contact"
              }`}
            >
              {isLead ? "Lead" : "Contact"}
            </span>
          </div>

          <div className="contact-profile-meta">
            {contact.phone && (
              <span>{contact.phone}</span>
            )}

            {contact.email && (
              <span>{contact.email}</span>
            )}

            <span>{source}</span>
          </div>
        </div>
      </section>

      <div className="contact-details-layout">
        <div className="contact-details-main">
          <section className="contact-details-card">
            <div className="contact-details-card-head">
              <div>
                <h2>Contact information</h2>

                <p>
                  Basic information about this
                  contact.
                </p>
              </div>
            </div>

            <div className="contact-details-grid">
              <InfoItem
                label="Full name"
                value={name}
              />

              <InfoItem
                label="Phone"
                value={contact.phone}
              />

              <InfoItem
                label="Email"
                value={contact.email}
              />

              <InfoItem
                label="Source"
                value={source}
              />

              <InfoItem
                label="Service"
                value={contact.service}
              />

              <InfoItem
                label="Doctor"
                value={doctor}
              />

              <InfoItem
                label="Owner"
                value={owner}
              />

              <InfoItem
                label="Stage"
                value={contact.stage}
              />

              <InfoItem
                label="Preferred doctor"
                value={contact.preferredDoctor}
              />

              <InfoItem
                label="Lead date"
                value={formatDateTime(
                  contact.leadCreatedAt ||
                    contact.createdAt
                )}
              />

              <InfoItem
                label="Last updated"
                value={formatDateTime(
                  contact.updatedAt
                )}
              />

              <InfoItem
                label="Record type"
                value={
                  isLead ? "Lead" : "Contact"
                }
              />
            </div>
          </section>

          {(contact.landingPage ||
            contact.pageUrl ||
            contact.utmSource ||
            contact.utmMedium ||
            contact.utmCampaign ||
            contact.utmTerm ||
            contact.utmContent) && (
            <section className="contact-details-card">
              <div className="contact-details-card-head">
                <div>
                  <h2>Marketing information</h2>

                  <p>
                    Landing page and campaign
                    tracking.
                  </p>
                </div>
              </div>

              <div className="contact-details-grid">
                <InfoItem
                  label="Landing page"
                  value={contact.landingPage}
                />

                <InfoItem
                  label="Page URL"
                  value={contact.pageUrl}
                />

                <InfoItem
                  label="UTM source"
                  value={contact.utmSource}
                />

                <InfoItem
                  label="UTM medium"
                  value={contact.utmMedium}
                />

                <InfoItem
                  label="UTM campaign"
                  value={contact.utmCampaign}
                />

                <InfoItem
                  label="UTM term"
                  value={contact.utmTerm}
                />

                <InfoItem
                  label="UTM content"
                  value={contact.utmContent}
                />

                <InfoItem
                  label="IP address"
                  value={contact.ipAddress}
                />
              </div>
            </section>
          )}

          {(contact.metaLeadId ||
            contact.metaPageId ||
            contact.metaFormId ||
            contact.metaAdId ||
            contact.metaCampaignId) && (
            <section className="contact-details-card">
              <div className="contact-details-card-head">
                <div>
                  <h2>Meta information</h2>
                </div>
              </div>

              <div className="contact-details-grid">
                <InfoItem
                  label="Meta lead ID"
                  value={contact.metaLeadId}
                />

                <InfoItem
                  label="Page ID"
                  value={contact.metaPageId}
                />

                <InfoItem
                  label="Form ID"
                  value={contact.metaFormId}
                />

                <InfoItem
                  label="Ad ID"
                  value={contact.metaAdId}
                />

                <InfoItem
                  label="Campaign ID"
                  value={
                    contact.metaCampaignId
                  }
                />
              </div>
            </section>
          )}

          {(contact.googleLeadId ||
            contact.googleCustomerId ||
            contact.googleCampaignId ||
            contact.googleAdGroupId ||
            contact.googleAdId ||
            contact.googleAssetId ||
            contact.googleGclid) && (
            <section className="contact-details-card">
              <div className="contact-details-card-head">
                <div>
                  <h2>Google information</h2>
                </div>
              </div>

              <div className="contact-details-grid">
                <InfoItem
                  label="Google lead ID"
                  value={
                    contact.googleLeadId
                  }
                />

                <InfoItem
                  label="Customer ID"
                  value={
                    contact.googleCustomerId
                  }
                />

                <InfoItem
                  label="Campaign ID"
                  value={
                    contact.googleCampaignId
                  }
                />

                <InfoItem
                  label="Ad group ID"
                  value={
                    contact.googleAdGroupId
                  }
                />

                <InfoItem
                  label="Ad ID"
                  value={
                    contact.googleAdId
                  }
                />

                <InfoItem
                  label="Asset ID"
                  value={
                    contact.googleAssetId
                  }
                />

                <InfoItem
                  label="GCLID"
                  value={
                    contact.googleGclid
                  }
                />
              </div>
            </section>
          )}
        </div>

        <aside className="contact-details-side">
          <section className="contact-details-card">
            <div className="contact-details-card-head">
              <div>
                <h2>Notes</h2>
              </div>

              <span className="contact-count-badge">
                {notes.length}
              </span>
            </div>

            {contact.firstNote && (
              <div className="contact-note-item">
                <p>{contact.firstNote}</p>

                <small>First note</small>
              </div>
            )}

            {notes.length === 0 &&
            !contact.firstNote ? (
              <div className="contact-details-empty">
                No notes added.
              </div>
            ) : (
              notes.map((note, index) => (
                <div
                  className="contact-note-item"
                  key={
                    note._id || index
                  }
                >
                  <p>
                    {displayValue(
                      note.text
                    )}
                  </p>

                  <small>
                    {cleanText(
                      note.userName
                    ) || "User"}

                    {" · "}

                    {formatDateTime(
                      note.createdAt
                    )}
                  </small>
                </div>
              ))
            )}
          </section>

          <section className="contact-details-card">
            <div className="contact-details-card-head">
              <div>
                <h2>Follow-ups</h2>
              </div>

              <span className="contact-count-badge">
                {followUps.length}
              </span>
            </div>

            {followUps.length === 0 ? (
              <div className="contact-details-empty">
                No follow-ups.
              </div>
            ) : (
              followUps.map(
                (followUp, index) => (
                  <div
                    className="contact-followup-item"
                    key={
                      followUp._id ||
                      index
                    }
                  >
                    <div className="contact-followup-head">
                      <strong>
                        {displayValue(
                          followUp.purpose ||
                            followUp.channel ||
                            "Follow-up"
                        )}
                      </strong>

                      <span>
                        {displayValue(
                          followUp.status
                        )}
                      </span>
                    </div>

                    <p>
                      {displayValue(
                        followUp.note
                      )}
                    </p>

                    <small>
                      {formatDateTime(
                        followUp.date
                      )}
                    </small>

                    {followUp.assignedTo && (
                      <small>
                        Assigned to:{" "}
                        {followUp.assignedTo}
                      </small>
                    )}

                    {followUp.priority && (
                      <small>
                        Priority:{" "}
                        {followUp.priority}
                      </small>
                    )}
                  </div>
                )
              )
            )}
          </section>
        </aside>
      </div>

      <style>{`
        .contact-details-page {
          padding: 28px 32px 60px;
          min-height: 100%;
          background: #f7f9fc;
          color: #172033;
          box-sizing: border-box;
        }

        .contact-details-top {
          margin-bottom: 18px;
        }

        .contact-details-back {
          border: 0;
          background: transparent;
          color: #315ea8;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 5px 0;
        }

        .contact-details-state {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 14px;
          padding: 30px;
          color: #65738b;
        }

        .contact-details-error {
          color: #c53030;
          margin-top: 20px;
        }

        .contact-profile-card {
          background: #fff;
          border: 1px solid #e2e8f1;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(24, 39, 75, 0.04);
        }

        .contact-profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #eaf1ff;
          color: #2161e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .contact-profile-main {
          min-width: 0;
        }

        .contact-profile-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .contact-profile-title-row h1 {
          margin: 0;
          font-size: 25px;
          line-height: 1.2;
          color: #172033;
        }

        .contact-record-badge {
          display: inline-flex;
          align-items: center;
          min-height: 25px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .contact-record-badge.lead {
          background: #fff4dc;
          color: #9b6400;
        }

        .contact-record-badge.contact {
          background: #eaf8ef;
          color: #168346;
        }

        .contact-profile-meta {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          color: #65738b;
          font-size: 13px;
        }

        .contact-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 20px;
          align-items: start;
        }

        .contact-details-main,
        .contact-details-side {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .contact-details-card {
          background: #fff;
          border: 1px solid #e2e8f1;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(24, 39, 75, 0.035);
        }

        .contact-details-card-head {
          min-height: 68px;
          padding: 17px 20px;
          border-bottom: 1px solid #e7ebf2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          box-sizing: border-box;
        }

        .contact-details-card-head h2 {
          margin: 0;
          font-size: 15px;
          color: #172033;
        }

        .contact-details-card-head p {
          margin: 5px 0 0;
          color: #7a879c;
          font-size: 12px;
        }

        .contact-details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .contact-detail-item {
          min-height: 74px;
          padding: 16px 20px;
          border-bottom: 1px solid #edf0f5;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .contact-detail-item:nth-child(odd) {
          border-right: 1px solid #edf0f5;
        }

        .contact-detail-label {
          font-size: 11px;
          color: #78869b;
        }

        .contact-detail-value {
          font-size: 13px;
          color: #263349;
          font-weight: 600;
          word-break: break-word;
        }

        .contact-count-badge {
          min-width: 26px;
          height: 26px;
          padding: 0 8px;
          border-radius: 999px;
          background: #eef4ff;
          color: #2863dc;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .contact-note-item,
        .contact-followup-item {
          padding: 16px 20px;
          border-bottom: 1px solid #edf0f5;
        }

        .contact-note-item:last-child,
        .contact-followup-item:last-child {
          border-bottom: 0;
        }

        .contact-note-item p,
        .contact-followup-item p {
          margin: 0 0 7px;
          color: #33425a;
          font-size: 13px;
          line-height: 1.55;
        }

        .contact-note-item small,
        .contact-followup-item small {
          display: block;
          margin-top: 4px;
          color: #8290a5;
          font-size: 11px;
        }

        .contact-followup-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }

        .contact-followup-head strong {
          color: #263349;
          font-size: 13px;
        }

        .contact-followup-head span {
          padding: 4px 8px;
          background: #eef4ff;
          color: #2863dc;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
        }

        .contact-details-empty {
          padding: 24px 20px;
          color: #8794a8;
          font-size: 13px;
        }

        @media (max-width: 1100px) {
          .contact-details-layout {
            grid-template-columns: 1fr;
          }

          .contact-details-side {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .contact-details-page {
            padding: 20px 15px 40px;
          }

          .contact-profile-card {
            padding: 18px;
          }

          .contact-profile-avatar {
            width: 52px;
            height: 52px;
            font-size: 17px;
          }

          .contact-profile-title-row h1 {
            font-size: 20px;
          }

          .contact-details-grid {
            grid-template-columns: 1fr;
          }

          .contact-detail-item:nth-child(odd) {
            border-right: 0;
          }

          .contact-details-side {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}