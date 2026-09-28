import { useEffect, useState } from "react";
import ClinicProfile from "./ClinicProfile";
import Services from "./Services";
import MetaIntegrationPanel from "./MetaIntegrationPanel";
import { getApiBaseUrl } from "../config/api";
import { PLANS, getPlanPrice } from "../config/pricing";
import "../styles/settings-fixed.scss";
import "../styles/settings-fixed-planbilling.scss";

const baseSettingsGroups = [
  {
    label: "Profile",
    items: [],
  },
  {
    label: "CRM",
    items: ["Lead Sources", "Lead Stages", "Services"],
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
    items: ["Invoice Settings", "Plan & Billing"],
  },
];

const PLAN_ORDER = ["starter", "growth", "scale"];

const PLAN_FEATURES = {
  starter: [
    "1,000 content pieces",
    "1 team member",
    "Lead & contact management",
    "Sales pipeline",
    "Follow-up management",
    "Website lead capture",
    "Basic reports",
    "500 chatbot conversations per month",
    "500 contact save",
  ],
  growth: [
    "2,500 content pieces",
    "3 team members",
    "Marketing automation",
    "Advanced lead management",
    "Team collaboration",
    "Social media & ad lead capture",
    "Advanced reports",
    "1,500 chatbot conversations per month",
    "1,500 contact save",
  ],
  scale: [
    "5,000 content pieces",
    "5 team members",
    "Advanced automation",
    "Custom workflows",
    "Advanced permissions",
    "Detailed analytics & reporting",
    "More powerful integrations",
    "3,000 chatbot conversations per month",
    "2,500 contact save",
  ],
  enterprise: [
    "Advanced security & access controls",
    "Custom workflows & configurations",
    "Dedicated onboarding & support",
    "Custom integrations",
    "Priority support",
  ],
};

const CUSTOM_WHATSAPP =
  "https://wa.me/91962598925?text=Hello%20SaleVitals%20team%2C%20I%20am%20interested%20in%20the%20Custom%20CRM%20plan.%20Please%20share%20the%20pricing%2C%20features%2C%20setup%20process%20and%20next%20steps.";

