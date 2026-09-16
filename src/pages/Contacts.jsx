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

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name = "") {
  return name.trim().split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "C";
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
    doctor: user?.name || "",
    owner: user?.name || "",
  };
}

export default function Contacts({ user }) {
  const [contacts, setContacts] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(() => getDefaultForm(user));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadContacts = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl("/api/contacts"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load contacts");
      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(buildApiUrl("/api/contacts"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.code === "CONTACT_LIMIT_REACHED"
          ? data.message
          : data.message || "Unable to create contact");
      }
      setContacts((previous) => [data.contact, ...previous]);
      setUsage(data.usage || usage);
      setForm(getDefaultForm(user));
      setShowAdd(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm("Delete this contact?")) return;
    try {
      const response = await fetch(buildApiUrl(`/api/contacts/${contactId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete contact");
      setContacts((previous) => previous.filter((contact) => contact._id !== contactId));
      setUsage(data.usage || usage);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const isUnlimited = usage?.limit === null;
  const isOverLimit = usage && !isUnlimited && usage.used > usage.limit;
  const isLimitReached = usage && !isUnlimited && usage.used >= usage.limit;

  return (
    <div className="contacts-page">
      <header className="contacts-page-header">
        <div>
          <p className="dash-breadcrumb">People</p>
          <h1>Contacts</h1>
          <p className="contacts-subtitle">
            {usage ? `${usage.used}${isUnlimited ? "" : ` / ${usage.limit}`} contacts in your database` : "Manage your contacts"}
          </p>
        </div>
        <button type="button" className="dash-btn primary" onClick={() => { setMessage(""); setShowAdd(true); }}>
          + Add contact
        </button>
      </header>

      {message && <div className="contact-message">{message}</div>}
      {isOverLimit ? (
        <div className="contact-limit-banner">
          Your current plan allows {usage.limit} contacts, but you currently have {usage.used} contacts. Please upgrade your plan or remove contacts to add new contacts.
        </div>
      ) : isLimitReached ? (
        <div className="contact-limit-banner">
          You've reached your {usage.limit} contact limit. Upgrade your plan to save more contacts.
        </div>
      ) : usage && !isUnlimited ? (
        <div className="contact-usage-row">
          <strong>{usage.used} / {usage.limit} contacts used</strong>
          <span>{usage.available} contacts remaining</span>
        </div>
      ) : usage ? (
        <div className="contact-usage-row"><strong>{usage.used} contacts used</strong><span>Enterprise capacity</span></div>
      ) : null}

      <section className="contacts-table-card">
        <div className="contacts-table-meta">{contacts.length} records</div>
        <div className="contacts-table-wrap">
          <table className="contacts-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Source</th><th>Service</th><th>Doctor</th><th>Lead date</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="contacts-empty">Loading contacts...</td></tr> : contacts.length === 0 ? <tr><td colSpan="8" className="contacts-empty">No contacts yet.</td></tr> : contacts.map((contact) => (
                <tr key={contact._id}>
                  <td><span className="contact-name"><span className="contact-avatar">{getInitials(contact.name)}</span><strong>{contact.name}</strong></span></td>
                  <td>{contact.phone || "—"}</td>
                  <td>{contact.email || "—"}</td>
                  <td><span className="lead-source-badge source-default">{contact.source || "Other"}</span></td>
                  <td>{contact.service || "—"}</td>
                  <td>{contact.doctor || contact.owner || user?.name || "—"}</td>
                  <td>{formatDateTime(contact.leadCreatedAt || contact.createdAt)}</td>
                  <td><button type="button" className="contact-delete-btn" onClick={() => deleteContact(contact._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showAdd && <div className="lead-modal-backdrop" onClick={() => setShowAdd(false)}><form className="lead-modal lead-form contact-modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="lead-modal-head"><div><h3>Add contact</h3><p>Save a contact to your current plan capacity.</p></div><button type="button" className="lead-close-btn" onClick={() => setShowAdd(false)}>×</button></div>
        <div className="lead-form-grid">
          {[["name", "Full name"], ["phone", "Phone number"], ["email", "Email"], ["source", "Source"], ["service", "Service"], ["doctor", "Doctor"], ["owner", "Owner"]].map(([field, label]) => <label key={field}>{label}<input value={form[field]} required={field === "name"} onChange={(event) => setForm((previous) => ({ ...previous, [field]: event.target.value }))} /></label>)}
        </div>
        <div className="contact-modal-actions"><button type="button" className="lead-secondary-btn" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="dash-btn primary" disabled={saving}>{saving ? "Saving..." : "Save contact"}</button></div>
      </form></div>}
    </div>
  );
}
