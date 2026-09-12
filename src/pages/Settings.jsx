import { useEffect, useState } from "react";
import ClinicProfile from "./ClinicProfile";
import Services from "./Services";
import { getApiBaseUrl } from "../config/api";

const baseSettingsGroups = [
  {
    label: "Profile",
    items: [],
  },
  {
    label: "CRM",
    items: [
      "Lead Sources",
      "Lead Stages",
      "Services",
      "Form Settings",
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      "WhatsApp",
      "Integrations",
      "Notification Settings",
      "AI Settings",
    ],
  },
  {
    label: "BILLING",
    items: [
      "Invoice Settings",
      "GST Settings",
      "Payment Settings",
      "Plan & Billing",
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      "Security",
    ],
  },
];

function getSettingsGroups(isHealthcare) {
  return baseSettingsGroups.map((group) =>
    group.label === "Profile"
      ? {
          ...group,
          label: isHealthcare ? "Profile" : "BUSINESS",
          items: isHealthcare
            ? [
                "Business Profile",
                "Doctors",
                "Team Members",
                "Roles & Permissions",
              ]
            : [
                "Business Profile",
                "Team",
                "Team Members",
                "Roles & Permissions",
              ],
        }
      : group
  );
}

function PlaceholderContent({ title }) {
  return (
    <div className="settings-placeholder">
      <div className="settings-placeholder-inner">
        <h2>{title}</h2>

        <p>
          Configure your {title.toLowerCase()} settings here.
        </p>
      </div>
    </div>
  );
}

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    localStorage.getItem("salevitals_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("vitalsToken") ||
    sessionStorage.getItem("salevitals_token") ||
    ""
  );
}

