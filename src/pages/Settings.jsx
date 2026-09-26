import { useEffect, useState } from "react";
import ClinicProfile from "./ClinicProfile";
import Services from "./Services";
import MetaIntegrationPanel from "./MetaIntegrationPanel";
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
      "Plan & Billing",
    ],
  },
];

function getSettingsGroups(isHealthcare) {
  return baseSettingsGroups.map((group) =>
    group.label === "Profile"
      ? {
          ...group,
          label: isHealthcare
            ? "Profile"
            : "BUSINESS",
          items: isHealthcare
            ? [
                "Business Profile",
                "Doctors",
                "Team",
                "Roles & Permissions",
              ]
            : [
                "Business Profile",
                "Team",
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
          Configure your{" "}
          {title.toLowerCase()} settings here.
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

function ManagementContent({ memberType }) {
  const isDoctor = memberType === "doctor";

  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [teamUsage, setTeamUsage] = useState({
    planId: "",
    planName: "",
    limit: 0,
    used: 0,
    available: 0,
    totalSeats: 0,
    usedSeats: 0,
  });

  const [showModal, setShowModal] =
    useState(false);
  const [editingMember, setEditingMember] =
    useState(null);
  const [saving, setSaving] =
    useState(false);
  const [loadingMembers, setLoadingMembers] =
    useState(false);
  const [loadingRoles, setLoadingRoles] =
    useState(false);
  const [error, setError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [form, setForm] = useState({
    name: "",
    speciality: "",
    phone: "",
    email: "",
    roleId: "",
  });

  const columns = isDoctor
    ? [
        "NAME",
        "SPECIALITY",
        "PHONE",
        "EMAIL",
        "STATUS",
        "ACTION",
      ]
    : [
        "NAME",
        "ROLE",
        "EMAIL",
        "INVITATION",
        "STATUS",
        "ACTION",
      ];

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

      if (response.ok && data.success) {
        setMembers(data.members || []);

        if (!isDoctor && data.teamUsage) {
          setTeamUsage({
            planId:
              data.teamUsage.planId || "",
            planName:
              data.teamUsage.planName || "",
            limit:
              Number(
                data.teamUsage.limit || 0
              ),
            used:
              Number(
                data.teamUsage.used || 0
              ),
            available:
              Number(
                data.teamUsage.available || 0
              ),
            totalSeats:
              Number(
                data.teamUsage.totalSeats || 0
              ),
            usedSeats:
              Number(
                data.teamUsage.usedSeats || 0
              ),
          });
        }
      } else {
        setError(
          data.message ||
            "Unable to load members."
        );
      }
    } catch (error) {
      console.error(
        "Load members error:",
        error
      );
      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadRoles = async () => {
    if (isDoctor) {
      return;
    }

    try {
      setLoadingRoles(true);

      const response = await fetch(
        `${getApiBaseUrl()}/api/roles`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setRoles(
          (data.roles || []).filter(
            (role) =>
              role.status === "active"
          )
        );
      } else {
        setError(
          data.message ||
            "Unable to load roles."
        );
      }
    } catch (error) {
      console.error(
        "Load roles error:",
        error
      );
      setError(
        "Unable to load roles."
      );
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

  const updateForm = (
    field,
    value
  ) => {
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
    if (saving) {
      return;
    }

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
      const totalSeats =
        teamUsage.totalSeats || 0;

      const usedSeats =
        teamUsage.usedSeats || 0;

      if (
        totalSeats <= 0 ||
        usedSeats >= totalSeats
      ) {
        setError(
          teamUsage.planName
            ? `Your ${teamUsage.planName} plan has reached its user limit of ${totalSeats} including the account owner.`
            : "You need an active subscription plan to add team members."
        );
        return;
      }

      await loadRoles();
    }

    setShowModal(true);
  };

  const openEditModal = async (
    member
  ) => {
    setEditingMember(member);
    setError("");
    setSuccessMessage("");

    setForm({
      name: member.name || "",
      speciality:
        member.speciality || "",
      phone: member.phone || "",
      email: member.email || "",
      roleId:
        member.roleId?._id ||
        member.roleId ||
        "",
    });

    if (!isDoctor) {
      await loadRoles();
    }

    setShowModal(true);
  };

  const saveMember = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const name =
      form.name.trim();

    const email =
      form.email.trim();

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

    if (
      !isDoctor &&
      !form.roleId
    ) {
      setError("Please select a role.");
      return;
    }

    try {
      setSaving(true);

      const body = isDoctor
        ? {
            name,
            speciality:
              form.speciality.trim(),
            phone:
              form.phone.trim(),
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
          editingMember
            ? `/${editingMember._id}`
            : ""
        }`,
        {
          method: editingMember
            ? "PUT"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            (editingMember
              ? `Unable to update ${
                  isDoctor
                    ? "doctor"
                    : "team member"
                }.`
              : `Unable to add ${
                  isDoctor
                    ? "doctor"
                    : "team member"
                }.`)
        );
        return;
      }

      if (editingMember) {
        setMembers((previous) =>
          previous.map((item) =>
            item._id ===
            data.member._id
              ? data.member
              : item
          )
        );
      } else {
        setMembers((previous) => [
          data.member,
          ...previous,
        ]);
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
    } catch (error) {
      console.error(
        "Save member error:",
        error
      );
      setError(
        "Unable to connect to server."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (
    member
  ) => {
    if (
      !window.confirm(
        `Delete ${member.name}?`
      )
    ) {
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

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setMembers((previous) =>
          previous.filter(
            (item) =>
              item._id !==
              member._id
          )
        );

        if (!isDoctor) {
          await loadMembers();
        }

        setSuccessMessage(
          "Member deleted successfully."
        );
      } else {
        window.alert(
          data.message ||
            "Unable to delete member."
        );
      }
    } catch (error) {
      console.error(
        "Delete member error:",
        error
      );
      window.alert(
        "Unable to connect to server."
      );
    }
  };

  const toggleStatus = async (
    member
  ) => {
    const nextStatus =
      member.status === "active"
        ? "inactive"
        : "active";

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/team-members/${member._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setMembers((previous) =>
          previous.map((item) =>
            item._id ===
            member._id
              ? data.member
              : item
          )
        );
      } else {
        window.alert(
          data.message ||
            "Unable to update member status."
        );
      }
    } catch (error) {
      console.error(
        "Update member status error:",
        error
      );
      window.alert(
        "Unable to connect to server."
      );
    }
  };

  const getRoleName = (
    member
  ) => {
    if (member.roleId?.name) {
      return member.roleId.name;
    }

    const role = roles.find(
      (item) =>
        String(item._id) ===
        String(member.roleId)
    );

    return role?.name || "-";
  };

  const getInvitationLabel = (
    member
  ) => {
    if (
      member.invitationStatus ===
      "accepted"
    ) {
      return "Accepted";
    }

    if (
      member.invitationStatus ===
      "expired"
    ) {
      return "Expired";
    }

    return "Pending";
  };

  const getInvitationClass = (
    member
  ) => {
    if (
      member.invitationStatus ===
      "accepted"
    ) {
      return "accepted";
    }

    if (
      member.invitationStatus ===
      "expired"
    ) {
      return "expired";
    }

    return "pending";
  };

  const totalSeats = !isDoctor
    ? Number(
        teamUsage.totalSeats || 0
      )
    : 0;

  const usedSeats = !isDoctor
    ? Number(
        teamUsage.usedSeats || 0
      )
    : 0;

  const teamLimitReached =
    !isDoctor &&
    totalSeats > 0 &&
    usedSeats >= totalSeats;

  const usagePercentage =
    totalSeats > 0
      ? Math.min(
          (usedSeats /
            totalSeats) *
            100,
          100
        )
      : 0;

  return (
    <div className="settings-management">
      <div className="settings-management-header">
        <div>
          <h2>
            {isDoctor
              ? "Doctors"
              : "Team"}
          </h2>

          <p>
            {isDoctor
              ? "Manage your doctors."
              : "Manage your team members and roles."}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "12px",
          }}
        >
          {!isDoctor && (
            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              {usedSeats} /{" "}
              {totalSeats} users
            </div>
          )}

          <button
            type="button"
            className="settings-management-button"
            onClick={
              openAddModal
            }
            disabled={
              !isDoctor &&
              teamLimitReached
            }
          >
            +{" "}
            {isDoctor
              ? "Add doctor"
              : "Add team member"}
          </button>
        </div>
      </div>

      {!isDoctor && (
        <div
          style={{
            marginBottom:
              "18px",
            padding:
              "12px 15px",
            border:
              "1px solid #e2e8f0",
            borderRadius:
              "8px",
            background:
              "#f8fafc",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: "15px",
          }}
        >
          <div>
            <strong
              style={{
                color:
                  "#1e293b",
                fontSize:
                  "13px",
              }}
            >
              {teamUsage.planName ||
                "No active plan"}
            </strong>

            <div
              style={{
                marginTop:
                  "3px",
                color:
                  "#64748b",
                fontSize:
                  "12px",
              }}
            >
              User seat usage
            </div>
          </div>

          <div
            style={{
              minWidth:
                "160px",
              textAlign:
                "right",
            }}
          >
            <div
              style={{
                fontSize:
                  "13px",
                fontWeight:
                  600,
              }}
            >
              {usedSeats} /{" "}
              {totalSeats}
            </div>

            <div
              style={{
                height:
                  "5px",
                marginTop:
                  "6px",
                background:
                  "#e2e8f0",
                borderRadius:
                  "999px",
                overflow:
                  "hidden",
              }}
            >
              <div
                style={{
                  width: `${usagePercentage}%`,
                  height:
                    "100%",
                  background:
                    teamLimitReached
                      ? "#dc2626"
                      : "#1769d1",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {teamLimitReached && (
        <div
          style={{
            marginBottom:
              "16px",
            padding:
              "11px 14px",
            border:
              "1px solid #fed7aa",
            background:
              "#fff7ed",
            color:
              "#9a3412",
            borderRadius:
              "7px",
            fontSize:
              "13px",
          }}
        >
          You've reached the{" "}
          <strong>
            {teamUsage.planName}
          </strong>{" "}
          plan's user limit.
        </div>
      )}

      {successMessage && (
        <div className="settings-success-message">
          {successMessage}
        </div>
      )}

      {error &&
        !showModal && (
          <div className="settings-modal-error">
            {error}
          </div>
        )}

      <div className="settings-management-table-wrap">
        <table className="settings-management-table">
          <thead>
            <tr>
              {columns.map(
                (column) => (
                  <th
                    key={column}
                  >
                    {column}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {loadingMembers ? (
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                >
                  Loading...
                </td>
              </tr>
            ) : members.length ===
              0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                >
                  No{" "}
                  {isDoctor
                    ? "doctors"
                    : "team members"}{" "}
                  added yet.
                </td>
              </tr>
            ) : (
              members.map(
                (member) => (
                  <tr
                    key={
                      member._id
                    }
                  >
                    <td>
                      <strong>
                        {
                          member.name
                        }
                      </strong>
                    </td>

                    {isDoctor ? (
                      <>
                        <td>
                          {
                            member.speciality ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            member.phone ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            member.email ||
                            "-"
                          }
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <span className="settings-role-badge">
                            {getRoleName(
                              member
                            )}
                          </span>
                        </td>

                        <td>
                          {
                            member.email ||
                            "-"
                          }
                        </td>

                        <td>
                          <span
                            className={`settings-invitation-badge ${getInvitationClass(
                              member
                            )}`}
                          >
                            {getInvitationLabel(
                              member
                            )}
                          </span>
                        </td>
                      </>
                    )}

                    <td>
                      <button
                        type="button"
                        className={`settings-status-toggle ${member.status}`}
                        onClick={() =>
                          toggleStatus(
                            member
                          )
                        }
                      >
                        {member.status ===
                        "active"
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>

                    <td>
                      <div className="settings-row-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              member
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            deleteMember(
                              member
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="settings-modal-backdrop"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="settings-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-modal-header">
              <div>
                <h3>
                  {editingMember
                    ? isDoctor
                      ? "Edit doctor"
                      : "Edit team member"
                    : isDoctor
                      ? "Add doctor"
                      : "Add team member"}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                saveMember
              }
              className="settings-modal-form"
            >
              <label>
                Name

                <input
                  type="text"
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "name",
                      event.target
                        .value
                    )
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
                      value={
                        form.speciality
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "speciality",
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Phone

                    <input
                      type="tel"
                      value={
                        form.phone
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "phone",
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Email

                    <input
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "email",
                          event.target
                            .value
                        )
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
                      value={
                        form.email
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "email",
                          event.target
                            .value
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    Role

                    <select
                      value={
                        form.roleId
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "roleId",
                          event.target
                            .value
                        )
                      }
                      required
                      disabled={
                        loadingRoles
                      }
                    >
                      <option value="">
                        {loadingRoles
                          ? "Loading roles..."
                          : "Select role"}
                      </option>

                      {roles.map(
                        (role) => (
                          <option
                            key={
                              role._id
                            }
                            value={
                              role._id
                            }
                          >
                            {
                              role.name
                            }
                          </option>
                        )
                      )}
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
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    (!isDoctor &&
                      (roles.length ===
                        0 ||
                        loadingRoles))
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
  const [roles, setRoles] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${getApiBaseUrl()}/api/roles`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setRoles(
          data.roles || []
        );
      } else {
        setError(
          data.message ||
            "Unable to load roles."
        );
      }
    } catch (error) {
      console.error(
        "Load roles error:",
        error
      );

      setError(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const getRoleFromApi = (
    roleName
  ) =>
    roles.find(
      (role) =>
        String(
          role.name || ""
        )
          .trim()
          .toLowerCase() ===
        roleName
          .trim()
          .toLowerCase()
    );

  return (
    <div className="settings-management">
      <div className="settings-management-header">
        <div>
          <h2>
            Roles & Permissions
          </h2>

          <p>
            Predefined SaleVitals
            roles and their access
            permissions.
          </p>
        </div>
      </div>

      {error && (
        <div className="settings-modal-error">
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="settings-management-table-wrap"
          style={{
            padding: "25px",
          }}
        >
          Loading roles...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          {SYSTEM_ROLE_ORDER.map(
            (roleName) => {
              const apiRole =
                getRoleFromApi(
                  roleName
                );

              const permissions =
                SYSTEM_ROLE_PERMISSIONS[
                  roleName
                ] || [];

              return (
                <div
                  key={roleName}
                  style={{
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "10px",
                    background:
                      "#ffffff",
                    overflow:
                      "hidden",
                  }}
                >
                  <div
                    style={{
                      padding:
                        "16px 18px",
                      borderBottom:
                        "1px solid #e2e8f0",
                      background:
                        "#f8fafc",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize:
                            "15px",
                        }}
                      >
                        {roleName}
                      </h3>

                      <div
                        style={{
                          marginTop:
                            "4px",
                          fontSize:
                            "11px",
                          color:
                            "#64748b",
                        }}
                      >
                        System role
                      </div>
                    </div>

                    <span
                      style={{
                        padding:
                          "5px 9px",
                        borderRadius:
                          "999px",
                        background:
                          "#ecfdf5",
                        color:
                          "#15803d",
                        fontSize:
                          "11px",
                        fontWeight:
                          600,
                      }}
                    >
                      Fixed
                    </span>
                  </div>

                  <div
                    style={{
                      padding:
                        "16px 18px",
                    }}
                  >
                    <div
                      style={{
                        marginBottom:
                          "11px",
                        fontSize:
                          "12px",
                        fontWeight:
                          600,
                      }}
                    >
                      Permissions
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap: "8px",
                      }}
                    >
                      {permissions.map(
                        (
                          permission,
                          index
                        ) => (
                          <div
                            key={`${roleName}-${index}`}
                            style={{
                              display:
                                "flex",
                              gap:
                                "8px",
                              fontSize:
                                "12px",
                              color:
                                "#475569",
                            }}
                          >
                            <span>
                              ✓
                            </span>

                            <span>
                              {
                                permission
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    {apiRole && (
                      <div
                        style={{
                          marginTop:
                            "15px",
                          paddingTop:
                            "11px",
                          borderTop:
                            "1px solid #f1f5f9",
                          fontSize:
                            "11px",
                          color:
                            "#94a3b8",
                        }}
                      >
                        Role ID:{" "}
                        {apiRole._id}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "16px",
          padding: "13px 15px",
          border:
            "1px solid #e2e8f0",
          borderRadius: "8px",
          background: "#f8fafc",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        Roles and permissions are
        managed by SaleVitals. CRM
        users cannot create, delete,
        or modify system roles.
      </div>
    </div>
  );
}

export default function Settings({
  user,
}) {
  const isHealthcare =
    String(
      user?.speciality || ""
    )
      .trim()
      .toLowerCase() ===
    "healthcare";

  const [activeTab, setActiveTab] =
    useState(
      "Business Profile"
    );

  useEffect(() => {
    setActiveTab(
      "Business Profile"
    );

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get(
        "metaSelectPage"
      ) === "true" ||
      params.get("metaError") ||
      params.get("google")
    ) {
      setActiveTab(
        "Integrations"
      );
    }
  }, [isHealthcare]);

  const handleTabChange = (
    tab
  ) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Clinic Profile":
      case "Business Profile":
        return (
          <ClinicProfile
            user={user}
            isHealthcare={
              isHealthcare
            }
          />
        );

      case "Doctors":
        return (
          <ManagementContent
            memberType="doctor"
          />
        );

      case "Team":
        return (
          <ManagementContent
            memberType="team"
          />
        );

      case "Roles & Permissions":
        return (
          <RolesContent />
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
        return <Services />;

      case "WhatsApp":
        return (
          <PlaceholderContent
            title="WhatsApp"
          />
        );

      case "Integrations":
        return <MetaIntegrationPanel />;

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

      case "Plan & Billing":
        return (
          <PlaceholderContent
            title="Plan & Billing"
          />
        );

      default:
        return (
          <ClinicProfile
            user={user}
            isHealthcare={
              isHealthcare
            }
          />
        );
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1>Settings</h1>

        <p>
          Configure your profile,
          team, pipeline, billing
          and integrations.
        </p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          {getSettingsGroups(
            isHealthcare
          ).map((group) => (
            <div
              className="settings-group"
              key={group.label}
            >
              <div className="settings-group-label">
                {group.label}
              </div>

              <div className="settings-group-items">
                {group.items.map(
                  (item) => {
                    const isActive =
                      activeTab ===
                      item;

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
                          handleTabChange(
                            item
                          )
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
                  }
                )}
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