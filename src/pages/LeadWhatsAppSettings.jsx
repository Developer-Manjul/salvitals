
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../config/api";
import "../styles/lead-whatsapp-settings.scss";

const DEFAULT_SETTINGS = {
  enabled: false,
  recipientNumber: "",
  startTime: "19:00",
  endTime: "10:00",
  timezone: "Asia/Kolkata",
  leadSources: ["Website", "Facebook", "Instagram", "AI Chat"],
  sendOutsideWindow: false,
};

const LEAD_SOURCES = [
  { name: "Website", description: "Leads from your website", icon: "◎", color: "#0d9488", background: "#effcf9", border: "#b7eee4" },
  { name: "Facebook", description: "Leads from Facebook", icon: "f", color: "#1877f2", background: "#f0f6ff", border: "#c7dcff" },
  { name: "Instagram", description: "Leads from Instagram", icon: "◎", color: "#c026d3", background: "#fff4fc", border: "#f5c7ed" },
  { name: "AI Chat", description: "Leads from AI Assistant", icon: "✦", color: "#f08a19", background: "#fff8ef", border: "#ffdfb3" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

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

function SectionHeading({ icon, title, description }) {
  return (
    <div className="sv-lw-section-heading">
      <div className="sv-lw-section-icon" aria-hidden="true">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function LeadWhatsAppSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${getApiBaseUrl()}/api/lead-whatsapp/settings`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${getToken()}` },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load WhatsApp settings.");
        }

        if (!cancelled) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...(data.settings || {}),
            leadSources: Array.isArray(data.settings?.leadSources)
              ? data.settings.leadSources
              : DEFAULT_SETTINGS.leadSources,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSetting = (field, value) => {
    setSettings((previous) => ({ ...previous, [field]: value }));
    setError("");
    setSuccess("");
  };

  const toggleSource = (source) => {
    setSettings((previous) => ({
      ...previous,
      leadSources: previous.leadSources.includes(source)
        ? previous.leadSources.filter((item) => item !== source)
        : [...previous.leadSources, source],
    }));
    setError("");
    setSuccess("");
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (settings.enabled && !settings.recipientNumber.trim()) {
      setError("Enter the WhatsApp recipient number.");
      return;
    }

    if (settings.leadSources.length === 0) {
      setError("Select at least one lead source.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${getApiBaseUrl()}/api/lead-whatsapp/settings`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save settings.");
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data.settings,
        leadSources: Array.isArray(data.settings?.leadSources)
          ? data.settings.leadSources
          : DEFAULT_SETTINGS.leadSources,
      });

      setSuccess("WhatsApp lead notification settings saved.");
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sv-lw-loading">
        Loading WhatsApp lead notification settings...
      </div>
    );
  }

  return (
    <div className="sv-lead-whatsapp-page">
      <div className="sv-lw-header">
        <div className="sv-lw-main-icon" aria-hidden="true">◉</div>
        <div>
          <h2 className="sv-lw-title">WhatsApp Lead Notifications</h2>
          <p className="sv-lw-subtitle">
            Receive WhatsApp alerts when new leads arrive in your CRM.
            Stay updated and never miss an opportunity.
          </p>
        </div>
      </div>

      {error && <div className="sv-lw-message sv-lw-error" role="alert">{error}</div>}
      {success && <div className="sv-lw-message sv-lw-success" role="status">✓ {success}</div>}

      <form onSubmit={saveSettings}>
        <section className="sv-lw-enable">
          <div className="sv-lw-enable-content">
            <div className="sv-lw-enable-icon" aria-hidden="true">◉</div>
            <div>
              <strong>Enable lead notifications</strong>
              <p>
                Turn automatic WhatsApp lead alerts on or off. When enabled,
                you can receive alerts for new leads.
              </p>
              <span className={settings.enabled ? "sv-lw-status active" : "sv-lw-status"}>
                {settings.enabled ? "● Enabled" : "○ Disabled"}
              </span>
            </div>
          </div>

          <label className="sv-lw-switch">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => updateSetting("enabled", event.target.checked)}
              aria-label="Enable WhatsApp lead notifications"
            />
            <span className="sv-lw-switch-track" />
          </label>
        </section>

        <section className="sv-lw-card">
          <SectionHeading
            icon="♙"
            title="Notification Details"
            description="Configure where and when you want to receive WhatsApp alerts."
          />

          <div className="sv-lw-fields">
            <div className="sv-lw-field">
              <label>
                Recipient WhatsApp number
                <input
                  type="tel"
                  value={settings.recipientNumber}
                  onChange={(event) => updateSetting("recipientNumber", event.target.value)}
                  placeholder="919876543210"
                  autoComplete="tel"
                />
              </label>
              <small>Include country code, e.g. 91 for India.</small>
            </div>

            <div className="sv-lw-field">
              <label>
                Timezone
                <select
                  value={settings.timezone}
                  onChange={(event) => updateSetting("timezone", event.target.value)}
                >
                  {!TIMEZONES.includes(settings.timezone) && (
                    <option value={settings.timezone}>{settings.timezone}</option>
                  )}
                  {TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>{timezone}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="sv-lw-field">
              <label>
                Notification start time
                <input
                  type="time"
                  value={settings.startTime}
                  onChange={(event) => updateSetting("startTime", event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="sv-lw-field">
              <label>
                Notification end time
                <input
                  type="time"
                  value={settings.endTime}
                  onChange={(event) => updateSetting("endTime", event.target.value)}
                  required
                />
              </label>
            </div>
          </div>
        </section>

        <section className="sv-lw-card">
          <SectionHeading
            icon="▽"
            title="Notify me about leads from"
            description="Select which lead sources should trigger notifications."
          />

          <div className="sv-lw-source-grid">
            {LEAD_SOURCES.map((source) => {
              const selected = settings.leadSources.includes(source.name);

              return (
                <label
                  key={source.name}
                  className="sv-lw-source"
                  style={{
                    background: selected ? source.background : "#fff",
                    borderColor: selected ? source.border : "#e1e9f3",
                    boxShadow: selected ? `inset 0 0 0 1px ${source.border}` : "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSource(source.name)}
                    aria-label={`Notify for ${source.name} leads`}
                  />
                  <span
                    className="sv-lw-source-icon"
                    style={{ background: source.color }}
                    aria-hidden="true"
                  >
                    {source.icon}
                  </span>
                  <span className="sv-lw-source-info">
                    <span className="sv-lw-source-name">{source.name}</span>
                    <span className="sv-lw-source-description">{source.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="sv-lw-queue">
            <div className="sv-lw-queue-icon" aria-hidden="true">◷</div>
            <input
              type="checkbox"
              checked={settings.sendOutsideWindow}
              onChange={(event) => updateSetting("sendOutsideWindow", event.target.checked)}
              aria-label="Handle leads received outside the time window"
            />
            <div>
              <strong>Handle leads received outside the time window</strong>
              <p>
                Queue these leads for the next notification window instead
                of sending them immediately.
              </p>
            </div>
          </div>

          <div className="sv-lw-actions">
            <button type="submit" className="sv-lw-save" disabled={saving}>
              <span aria-hidden="true">▣</span>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
