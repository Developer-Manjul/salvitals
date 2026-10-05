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
function formatDateTime(value) {
  if (!value) return "—";
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
function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .normalize("NFKC")
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ""
    )
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function cleanName(value) {
  const name = cleanText(value);
  return name || "Unnamed contact";
}
function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}
function getInitials(name = "") {
  const clean = cleanName(name);
  const initials = clean
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "C";
}
function getContactSource(contact) {
  if (!contact) {
    return "Other";
  }
  const sourceValue = cleanText(
    contact.source ||
    contact.leadSource ||
    contact.originalSource ||
    ""
  );
  const platformValue = cleanText(
    contact.metaPlatform ||
    contact.platform ||
    contact.leadPlatform ||
    contact.metaSource ||
    contact.channel ||
    ""
  );
  const sourceDetails = cleanText(
    contact.sourceDetails ||
    contact.metaSourceDetails ||
    contact.adSource ||
    contact.originalPlatform ||
    ""
  );
  const combined = [
    sourceValue,
    platformValue,
    sourceDetails,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    combined.includes("instagram") ||
    combined.includes("instagram lead") ||
    combined.includes("ig lead") ||
    combined === "ig"
  ) {
    return "Instagram";
  }
  if (
    combined.includes("facebook") ||
    combined.includes("facebook lead") ||
    combined === "fb"
  ) {
    return "Facebook";
  }
  if (combined.includes("whatsapp")) {
    return "WhatsApp";
  }
  if (
    combined.includes("website") ||
    combined.includes("web")
  ) {
    return "Website";
  }
  if (
    combined.includes("google") ||
    combined.includes("google ads") ||
    combined.includes("googlead")
  ) {
    return "Google Ads";
  }
  if (combined.includes("referral")) {
    return "Referral";
  }
  if (
    combined.includes("walk-in") ||
    combined.includes("walk in") ||
    combined.includes("walkin")
  ) {
    return "Walk-in";
  }
  if (combined.includes("campaign")) {
    return "Campaign";
  }
  if (combined.includes("manual")) {
    return "Manual";
  }
  return sourceValue || "Other";
}
function normalizeSource(value) {
  const source = cleanText(value);
  if (!source) {
    return "Other";
  }
  const normalized = source.toLowerCase();
  if (
    normalized.includes("instagram") ||
    normalized === "ig"
  ) {
    return "Instagram";
  }
  if (
    normalized.includes("facebook") ||
    normalized === "fb"
  ) {
    return "Facebook";
  }
  if (normalized.includes("whatsapp")) {
    return "WhatsApp";
  }
  if (
    normalized.includes("website") ||
    normalized === "web"
  ) {
    return "Website";
  }
  if (normalized.includes("google")) {
    return "Google Ads";
  }
  if (normalized.includes("referral")) {
    return "Referral";
  }
  if (
    normalized.includes("walk-in") ||
    normalized.includes("walk in") ||
    normalized === "walkin"
  ) {
    return "Walk-in";
  }
  if (normalized.includes("campaign")) {
    return "Campaign";
  }
  if (normalized.includes("manual")) {
    return "Manual";
  }
  return source;
}
function normalizeStage(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\\_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function isJunkLead(contact) {
  const recordType = String(
    contact?.recordType ||
    contact?.sourceRecord ||
    ""
  ).toLowerCase();
  const stage = normalizeStage(
    contact?.stage ||
    contact?.leadStage ||
    contact?.status ||
    ""
  );
  return (
    recordType === "lead" &&
    (stage === "junk lead" ||
      stage === "junk")
  );
}
const emptyForm = {
  name: "",
  email: "",
  phone: "",
  source: "Manual",
  service: "",
  doctor: "",
  owner: "",
};
function getDefaultForm(user) {
  return {
    ...emptyForm,
    doctor: cleanText(user?.name || ""),
    owner: cleanText(user?.name || ""),
  };
}
function getSuggestions(value, field, contacts) {
  const search = cleanText(value).toLowerCase();
  if (!search) {
    return [];
  }
  const phoneSearch = normalizePhone(value);
  return contacts
    .filter((contact) => {
      const name = cleanText(
        contact.name
      ).toLowerCase();
      const phone = normalizePhone(
        contact.phone
      );
      if (field === "phone") {
        return (
          phoneSearch.length > 0 &&
          phone.includes(phoneSearch)
        );
      }
      return name.includes(search);
    })
    .slice(0, 6);
}
function DeleteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 7H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 11V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 11V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 7L7 20H17L18 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V4H15V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 3L22 20H2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 9V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="16.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function Contacts({ user }) {
  const [contacts, setContacts] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 50;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(() =>
    getDefaultForm(user)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionField, setSuggestionField] =
    useState(null);
  const [
    selectedExistingContact,
    setSelectedExistingContact,
  ] = useState(null);
  const [
    deletingContact,
    setDeletingContact,
  ] = useState(null);
  const [deleting, setDeleting] =
    useState(false);
  const loadContacts = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl("/api/contacts"),
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
          "Unable to load contacts"
        );
      }
      setContacts(
        Array.isArray(data.contacts)
          ? data.contacts
          : []
      );
      setUsage(data.usage || null);
      setCurrentPage(1);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadContacts();
  }, []);
  useEffect(() => {
    setForm(getDefaultForm(user));
  }, [user]);
  const visibleContacts = useMemo(() => {
    return contacts.filter((contact) => !isJunkLead(contact));
  }, [contacts]);
  const totalPages = Math.max(1, Math.ceil(visibleContacts.length / contactsPerPage));
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * contactsPerPage;
    return visibleContacts.slice(start, start + contactsPerPage);
  }, [visibleContacts, currentPage]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const items = [1];
    if (currentPage > 4) items.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let page = start; page <= end; page += 1) items.push(page);
    if (currentPage < totalPages - 3) items.push("...");
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);
  const resetContactForm = () => {
    setForm(getDefaultForm(user));
    setSuggestions([]);
    setSuggestionField(null);
    setSelectedExistingContact(null);
  };
  const openAddContact = () => {
    setMessage("");
    resetContactForm();
    setShowAdd(true);
  };
  const closeAddContact = () => {
    if (saving) return;
    setShowAdd(false);
    resetContactForm();
  };
  const updateField = (field, value) => {
    setSelectedExistingContact(null);
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };
  const handleSearch = (field, value) => {
    setSuggestionField(field);
    setSuggestions(
      getSuggestions(
        value,
        field,
        visibleContacts
      )
    );
  };
  const selectExistingContact = (contact) => {
    const source = getContactSource(contact);
    setForm({
      name: cleanName(contact.name),
      phone: cleanText(contact.phone),
      email: cleanText(contact.email),
      source: normalizeSource(source),
      service: cleanText(contact.service),
      doctor: cleanText(
        contact.doctor ||
        contact.preferredDoctor ||
        contact.owner ||
        user?.name ||
        ""
      ),
      owner: cleanText(
        contact.owner ||
        contact.doctor ||
        user?.name ||
        ""
      ),
    });
    setSelectedExistingContact(contact);
    setSuggestions([]);
    setSuggestionField(null);
  };
  const addNewContact = (field) => {
    setSelectedExistingContact(null);
    setSuggestions([]);
    setSuggestionField(null);
    if (field === "name") {
      setForm((previous) => ({
        ...previous,
        name: cleanText(previous.name),
      }));
    }
    if (field === "phone") {
      setForm((previous) => ({
        ...previous,
        phone: cleanText(previous.phone),
      }));
    }
  };
  const openContactDetails = (contact) => {
    const contactId = String(
      contact?._id || ""
    );
    if (!contactId) {
      return;
    }
    window.location.href =
      `/contacts/${contactId}`;
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const cleanedForm = {
      ...form,
      name: cleanName(form.name),
      email: cleanText(form.email),
      phone: cleanText(form.phone),
      source: normalizeSource(form.source),
      service: cleanText(form.service),
      doctor: cleanText(form.doctor),
      owner: cleanText(form.owner),
    };
    try {
      const response = await fetch(
        buildApiUrl("/api/contacts"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(cleanedForm),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.code ===
            "CONTACT_LIMIT_REACHED"
            ? data.message
            : data.message ||
            "Unable to create contact"
        );
      }
      setContacts((previous) => [
        data.contact,
        ...previous,
      ]);
      setUsage(data.usage || usage);
      setCurrentPage(1);
      setShowAdd(false);
      resetContactForm();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const askDeleteContact = (
    event,
    contact
  ) => {
    event.stopPropagation();
    setMessage("");
    setDeletingContact(contact);
  };
  const closeDeleteModal = () => {
    if (deleting) return;
    setDeletingContact(null);
  };
  const confirmDelete = async () => {
    if (!deletingContact) {
      return;
    }
    setDeleting(true);
    setMessage("");
    const isLead =
      deletingContact.recordType ===
      "lead" ||
      deletingContact.sourceRecord ===
      "lead";
    const endpoint = isLead
      ? `/api/leads/${deletingContact._id}`
      : `/api/contacts/${deletingContact._id}`;
    try {
      const response = await fetch(
        buildApiUrl(endpoint),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to delete record"
        );
      }
      setContacts((previous) =>
        previous.filter(
          (item) =>
            String(item._id) !==
            String(
              deletingContact._id
            )
        )
      );
      if (data.usage) {
        setUsage(data.usage);
      }
      setDeletingContact(null);
    } catch (error) {
      setMessage(
        error.message ||
        "Unable to delete record"
      );
    } finally {
      setDeleting(false);
    }
  };
  const isUnlimited =
    usage?.limit === null;
  const isOverLimit =
    usage &&
    !isUnlimited &&
    usage.used > usage.limit;
  const isLimitReached =
    usage &&
    !isUnlimited &&
    usage.used >= usage.limit;
  return (
    <div className="contacts-page">
      <style>
        {`
          .contacts-clickable-row {
            cursor: pointer;
            transition:
              background-color .18s ease,
              box-shadow .18s ease;
          }
          .contacts-clickable-row:hover {
            background: #f8fbff;
          }
          .contacts-clickable-row td {
            cursor: pointer;
          }
          .contacts-clickable-row:hover .contact-name-text {
            color: #2563eb;
          }
          .contacts-clickable-row:hover .contact-row-arrow {
            opacity: 1;
            transform: translateX(2px);
          }
          .contact-row-arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 8px;
            color: #2563eb;
            opacity: 0;
            transform: translateX(-2px);
            transition:
              opacity .18s ease,
              transform .18s ease;
            vertical-align: middle;
          }
          .contact-delete-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-width: 72px;
            height: 32px;
            padding: 0 11px;
            border: 1px solid #fecaca;
            border-radius: 8px;
            background: #fff7f7;
            color: #dc2626;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all .18s ease;
          }
          .contact-delete-btn:hover {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #b91c1c;
            transform: translateY(-1px);
          }
          .contact-delete-btn svg {
            flex-shrink: 0;
          }
          .contact-delete-cell {
            text-align: right;
            width: 90px;
          }
          .contact-delete-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, .48);
            backdrop-filter: blur(3px);
          }
          .contact-delete-modal {
            width: min(420px, 100%);
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 24px 70px rgba(15, 23, 42, .18);
            overflow: hidden;
            animation: contactDeleteModalIn .18s ease-out;
          }
          @keyframes contactDeleteModalIn {
            from {
              opacity: 0;
              transform: translateY(8px) scale(.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .contact-delete-modal-content {
            padding: 24px;
          }
          .contact-delete-warning {
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: #fff1f2;
            color: #dc2626;
            margin-bottom: 16px;
          }
          .contact-delete-modal h3 {
            margin: 0 0 7px;
            color: #172033;
            font-size: 17px;
            font-weight: 700;
          }
          .contact-delete-modal p {
            margin: 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.55;
          }
          .contact-delete-modal-name {
            color: #172033;
            font-weight: 700;
          }
          .contact-delete-modal-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            padding: 15px 20px;
            border-top: 1px solid #edf1f5;
            background: #fbfcfe;
          }
          .contact-delete-cancel {
            height: 36px;
            padding: 0 15px;
            border: 1px solid #dbe3ed;
            border-radius: 8px;
            background: #fff;
            color: #475569;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          .contact-delete-cancel:hover {
            background: #f8fafc;
          }
          .contact-delete-confirm {
            height: 36px;
            padding: 0 16px;
            border: 1px solid #dc2626;
            border-radius: 8px;
            background: #dc2626;
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          .contact-delete-confirm:hover {
            background: #b91c1c;
            border-color: #b91c1c;
          }
          .contact-delete-confirm:disabled,
          .contact-delete-cancel:disabled {
            opacity: .6;
            cursor: not-allowed;
          }
          .contacts-pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-top: 16px;
            padding: 14px 4px 24px;
          }
          .contacts-pagination-info {
            color: #64748b;
            font-size: 12px;
            font-weight: 500;
          }
          .contacts-pagination-controls {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .contacts-pagination-btn {
            min-width: 34px;
            height: 34px;
            padding: 0 10px;
            border: 1px solid #dbe3ed;
            border-radius: 8px;
            background: #fff;
            color: #475569;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          .contacts-pagination-btn:hover:not(:disabled) {
            border-color: #2563eb;
            color: #2563eb;
            background: #f8fbff;
          }
          .contacts-pagination-btn.active {
            border-color: #2563eb;
            background: #2563eb;
            color: #fff;
          }
          .contacts-pagination-btn:disabled {
            opacity: .45;
            cursor: not-allowed;
          }
          .contacts-pagination-dots {
            width: 24px;
            text-align: center;
            color: #94a3b8;
            font-size: 13px;
          }
          @media (max-width: 900px) {
            .contact-delete-cell {
              width: 75px;
            }
            .contact-delete-btn {
              min-width: 64px;
              padding: 0 8px;
            }
            .contact-row-arrow {
              display: none;
            }
          }
        `}
      </style>
      <header className="contacts-page-header">
        <div>
          <p className="dash-breadcrumb">
            People
          </p>
          <h1>Contacts</h1>
          <p className="contacts-subtitle">
            {usage
              ? `${usage.used}${isUnlimited
                ? ""
                : ` / ${usage.limit}`
              } contacts in your database`
              : "Manage your contacts"}
          </p>
        </div>
        <button
          type="button"
          className="dash-btn primary"
          onClick={openAddContact}
        >
          + Add contact
        </button>
      </header>
      {message && (
        <div className="contact-message">
          {message}
        </div>
      )}
      {isOverLimit ? (
        <div className="contact-limit-banner">
          Your current plan allows{" "}
          {usage.limit} contacts, but you
          currently have {usage.used} contacts.
          Please upgrade your plan or remove
          contacts to add new contacts.
        </div>
      ) : isLimitReached ? (
        <div className="contact-limit-banner">
          You've reached your{" "}
          {usage.limit} contact limit.
          Upgrade your plan to save more
          contacts.
        </div>
      ) : usage && !isUnlimited ? (
        <div className="contact-usage-row">
          <strong>
            {usage.used} / {usage.limit} contacts used
          </strong>
          <span>
            {usage.available} contacts remaining
          </span>
        </div>
      ) : usage ? (
        <div className="contact-usage-row">
          <strong>
            {usage.used} contacts used
          </strong>
          <span>
            Enterprise capacity
          </span>
        </div>
      ) : null}
      <section className="contacts-table-card">
        <div className="contacts-table-meta">
          {visibleContacts.length} records
        </div>
        <div className="contacts-table-wrap">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Source</th>
                <th>Service</th>
                <th>Doctor</th>
                <th>Lead date</th>
                <th className="contact-delete-cell">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="contacts-empty"
                  >
                    Loading contacts...
                  </td>
                </tr>
              ) : visibleContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="contacts-empty"
                  >
                    No contacts yet.
                  </td>
                </tr>
              ) : (
                paginatedContacts.map(
                  (contact) => {
                    const displayName =
                      cleanName(
                        contact.name
                      );
                    const displayPhone =
                      cleanText(
                        contact.phone
                      );
                    const displayEmail =
                      cleanText(
                        contact.email
                      );
                    const displaySource =
                      getContactSource(
                        contact
                      );
                    const displayService =
                      cleanText(
                        contact.service
                      );
                    const displayDoctor =
                      cleanText(
                        contact.doctor ||
                        contact.preferredDoctor ||
                        contact.owner ||
                        user?.name ||
                        ""
                      );
                    const sourceClass =
                      displaySource
                        .toLowerCase()
                        .replace(
                          /[^a-z0-9]+/g,
                          "-"
                        )
                        .replace(
                          /^-+|-+$/g,
                          ""
                        ) ||
                      "default";
                    return (
                      <tr
                        key={`${contact.recordType || "contact"}-${contact._id}`}
                        className="contacts-clickable-row"
                        onClick={() =>
                          openContactDetails(
                            contact
                          )
                        }
                        title="Open contact details"
                      >
                        <td>
                          <span className="contact-name">
                            <span className="contact-avatar">
                              {getInitials(
                                displayName
                              )}
                            </span>
                            <strong
                              className="contact-name-text"
                              title={
                                displayName
                              }
                            >
                              {displayName}
                            </strong>
                            <span className="contact-row-arrow">
                              <ArrowIcon />
                            </span>
                          </span>
                        </td>
                        <td>
                          {displayPhone ||
                            "—"}
                        </td>
                        <td>
                          {displayEmail ||
                            "—"}
                        </td>
                        <td>
                          <span
                            className={`lead-source-badge source-${sourceClass}`}
                          >
                            {displaySource}
                          </span>
                        </td>
                        <td>
                          {displayService ||
                            "—"}
                        </td>
                        <td>
                          {displayDoctor ||
                            "—"}
                        </td>
                        <td>
                          {formatDateTime(
                            contact.leadCreatedAt ||
                            contact.createdAt
                          )}
                        </td>
                        <td className="contact-delete-cell">
                          <button
                            type="button"
                            className="contact-delete-btn"
                            onClick={(
                              event
                            ) =>
                              askDeleteContact(
                                event,
                                contact
                              )
                            }
                          >
                            <DeleteIcon />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
      {visibleContacts.length > 0 && (
        <div className="contacts-pagination">
          <div className="contacts-pagination-info">
            Showing {((currentPage - 1) * contactsPerPage) + 1}–{Math.min(currentPage * contactsPerPage, visibleContacts.length)} of {visibleContacts.length}
          </div>
          <div className="contacts-pagination-controls">
            <button type="button" className="contacts-pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
            {paginationItems.map((item, index) => item === "..." ? (
              <span key={`dots-${index}`} className="contacts-pagination-dots">...</span>
            ) : (
              <button key={item} type="button" className={`contacts-pagination-btn contacts-pagination-number ${currentPage === item ? "active" : ""}`} onClick={() => setCurrentPage(item)}>{item}</button>
            ))}
            <button type="button" className="contacts-pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Next</button>
          </div>
        </div>
      )}
      {showAdd && (
        <div
          className="lead-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddContact();
            }
          }}
        >
          <form
            className="lead-modal lead-form contact-modal"
            onSubmit={handleSubmit}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="lead-modal-head">
              <div>
                <h3>Add contact</h3>
                <p>
                  Save a contact to your
                  current plan capacity.
                </p>
              </div>
              <button
                type="button"
                className="lead-close-btn"
                onClick={
                  closeAddContact
                }
                disabled={saving}
              >
                ×
              </button>
            </div>
            <div className="lead-form-grid">
              <div className="contact-field-with-suggestions">
                <label>
                  Full name
                </label>
                <div className="contact-autocomplete">
                  <input
                    type="text"
                    value={form.name}
                    required
                    autoComplete="off"
                    placeholder="Full name"
                    onFocus={() => {
                      if (
                        form.name.trim()
                      ) {
                        setSuggestionField(
                          "name"
                        );
                        setSuggestions(
                          getSuggestions(
                            form.name,
                            "name",
                            visibleContacts
                          )
                        );
                      }
                    }}
                    onChange={(event) => {
                      const value =
                        event.target.value;
                      updateField(
                        "name",
                        value
                      );
                      handleSearch(
                        "name",
                        value
                      );
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setSuggestions([]);
                        setSuggestionField(
                          null
                        );
                      }, 180);
                    }}
                  />
                  {suggestionField ===
                    "name" &&
                    form.name.trim() && (
                      <div className="contact-suggestions">
                        {suggestions.length >
                          0 ? (
                          suggestions.map(
                            (
                              contact
                            ) => (
                              <button
                                key={`${contact.recordType || "contact"}-${contact._id}`}
                                type="button"
                                className="contact-suggestion-item"
                                onMouseDown={(
                                  event
                                ) => {
                                  event.preventDefault();
                                  selectExistingContact(
                                    contact
                                  );
                                }}
                              >
                                <span className="contact-suggestion-avatar">
                                  {getInitials(
                                    contact.name
                                  )}
                                </span>
                                <span className="contact-suggestion-content">
                                  <strong>
                                    {cleanName(
                                      contact.name
                                    )}
                                  </strong>
                                  <small>
                                    {cleanText(
                                      contact.phone
                                    ) ||
                                      "No phone"}
                                    {contact.email
                                      ? ` · ${cleanText(
                                        contact.email
                                      )}`
                                      : ""}
                                  </small>
                                </span>
                              </button>
                            )
                          )
                        ) : (
                          <button
                            type="button"
                            className="contact-new-suggestion"
                            onMouseDown={(
                              event
                            ) => {
                              event.preventDefault();
                              addNewContact(
                                "name"
                              );
                            }}
                          >
                            <span className="contact-new-icon">
                              +
                            </span>
                            <span>
                              <strong>
                                Add "
                                {cleanText(
                                  form.name
                                )}
                                "
                              </strong>
                              <small>
                                Create new contact
                              </small>
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </div>
              <div className="contact-field-with-suggestions">
                <label>
                  Phone number
                </label>
                <div className="contact-autocomplete">
                  <input
                    type="text"
                    value={form.phone}
                    required
                    autoComplete="off"
                    placeholder="+91 98..."
                    onFocus={() => {
                      if (
                        form.phone.trim()
                      ) {
                        setSuggestionField(
                          "phone"
                        );
                        setSuggestions(
                          getSuggestions(
                            form.phone,
                            "phone",
                            visibleContacts
                          )
                        );
                      }
                    }}
                    onChange={(event) => {
                      const value =
                        event.target.value;
                      updateField(
                        "phone",
                        value
                      );
                      handleSearch(
                        "phone",
                        value
                      );
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setSuggestions([]);
                        setSuggestionField(
                          null
                        );
                      }, 180);
                    }}
                  />
                  {suggestionField ===
                    "phone" &&
                    form.phone.trim() && (
                      <div className="contact-suggestions">
                        {suggestions.length >
                          0 ? (
                          suggestions.map(
                            (
                              contact
                            ) => (
                              <button
                                key={`${contact.recordType || "contact"}-${contact._id}`}
                                type="button"
                                className="contact-suggestion-item"
                                onMouseDown={(
                                  event
                                ) => {
                                  event.preventDefault();
                                  selectExistingContact(
                                    contact
                                  );
                                }}
                              >
                                <span className="contact-suggestion-avatar">
                                  {getInitials(
                                    contact.name
                                  )}
                                </span>
                                <span className="contact-suggestion-content">
                                  <strong>
                                    {cleanName(
                                      contact.name
                                    )}
                                  </strong>
                                  <small>
                                    {cleanText(
                                      contact.phone
                                    )}
                                    {contact.email
                                      ? ` · ${cleanText(
                                        contact.email
                                      )}`
                                      : ""}
                                  </small>
                                </span>
                              </button>
                            )
                          )
                        ) : (
                          <button
                            type="button"
                            className="contact-new-suggestion"
                            onMouseDown={(
                              event
                            ) => {
                              event.preventDefault();
                              addNewContact(
                                "phone"
                              );
                            }}
                          >
                            <span className="contact-new-icon">
                              +
                            </span>
                            <span>
                              <strong>
                                Add "
                                {cleanText(
                                  form.phone
                                )}
                                "
                              </strong>
                              <small>
                                Create new contact
                              </small>
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </div>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  placeholder="name@example.com"
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                />
              </label>
              <label>
                Source
                <input
                  type="text"
                  value={form.source}
                  onChange={(event) =>
                    updateField(
                      "source",
                      event.target.value
                    )
                  }
                />
              </label>
              <label>
                Service
                <input
                  type="text"
                  value={form.service}
                  placeholder="Interested service"
                  onChange={(event) =>
                    updateField(
                      "service",
                      event.target.value
                    )
                  }
                />
              </label>
              <label>
                Doctor
                <input
                  type="text"
                  value={form.doctor}
                  onChange={(event) =>
                    updateField(
                      "doctor",
                      event.target.value
                    )
                  }
                />
              </label>
              <label>
                Owner
                <input
                  type="text"
                  value={form.owner}
                  onChange={(event) =>
                    updateField(
                      "owner",
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
            {selectedExistingContact && (
              <div className="contact-selected-info">
                Existing contact selected:{" "}
                <strong>
                  {cleanName(
                    selectedExistingContact.name
                  )}
                </strong>
              </div>
            )}
            <div className="contact-modal-actions">
              <button
                type="button"
                className="lead-secondary-btn"
                onClick={
                  closeAddContact
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
                  ? "Saving..."
                  : "Save contact"}
              </button>
            </div>
          </form>
        </div>
      )}
      {deletingContact && (
        <div
          className="contact-delete-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >
          <div
            className="contact-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="contact-delete-modal-content">
              <div className="contact-delete-warning">
                <WarningIcon />
              </div>
              <h3>Are you sure?</h3>
              <p>
                Are you sure you want to
                delete{" "}
                <span className="contact-delete-modal-name">
                  {cleanName(
                    deletingContact.name
                  )}
                </span>
                ? This action cannot be
                undone.
              </p>
            </div>
            <div className="contact-delete-modal-actions">
              <button
                type="button"
                className="contact-delete-cancel"
                onClick={
                  closeDeleteModal
                }
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="contact-delete-confirm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
