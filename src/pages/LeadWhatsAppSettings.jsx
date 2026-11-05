
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../config/api";
import "../styles/lead-whatsapp-settings.scss";

const DEFAULT_SETTINGS = {
  enabled: false,
  recipientNumber: "",
  scheduleMode: "custom",
  startTime: "19:00",
  endTime: "10:00",
  timezone: "Asia/Kolkata",
  country: "",
  leadSources: ["Website", "Meta", "AI Chat", "Google Ads"],
  sendOutsideWindow: false,
};

const LEAD_SOURCES = [
  {
    name: "Website",
    description: "Leads from your website",
    icon: "◎",
    color: "#0d9488",
    background: "#effcf9",
    border: "#b7eee4",
  },
  {
    name: "Meta",
    description: "Leads from Facebook and Instagram",
    icon: "f",
    color: "#1877f2",
    background: "#f0f6ff",
    border: "#c7dcff",
  },
  {
    name: "AI Chat",
    description: "Leads from AI Assistant",
    icon: "✦",
    color: "#f08a19",
    background: "#fff8ef",
    border: "#ffdfb3",
  },
  {
    name: "Google Ads",
    description: "Leads from Google advertising",
    icon: "G",
    color: "#4285f4",
    background: "#f0f6ff",
    border: "#c7dcff",
  },
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

const COUNTRIES = [
  ["Afghanistan", "Asia/Kabul"],
  ["Albania", "Europe/Tirane"],
  ["Algeria", "Africa/Algiers"],
  ["Andorra", "Europe/Andorra"],
  ["Angola", "Africa/Lagos"],
  ["Antigua and Barbuda", "America/Antigua"],
  ["Argentina", "America/Argentina/Buenos_Aires"],
  ["Armenia", "Asia/Yerevan"],
  ["Australia", "Australia/Sydney"],
  ["Austria", "Europe/Vienna"],
  ["Azerbaijan", "Asia/Baku"],
  ["Bahamas", "America/Nassau"],
  ["Bahrain", "Asia/Bahrain"],
  ["Bangladesh", "Asia/Dhaka"],
  ["Barbados", "America/Barbados"],
  ["Belarus", "Europe/Minsk"],
  ["Belgium", "Europe/Brussels"],
  ["Belize", "America/Belize"],
  ["Benin", "Africa/Lagos"],
  ["Bhutan", "Asia/Thimphu"],
  ["Bolivia", "America/La_Paz"],
  ["Bosnia and Herzegovina", "Europe/Sarajevo"],
  ["Botswana", "Africa/Johannesburg"],
  ["Brazil", "America/Sao_Paulo"],
  ["Brunei", "Asia/Brunei"],
  ["Bulgaria", "Europe/Sofia"],
  ["Burkina Faso", "Africa/Abidjan"],
  ["Burundi", "Africa/Johannesburg"],
  ["Cambodia", "Asia/Phnom_Penh"],
  ["Cameroon", "Africa/Lagos"],
  ["Canada", "America/Toronto"],
  ["Cape Verde", "Atlantic/Cape_Verde"],
  ["Central African Republic", "Africa/Lagos"],
  ["Chad", "Africa/Ndjamena"],
  ["Chile", "America/Santiago"],
  ["China", "Asia/Shanghai"],
  ["Colombia", "America/Bogota"],
  ["Comoros", "Indian/Comoro"],
  ["Costa Rica", "America/Costa_Rica"],
  ["Croatia", "Europe/Zagreb"],
  ["Cuba", "America/Havana"],
  ["Cyprus", "Asia/Nicosia"],
  ["Czechia", "Europe/Prague"],
  ["Democratic Republic of the Congo", "Africa/Johannesburg"],
  ["Denmark", "Europe/Copenhagen"],
  ["Djibouti", "Africa/Nairobi"],
  ["Dominica", "America/Dominica"],
  ["Dominican Republic", "America/Santo_Domingo"],
  ["East Timor", "Asia/Dili"],
  ["Ecuador", "America/Guayaquil"],
  ["Egypt", "Africa/Cairo"],
  ["El Salvador", "America/El_Salvador"],
  ["Equatorial Guinea", "Africa/Lagos"],
  ["Eritrea", "Africa/Nairobi"],
  ["Estonia", "Europe/Tallinn"],
  ["Eswatini", "Africa/Johannesburg"],
  ["Ethiopia", "Africa/Nairobi"],
  ["Fiji", "Pacific/Fiji"],
  ["Finland", "Europe/Helsinki"],
  ["France", "Europe/Paris"],
  ["Gabon", "Africa/Lagos"],
  ["Gambia", "Africa/Abidjan"],
  ["Georgia", "Asia/Tbilisi"],
  ["Germany", "Europe/Berlin"],
  ["Ghana", "Africa/Abidjan"],
  ["Greece", "Europe/Athens"],
  ["Grenada", "America/Grenada"],
  ["Guatemala", "America/Guatemala"],
  ["Guinea", "Africa/Abidjan"],
  ["Guinea-Bissau", "Africa/Bissau"],
  ["Guyana", "America/Guyana"],
  ["Haiti", "America/Port-au-Prince"],
  ["Honduras", "America/Tegucigalpa"],
  ["Hungary", "Europe/Budapest"],
  ["Iceland", "Atlantic/Reykjavik"],
  ["India", "Asia/Kolkata"],
  ["Indonesia", "Asia/Jakarta"],
  ["Iran", "Asia/Tehran"],
  ["Iraq", "Asia/Baghdad"],
  ["Ireland", "Europe/Dublin"],
  ["Israel", "Asia/Jerusalem"],
  ["Italy", "Europe/Rome"],
  ["Ivory Coast", "Africa/Abidjan"],
  ["Jamaica", "America/Jamaica"],
  ["Japan", "Asia/Tokyo"],
  ["Jordan", "Asia/Amman"],
  ["Kazakhstan", "Asia/Almaty"],
  ["Kenya", "Africa/Nairobi"],
  ["Kiribati", "Pacific/Tarawa"],
  ["Kuwait", "Asia/Kuwait"],
  ["Kyrgyzstan", "Asia/Bishkek"],
  ["Laos", "Asia/Vientiane"],
  ["Latvia", "Europe/Riga"],
  ["Lebanon", "Asia/Beirut"],
  ["Lesotho", "Africa/Johannesburg"],
  ["Liberia", "Africa/Monrovia"],
  ["Libya", "Africa/Tripoli"],
  ["Liechtenstein", "Europe/Vienna"],
  ["Lithuania", "Europe/Vilnius"],
  ["Luxembourg", "Europe/Luxembourg"],
  ["Madagascar", "Indian/Antananarivo"],
  ["Malawi", "Africa/Maputo"],
  ["Malaysia", "Asia/Kuala_Lumpur"],
  ["Maldives", "Indian/Maldives"],
  ["Mali", "Africa/Abidjan"],
  ["Malta", "Europe/Malta"],
  ["Marshall Islands", "Pacific/Majuro"],
  ["Mauritania", "Africa/Nouakchott"],
  ["Mauritius", "Indian/Mauritius"],
  ["Mexico", "America/Mexico_City"],
  ["Micronesia", "Pacific/Chuuk"],
  ["Moldova", "Europe/Chisinau"],
  ["Monaco", "Europe/Monaco"],
  ["Mongolia", "Asia/Ulaanbaatar"],
  ["Montenegro", "Europe/Belgrade"],
  ["Morocco", "Africa/Casablanca"],
  ["Mozambique", "Africa/Maputo"],
  ["Myanmar", "Asia/Yangon"],
  ["Namibia", "Africa/Windhoek"],
  ["Nauru", "Pacific/Nauru"],
  ["Nepal", "Asia/Kathmandu"],
  ["Netherlands", "Europe/Amsterdam"],
  ["New Zealand", "Pacific/Auckland"],
  ["Nicaragua", "America/Managua"],
  ["Niger", "Africa/Lagos"],
  ["Nigeria", "Africa/Lagos"],
  ["North Korea", "Asia/Pyongyang"],
  ["North Macedonia", "Europe/Skopje"],
  ["Norway", "Europe/Oslo"],
  ["Oman", "Asia/Muscat"],
  ["Pakistan", "Asia/Karachi"],
  ["Palau", "Pacific/Palau"],
  ["Palestine", "Asia/Gaza"],
  ["Panama", "America/Panama"],
  ["Papua New Guinea", "Pacific/Port_Moresby"],
  ["Paraguay", "America/Asuncion"],
  ["Peru", "America/Lima"],
  ["Philippines", "Asia/Manila"],
  ["Poland", "Europe/Warsaw"],
  ["Portugal", "Europe/Lisbon"],
  ["Qatar", "Asia/Qatar"],
  ["Republic of the Congo", "Africa/Lagos"],
  ["Romania", "Europe/Bucharest"],
  ["Russia", "Europe/Moscow"],
  ["Rwanda", "Africa/Kigali"],
  ["Saint Kitts and Nevis", "America/St_Kitts"],
  ["Saint Lucia", "America/St_Lucia"],
  ["Saint Vincent and the Grenadines", "America/St_Vincent"],
  ["Samoa", "Pacific/Apia"],
  ["San Marino", "Europe/Rome"],
  ["Sao Tome and Principe", "Africa/Sao_Tome"],
  ["Saudi Arabia", "Asia/Riyadh"],
  ["Senegal", "Africa/Dakar"],
  ["Serbia", "Europe/Belgrade"],
  ["Seychelles", "Indian/Mahe"],
  ["Sierra Leone", "Africa/Freetown"],
  ["Singapore", "Asia/Singapore"],
  ["Slovakia", "Europe/Bratislava"],
  ["Slovenia", "Europe/Ljubljana"],
  ["Solomon Islands", "Pacific/Guadalcanal"],
  ["Somalia", "Africa/Mogadishu"],
  ["South Africa", "Africa/Johannesburg"],
  ["South Korea", "Asia/Seoul"],
  ["South Sudan", "Africa/Juba"],
  ["Spain", "Europe/Madrid"],
  ["Sri Lanka", "Asia/Colombo"],
  ["Sudan", "Africa/Khartoum"],
  ["Suriname", "America/Paramaribo"],
  ["Sweden", "Europe/Stockholm"],
  ["Switzerland", "Europe/Zurich"],
  ["Syria", "Asia/Damascus"],
  ["Taiwan", "Asia/Taipei"],
  ["Tajikistan", "Asia/Dushanbe"],
  ["Tanzania", "Africa/Dar_es_Salaam"],
  ["Thailand", "Asia/Bangkok"],
  ["Togo", "Africa/Abidjan"],
  ["Tonga", "Pacific/Tongatapu"],
  ["Trinidad and Tobago", "America/Port_of_Spain"],
  ["Tunisia", "Africa/Tunis"],
  ["Turkey", "Europe/Istanbul"],
  ["Turkmenistan", "Asia/Ashgabat"],
  ["Tuvalu", "Pacific/Funafuti"],
  ["Uganda", "Africa/Kampala"],
  ["Ukraine", "Europe/Kyiv"],
  ["United Arab Emirates", "Asia/Dubai"],
  ["United Kingdom", "Europe/London"],
  ["United States", "America/New_York"],
  ["Uruguay", "America/Montevideo"],
  ["Uzbekistan", "Asia/Tashkent"],
  ["Vanuatu", "Pacific/Efate"],
  ["Vatican City", "Europe/Vatican"],
  ["Venezuela", "America/Caracas"],
  ["Vietnam", "Asia/Ho_Chi_Minh"],
  ["Yemen", "Asia/Aden"],
  ["Zambia", "Africa/Maputo"],
  ["Zimbabwe", "Africa/Harare"],
];

const supportedTimezones =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : TIMEZONES;

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
      <div className="sv-lw-section-icon" aria-hidden="true">
        {icon}
      </div>
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
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load WhatsApp settings."
          );
        }

        if (!cancelled) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...(data.settings || {}),
            leadSources: Array.isArray(data.settings?.leadSources)
              ? data.settings.leadSources
              : DEFAULT_SETTINGS.leadSources,
            scheduleMode:
              data.settings?.scheduleMode === "custom"
                ? "custom"
                : data.settings?.scheduleMode === "all_day" ||
              data.settings?.scheduleMode === "24_hours" ||
              data.settings?.sendOutsideWindow === true
                ? "all_day"
                : "custom",
            sendOutsideWindow:
              data.settings?.sendOutsideWindow === true,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSetting = (field, value) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));

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

    if (
      settings.scheduleMode === "custom" &&
      settings.startTime === settings.endTime
    ) {
      setError("Start Time and End Time cannot be the same.");
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
        throw new Error(
          data.message || "Unable to save settings."
        );
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data.settings,
        leadSources: Array.isArray(data.settings?.leadSources)
          ? data.settings.leadSources
          : DEFAULT_SETTINGS.leadSources,
        scheduleMode:
          data.settings?.scheduleMode === "custom"
            ? "custom"
            : data.settings?.scheduleMode === "all_day" ||
          data.settings?.scheduleMode === "24_hours" ||
          data.settings?.sendOutsideWindow === true
            ? "all_day"
            : "custom",
        sendOutsideWindow:
          data.settings?.sendOutsideWindow === true,
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
        <div className="sv-lw-main-icon" aria-hidden="true">
          ◉
        </div>

        <div>
          <h2 className="sv-lw-title">
            WhatsApp Lead Notifications
          </h2>
          <p className="sv-lw-subtitle">
            Receive WhatsApp alerts when new leads arrive in your CRM.
            Stay updated and never miss an opportunity.
          </p>
        </div>
      </div>

      {error && (
        <div className="sv-lw-message sv-lw-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="sv-lw-message sv-lw-success" role="status">
          ✓ {success}
        </div>
      )}

      <form onSubmit={saveSettings}>
        <section className="sv-lw-enable">
          <div className="sv-lw-enable-content">
            <div className="sv-lw-enable-icon" aria-hidden="true">
              ◉
            </div>

            <div>
              <strong>Enable lead notifications</strong>
              <p>
                Turn automatic WhatsApp lead alerts on or off.
                When enabled, you can receive alerts for new leads.
              </p>

              <span
                className={
                  settings.enabled
                    ? "sv-lw-status active"
                    : "sv-lw-status"
                }
              >
                {settings.enabled ? "● Enabled" : "○ Disabled"}
              </span>
            </div>
          </div>

          <label className="sv-lw-switch">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                updateSetting("enabled", event.target.checked)
              }
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
              <label htmlFor="sv-lw-recipient">
                WhatsApp Number
                <input
                  id="sv-lw-recipient"
                  type="tel"
                  value={settings.recipientNumber}
                  onChange={(event) =>
                    updateSetting("recipientNumber", event.target.value)
                  }
                  placeholder="919876543210"
                  autoComplete="tel"
                />
              </label>
              <small>Include country code, e.g. 91 for India.</small>
            </div>

            {settings.scheduleMode === "custom" && (
              <>
                <div className="sv-lw-field">
              <label htmlFor="sv-lw-country">
                Country
                <input
                  id="sv-lw-country"
                  type="text"
                  list="sv-lw-countries"
                  value={settings.country || ""}
                  onChange={(event) => {
                    const country = event.target.value;
                    const suggested = COUNTRIES.find(
                      ([name]) => name.toLowerCase() === country.toLowerCase()
                    );
                    setSettings((previous) => ({
                      ...previous,
                      country,
                      timezone: suggested ? suggested[1] : previous.timezone,
                    }));
                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Search country"
                  autoComplete="country-name"
                />
                <datalist id="sv-lw-countries">
                  {COUNTRIES.map(([name]) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>
                </div>

                <div className="sv-lw-field">
              <label htmlFor="sv-lw-timezone">
                Timezone
                <input
                  id="sv-lw-timezone"
                  type="text"
                  list="sv-lw-timezones"
                  value={settings.timezone}
                  onChange={(event) =>
                    updateSetting("timezone", event.target.value)
                  }
                  placeholder="Search IANA timezone"
                />
                <datalist id="sv-lw-timezones">
                  {[...new Set([...TIMEZONES, ...supportedTimezones])].map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </datalist>
              </label>
            </div>
              </>
            )}
          </div>

          <div className="sv-lw-schedule-options" role="radiogroup" aria-label="Notification schedule">
            <label className={`sv-lw-all-day ${settings.scheduleMode === "all_day" ? "is-active" : ""}`}>
              <input
                type="radio"
                name="notification-schedule"
                checked={settings.scheduleMode === "all_day"}
                onChange={() => updateSetting("scheduleMode", "all_day")}
              />
              <span className="sv-lw-all-day-copy">
                <strong>24 Hours (All Day)</strong>
                <small>Receive WhatsApp alerts at any time in every country.</small>
              </span>
            </label>
            <label className={`sv-lw-all-day ${settings.scheduleMode === "custom" ? "is-active" : ""}`}>
              <input
                type="radio"
                name="notification-schedule"
                checked={settings.scheduleMode === "custom"}
                onChange={() => updateSetting("scheduleMode", "custom")}
              />
              <span className="sv-lw-all-day-copy">
                <strong>Custom Time</strong>
                <small>Receive alerts only during a local time window.</small>
              </span>
            </label>
          </div>

          <div
            className={`sv-lw-fields sv-lw-time-fields ${
              settings.scheduleMode === "all_day" ? "is-disabled" : ""
            }`}
          >
            <div className="sv-lw-field">
              <label htmlFor="sv-lw-start-time">
                Start Time
                <input
                  id="sv-lw-start-time"
                  type="time"
                  value={settings.startTime}
                  onChange={(event) =>
                    updateSetting("startTime", event.target.value)
                  }
                  disabled={settings.scheduleMode === "all_day"}
                  required={settings.scheduleMode === "custom"}
                />
              </label>
            </div>

            <div className="sv-lw-field">
              <label htmlFor="sv-lw-end-time">
                End Time
                <input
                  id="sv-lw-end-time"
                  type="time"
                  value={settings.endTime}
                  onChange={(event) =>
                    updateSetting("endTime", event.target.value)
                  }
                  disabled={settings.scheduleMode === "all_day"}
                  required={settings.scheduleMode === "custom"}
                />
              </label>
            </div>
          </div>

          <p className="sv-lw-schedule-hint">
            {settings.scheduleMode === "all_day"
              ? "Notifications can be sent throughout the day and night."
              : "Notifications are sent only during your selected time window."}
          </p>
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
                    boxShadow: selected
                      ? `inset 0 0 0 1px ${source.border}`
                      : "none",
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
                    <span className="sv-lw-source-name">
                      {source.name}
                    </span>
                    <span className="sv-lw-source-description">
                      {source.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="sv-lw-actions">
            <button
              type="submit"
              className="sv-lw-save"
              disabled={saving}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                <path d="M17 21v-8H7v8" />
                <path d="M7 3v5h8" />
              </svg>

              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
