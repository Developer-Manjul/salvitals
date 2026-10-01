import { useEffect, useRef, useState } from "react";
import "../styles/dashboard.scss";
import "../styles/dashboard-layout.scss";
import "../styles/followup-alert.scss";
import { buildApiUrl } from "../config/api";
import Settings from "./Settings";
import Leads from "./Leads";
import LeadDetails from "./LeadDetails";
import ContactDetails from "./ContactDetails";
import Contacts from "./Contacts";
import FollowUps from "./FollowUps";
import Calendar from "./Calendar";
import Invoice from "./Invoice";
import AIAssistant from "./AIAssistant";
import MetaIntegrationPanel from "./MetaIntegrationPanel";


const navGroups = [
  {
    label: "Acquire",
    items: [
      ["Leads", "users"],
      ["Follow-ups", "calendar"],
      ["Ai Chat", "chat"],
    ],
  },
  {
    label: "People",
    items: [
      ["Contacts", "contact"],
      ["Calendar", "calendar"],
      ["AI Assistant", "spark"],
    ],
  },
  {
    label: "Engage",
    items: [
      ["WhatsApp", "whatsapp"],
    ],
  },
  {
    label: "Revenue",
    items: [
      ["Invoices", "invoice"],
    ],
  },
  {
    label: "Manage",
    items: [
      ["Integrations", "integration"],
      ["Settings", "settings"],
    ],
  },
];

const NAV_PERMISSIONS = {
  Leads: "leads.view",
  "Follow-ups": "followups.view",
  Chat: "ai.view",
  Contacts: "contacts.view",
  Calendar: "calendar.view",
  "AI Assistant": "ai.view",
  WhatsApp: "whatsapp.view",
  Invoices: "invoices.view",
  Integrations: "integrations.view",
  Settings: null,
};

function normalizeSource(source = "") {
  const value = String(source || "").trim().toLowerCase();
  if (!value) return "Other";
  if (value.includes("instagram") || value === "ig") return "Instagram";
  if (value.includes("facebook") || value === "fb" || value === "facbook") return "Facebook";
  if (value.includes("google") || value.includes("gads") || value.includes("google ads")) return "Google";
  if (value.includes("whatsapp") || value === "wa") return "WhatsApp";
  if (value.includes("website") || value.includes("web")) return "Website";
  if (value.includes("referral")) return "Referral";
  if (value.includes("walk") || value.includes("walk-in") || value.includes("walkin")) return "Walk-in";
  if (value.includes("manual")) return "Manual";
  if (value.includes("campaign")) return "Campaign";
  return String(source).trim() || "Other";
}

function sourceTone(source) {
  const map = {
    Google: "blue",
    Instagram: "pink",
    Website: "sky",
    WhatsApp: "green",
    Referral: "purple",
    Facebook: "indigo",
    "Walk-in": "teal",
    Campaign: "orange",
    Manual: "slate",
    Other: "slate",
  };
  return map[source] || "slate";
}

function normalizeStage(stage = "") {
  const value = String(stage || "").trim().toLowerCase();
  if (!value) return "New";
  const map = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    "consultation scheduled": "Consultation Scheduled",
    "consultation done": "Consultation Done",
    proposal: "Treatment Proposed",
    "treatment proposed": "Treatment Proposed",
    converted: "Won",
    won: "Won",
    lost: "Lost",
  };
  return map[value] || String(stage).trim();
}

function stageTone(stage) {
  const map = {
    New: "slate",
    Contacted: "sky",
    Qualified: "blue",
    "Consultation Scheduled": "purple",
    "Consultation Done": "indigo",
    "Treatment Proposed": "orange",
    Won: "green",
    Lost: "red",
  };
  return map[stage] || "slate";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDays() {
  const days = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    days.push(date);
  }
  return days;
}

function getLeadDate(lead) {
  const value = lead?.createdAt || lead?.created_at || lead?.date;
  const date = new Date(value || "");
  return Number.isFinite(date.getTime()) ? date : null;
}

function buildDashboardData(leads = []) {
  const safeLeads = Array.isArray(leads) ? leads : [];
  const normalized = safeLeads.map((lead) => ({
    ...lead,
    source: normalizeSource(lead?.source),
    stage: normalizeStage(lead?.stage),
  }));
  const total = normalized.length;
  const qualified = normalized.filter((lead) =>
    ["Qualified", "Consultation Scheduled", "Consultation Done", "Treatment Proposed", "Won"].includes(lead.stage)
  ).length;
  const won = normalized.filter((lead) => lead.stage === "Won").length;
  const conversion = total ? (won / total) * 100 : 0;
  const sourceCounts = normalized.reduce((acc, lead) => {
    const source = lead.source || "Other";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const sources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => [name, count, total ? (count / total) * 100 : 0, sourceTone(name)]);
  const stageOrder = [
    "New",
    "Contacted",
    "Qualified",
    "Consultation Scheduled",
    "Consultation Done",
    "Treatment Proposed",
    "Won",
    "Lost",
  ];
  const pipeline = stageOrder.map((stage) => [
    stage,
    normalized.filter((lead) => lead.stage === stage).length,
    stageTone(stage),
  ]);
  const days = getDays();
  const performance = days.map((day) => {
    const dayLeads = normalized.filter((lead) => {
      const date = getLeadDate(lead);
      return date && date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
    });
    const dayQualified = dayLeads.filter((lead) =>
      ["Qualified", "Consultation Scheduled", "Consultation Done", "Treatment Proposed", "Won"].includes(lead.stage)
    ).length;
    return [
      new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(day),
      dayLeads.length,
      dayQualified,
    ];
  });
  const maxPerformance = Math.max(1, ...performance.map(([, captured]) => captured));
  return { total, qualified, won, conversion, sources, pipeline, performance, maxPerformance };
}

function getRelativeTime(value) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "—";
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.4 2.4 0 1 1 4.4 1.3c-.8 1.1-2.1 1.4-2.1 3" />
        <path d="M12 17h.01" />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-9-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    chevron: <path d="m6 9 6 6 6-6" />,

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    trend: (
      <>
        <path d="M3 17 9 11l4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),

    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
        <path d="M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.7 2.7L16.5 9" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),

    message: (
      <>
        <path d="M20 16a3 3 0 0 1-3 3H8l-5 3V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3z" />
      </>
    ),

    pipeline: (
      <>
        <path d="M4 5h16M7 12h10M10 19h4" />
      </>
    ),

    contact: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="12" cy="10" r="2.5" />
        <path d="M8 17c.8-2 2.1-3 4-3s3.2 1 4 3" />
      </>
    ),

    patient: (
      <>
        <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),

    whatsapp: (
      <>
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z" />
        <path d="M8.5 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c.7 1.2 1.7 2.1 3 2.7l.6-.7c.2-.2.4-.3.7-.1l1.8.8c.3.1.4.3.4.6v.5c0 .3 0 .6-.5.8-1 .5-2.2.2-3.2-.3-1.3-.7-3.1-2.4-4-3.6-.7-1-1.1-2.2-.7-3.8Z" />
      </>
    ),

    campaign: (
      <>
        <path d="m4 11 15-6v14L4 13z" />
        <path d="M4 11v2M19 9l2-1v8l-2-1" />
        <path d="M8 14l1.5 5h3L11 15" />
      </>
    ),

    spark: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
      </>
    ),

    form: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),

    invoice: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),

    payment: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),

    report: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </>
    ),

    team: (
      <>
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1M16 14a5 5 0 0 1 5 5v1" />
      </>
    ),

    integration: (
      <>
        <path d="M8 12h8M12 8v8" />
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h2.6V5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V14h-.2a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.users}</svg>;
}

