
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/api";
import "../styles/meta-inbox.scss";

function getToken() {
  return ["token", "vitalsToken", "salevitals_token"]
    .map((key) => sessionStorage.getItem(key) || localStorage.getItem(key))
    .find(Boolean) || "";
}

function initials(name = "") {
  return String(name || "User").trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";
}

function timeLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function PlatformIcon({ platform }) {
  return <span className={`mi-platform mi-platform-${platform}`}>{platform === "instagram" ? "◎" : "f"}</span>;
}

function Avatar({ name, image, size = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={`mi-avatar ${size}`}>
      {image && !imageFailed ? <img src={image} alt="" onError={() => setImageFailed(true)} /> : initials(name)}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="mi-empty-state">
      <div className="mi-empty-icon">✉</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export default function MetaInbox() {
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");

  const token = getToken();
  const requestHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }), [token]);

  const loadConversations = useCallback(async () => {
    if (!token) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ limit: "100" });
      if (platform !== "all") params.set("platform", platform);
      if (status !== "all") params.set("status", status);
      const response = await fetch(buildApiUrl(`/api/integrations/meta/inbox?${params}`), { headers: requestHeaders });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to load conversations.");
      const rows = Array.isArray(data?.conversations) ? data.conversations : [];
      setConversations(rows);
      setSelected((previous) => rows.find((item) => item._id === previous?._id) || rows[0] || null);
    } catch (err) {
      setError(err.message || "Unable to load inbox.");
    } finally {
      setLoading(false);
    }
  }, [token, platform, status, requestHeaders]);

  const loadMessages = useCallback(async (conversation) => {
    if (!conversation?._id || !token) {
      setMessages([]);
      return;
    }
    try {
      setMessagesLoading(true);
      setMessageError("");
      const response = await fetch(buildApiUrl(`/api/integrations/meta/inbox/${conversation._id}/messages?limit=100`), { headers: requestHeaders });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to load messages.");
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (err) {
      setMessages([]);
      setMessageError(err.message || "Unable to load messages.");
    } finally {
      setMessagesLoading(false);
    }
  }, [token, requestHeaders]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages(selected);
  }, [selected?._id, loadMessages]);

  const visibleConversations = conversations.filter((conversation) => {
    const query = search.trim().toLowerCase();
    return !query ||
      String(conversation.participantName || "").toLowerCase().includes(query) ||
      String(conversation.lastMessageText || "").toLowerCase().includes(query);
  });

  const unreadTotal = conversations.reduce((total, item) => total + Math.max(0, Number(item.unreadCount) || 0), 0);

  return (
    <div className="meta-inbox-page">
      <header className="mi-page-header">
        <div>
          <div className="mi-eyebrow"><span /> CUSTOMER COMMUNICATION</div>
          <h1>Social Inbox</h1>
          <p>All your Facebook and Instagram conversations, together.</p>
        </div>
        <button className="mi-refresh" type="button" onClick={loadConversations} disabled={loading}>
          <span className={loading ? "mi-spin" : ""}>↻</span> Refresh
        </button>
      </header>

      <section className="mi-workspace">
        <aside className="mi-sidebar">
          <div className="mi-sidebar-heading">
            <div>
              <h2>Messages</h2>
              <p>Manage your conversations</p>
            </div>
            <span className="mi-total-badge">{visibleConversations.length}</span>
          </div>

          <div className="mi-search-wrap">
            <span>⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations..." aria-label="Search conversations" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
          </div>

          <div className="mi-platform-tabs">
            {[
              ["all", "All messages"],
              ["facebook", "Facebook"],
              ["instagram", "Instagram"]
            ].map(([value, label]) => (
              <button key={value} type="button" className={platform === value ? "active" : ""} onClick={() => setPlatform(value)}>
                {value !== "all" && <PlatformIcon platform={value} />}
                {label}
              </button>
            ))}
          </div>

          <div className="mi-status-tabs">
            {[["open", "Open"], ["closed", "Closed"], ["all", "All"]].map(([value, label]) => (
              <button key={value} type="button" className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{label}</button>
            ))}
          </div>

          <div className="mi-conversation-list">
            {error ? (
              <div className="mi-list-feedback">
                <p>{error}</p>
                <button type="button" onClick={loadConversations}>Try again</button>
              </div>
            ) : loading ? (
              <div className="mi-loading"><span className="mi-loader" /> Loading conversations</div>
            ) : visibleConversations.length === 0 ? (
              <EmptyState title="No conversations yet" description="Facebook and Instagram messages will appear here when received." />
            ) : visibleConversations.map((conversation) => (
              <button key={conversation._id} type="button" className={`mi-conversation ${selected?._id === conversation._id ? "active" : ""}`} onClick={() => setSelected(conversation)}>
                <div className="mi-avatar-wrap">
                  <Avatar name={conversation.participantName} image={conversation.participantProfilePicture} />
                  <PlatformIcon platform={conversation.platform} />
                </div>
                <div className="mi-conversation-content">
                  <div className="mi-conversation-heading">
                    <strong>{conversation.participantName || "Social media user"}</strong>
                    <time>{timeLabel(conversation.lastMessageAt)}</time>
                  </div>
                  <div className="mi-conversation-preview">
                    {conversation.lastMessageDirection === "outbound" && <span>You: </span>}
                    {conversation.lastMessageText || "Attachment"}
                  </div>
                  <div className="mi-conversation-meta">
                    <span>{conversation.platform === "instagram" ? "Instagram" : "Facebook"}</span>
                    {conversation.unreadCount > 0 && <span className="mi-unread">{conversation.unreadCount}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mi-sidebar-footer">
            <span className="mi-online-dot" />
            <span>Social channels</span>
            <strong>2</strong>
            <span className="mi-footer-label">platforms</span>
          </div>
        </aside>

        <main className="mi-chat-panel">
          {!selected ? (
            <EmptyState title="Your conversations start here" description="Select a conversation from the left to view its messages and customer details." />
          ) : (
            <>
              <header className="mi-chat-header">
                <div className="mi-chat-person">
                  <Avatar name={selected.participantName} image={selected.participantProfilePicture} size="mi-avatar-large" />
                  <div>
                    <h2>{selected.participantName || "Social media user"}</h2>
                    <p><PlatformIcon platform={selected.platform} /> {selected.platform === "instagram" ? "Instagram conversation" : "Facebook conversation"}</p>
                  </div>
                </div>
                <span className={`mi-status-chip ${selected.status === "closed" ? "closed" : ""}`}>
                  <span /> {selected.status || "open"}
                </span>
              </header>

              <div className="mi-chat-context">
                <PlatformIcon platform={selected.platform} />
                <span>Conversation history</span>
                <span className="mi-context-line" />
                <span>{messages.length} messages</span>
              </div>

              <div className="mi-messages">
                {messageError ? (
                  <div className="mi-list-feedback"><p>{messageError}</p><button type="button" onClick={() => loadMessages(selected)}>Try again</button></div>
                ) : messagesLoading ? (
                  <div className="mi-loading"><span className="mi-loader" /> Loading messages</div>
                ) : messages.length === 0 ? (
                  <EmptyState title="No saved messages" description="Messages for this conversation will appear here." />
                ) : messages.map((message) => (
                  <div key={message._id} className={`mi-message-row ${message.direction === "outbound" ? "outbound" : "inbound"}`}>
                    {message.direction !== "outbound" && <Avatar name={selected.participantName} image={selected.participantProfilePicture} size="mi-avatar-small" />}
                    <div className="mi-message-content">
                      <div className="mi-bubble">
                        {message.text || <em>{message.messageType === "image" ? "Image attachment" : message.messageType === "video" ? "Video attachment" : message.messageType === "audio" ? "Audio attachment" : "Attachment"}</em>}
                        {Array.isArray(message.attachments) && message.attachments.map((attachment, index) => attachment.url ? (
                          <a key={`${message._id}-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className="mi-attachment">View {attachment.type || "attachment"} ↗</a>
                        ) : null)}
                      </div>
                      <time className="mi-message-time">{timeLabel(message.sentAt)}</time>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mi-composer-disabled">
                <span>↗</span>
                <div><strong>Replying is not enabled yet</strong><p>Message sending needs the Meta messaging API endpoint.</p></div>
                <button type="button" onClick={() => loadMessages(selected)} title="Refresh messages">↻</button>
              </div>
            </>
          )}
        </main>

        <aside className="mi-details-panel">
          <div className="mi-details-heading">
            <h2>Customer details</h2>
            <span>⋯</span>
          </div>
          {!selected ? (
            <EmptyState title="No customer selected" description="Select a conversation to view its details." />
          ) : (
            <>
              <div className="mi-customer-profile">
                <Avatar name={selected.participantName} image={selected.participantProfilePicture} size="mi-avatar-profile" />
                <h3>{selected.participantName || "Social media user"}</h3>
                <p>Social media contact</p>
                <span className="mi-customer-platform"><PlatformIcon platform={selected.platform} /> {selected.platform === "instagram" ? "Instagram" : "Facebook"}</span>
              </div>

              <section className="mi-detail-section">
                <h3>Conversation overview</h3>
                <div className="mi-detail-row"><span>Status</span><strong className={`mi-detail-status ${selected.status === "closed" ? "closed" : ""}`}>{selected.status || "open"}</strong></div>
                <div className="mi-detail-row"><span>Unread messages</span><strong>{selected.unreadCount || 0}</strong></div>
                <div className="mi-detail-row"><span>Last activity</span><strong>{timeLabel(selected.lastMessageAt) || "—"}</strong></div>
                <div className="mi-detail-row"><span>Last message</span><strong>{selected.lastMessageDirection === "outbound" ? "Outgoing" : "Incoming"}</strong></div>
              </section>

              <section className="mi-detail-section">
                <h3>Contact information</h3>
                <div className="mi-detail-row mi-detail-stack"><span>Platform user ID</span><strong>{selected.participantId || "—"}</strong></div>
                <div className="mi-detail-row mi-detail-stack"><span>Assigned to</span><strong>{selected.assignedTo?.name || "Not assigned"}</strong></div>
              </section>

              <section className="mi-detail-section mi-activity-section">
                <h3>Recent activity</h3>
                <div className="mi-activity-item">
                  <span className="mi-activity-marker" />
                  <div><strong>{selected.lastMessageDirection === "outbound" ? "Message sent" : "Message received"}</strong><p>{timeLabel(selected.lastMessageAt) || "No activity date"}</p></div>
                </div>
                <div className="mi-activity-item">
                  <span className="mi-activity-marker muted" />
                  <div><strong>Conversation created</strong><p>Social channel</p></div>
                </div>
              </section>
            </>
          )}
          <div className="mi-details-footer"><span>SV</span><div><strong>SaleVitals CRM</strong><p>Customer communication</p></div></div>
        </aside>
      </section>
    </div>
  );
}
