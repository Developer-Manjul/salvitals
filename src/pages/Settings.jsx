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
    "1 team member",
    "Lead & contact management",
    "Sales pipeline",
    "Follow-up management",
    "Website lead capture",
    "Basic reports",
    "5000 chatbot conversations per month",
    "1000 contact save",
  ],
  growth: [
    "3 team members",
    "Marketing automation",
    "Advanced lead management",
    "Team collaboration",
    "Social media & ad lead capture",
    "Advanced reports",
    "15,000 chatbot conversations per month",
    "2,500 contact save",
  ],
  scale: [
    "5 team members",
    "Advanced automation",
    "Custom workflows",
    "Advanced permissions",
    "Detailed analytics & reporting",
    "More powerful integrations",
    "40,000 chatbot conversations per month",
    "45,00 contact save",
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

const MODERN_SETTINGS_STYLES = `
.sv-settings-section{width:100%;box-sizing:border-box;padding:2px 0 30px;color:#172033}
.sv-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:22px}
.sv-section-head h2{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.025em;color:#172033}
.sv-section-head p{margin:7px 0 0;color:#74849c;font-size:13px;line-height:1.5}
.sv-primary-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:10px;background:#2878ed;color:#fff;padding:11px 17px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 6px 16px rgba(40,120,237,.18)}
.sv-primary-btn:hover{background:#1769dc}
.sv-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
.sv-summary-card{min-width:0;padding:17px;border:1px solid #dce6f2;border-radius:15px;background:#fff;box-shadow:0 7px 22px rgba(40,75,120,.045)}
.sv-summary-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.sv-summary-label{color:#71829b;font-size:11px;font-weight:700}
.sv-summary-icon{display:flex;align-items:center;justify-content:center;width:31px;height:31px;border-radius:9px;background:#edf5ff;color:#2878ed;font-size:14px;font-weight:800}
.sv-summary-value{display:block;margin-top:8px;color:#17233a;font-size:22px;font-weight:800;line-height:1}
.sv-summary-meta{display:block;margin-top:7px;color:#8a99ae;font-size:10px}
.sv-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px;border:1px solid #dce6f2;border-radius:13px;background:#fff}
.sv-search{flex:1;min-width:180px;height:38px;padding:0 13px;border:1px solid #dce6f2;border-radius:9px;outline:0;color:#25334b;background:#fbfdff;font-size:12px}
.sv-search:focus{border-color:#8db8f7;box-shadow:0 0 0 3px rgba(40,120,237,.08)}
.sv-filter{height:38px;padding:0 12px;border:1px solid #dce6f2;border-radius:9px;background:#fff;color:#52627a;font-size:12px;font-weight:700;outline:0}
.sv-source-table-wrap{overflow:auto;border:1px solid #dce6f2;border-radius:15px;background:#fff;box-shadow:0 7px 22px rgba(40,75,120,.045)}
.sv-source-table{width:100%;min-width:720px;border-collapse:collapse}
.sv-source-table th{padding:12px 14px;text-align:left;background:#f8fbff;border-bottom:1px solid #e6edf5;color:#8796aa;font-size:9px;letter-spacing:.08em;font-weight:800}
.sv-source-table td{padding:13px 14px;border-bottom:1px solid #edf2f7;color:#52627a;font-size:11px;vertical-align:middle}
.sv-source-table tr:last-child td{border-bottom:0}
.sv-source-name{display:flex;align-items:center;gap:10px;min-width:200px}
.sv-source-icon{display:flex;align-items:center;justify-content:center;flex:0 0 34px;width:34px;height:34px;border-radius:9px;background:#edf5ff;color:#2878ed;font-weight:800;font-size:14px}
.sv-source-icon.green{background:#e7f8ef;color:#15a566}.sv-source-icon.purple{background:#f0eaff;color:#7048e8}.sv-source-icon.orange{background:#fff3df;color:#e89219}.sv-source-icon.gray{background:#eef2f6;color:#6b7a90}
.sv-source-name strong{display:block;color:#29384f;font-size:11px}.sv-source-name small{display:block;margin-top:3px;color:#8a99ae;font-size:9px}
.sv-status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:9px;font-weight:800}.sv-status i{width:6px;height:6px;border-radius:50%;background:currentColor}.sv-status.active{background:#eaf9f0;color:#168447}.sv-status.available{background:#edf5ff;color:#2878ed}.sv-status.soon{background:#f2f4f7;color:#78869a}
.sv-source-count{color:#29384f;font-weight:800}.sv-source-muted{color:#a0adbc}
.sv-toggle{position:relative;width:38px;height:22px;border:0;border-radius:999px;background:#d9e2ee;cursor:pointer;transition:.2s}.sv-toggle.on{background:#2878ed}.sv-toggle:after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.16);transition:.2s}.sv-toggle.on:after{left:19px}.sv-toggle.soon{cursor:not-allowed;opacity:.7}
.sv-more{width:29px;height:29px;border:1px solid #dce6f2;border-radius:8px;background:#fff;color:#65758d;font-weight:800;cursor:pointer}.sv-more:hover{background:#f7faff}
.sv-stage-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.sv-stage-card{position:relative;min-height:170px;padding:18px;border:1px solid #dce6f2;border-radius:16px;background:#fff;box-shadow:0 7px 22px rgba(40,75,120,.045);overflow:hidden}.sv-stage-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#2878ed}.sv-stage-card.orange:before{background:#f59e0b}.sv-stage-card.green:before{background:#16a34a}.sv-stage-card.purple:before{background:#7c4de8}.sv-stage-card.red:before{background:#dc4d4d}.sv-stage-card.gray:before{background:#94a3b8}
.sv-stage-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.sv-stage-head h3{margin:0;color:#26354d;font-size:15px}.sv-stage-count{padding:5px 9px;border-radius:999px;background:#edf5ff;color:#2878ed;font-size:10px;font-weight:800}.sv-stage-card.orange .sv-stage-count{background:#fff3df;color:#d88413}.sv-stage-card.green .sv-stage-count{background:#e7f8ef;color:#15965b}.sv-stage-card.purple .sv-stage-count{background:#f0eaff;color:#7048e8}.sv-stage-card.red .sv-stage-count{background:#fff0f0;color:#d74b4b}.sv-stage-card.gray .sv-stage-count{background:#eef2f6;color:#68778c}
.sv-stage-desc{margin:13px 0 17px;color:#7788a0;font-size:11px;line-height:1.55}.sv-stage-bar{height:7px;overflow:hidden;border-radius:999px;background:#e9eff6}.sv-stage-bar i{display:block;height:100%;border-radius:inherit;background:#2878ed}.sv-stage-card.orange .sv-stage-bar i{background:#f59e0b}.sv-stage-card.green .sv-stage-bar i{background:#16a34a}.sv-stage-card.purple .sv-stage-bar i{background:#7c4de8}.sv-stage-card.red .sv-stage-bar i{background:#dc4d4d}.sv-stage-card.gray .sv-stage-bar i{background:#94a3b8}.sv-stage-foot{display:flex;justify-content:space-between;margin-top:9px;color:#8a99ae;font-size:10px}.sv-stage-foot strong{color:#53637b}
.sv-modal-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(17,31,52,.42);backdrop-filter:blur(4px)}.sv-modal{width:min(460px,100%);background:#fff;border:1px solid #dce6f2;border-radius:18px;box-shadow:0 25px 70px rgba(17,31,52,.2);overflow:hidden}.sv-modal-head{display:flex;align-items:center;justify-content:space-between;padding:19px 20px;border-bottom:1px solid #edf2f7}.sv-modal-head h3{margin:0;color:#17233a;font-size:17px}.sv-modal-close{width:32px;height:32px;border:1px solid #e1e8f0;border-radius:9px;background:#fff;color:#64748b;font-size:20px;cursor:pointer}.sv-modal-form{padding:20px}.sv-field{display:block;margin-bottom:14px;color:#53637b;font-size:11px;font-weight:800}.sv-field input,.sv-field textarea,.sv-field select{display:block;width:100%;box-sizing:border-box;margin-top:7px;border:1px solid #dce6f2;border-radius:10px;background:#fbfdff;padding:11px 12px;outline:0;color:#25334b;font-size:12px;font-weight:500}.sv-field textarea{min-height:88px;resize:vertical}.sv-field input:focus,.sv-field textarea:focus,.sv-field select:focus{border-color:#8db8f7;box-shadow:0 0 0 3px rgba(40,120,237,.08)}.sv-modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.sv-secondary-btn{border:1px solid #dce6f2;border-radius:10px;background:#fff;color:#52627a;padding:10px 15px;font-size:12px;font-weight:800;cursor:pointer}.sv-secondary-btn:hover{background:#f7faff}
.sv-coming{position:relative;min-height:520px;padding:36px;border:1px solid #dce6f2;border-radius:20px;background:radial-gradient(circle at 78% 38%,rgba(40,120,237,.08),transparent 28%),linear-gradient(145deg,#fff 0%,#f7fbff 100%);box-shadow:0 10px 30px rgba(40,75,120,.055);overflow:hidden}.sv-coming.whatsapp{background:radial-gradient(circle at 76% 42%,rgba(34,197,94,.11),transparent 27%),linear-gradient(145deg,#fff 0%,#f7fbff 100%)}
.sv-coming-layout{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;min-height:445px}.sv-coming-copy{max-width:540px}.sv-coming-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;background:#e9fbf1;color:#16a05a;font-size:10px;font-weight:900;letter-spacing:.02em}.sv-coming-badge.blue{background:#edf5ff;color:#2878ed}.sv-coming-copy h2{margin:17px 0 10px;color:#17233a;font-size:34px;line-height:1.12;letter-spacing:-.035em}.sv-coming-copy p{margin:0;color:#71839d;font-size:14px;line-height:1.7;max-width:520px}.sv-feature-list{display:grid;gap:11px;margin:22px 0 0;padding:0;list-style:none}.sv-feature-list li{display:flex;align-items:center;gap:10px;color:#33445e;font-size:12px;font-weight:600}.sv-feature-list li span{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#dcf8e8;color:#16a05a;font-size:12px;font-weight:900;flex:0 0 22px}.sv-coming-visual{position:relative;min-height:390px;display:flex;align-items:center;justify-content:center}.sv-orbit{position:absolute;width:285px;height:285px;border:1px dashed #cde1f7;border-radius:50%}.sv-coming.whatsapp .sv-orbit{border-color:#bfe9d1}.sv-center-icon{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;width:122px;height:122px;border-radius:34px;background:linear-gradient(145deg,#25d366,#16a05a);color:#fff;font-size:63px;box-shadow:0 22px 45px rgba(34,197,94,.25)}.sv-floating-card{position:absolute;z-index:3;display:flex;align-items:center;gap:9px;min-width:130px;padding:11px 13px;border:1px solid #dce6f2;border-radius:14px;background:rgba(255,255,255,.94);box-shadow:0 12px 28px rgba(40,75,120,.09)}.sv-floating-card strong{display:block;color:#263750;font-size:10px}.sv-floating-card small{display:block;margin-top:3px;color:#92a0b2;font-size:8px}.sv-floating-icon{display:flex;align-items:center;justify-content:center;width:31px;height:31px;border-radius:10px;background:#edf5ff;color:#2878ed;font-size:15px}.sv-floating-card.green .sv-floating-icon{background:#e7f8ef;color:#16a05a}.sv-floating-card.purple .sv-floating-icon{background:#f0eaff;color:#7048e8}.sv-float-1{top:7%;right:7%}.sv-float-2{top:34%;left:2%}.sv-float-3{right:0;bottom:23%}.sv-float-4{left:8%;bottom:10%}.sv-float-5{right:23%;bottom:0}.sv-coming-footer{margin-top:20px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:17px 19px;border:1px solid #dce9f7;border-radius:15px;background:#f3f8ff}.sv-coming.whatsapp .sv-coming-footer{background:#f1fbf5;border-color:#d5f1df}.sv-footer-title{display:flex;align-items:center;gap:12px}.sv-footer-icon{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:#e3efff;color:#2878ed;font-size:18px}.sv-coming.whatsapp .sv-footer-icon{background:#dcf8e8;color:#16a05a}.sv-footer-title strong{display:block;color:#263750;font-size:12px}.sv-footer-title span{display:block;margin-top:3px;color:#7a8ba2;font-size:10px}.sv-notify-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid #b9d7fb;border-radius:999px;background:#fff;color:#2878ed;padding:10px 16px;font-size:11px;font-weight:900;cursor:pointer}.sv-notify-btn:hover{background:#f7fbff}.sv-generic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}.sv-generic-card{padding:15px;border:1px solid #dce6f2;border-radius:14px;background:#fff}.sv-generic-card strong{display:block;color:#263750;font-size:11px}.sv-generic-card span{display:block;margin-top:5px;color:#8796aa;font-size:9px;line-height:1.5}
@media(max-width:1100px){.sv-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-stage-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-coming-layout{grid-template-columns:1fr}.sv-coming-visual{min-height:350px}.sv-coming-copy{max-width:none}.sv-float-2{left:8%}.sv-float-3{right:5%}}
@media(max-width:700px){.sv-section-head{flex-direction:column}.sv-summary-grid,.sv-stage-grid,.sv-generic-grid{grid-template-columns:1fr}.sv-toolbar{flex-wrap:wrap}.sv-search{flex-basis:100%}.sv-coming{padding:22px;min-height:0}.sv-coming-copy h2{font-size:28px}.sv-coming-layout{gap:15px;min-height:0}.sv-coming-visual{min-height:340px;transform:scale(.9)}.sv-coming-footer{align-items:flex-start;flex-direction:column}.sv-coming-footer .sv-notify-btn{width:100%;justify-content:center}.sv-settings-section{padding-bottom:20px}}
`;

function ModernSettingsStyles() {
  return <style>{MODERN_SETTINGS_STYLES}</style>;
}

const DEFAULT_LEAD_SOURCES = [
  { id: "meta", name: "Meta Ads (Facebook / Instagram)", description: "Leads from Facebook and Instagram Ads", icon: "◎", tone: "purple", defaultStatus: "active", locked: false },
  { id: "whatsapp", name: "WhatsApp", description: "Leads from WhatsApp conversations", icon: "◔", tone: "green", defaultStatus: "available", locked: false },
  { id: "website", name: "Website Form", description: "Leads from your website forms", icon: "◎", tone: "blue", defaultStatus: "available", locked: false },
  { id: "manual", name: "Manual Entry", description: "Leads added manually by your team", icon: "+", tone: "blue", defaultStatus: "active", locked: false },
  { id: "google", name: "Google Ads", description: "Leads from Google Ads", icon: "G", tone: "orange", defaultStatus: "soon", locked: true },
  { id: "import", name: "Import (CSV)", description: "Import leads from CSV files", icon: "↓", tone: "gray", defaultStatus: "available", locked: false },
  { id: "thirdparty", name: "Third-party Integration", description: "Connect tools such as Zapier and Pabbly", icon: "✦", tone: "purple", defaultStatus: "soon", locked: true },
  { id: "api", name: "API Integration", description: "Get leads via API", icon: "▦", tone: "blue", defaultStatus: "soon", locked: true },
];

const DEFAULT_LEAD_STAGES = [
  { id: "new", name: "New", description: "Fresh leads that have just entered your CRM.", tone: "blue" },
  { id: "pending-follow-up", name: "Pending follow-up", description: "Leads waiting for the next scheduled follow-up.", tone: "orange" },
  { id: "contacted", name: "Contacted", description: "Your team has contacted the lead.", tone: "purple" },
  { id: "qualified", name: "Qualified", description: "The lead matches your service or sales criteria.", tone: "green" },
  { id: "proposal", name: "Proposal", description: "A proposal or quotation has been shared.", tone: "blue" },
  { id: "converted", name: "Converted", description: "The lead has successfully converted.", tone: "green" },
  { id: "lost", name: "Lost", description: "The opportunity is no longer active.", tone: "red" },
];

function readStoredJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) || typeof parsed === "object" ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

function LeadSourceModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    setSaving(true);
    onSave({
      id: `custom-${slugify(cleanName)}-${Date.now()}`,
      name: cleanName,
      description: description.trim() || "Custom lead source",
      icon: cleanName.charAt(0).toUpperCase(),
      tone: "blue",
      defaultStatus: "active",
      locked: false,
      custom: true,
    });
    setSaving(false);
  };

  return (
    <div className="sv-modal-backdrop" onMouseDown={onClose}>
      <div className="sv-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sv-modal-head"><h3>Add Lead Source</h3><button type="button" className="sv-modal-close" onClick={onClose}>×</button></div>
        <form className="sv-modal-form" onSubmit={submit}>
          <label className="sv-field">Source name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Referral" autoFocus required /></label>
          <label className="sv-field">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" /></label>
          <div className="sv-modal-actions"><button type="button" className="sv-secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="sv-primary-btn" disabled={saving}>{saving ? "Adding..." : "Add Source"}</button></div>
        </form>
      </div>
    </div>
  );
}

function LeadStageModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("blue");

  const submit = (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onSave({
      id: `custom-${slugify(cleanName)}-${Date.now()}`,
      name: cleanName,
      description: description.trim() || "Custom CRM pipeline stage.",
      tone,
      custom: true,
    });
  };

  return (
    <div className="sv-modal-backdrop" onMouseDown={onClose}>
      <div className="sv-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sv-modal-head"><h3>Add Lead Stage</h3><button type="button" className="sv-modal-close" onClick={onClose}>×</button></div>
        <form className="sv-modal-form" onSubmit={submit}>
          <label className="sv-field">Stage name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Negotiation" autoFocus required /></label>
          <label className="sv-field">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What happens in this stage?" /></label>
          <label className="sv-field">Color<select value={tone} onChange={(event) => setTone(event.target.value)}><option value="blue">Blue</option><option value="orange">Orange</option><option value="purple">Purple</option><option value="green">Green</option><option value="red">Red</option><option value="gray">Gray</option></select></label>
          <div className="sv-modal-actions"><button type="button" className="sv-secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="sv-primary-btn">Add Stage</button></div>
        </form>
      </div>
    </div>
  );
}

