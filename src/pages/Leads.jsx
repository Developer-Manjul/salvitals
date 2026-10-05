import { useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl } from "../config/api";

function readStoredList(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getConfiguredSourceNames() {
  const saved = readStoredList("salevitals_lead_sources", []);
  const names = saved
    .map((item) => typeof item === "string" ? item : item?.name)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return names;
}

function getConfiguredStageNames() {
  const saved = readStoredList("salevitals_lead_stages", []);
  const names = saved
    .map((item) => typeof item === "string" ? item : item?.name)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return names;
}

const DEFAULT_OWNERS = [

];

function getToken() {
  return (
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("vitalsToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    ""
  );
}

function decodeHtmlEntities(value = "") {
  const text = String(value || "");

  if (!text || typeof document === "undefined") {
    return text;
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  } catch {
    return text;
  }
}

function normalizeLeadName(value = "") {
  let text = String(value || "");

  try {
    text = text.normalize("NFKC");
  } catch {
    text = String(value || "");
  }

  text = decodeHtmlEntities(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, " ")
    .replace(/[^\p{L}\p{M}\p{N} .'-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text || "Unknown";
}

function getDisplayName(value = "") {
  return normalizeLeadName(value);
}

function getLeadName(lead) {
  if (!lead) return "Unknown";

  return getDisplayName(
    lead.name ||
    lead.visitorName ||
    lead.visitor?.name ||
    lead.contactName ||
    ""
  );
}

function getLeadPhone(lead) {
  if (!lead) return "";

  return String(
    lead.phone ||
    lead.visitorPhone ||
    lead.visitor?.phone ||
    lead.contactPhone ||
    ""
  ).trim();
}

function normalizeSource(value = "", configuredSources = []) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const source = raw
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const names = Array.isArray(configuredSources)
    ? configuredSources
      .map((item) => String(item || "").trim())
      .filter(Boolean)
    : [];

  if (
    source === "google ad" ||
    source === "google ads" ||
    source === "google"
  ) {
    return "Google Ad";
  }

  const exactMatch = names.find(
    (item) => item.toLowerCase() === raw.toLowerCase()
  );

  if (exactMatch) return exactMatch;

  const aliases = [
    { match: ["google", "google ads", "google lead", "google leads"], includes: "google", name: ["google ads", "google"] },
    { match: ["instagram", "ig", "instagram ads", "instagram lead"], includes: "instagram", name: ["meta ads", "instagram"] },
    { match: ["facebook", "fb", "meta", "facebook ads", "facebook lead"], includes: "facebook", name: ["meta ads", "facebook"] },
    { match: ["whatsapp", "whats app"], includes: "whatsapp", name: ["whatsapp"] },
    { match: ["website", "website form", "web site", "web"], includes: "website", name: ["website"] },
    { match: ["walk in", "walkin", "walk-in"], includes: "walk", name: ["walk"] },
    { match: ["referral"], includes: "referral", name: ["referral"] },
    { match: ["campaign"], includes: "campaign", name: ["campaign"] },
    { match: ["manual", "manual entry"], includes: "manual", name: ["manual"] },
  ];

  for (const alias of aliases) {
    const isMatch = alias.match.includes(source) || source.includes(alias.includes);
    if (!isMatch) continue;

    const configuredMatch = names.find((item) => {
      const normalizedName = item.toLowerCase();
      return alias.name.some((part) => normalizedName.includes(part));
    });

    if (configuredMatch) return configuredMatch;
  }

  return raw;
}

function getLeadSource(lead, configuredSources = []) {
  if (!lead) return "";

  const candidates = [
    lead.metaPlatform,
    lead.platform,
    lead.leadPlatform,
    lead.metaSource,
    lead.sourceDetails,
    lead.metaSourceDetails,
    lead.adSource,
    lead.utmSource,
    lead.source,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeSource(candidate, configuredSources);
    if (normalized) return normalized;
  }

  return "";
}

function getInitials(name = "") {
  const displayName = getDisplayName(name);

  return (
    displayName
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "L"
  );
}

function getSourceTone(source) {
  const value = String(source || "").toLowerCase();

  if (value.includes("google")) return "source-google";
  if (value.includes("instagram")) return "source-instagram";
  if (value.includes("facebook") || value.includes("meta ads")) return "source-facebook";
  if (value.includes("whatsapp")) return "source-whatsapp";
  if (value.includes("website") || value.includes("web")) return "source-website";
  if (value.includes("referral")) return "source-referral";
  if (value.includes("walk")) return "source-walkin";
  if (value.includes("campaign")) return "source-campaign";

  return "source-default";
}

function getStageTone(stage) {
  const value = String(stage || "").toLowerCase();

  if (value === "new") return "stage-new";
  if (value.includes("contact")) return "stage-contacted";
  if (value.includes("convert")) return "stage-converted";
  if (value.includes("lost") || value.includes("junk") || value.includes("not answered")) return "stage-lost";
  if (value.includes("qualif") || value.includes("relevant") || value.includes("opd")) return "stage-qualified";
  if (value.includes("pending") || value.includes("follow") || value.includes("proposal")) return "stage-proposal";

  return "stage-default";
}

function getLeadCategory(stage = "") {
  const value = String(stage || "").trim().toLowerCase().replace(/[\s_-]+/g, " ");

  if (value === "new") return "new";
  if (value.includes("convert")) return "converted";
  if (value === "lost" || value === "junk" || value.includes("not answered") || value.includes("not answer")) return "junk";
  if (value.includes("pending") || value.includes("follow up") || value.includes("follow-up")) return "pending";
  if (value.includes("relevant") || value.includes("contact") || value.includes("qualif") || value.includes("proposal") || value.includes("in progress")) return "relevant";

  return "other";
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

function getLeadOwner(lead, isHealthcare, user) {
  if (!lead) return "—";

  return (
    lead.owner ||
    user?.name ||
    "Unassigned"
  );
}

function defaultLeadForm(user, isHealthcare) {
  return {
    _id: "",
    name: "",
    email: "",
    phone: "",
    source: "",
    service: "",
    owner: user?.name || "",
    stage: "New",
    firstNote: "",
    preferredDoctor: isHealthcare
      ? user?.name || ""
      : "",
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

export default function Leads({
  user,
  onOpenLeadDetails,
}) {
  const isHealthcare =
    String(user?.speciality || "")
      .trim()
      .toLowerCase() === "healthcare";

  const [leads, setLeads] = useState([]);
  const readLeadIdsRef = useRef(new Set());
  const unreadLeadIdsRef = useRef(new Set());
  const [unreadLeadIds, setUnreadLeadIds] = useState(new Set());
  const [availableServices, setAvailableServices] =
    useState([]);

  const [leadSources, setLeadSources] = useState([]);

  const [leadStages, setLeadStages] = useState([]);

  const [leadSettingsLoading, setLeadSettingsLoading] = useState(true);

  const [leadSettingsError, setLeadSettingsError] = useState("");

  const [loadingLeads, setLoadingLeads] =
    useState(true);

  const [savingLead, setSavingLead] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [sourceFilter, setSourceFilter] =
    useState("All sources");

  const [stageFilter, setStageFilter] =
    useState("All stages");

  const [enquiryFilter, setEnquiryFilter] =
    useState("all");

  const [ownerFilter, setOwnerFilter] =
    useState("All owners");

  const [serviceFilter, setServiceFilter] =
    useState("All services");

  const LEADS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);

  const [activeView, setActiveView] =
    useState("list");

  const [showAdvancedFilters, setShowAdvancedFilters] =
    useState(false);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [selectedLead, setSelectedLead] =
    useState(null);

  const [editingLeadId, setEditingLeadId] =
    useState(null);

  const [actionMenuLeadId, setActionMenuLeadId] =
    useState(null);

  const [savingStageId, setSavingStageId] =
    useState(null);

  const [formData, setFormData] =
    useState(
      defaultLeadForm(
        user,
        isHealthcare
      )
    );

  const getLeadReadStorageKey = () => {
    let currentUser = null;

    try {
      currentUser = JSON.parse(
        sessionStorage.getItem("user") ||
        sessionStorage.getItem("vitalsUser") ||
        localStorage.getItem("user") ||
        "null"
      );
    } catch {
      currentUser = null;
    }

    const userId =
      currentUser?._id ||
      currentUser?.id ||
      currentUser?.email ||
      user?._id ||
      user?.id ||
      user?.email ||
      "current";

    return `saleVitalsReadLeadIds_v6_${String(userId).trim()}`;
  };

  const loadReadLeadIds = () => {
    const storageKey = getLeadReadStorageKey();
    let ids = [];

    try {
      ids = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );
    } catch {
      ids = [];
    }

    if (!Array.isArray(ids)) {
      ids = [];
    }

    readLeadIdsRef.current = new Set(
      ids.map((id) => String(id))
    );
  };

  const saveReadLeadIds = () => {
    localStorage.setItem(
      getLeadReadStorageKey(),
      JSON.stringify([...readLeadIdsRef.current])
    );
  };

  const isNewLead = (lead) =>
    String(lead?.stage || "New").trim().toLowerCase() === "new";

  const loadLeads = async () => {
    const token = getToken();

    if (!token) {
      setLeads([]);
      setLoadingLeads(false);
      return;
    }

    setLoadingLeads(true);

    try {
      const response = await fetch(
        buildApiUrl("/api/leads"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load leads"
        );
      }

      const nextLeads = Array.isArray(data.leads)
        ? data.leads
        : [];

      loadReadLeadIds();

      const currentLeadIds = new Set(
        nextLeads
          .map((lead) => String(lead?._id || ""))
          .filter(Boolean)
      );

      readLeadIdsRef.current = new Set(
        [...readLeadIdsRef.current].filter((id) =>
          currentLeadIds.has(String(id))
        )
      );

      const unreadIds = new Set(
        nextLeads
          .filter(
            (lead) =>
              isNewLead(lead) &&
              !readLeadIdsRef.current.has(
                String(lead?._id || "")
              )
          )
          .map((lead) => String(lead._id))
          .filter(Boolean)
      );

      unreadLeadIdsRef.current = unreadIds;
      setUnreadLeadIds(new Set(unreadIds));

      saveReadLeadIds();
      setLeads(nextLeads);
    } catch (error) {
      console.error(
        "LOAD LEADS ERROR:",
        error
      );

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
      const response = await fetch(
        buildApiUrl("/api/services"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load services"
        );
      }

      const services =
        Array.isArray(data.services)
          ? data.services
            .map((service) =>
              typeof service === "string"
                ? service
                : service?.name || ""
            )
            .map((service) =>
              String(service).trim()
            )
            .filter(Boolean)
          : [];

      setAvailableServices(services);
    } catch (error) {
      console.error(
        "LOAD SERVICES ERROR:",
        error
      );

      setAvailableServices([]);
    }
  };

  const loadLeadSettings = async () => {
    try {
      setLeadSettingsLoading(true);
      setLeadSettingsError("");

      const headers = {
        Authorization: `Bearer ${getToken()}`,
      };

      const [sourceResponse, stageResponse] = await Promise.all([
        fetch(buildApiUrl("/api/lead-settings/sources"), {
          headers,
          cache: "no-store",
        }),
        fetch(buildApiUrl("/api/lead-settings/stages"), {
          headers,
          cache: "no-store",
        }),
      ]);

      const sourceData = await sourceResponse.json();
      const stageData = await stageResponse.json();

      if (!sourceResponse.ok || !sourceData.success) {
        throw new Error(sourceData.message || "Unable to load lead sources.");
      }

      if (!stageResponse.ok || !stageData.success) {
        throw new Error(stageData.message || "Unable to load lead stages.");
      }

      const sources = (sourceData.sources || [])
        .filter((item) => !item?.isSystem)
        .map((item) => String(item?.name || item || "").trim())
        .filter(Boolean);

      const stages = (stageData.stages || [])
        .filter((item) => !item?.isSystem)
        .map((item) => String(item?.name || item || "").trim())
        .filter(Boolean);

      setLeadSources([...new Set(sources)]);
      setLeadStages([...new Set(stages)]);
    } catch (error) {
      console.error("LOAD LEAD SETTINGS ERROR:", error);
      setLeadSources([]);
      setLeadStages([]);
      setLeadSettingsError(error.message || "Unable to load lead settings.");
    } finally {
      setLeadSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadLeadSettings();

    const handleSettingsChanged = () => {
      loadLeadSettings();
    };

    window.addEventListener("lead-settings-updated", handleSettingsChanged);
    window.addEventListener("storage", handleSettingsChanged);

    return () => {
      window.removeEventListener("lead-settings-updated", handleSettingsChanged);
      window.removeEventListener("storage", handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    if (showAddModal) {
      loadServices();
    }
  }, [showAddModal]);

  const configuredSourceOptions = useMemo(() => {
    return [...new Set(
      leadSources
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )];
  }, [leadSources]);

  const configuredStageOptions = useMemo(() => {
    const values = ["New", ...leadStages];

    leads.forEach((lead) => {
      const stage = String(lead?.stage || "").trim();
      if (stage && !values.some((item) => item.toLowerCase() === stage.toLowerCase())) {
        values.push(stage);
      }
    });

    return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
  }, [leadStages, leads]);

  const ownerOptions = useMemo(() => {
    const owners = new Set(
      DEFAULT_OWNERS
    );

    if (user?.name) {
      owners.add(user.name);
    }

    leads.forEach((lead) => {
      if (lead.owner) {
        owners.add(lead.owner);
      }

      if (lead.preferredDoctor) {
        owners.add(
          lead.preferredDoctor
        );
      }
    });

    return [...owners]
      .map((item) =>
        String(item).trim()
      )
      .filter(Boolean);
  }, [leads, user]);

  useEffect(() => {
    if (!showAddModal) return;

    setFormData((previous) => ({
      ...defaultLeadForm(
        user,
        isHealthcare
      ),
      ...previous,
      service:
        previous.service ||
        availableServices[0] ||
        "",
      owner:
        previous.owner ||
        user?.name ||
        "",
      source:
        previous.source ||
        configuredSourceOptions[0] ||
        "",
      stage: previous.stage || "New",
    }));
  }, [
    user,
    isHealthcare,
    availableServices,
    configuredSourceOptions,
    showAddModal,
  ]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch =
      search
        .trim()
        .toLowerCase();

    return leads.filter((lead) => {
      const displayName =
        getLeadName(lead);

      const displaySource =
        getLeadSource(lead, configuredSourceOptions);

      const searchText = [
        displayName,
        getLeadPhone(lead),
        lead.email,
        lead.service,
        lead.owner,
        lead.preferredDoctor,
        displaySource,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchText.includes(
          normalizedSearch
        );

      const matchesSource =
        sourceFilter ===
        "All sources" ||
        displaySource ===
        sourceFilter;

      const matchesStage =
        stageFilter ===
        "All stages" ||
        lead.stage ===
        stageFilter;

      const leadCategory = getLeadCategory(lead?.stage);
      const matchesEnquiry =
        enquiryFilter === "all" ||
        leadCategory === enquiryFilter;

      const matchesOwner =
        ownerFilter ===
        "All owners" ||
        lead.owner ===
        ownerFilter ||
        lead.preferredDoctor ===
        ownerFilter;

      const matchesService =
        serviceFilter ===
        "All services" ||
        lead.service ===
        serviceFilter;

      return (
        matchesSearch &&
        matchesSource &&
        matchesStage &&
        matchesEnquiry &&
        matchesOwner &&
        matchesService
      );
    });
  }, [
    leads,
    search,
    sourceFilter,
    stageFilter,
    enquiryFilter,
    ownerFilter,
    serviceFilter,
    configuredSourceOptions,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sourceFilter, stageFilter, enquiryFilter, ownerFilter, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(start, start + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const paginationStart = filteredLeads.length === 0 ? 0 : (currentPage - 1) * LEADS_PER_PAGE + 1;
  const paginationEnd = Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    for (let page = start; page <= end; page += 1) pages.push(page);
    return pages;
  }, [currentPage, totalPages]);

  const openAddLeadModal = () => {
    setEditingLeadId(null);

    setFormData({
      ...defaultLeadForm(
        user,
        isHealthcare
      ),
      service:
        availableServices[0] || "",
      owner:
        user?.name || "",
      source: configuredSourceOptions[0] || "",
      stage: "New",
    });

    setShowAddModal(true);
  };

  const openEditLeadModal = (
    lead
  ) => {
    setEditingLeadId(
      lead._id
    );

    setFormData({
      _id:
        lead._id || "",

      name:
        getLeadName(lead),

      email:
        lead.email || "",

      phone:
        getLeadPhone(lead) || "",

      source:
        getLeadSource(lead, configuredSourceOptions),

      service:
        lead.service ||
        availableServices[0] ||
        "",

      owner:
        lead.owner ||
        user?.name ||
        "",

      stage:
        lead.stage ||
        "New",

      firstNote:
        lead.firstNote ||
        "",

      preferredDoctor:
        lead.preferredDoctor ||
        (
          isHealthcare
            ? user?.name || ""
            : ""
        ),

      landingPage:
        lead.landingPage ||
        "",

      pageUrl:
        lead.pageUrl ||
        "",

      utmSource:
        lead.utmSource ||
        "",

      utmMedium:
        lead.utmMedium ||
        "",

      utmCampaign:
        lead.utmCampaign ||
        "",

      utmTerm:
        lead.utmTerm ||
        "",

      utmContent:
        lead.utmContent ||
        "",

      ipAddress:
        lead.ipAddress ||
        "",
    });

    setShowAddModal(true);
    setActionMenuLeadId(null);
  };

  const closeAddLeadModal = () => {
    setShowAddModal(false);
    setEditingLeadId(null);

    setFormData(
      defaultLeadForm(
        user,
        isHealthcare
      )
    );
  };

  const handleFormChange = (
    field,
    value
  ) => {
    setFormData(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  const handleSubmitLead =
    async (event) => {
      event.preventDefault();

      const token =
        getToken();

      if (!token) {
        alert(
          "Authentication required. Please sign in again."
        );
        return;
      }

      const trimmedName =
        normalizeLeadName(
          formData.name
        );

      const trimmedPhone =
        String(
          formData.phone || ""
        ).trim();

      if (
        !trimmedName ||
        trimmedName ===
        "Unknown"
      ) {
        alert(
          "Lead name is required"
        );
        return;
      }

      if (!trimmedPhone) {
        alert(
          "Phone number is required"
        );
        return;
      }

      const payload = {
        name: trimmedName,

        email:
          String(
            formData.email ||
            ""
          ).trim(),

        phone:
          trimmedPhone,

        source:
          normalizeSource(
            formData.source,
            configuredSourceOptions
          ),

        service:
          String(
            formData.service ||
            ""
          ).trim(),

        owner:
          String(
            formData.owner ||
            ""
          ).trim(),

        stage:
          String(
            formData.stage ||
            "New"
          ).trim(),

        preferredDoctor:
          isHealthcare
            ? String(
              formData.preferredDoctor ||
              ""
            ).trim()
            : "",

        landingPage:
          String(
            formData.landingPage ||
            ""
          ).trim(),

        pageUrl:
          String(
            formData.pageUrl ||
            ""
          ).trim(),

        utmSource:
          String(
            formData.utmSource ||
            ""
          ).trim(),

        utmMedium:
          String(
            formData.utmMedium ||
            ""
          ).trim(),

        utmCampaign:
          String(
            formData.utmCampaign ||
            ""
          ).trim(),

        utmTerm:
          String(
            formData.utmTerm ||
            ""
          ).trim(),

        utmContent:
          String(
            formData.utmContent ||
            ""
          ).trim(),

        ipAddress:
          String(
            formData.ipAddress ||
            ""
          ).trim(),

      };

      setSavingLead(true);

      try {
        const isEditing =
          Boolean(
            editingLeadId
          );

        const response =
          await fetch(
            isEditing
              ? buildApiUrl(
                `/api/leads/${editingLeadId}`
              )
              : buildApiUrl(
                "/api/leads"
              ),
            {
              method:
                isEditing
                  ? "PUT"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            (
              isEditing
                ? "Unable to update lead"
                : "Unable to create lead"
            )
          );
        }

        if (isEditing) {
          setLeads(
            (previous) =>
              previous.map(
                (lead) =>
                  lead._id ===
                    editingLeadId
                    ? data.lead
                    : lead
              )
          );

          if (
            selectedLead &&
            selectedLead._id ===
            editingLeadId
          ) {
            setSelectedLead(
              data.lead
            );
          }
        } else {
          const newLeadId = String(data.lead?._id || "");

          if (newLeadId) {
            readLeadIdsRef.current.add(newLeadId);
            unreadLeadIdsRef.current.delete(newLeadId);
            saveReadLeadIds();
            setUnreadLeadIds(
              new Set(unreadLeadIdsRef.current)
            );
          }

          setLeads(
            (previous) => [
              data.lead,
              ...previous,
            ]
          );
        }

        closeAddLeadModal();
      } catch (error) {
        console.error(
          "SAVE LEAD ERROR:",
          error
        );

        alert(
          error.message ||
          "Unable to save lead"
        );
      } finally {
        setSavingLead(
          false
        );
      }
    };

  const handleDeleteLead =
    async (leadId) => {
      const token =
        getToken();

      if (!token) {
        alert(
          "Authentication required. Please sign in again."
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this lead?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            buildApiUrl(
              `/api/leads/${leadId}`
            ),
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Unable to delete lead"
          );
        }

        setLeads(
          (previous) =>
            previous.filter(
              (lead) =>
                lead._id !==
                leadId
            )
        );

        if (
          selectedLead &&
          selectedLead._id ===
          leadId
        ) {
          setSelectedLead(
            null
          );

          setShowDetailsModal(
            false
          );
        }

        setActionMenuLeadId(
          null
        );
      } catch (error) {
        console.error(
          "DELETE LEAD ERROR:",
          error
        );

        alert(
          error.message ||
          "Unable to delete lead"
        );
      }
    };

  const handleStageChange =
    async (
      lead,
      stage
    ) => {
      const token =
        getToken();

      if (
        !token ||
        !stage ||
        stage ===
        lead.stage
      ) {
        return;
      }

      setSavingStageId(
        lead._id
      );

      try {
        const response =
          await fetch(
            buildApiUrl(
              `/api/leads/${lead._id}`
            ),
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  name:
                    getLeadName(lead),

                  email:
                    lead.email ||
                    "",

                  phone:
                    getLeadPhone(lead) ||
                    "",

                  source:
                    getLeadSource(lead, configuredSourceOptions),

                  service:
                    lead.service ||
                    "",

                  owner:
                    lead.owner ||
                    user?.name ||
                    "",

                  stage,

                  preferredDoctor:
                    lead.preferredDoctor ||
                    "",

                  landingPage:
                    lead.landingPage ||
                    "",

                  pageUrl:
                    lead.pageUrl ||
                    "",

                  utmSource:
                    lead.utmSource ||
                    "",

                  utmMedium:
                    lead.utmMedium ||
                    "",

                  utmCampaign:
                    lead.utmCampaign ||
                    "",

                  utmTerm:
                    lead.utmTerm ||
                    "",

                  utmContent:
                    lead.utmContent ||
                    "",

                  ipAddress:
                    lead.ipAddress ||
                    "",

                  firstNote:
                    lead.firstNote ||
                    "",
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Unable to update stage"
          );
        }

        setLeads(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                  lead._id
                  ? data.lead
                  : item
            )
        );
      } catch (error) {
        console.error(
          "UPDATE LEAD STAGE ERROR:",
          error
        );

        alert(
          error.message ||
          "Unable to update stage"
        );
      } finally {
        setSavingStageId(
          null
        );
      }
    };

  const resetFilters = () => {
    setSearch("");
    setSourceFilter(
      "All sources"
    );
    setStageFilter(
      "All stages"
    );
    setEnquiryFilter(
      "all"
    );
    setOwnerFilter(
      "All owners"
    );
    setServiceFilter(
      "All services"
    );
  };

  const openLeadDetails =
    (lead) => {
      const leadId = String(lead?._id || "");

      if (leadId) {
        readLeadIdsRef.current.add(leadId);
        unreadLeadIdsRef.current.delete(leadId);
        saveReadLeadIds();

        setUnreadLeadIds(
          new Set(unreadLeadIdsRef.current)
        );
      }

      if (
        onOpenLeadDetails
      ) {
        onOpenLeadDetails(
          lead._id
        );
        return;
      }

      setSelectedLead(
        lead
      );

      setShowDetailsModal(
        true
      );

      setActionMenuLeadId(
        null
      );
    };

  const convertToContact =
    async (lead) => {
      try {
        const response =
          await fetch(
            buildApiUrl(
              `/api/contacts/from-lead/${lead._id}`
            ),
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${getToken()}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Unable to convert lead to contact"
          );
        }

        setActionMenuLeadId(
          null
        );

        alert(
          "Lead converted to contact successfully."
        );
      } catch (error) {
        alert(
          error.message ||
          "Unable to convert lead to contact"
        );
      }
    };

  const countByCategory = (category) =>
    leads.reduce((count, lead) => count + (getLeadCategory(lead?.stage) === category ? 1 : 0), 0);

  const summaryCards = [
    { key: "all", label: "Total Leads", value: leads.length },
    { key: "new", label: "New", value: countByCategory("new") },
    { key: "relevant", label: "Relevant", value: countByCategory("relevant") },
    { key: "converted", label: "Converted", value: countByCategory("converted") },
    { key: "junk", label: "Junk", value: countByCategory("junk") },
  ];

  const enquiryTabs = [
    ["all", "All Enquiries", leads.length],
    ["pending", "Pending", countByCategory("pending")],
    ["relevant", "In Progress", countByCategory("relevant")],
    ["converted", "Converted", countByCategory("converted")],
    ["junk", "Lost", countByCategory("junk")],
  ];

  return (
    <div className="leads-page">

      <header className="leads-page-header">

        <div>
          <p className="dash-breadcrumb">
            Acquire
          </p>

          <h1>
            Leads
          </h1>

          <p className="lead-subtitle">
            Manage enquiries, track lead sources and follow up with every opportunity.
          </p>
        </div>

        <div className="lead-header-actions">

          <button
            type="button"
            className="dash-btn"
          >
            Export
          </button>

          <button
            type="button"
            className="dash-btn primary"
            onClick={
              openAddLeadModal
            }
          >
            + Add lead
          </button>

        </div>

      </header>

      <div
        className="lead-enquiry-tabs"
        role="tablist"
        aria-label="Enquiry status"
      >

        {enquiryTabs.map(
          ([
            value,
            label,
            count,
          ]) => (
            <button
              type="button"
              role="tab"
              aria-selected={
                enquiryFilter ===
                value
              }
              className={
                enquiryFilter ===
                  value
                  ? "active"
                  : ""
              }
              key={value}
              onClick={() => {
                setEnquiryFilter(value);
                setStageFilter("All stages");
              }}
            >
              {label}

              <span>
                {count}
              </span>
            </button>
          )
        )}

      </div>

      <div className="leads-summary">
        {summaryCards.map((item) => (
          <button
            type="button"
            className={`lead-summary-card ${enquiryFilter === item.key ? "active" : ""
              }`}
            key={item.key}
            onClick={() => {
              setEnquiryFilter(item.key);
              setStageFilter("All stages");
            }}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
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
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search name, phone, email..."
          />

        </div>

        <div className="lead-filter-group">

          <select
            value={
              stageFilter
            }
            onChange={(
              event
            ) =>
              setStageFilter(
                event.target
                  .value
              )
            }
          >
            <option value="All stages">
              Stage
            </option>

            {configuredStageOptions.map(
              (stage) => (
                <option
                  value={stage}
                  key={stage}
                >
                  {stage}
                </option>
              )
            )}
          </select>

          <select
            value={
              sourceFilter
            }
            onChange={(
              event
            ) =>
              setSourceFilter(
                event.target
                  .value
              )
            }
          >
            <option value="All sources">
              Lead Source
            </option>

            {configuredSourceOptions.map(
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

          {}

          {}

          <button
            type="button"
            className="lead-more-filter"
            onClick={() =>
              setShowAdvancedFilters(
                (value) =>
                  !value
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
            onClick={
              loadLeads
            }
            disabled={
              loadingLeads
            }
          >
            {loadingLeads
              ? "Loading..."
              : "Refresh"}
          </button>

          <div className="lead-view-toggle">

            {[
              [
                "list",
                "List",
              ],
              [
                "kanban",
                "Kanban",
              ],
              [
                "grid",
                "Grid",
              ],
            ].map(
              ([
                view,
                label,
              ]) => (
                <button
                  key={view}
                  type="button"
                  className={
                    activeView ===
                      view
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveView(
                      view
                    )
                  }
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>

      </div>

      {showAdvancedFilters && (
        <div className="lead-extra-filters">

          <button
            type="button"
            className="lead-clear-btn"
            onClick={
              resetFilters
            }
          >
            Clear all
          </button>

        </div>
      )}

      {activeView ===
        "list" && (
          <div className="lead-table-wrap">

            <table className="lead-table">

              <thead>
                <tr>
                  <th>
                    Lead
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Source
                  </th>

                  <th>
                    Service
                  </th>

                  <th>
                    Owner
                  </th>

                  <th>
                    Stage
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Action
                  </th>
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
                ) : filteredLeads.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="lead-empty-state"
                    >
                      No leads match your current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map(
                    (lead) => {
                      const displayName =
                        getLeadName(lead);

                      const displaySource =
                        getLeadSource(lead, configuredSourceOptions);

                      return (
                        <tr
                          key={
                            lead._id
                          }
                          className={`lead-clickable-row ${unreadLeadIds.has(String(lead._id))
                            ? "lead-new-row"
                            : ""
                            }`}
                          style={
                            unreadLeadIds.has(String(lead._id))
                              ? {
                                fontWeight: 700,
                                background: "#f4f7ff",
                                boxShadow: "inset 4px 0 0 #2563eb",
                              }
                              : undefined
                          }
                          onClick={() =>
                            openLeadDetails(
                              lead
                            )
                          }
                        >

                          <td>

                            <div
                              className="lead-name-cell"
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                openLeadDetails(lead)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openLeadDetails(lead);
                                }
                              }}
                            >

                              <span className="lead-avatar">
                                {getInitials(
                                  displayName
                                )}
                              </span>

                              <span>

                                <strong>
                                  {
                                    displayName
                                  }
                                </strong>

                                <small>
                                  {lead.email ||
                                    "No email"}
                                </small>

                              </span>

                            </div>

                          </td>

                          <td>
                            {getLeadPhone(lead) ||
                              "—"}
                          </td>

                          <td>

                            <span
                              className={`lead-source-badge ${getSourceTone(
                                displaySource
                              )}`}
                            >
                              {
                                displaySource
                              }
                            </span>

                          </td>

                          <td>
                            {lead.service ||
                              "—"}
                          </td>

                          <td>
                            {getLeadOwner(
                              lead,
                              isHealthcare,
                              user
                            )}
                          </td>

                          <td>

                            <select
                              className={`lead-stage-select ${getStageTone(
                                lead.stage
                              )}`}
                              value={
                                lead.stage ||
                                "New"
                              }
                              disabled={
                                savingStageId ===
                                lead._id
                              }
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                              onChange={(
                                event
                              ) =>
                                handleStageChange(
                                  lead,
                                  event
                                    .target
                                    .value
                                )
                              }
                            >

                              {configuredStageOptions.map((stage) => (
                                <option value={stage} key={stage}>
                                  {stage === "Lost" ? "Mark as lost" : stage}
                                </option>
                              ))}

                            </select>

                          </td>

                          <td>
                            {formatDate(
                              lead.createdAt
                            )}
                          </td>

                          <td>

                            <div
                              className="lead-action-wrap"
                              onClick={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >

                              <button
                                type="button"
                                className="lead-action-btn"
                                onClick={() =>
                                  setActionMenuLeadId(
                                    (
                                      current
                                    ) =>
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
                                    {}

                                  </div>
                                )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

            {filteredLeads.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 16px", borderTop: "1px solid #e7edf5", background: "#fff", flexWrap: "wrap" }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                  Showing {paginationStart}-{paginationEnd} of {filteredLeads.length} leads
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ minWidth: 34, height: 34, border: "1px solid #dbe4ef", borderRadius: 8, background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#a0aec0" : "#334155", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 600 }}>«</button>
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} style={{ minWidth: 34, height: 34, border: "1px solid #dbe4ef", borderRadius: 8, background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#a0aec0" : "#334155", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 600 }}>‹</button>
                  {pageNumbers.map((page) => (
                    <button key={page} type="button" onClick={() => setCurrentPage(page)} style={{ minWidth: 34, height: 34, padding: "0 9px", border: page === currentPage ? "1px solid #2563eb" : "1px solid #dbe4ef", borderRadius: 8, background: page === currentPage ? "#2563eb" : "#fff", color: page === currentPage ? "#fff" : "#334155", cursor: "pointer", fontWeight: 700 }}>
                      {page}
                    </button>
                  ))}
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} style={{ minWidth: 34, height: 34, border: "1px solid #dbe4ef", borderRadius: 8, background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#a0aec0" : "#334155", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: 600 }}>›</button>
                  <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ minWidth: 34, height: 34, border: "1px solid #dbe4ef", borderRadius: 8, background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#a0aec0" : "#334155", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: 600 }}>»</button>
                </div>
              </div>
            )}

          </div>
        )}

      {activeView ===
        "kanban" && (
          <div className="lead-kanban-board">

            {leadStages.map(
              (stage) => {
                const items =
                  filteredLeads.filter(
                    (lead) =>
                      lead.stage ===
                      stage
                  );

                return (
                  <div
                    className="lead-kanban-column"
                    key={stage}
                  >

                    <div className="lead-kanban-header">

                      <span>
                        {stage}
                      </span>

                      <strong>
                        {items.length}
                      </strong>

                    </div>

                    {items.length ===
                      0 ? (
                      <div className="lead-kanban-empty">
                        No leads
                      </div>
                    ) : (
                      items.map(
                        (lead) => (
                          <div
                            className="lead-kanban-card"
                            key={
                              lead._id
                            }
                          >

                            <div className="lead-kanban-card-top">

                              <strong>
                                {getLeadName(lead)}
                              </strong>

                              <span
                                className={`lead-stage-pill ${getStageTone(
                                  lead.stage
                                )}`}
                              >
                                {
                                  lead.stage
                                }
                              </span>

                            </div>

                            <p>
                              {lead.service ||
                                "No service"}
                            </p>

                            <small>
                              {getLeadOwner(
                                lead,
                                isHealthcare,
                                user
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
                        )
                      )
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

      {activeView ===
        "grid" && (
          <div className="lead-grid">

            {loadingLeads ? (
              <div className="lead-empty-state-grid">
                Loading leads...
              </div>
            ) : filteredLeads.length ===
              0 ? (
              <div className="lead-empty-state-grid">
                No leads match your current filters.
              </div>
            ) : (
              paginatedLeads.map(
                (lead) => {
                  const displayName =
                    getLeadName(lead);

                  const displaySource =
                    getLeadSource(lead, configuredSourceOptions);

                  return (
                    <div
                      className="lead-grid-card"
                      key={
                        lead._id
                      }
                    >

                      <div className="lead-grid-card-head">

                        <span className="lead-avatar">
                          {getInitials(
                            displayName
                          )}
                        </span>

                        <div>

                          <strong>
                            {
                              displayName
                            }
                          </strong>

                          <small>
                            {lead.service ||
                              "No service"}
                          </small>

                        </div>

                      </div>

                      <div className="lead-grid-meta">

                        <span>
                          {getLeadPhone(lead) ||
                            "—"}
                        </span>

                        <span>
                          {getLeadOwner(
                            lead,
                            isHealthcare,
                            user
                          )}
                        </span>

                      </div>

                      <div className="lead-grid-footer">

                        <span
                          className={`lead-source-badge ${getSourceTone(
                            displaySource
                          )}`}
                        >
                          {
                            displaySource
                          }
                        </span>

                        <span
                          className={`lead-stage-pill ${getStageTone(
                            lead.stage
                          )}`}
                        >
                          {lead.stage ||
                            "New"}
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
                  );
                }
              )
            )}

          </div>
        )}

      {showAddModal && (
        <div
          className="lead-modal-backdrop"
          onClick={
            closeAddLeadModal
          }
        >

          <div
            className="lead-modal"
            onClick={(
              event
            ) =>
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
                onClick={
                  closeAddLeadModal
                }
              >
                ×
              </button>

            </div>

            <form
              className="lead-form"
              onSubmit={
                handleSubmitLead
              }
            >

              <div className="lead-form-grid">

                <label>
                  Full name <em>*</em>

                  <input
                    type="text"
                    value={
                      formData.name
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "name",
                        event.target
                          .value
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
                    value={
                      formData.phone
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "phone",
                        event.target
                          .value
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
                    value={
                      formData.email
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "email",
                        event.target
                          .value
                      )
                    }
                    placeholder="name@example.com"
                  />
                </label>

                <label>
                  Lead source

                  <select
                    value={
                      formData.source
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "source",
                        event.target
                          .value
                      )
                    }
                  >

                    {configuredSourceOptions.map(
                      (source) => (
                        <option
                          value={
                            source
                          }
                          key={
                            source
                          }
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
                    value={
                      formData.service
                    }
                    onChange={(
                      event
                    ) =>
                      handleFormChange(
                        "service",
                        event.target
                          .value
                      )
                    }
                  >

                    <option value="">
                      Select service
                    </option>

                    {availableServices.map(
                      (service) => (
                        <option
                          value={
                            service
                          }
                          key={
                            service
                          }
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
                      onChange={(
                        event
                      ) =>
                        handleFormChange(
                          "preferredDoctor",
                          event.target
                            .value
                        )
                      }
                    >

                      <option value="">
                        Select doctor
                      </option>

                      {ownerOptions.map(
                        (doctor) => (
                          <option
                            value={
                              doctor
                            }
                            key={
                              doctor
                            }
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
                      value={
                        formData.owner
                      }
                      onChange={(
                        event
                      ) =>
                        handleFormChange(
                          "owner",
                          event.target
                            .value
                        )
                      }
                    >

                      {ownerOptions.map(
                        (owner) => (
                          <option
                            value={
                              owner
                            }
                            key={
                              owner
                            }
                          >
                            {owner}
                          </option>
                        )
                      )}

                    </select>

                  </label>
                )}

              </div>

              <div className="lead-form-actions">

                <button
                  type="button"
                  className="lead-secondary-btn"
                  onClick={
                    closeAddLeadModal
                  }
                  disabled={
                    savingLead
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="dash-btn primary"
                  disabled={
                    savingLead
                  }
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
              setShowDetailsModal(
                false
              )
            }
          >

            <div
              className="lead-details-panel"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div className="lead-details-head">

                <div>

                  <p className="dash-breadcrumb">
                    Lead details
                  </p>

                  <h3>
                    {getLeadName(selectedLead)}
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
                  <span>
                    Name
                  </span>

                  <strong>
                    {getLeadName(selectedLead)}
                  </strong>
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {selectedLead.email ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {getLeadPhone(selectedLead) ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Lead Source
                  </span>

                  <strong>
                    {getLeadSource(selectedLead, configuredSourceOptions)}
                  </strong>
                </div>

                <div>
                  <span>
                    Service
                  </span>

                  <strong>
                    {selectedLead.service ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Owner
                  </span>

                  <strong>
                    {getLeadOwner(
                      selectedLead,
                      isHealthcare,
                      user
                    )}
                  </strong>
                </div>

              </div>

              <div className="lead-details-grid">

                <div>
                  <span>
                    Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedLead.createdAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Landing Page
                  </span>

                  <strong>
                    {selectedLead.landingPage ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Page URL
                  </span>

                  <strong>
                    {selectedLead.pageUrl ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    UTM Source
                  </span>

                  <strong>
                    {selectedLead.utmSource ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    UTM Medium
                  </span>

                  <strong>
                    {selectedLead.utmMedium ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    UTM Campaign
                  </span>

                  <strong>
                    {selectedLead.utmCampaign ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    UTM Term
                  </span>

                  <strong>
                    {selectedLead.utmTerm ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    UTM Content
                  </span>

                  <strong>
                    {selectedLead.utmContent ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    IP Address
                  </span>

                  <strong>
                    {selectedLead.ipAddress ||
                      "—"}
                  </strong>
                </div>

              </div>

              <div className="lead-note-card">

                <span>
                  First note
                </span>

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
