import { useEffect, useState } from "react";
import "../styles/dashboard.scss";
import Settings from "./Settings";

const navGroups = [
  {
    label: "Acquire",
    items: [
      ["Leads", "users", "55"],
      ["Enquiries", "message", "6", "hot"],
      ["Pipeline", "pipeline"],
      ["Follow-ups", "calendar", "12", "hot"],
    ],
  },
  {
    label: "People",
    items: [
      ["Contacts", "contact"],
      ["Patients", "patient"],
      ["Calendar", "calendar"],
    ],
  },
  {
    label: "Engage",
    items: [
      ["WhatsApp", "whatsapp", "6"],
      ["Campaigns", "campaign"],
      ["AI Assistant", "spark"],
      ["Forms", "form"],
    ],
  },
  {
    label: "Revenue",
    items: [
      ["Invoices", "invoice"],
      ["Payments", "payment"],
      ["Reports", "report"],
    ],
  },
  {
    label: "Manage",
    items: [
      ["Team Performance", "team"],
      ["Integrations", "integration"],
      ["Settings", "settings"],
    ],
  },
];

const kpis = [
  {
    label: "Leads captured",
    value: "2,145",
    change: "+12.8%",
    tone: "blue",
    icon: "users",
  },
  {
    label: "Qualified leads",
    value: "1,142",
    change: "+8.4%",
    tone: "purple",
    icon: "check",
  },
  {
    label: "Consultations",
    value: "524",
    change: "+15.2%",
    tone: "green",
    icon: "calendar",
  },
  {
    label: "Conversion rate",
    value: "31.8%",
    change: "+4.6%",
    tone: "orange",
    icon: "trend",
  },
];

const sources = [
  ["Google", "412", "25.0%", "blue"],
  ["Instagram", "338", "20.5%", "pink"],
  ["Website", "296", "18.0%", "sky"],
  ["WhatsApp", "214", "13.0%", "green"],
  ["Referral", "158", "9.6%", "purple"],
  ["Facebook", "104", "6.3%", "indigo"],
  ["Walk-in", "82", "5.0%", "teal"],
  ["Other", "41", "2.5%", "slate"],
];

const pipeline = [
  ["New", 19, "slate"],
  ["Contacted", 12, "sky"],
  ["Qualified", 9, "blue"],
  ["Consultation Scheduled", 6, "purple"],
  ["Consultation Done", 3, "indigo"],
  ["Treatment Proposed", 6, "orange"],
  ["Won", 6, "green"],
  ["Lost", 3, "red"],
];

const leads = [
  {
    name: "Priya Sharma",
    type: "Hair transplant",
    source: "Google",
    status: "Qualified",
    owner: "AS",
    time: "8 min ago",
  },
  {
    name: "Rohan Kapoor",
    type: "Knee consultation",
    source: "WhatsApp",
    status: "New",
    owner: "RM",
    time: "21 min ago",
  },
  {
    name: "Neha Verma",
    type: "IVF consultation",
    source: "Instagram",
    status: "Consultation",
    owner: "AK",
    time: "42 min ago",
  },
  {
    name: "Amit Malhotra",
    type: "Dental implants",
    source: "Website",
    status: "Follow-up",
    owner: "PS",
    time: "1 hr ago",
  },
];

const followUps = [
  [
    "Priya Sharma",
    "Treatment discussion",
    "Today · 2:30 PM",
    "PS",
    "high",
  ],
  [
    "Rohan Kapoor",
    "Send consultation details",
    "Today · 4:00 PM",
    "RM",
    "medium",
  ],
  [
    "Meera Joshi",
    "Check treatment decision",
    "Tomorrow · 11:00 AM",
    "AS",
    "low",
  ],
];