function ManagementContent({ isHealthcare }) {
  const columns = [
    "NAME",
    "SPECIALITY",
    "PHONE",
    "EMAIL",
    "STATUS",
    "ACTION",
  ];

  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    speciality: "",
    phone: "",
    email: "",
  });

  const loadMembers = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/team-members`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMembers(data.members || []);
      }
    } catch (loadError) {
      console.error("Load team members error:", loadError);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setError("");
    setForm({
      name: "",
      speciality: "",
      phone: "",
      email: "",
    });
  };

  const openAddModal = () => {
    setEditingMember(null);
    setError("");
    setForm({
      name: "",
      speciality: "",
      phone: "",
      email: "",
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setError("");
    setForm({
      name: member.name || "",
      speciality: member.speciality || "",
      phone: member.phone || "",
      email: member.email || "",
    });
    setShowModal(true);
  };

  const saveMember = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/team-members${
          editingMember ? `/${editingMember._id}` : ""
        }`,
        {
          method: editingMember ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            (editingMember
              ? "Unable to update team member."
              : "Unable to add team member.")
        );
        return;
      }

      setMembers((previous) =>
        editingMember
          ? previous.map((item) =>
              item._id === data.member._id ? data.member : item
            )
          : [data.member, ...previous]
      );
      closeModal();
    } catch (saveError) {
      console.error("Save team member error:", saveError);
      setError("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (member) => {
    if (!window.confirm(`Delete ${member.name}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/team-members/${member._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMembers((previous) =>
          previous.filter((item) => item._id !== member._id)
        );
      }
    } catch (deleteError) {
      console.error("Delete team member error:", deleteError);
    }
  };

  const toggleStatus = async (member) => {
    const nextStatus = member.status === "active" ? "inactive" : "active";

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/team-members/${member._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMembers((previous) =>
          previous.map((item) =>
            item._id === member._id ? data.member : item
          )
        );
      }
    } catch (statusError) {
      console.error("Update team member status error:", statusError);
    }
  };

  return (
    <div className="settings-management">
      <div className="settings-management-header">
        <div>
          <h2>{isHealthcare ? "Doctors" : "Team"}</h2>
          <p>
            {isHealthcare
              ? "Manage your doctors."
              : "Manage your team members."}
          </p>
        </div>

        <button
          type="button"
          className="settings-management-button"
          onClick={openAddModal}
        >
          + {isHealthcare ? "Add doctor" : "Add team member"}
        </button>
      </div>

      <div className="settings-management-table-wrap">
        <table className="settings-management-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  No {isHealthcare ? "doctors" : "team members"} added yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member._id}>
                  <td>{member.name}</td>
                  <td>{member.speciality || "-"}</td>
                  <td>{member.phone || "-"}</td>
                  <td>{member.email || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className={`settings-status-toggle ${member.status}`}
                      onClick={() => toggleStatus(member)}
                    >
                      {member.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <div className="settings-row-actions">
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteMember(member)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="settings-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="settings-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-header">
              <div>
                <h3>
                  {editingMember
                    ? "Edit member"
                    : isHealthcare
                      ? "Add doctor"
                      : "Add team member"}
                </h3>
                <p>
                  {editingMember
                    ? "Update the member details below."
                    : "Enter the member details below."}
                </p>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={saveMember} className="settings-modal-form">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                  autoFocus
                />
              </label>

              <label>
                Speciality
                <input
                  value={form.speciality}
                  onChange={(event) =>
                    updateForm("speciality", event.target.value)
                  }
                />
              </label>

              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  type="tel"
                />
              </label>

              <label>
                Email
                <input
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  type="email"
                />
              </label>

              {error && <div className="settings-modal-error">{error}</div>}

              <div className="settings-modal-actions">
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingMember
                      ? "Save changes"
                      : "Add member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings({ user }) {
  const isHealthcare =
    String(user?.speciality || "").trim().toLowerCase() === "healthcare";

  const [activeTab, setActiveTab] = useState(
    isHealthcare ? "Clinic Profile" : "Business Profile"
  );

  useEffect(() => {
    setActiveTab(
      isHealthcare ? "Clinic Profile" : "Business Profile"
    );
  }, [isHealthcare]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Clinic Profile":
      case "Business Profile":
        return (
          <ClinicProfile
            user={user}
            isHealthcare={isHealthcare}
          />
        );

      case "Doctors":
        return (
          <ManagementContent isHealthcare={isHealthcare} />
        );

      case "Team":
        return (
          <ManagementContent isHealthcare={isHealthcare ? true : false} />
        );

      case "Team Members":
        return (
          <PlaceholderContent
            title="Team Members"
          />
        );

      case "Roles & Permissions":
        return (
          <PlaceholderContent
            title="Roles & Permissions"
          />
        );

      case "Lead Sources":
        return (
          <PlaceholderContent
            title="Lead Sources"
          />
        );

      case "Lead Stages":
        return (
          <PlaceholderContent
            title="Lead Stages"
          />
        );

      case "Services":
        return (
          <Services />
        );
      case "Form Settings":
        return (
          <PlaceholderContent
            title="Form Settings"
          />
        );

      case "WhatsApp":
        return (
          <PlaceholderContent
            title="WhatsApp"
          />
        );

      case "Integrations":
        return (
          <PlaceholderContent
            title="Integrations"
          />
        );

      case "Notification Settings":
        return (
          <PlaceholderContent
            title="Notification Settings"
          />
        );

      case "AI Settings":
        return (
          <PlaceholderContent
            title="AI Settings"
          />
        );

      case "Invoice Settings":
        return (
          <PlaceholderContent
            title="Invoice Settings"
          />
        );

      case "GST Settings":
        return (
          <PlaceholderContent
            title="GST Settings"
          />
        );

      case "Payment Settings":
        return (
          <PlaceholderContent
            title="Payment Settings"
          />
        );

      case "Plan & Billing":
        return (
          <PlaceholderContent
            title="Plan & Billing"
          />
        );

      case "Security":
        return (
          <PlaceholderContent
            title="Security"
          />
        );

      default:
        return (
          <ClinicProfile
            user={user}
            isHealthcare={isHealthcare}
          />
        );
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1>
          Settings
        </h1>
        <p>
          Configure your profile, team, pipeline, billing and integrations.
        </p>
      </div>
      <div className="settings-layout">
        <aside className="settings-sidebar">
          {getSettingsGroups(isHealthcare).map((group) => (
            <div
              className="settings-group"
              key={group.label}
            >

              <div className="settings-group-label">
                {group.label}
              </div>

              <div className="settings-group-items">

                {group.items.map((item) => {

                  const isActive =
                    activeTab === item;

                  return (
                    <button
                      type="button"
                      key={item}
                      className={
                        isActive
                          ? "settings-tab active"
                          : "settings-tab"
                      }
                      onClick={() =>
                        handleTabChange(item)
                      }
                    >

                      <span className="settings-tab-text">
                        {item}
                      </span>

                      {isActive && (
                        <span className="settings-tab-arrow">
                          ›
                        </span>
                      )}

                    </button>
                  );

                })}

              </div>

            </div>
          ))}

        </aside>

        <main className="settings-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}