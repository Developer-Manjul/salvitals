import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "https://salevitals.com";

const LEAD_SOURCES = [
  "Google",
  "Instagram",
  "Website",
  "WhatsApp",
  "Referral",
  "Facebook",
  "Walk-in",
  "Campaign",
  "Manual",
  "Other",
];

const LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Converted",
  "Lost",
];

const DEFAULT_OWNERS = [
  "Karan",
  "Meera",
  "Sneha",
  "Divya",
  "Aditya",
  "Nisha",
  "Aarav",
  "Rhea",
];

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
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "L"
  );
}

function toTitle(value) {
  return String(value || "").trim();
}

function getSourceTone(source) {
  switch (source) {
    case "Google":
      return "source-google";
    case "Instagram":
      return "source-instagram";
    case "Website":
      return "source-website";
    case "WhatsApp":
      return "source-whatsapp";
    case "Referral":
      return "source-referral";
    case "Facebook":
      return "source-facebook";
    case "Walk-in":
      return "source-walkin";
    case "Campaign":
      return "source-campaign";
    default:
      return "source-default";
  }
}

function getStageTone(stage) {
  switch (stage) {
    case "New":
      return "stage-new";
    case "Contacted":
      return "stage-contacted";
    case "Qualified":
      return "stage-qualified";
    case "Proposal":
      return "stage-proposal";
    case "Converted":
      return "stage-converted";
    case "Lost":
      return "stage-lost";
    default:
      return "stage-default";
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getLeadOwner(lead, isHealthcare) {
  if (!lead) return "—";

  if (isHealthcare) {
    return lead.preferredDoctor || lead.owner || "—";
  }

  return lead.owner || "Unassigned";
}

function defaultLeadForm(user, isHealthcare) {
  const doctorName = user?.name || "";

  return {
    _id: "",
    name: "",
    email: "",
    phone: "",
    source: "Website",
    service: "",
    owner: DEFAULT_OWNERS[0],
    stage: "New",
    firstNote: "",
    preferredDoctor: isHealthcare ? doctorName : "",
    landingPage: "",
    pageUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    ipAddress: "",
  };
}

export default function Leads({ user }) {
  const isHealthcare =
    String(user?.speciality || "").trim().toLowerCase() === "healthcare";

  const [leads, setLeads] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [savingLead, setSavingLead] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState(null);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [ownerFilter, setOwnerFilter] = useState("All owners");
  const [serviceFilter, setServiceFilter] = useState("All services");

  const [activeView, setActiveView] = useState("list");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [actionMenuLeadId, setActionMenuLeadId] = useState(null);

  const [formData, setFormData] = useState(
    defaultLeadForm(user, isHealthcare)
  );

  const loadLeads = async () => {
    const token = getToken();

    if (!token) {
      setLeads([]);
      setLoadingLeads(false);
      return;
    }

    setLoadingLeads(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load leads");
      }

      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (error) {
      console.error("LOAD LEADS ERROR:", error);
      alert(error.message || "Unable to load leads");
      setLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadServices = async () => {
    const token = getToken();

    if (!token) {
      setAvailableServices([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load services");
      }

      const services = Array.isArray(data.services)
        ? data.services
            .map((service) =>
              typeof service === "string"
                ? service
                : service?.name || ""
            )
            .map((service) => String(service).trim())
            .filter(Boolean)
        : [];

      setAvailableServices(services);
    } catch (error) {
      console.error("LOAD SERVICES ERROR:", error);
      setAvailableServices([]);
    }
  };

  useEffect(() => {
    loadLeads();
    loadServices();
  }, []);

  const ownerOptions = useMemo(() => {
    const owners = new Set(DEFAULT_OWNERS);

    leads.forEach((lead) => {
      if (lead.owner) {
        owners.add(lead.owner);
      }

      if (lead.preferredDoctor) {
        owners.add(lead.preferredDoctor);
      }
    });

    return [...owners];
  }, [leads]);

  useEffect(() => {
    if (showAddModal) {
      setFormData((previous) => ({
        ...defaultLeadForm(user, isHealthcare),
        ...previous,
        service: previous.service || availableServices[0] || "",
        owner: previous.owner || DEFAULT_OWNERS[0],
      }));
    }
  }, [
    user,
    isHealthcare,
    availableServices,
    showAddModal,
  ]);

  const summary = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((lead) => lead.stage === "New").length,
      contacted: leads.filter((lead) => lead.stage === "Contacted").length,
      qualified: leads.filter((lead) => lead.stage === "Qualified").length,
      converted: leads.filter((lead) => lead.stage === "Converted").length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          lead.name,
          lead.phone,
          lead.email,
          lead.service,
          lead.owner,
          lead.preferredDoctor,
          lead.source,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesSource =
        sourceFilter === "All sources" ||
        lead.source === sourceFilter;

      const matchesStage =
        stageFilter === "All stages" ||
        lead.stage === stageFilter;

      const matchesOwner =
        ownerFilter === "All owners" ||
        lead.owner === ownerFilter ||
        lead.preferredDoctor === ownerFilter;

      const matchesService =
        serviceFilter === "All services" ||
        lead.service === serviceFilter;

      return (
        matchesSearch &&
        matchesSource &&
        matchesStage &&
        matchesOwner &&
        matchesService
      );
    });
  }, [
    leads,
    search,
    sourceFilter,
    stageFilter,
    ownerFilter,
    serviceFilter,
  ]);

  const openAddLeadModal = () => {
    setEditingLeadId(null);

    setFormData({
      ...defaultLeadForm(user, isHealthcare),
      service: availableServices[0] || "",
      owner: DEFAULT_OWNERS[0],
    });

    setShowAddModal(true);
  };

  const openEditLeadModal = (lead) => {
    setEditingLeadId(lead._id);

    setFormData({
      _id: lead._id || "",
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "Manual",
      service: lead.service || availableServices[0] || "",
      owner: lead.owner || DEFAULT_OWNERS[0],
      stage: lead.stage || "New",
      firstNote: lead.firstNote || "",
      preferredDoctor:
        lead.preferredDoctor ||
        (isHealthcare ? user?.name || "" : ""),
      landingPage: lead.landingPage || "",
      pageUrl: lead.pageUrl || "",
      utmSource: lead.utmSource || "",
      utmMedium: lead.utmMedium || "",
      utmCampaign: lead.utmCampaign || "",
      utmTerm: lead.utmTerm || "",
      utmContent: lead.utmContent || "",
      ipAddress: lead.ipAddress || "",
    });

    setShowAddModal(true);
    setActionMenuLeadId(null);
  };

  const closeAddLeadModal = () => {
    setShowAddModal(false);
    setEditingLeadId(null);

    setFormData(
      defaultLeadForm(user, isHealthcare)
    );
  };

  const handleFormChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmitLead = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      alert("Authentication required. Please sign in again.");
      return;
    }

    const trimmedName = toTitle(formData.name);
    const trimmedPhone = toTitle(formData.phone);

    if (!trimmedName) {
      alert("Lead name is required");
      return;
    }

    if (!trimmedPhone) {
      alert("Phone number is required");
      return;
    }

    const payload = {
      name: trimmedName,
      email: toTitle(formData.email),
      phone: trimmedPhone,
      source: toTitle(formData.source) || "Manual",
      service: toTitle(formData.service),
      owner: isHealthcare
        ? toTitle(formData.owner)
        : toTitle(formData.owner),
      stage: toTitle(formData.stage) || "New",
      preferredDoctor: isHealthcare
        ? toTitle(formData.preferredDoctor)
        : "",
      landingPage: toTitle(formData.landingPage),
      pageUrl: toTitle(formData.pageUrl),
      utmSource: toTitle(formData.utmSource),
      utmMedium: toTitle(formData.utmMedium),
      utmCampaign: toTitle(formData.utmCampaign),
      utmTerm: toTitle(formData.utmTerm),
      utmContent: toTitle(formData.utmContent),
      ipAddress: toTitle(formData.ipAddress),
      firstNote: toTitle(formData.firstNote),
    };

    setSavingLead(true);

    try {
      const isEditing = Boolean(editingLeadId);

      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/leads/${editingLeadId}`
          : `${API_BASE_URL}/api/leads`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Unable to update lead"
              : "Unable to create lead")
        );
      }

      if (isEditing) {
        setLeads((previous) =>
          previous.map((lead) =>
            lead._id === editingLeadId
              ? data.lead
              : lead
          )
        );

        if (
          selectedLead &&
          selectedLead._id === editingLeadId
        ) {
          setSelectedLead(data.lead);
        }
      } else {
        setLeads((previous) => [
          data.lead,
          ...previous,
        ]);
      }

      closeAddLeadModal();
    } catch (error) {
      console.error("SAVE LEAD ERROR:", error);
      alert(
        error.message ||
          "Unable to save lead"
      );
    } finally {
      setSavingLead(false);
    }
  };

  const handleDeleteLead = async (leadId) => {
    const token = getToken();

    if (!token) {
      alert("Authentication required. Please sign in again.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingLeadId(leadId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/leads/${leadId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete lead"
        );
      }

      setLeads((previous) =>
        previous.filter(
          (lead) => lead._id !== leadId
        )
      );

      if (
        selectedLead &&
        selectedLead._id === leadId
      ) {
        setSelectedLead(null);
        setShowDetailsModal(false);
      }

      setActionMenuLeadId(null);
    } catch (error) {
      console.error("DELETE LEAD ERROR:", error);
      alert(
        error.message ||
          "Unable to delete lead"
      );
    } finally {
      setDeletingLeadId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSourceFilter("All sources");
    setStageFilter("All stages");
    setOwnerFilter("All owners");
    setServiceFilter("All services");
  };

  const openLeadDetails = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
    setActionMenuLeadId(null);
  };

  const summaryCards = [
    {
      label: "Total Leads",
      value: summary.total,
    },
    {
      label: "New",
      value: summary.new,
    },
    {
      label: "Contacted",
      value: summary.contacted,
    },
    {
      label: "Qualified",
      value: summary.qualified,
    },
    {
      label: "Converted",
      value: summary.converted,
    },
  ];

  return (
    <div className="leads-page">
      <header className="leads-page-header">
        <div>
          <p className="dash-breadcrumb">
            Acquire
          </p>

          <h1>Leads</h1>

          <p className="lead-subtitle">
            Manage enquiries, track lead sources and follow up with every opportunity.
          </p>
        </div>

        <div className="lead-header-actions">
          <button
            type="button"
            className="dash-btn"
          >
            Import
          </button>

          <button
            type="button"
            className="dash-btn"
          >
            Export
          </button>

          <button
            type="button"
            className="dash-btn primary"
            onClick={openAddLeadModal}
          >
            + Add lead
          </button>
        </div>
      </header>

      <div className="leads-summary">
        {summaryCards.map((item) => (
          <div
            className="lead-summary-card"
            key={item.label}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="lead-filter-panel">
        <div className="lead-filter-search">
          <span className="lead-search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, phone, email..."
          />
        </div>

        <div className="lead-filter-group">
          <select
            value={stageFilter}
            onChange={(event) =>
              setStageFilter(event.target.value)
            }
          >
            <option value="All stages">
              Stage
            </option>

            {LEAD_STAGES.map((stage) => (
              <option
                value={stage}
                key={stage}
              >
                {stage}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(event.target.value)
            }
          >
            <option value="All sources">
              Lead Source
            </option>

            {LEAD_SOURCES.map((source) => (
              <option
                value={source}
                key={source}
              >
                {source}
              </option>
            ))}
          </select>

          <select
            value={ownerFilter}
            onChange={(event) =>
              setOwnerFilter(event.target.value)
            }
          >
            <option value="All owners">
              Owner
            </option>

            {ownerOptions.map((owner) => (
              <option
                value={owner}
                key={owner}
              >
                {owner}
              </option>
            ))}
          </select>

          <select
            value={serviceFilter}
            onChange={(event) =>
              setServiceFilter(event.target.value)
            }
          >
            <option value="All services">
              Service
            </option>

            {availableServices.map((service) => (
              <option
                value={service}
                key={service}
              >
                {service}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="lead-more-filter"
            onClick={() =>
              setShowAdvancedFilters(
                (value) => !value
              )
            }
          >
            More filters
          </button>
        </div>

        <div className="lead-toolbar-actions">
          <button
            type="button"
            className="lead-refresh-btn"
            onClick={loadLeads}
            disabled={loadingLeads}
          >
            {loadingLeads
              ? "Loading..."
              : "Refresh"}
          </button>

          <div className="lead-view-toggle">
            {[
              ["list", "List"],
              ["kanban", "Kanban"],
              ["grid", "Grid"],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                className={
                  activeView === view
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveView(view)
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="lead-extra-filters">
          <button
            type="button"
            className="lead-clear-btn"
            onClick={resetFilters}
          >
            Clear all
          </button>
        </div>
      )}

      {activeView === "list" && (
        <div className="lead-table-wrap">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Phone</th>
                <th>Source</th>
                <th>Service</th>
                <th>Owner</th>
                <th>Stage</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loadingLeads ? (
                <tr>
                  <td
                    colSpan="8"
                    className="lead-empty-state"
                  >
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="lead-empty-state"
                  >
                    No leads match your current filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <div className="lead-name-cell">
                        <span className="lead-avatar">
                          {getInitials(
                            lead.name
                          )}
                        </span>

                        <span>
                          <strong>
                            {lead.name}
                          </strong>

                          <small>
                            {lead.email ||
                              "No email"}
                          </small>
                        </span>
                      </div>
                    </td>

                    <td>
                      {lead.phone || "—"}
                    </td>

                    <td>
                      <span
                        className={`lead-source-badge ${getSourceTone(
                          lead.source
                        )}`}
                      >
                        {lead.source ||
                          "Other"}
                      </span>
                    </td>

                    <td>
                      {lead.service || "—"}
                    </td>

                    <td>
                      {getLeadOwner(
                        lead,
                        isHealthcare
                      )}
                    </td>

                    <td>
                      <span
                        className={`lead-stage-pill ${getStageTone(
                          lead.stage
                        )}`}
                      >
                        {lead.stage || "New"}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        lead.createdAt
                      )}
                    </td>

                    <td>
                      <div className="lead-action-wrap">
                        <button
                          type="button"
                          className="lead-action-btn"
                          onClick={() =>
                            setActionMenuLeadId(
                              (current) =>
                                current ===
                                lead._id
                                  ? null
                                  : lead._id
                            )
                          }
                        >
                          •••
                        </button>

                        {actionMenuLeadId ===
                          lead._id && (
                          <div className="lead-action-menu">
                            <button
                              type="button"
                              onClick={() =>
                                openLeadDetails(
                                  lead
                                )
                              }
                            >
                              View full details
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditLeadModal(
                                  lead
                                )
                              }
                            >
                              Edit lead
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                handleDeleteLead(
                                  lead._id
                                )
                              }
                              disabled={
                                deletingLeadId ===
                                lead._id
                              }
                            >
                              {deletingLeadId ===
                              lead._id
                                ? "Deleting..."
                                : "Delete lead"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeView === "kanban" && (
        <div className="lead-kanban-board">
          {LEAD_STAGES.map((stage) => {
            const items =
              filteredLeads.filter(
                (lead) =>
                  lead.stage === stage
              );

            return (
              <div
                className="lead-kanban-column"
                key={stage}
              >
                <div className="lead-kanban-header">
                  <span>{stage}</span>
                  <strong>
                    {items.length}
                  </strong>
                </div>

                {items.length === 0 ? (
                  <div className="lead-kanban-empty">
                    No leads
                  </div>
                ) : (
                  items.map((lead) => (
                    <div
                      className="lead-kanban-card"
                      key={lead._id}
                    >
                      <div className="lead-kanban-card-top">
                        <strong>
                          {lead.name}
                        </strong>

                        <span
                          className={`lead-stage-pill ${getStageTone(
                            lead.stage
                          )}`}
                        >
                          {lead.stage}
                        </span>
                      </div>

                      <p>
                        {lead.service ||
                          "No service"}
                      </p>

                      <small>
                        {getLeadOwner(
                          lead,
                          isHealthcare
                        )}
                      </small>

                      <button
                        type="button"
                        onClick={() =>
                          openLeadDetails(
                            lead
                          )
                        }
                      >
                        View details
                      </button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeView === "grid" && (
        <div className="lead-grid">
          {loadingLeads ? (
            <div className="lead-empty-state-grid">
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="lead-empty-state-grid">
              No leads match your current filters.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                className="lead-grid-card"
                key={lead._id}
              >
                <div className="lead-grid-card-head">
                  <span className="lead-avatar">
                    {getInitials(
                      lead.name
                    )}
                  </span>

                  <div>
                    <strong>
                      {lead.name}
                    </strong>

                    <small>
                      {lead.service ||
                        "No service"}
                    </small>
                  </div>
                </div>

                <div className="lead-grid-meta">
                  <span>
                    {lead.phone || "—"}
                  </span>

                  <span>
                    {getLeadOwner(
                      lead,
                      isHealthcare
                    )}
                  </span>
                </div>

                <div className="lead-grid-footer">
                  <span
                    className={`lead-source-badge ${getSourceTone(
                      lead.source
                    )}`}
                  >
                    {lead.source ||
                      "Other"}
                  </span>

                  <span
                    className={`lead-stage-pill ${getStageTone(
                      lead.stage
                    )}`}
                  >
                    {lead.stage || "New"}
                  </span>
                </div>

                <div className="lead-grid-actions">
                  <button
                    type="button"
                    onClick={() =>
                      openLeadDetails(
                        lead
                      )
                    }
                  >
                    View details
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEditLeadModal(
                        lead
                      )
                    }
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showAddModal && (
        <div
          className="lead-modal-backdrop"
          onClick={closeAddLeadModal}
        >
          <div
            className="lead-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="lead-modal-head">
              <div>
                <h3>
                  {editingLeadId
                    ? "Edit lead"
                    : "Add lead"}
                </h3>

                <p>
                  Capture an enquiry that came in by phone, website, social media or in person.
                </p>
              </div>

              <button
                type="button"
                className="lead-close-btn"
                onClick={closeAddLeadModal}
              >
                ×
              </button>
            </div>

            <form
              className="lead-form"
              onSubmit={handleSubmitLead}
            >
              <div className="lead-form-grid">
                <label>
                  Full name <em>*</em>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      handleFormChange(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Full name"
                    required
                  />
                </label>

                <label>
                  Phone number <em>*</em>

                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      handleFormChange(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="+91 98..."
                    required
                  />
                </label>

                <label>
                  Email

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      handleFormChange(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="name@example.com"
                  />
                </label>

                <label>
                  Lead source

                  <select
                    value={formData.source}
                    onChange={(event) =>
                      handleFormChange(
                        "source",
                        event.target.value
                      )
                    }
                  >
                    {LEAD_SOURCES.map(
                      (source) => (
                        <option
                          value={source}
                          key={source}
                        >
                          {source}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Interested service

                  <select
                    value={formData.service}
                    onChange={(event) =>
                      handleFormChange(
                        "service",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select service
                    </option>

                    {availableServices.map(
                      (service) => (
                        <option
                          value={service}
                          key={service}
                        >
                          {service}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {isHealthcare ? (
                  <label>
                    Preferred doctor

                    <select
                      value={
                        formData.preferredDoctor
                      }
                      onChange={(event) =>
                        handleFormChange(
                          "preferredDoctor",
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Select doctor
                      </option>

                      {ownerOptions.map(
                        (doctor) => (
                          <option
                            value={doctor}
                            key={doctor}
                          >
                            {doctor}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                ) : (
                  <label>
                    Owner

                    <select
                      value={formData.owner}
                      onChange={(event) =>
                        handleFormChange(
                          "owner",
                          event.target.value
                        )
                      }
                    >
                      {ownerOptions.map(
                        (owner) => (
                          <option
                            value={owner}
                            key={owner}
                          >
                            {owner}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}

                <label className="lead-form-full">
                  First note

                  <textarea
                    rows="4"
                    value={formData.firstNote}
                    onChange={(event) =>
                      handleFormChange(
                        "firstNote",
                        event.target.value
                      )
                    }
                    placeholder="Any important notes about the enquiry..."
                  />
                </label>
              </div>

              <div className="lead-form-actions">
                <button
                  type="button"
                  className="lead-secondary-btn"
                  onClick={
                    closeAddLeadModal
                  }
                  disabled={savingLead}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="dash-btn primary"
                  disabled={savingLead}
                >
                  {savingLead
                    ? "Saving..."
                    : editingLeadId
                    ? "Save changes"
                    : "Add lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal &&
        selectedLead && (
          <div
            className="lead-modal-backdrop"
            onClick={() =>
              setShowDetailsModal(false)
            }
          >
            <div
              className="lead-details-panel"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="lead-details-head">
                <div>
                  <p className="dash-breadcrumb">
                    Lead details
                  </p>

                  <h3>
                    {selectedLead.name}
                  </h3>
                </div>

                <button
                  type="button"
                  className="lead-close-btn"
                  onClick={() =>
                    setShowDetailsModal(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div className="lead-detail-summary">
                <div>
                  <span>Name</span>
                  <strong>
                    {selectedLead.name ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {selectedLead.email ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {selectedLead.phone ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Lead Source</span>
                  <strong>
                    {selectedLead.source ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Service</span>
                  <strong>
                    {selectedLead.service ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Owner</span>
                  <strong>
                    {getLeadOwner(
                      selectedLead,
                      isHealthcare
                    )}
                  </strong>
                </div>
              </div>

              <div className="lead-details-grid">
                <div>
                  <span>Date</span>
                  <strong>
                    {formatDate(
                      selectedLead.createdAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>Landing Page</span>
                  <strong>
                    {selectedLead.landingPage ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Page URL</span>
                  <strong>
                    {selectedLead.pageUrl ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>UTM Source</span>
                  <strong>
                    {selectedLead.utmSource ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>UTM Medium</span>
                  <strong>
                    {selectedLead.utmMedium ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>UTM Campaign</span>
                  <strong>
                    {selectedLead.utmCampaign ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>UTM Term</span>
                  <strong>
                    {selectedLead.utmTerm ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>UTM Content</span>
                  <strong>
                    {selectedLead.utmContent ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>IP Address</span>
                  <strong>
                    {selectedLead.ipAddress ||
                      "—"}
                  </strong>
                </div>
              </div>

              <div className="lead-note-card">
                <span>First note</span>

                <p>
                  {selectedLead.firstNote ||
                    "No note added yet."}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}