function LeadSourcesContent() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [sources, setSources] = useState(() => {
    const saved = readStoredJson("salevitals_lead_sources", null);
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_LEAD_SOURCES;
  });
  const [enabled, setEnabled] = useState(() => {
    const saved = readStoredJson("salevitals_lead_source_status", {});
    const result = {};
    DEFAULT_LEAD_SOURCES.forEach((item) => { result[item.id] = item.defaultStatus === "active"; });
    Object.assign(result, saved && typeof saved === "object" ? saved : {});
    return result;
  });

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/leads`, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" });
        const data = await response.json();
        if (response.ok) setLeads(data.leads || data.data || []);
      } catch (_) { }
    };
    loadLeads();
  }, []);

  useEffect(() => {
    localStorage.setItem("salevitals_lead_sources", JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    localStorage.setItem("salevitals_lead_source_status", JSON.stringify(enabled));
  }, [enabled]);

  const normalizeSource = (source) => {
    const value = String(source || "").trim().toLowerCase();
    if (["facebook", "fb", "meta", "facbook", "instagram", "ig"].includes(value)) return "meta";
    if (["whatsapp", "whats app"].includes(value)) return "whatsapp";
    if (["website", "website form", "web"].includes(value)) return "website";
    if (["manual", "walk-in", "walkin"].includes(value)) return "manual";
    if (["google", "google ads"].includes(value)) return "google";
    return "other";
  };

  const filteredSources = sources.filter((item) => {
    const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase());
    const isOn = Boolean(enabled[item.id]);
    const status = item.locked ? "soon" : isOn ? "active" : "available";
    return matchesSearch && (filter === "all" || status === filter);
  });

  const sourceCount = (id) => leads.filter((lead) => normalizeSource(lead.source) === id).length;
  const totalLeads = leads.length;
  const activeSources = sources.filter((item) => !item.locked && enabled[item.id]).length;
  const thisMonth = leads.filter((lead) => {
    const date = new Date(lead.createdAt || lead.created_at || lead.date);
    const now = new Date();
    return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const addSource = (source) => {
    setSources((previous) => [...previous, source]);
    setEnabled((previous) => ({ ...previous, [source.id]: true }));
    setShowModal(false);
  };

  const toggleSource = (item) => {
    if (item.locked) return;
    setEnabled((previous) => ({ ...previous, [item.id]: !previous[item.id] }));
  };

  return (
    <div className="sv-settings-section">
      <ModernSettingsStyles />
      <div className="sv-section-head"><div><h2>Lead Sources</h2><p>Manage where your leads come from and monitor connected channels.</p></div><button type="button" className="sv-primary-btn" onClick={() => setShowModal(true)}>＋ Add Source</button></div>
      <div className="sv-summary-grid">
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">Total Leads</span><span className="sv-summary-icon">♧</span></div><strong className="sv-summary-value">{totalLeads.toLocaleString("en-IN")}</strong><small className="sv-summary-meta">From all sources</small></div>
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">Active Sources</span><span className="sv-summary-icon">↗</span></div><strong className="sv-summary-value">{activeSources}</strong><small className="sv-summary-meta">Currently enabled</small></div>
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">This Month</span><span className="sv-summary-icon">⌁</span></div><strong className="sv-summary-value">{thisMonth.toLocaleString("en-IN")}</strong><small className="sv-summary-meta">New leads</small></div>
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">Meta Leads</span><span className="sv-summary-icon">◎</span></div><strong className="sv-summary-value">{sourceCount("meta").toLocaleString("en-IN")}</strong><small className="sv-summary-meta">Facebook + Instagram</small></div>
      </div>
      <div className="sv-toolbar"><input className="sv-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lead sources..." /><select className="sv-filter" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All sources</option><option value="active">Active</option><option value="available">Available</option><option value="soon">Coming soon</option></select></div>
      <div className="sv-source-table-wrap"><table className="sv-source-table"><thead><tr><th>SOURCE</th><th>STATUS</th><th>LEADS</th><th>LAST SYNC</th><th>TOGGLE</th><th>ACTIONS</th></tr></thead><tbody>
        {filteredSources.length === 0 ? <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>No sources found.</td></tr> : filteredSources.map((item) => {
          const isOn = Boolean(enabled[item.id]);
          const status = item.locked ? "soon" : isOn ? "active" : "available";
          const label = item.locked ? "Coming soon" : isOn ? "Active" : "Available";
          return <tr key={item.id}>
            <td><div className="sv-source-name"><span className={`sv-source-icon ${item.tone}`}>{item.icon}</span><div><strong>{item.name}</strong><small>{item.description}</small></div></div></td>
            <td><span className={`sv-status ${status}`}><i />{label}</span></td>
            <td><span className="sv-source-count">{["meta", "whatsapp", "website", "manual"].includes(item.id) ? sourceCount(item.id).toLocaleString("en-IN") : "—"}</span></td>
            <td><span className="sv-source-muted">{item.id === "meta" ? "Connected" : isOn ? "Enabled" : "—"}</span></td>
            <td><button type="button" className={`sv-toggle ${isOn ? "on" : ""} ${item.locked ? "soon" : ""}`} onClick={() => toggleSource(item)} disabled={item.locked} aria-label={`${label} ${item.name}`} /></td>
            <td><button type="button" className="sv-more" onClick={() => window.alert(`${item.name} is ${label.toLowerCase()}.`)}>⋮</button></td>
          </tr>;
        })}
      </tbody></table></div>
      {showModal && <LeadSourceModal onClose={() => setShowModal(false)} onSave={addSource} />}
    </div>
  );
}

function LeadStagesContent() {
  const [leads, setLeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [stages, setStages] = useState(() => {
    const saved = readStoredJson("salevitals_lead_stages", null);
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_LEAD_STAGES;
  });

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/leads`, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" });
        const data = await response.json();
        if (response.ok) setLeads(data.leads || data.data || []);
      } catch (_) { }
    };
    loadLeads();
  }, []);

  useEffect(() => {
    localStorage.setItem("salevitals_lead_stages", JSON.stringify(stages));
  }, [stages]);

  const getCount = (stage) => leads.filter((lead) => String(lead.stage || "New").trim().toLowerCase() === stage.toLowerCase()).length;
  const total = leads.length;
  const addStage = (stage) => { setStages((previous) => [...previous, stage]); setShowModal(false); };

  return (
    <div className="sv-settings-section">
      <ModernSettingsStyles />
      <div className="sv-section-head"><div><h2>Lead Stages</h2><p>Track every lead through your CRM pipeline from new enquiry to conversion.</p></div><button type="button" className="sv-primary-btn" onClick={() => setShowModal(true)}>＋ Add Stage</button></div>
      <div className="sv-summary-grid">
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">Total Leads</span><span className="sv-summary-icon">♧</span></div><strong className="sv-summary-value">{total.toLocaleString("en-IN")}</strong><small className="sv-summary-meta">Current CRM leads</small></div>
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">New</span><span className="sv-summary-icon">＋</span></div><strong className="sv-summary-value">{getCount("New")}</strong><small className="sv-summary-meta">Fresh enquiries</small></div>
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">Qualified</span><span className="sv-summary-icon">✓</span></div><strong className="sv-summary-value">{getCount("Qualified")}</strong><small className="sv-summary-meta">Sales qualified</small></div>
        <div className="sv-summary-card"><div className="sv-summary-top"><span className="sv-summary-label">Converted</span><span className="sv-summary-icon">↗</span></div><strong className="sv-summary-value">{getCount("Converted")}</strong><small className="sv-summary-meta">Successfully converted</small></div>
      </div>
      <div className="sv-stage-grid">{stages.map((stage) => { const count = getCount(stage.name); const percent = total ? Math.min((count / total) * 100, 100) : 0; return <div className={`sv-stage-card ${stage.tone}`} key={stage.id || stage.name}><div className="sv-stage-head"><h3>{stage.name}</h3><span className="sv-stage-count">{count}</span></div><p className="sv-stage-desc">{stage.description}</p><div className="sv-stage-bar"><i style={{ width: `${percent}%` }} /></div><div className="sv-stage-foot"><span>Lead share</span><strong>{Math.round(percent)}%</strong></div></div>; })}</div>
      {showModal && <LeadStageModal onClose={() => setShowModal(false)} onSave={addStage} />}
    </div>
  );
}