const plans = [
  {
    id: "starter",
    name: "Starter",
    description:
      "Single-doctor practices getting their enquiries out of WhatsApp and into one place.",
    price: "$59",
    monthly: "/month",
    yearly: "$708 billed yearly",
    saving: "",
    icon: "patient",
    features: [
      "Leads, enquiries and pipeline",
      "Shared WhatsApp inbox",
      "GST invoices and payment links",
      "1 lead capture form",
    ],
    contacts: "1,000",
    doctors: "3 / 1",
    whatsapp: "1,000 / mo",
  },
  {
    id: "growth",
    name: "Growth",
    popular: true,
    description:
      "The plan most clinics run on — campaigns, AI replies and team accountability.",
    price: "$79",
    monthly: "/month",
    yearly: "$948 billed yearly",
    saving: "",
    icon: "trend",
    features: [
      "Everything in Starter, plus",
      "WhatsApp campaigns and templates",
      "WhatsApp AI assistant",
      "Team performance and full reports",
      "Google and Meta lead-ad sync",
    ],
    contacts: "5,000",
    doctors: "10 / 5",
    whatsapp: "20,000 / mo",
  },
  {
    id: "scale",
    name: "Scale",
    description:
      "Multi-branch and multi-speciality groups that need routing, roles and an API.",
    price: "$99",
    monthly: "/month",
    yearly: "$1,188 billed yearly",
    saving: "",
    icon: "integration",
    features: [
      "Everything in Growth, plus",
      "Website AI chat widget",
      "Branch routing and branch reports",
      "Custom roles and permissions",
      "Tally / Zoho sync, API and webhooks",
    ],
    contacts: "25,000",
    doctors: "30 / 20",
    whatsapp: "75,000 / mo",
  },
  {
    id: "enterprise",
    name: "Custom",
    description:
      "Hospital groups with procurement, compliance and integration requirements.",
    price: "Custom",
    monthly: "",
    yearly: "Priced on locations and volume",
    saving: "",
    icon: "settings",
    features: [
      "Everything in Scale, plus",
      "SSO / SAML and audit log",
      "Data residency and signed DPA",
      "99.9% uptime SLA",
      "White-label and custom integrations",
    ],
    contacts: "Unlimited",
    doctors: "Unlimited",
    whatsapp: "Custom",
  },
];

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