function getSettingsGroups(isHealthcare) {
  return baseSettingsGroups.map((group) =>
    group.label === "Profile"
      ? {
          ...group,
          label: isHealthcare ? "Profile" : "BUSINESS",
          items: isHealthcare
            ? ["Business Profile", "Doctors", "Team", "Roles & Permissions"]
            : ["Business Profile", "Team", "Roles & Permissions"],
        }
      : group
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

function PlaceholderContent({ title }) {
  return (
    <div className="settings-placeholder">
      <div className="settings-placeholder-inner">
        <h2>{title}</h2>
        <p>Configure your {title.toLowerCase()} settings here.</p>
      </div>
    </div>
  );
}

function ManagementContent({ memberType }) {
  const isDoctor = memberType === "doctor";

  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [teamUsage, setTeamUsage] = useState({
    planName: "",
    totalSeats: 0,
    usedSeats: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    speciality: "",
    phone: "",
    email: "",
    roleId: "",
  });

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      setError("");

      const response = await fetch(
        `${getApiBaseUrl()}/api/team-members?type=${encodeURIComponent(
          memberType
        )}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load members.");
      }

      setMembers(data.members || []);

      if (!isDoctor && data.teamUsage) {
        setTeamUsage({
          planName: data.teamUsage.planName || "",
          totalSeats: Number(data.teamUsage.totalSeats || 0),
          usedSeats: Number(data.teamUsage.usedSeats || 0),
        });
      }
    } catch (err) {
      setError(err.message || "Unable to connect to server.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadRoles = async () => {
    if (isDoctor) return;

    try {
      setLoadingRoles(true);

      const response = await fetch(`${getApiBaseUrl()}/api/roles`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load roles.");
      }

      setRoles(
        (data.roles || []).filter((role) => role.status === "active")
      );
    } catch (err) {
      setError(err.message || "Unable to load roles.");
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    setError("");
    setSuccessMessage("");
    loadMembers();
    loadRoles();
  }, [memberType]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      speciality: "",
      phone: "",
      email: "",
      roleId: "",
    });
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingMember(null);
    setError("");
    resetForm();
  };

  const openAddModal = async () => {
    setEditingMember(null);
    setError("");
    setSuccessMessage("");
    resetForm();

    if (!isDoctor) {
      if (
        teamUsage.totalSeats <= 0 ||
        teamUsage.usedSeats >= teamUsage.totalSeats
      ) {
        setError(
          teamUsage.planName
            ? `Your ${teamUsage.planName} plan has reached its user limit of ${teamUsage.totalSeats} including the account owner.`
            : "You need an active subscription plan to add team members."
        );
        return;
      }

      await loadRoles();
    }

    setShowModal(true);
  };

  const openEditModal = async (member) => {
    setEditingMember(member);
    setError("");
    setSuccessMessage("");

    setForm({
      name: member.name || "",
      speciality: member.speciality || "",
      phone: member.phone || "",
      email: member.email || "",
      roleId: member.roleId?._id || member.roleId || "",
    });

    if (!isDoctor) {
      await loadRoles();
    }

    setShowModal(true);
  };

  const saveMember = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      setError(
        isDoctor
          ? "Doctor name is required."
          : "Team member name is required."
      );
      return;
    }

    if (!isDoctor && !email) {
      setError("Email is required.");
      return;
    }

    if (!isDoctor && !form.roleId) {
      setError("Please select a role.");
      return;
    }

    try {
      setSaving(true);

      const body = isDoctor
        ? {
            name,
            speciality: form.speciality.trim(),
            phone: form.phone.trim(),
            email,
            memberType: "doctor",
          }
        : {
            name,
            email,
            roleId: form.roleId,
            memberType: "team",
          };

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
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (editingMember
              ? `Unable to update ${
                  isDoctor ? "doctor" : "team member"
                }.`
              : `Unable to add ${
                  isDoctor ? "doctor" : "team member"
                }.`)
        );
      }

      if (editingMember) {
        setMembers((previous) =>
          previous.map((item) =>
            item._id === data.member._id ? data.member : item
          )
        );
      } else {
        setMembers((previous) => [data.member, ...previous]);
      }

      if (!isDoctor) {
        await loadMembers();
      }

      setShowModal(false);
      setEditingMember(null);
      resetForm();

      setSuccessMessage(
        data.message ||
          (isDoctor
            ? "Doctor added successfully."
            : "Team member added and invitation sent successfully.")
      );
    } catch (err) {
      setError(err.message || "Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (member) => {
    if (!window.confirm(`Delete ${member.name}?`)) return;

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

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete member.");
      }

      setMembers((previous) =>
        previous.filter((item) => item._id !== member._id)
      );

      if (!isDoctor) {
        await loadMembers();
      }

      setSuccessMessage("Member deleted successfully.");
    } catch (err) {
      window.alert(err.message || "Unable to connect to server.");
    }
  };

  const toggleStatus = async (member) => {
    const nextStatus =
      member.status === "active" ? "inactive" : "active";

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/team-members/${member._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update member status.");
      }

      setMembers((previous) =>
        previous.map((item) =>
          item._id === member._id ? data.member : item
        )
      );
    } catch (err) {
      window.alert(err.message || "Unable to connect to server.");
    }
  };

  const getRoleName = (member) => {
    if (member.roleId?.name) {
      return member.roleId.name;
    }

    const role = roles.find(
      (item) => String(item._id) === String(member.roleId)
    );

    return role?.name || "-";
  };

  const getInvitationLabel = (member) => {
    if (member.invitationStatus === "accepted") {
      return "Accepted";
    }

    if (member.invitationStatus === "expired") {
      return "Expired";
    }

    return "Pending";
  };

  const getInvitationClass = (member) => {
    if (member.invitationStatus === "accepted") {
      return "accepted";
    }

    if (member.invitationStatus === "expired") {
      return "expired";
    }

    return "pending";
  };

  const totalSeats = Number(teamUsage.totalSeats || 0);
  const usedSeats = Number(teamUsage.usedSeats || 0);

  const teamLimitReached =
    !isDoctor &&
    totalSeats > 0 &&
    usedSeats >= totalSeats;

  const usagePercentage =
    totalSeats > 0
      ? Math.min((usedSeats / totalSeats) * 100, 100)
      : 0;

  const columns = isDoctor
    ? ["NAME", "SPECIALITY", "PHONE", "EMAIL", "STATUS", "ACTION"]
    : ["NAME", "ROLE", "EMAIL", "INVITATION", "STATUS", "ACTION"];

  return (
    <div className="settings-management">
      <div className="settings-management-header">
        <div>
          <h2>{isDoctor ? "Doctors" : "Team"}</h2>
          <p>
            {isDoctor
              ? "Manage your doctors."
              : "Manage your team members and roles."}
          </p>
        </div>

        <div className="settings-management-header-actions">
          {!isDoctor && (
            <div className="settings-seat-count">
              {usedSeats} / {totalSeats} users
            </div>
          )}

          <button
            type="button"
            className="settings-management-button"
            onClick={openAddModal}
            disabled={!isDoctor && teamLimitReached}
          >
            + {isDoctor ? "Add doctor" : "Add team member"}
          </button>
        </div>
      </div>

      {!isDoctor && (
        <div className="settings-seat-card">
          <div>
            <strong>{teamUsage.planName || "No active plan"}</strong>
            <span>User seat usage</span>
          </div>

          <div className="settings-seat-progress-wrap">
            <strong>
              {usedSeats} / {totalSeats}
            </strong>

            <div className="settings-seat-progress">
              <span
                style={{
                  width: `${usagePercentage}%`,
                  background: teamLimitReached
                    ? "#dc2626"
                    : "#1769d1",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {teamLimitReached && (
        <div className="settings-limit-message">
          You've reached the{" "}
          <strong>{teamUsage.planName}</strong> plan's user limit.
        </div>
      )}

      {successMessage && (
        <div className="settings-success-message">
          {successMessage}
        </div>
      )}

      {error && !showModal && (
        <div className="settings-modal-error">{error}</div>
      )}

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
            {loadingMembers ? (
              <tr>
                <td colSpan={columns.length}>Loading...</td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  No {isDoctor ? "doctors" : "team members"} added yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member._id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>

                  {isDoctor ? (
                    <>
                      <td>{member.speciality || "-"}</td>
                      <td>{member.phone || "-"}</td>
                      <td>{member.email || "-"}</td>
                    </>
                  ) : (
                    <>
                      <td>
                        <span className="settings-role-badge">
                          {getRoleName(member)}
                        </span>
                      </td>

                      <td>{member.email || "-"}</td>

                      <td>
                        <span
                          className={`settings-invitation-badge ${getInvitationClass(
                            member
                          )}`}
                        >
                          {getInvitationLabel(member)}
                        </span>
                      </td>
                    </>
                  )}

                  <td>
                    <button
                      type="button"
                      className={`settings-status-toggle ${member.status}`}
                      onClick={() => toggleStatus(member)}
                    >
                      {member.status === "active"
                        ? "Active"
                        : "Inactive"}
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
        <div
          className="settings-modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="settings-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3>
                {editingMember
                  ? isDoctor
                    ? "Edit doctor"
                    : "Edit team member"
                  : isDoctor
                  ? "Add doctor"
                  : "Add team member"}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              className="settings-modal-form"
              onSubmit={saveMember}
            >
              <label>
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  required
                  autoFocus
                />
              </label>

              {isDoctor ? (
                <>
                  <label>
                    Speciality
                    <input
                      type="text"
                      value={form.speciality}
                      onChange={(event) =>
                        updateForm(
                          "speciality",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateForm("phone", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Role
                    <select
                      value={form.roleId}
                      onChange={(event) =>
                        updateForm("roleId", event.target.value)
                      }
                      required
                      disabled={loadingRoles}
                    >
                      <option value="">
                        {loadingRoles
                          ? "Loading roles..."
                          : "Select role"}
                      </option>

                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {error && (
                <div className="settings-modal-error">
                  {error}
                </div>
              )}

              <div className="settings-modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    (!isDoctor &&
                      (roles.length === 0 || loadingRoles))
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingMember
                    ? "Save changes"
                    : isDoctor
                    ? "Add doctor"
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

const SYSTEM_ROLE_PERMISSIONS = {
  Owner: [
    "Full CRM access",
    "View, add, edit and delete leads",
    "Manage follow-ups and calendar",
    "Manage contacts",
    "Create and send invoices",
    "Manage doctors and team members",
    "Manage services",
    "Use AI Settings",
    "Use chatbot",
    "Manage integrations",
    "Manage business profile",
    "Manage Plan & Billing",
    "Manage roles and permissions",
  ],
  Administrator: [
    "Full CRM access",
    "View, add, edit and delete leads",
    "Manage follow-ups and calendar",
    "Manage contacts",
    "Create and send invoices",
    "Manage doctors and team members",
    "Manage services",
    "Use AI Settings",
    "Use chatbot",
    "Manage integrations",
    "Manage business profile",
    "Manage Plan & Billing",
    "Manage roles and permissions",
    "Cannot delete the Owner",
  ],
  Manager: [
    "View, add and edit leads",
    "Manage lead follow-ups",
    "Manage contacts",
    "Create and send invoices",
    "Add and manage doctors",
    "Add and manage team members",
    "Manage services",
    "View and use AI Settings",
    "View and use chatbot",
    "View calendar",
    "Cannot manage integrations",
    "Cannot manage Plan & Billing",
    "Cannot change business profile",
  ],
  "Sales Executive": [
    "View leads",
    "Schedule follow-ups",
    "Add services",
    "Create and send invoices",
    "View calendar",
    "View assigned CRM information",
    "No team administration access",
    "No owner administration access",
    "No billing management access",
    "No business profile management",
    "No integrations management",
  ],
};

const SYSTEM_ROLE_ORDER = [
  "Owner",
  "Administrator",
  "Manager",
  "Sales Executive",
];

function RolesContent() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${getApiBaseUrl()}/api/roles`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load roles."
          );
        }

        setRoles(data.roles || []);
      } catch (err) {
        setError(
          err.message || "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  const getRoleFromApi = (roleName) =>
    roles.find(
      (role) =>
        String(role.name || "")
          .trim()
          .toLowerCase() === roleName.trim().toLowerCase()
    );

  return (
    <div className="settings-management">
      <div className="settings-management-header">
        <div>
          <h2>Roles & Permissions</h2>
          <p>
            Predefined SaleVitals roles and their access
            permissions.
          </p>
        </div>
      </div>

      {error && (
        <div className="settings-modal-error">{error}</div>
      )}

      {loading ? (
        <div className="settings-loading-box">
          Loading roles...
        </div>
      ) : (
        <div className="settings-roles-grid">
          {SYSTEM_ROLE_ORDER.map((roleName) => {
            const apiRole = getRoleFromApi(roleName);
            const permissions =
              SYSTEM_ROLE_PERMISSIONS[roleName] || [];

            return (
              <div
                className="settings-role-card"
                key={roleName}
              >
                <div className="settings-role-card-head">
                  <div>
                    <h3>{roleName}</h3>
                    <span>System role</span>
                  </div>

                  <b>Fixed</b>
                </div>

                <div className="settings-role-card-body">
                  <strong>Permissions</strong>

                  <div className="settings-permission-list">
                    {permissions.map(
                      (permission, index) => (
                        <div
                          className="settings-permission-item"
                          key={`${roleName}-${index}`}
                        >
                          <span>✓</span>
                          <span>{permission}</span>
                        </div>
                      )
                    )}
                  </div>

                  {apiRole && (
                    <small>
                      Role ID: {apiRole._id}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="settings-role-note">
        Roles and permissions are managed by SaleVitals.
        CRM users cannot create, delete, or modify system
        roles.
      </div>
    </div>
  );
}

function PlanBillingContent() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("plan");
  const [addonQuantity, setAddonQuantity] = useState({
    contacts: 1,
    ai_chat: 1,
    team_members: 1,
  });

  const loadBilling = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${getApiBaseUrl()}/api/billing/current`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load billing information."
        );
      }

      setBilling(data);
    } catch (loadError) {
      setError(
        loadError.message || "Unable to load billing information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const formatCycle = (cycle) => {
    if (!cycle) return "1 month";
    if (cycle === "monthly") return "1 month";

    const match = String(cycle).match(/(\d+)/);

    return match ? `${match[1]} months` : String(cycle);
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatMoney = (amount, currency = "INR") => {
    if (
      amount === null ||
      amount === undefined ||
      Number.isNaN(Number(amount))
    ) {
      return "-";
    }

    return new Intl.NumberFormat(
      currency === "INR" ? "en-IN" : "en-US",
      {
        style: "currency",
        currency: currency === "INR" ? "INR" : "USD",
        maximumFractionDigits: 0,
      }
    ).format(Number(amount));
  };

  const startPlan = (plan) => {
    if (!plan?.id) return;

    const selectedPlan = {
      ...plan,
      planId: plan.id,
      planName: plan.name,
      billing: "monthly",
    };

    localStorage.setItem(
      "selectedPlan",
      JSON.stringify(selectedPlan)
    );

    window.location.href = `/cart?plan=${encodeURIComponent(plan.id)}`;
  };

  const startAddon = (addonType, quantity) => {
    const subscription = billing?.subscription;

    if (
      !subscription?.planId ||
      subscription.status !== "active"
    ) {
      setError(
        "Please activate a CRM plan before purchasing an add-on."
      );
      return;
    }

    if (addonType === "team_members") {
      setError(
        "Team member add-on payment needs the billing backend to be enabled first."
      );
      return;
    }

    const value = Math.max(1, Number(quantity || 1));

    localStorage.setItem(
      "selectedAddon",
      JSON.stringify({
        addonType,
        quantity: value,
        months: value,
      })
    );

    window.location.href =
      `/cart?addon=${encodeURIComponent(addonType)}&months=${value}`;
  };

  const updateQuantity = (addonType, value) => {
    setAddonQuantity((previous) => ({
      ...previous,
      [addonType]: Math.min(10, Math.max(1, value)),
    }));
  };

  const currentPlanId = billing?.subscription?.planId || "";
  const currentPlanName =
    billing?.subscription?.planName || "No active plan";

  const isActive =
    billing?.subscription?.status === "active" &&
    Boolean(currentPlanId);

  const contactUsage = billing?.usage?.contacts || {};
  const aiUsage = billing?.usage?.aiChatbot || {};
  const teamUsage = billing?.usage?.teamMembers || {};

  const contactLimit =
    contactUsage.totalLimit ??
    contactUsage.limit ??
    billing?.plan?.contactLimit ??
    0;

  const aiLimit =
    aiUsage.totalLimit ??
    aiUsage.limit ??
    billing?.plan?.aiChatbotLimit ??
    0;

  const teamLimit =
    teamUsage.limit ??
    Math.max(Number(teamUsage.totalSeats || 1) - 1, 0);

  const contactUsed = Number(contactUsage.used || 0);
  const aiUsed = Number(aiUsage.used || 0);
  const teamUsed = Number(teamUsage.used || 0);

  const contactRemaining =
    contactUsage.remaining ??
    (contactLimit === null
      ? null
      : Math.max(Number(contactLimit) - contactUsed, 0));

  const aiRemaining =
    aiUsage.remaining ??
    (aiLimit === null
      ? null
      : Math.max(Number(aiLimit) - aiUsed, 0));

  const teamRemaining =
    teamUsage.remaining ??
    Math.max(Number(teamLimit) - teamUsed, 0);

  const contactPercentage =
    contactLimit === null
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            Number(
              contactUsage.percentage ??
                (Number(contactLimit) > 0
                  ? (contactUsed / Number(contactLimit)) * 100
                  : 0)
            )
          )
        );

  const aiPercentage =
    aiLimit === null
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            Number(
              aiUsage.percentage ??
                (Number(aiLimit) > 0
                  ? (aiUsed / Number(aiLimit)) * 100
                  : 0)
            )
          )
        );

  const teamPercentage =
    Number(teamLimit) > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (teamUsed / Number(teamLimit)) * 100
          )
        )
      : 0;

  const currentIndex = PLAN_ORDER.indexOf(currentPlanId);

  const visiblePlans = PLAN_ORDER
    .filter((planId) => {
      const planIndex = PLAN_ORDER.indexOf(planId);

      if (currentIndex === -1) return true;

      return planIndex >= currentIndex;
    })
    .map((planId) => PLANS[planId])
    .filter(Boolean);

  const contactAddon = billing?.addons?.contacts || {};
  const aiAddon = billing?.addons?.ai_chat || {};
  const billingHistory = billing?.billingHistory || [];

  const addonCards = [
    {
      id: "contacts",
      title: "Extra Contacts",
      description: "Add more contacts to your CRM.",
      price: 500,
      quota: 1000,
      unit: "contacts",
      addon: contactAddon,
      icon: "▤",
      enabled: true,
    },
    {
      id: "ai_chat",
      title: "AI Chatbot",
      description: "Add more AI chatbot conversations.",
      price: 500,
      quota: 5000,
      unit: "conversations",
      addon: aiAddon,
      icon: "✦",
      enabled: true,
    },
    {
      id: "team_members",
      title: "Team Members",
      description: "Add extra team member seats.",
      price: 500,
      quota: 1,
      unit: "team member",
      addon: {},
      icon: "♙",
      enabled: false,
    },
  ];

  const usageItems = [
    {
      id: "contacts",
      label: "Contacts",
      used: contactUsed,
      limit: contactLimit,
      remaining: contactRemaining,
      percentage: contactPercentage,
      icon: "▤",
    },
    {
      id: "ai",
      label: "AI Chatbot",
      used: aiUsed,
      limit: aiLimit,
      remaining: aiRemaining,
      percentage: aiPercentage,
      icon: "✦",
    },
    {
      id: "team",
      label: "Team Members",
      used: teamUsed,
      limit: teamLimit,
      remaining: teamRemaining,
      percentage: teamPercentage,
      icon: "♙",
    },
  ];

  if (loading) {
    return (
      <div className="plan-billing-page">
        <div className="plan-billing-loading">
          Loading your plan and billing details...
        </div>
      </div>
    );
  }

  if (error && !billing) {
    return (
      <div className="plan-billing-page">
        <div className="plan-billing-error">
          <span>{error}</span>
          <button type="button" onClick={loadBilling}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-billing-page">
      <div className="plan-billing-header">
        <div>
          <h2>Plan &amp; Billing</h2>
          <p>Manage your plan, usage, add-ons and billing history.</p>
        </div>

        {isActive && (
          <span className="plan-billing-active-badge">
            <i />
            Active subscription
          </span>
        )}
      </div>

      <div className="plan-billing-tabs">
        {[
          ["plan", "Plan"],
          ["usage", "Usage"],
          ["addons", "Add-ons"],
          ["history", "Billing History"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeSection === id ? "active" : ""}
            onClick={() => setActiveSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && billing && (
        <div className="plan-billing-inline-error">
          {error}
        </div>
      )}

      {activeSection === "plan" && (
        <>
          <div className="plan-billing-current">
            <div className="plan-billing-current-top">
              <div>
                <span className="plan-billing-label">
                  CURRENT PLAN
                </span>

                <h3>{currentPlanName}</h3>

                {isActive && (
                  <p>
                    {formatCycle(
                      billing?.subscription?.billingCycle
                    )}{" "}
                    plan
                  </p>
                )}
              </div>

              {isActive && (
                <span className="plan-billing-status">
                  Active
                </span>
              )}
            </div>

            {isActive ? (
              <>
                <div className="plan-billing-stats">
                  <div>
                    <span>Billing period</span>
                    <strong>
                      {formatCycle(
                        billing?.subscription?.billingCycle
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Started</span>
                    <strong>
                      {formatDate(
                        billing?.subscription?.startedAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Expires</span>
                    <strong>
                      {formatDate(
                        billing?.subscription?.expiresAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Days remaining</span>
                    <strong>
                      {billing?.subscription?.daysRemaining ?? "-"}
                    </strong>
                  </div>
                </div>

                <div className="plan-billing-usage">
                  <div className="plan-billing-usage-head">
                    <div>
                      <span>Contact usage</span>
                      <strong>
                        {contactLimit === null
                          ? `${contactUsed} contacts`
                          : `${contactUsed} of ${contactLimit} contacts`}
                      </strong>
                    </div>

                    <b>{Math.round(contactPercentage)}%</b>
                  </div>

                  <div className="plan-billing-progress">
                    <i
                      style={{
                        width: `${contactPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="plan-billing-no-plan">
                <p>No active plan is connected to this account.</p>
                <p>Choose a plan below to activate your CRM workspace.</p>
              </div>
            )}
          </div>

          <div className="plan-billing-plans">
            <div className="plan-billing-section-title">
              <div>
                <h3>Available plans</h3>
                <p>Choose a plan for your CRM workspace.</p>
              </div>
            </div>

            <div className="plan-billing-grid">
              {visiblePlans.map((plan) => {
                const current = currentPlanId === plan.id;
                const price = getPlanPrice(plan, "INR");
                const features = PLAN_FEATURES[plan.id] || [];

                return (
                  <div
                    className={
                      current
                        ? "plan-billing-card current"
                        : "plan-billing-card"
                    }
                    key={plan.id}
                  >
                    <div className="plan-billing-card-top">
                      <div>
                        <span className="plan-billing-label">
                          {plan.name}
                        </span>

                        <strong>
                          {price !== null && price !== undefined
                            ? `₹${Number(price).toLocaleString("en-IN")}`
                            : "Custom"}
                        </strong>

                        {price !== null &&
                          price !== undefined && (
                            <small>/month</small>
                          )}
                      </div>

                      {current && (
                        <span className="plan-billing-current-pill">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="plan-billing-card-copy">
                      {plan.description ||
                        `CRM plan with ${
                          plan.contactSave ||
                          plan.contactLimit ||
                          ""
                        } contact capacity.`}
                    </div>

                    <ul>
                      {features.map((feature) => (
                        <li key={feature}>
                          <span>✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={
                        current
                          ? "plan-billing-card-button active"
                          : "plan-billing-card-button"
                      }
                      disabled={current}
                      onClick={() => startPlan(plan)}
                    >
                      {current ? "Your current plan" : "Upgrade"}
                    </button>
                  </div>
                );
              })}

              <div className="plan-billing-card plan-billing-custom-card">
                <div className="plan-billing-card-top">
                  <div>
                    <span className="plan-billing-label">
                      Custom
                    </span>
                    <strong>Custom</strong>
                  </div>
                </div>

                <div className="plan-billing-card-copy">
                  For larger organizations with advanced requirements,
                  customization and dedicated support.
                </div>

                <ul>
                  {PLAN_FEATURES.enterprise.map((feature) => (
                    <li key={feature}>
                      <span>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  className="plan-billing-card-button plan-billing-custom-button"
                  href={CUSTOM_WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                >
                  Talk to sales
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === "usage" && (
        <div className="plan-billing-usage-page">
          <div className="plan-billing-section-title">
            <div>
              <h3>Usage</h3>
              <p>Current usage against your plan allowance.</p>
            </div>
          </div>

          <div className="billing-usage-grid">
            {usageItems.map((item) => (
              <div className="billing-usage-card" key={item.id}>
                <div className="billing-usage-card-top">
                  <div>
                    <span>{item.label}</span>

                    <strong>
                      {item.used.toLocaleString("en-IN")}
                      {" / "}
                      {item.limit === null
                        ? "Unlimited"
                        : Number(item.limit || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="billing-usage-icon">
                    {item.icon}
                  </div>
                </div>

                <div className="billing-usage-progress">
                  <span
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>

                <div className="billing-usage-meta">
                  <span>Remaining</span>
                  <strong>
                    {item.remaining === null
                      ? "Unlimited"
                      : Number(item.remaining || 0).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <div className="billing-usage-graph">
            <div className="billing-usage-graph-head">
              <div>
                <h3>Usage overview</h3>
                <p>Current usage across your active plan limits.</p>
              </div>

              <span>{currentPlanName}</span>
            </div>

            <div className="billing-usage-graph-list">
              {usageItems.map((item) => (
                <div className="billing-usage-graph-row" key={item.id}>
                  <div className="billing-usage-graph-label">
                    <span>{item.icon}</span>
                    <strong>{item.label}</strong>
                  </div>

                  <div className="billing-usage-graph-track">
                    <i
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>

                  <strong className="billing-usage-graph-value">
                    {item.used.toLocaleString("en-IN")} /{" "}
                    {item.limit === null
                      ? "∞"
                      : Number(item.limit || 0).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === "addons" && (
        <div className="plan-billing-addons-page">
          <div className="plan-billing-section-title">
            <div>
              <h3>Add-ons</h3>
              <p>Increase your CRM capacity with simple quantity-based add-ons.</p>
            </div>
          </div>

          <div className="billing-addon-grid">
            {addonCards.map((addon) => {
              const quantity = Number(
                addonQuantity[addon.id] || 1
              );
              const totalQuota = addon.quota * quantity;
              const totalAmount = addon.price * quantity;
              const isEnabled =
                addon.addon?.status === "active";

              return (
                <div
                  className="billing-addon-card"
                  key={addon.id}
                >
                  <div className="billing-addon-head">
                    <div>
                      <span className="billing-addon-icon">
                        {addon.icon}
                      </span>

                      <div>
                        <h4>{addon.title}</h4>
                        <p>{addon.description}</p>
                      </div>
                    </div>

                    {isEnabled && (
                      <span className="billing-addon-active">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="billing-addon-price">
                    <strong>
                      ₹{addon.price.toLocaleString("en-IN")}
                    </strong>
                    <span>/ pack</span>
                  </div>

                  <div className="billing-addon-capacity">
                    <strong>
                      {addon.quota.toLocaleString("en-IN")}
                    </strong>
                    <span>
                      additional {addon.unit} per pack
                    </span>
                  </div>

                  {isEnabled && (
                    <div className="billing-addon-current">
                      <span>Current remaining</span>
                      <strong>
                        {Number(
                          addon.addon?.remaining || 0
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  )}

                  <div className="billing-addon-period">
                    <span>Quantity</span>

                    <div className="billing-addon-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            addon.id,
                            quantity - 1
                          )
                        }
                        disabled={quantity <= 1}
                      >
                        −
                      </button>

                      <strong>{quantity}</strong>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            addon.id,
                            quantity + 1
                          )
                        }
                        disabled={quantity >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="billing-addon-total">
                    <span>Total capacity</span>
                    <strong>
                      {totalQuota.toLocaleString("en-IN")}{" "}
                      {addon.unit}
                    </strong>
                  </div>

                  <div className="billing-addon-total">
                    <span>Amount</span>
                    <strong>
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="billing-addon-button"
                    onClick={() =>
                      startAddon(addon.id, quantity)
                    }
                    disabled={!isActive || !addon.enabled}
                  >
                    {!isActive
                      ? "Activate a plan first"
                      : addon.enabled
                        ? "Pay Now"
                        : "Coming soon"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === "history" && (
        <div className="plan-billing-history-page">
          <div className="plan-billing-section-title">
            <div>
              <h3>Billing History</h3>
              <p>Your successful plan and add-on payments.</p>
            </div>
          </div>

          <div className="billing-history-table-wrap">
            <table className="billing-history-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Purchase Date</th>
                  <th>Plan / Add-on</th>
                  <th>Amount</th>
                  <th>GST</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {billingHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="billing-history-empty"
                    >
                      No billing history available.
                    </td>
                  </tr>
                ) : (
                  billingHistory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.invoiceNumber || "-"}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          item.date || item.createdAt
                        )}
                      </td>

                      <td>
                        <div className="billing-history-item">
                          <strong>
                            {item.itemName}
                          </strong>

                          {item.orderType === "addon" &&
                            item.addonMonths > 0 && (
                              <small>
                                {item.addonMonths} pack
                                {item.addonMonths > 1 ? "s" : ""}
                              </small>
                            )}

                          {item.orderType !== "addon" &&
                            item.period > 0 && (
                              <small>
                                {item.period} month
                                {item.period > 1 ? "s" : ""}
                              </small>
                            )}
                        </div>
                      </td>

                      <td>
                        {formatMoney(
                          Number(item.amount || 0) -
                            Number(item.tax || 0),
                          item.currency
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          item.tax || 0,
                          item.currency
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            item.total || item.amount || 0,
                            item.currency
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="billing-history-status">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings({
  user,
  initialTab = "Business Profile",
}) {
  const isHealthcare =
    String(user?.speciality || "")
      .trim()
      .toLowerCase() === "healthcare";

  const [activeTab, setActiveTab] =
    useState("Business Profile");

  useEffect(() => {
    setActiveTab(
      initialTab || "Business Profile"
    );

    const params = new URLSearchParams(
      window.location.search
    );

    if (
      params.get("metaSelectPage") === "true" ||
      params.get("metaError") ||
      params.get("google")
    ) {
      setActiveTab("Integrations");
    }
  }, [isHealthcare, initialTab]);

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
          <ManagementContent memberType="doctor" />
        );

      case "Team":
        return (
          <ManagementContent memberType="team" />
        );

      case "Roles & Permissions":
        return <RolesContent />;

      case "Lead Sources":
      case "Lead Stages":
      case "WhatsApp":
      case "Notification Settings":
      case "AI Settings":
      case "Invoice Settings":
        return (
          <PlaceholderContent
            title={activeTab}
          />
        );

      case "Plan & Billing":
        return <PlanBillingContent />;

      case "Services":
        return <Services />;

      case "Integrations":
        return <MetaIntegrationPanel />;

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
    <div className="settings-page settings-fixed-layout">
      <div className="settings-page-header">
        <h1>Settings</h1>

        <p>
          Configure your profile, team, pipeline,
          billing and integrations.
        </p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          {getSettingsGroups(isHealthcare).map(
            (group) => (
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
                          setActiveTab(item)
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
            )
          )}
        </aside>

        <main className="settings-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}