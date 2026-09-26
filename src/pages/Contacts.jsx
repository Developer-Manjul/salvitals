import { useEffect, useState } from "react";
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
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
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
    return "Google";
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
    return "Google";
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
      const name = cleanText(contact.name).toLowerCase();
      const phone = normalizePhone(contact.phone);

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

export default function Contacts({ user }) {
  const [contacts, setContacts] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(() =>
    getDefaultForm(user)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionField, setSuggestionField] =
    useState(null);

  const [selectedExistingContact, setSelectedExistingContact] =
    useState(null);

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
          data.message || "Unable to load contacts"
        );
      }

      setContacts(
        Array.isArray(data.contacts)
          ? data.contacts
          : []
      );

      setUsage(data.usage || null);
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
        contacts
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
          data.code === "CONTACT_LIMIT_REACHED"
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

      setShowAdd(false);
      resetContactForm();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm("Delete this contact?")) {
      return;
    }

    try {
      const response = await fetch(
        buildApiUrl(
          `/api/contacts/${contactId}`
        ),
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
            "Unable to delete contact"
        );
      }

      setContacts((previous) =>
        previous.filter(
          (contact) =>
            contact._id !== contactId
        )
      );

      setUsage(data.usage || usage);
    } catch (error) {
      setMessage(error.message);
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

      <header className="contacts-page-header">
        <div>
          <p className="dash-breadcrumb">
            People
          </p>

          <h1>
            Contacts
          </h1>

          <p className="contacts-subtitle">
            {usage
              ? `${usage.used}${
                  isUnlimited
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
          {contacts.length} records
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
                <th />
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
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="contacts-empty"
                  >
                    No contacts yet.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {

                  const displayName =
                    cleanName(contact.name);

                  const displayPhone =
                    cleanText(contact.phone);

                  const displayEmail =
                    cleanText(contact.email);

                  const displaySource =
                    getContactSource(contact);

                  const displayService =
                    cleanText(contact.service);

                  const displayDoctor =
                    cleanText(
                      contact.doctor ||
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
                      ) || "default";

                  return (
                    <tr
                      key={contact._id}
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
                            title={displayName}
                          >
                            {displayName}
                          </strong>

                        </span>
                      </td>

                      <td>
                        {displayPhone || "—"}
                      </td>

                      <td>
                        {displayEmail || "—"}
                      </td>

                      <td>
                        <span
                          className={`lead-source-badge source-${sourceClass}`}
                        >
                          {displaySource}
                        </span>
                      </td>

                      <td>
                        {displayService || "—"}
                      </td>

                      <td>
                        {displayDoctor || "—"}
                      </td>

                      <td>
                        {formatDateTime(
                          contact.leadCreatedAt ||
                            contact.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="contact-delete-btn"
                          onClick={() =>
                            deleteContact(
                              contact._id
                            )
                          }
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

      </section>

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
                <h3>
                  Add contact
                </h3>

                <p>
                  Save a contact to your
                  current plan capacity.
                </p>
              </div>

              <button
                type="button"
                className="lead-close-btn"
                onClick={closeAddContact}
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
                            contacts
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
                            (contact) => (
                              <button
                                key={
                                  contact._id
                                }
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
                            contacts
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
                            (contact) => (
                              <button
                                key={
                                  contact._id
                                }
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
                onClick={closeAddContact}
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

    </div>
  );
}