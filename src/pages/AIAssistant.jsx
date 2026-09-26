import { useEffect, useMemo, useState } from "react";
import { buildApiUrl, getApiBaseUrl } from "../config/api";
import "../styles/ai-assistant.scss";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("vitalsToken") ||
    ""
  );
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function AIIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 17.5L5 20V15.8C3.76 14.55 3 12.84 3 11C3 7.13 6.58 4 11 4H13C17.42 4 21 7.13 21 11C21 14.87 17.42 18 13 18H10.5L7.5 17.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16.5 7.5L17.15 9.35L19 10L17.15 10.65L16.5 12.5L15.85 10.65L14 10L15.85 9.35L16.5 7.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function normalizeColor(value) {
  const color = String(value || "").trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase();
  }

  return "#00656A";
}

export default function AIAssistant() {
  const [tab, setTab] = useState("settings");

  const [assistant, setAssistant] = useState(null);

  const [usage, setUsage] = useState({
    used: 0,
    limit: 0,
    remaining: 0,
  });

  const [plan, setPlan] = useState(null);

  const [form, setForm] = useState({
    assistantName: "AI Assistant",
    logoUrl: "",
    primaryColor: "#00656A",
    websiteUrl: "",
    welcomeMessage:
      "Hello 👋 Welcome! How can I help you today?",
    customInstructions: "",
    enabled: true,
  });

  const [knowledge, setKnowledge] = useState([]);

  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [conversationMessages, setConversationMessages] =
    useState([]);

  const [reply, setReply] = useState("");

  const [knowledgeForm, setKnowledgeForm] = useState({
    type: "faq",
    title: "",
    content: "",
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [crawling, setCrawling] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  

  const loadSettings = async () => {
    try {
      setError("");

      const data = await apiRequest(
        "/api/ai-assistant"
      );

      setAssistant(data.assistant);

      setForm({
        assistantName:
          data.assistant?.assistantName ||
          "AI Assistant",

        logoUrl:
          data.assistant?.logoUrl || "",

        primaryColor:
          normalizeColor(
            data.assistant?.primaryColor
          ),

        websiteUrl:
          data.assistant?.websiteUrl || "",

        welcomeMessage:
          data.assistant?.welcomeMessage ||
          "Hello 👋 Welcome! How can I help you today?",

        customInstructions:
          data.assistant?.customInstructions || "",

        enabled:
          data.assistant?.enabled !== false,
      });

      setUsage(
        data.usage || {
          used: 0,
          limit: 0,
          remaining: 0,
        }
      );

      setPlan(data.plan || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  

  const loadKnowledge = async () => {
    try {
      const data = await apiRequest(
        "/api/ai-knowledge"
      );

      setKnowledge(data.knowledge || []);
    } catch (err) {
      setError(err.message);
    }
  };

  

  const loadConversations = async () => {
    try {
      const data = await apiRequest(
        "/api/ai-conversations"
      );

      setConversations(
        data.conversations || []
      );
    } catch (err) {
      setError(err.message);
    }
  };

  

  useEffect(() => {
    loadSettings();
    loadKnowledge();
    loadConversations();
  }, []);

  

  useEffect(() => {
    if (tab !== "conversations") {
      return undefined;
    }

    const timer = setInterval(
      loadConversations,
      3000
    );

    return () => clearInterval(timer);
  }, [tab]);

  

  useEffect(() => {
    if (
      !selectedConversation?._id ||
      tab !== "conversations"
    ) {
      return undefined;
    }

    const timer = setInterval(
      async () => {
        try {
          const data = await apiRequest(
            `/api/ai-conversations/${selectedConversation._id}`
          );

          setSelectedConversation(
            data.conversation
          );

          setConversationMessages(
            data.messages || []
          );
        } catch (_) {

        }
      },
      2000
    );

    return () => clearInterval(timer);
  }, [
    selectedConversation?._id,
    tab,
  ]);

  

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const cleanedColor =
      normalizeColor(form.primaryColor);

    const payload = {
      ...form,
      primaryColor: cleanedColor,
    };

    try {
      const data = await apiRequest(
        "/api/ai-assistant",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setAssistant(data.assistant);

      setForm((previous) => ({
        ...previous,
        primaryColor:
          normalizeColor(
            data.assistant?.primaryColor ||
              cleanedColor
          ),
      }));

      setSuccess(
        "AI Assistant settings saved successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);

      await loadSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  

  const crawl = async () => {
    setCrawling(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(
        "/api/ai-knowledge/crawl",
        {
          method: "POST",
          body: JSON.stringify({
            websiteUrl: form.websiteUrl,
          }),
        }
      );

      setSuccess(
        data.message ||
          "Website synced successfully."
      );

      await loadKnowledge();
    } catch (err) {
      setError(err.message);
    } finally {
      setCrawling(false);
    }
  };

  

  const addKnowledge = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      await apiRequest(
        "/api/ai-knowledge",
        {
          method: "POST",
          body: JSON.stringify(
            knowledgeForm
          ),
        }
      );

      setKnowledgeForm({
        type: "faq",
        title: "",
        content: "",
      });

      await loadKnowledge();

      setSuccess(
        "Knowledge added successfully."
      );
    } catch (err) {
      setError(err.message);
    }
  };

  

  const deleteKnowledge = async (id) => {
    if (
      !window.confirm(
        "Delete this knowledge item?"
      )
    ) {
      return;
    }

    try {
      await apiRequest(
        `/api/ai-knowledge/${id}`,
        {
          method: "DELETE",
        }
      );

      await loadKnowledge();
    } catch (err) {
      setError(err.message);
    }
  };

  

  const openConversation = async (
    conversation
  ) => {
    try {
      const data = await apiRequest(
        `/api/ai-conversations/${conversation._id}`
      );

      setSelectedConversation(
        data.conversation
      );

      setConversationMessages(
        data.messages || []
      );

      await loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  

  const takeOver = async () => {
    if (!selectedConversation) {
      return;
    }

    try {
      const data = await apiRequest(
        `/api/ai-conversations/${selectedConversation._id}/take-over`,
        {
          method: "POST",
        }
      );

      setSelectedConversation(
        data.conversation
      );

      await loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  

  const sendHumanReply = async () => {
    if (
      !selectedConversation ||
      !reply.trim()
    ) {
      return;
    }

    try {
      const data = await apiRequest(
        `/api/ai-conversations/${selectedConversation._id}/reply`,
        {
          method: "POST",
          body: JSON.stringify({
            message: reply.trim(),
          }),
        }
      );

      setSelectedConversation(
        data.conversation
      );

      setConversationMessages(
        (previous) => [
          ...previous,
          data.message,
        ]
      );

      setReply("");

      await loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  

  const closeConversation = async () => {
    if (!selectedConversation) {
      return;
    }

    try {
      const data = await apiRequest(
        `/api/ai-conversations/${selectedConversation._id}/close`,
        {
          method: "POST",
        }
      );

      setSelectedConversation(
        data.conversation
      );

      await loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  

  const widgetUrl = `${getApiBaseUrl()}/api/ai-widget/script.js?assistantId=${
    assistant?._id ||
    "YOUR_ASSISTANT_ID"
  }`;

  const embedCode = `<script src="${widgetUrl}" data-assistant="${
    assistant?._id ||
    "YOUR_ASSISTANT_ID"
  }"></script>`;

  

  const usagePercent = usage.limit
    ? Math.min(
        (usage.used / usage.limit) * 100,
        100
      )
    : 0;

  

  const knowledgeSummary = useMemo(() => {
    return {
      website: knowledge.filter(
        (item) =>
          item.type === "website"
      ).length,

      faq: knowledge.filter(
        (item) =>
          item.type === "faq"
      ).length,

      service: knowledge.filter(
        (item) =>
          item.type === "service"
      ).length,

      custom: knowledge.filter(
        (item) =>
          item.type === "custom"
      ).length,
    };
  }, [knowledge]);

  

  const previewColor =
    normalizeColor(
      form.primaryColor
    );

  

  if (loading) {
    return (
      <div className="ai-assistant-loading">
        Loading AI Assistant...
      </div>
    );
  }

  

  return (
    <div className="ai-assistant-page">

      {}

      <div className="ai-assistant-header">

        <div>
          <div className="ai-assistant-breadcrumb">
            Engage <span>/</span> AI Assistant
          </div>

          <h1>
            AI Assistant
          </h1>

          <p>
            Configure your website AI assistant,
            knowledge and visitor conversations.
          </p>
        </div>

        <div className="ai-header-status">

          <span
            className={`ai-status-dot ${
              form.enabled
                ? "active"
                : ""
            }`}
          />

          <span>
            {form.enabled
              ? "Active"
              : "Disabled"}
          </span>

          <button
            className={`ai-toggle ${
              form.enabled
                ? "active"
                : ""
            }`}
            onClick={() =>
              setForm((previous) => ({
                ...previous,
                enabled:
                  !previous.enabled,
              }))
            }
            type="button"
          >
            <span />
          </button>

        </div>

      </div>

      {}

      {error && (
        <div className="ai-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="ai-alert success">
          {success}
        </div>
      )}

      {}

      <div className="ai-tabs">

        <button
          className={
            tab === "settings"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("settings")
          }
        >
          Settings
        </button>

        <button
          className={
            tab === "knowledge"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("knowledge")
          }
        >
          Knowledge Base
        </button>

        <button
          className={
            tab === "conversations"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("conversations")
          }
        >
          AI Inbox

          {conversations.filter(
            (item) =>
              item.unreadForTeam
          ).length > 0 && (
            <em>
              {
                conversations.filter(
                  (item) =>
                    item.unreadForTeam
                ).length
              }
            </em>
          )}
        </button>

      </div>

      {}

      {tab === "settings" && (
        <div className="ai-assistant-grid">

          <div className="ai-assistant-main">

            {}

            <section className="ai-card">

              <div className="ai-card-header">

                <div className="ai-card-icon purple">
                  <AIIcon size={20} />
                </div>

                <div>
                  <h2>
                    Assistant Settings
                  </h2>

                  <p>
                    Set up the details visitors
                    will see when they chat
                    with your AI assistant.
                  </p>
                </div>

              </div>

              {}

              <div className="ai-form-grid">

                <label className="ai-form-group">

                  <span>
                    Assistant Name
                  </span>

                  <input
                    value={
                      form.assistantName
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        assistantName:
                          event.target.value,
                      })
                    }
                    placeholder="AI Assistant"
                  />

                </label>

                <label className="ai-form-group">

                  <span>
                    Website URL
                  </span>

                  <input
                    value={
                      form.websiteUrl
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        websiteUrl:
                          event.target.value,
                      })
                    }
                    placeholder="https://yourwebsite.com"
                  />

                </label>

              </div>

              {}

              <div
                className="ai-branding-box"
                style={{
                  marginTop: "18px",
                  padding: "16px",
                  border: "1px solid #e7ebef",
                  borderRadius: "12px",
                  background: "#fbfcfd",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >

                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background:
                        previewColor,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >

                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          background: "#fff",
                          padding: "4px",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <AIIcon size={22} />
                    )}

                  </div>

                  <div>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#1f2937",
                      }}
                    >
                      Chatbot Branding
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "3px",
                        fontSize: "11px",
                        color: "#7b8494",
                      }}
                    >
                      Customize your chatbot
                      appearance for your website.
                    </span>

                  </div>

                </div>

                <label className="ai-form-group">

                  <span>
                    Client Logo URL
                  </span>

                  <input
                    value={
                      form.logoUrl
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        logoUrl:
                          event.target.value,
                      })
                    }
                    placeholder="https://yourwebsite.com/logo.png"
                  />

                  <small
                    style={{
                      display: "block",
                      marginTop: "5px",
                      color: "#8b94a3",
                      fontSize: "10px",
                    }}
                  >
                    Use a public HTTPS image URL.
                  </small>

                </label>

                {}

                <div
                  style={{
                    marginTop: "15px",
                  }}
                >

                  <label className="ai-form-group">

                    <span>
                      Chatbot Theme Color
                    </span>

                  </label>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >

                    <input
                      type="color"
                      value={previewColor}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          primaryColor:
                            event.target.value.toUpperCase(),
                        })
                      }
                      style={{
                        width: "52px",
                        height: "42px",
                        padding: "3px",
                        border:
                          "1px solid #dfe4ea",
                        borderRadius: "9px",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    />

                    <input
                      type="text"
                      value={
                        form.primaryColor
                      }
                      maxLength={7}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          primaryColor:
                            event.target.value,
                        })
                      }
                      placeholder="#00656A"
                      style={{
                        width: "125px",
                        height: "42px",
                        border:
                          "1px solid #dfe4ea",
                        borderRadius: "9px",
                        padding: "0 12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#263142",
                        textTransform:
                          "uppercase",
                        outline: "none",
                      }}
                    />

                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "9px",
                        background:
                          previewColor,
                        border:
                          "1px solid rgba(0,0,0,.08)",
                      }}
                    />

                  </div>

                  <small
                    style={{
                      display: "block",
                      marginTop: "6px",
                      color: "#8b94a3",
                      fontSize: "10px",
                    }}
                  >
                    This color will be used for
                    the chatbot launcher, header,
                    buttons and visitor messages.
                  </small>

                </div>

              </div>

              {}

              <label className="ai-form-group">

                <span>
                  Welcome Message
                </span>

                <textarea
                  rows="4"
                  value={
                    form.welcomeMessage
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      welcomeMessage:
                        event.target.value,
                    })
                  }
                />

              </label>

              {}

              <label className="ai-form-group">

                <span>
                  Custom Instructions
                </span>

                <textarea
                  rows="6"
                  value={
                    form.customInstructions
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customInstructions:
                        event.target.value,
                    })
                  }
                  placeholder="Tell your AI assistant how it should respond..."
                />

              </label>

              <div className="ai-save-row">

                <button
                  className="ai-save-btn"
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </section>

            {}

            <section className="ai-card">

              <div className="ai-card-header">

                <div className="ai-card-icon blue">

                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M4 19V5"
                      strokeLinecap="round"
                    />

                    <path
                      d="M4 19H20"
                      strokeLinecap="round"
                    />

                    <path
                      d="M7 15L11 11L14 14L20 8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M17 8H20V11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </div>

                <div>

                  <h2>
                    Chatbot Usage
                  </h2>

                  <p>
                    Your monthly limit follows
                    the active SaleVitals plan.
                  </p>

                </div>

              </div>

              <div className="ai-usage-card">

                <div>

                  <strong>
                    {usage.used}
                  </strong>

                  <span>
                    {" "}
                    / {usage.limit || 0}
                  </span>

                  <small>
                    messages used this month
                  </small>

                </div>

                <div className="ai-usage-right">

                  <b>
                    {plan?.planName ||
                      "No active plan"}
                  </b>

                  <span>
                    {usage.remaining} remaining
                  </span>

                </div>

              </div>

              <div className="ai-progress">

                <i
                  style={{
                    width: `${usagePercent}%`,
                  }}
                />

              </div>

            </section>

            {}

            <section className="ai-card">

              <div className="ai-card-header">

                <div className="ai-card-icon green">
                  <AIIcon size={20} />
                </div>

                <div>

                  <h2>
                    Website Widget
                  </h2>

                  <p>
                    Add this one script to your
                    website. The chat button will
                    appear at the bottom-right.
                  </p>

                </div>

              </div>

              <div className="ai-embed-box">

                <code>
                  {embedCode}
                </code>

                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      embedCode
                    )
                  }
                >
                  Copy Code
                </button>

              </div>

              <div className="ai-widget-url">
                Widget URL: {widgetUrl}
              </div>

            </section>

          </div>

          {}

          <aside className="ai-assistant-preview">

            <div className="preview-heading">

              <div>

                <h2>
                  Live Preview
                </h2>

                <p>
                  Visitor chat preview.
                </p>

              </div>

            </div>

            <div
              className="chat-preview"
              style={{
                "--ai-preview-color":
                  previewColor,
              }}
            >

              {}

              <div
                className="chat-header"
                style={{
                  background:
                    previewColor,
                }}
              >

                <div className="chat-profile">

                  <div
                    className="chat-avatar"
                    style={{
                      background: "#fff",
                      overflow: "hidden",
                    }}
                  >

                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "4px",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <AIIcon size={20} />
                    )}

                  </div>

                  <div>

                    <strong>
                      {form.assistantName ||
                        "AI Assistant"}
                    </strong>

                    <span>
                      <i />
                      Online
                    </span>

                  </div>

                </div>

                <button
                  type="button"
                  className="chat-more"
                >
                  •••
                </button>

              </div>

              {}

              <div className="chat-body">

                <div className="chat-date">
                  Today
                </div>

                {}

                <div className="chat-message ai">

                  <div
                    className="message-avatar"
                    style={{
                      background: "#fff",
                      overflow: "hidden",
                    }}
                  >

                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "3px",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <AIIcon size={17} />
                    )}

                  </div>

                  <div className="message-content">

                    <span className="message-name">
                      {form.assistantName ||
                        "AI Assistant"}
                    </span>

                    <div className="message-bubble">
                      {form.welcomeMessage}
                    </div>

                    <span className="message-time">
                      Now
                    </span>

                  </div>

                </div>

                {}

                <div className="chat-message visitor">

                  <div className="message-content">

                    <div
                      className="message-bubble"
                      style={{
                        background:
                          previewColor,
                        color: "#fff",
                        borderColor:
                          previewColor,
                      }}
                    >
                      I want to know more about
                      your services.
                    </div>

                    <span className="message-time">
                      Now
                    </span>

                  </div>

                </div>

                {}

                <div className="chat-message ai">

                  <div
                    className="message-avatar"
                    style={{
                      background: "#fff",
                      overflow: "hidden",
                    }}
                  >

                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "3px",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <AIIcon size={17} />
                    )}

                  </div>

                  <div className="message-content">

                    <span className="message-name">
                      {form.assistantName ||
                        "AI Assistant"}
                    </span>

                    <div className="message-bubble">
                      I can help with questions
                      covered by your website
                      and knowledge base.
                    </div>

                  </div>

                </div>

              </div>

              {}

              <div className="chat-input">

                <input
                  disabled
                  placeholder="Type your message..."
                />

                <button
                  disabled
                  style={{
                    background:
                      previewColor,
                  }}
                >
                  ↑
                </button>

              </div>

              <div className="chat-powered">
                Powered by SaleVitals AI
              </div>

            </div>

            <div className="ai-preview-note">
              <span>i</span>
              The real widget uses your saved
              logo, color, settings and website
              knowledge.
            </div>

          </aside>

        </div>
      )}

      {}

      {tab === "knowledge" && (
        <div className="ai-knowledge-layout">

          {}

          <section className="ai-card">

            <div className="ai-card-header">

              <div className="ai-card-icon blue">

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />

                  <path d="M3 12H21" />

                  <path
                    d="M12 3C14.2 5.4 15.4 8.4 15.4 12C15.4 15.6 14.2 18.6 12 21"
                  />

                  <path
                    d="M12 3C9.8 5.4 8.6 8.4 8.6 12C8.6 15.6 9.8 18.6 12 21"
                  />

                </svg>

              </div>

              <div>

                <h2>
                  Website Knowledge
                </h2>

                <p>
                  Enter your website above and
                  sync up to 30 same-domain pages.
                </p>

              </div>

            </div>

            <div className="ai-crawl-row">

              <input
                value={form.websiteUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    websiteUrl:
                      event.target.value,
                  })
                }
                placeholder="https://yourwebsite.com"
              />

              <button
                onClick={crawl}
                disabled={
                  crawling ||
                  !form.websiteUrl
                }
              >
                {crawling
                  ? "Syncing..."
                  : "Sync Website"}
              </button>

            </div>

            <div className="ai-summary-grid">

              <div>
                <b>
                  {knowledgeSummary.website}
                </b>

                <span>
                  website chunks
                </span>
              </div>

              <div>
                <b>
                  {knowledgeSummary.faq}
                </b>

                <span>
                  FAQs
                </span>
              </div>

              <div>
                <b>
                  {knowledgeSummary.service}
                </b>

                <span>
                  services
                </span>
              </div>

              <div>
                <b>
                  {knowledgeSummary.custom}
                </b>

                <span>
                  custom
                </span>
              </div>

            </div>

          </section>

          {}

          <section className="ai-card">

            <div className="ai-card-header">

              <div className="ai-card-icon orange">
                +
              </div>

              <div>

                <h2>
                  Add Manual Knowledge
                </h2>

                <p>
                  Add verified FAQs, services,
                  pricing or business information.
                </p>

              </div>

            </div>

            <form
              onSubmit={addKnowledge}
              className="ai-knowledge-form"
            >

              <select
                value={knowledgeForm.type}
                onChange={(event) =>
                  setKnowledgeForm({
                    ...knowledgeForm,
                    type:
                      event.target.value,
                  })
                }
              >

                <option value="faq">
                  FAQ
                </option>

                <option value="service">
                  Service / Pricing
                </option>

                <option value="custom">
                  Custom
                </option>

              </select>

              <input
                value={knowledgeForm.title}
                onChange={(event) =>
                  setKnowledgeForm({
                    ...knowledgeForm,
                    title:
                      event.target.value,
                  })
                }
                placeholder="Title"
              />

              <textarea
                rows="6"
                value={knowledgeForm.content}
                onChange={(event) =>
                  setKnowledgeForm({
                    ...knowledgeForm,
                    content:
                      event.target.value,
                  })
                }
                placeholder="Verified information the AI is allowed to use..."
              />

              <button
                className="ai-save-btn"
                type="submit"
              >
                Add Knowledge
              </button>

            </form>

          </section>

          {}

          <section className="ai-card ai-knowledge-list-card">

            <div className="ai-card-header">

              <div className="ai-card-icon purple">

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <path
                    d="M5 6H19"
                    strokeLinecap="round"
                  />

                  <path
                    d="M5 12H19"
                    strokeLinecap="round"
                  />

                  <path
                    d="M5 18H19"
                    strokeLinecap="round"
                  />

                </svg>

              </div>

              <div>

                <h2>
                  Knowledge Items
                </h2>

                <p>
                  The AI will use only active
                  verified knowledge when answering.
                </p>

              </div>

            </div>

            <div className="ai-knowledge-list">

              {!knowledge.length && (
                <div className="ai-empty">
                  No knowledge added yet. Sync
                  your website or add FAQs/services.
                </div>
              )}

              {knowledge.map((item) => (
                <div
                  className="ai-knowledge-item"
                  key={item._id}
                  style={{minWidth:0,width:"100%",maxWidth:"100%",boxSizing:"border-box",display:"grid",gridTemplateColumns:"minmax(0,1fr) 40px",gap:"16px",alignItems:"center",overflow:"hidden"}}
                >

                  <div style={{minWidth:0,width:"100%",overflow:"hidden"}}>

                    <div className="ai-knowledge-type">
                      {item.type}
                    </div>

                    <h3>
                      {item.title ||
                        "Untitled knowledge"}
                    </h3>

                    <p style={{overflowWrap:"anywhere",wordBreak:"break-word"}}>
                      {(item.content || "").slice(
                        0,
                        220
                      )}

                      {(item.content || "")
                        .length > 220
                        ? "..."
                        : ""}
                    </p>

                    {item.sourceUrl && (
                      <small style={{display:"block",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {item.sourceUrl}
                      </small>
                    )}

                  </div>

                  <button
                    type="button"
                    className="ai-knowledge-delete"
                    onClick={() => deleteKnowledge(item._id)}
                    title="Delete knowledge"
                    aria-label={`Delete ${item.title || "knowledge item"}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7H20" />
                      <path d="M9 7V4H15V7" />
                      <path d="M18 7L17.3 19C17.25 19.85 16.55 20.5 15.7 20.5H8.3C7.45 20.5 6.75 19.85 6.7 19L6 7" />
                      <path d="M10 11V17" />
                      <path d="M14 11V17" />
                    </svg>
                  </button>

                </div>
              ))}

            </div>

          </section>

        </div>
      )}

      {}

      {tab === "conversations" && (
        <div className="ai-inbox-layout" style={{width:"100%",maxWidth:"100%",minWidth:0,display:"grid",gridTemplateColumns:"minmax(280px,360px) minmax(0,1fr)",gap:"20px",alignItems:"stretch",boxSizing:"border-box"}}>

          {}

          <section className="ai-card ai-conversation-list" style={{minWidth:0,width:"100%",maxWidth:"100%",boxSizing:"border-box",overflow:"hidden"}}>

            <div className="ai-card-header">

              <div className="ai-card-icon green">

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <path
                    d="M4 5.5C4 4.67 4.67 4 5.5 4H18.5C19.33 4 20 4.67 20 5.5V15.5C20 16.33 19.33 17 18.5 17H10L6 20V17H5.5C4.67 17 4 16.33 4 15.5V5.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M8 9H16"
                    strokeLinecap="round"
                  />

                  <path
                    d="M8 12H13"
                    strokeLinecap="round"
                  />

                </svg>

              </div>

              <div>

                <h2>
                  AI Inbox
                </h2>

                <p>
                  Visitor conversations from your
                  website.
                </p>

              </div>

            </div>

            <div className="ai-conversation-items" style={{minWidth:0,width:"100%",maxWidth:"100%",overflowX:"hidden"}}>

              {!conversations.length && (
                <div className="ai-empty">
                  No AI conversations yet.
                </div>
              )}

              {conversations.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className={`ai-conversation-item ${
                    selectedConversation?._id ===
                    item._id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => openConversation(item)}
                  style={{width:"100%",maxWidth:"100%",minWidth:0,display:"grid",gridTemplateColumns:"42px minmax(0,1fr) auto",alignItems:"center",gap:"12px",boxSizing:"border-box",overflow:"hidden"}}
                >

                  <div className="ai-conversation-avatar">
                    {(item.visitorName ||
                      "V")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div className="ai-conversation-copy" style={{minWidth:0,width:"100%",overflow:"hidden"}}>

                    <strong>
                      {item.visitorName ||
                        "Website visitor"}
                    </strong>

                    <span>
                      {item.lastMessage ||
                        "New conversation"}
                    </span>

                    <small>
                      {formatDate(
                        item.lastMessageAt
                      )}
                    </small>

                  </div>

                  {item.unreadForTeam && (
                    <em>
                      New
                    </em>
                  )}

                </button>
              ))}

            </div>

          </section>

          {}

          <section className="ai-card ai-conversation-detail" style={{minWidth:0,width:"100%",maxWidth:"100%",boxSizing:"border-box",overflow:"hidden",display:"flex",flexDirection:"column"}}>

            {!selectedConversation ? (
              <div className="ai-empty big">
                Select a conversation to view
                messages.
              </div>
            ) : (
              <>

                <div className="ai-detail-head" style={{minWidth:0,width:"100%",maxWidth:"100%",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>

                  <div>

                    <h2>
                      {selectedConversation.visitorName ||
                        "Website visitor"}
                    </h2>

                    <p>
                      {selectedConversation.visitorPhone ||
                        selectedConversation.visitorEmail ||
                        "Visitor"}

                      {" · "}

                      {selectedConversation.status}
                    </p>

                  </div>

                  <div className="ai-detail-actions" style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",flexShrink:0}}>

                    {selectedConversation.mode !==
                      "human" &&
                      selectedConversation.status !==
                        "closed" && (
                        <button
                          onClick={takeOver}
                        >
                          Take Over
                        </button>
                      )}

                    {selectedConversation.status !==
                      "closed" && (
                      <button
                        className="danger"
                        onClick={
                          closeConversation
                        }
                      >
                        Close
                      </button>
                    )}

                  </div>

                </div>

                <div className="ai-message-list" style={{minWidth:0,width:"100%",maxWidth:"100%",overflowX:"hidden",overflowY:"auto",boxSizing:"border-box",flex:"1 1 auto"}}>

                  {conversationMessages.map(
                    (message) => (
                      <div
                        key={message._id}
                        className={`ai-inbox-message ${message.sender}`}
                        style={{minWidth:0,maxWidth:"100%",width:"fit-content",boxSizing:"border-box",overflowWrap:"anywhere",wordBreak:"break-word"}}
                      >

                        <span>
                          {message.sender ===
                          "visitor"
                            ? selectedConversation.visitorName ||
                              "Visitor"
                            : message.sender ===
                                "human"
                              ? "Team"
                              : "AI Assistant"}
                        </span>

                        <p style={{margin:0,whiteSpace:"pre-wrap",overflowWrap:"anywhere",wordBreak:"break-word"}}>
                          {message.message}
                        </p>

                        <small>
                          {formatDate(
                            message.createdAt
                          )}
                        </small>

                      </div>
                    )
                  )}

                </div>

                {selectedConversation.status !==
                  "closed" &&
                  selectedConversation.mode ===
                    "human" && (
                    <div className="ai-human-reply" style={{width:"100%",maxWidth:"100%",minWidth:0,boxSizing:"border-box"}}>

                      <textarea
                        rows="3"
                        value={reply}
                        onChange={(event) =>
                          setReply(
                            event.target.value
                          )
                        }
                        placeholder="Reply to visitor..."
                      />

                      <button
                        onClick={
                          sendHumanReply
                        }
                      >
                        Send Reply
                      </button>

                    </div>
                  )}

              </>
            )}

          </section>

        </div>
      )}

    </div>
  );
}