function ChoosePlan({
  user,
  selectedPlan,
  onContinue,
}) {
  const fullName = user?.name
    ? user.name.trim()
    : "there";

  const planName =
    selectedPlan?.name ||
    "Your Sale Vitals CRM";

  return (
    <div className="choose-plan-page">
      <div className="crm-activation-wrap">

        <div className="crm-activation-status">
          <span className="crm-status-dot" />

          <span>
            CRM ACTIVATION IN PROGRESS
          </span>
        </div>

        <div className="crm-activation-card">

          <div className="crm-activation-icon">
            <Icon
              name="check"
              size={30}
            />
          </div>

          <div className="crm-activation-content">

            <p className="dash-breadcrumb">
              Welcome to Vitals
            </p>

            <h1>
              Welcome, {fullName}.
            </h1>

            <p className="crm-main-message">
              Your CRM workspace is currently
              being prepared and activated for you.
            </p>

            <p className="crm-sub-message">
              Our team is setting up your workspace
              so everything is ready for your clinic.
              One of our onboarding specialists will
              contact you soon to complete the activation
              and help you get started.
            </p>

            <div className="crm-selected-plan">

              <div className="crm-selected-plan-left">

                <span className="crm-plan-small-label">
                  YOUR CRM PLAN
                </span>

                <strong>
                  {planName}
                </strong>

              </div>

              <div className="crm-plan-active">
                <span />
                Activation pending
              </div>

            </div>

            <div className="crm-steps">

              <div className="crm-step completed">

                <div className="crm-step-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Account created
                  </strong>

                  <span>
                    Your Vitals account has been created
                    successfully.
                  </span>
                </div>

              </div>

              <div className="crm-step active">

                <div className="crm-step-icon">
                  <span />
                </div>

                <div>
                  <strong>
                    Workspace setup
                  </strong>

                  <span>
                    We are preparing your CRM workspace
                    and account configuration.
                  </span>
                </div>

              </div>

              <div className="crm-step">

                <div className="crm-step-icon">
                  3
                </div>

                <div>
                  <strong>
                    Onboarding & activation
                  </strong>

                  <span>
                    Our team will contact you within
                    24 hours to complete your setup.
                  </span>
                </div>

              </div>

            </div>

            <div className="crm-info-box">

              <div className="crm-info-icon">
                <Icon
                  name="help"
                  size={18}
                />
              </div>

              <p>
                Please keep an eye on your registered
                email and phone number. Our team will
                contact you shortly to help you get
                your CRM up and running.
              </p>

            </div>

            <p className="crm-support-text">
              Need help?

              <button type="button">
                Contact our support team
              </button>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

function ActualDashboardContent({ user }) {
  const firstName = user?.name
    ? user.name.trim().split(/\s+/)[0]
    : "there";

  return (
    <>
      <div className="dash-page-head">

        <div>

          <p className="dash-breadcrumb">
            Overview
          </p>

          <h1>
            Good morning, {firstName}.
          </h1>

          <p className="dash-subtitle">
            Here’s what’s happening with your clinic today.
          </p>

        </div>

        <div className="dash-head-actions">

          <button className="dash-btn">

            <Icon
              name="calendar"
              size={16}
            />

            Aug 31 – Sep 6

            <Icon
              name="chevron"
              size={14}
            />

          </button>

          <button className="dash-btn primary">

            <Icon
              name="plus"
              size={16}
            />

            Add lead

          </button>

        </div>

      </div>

      <div className="dash-kpis">

        {kpis.map((kpi) => (

          <div
            className="dash-kpi"
            key={kpi.label}
          >

            <div
              className={`dash-kpi-icon ${kpi.tone}`}
            >

              <Icon
                name={kpi.icon}
                size={17}
              />

            </div>

            <div className="dash-kpi-label">
              {kpi.label}
            </div>

            <div className="dash-kpi-value">
              {kpi.value}
            </div>

            <span className="dash-kpi-change">
              ↑ {kpi.change}
            </span>

            <span className="dash-kpi-period">
              vs last 7 days
            </span>

          </div>

        ))}

      </div>

      <div className="dash-grid-two">

        <section className="dash-card performance-card">

          <div className="dash-card-head">

            <div>

              <h2>
                Lead performance
              </h2>

              <p>
                Captured vs qualified over the last 7 days
              </p>

            </div>

            <button className="dash-card-action">

              Last 7 days

              <Icon
                name="chevron"
                size={14}
              />

            </button>

          </div>

          <div className="dash-chart">

            <div className="dash-y-labels">
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>

            <div className="dash-chart-area">

              {[0, 1, 2, 3, 4].map(
                (i) => (
                  <i
                    className="dash-grid-line"
                    style={{
                      top: `${i * 25}%`,
                    }}
                    key={i}
                  />
                )
              )}

              <div className="dash-bars">

                {[
                  ["Mon", 210, 126],
                  ["Tue", 285, 174],
                  ["Wed", 248, 155],
                  ["Thu", 332, 188],
                  ["Fri", 304, 201],
                  ["Sat", 356, 224],
                  ["Sun", 294, 198],
                ].map(
                  ([day, a, b]) => (
                    <div
                      className="dash-bar-day"
                      key={day}
                    >

                      <div className="dash-bar-stack">

                        <span
                          style={{
                            height: `${a / 4}px`,
                          }}
                        />

                        <span
                          style={{
                            height: `${b / 4}px`,
                          }}
                        />

                      </div>

                      <small>
                        {day}
                      </small>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

          <div className="dash-legend">

            <span>
              <i className="blue" />
              Leads captured
            </span>

            <span>
              <i className="purple" />
              Qualified
            </span>

          </div>

        </section>

        <section className="dash-card">

          <div className="dash-card-head">

            <div>

              <h2>
                Lead sources
              </h2>

              <p>
                Where your enquiries are coming from
              </p>

            </div>

            <button className="dash-card-action">

              View report

              <Icon
                name="arrow"
                size={14}
              />

            </button>

          </div>

          <div className="dash-source-list">

            {sources.map(
              ([name, count, pct, tone]) => (

                <div
                  className="dash-source-row"
                  key={name}
                >

                  <span
                    className={`dash-source-dot ${tone}`}
                  />

                  <span className="dash-source-name">
                    {name}
                  </span>

                  <strong>
                    {count}
                  </strong>

                  <small>
                    {pct}
                  </small>

                </div>

              )
            )}

          </div>

        </section>

      </div>

      <section className="dash-card dash-pipeline-card">

        <div className="dash-card-head">

          <div>

            <h2>
              Pipeline overview
            </h2>

            <p>
              64 leads across 8 stages
            </p>

          </div>

          <button className="dash-btn">

            <Icon
              name="pipeline"
              size={16}
            />

            Open pipeline

          </button>

        </div>

        <div className="dash-pipeline-scroll">

          <div className="dash-pipeline">

            {pipeline.map(
              ([name, count, tone]) => (

                <div
                  className="dash-pipeline-stage"
                  key={name}
                >

                  <div className="dash-stage-title">

                    <i className={tone} />

                    {name}

                  </div>

                  <strong>
                    {count}
                  </strong>

                  <div className="dash-stage-meter">

                    <i
                      className={tone}
                      style={{
                        width: `${Math.max(
                          22,
                          (count / 19) * 100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      </section>

      <div className="dash-grid-two lower">

        <section className="dash-card">

          <div className="dash-card-head">

            <div>

              <h2>
                Recent leads
              </h2>

              <p>
                Latest enquiries that need attention
              </p>

            </div>

            <button className="dash-card-action">

              View all

              <Icon
                name="arrow"
                size={14}
              />

            </button>

          </div>

          <div className="dash-table-wrap">

            <table className="dash-table">

              <thead>

                <tr>

                  <th>
                    Lead
                  </th>

                  <th>
                    Interest
                  </th>

                  <th>
                    Source
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Owner
                  </th>

                  <th>
                    Added
                  </th>

                </tr>

              </thead>

              <tbody>

                {leads.map(
                  (lead) => (

                    <tr
                      key={lead.name}
                    >

                      <td>

                        <div className="dash-lead">

                          <Avatar
                            initials={
                              lead.owner
                            }
                          />

                          <span>

                            <strong>
                              {lead.name}
                            </strong>

                            <small>
                              {lead.time}
                            </small>

                          </span>

                        </div>

                      </td>

                      <td>
                        {lead.type}
                      </td>

                      <td>
                        {lead.source}
                      </td>

                      <td>

                        <span
                          className={`dash-status ${lead.status
                            .toLowerCase()
                            .replace(
                              " ",
                              "-"
                            )}`}
                        >
                          {lead.status}
                        </span>

                      </td>

                      <td>
                        {lead.owner}
                      </td>

                      <td className="muted">
                        {lead.time}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

        <section className="dash-card">

          <div className="dash-card-head">

            <div>

              <h2>
                Today’s follow-ups
              </h2>

              <p>
                Keep your pipeline moving
              </p>

            </div>

            <button className="dash-card-action">

              Calendar

              <Icon
                name="arrow"
                size={14}
              />

            </button>

          </div>

          <div className="dash-follow-list">

            {followUps.map(
              ([
                name,
                subject,
                time,
                initials,
                priority,
              ]) => (

                <div
                  className="dash-follow"
                  key={name}
                >

                  <span
                    className={`dash-priority ${priority}`}
                  />

                  <Avatar
                    initials={initials}
                  />

                  <div className="grow">

                    <strong>
                      {name}
                    </strong>

                    <span>
                      {subject}
                    </span>

                    <small>
                      {time}
                    </small>

                  </div>

                  <button className="dash-more">
                    •••
                  </button>

                </div>

              )
            )}

          </div>

          <button className="dash-full-btn">

            View all follow-ups

            <Icon
              name="arrow"
              size={15}
            />

          </button>

        </section>

      </div>
    </>
  );
}

export default function Dashboard() {

  const [active, setActive] =
    useState("Dashboard");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [user, setUser] =
    useState(null);

  const [showPlans, setShowPlans] =
    useState(true);

  useEffect(() => {

    const savedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

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

    const planPurchased =
      localStorage.getItem(
        "planPurchased"
      ) === "true";

    setShowPlans(!planPurchased);

  }, []);

  const selectNav = (name) => {

    setActive(name);
    setMobileOpen(false);
    setProfileOpen(false);

  };

  const handleChoosePlan = (plan) => {

    const numericPrice =
      plan.id === "starter"
        ? 59
        : plan.id === "growth"
          ? 79
          : plan.id === "scale"
            ? 99
            : 0;

    const selectedPlan = {
      ...plan,
      currency: "USD",
      numericPrice: numericPrice,
      billing: "monthly",
    };

    localStorage.setItem(
      "selectedPlan",
      JSON.stringify(selectedPlan)
    );

    window.location.href = "/cart";
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

    <div className="dashboard-shell">

      <aside
        className={`dash-sidebar ${
          mobileOpen ? "open" : ""
        }`}
      >

        <Brand />

        <button className="dash-add-new">

          <Icon
            name="plus"
            size={18}
          />

          Add New

          <Icon
            name="chevron"
            size={15}
          />

        </button>

        <nav className="dash-nav">

          <button
            className={`dash-nav-item ${
              active === "Dashboard"
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

          {navGroups.map(
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
                      className={`dash-nav-item ${
                        active === name
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

                      {count && (
                        <em
                          className={
                            countTone ===
                              "hot"
                              ? "hot"
                              : ""
                          }
                        >
                          {count}
                        </em>
                      )}

                    </button>

                  )
                )}

              </div>

            )
          )}

        </nav>

        <div className="dash-plan">

          <div className="dash-plan-top">

            <strong>
              {showPlans
                ? "Choose your plan"
                : "Active plan"}
            </strong>

            <span>
              {showPlans
                ? "Get started"
                : "Active"}
            </span>

          </div>

          <div className="dash-plan-copy">

            {showPlans
              ? "Choose a plan to unlock your workspace"
              : "Your Vitals workspace is active"}

          </div>

          <div className="dash-plan-bar">

            <i
              style={{
                width: showPlans
                  ? "0%"
                  : "100%",
              }}
            />

          </div>

          <button
            type="button"
            onClick={() => {

              setShowPlans(true);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });

            }}
          >

            {showPlans
              ? "Choose plan"
              : "Manage plan"}

          </button>

        </div>

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

          <button className="dash-search">

            <Icon
              name="search"
              size={18}
            />

            <span>
              Search patients, leads, invoices…
            </span>

            <kbd>
              ⌘K
            </kbd>

          </button>

          <div className="dash-top-actions">

            <div className="dash-wa-live">

              <i />

              WhatsApp live

            </div>

            <button className="dash-icon-btn">

              <Icon
                name="help"
                size={17}
              />

            </button>

            <button className="dash-icon-btn notification">

              <Icon
                name="bell"
                size={18}
              />

              <b>
                4
              </b>

            </button>

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

          {active === "Settings" ? (

            <Settings
              user={user}
            />

          ) : showPlans ? (

            <ChoosePlan
              user={user}
              onContinue={
                handleChoosePlan
              }
            />

          ) : (

            <ActualDashboardContent
              user={user}
            />

          )}

        </section>

      </main>

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

        <button
          className={
            active === "Pipeline"
              ? "on"
              : ""
          }
          onClick={() =>
            selectNav("Pipeline")
          }
        >

          <Icon
            name="pipeline"
            size={18}
          />

          <span>
            Pipeline
          </span>

        </button>

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
  );
}