function ComingSoonContent({ title, description, icon, whatsapp = false }) {
  const [notified, setNotified] = useState(false);
  const features = whatsapp ? ["Send & receive WhatsApp messages", "Auto-create leads from WhatsApp chats", "Manage conversations inside CRM", "Use templates and quick replies", "Track message history and engagement"] : ["Cleaner settings workflow", "Centralized controls", "Activity-ready notifications", "Designed for future SaleVitals updates"];
  const cards = whatsapp ? [["▣", "New Leads", "Auto capture"], ["♧", "Auto Create", "Leads"], ["➤", "Send Messages", "Quick replies"], ["◷", "Follow-ups", "Stay on track"], ["▥", "Track & Analyze", "Engagement"]] : [["✓", "Smart controls", "One place"], ["◷", "Activity", "Coming soon"], ["✦", "Automation", "Planned"]];
  return <div className="sv-settings-section"><ModernSettingsStyles /><div className="sv-section-head"><div><h2>{title}</h2><p>{description}</p></div></div><div className={`sv-coming ${whatsapp ? "whatsapp" : ""}`}><div className="sv-coming-layout"><div className="sv-coming-copy"><span className={`sv-coming-badge ${whatsapp ? "" : "blue"}`}>🚀 COMING SOON</span><h2>{whatsapp ? "WhatsApp Integration" : `${title} is coming soon`}</h2><p>{whatsapp ? "We are building a powerful WhatsApp integration to help you manage all your lead conversations, follow-ups and customer communication in one place." : "We are preparing this section with a cleaner workflow and more powerful controls. It will be available in a future SaleVitals update."}</p><ul className="sv-feature-list">{features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul></div><div className="sv-coming-visual"><div className="sv-orbit" /><div className="sv-center-icon">
    {whatsapp ? (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 3.2A12.7 12.7 0 0 0 5 22.2L3.2 28.8l6.8-1.8A12.8 12.8 0 1 0 16 3.2Zm0 22.2c-2 0-4-.6-5.6-1.8l-.4-.3-4 .1 1.1-3.8-.3-.4A9.5 9.5 0 1 1 16 25.4Zm5.2-7.1c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.5-.7-2.6-1.2-3.7-2.7-.3-.4.3-.4.8-1.4.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.8.8.3 1.4.5 1.9.7.8.3 1.5.2 2 .1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"
        />
      </svg>
    ) : (
      icon
    )}
  </div>{cards.map((card, index) => <div className={`sv-floating-card ${index % 3 === 1 ? "green" : index % 3 === 2 ? "purple" : ""} sv-float-${index + 1}`} key={card[1]}><span className="sv-floating-icon">{card[0]}</span><div><strong>{card[1]}</strong><small>{card[2]}</small></div></div>)}</div></div><div className="sv-coming-footer"><div className="sv-footer-title"><span className="sv-footer-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 21h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg><span className="sv-footer-dot"></span></span><div><strong>{notified ? "You're on the list" : "Stay Updated"}</strong><span>{notified ? "We’ll let you know when this feature is available." : `We’ll notify you as soon as ${title} is available.`}</span></div></div><button type="button" className="sv-notify-btn" onClick={() => setNotified(true)} disabled={notified}>{notified ? "✓ Notified" : "♢ Notify me"}</button></div></div><div className="sv-generic-grid">{cards.slice(0, 3).map((card) => <div className="sv-generic-card" key={`bottom-${card[1]}`}><strong>{card[1]}</strong><span>{card[2]} · Feature in development</span></div>)}</div></div>
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
        `${getApiBaseUrl()}/api/team-members${editingMember ? `/${editingMember._id}` : ""
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
            ? `Unable to update ${isDoctor ? "doctor" : "team member"
            }.`
            : `Unable to add ${isDoctor ? "doctor" : "team member"
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
  });

  const loadBilling = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${getApiBaseUrl()}/api/billing/current`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load billing information.");
      }

      setBilling(data);
    } catch (loadError) {
      setError(loadError.message || "Unable to load billing information.");
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

    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency === "INR" ? "INR" : "USD",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const startPlan = (plan) => {
    if (!plan?.id) return;

    const selectedPlan = {
      ...plan,
      planId: plan.id,
      planName: plan.name,
      billing: "monthly",
    };

    localStorage.setItem("selectedPlan", JSON.stringify(selectedPlan));
    window.location.href = `/cart?plan=${encodeURIComponent(plan.id)}`;
  };

  const startAddon = (addonType, quantity) => {
    const subscription = billing?.subscription;

    if (!subscription?.planId || subscription.status !== "active") {
      setError("Please activate a CRM plan before purchasing an add-on.");
      return;
    }

    const value = Math.max(1, Number(quantity || 1));

    localStorage.setItem(
      "selectedAddon",
      JSON.stringify({
        addonType,
        quantity: value,
      })
    );

    window.location.href = `/cart?addon=${encodeURIComponent(
      addonType
    )}&quantity=${value}`;
  };

  const updateQuantity = (addonType, value) => {
    setAddonQuantity((previous) => ({
      ...previous,
      [addonType]: Math.min(10, Math.max(1, value)),
    }));
  };

  const currentPlanId = billing?.subscription?.planId || "";
  const currentPlanName = billing?.subscription?.planName || "No active plan";
  const isActive =
    billing?.subscription?.status === "active" && Boolean(currentPlanId);

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
    (aiLimit === null ? null : Math.max(Number(aiLimit) - aiUsed, 0));
  const teamRemaining =
    teamUsage.remaining ?? Math.max(Number(teamLimit) - teamUsed, 0);

  const getPercentage = (used, limit, supplied) => {
    if (limit === null) return 0;
    const value = Number(
      supplied ?? (Number(limit) > 0 ? (used / Number(limit)) * 100 : 0)
    );
    return Math.min(100, Math.max(0, value));
  };

  const contactPercentage = getPercentage(
    contactUsed,
    contactLimit,
    contactUsage.percentage
  );
  const aiPercentage = getPercentage(aiUsed, aiLimit, aiUsage.percentage);
  const teamPercentage = getPercentage(teamUsed, teamLimit, null);

  const usageItems = [
    {
      id: "contacts",
      label: "Contacts",
      used: contactUsed,
      limit: contactLimit,
      remaining: contactRemaining,
      percentage: contactPercentage,
      icon: "▤",
      tone: "blue",
    },
    {
      id: "ai",
      label: "AI Chatbot",
      used: aiUsed,
      limit: aiLimit,
      remaining: aiRemaining,
      percentage: aiPercentage,
      icon: "✦",
      tone: "purple",
    },
    {
      id: "team",
      label: "Team Members",
      used: teamUsed,
      limit: teamLimit,
      remaining: teamRemaining,
      percentage: teamPercentage,
      icon: "♙",
      tone: "green",
    },
  ];

  const contactPercent = Math.round(contactPercentage);
  const aiPercent = Math.round(aiPercentage);
  const teamPercent = Math.round(teamPercentage);
  const donutRadius = 46;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutOffset = donutCircumference * (1 - contactPercentage / 100);

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
      tone: "blue",
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
      tone: "purple",
    },
  ];

  if (loading) {
    return (
      <div className="plan-billing-page">
        <div className="plan-billing-loading">Loading your plan and billing details...</div>
      </div>
    );
  }

  if (error && !billing) {
    return (
      <div className="plan-billing-page">
        <div className="plan-billing-error">
          <span>{error}</span>
          <button type="button" onClick={loadBilling}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-billing-page">
      <div className="plan-billing-header">
        <div>
          <h2>Plan &amp; Billing</h2>
          <p>Manage your subscription, usage and add-ons.</p>
        </div>
        {isActive && (
          <span className="plan-billing-active-badge"><i />Active subscription</span>
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

      {error && billing && <div className="plan-billing-inline-error">{error}</div>}

      {activeSection === "plan" && (
        <>
          <div className="plan-billing-current">
            <div className="plan-billing-current-top">
              <div>
                <span className="plan-billing-label">CURRENT PLAN</span>
                <h3>{currentPlanName}</h3>
                {isActive && <p>{formatCycle(billing?.subscription?.billingCycle)} plan</p>}
              </div>
              {isActive && <span className="plan-billing-status">Active</span>}
            </div>

            {isActive ? (
              <>
                <div className="plan-billing-stats">
                  <div><span>Billing period</span><strong>{formatCycle(billing?.subscription?.billingCycle)}</strong></div>
                  <div><span>Started</span><strong>{formatDate(billing?.subscription?.startedAt)}</strong></div>
                  <div><span>Expires</span><strong>{formatDate(billing?.subscription?.expiresAt)}</strong></div>
                  <div><span>Days remaining</span><strong>{billing?.subscription?.daysRemaining ?? "-"}</strong></div>
                </div>

                <div className="plan-billing-usage">
                  <div className="plan-billing-usage-head">
                    <div>
                      <span>Contact usage</span>
                      <strong>
                        {contactLimit === null
                          ? `${contactUsed} contacts`
                          : `${contactUsed.toLocaleString("en-IN")} of ${Number(contactLimit).toLocaleString("en-IN")} contacts`}
                      </strong>
                    </div>
                    <b>{contactPercent}%</b>
                  </div>
                  <div className="plan-billing-progress"><i style={{ width: `${contactPercentage}%` }} /></div>
                </div>
              </>
            ) : (
              <div className="plan-billing-no-plan">
                <p>No active plan is connected to this account. Choose a plan below to activate your CRM workspace.</p>
              </div>
            )}
          </div>

          <div className="plan-billing-plans">
            <div className="plan-billing-section-title">
              <div><h3>Available plans</h3><p>Choose a plan for your CRM workspace.</p></div>
            </div>
            <div className="plan-billing-grid">
              {visiblePlans.map((plan) => {
                const current = currentPlanId === plan.id;
                const price = getPlanPrice(plan, "INR");
                const features = PLAN_FEATURES[plan.id] || [];
                return (
                  <div className={current ? "plan-billing-card current" : "plan-billing-card"} key={plan.id}>
                    <div className="plan-billing-card-top">
                      <div>
                        <span className="plan-billing-label">{plan.name}</span>
                        <strong>{price !== null && price !== undefined ? `₹${Number(price).toLocaleString("en-IN")}` : "Custom"}</strong>
                        {price !== null && price !== undefined && <small>/month</small>}
                      </div>
                      {current && <span className="plan-billing-current-pill">Active</span>}
                    </div>
                    <div className="plan-billing-card-copy">{plan.description || `CRM plan with ${plan.contactSave || plan.contactLimit || "premium"} contact capacity.`}</div>
                    <ul>{features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
                    <button
                      type="button"
                      className={current ? "plan-billing-card-button active" : "plan-billing-card-button"}
                      disabled={current}
                      onClick={() => startPlan(plan)}
                    >
                      {current ? "Your current plan" : "Upgrade"}
                    </button>
                  </div>
                );
              })}

              <div className="plan-billing-card plan-billing-custom-card">
                <div className="plan-billing-card-top"><div><span className="plan-billing-label">Custom</span><strong>Custom</strong></div></div>
                <div className="plan-billing-card-copy">For larger organizations with advanced requirements, customization and dedicated support.</div>
                <ul>{PLAN_FEATURES.enterprise.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
                <a className="plan-billing-card-button plan-billing-custom-button" href={CUSTOM_WHATSAPP} target="_blank" rel="noreferrer">Talk to sales</a>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === "usage" && (
        <div className="billing-usage-modern">
          <div className="billing-usage-modern-heading">
            <div>
              <h3>Usage</h3>
              <p>Track your current usage against the limits included in your plan.</p>
            </div>
            <span className="billing-usage-plan-pill">{currentPlanName}</span>
          </div>

          <div className="billing-usage-modern-cards">
            {usageItems.map((item) => {
              const percent = Math.round(item.percentage);
              return (
                <div className={`billing-modern-stat ${item.tone}`} key={item.id}>
                  <div className="billing-modern-stat-top">
                    <div className="billing-modern-icon">{item.icon}</div>
                    <span>{percent}%</span>
                  </div>
                  <div className="billing-modern-stat-label">{item.label}</div>
                  <strong>{item.used.toLocaleString("en-IN")} / {item.limit === null ? "∞" : Number(item.limit || 0).toLocaleString("en-IN")}</strong>
                  <div className="billing-modern-track"><i style={{ width: `${item.percentage}%` }} /></div>
                  <div className="billing-modern-bottom"><span>Remaining</span><b>{item.remaining === null ? "Unlimited" : Number(item.remaining || 0).toLocaleString("en-IN")}</b></div>
                </div>
              );
            })}
          </div>

          <div className="billing-usage-main-grid">
            <div className="billing-plan-allowance-card">
              <div className="billing-usage-card-heading">
                <div><h3>Plan allowance</h3><p>Contacts</p></div>
                <span>{currentPlanName}</span>
              </div>

              <div className="billing-donut-layout">
                <div className="billing-donut">
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r={donutRadius} fill="none" stroke="#e8eef7" strokeWidth="11" />
                    <circle cx="60" cy="60" r={donutRadius} fill="none" stroke="#2878ed" strokeWidth="11" strokeLinecap="round" strokeDasharray={donutCircumference} strokeDashoffset={donutOffset} transform="rotate(-90 60 60)" />
                  </svg>
                  <div><strong>{contactPercent}%</strong><span>Used</span></div>
                </div>

                <div className="billing-donut-values">
                  <div><span><i className="blue" />Used</span><strong>{contactUsed.toLocaleString("en-IN")}</strong></div>
                  <div><span><i className="gray" />Remaining</span><strong>{contactRemaining === null ? "∞" : Number(contactRemaining).toLocaleString("en-IN")}</strong></div>
                  <div><span><i className="light" />Total</span><strong>{contactLimit === null ? "∞" : Number(contactLimit).toLocaleString("en-IN")}</strong></div>
                </div>
              </div>
            </div>
            <div className="billing-capacity-card">
              <div className="billing-capacity-illustration"><span>▥</span><b>+</b></div>
              <div><h3>Need more capacity?</h3><p>Upgrade your plan to get higher limits for contacts, chatbot conversations and team members.</p></div>
              <button type="button" onClick={() => setActiveSection("plan")}>View plans <span>→</span></button>
            </div>
          </div>


        </div>
      )}

      {activeSection === "addons" && (
        <div className="plan-billing-addons-page">
          <div className="plan-billing-section-title"><div><h3>Add-ons</h3><p>Increase your CRM capacity with simple quantity-based add-ons.</p></div></div>
          <div className="billing-addon-grid">
            {addonCards.map((addon) => {
              const quantity = Number(addonQuantity[addon.id] || 1);
              const totalQuota = addon.quota * quantity;
              const totalAmount = addon.price * quantity;
              const isEnabled = addon.addon?.status === "active";
              return (
                <div className="billing-addon-card" key={addon.id}>
                  <div className="billing-addon-head">
                    <div><span className="billing-addon-icon">{addon.icon}</span><div><h4>{addon.title}</h4><p>{addon.description}</p></div></div>
                    {isEnabled && <span className="billing-addon-active">Active</span>}
                  </div>
                  <div className="billing-addon-price"><strong>₹{addon.price.toLocaleString("en-IN")}</strong><span>/ pack</span></div>
                  <div className="billing-addon-capacity"><strong>{addon.quota.toLocaleString("en-IN")}</strong><span>additional {addon.unit} per pack</span></div>
                  {isEnabled && <div className="billing-addon-current"><span>Current remaining</span><strong>{Number(addon.addon?.remaining || 0).toLocaleString("en-IN")}</strong></div>}
                  <div className="billing-addon-period"><span>Quantity</span><div className="billing-addon-quantity"><button type="button" onClick={() => updateQuantity(addon.id, quantity - 1)} disabled={quantity <= 1}>−</button><strong>{quantity}</strong><button type="button" onClick={() => updateQuantity(addon.id, quantity + 1)} disabled={quantity >= 10}>+</button></div></div>
                  <div className="billing-addon-total"><span>Total capacity</span><strong>{totalQuota.toLocaleString("en-IN")} {addon.unit}</strong></div>
                  <div className="billing-addon-total"><span>Amount</span><strong>₹{totalAmount.toLocaleString("en-IN")}</strong></div>
                  <button type="button" className="billing-addon-button" onClick={() => startAddon(addon.id, quantity)} disabled={!isActive}>{!isActive ? "Activate a plan first" : "Pay Now"}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === "history" && (
        <div className="plan-billing-history-page">
          <div className="plan-billing-section-title"><div><h3>Billing History</h3><p>Your successful plan and add-on payments.</p></div></div>
          <div className="billing-history-table-wrap">
            <table className="billing-history-table">
              <thead><tr><th>Invoice</th><th>Purchase Date</th><th>Plan / Add-on</th><th>Amount</th><th>GST</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {billingHistory.length === 0 ? (
                  <tr><td colSpan="7" className="billing-history-empty">No billing history available.</td></tr>
                ) : (
                  billingHistory.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.invoiceNumber || "-"}</strong></td>
                      <td>{formatDate(item.date || item.createdAt)}</td>
                      <td><div className="billing-history-item"><strong>{item.itemName}</strong>{item.orderType === "addon" && item.addonMonths > 0 && <small>{item.addonMonths} pack{item.addonMonths > 1 ? "s" : ""}</small>}{item.orderType !== "addon" && item.period > 0 && <small>{item.period} month{item.period > 1 ? "s" : ""}</small>}</div></td>
                      <td>{formatMoney(Number(item.amount || 0) - Number(item.tax || 0), item.currency)}</td>
                      <td>{formatMoney(item.tax || 0, item.currency)}</td>
                      <td><strong>{formatMoney(item.total || item.amount || 0, item.currency)}</strong></td>
                      <td><span className="billing-history-status">Active</span></td>
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
        return <LeadSourcesContent />;

      case "Lead Stages":
        return <LeadStagesContent />;

      case "WhatsApp":
        return (
          <ComingSoonContent
            title="WhatsApp"
            description="Connect and manage your WhatsApp lead communication from one place."
            icon="◔"
            whatsapp
          />
        );

      case "Notification Settings":
        return (
          <ComingSoonContent
            title="Notification Settings"
            description="Control alerts and notifications for leads, follow-ups and CRM activity."
            icon="♢"
          />
        );

      case "AI Settings":
        return (
          <ComingSoonContent
            title="AI Settings"
            description="Manage AI-powered CRM assistance and automation from one place."
            icon="✦"
          />
        );

      case "Invoice Settings":
        return (
          <ComingSoonContent
            title="Invoice Settings"
            description="Configure invoice preferences, business details and billing documents."
            icon="▤"
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