function Brand({ mobile = false }) {
  return (
    <div className={mobile ? "dash-mobile-brand" : "dash-brand"}>
      <img
        src="/logo.png"
        alt="Vitals Clinic Growth CRM"
        className="dash-brand-logo"
      />
    </div>
  );
}

function Avatar({
  initials,
  logo,
  alt = "Clinic logo",
  tone = "",
}) {
  if (logo) {
    return (
      <span className={`dash-avatar dash-avatar-logo ${tone}`}>
        <img
          src={logo}
          alt={alt}
        />
      </span>
    );
  }

  return (
    <span className={`dash-avatar ${tone}`}>
      {initials}
    </span>
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
      .toUpperCase() || "U"
  );
}

function ActualDashboardContent({ user, dashboardLeads, dashboardData, todayFollowUps, onNavigate, onAddLead }) {
  const firstName = user?.name ? user.name.trim() : "there";
  const greeting = getGreeting();
  const data = dashboardData || buildDashboardData([]);
  const maxPipeline = Math.max(1, ...data.pipeline.map(([, count]) => count));
  const recentLeads = dashboardLeads.slice(0, 15);
  const visibleFollowUps = todayFollowUps.slice(0, 5);

  return (
    <>
      <div className="dash-page-head">
        <div>
          <p className="dash-breadcrumb">Overview</p>
          <h1>{greeting}, {firstName}.</h1>
        </div>
        <div className="dash-head-actions">

        </div>
      </div>

      <div className="dash-kpis">
        {[
          { label: "Leads captured", value: data.total, change: "Live", tone: "blue", icon: "users" },
          { label: "Qualified leads", value: data.qualified, change: "Live", tone: "purple", icon: "check" },
          { label: "Consultations", value: data.pipeline.find(([name]) => name === "Consultation Scheduled")?.[1] || 0, change: "Live", tone: "green", icon: "calendar" },
        ].map((kpi) => (
          <div className="dash-kpi" key={kpi.label}>
            <div className={`dash-kpi-icon ${kpi.tone}`}><Icon name={kpi.icon} size={17} /></div>
            <div className="dash-kpi-label">{kpi.label}</div>
            <div className="dash-kpi-value">{kpi.value}</div>
            <span className="dash-kpi-change">{kpi.change}</span>
            <span className="dash-kpi-period">current workspace</span>
          </div>
        ))}
      </div>

      <div className="dash-grid-two">
        <section className="dash-card performance-card">
          <div className="dash-card-head">
            <div>
              <h2>Lead performance</h2>
              <p>Captured vs qualified over the last 7 days</p>
            </div>
            <span className="dash-card-action">Last 7 days</span>
          </div>
          <div className="dash-chart">
            <div className="dash-y-labels"><span>{data.maxPerformance}</span><span>{Math.ceil(data.maxPerformance * .75)}</span><span>{Math.ceil(data.maxPerformance * .5)}</span><span>{Math.ceil(data.maxPerformance * .25)}</span><span>0</span></div>
            <div className="dash-chart-area">
              {[0, 1, 2, 3, 4].map((i) => <i className="dash-grid-line" style={{ top: `${i * 25}%` }} key={i} />)}
              <div className="dash-bars">
                {data.performance.map(([day, captured, qualified]) => (
                  <div className="dash-bar-day" key={day}>
                    <div className="dash-bar-stack">
                      <span style={{ height: `${(captured / data.maxPerformance) * 180}px` }} />
                      <span style={{ height: `${(qualified / data.maxPerformance) * 180}px` }} />
                    </div>
                    <small>{day}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dash-legend"><span><i className="blue" />Leads captured</span><span><i className="purple" />Qualified</span></div>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <div><h2>Lead sources</h2><p>Where your enquiries are coming from</p></div>
            <button className="dash-card-action" type="button" onClick={() => onNavigate("Leads")}>View leads <Icon name="arrow" size={14} /></button>
          </div>
          <div className="dash-source-list">
            {data.sources.length === 0 ? <p className="dash-notification-empty">No leads yet</p> : data.sources.map(([name, count, pct, tone]) => (
              <div className="dash-source-row" key={name}><span className={`dash-source-dot ${tone}`} /><span className="dash-source-name">{name}</span><strong>{count}</strong><small>{pct.toFixed(1)}%</small></div>
            ))}
          </div>
        </section>
      </div>


      <div className="dash-grid-two lower">
        <section className="dash-card">
          <div className="dash-card-head">
            <div><h2>Recent leads</h2><p>Latest enquiries that need attention</p></div>
            <button className="dash-card-action" type="button" onClick={() => onNavigate("Leads")}>View all <Icon name="arrow" size={14} /></button>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table"><thead><tr><th>Lead</th><th>Interest</th><th>Source</th><th>Status</th><th>Owner</th><th>Added</th></tr></thead>
              <tbody>
                {recentLeads.length === 0 ? <tr><td colSpan="6">No leads found</td></tr> : recentLeads.map((lead) => <tr key={lead._id}>
                  <td><div className="dash-lead"><Avatar initials={getInitials(lead.name)} /><span><strong>{lead.name || "Unnamed lead"}</strong><small>{getRelativeTime(lead.createdAt)}</small></span></div></td>
                  <td>{lead.service || "—"}</td><td>{normalizeSource(lead.source)}</td>
                  <td><span className={`dash-status ${(normalizeStage(lead.stage) || "New").toLowerCase().replaceAll(" ", "-")}`}>{normalizeStage(lead.stage)}</span></td>
                  <td>{lead.owner || lead.preferredDoctor || "Unassigned"}</td><td className="muted">{getRelativeTime(lead.createdAt)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dash-card">
          <div className="dash-card-head"><div><h2>Today’s follow-ups</h2><p>Keep your pipeline moving</p></div><button className="dash-card-action" type="button" onClick={() => onNavigate("Calendar")}>Calendar <Icon name="arrow" size={14} /></button></div>
          <div className="dash-follow-list">
            {visibleFollowUps.length === 0 ? <p className="dash-notification-empty">No pending follow-ups today</p> : visibleFollowUps.map((item) => <div className="dash-follow" key={String(item._id)}>
              <span className={`dash-priority ${String(item.priority || "medium").toLowerCase()}`} /><Avatar initials={getInitials(item.leadName)} /><div className="grow"><strong>{item.leadName}</strong><span>{item.purpose}</span><small>{new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(item.date))}</small></div><button type="button" className="dash-more" onClick={() => onNavigate("Follow-ups")}>•••</button>
            </div>)}
          </div>
          <button className="dash-full-btn" type="button" onClick={() => onNavigate("Follow-ups")}>View all follow-ups <Icon name="arrow" size={15} /></button>
        </section>
      </div>
    </>
  );
}

function TodayFollowUpPopup({ items, minimized, onOpen, onMinimize, onClose, onRestore }) {
  const controls = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="today-followup-count">{items.length}</span>
      {minimized ? (
        <button type="button" aria-label="Restore follow-ups" onClick={onRestore} style={{ width: 30, height: 30, border: 0, borderRadius: 8, background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>+</button>
      ) : (
        <button type="button" aria-label="Minimize follow-ups" onClick={onMinimize} style={{ width: 30, height: 30, border: 0, borderRadius: 8, background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 19, lineHeight: 1, cursor: "pointer" }}>−</button>
      )}
      <button type="button" aria-label="Close follow-ups" onClick={onClose} style={{ width: 30, height: 30, border: 0, borderRadius: 8, background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 21, lineHeight: 1, cursor: "pointer" }}>×</button>
    </div>
  )

  return (
    <section className="today-followup-popup" aria-live="polite" style={minimized ? { width: 360, maxWidth: "calc(100vw - 24px)", overflow: "hidden" } : undefined}>
      <div className="today-followup-popup-head">
        <div className="today-followup-popup-title">
          <span className="today-followup-pulse" />
          <div>
            <strong>Today’s Follow-ups</strong>
            <small>{items.length} pending today</small>
          </div>
        </div>
        {controls}
      </div>

      {!minimized && (
        <>
          <div className="today-followup-popup-list">
            {items.map((item) => (
              <button type="button" className="today-followup-popup-item" key={String(item._id)} onClick={() => onOpen(item)}>
                <span className="today-followup-time">
                  {new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(item.date))}
                </span>
                <span className="today-followup-item-body">
                  <strong>{item.leadName}</strong>
                  <small>{item.purpose}</small>
                  {item.service && <em>{item.service}</em>}
                </span>
                <Icon name="arrow" size={15} />
              </button>
            ))}
          </div>
          <div className="today-followup-popup-footer">
            <span>Click a follow-up to open it.</span>
            <span className="today-followup-live">LIVE</span>
          </div>
        </>
      )}
    </section>
  );
}

export default function Dashboard() {
  const contactPathMatch =
    window.location.pathname.match(/^\/contacts\/([^/]+)$/);

const [active, setActive] =
    useState(contactPathMatch ? "ContactDetails" : "Dashboard");

const [selectedContactId, setSelectedContactId] =
    useState(contactPathMatch ? contactPathMatch[1] : null);

  const [settingsTab, setSettingsTab] =
    useState("Business Profile");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [user, setUser] =
    useState(null);

  const [showPlans, setShowPlans] =
    useState(true);

  const [selectedLeadId, setSelectedLeadId] =
    useState(null);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const notificationRef = useRef(null);

  const [dashboardLeads, setDashboardLeads] =
    useState([]);

  const [allLeads, setAllLeads] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [dashboardData, setDashboardData] =
    useState(buildDashboardData([]));

  const [pendingFollowUpCount, setPendingFollowUpCount] =
    useState(0);

  const [todayFollowUps, setTodayFollowUps] =
    useState([]);

  const [dismissedTodayFollowUps, setDismissedTodayFollowUps] =
    useState(() => new Set());

  const [todayFollowUpsMinimized, setTodayFollowUpsMinimized] =
    useState(false);

  const [focusFollowUpId, setFocusFollowUpId] =
    useState("");

  const [leadCount, setLeadCount] =
    useState(0);

  const [contactCount, setContactCount] =
    useState(0);

  const [aiUnreadCount, setAiUnreadCount] =
    useState(0);

  const [billing, setBilling] =
    useState(null);

  const [billingLoading, setBillingLoading] =
    useState(true);


  useEffect(() => {
    const dashboardParams =
      new URLSearchParams(window.location.search);

    const sessionToken = ["token", "vitalsToken", "salevitals_token"]
      .map((key) => sessionStorage.getItem(key))
      .find(Boolean);
    const storedToken = sessionToken || ["token", "vitalsToken", "salevitals_token"]
      .map((key) => localStorage.getItem(key))
      .find(Boolean);

    if (!sessionToken && storedToken) {
      ["token", "vitalsToken", "salevitals_token"].forEach((key) =>
        sessionStorage.setItem(key, storedToken)
      );
    }

    const sessionUser = ["user", "vitalsUser", "salevitals_user"]
      .map((key) => sessionStorage.getItem(key))
      .find(Boolean);
    const savedUser = sessionUser || ["user", "vitalsUser", "salevitals_user"]
      .map((key) => localStorage.getItem(key))
      .find(Boolean);

    if (!sessionUser && savedUser) {
      ["user", "vitalsUser", "salevitals_user"].forEach((key) =>
        sessionStorage.setItem(key, savedUser)
      );
    }

    if (
      dashboardParams.get("metaSelectPage") === "true" ||
      dashboardParams.get("metaError")
    ) {
      setActive("Settings");
    }

    if (savedUser) {
      try {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);
      } catch (error) {
        console.error(
          "User data error:",
          error
        );
      }
    }

    loadBilling();

  }, []);

  const getAuthToken = () =>
    sessionStorage.getItem("vitalsToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("salevitals_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    localStorage.getItem("salevitals_token") ||
    "";

  const loadBilling = async () => {
    const token = getAuthToken();

    if (!token) {
      setBillingLoading(false);
      return;
    }

    try {
      const response = await fetch(
        buildApiUrl("/api/billing/current"),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setBilling(data);

        const subscription = data.subscription || {};
        const hasActivePlan =
          subscription.status === "active" &&
          subscription.planId;

        setShowPlans(!hasActivePlan);
      }
    } catch (error) {
      console.error("LOAD BILLING ERROR:", error);
    } finally {
      setBillingLoading(false);
    }
  };

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
      "current";

    return `saleVitalsReadLeadIds_v5_${String(userId).trim()}`;
  };

  const markLeadAsRead = (leadId) => {
    const id = String(leadId || "").trim();

    if (!id) {
      return;
    }

    const storageKey = getLeadReadStorageKey();

    let readLeadIds = [];

    try {
      readLeadIds = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );
    } catch {
      readLeadIds = [];
    }

    if (!Array.isArray(readLeadIds)) {
      readLeadIds = [];
    }

    const alreadyRead = readLeadIds.some(
      (readId) => String(readId) === id
    );

    if (alreadyRead) {
      return;
    }

    const updatedReadIds = [
      ...readLeadIds,
      id,
    ];

    localStorage.setItem(
      storageKey,
      JSON.stringify(updatedReadIds)
    );

    setLeadCount((count) =>
      Math.max(0, count - 1)
    );
  };

  const isTodayDate = (value) => {
    const date = new Date(value);
    const today = new Date();

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isCompletedFollowUp = (followUp) => {
    const status = String(
      followUp?.status || "Scheduled"
    ).toLowerCase();

    return (
      status === "completed" ||
      status === "complete" ||
      status === "done"
    );
  };

  const loadTodayFollowUps = async () => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        buildApiUrl("/api/leads"),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      const leads = Array.isArray(data.leads)
        ? data.leads
        : [];

      const items = [];

      leads.forEach((lead) => {
        if (!Array.isArray(lead.followUps)) {
          return;
        }

        lead.followUps.forEach((followUp, index) => {
          const followUpTime = new Date(
            followUp?.date || ""
          ).getTime();

          if (
            !followUp?.date ||
            !Number.isFinite(followUpTime) ||
            followUpTime <= Date.now() ||
            isCompletedFollowUp(followUp) ||
            !isTodayDate(followUp.date)
          ) {
            return;
          }

          items.push({
            ...followUp,
            _id:
              followUp._id ||
              `${lead._id}-followup-${index}`,
            leadId: lead._id,
            leadName: lead.name || "Unnamed lead",
            phone: lead.phone || "",
            service:
              followUp.service ||
              lead.service ||
              "",
            owner:
              followUp.assignedTo ||
              lead.owner ||
              "Unassigned",
            purpose:
              followUp.purpose ||
              followUp.note ||
              "Follow-up",
          });
        });
      });

      items.sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

      setTodayFollowUps(items);
    } catch (error) {
      console.error(
        "LOAD TODAY FOLLOW UPS ERROR:",
        error
      );
    }
  };

  const loadSidebarCounts = async () => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      const [leadsResponse, contactsResponse, aiResponse] =
        await Promise.all([
          fetch(
            buildApiUrl("/api/leads"),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
          fetch(
            buildApiUrl("/api/contacts"),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
          fetch(
            buildApiUrl("/api/ai-conversations/unread-count"),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ]);

      const [leadsData, contactsData, aiData] =
        await Promise.all([
          leadsResponse.json(),
          contactsResponse.json(),
          aiResponse.json(),
        ]);

      if (leadsResponse.ok) {
        const leads = Array.isArray(
          leadsData.leads
        )
          ? leadsData.leads
          : [];

        const readStorageKey = getLeadReadStorageKey();

        let readLeadIds = [];

        try {
          readLeadIds = JSON.parse(
            localStorage.getItem(readStorageKey) || "[]"
          );
        } catch {
          readLeadIds = [];
        }

        if (!Array.isArray(readLeadIds)) {
          readLeadIds = [];
        }

        const currentLeadIds = leads
          .map((lead) => String(lead?._id || ""))
          .filter(Boolean);

        const currentLeadIdSet = new Set(currentLeadIds);

        readLeadIds = readLeadIds.filter((id) =>
          currentLeadIdSet.has(String(id))
        );

        localStorage.setItem(
          readStorageKey,
          JSON.stringify(readLeadIds)
        );

        const readLeadIdSet = new Set(
          readLeadIds.map((id) => String(id))
        );

        const unreadNewLeadCount = leads.filter((lead) => {
          const id = String(lead?._id || "");

          const stage = String(
            lead?.stage || "New"
          )
            .trim()
            .toLowerCase();

          return (
            id &&
            stage === "new" &&
            !readLeadIdSet.has(id)
          );
        }).length;

        setLeadCount(unreadNewLeadCount);

        const now = new Date();

        const count = leads.reduce(
          (total, lead) => {
            const pending =
              Array.isArray(lead.followUps)
                ? lead.followUps.filter(
                  (followUp) => {
                    if (!followUp?.date) {
                      return false;
                    }

                    const status =
                      String(
                        followUp.status ||
                        "Scheduled"
                      ).toLowerCase();

                    if (
                      status === "completed" ||
                      status === "complete" ||
                      status === "done"
                    ) {
                      return false;
                    }

                    const date =
                      new Date(
                        followUp.date
                      );

                    return (
                      !Number.isNaN(
                        date.getTime()
                      ) &&
                      date >= now
                    );
                  }
                )
                : [];

            return total + pending.length;
          },
          0
        );

        setPendingFollowUpCount(count);
      }

      if (aiResponse.ok) {
        setAiUnreadCount(
          Number(aiData?.count || 0)
        );
      }

      if (contactsResponse.ok) {
        const contacts = Array.isArray(
          contactsData.contacts
        )
          ? contactsData.contacts
          : [];

        if (
          contactsData.usage &&
          typeof contactsData.usage.used ===
          "number"
        ) {
          setContactCount(
            contactsData.usage.used
          );
        } else {
          setContactCount(contacts.length);
        }
      }
    } catch (error) {
      console.error(
        "LOAD SIDEBAR COUNTS ERROR:",
        error
      );
    }
  };

  const loadNotifications = async () => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      const [
        notificationsResponse,
        countResponse,
      ] = await Promise.all([
        fetch(
          buildApiUrl(
            "/api/notifications?limit=20"
          ),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        fetch(
          buildApiUrl(
            "/api/notifications/unread-count"
          ),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const notificationsData =
        await notificationsResponse.json();

      const countData =
        await countResponse.json();

      if (notificationsResponse.ok) {
        setNotifications(
          Array.isArray(
            notificationsData.notifications
          )
            ? notificationsData.notifications
            : []
        );
      }

      if (countResponse.ok) {
        setUnreadNotificationCount(
          Number(countData.count) || 0
        );
      }
    } catch (error) {
      console.error(
        "LOAD NOTIFICATIONS ERROR:",
        error
      );
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, []);

  useEffect(() => {
    loadSidebarCounts();
  }, []);

  useEffect(() => {
    const handleLeadRead = () => {
      loadSidebarCounts();
    };

    window.addEventListener(
      "saleVitals:lead-read",
      handleLeadRead
    );

    return () =>
      window.removeEventListener(
        "saleVitals:lead-read",
        handleLeadRead
      );
  }, []);

  useEffect(() => {
    loadTodayFollowUps();
  }, []);

  useEffect(() => {
    const loadDashboardLeads = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const response = await fetch(buildApiUrl("/api/leads"), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) return;
        const leads = Array.isArray(data.leads) ? data.leads : [];
        const normalized = leads.map((lead) => ({ ...lead, source: normalizeSource(lead.source), stage: normalizeStage(lead.stage) }));
        setAllLeads(normalized);
        normalized.sort((a, b) => {
          const aTime = getLeadDate(a)?.getTime() || 0;
          const bTime = getLeadDate(b)?.getTime() || 0;
          return bTime - aTime;
        });
        setDashboardLeads(normalized.slice(0, 15));
        setDashboardData(buildDashboardData(normalized));
      } catch (error) {
        console.error("LOAD DASHBOARD LEADS ERROR:", error);
      }
    };
    loadDashboardLeads();
  }, []);

  const markNotificationAsRead = async (
    notificationId
  ) => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    try {
      await fetch(
        buildApiUrl(
          `/api/notifications/${notificationId}/read`
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        error
      );
    }
  };

  const handleNotificationClick = async (
    notification
  ) => {
    if (!notification.isRead) {
      await markNotificationAsRead(
        notification._id
      );

      setNotifications(
        (previous) =>
          previous.map((item) =>
            item._id === notification._id
              ? {
                ...item,
                isRead: true,
              }
              : item
          )
      );

      setUnreadNotificationCount(
        (count) => Math.max(0, count - 1)
      );
    }

    setNotificationsOpen(false);

    if (notification.leadId) {
      markLeadAsRead(notification.leadId);

      setSelectedLeadId(
        notification.leadId
      );

      setActive("LeadDetails");
    }
  };

  const markAllNotificationsAsRead =
    async () => {
      const token = getAuthToken();

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          buildApiUrl(
            "/api/notifications/read-all"
          ),
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications(
            (previous) =>
              previous.map((item) => ({
                ...item,
                isRead: true,
              }))
          );

          setUnreadNotificationCount(0);
        }
      } catch (error) {
        console.error(
          "MARK ALL NOTIFICATIONS READ ERROR:",
          error
        );
      }
    };

  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];

  const isOwnerUser =
    user?.isOwner === true ||
    userPermissions.includes("*");

  const hasPermission = (permission) =>
    isOwnerUser ||
    !permission ||
    userPermissions.includes(permission);

  const canAccessNav = (name) =>
    hasPermission(NAV_PERMISSIONS[name]);

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(([name]) =>
        canAccessNav(name)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const selectNav = (name) => {
    if (!canAccessNav(name)) {
      return;
    }

    setActive(name);

    if (name === "Settings") {
      setSettingsTab("Business Profile");
    }

    setMobileOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setSearchTerm("");
  };

  const searchResults = searchTerm.trim()
    ? allLeads
      .filter((lead) => {
        const query = searchTerm.trim().toLowerCase();
        const haystack = [
          lead?.name,
          lead?.phone,
          lead?.email,
          lead?.service,
          lead?.owner,
          lead?.preferredDoctor,
          normalizeSource(lead?.source),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8)
    : [];

  const openSearchLead = (lead) => {
    if (!lead?._id) return;
    markLeadAsRead(lead._id);
    setSelectedLeadId(lead._id);
    setActive("LeadDetails");
    setSearchTerm("");
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const openTodayFollowUp = (item) => {
    setDismissedTodayFollowUps((previous) => {
      const next = new Set(previous);
      next.add(String(item._id));
      return next;
    });

    setFocusFollowUpId(String(item._id));
    setActive("Follow-ups");
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const closeTodayFollowUps = () => {
    setDismissedTodayFollowUps((previous) => {
      const next = new Set(previous);
      todayFollowUps.forEach((item) => {
        next.add(String(item._id));
      });
      return next;
    });
  };

  useEffect(() => {
    if (
      active === "Dashboard" ||
      active === "LeadDetails" ||
      active === "ContactDetails"
    ) {
      return;
    }

    if (!canAccessNav(active)) {
      setActive("Dashboard");
    }
  }, [active, user?.permissions, user?.isOwner]);


function ComingSoonPage({ type = "WhatsApp" }) {
  const isWhatsApp = type === "WhatsApp";

  const title = isWhatsApp
    ? "WhatsApp Integration"
    : "Integrations";

  const description = isWhatsApp
    ? "We are building a powerful WhatsApp integration to help you manage lead conversations, follow-ups and customer communication in one place."
    : "We are connecting more powerful tools to help you bring your business data, leads and workflows together in one place.";

  const features = isWhatsApp
    ? [
        "Send & receive WhatsApp messages",
        "Auto-create leads from WhatsApp chats",
        "Manage conversations inside CRM",
        "Use templates and quick replies",
        "Track message history and engagement",
      ]
    : [
        "Connect your favorite business tools",
        "Sync leads and customer data",
        "Automate your daily workflows",
        "Keep everything connected in one workspace",
        "More integrations are coming soon",
      ];

  return (
    <section
      className="dash-coming-soon"
      style={{
        minHeight: "calc(100vh - 170px)",
        padding: "18px 0 50px",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e3ecec",
          borderRadius: 24,
          minHeight: 570,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 10px 35px rgba(0,101,106,.06)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,101,106,.12), rgba(0,101,106,0) 68%)",
            right: 70,
            top: 65,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 0.95fr",
            minHeight: 570,
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              padding: "58px 42px 58px 48px",
              maxWidth: 690,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "#e6f4f4",
                color: "#00656A",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: ".04em",
                marginBottom: 22,
              }}
            >
              <span>🚀</span>
              COMING SOON
            </div>

            <h1
              style={{
                margin: 0,
                color: "#172033",
                fontSize: "clamp(32px, 4vw, 52px)",
                lineHeight: 1.08,
                fontWeight: 800,
                letterSpacing: "-.04em",
              }}
            >
              {title}
            </h1>

            <p
              style={{
                margin: "18px 0 28px",
                color: "#66758a",
                fontSize: 16,
                lineHeight: 1.75,
                maxWidth: 610,
              }}
            >
              {description}
            </p>

            <div
              style={{
                display: "grid",
                gap: 13,
                marginBottom: 32,
              }}
            >
              {features.map((feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: "#344054",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      minWidth: 22,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#dff7e9",
                      color: "#16a05d",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </span>
                  {feature}
                </div>
              ))}
            </div>

            {/* <button
              type="button"
              onClick={() => {
                const message =
                  "Hello SaleVitals Support, I need help with my CRM. Please assist me.";
                window.open(
                  `https://wa.me/919625989258?text=${encodeURIComponent(message)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              style={{
                border: 0,
                borderRadius: 11,
                padding: "13px 20px",
                background: "#00656A",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(0,101,106,.18)",
              }}
            >
              Need Help? Chat on WhatsApp
            </button> */}
          </div>

          <div
            style={{
              minHeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 310,
                height: 310,
                borderRadius: "50%",
                border: "1px dashed rgba(0,101,106,.24)",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: 36,
                  background: "linear-gradient(145deg, #25d366, #16a05a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 22px 55px rgba(0,101,106,.24)",
                }}
              >
                <Icon name={isWhatsApp ? "whatsapp" : "integration"} size={76} />
              </div>

              {[
                ["Auto Capture", "users", { top: 8, left: -35 }],
                ["Follow-ups", "calendar", { bottom: 12, left: -45 }],
                ["Track & Analyze", "report", { bottom: 18, right: -55 }],
                ["Coming Soon", "spark", { top: 8, right: -48 }],
              ].map(([label, icon, position]) => (
                <div
                  key={label}
                  style={{
                    position: "absolute",
                    ...position,
                    background: "#fff",
                    border: "1px solid #e6eeee",
                    borderRadius: 14,
                    padding: "11px 14px",
                    minWidth: 118,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    boxShadow: "0 10px 25px rgba(15,23,42,.08)",
                    color: "#253047",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#e6f4f4",
                      color: "#00656A",
                    }}
                  >
                    <Icon name={icon} size={15} />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-coming-soon > div > div {
            grid-template-columns: 1fr !important;
          }
          .dash-coming-soon > div > div > div:last-child {
            min-height: 360px !important;
            padding-bottom: 40px;
          }
        }

        @media (max-width: 560px) {
          .dash-coming-soon {
            padding-top: 8px !important;
          }
          .dash-coming-soon > div {
            border-radius: 18px !important;
          }
          .dash-coming-soon > div > div > div:first-child {
            padding: 38px 24px 20px !important;
          }
          .dash-coming-soon > div > div > div:last-child {
            transform: scale(.82);
            margin-top: -25px;
          }
        }
      `}</style>
    </section>
  );
}

  const renderDashboardSection = () => {
    if (active === "WhatsApp") {
      return <ComingSoonPage type="WhatsApp" />;
    }

    if (active === "Integrations") {
      return <MetaIntegrationPanel />;
    }

    if (active === "Settings") {
      return (
        <Settings
          user={user}
          initialTab={settingsTab}
        />
      );
    }

    if (active === "Leads") {
      return (
        <Leads
          user={user}
          onOpenLeadDetails={(leadId) => {
            markLeadAsRead(leadId);
            setSelectedLeadId(leadId);
            setActive("LeadDetails");
          }}
        />
      );
    }

    if (active === "Follow-ups") {
      return (
        <FollowUps
          user={user}
          focusFollowUpId={focusFollowUpId}
          onFocusComplete={() =>
            setFocusFollowUpId("")
          }
        />
      );
    }

    if (active === "Calendar") {
      return (
        <Calendar
          user={user}
          onOpenLeadDetails={(leadId) => {
            markLeadAsRead(leadId);
            setSelectedLeadId(leadId);
            setActive("LeadDetails");
          }}
        />
      );
    }

    if (active === "Contacts") {
      return <Contacts user={user} />;
    }

    if (active === "ContactDetails" && selectedContactId) {
  return (
    <ContactDetails
      contactId={selectedContactId}
      onBack={() => {
        window.history.pushState({}, "", "/dashboard");
        setSelectedContactId(null);
        setActive("Contacts");
      }}
    />
  );
}

    if (active === "Ai Chat") {
      return (
        <AIAssistant
          key="ai-chat"
          initialTab="conversations"
        />
      );
    }

    if (active === "AI Assistant") {
      return (
        <AIAssistant
          key="ai-assistant"
          initialTab="settings"
        />
      );
    }

    if (active === "Invoices") {
      return <Invoice />;
    }

    if (
      active === "LeadDetails" &&
      selectedLeadId
    ) {
      return (
        <LeadDetails
          leadId={selectedLeadId}
          user={user}
          onBack={() =>
            setActive("Leads")
          }
          onOpenInvoice={() =>
            setActive("Invoices")
          }
        />
      );
    }

    return (
      <ActualDashboardContent
        user={user}
        dashboardLeads={dashboardLeads}
        dashboardData={dashboardData}
        todayFollowUps={todayFollowUps}
        onNavigate={selectNav}
        onAddLead={() => selectNav("Leads")}
      />
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    window.location.href = "/signin";
  };

  const userName =
    user?.name || "User";

  const clinicName =
    user?.clinicName ||
    "Clinic workspace";

  const initials =
    getInitials(userName);

  const clinicLogo =
    user?.clinicLogo ||
    user?.logo ||
    user?.businessLogo ||
    "";

  return (
    <>
      <style>{`
        .dash-help-btn {
          height: 36px;
          padding: 0 12px;
          border: 1px solid #d8e9e9;
          border-radius: 10px;
          background: #ffffff;
          color: #00656A;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s ease;
        }
        .dash-help-btn:hover {
          background: #e6f4f4;
          border-color: #b9dcdc;
          transform: translateY(-1px);
        }
        @media (max-width: 600px) {
          .dash-help-btn span {
            display: none;
          }
          .dash-help-btn {
            width: 36px;
            padding: 0;
          }
        }
      `}</style>
      <div className="dashboard-shell">

      <aside
        className={`dash-sidebar ${mobileOpen ? "open" : ""
          }`}
      >

        <Brand />

        <nav className="dash-nav">

          <button
            className={`dash-nav-item ${active === "Dashboard"
              ? "active"
              : ""
              }`}
            onClick={() =>
              selectNav("Dashboard")
            }
          >

            <Icon
              name="report"
              size={17}
            />

            <span>
              Dashboard
            </span>

          </button>

          {visibleNavGroups.map(
            (group) => (
              <div
                className="dash-nav-group"
                key={group.label}
              >

                <div className="dash-nav-label">
                  {group.label}
                </div>

                {group.items.map(
                  ([
                    name,
                    icon,
                    count,
                    countTone,
                  ]) => (
                    <button
                      key={name}
                      className={`dash-nav-item ${active === name
                        ? "active"
                        : ""
                        }`}
                      onClick={() =>
                        selectNav(name)
                      }
                    >

                      <Icon
                        name={icon}
                        size={17}
                      />

                      <span>
                        {name}
                      </span>

                      {(count ||
                        name === "Leads" ||
                        name === "Contacts" ||
                        name === "Follow-ups" ||
                        (name === "Chat" && aiUnreadCount > 0)) && (
                          <em
                            className={
                              name === "Leads" && leadCount > 0
                                ? "hot"
                                : name === "Follow-ups"
                                  ? "hot"
                                  : name === "Chat" && aiUnreadCount > 0
                                    ? "hot"
                                    : countTone === "hot"
                                      ? "hot"
                                      : ""
                            }
                          >
                            {name === "Leads"
                              ? leadCount
                              : name === "Contacts"
                                ? contactCount
                                : name === "Follow-ups"
                                  ? pendingFollowUpCount
                                  : name === "Chat"
                                    ? aiUnreadCount
                                    : count}
                          </em>
                        )}

                    </button>
                  )
                )}

              </div>
            )
          )}

        </nav>

        {hasPermission("billing.view") && (
          <div className="dash-plan">
            {showPlans || billingLoading ? (
              <>
                <div className="dash-plan-top">
                  <strong>Choose your plan</strong>
                  <span>Get started</span>
                </div>

                <div className="dash-plan-copy">
                  Choose a plan to unlock your workspace
                </div>

                <div className="dash-plan-bar">
                  <i style={{ width: "0%" }} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSettingsTab("Plan & Billing");
                    setActive("Settings");
                    setMobileOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  Choose plan
                </button>
              </>
            ) : (
              <>
                <div className="dash-plan-top">
                  <strong>
                    {billing?.subscription?.planName ||
                      "Active plan"}
                  </strong>

                  <span>Active</span>
                </div>

                <div className="dash-plan-copy">
                  {billing?.subscription?.daysRemaining !==
                    undefined
                    ? `${billing.subscription.daysRemaining} days remaining`
                    : "Your Vitals workspace is active"}
                </div>

                <div className="dash-plan-usage">
                  <div className="dash-plan-usage-row">
                    <strong>
                      {(() => {
                        const used = Number(
                          billing?.usage?.contacts?.used || 0
                        );

                        const total =
                          billing?.usage?.contacts?.totalLimit ??
                          billing?.usage?.contacts?.planLimit ??
                          billing?.usage?.contacts?.limit;

                        return total === null ||
                          total === undefined
                          ? `${used} contacts`
                          : `${used} / ${Number(total) || 0}`;
                      })()}
                    </strong>
                  </div>

                  <div className="dash-plan-bar">
                    <i
                      style={{
                        width: `${(() => {
                          const used = Number(
                            billing?.usage?.contacts?.used || 0
                          );

                          const total =
                            billing?.usage?.contacts?.totalLimit ??
                            billing?.usage?.contacts?.planLimit ??
                            billing?.usage?.contacts?.limit;

                          if (
                            total === null ||
                            total === undefined ||
                            Number(total) <= 0
                          ) {
                            return 0;
                          }

                          return Math.min(
                            100,
                            Math.max(
                              0,
                              (used / Number(total)) * 100
                            )
                          );
                        })()}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSettingsTab("Plan & Billing");
                    setActive("Settings");
                    setMobileOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  Upgrade plan
                </button>
              </>
            )}
          </div>
        )}

      </aside>

      {mobileOpen && (
        <button
          className="dash-overlay"
          aria-label="Close menu"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <main className="dash-main">

        <header className="dash-topbar">

          <button
            className="dash-menu-btn"
            onClick={() =>
              setMobileOpen(true)
            }
            aria-label="Open menu"
          >

            <span />
            <span />
            <span />

          </button>

          <div
            className="dash-search"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Icon name="search" size={18} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchTerm("");
                  setSearchOpen(false);
                }
                if (event.key === "Enter" && searchResults[0]) {
                  openSearchLead(searchResults[0]);
                }
              }}
              placeholder="Search patients, leads, invoices…"
              aria-label="Search patients, leads, invoices"
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background: "transparent",
                font: "inherit",
                color: "inherit",
                minWidth: 0,
              }}
            />

            <kbd>⌘K</kbd>

            {searchOpen && searchTerm.trim() && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  minWidth: 420,
                  maxHeight: 420,
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  boxShadow: "0 18px 45px rgba(15,23,42,.14)",
                  zIndex: 1000,
                  padding: 8,
                }}
              >
                {searchResults.length === 0 ? (
                  <div style={{ padding: "16px 14px", color: "#6b7280", fontSize: 13 }}>
                    No leads found for “{searchTerm.trim()}”
                  </div>
                ) : (
                  searchResults.map((lead) => (
                    <button
                      type="button"
                      key={lead._id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSearchLead(lead)}
                      style={{
                        width: "100%",
                        border: 0,
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 12px",
                        borderRadius: 10,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <Avatar initials={getInitials(lead.name)} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: 13, color: "#172033" }}>
                          {lead.name || "Unnamed lead"}
                        </strong>
                        <small style={{ display: "block", marginTop: 3, color: "#7b8798", fontSize: 11 }}>
                          {lead.service || "Lead"} · {normalizeSource(lead.source)} · {lead.phone || lead.email || ""}
                        </small>
                      </span>
                      <span style={{ fontSize: 11, color: "#2563eb", whiteSpace: "nowrap" }}>
                        Open lead →
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="dash-top-actions">

            <button
              type="button"
              className="dash-help-btn"
              onClick={() => {
                const message =
                  "Hello SaleVitals Support, I need help with my CRM. Please assist me.";
                window.open(
                  `https://wa.me/919625989258?text=${encodeURIComponent(message)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              aria-label="Get help on WhatsApp"
              title="Get help on WhatsApp"
            >
              <Icon name="help" size={17} />
              <span>Help</span>
            </button>

            <div
              className="dash-notification-wrap"
              ref={notificationRef}
            >

              <button
                className="dash-icon-btn notification"
                onClick={() =>
                  setNotificationsOpen(true)
                }
                aria-label="Notifications"
                aria-expanded={
                  notificationsOpen
                }
              >

                <Icon
                  name="bell"
                  size={18}
                />

                {unreadNotificationCount >
                  0 && (
                    <b>
                      {unreadNotificationCount >
                        99
                        ? "99+"
                        : unreadNotificationCount}
                    </b>
                  )}

              </button>

              {notificationsOpen && (
                <div className="dash-notification-panel">

                  <div className="dash-notification-head">

                    <strong>
                      Notifications
                    </strong>

                    {unreadNotificationCount >
                      0 && (
                        <button
                          type="button"
                          onClick={
                            markAllNotificationsAsRead
                          }
                        >
                          Mark all as read
                        </button>
                      )}

                  </div>

                  <div className="dash-notification-list">

                    {notifications.length ===
                      0 ? (
                      <p className="dash-notification-empty">
                        No new notifications
                      </p>
                    ) : (
                      notifications.map(
                        (
                          notification
                        ) => (
                          <button
                            type="button"
                            className={`dash-notification-item ${notification.isRead
                              ? "read"
                              : "unread"
                              }`}
                            key={
                              notification._id
                            }
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                          >

                            <span>

                              <strong>
                                {
                                  notification.title
                                }
                              </strong>

                              <b>
                                {
                                  notification.message
                                }
                              </b>

                              <small>
                                {notification.source ||
                                  "Other"}{" "}
                                ·{" "}
                                {getRelativeTime(
                                  notification.createdAt
                                )}
                              </small>

                            </span>

                          </button>
                        )
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

            <div className="dash-profile-wrap">

              <button
                className="dash-profile"
                onClick={() =>
                  setProfileOpen(
                    (value) =>
                      !value
                  )
                }
              >

                <Avatar
                  initials={initials}
                  logo={clinicLogo}
                  alt={
                    clinicName ||
                    "Clinic logo"
                  }
                />

                <span>

                  <strong>
                    {userName}
                  </strong>

                  <small>
                    {clinicName}
                  </small>

                </span>

                <Icon
                  name="chevron"
                  size={15}
                />

              </button>

              {profileOpen && (
                <div className="dash-profile-menu">

                  <button
                    type="button"
                    onClick={() => {
                      setActive(
                        "Settings"
                      );

                      setProfileOpen(
                        false
                      );
                    }}
                  >
                    Profile & settings
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                  >
                    Sign out
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        <section className="dash-content">

          {renderDashboardSection()}

        </section>

      </main>

      {todayFollowUps.filter(
        (item) =>
          !dismissedTodayFollowUps.has(
            String(item._id)
          ) &&
          new Date(item.date).getTime() > Date.now()
      ).length > 0 && (
          <TodayFollowUpPopup
            items={todayFollowUps.filter(
              (item) =>
                !dismissedTodayFollowUps.has(
                  String(item._id)
                ) &&
                new Date(item.date).getTime() > Date.now()
            )}
            minimized={todayFollowUpsMinimized}
            onOpen={openTodayFollowUp}
            onMinimize={() =>
              setTodayFollowUpsMinimized(true)
            }
            onRestore={() =>
              setTodayFollowUpsMinimized(false)
            }
            onClose={closeTodayFollowUps}
          />
        )}

      <nav className="dash-mobile-nav">

        <button
          className={
            active === "Dashboard"
              ? "on"
              : ""
          }
          onClick={() =>
            selectNav("Dashboard")
          }
        >

          <Icon
            name="report"
            size={18}
          />

          <span>
            Home
          </span>

        </button>

        {canAccessNav("Leads") && (
          <button
            className={
              active === "Leads"
                ? "on"
                : ""
            }
            onClick={() =>
              selectNav("Leads")
            }
          >

            <Icon
              name="users"
              size={18}
            />

            <span>
              Leads
            </span>

          </button>
        )}

        {canAccessNav("Follow-ups") && (
          <button
            className={
              active === "Follow-ups"
                ? "on"
                : ""
            }
            onClick={() =>
              selectNav("Follow-ups")
            }
          >

            <Icon
              name="pipeline"
              size={18}
            />

            <span>
              Follow-ups
            </span>

          </button>
        )}

        {canAccessNav("Calendar") && (
          <button
            className={
              active === "Calendar"
                ? "on"
                : ""
            }
            onClick={() =>
              selectNav("Calendar")
            }
          >

            <Icon
              name="calendar"
              size={18}
            />

            <span>
              Calendar
            </span>

          </button>
        )}

        <button
          onClick={() =>
            setMobileOpen(true)
          }
        >

          <Icon
            name="users"
            size={18}
          />

          <span>
            More
          </span>

        </button>

      </nav>

    </div>
    </>
  );
}
