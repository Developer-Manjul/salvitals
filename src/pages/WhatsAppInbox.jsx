
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../styles/WhatsAppInbox.scss";
const API_BASE = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000"
).replace(/\/$/, "");

const getToken = () => {
    const keys = ["token", "accessToken", "authToken", "sv_token"];

    for (const key of keys) {
        const token =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (token) return token;
    }

    return "";
};

const apiRequest = async (url, options = {}) => {
    const token = getToken();

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed (${response.status})`
        );
    }

    return data;
};

const statusClass = (status) =>
    String(status || "open").toLowerCase().replace(/\s+/g, "-");

const formatTime = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
    });
};

const formatFullDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getInitials = (name) => {
    const parts = String(name || "WA")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const mapConversation = (item) => ({
    ...item,
    id: String(item._id),
    name: item.participantName || item.participantId || "WhatsApp User",
    phone: item.participantId || "",
    initials: getInitials(item.participantName || item.participantId),
    preview: item.lastMessageText || "No messages yet",
    time: formatTime(item.lastMessageAt),
    unread: Number(item.unreadCount || 0),
    status: item.status || "open",
    source: "WhatsApp",
    enquiry: "WhatsApp enquiry",
    email: "Not provided",
    created: formatFullDate(item.createdAt),
    lastMessage: formatFullDate(item.lastMessageAt),
    tags: item.tags || [],
    aiPaused: Boolean(item.aiPaused),
});

const mapMessage = (message) => ({
    id: String(message._id || message.externalMessageId || `${message.sentAt}-${Math.random()}`),
    from: message.direction === "outbound" ? "me" : "them",
    text: message.text || "",
    time: formatTime(message.sentAt),
    deliveryStatus: message.deliveryStatus || "",
    messageType: message.messageType || "text",
});

export default function WhatsAppInbox() {
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [messages, setMessages] = useState([]);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState("");
    const [activeTab, setActiveTab] = useState("Reply");
    const [note, setNote] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [automationOpen, setAutomationOpen] = useState(false);
    const [automationSaving, setAutomationSaving] = useState(false);
    const [automation, setAutomation] = useState({
        welcomeEnabled: true,
        welcomeMessage: "",
        aiReplyEnabled: true,
        appointmentEnabled: true,
        leadSyncEnabled: true,
        humanTakeoverEnabled: true,
    });

    const selected = conversations.find(
        (item) => item.id === selectedId
    ) || null;

    const fetchConversations = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);

        try {
            const data = await apiRequest(
                "/api/integrations/meta/inbox?platform=whatsapp"
            );

            const list = (data.conversations || []).map(mapConversation);

            setConversations(list);

            setSelectedId((current) => {
                if (current && list.some((item) => item.id === current)) {
                    return current;
                }

                return list[0]?.id || "";
            });

            setError("");
        } catch (err) {
            console.error("WhatsApp conversations error:", err);
            setError(err.message || "Unable to load WhatsApp conversations.");
        } finally {
            if (!silent) setRefreshing(false);
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId, silent = false) => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        if (!silent) setLoadingMessages(true);

        try {
            const data = await apiRequest(
                `/api/integrations/meta/inbox/${encodeURIComponent(conversationId)}/messages`
            );

            setMessages((data.messages || []).map(mapMessage));

            if (data.conversation) {
                const updated = mapConversation(data.conversation);

                setConversations((items) =>
                    items.map((item) =>
                        item.id === conversationId ? updated : item
                    )
                );
            } else {
                setConversations((items) =>
                    items.map((item) =>
                        item.id === conversationId
                            ? { ...item, unread: 0 }
                            : item
                    )
                );
            }

            setError("");
        } catch (err) {
            console.error("WhatsApp messages error:", err);
            if (!silent) {
                setError(err.message || "Unable to load messages.");
            }
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        apiRequest("/api/integrations/meta/whatsapp/automation/settings")
            .then((data) => {
                if (data.settings) setAutomation(data.settings);
            })
            .catch(() => {});

        const interval = window.setInterval(() => {
            fetchConversations(true);
        }, 10000);

        return () => window.clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            return;
        }

        fetchMessages(selectedId);

        const interval = window.setInterval(() => {
            fetchMessages(selectedId, true);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [selectedId, fetchMessages]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        return conversations.filter((item) => {
            const matchesFilter =
                filter === "All" ||
                item.status.toLowerCase() === filter.toLowerCase();

            const matchesSearch =
                !q ||
                [
                    item.name,
                    item.phone,
                    item.preview,
                    item.enquiry,
                ].some((value) =>
                    String(value || "").toLowerCase().includes(q)
                );

            return matchesFilter && matchesSearch;
        });
    }, [conversations, filter, search]);

    const counts = useMemo(() => ({
        All: conversations.length,
        Open: conversations.filter(
            (item) => item.status.toLowerCase() === "open"
        ).length,
        Closed: conversations.filter(
            (item) => item.status.toLowerCase() === "closed"
        ).length,
    }), [conversations]);

    const sendMessage = async () => {
        const text = draft.trim();

        if (!text || !selected || sending) return;

        setSending(true);
        setError("");
        setSuccess("");

        try {
            const data = await apiRequest(
                `/api/integrations/meta/inbox/${encodeURIComponent(selected.id)}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({ text }),
                }
            );

            if (!data.success) {
                throw new Error(data.message || "Message could not be sent.");
            }

            setDraft("");
            setSuccess("Message sent successfully.");

            await fetchMessages(selected.id, true);
            await fetchConversations(true);
        } catch (err) {
            console.error("WhatsApp send error:", err);
            setError(err.message || "Unable to send WhatsApp message.");
        } finally {
            setSending(false);
        }
    };

    const selectConversation = (id) => {
        setSelectedId(id);
        setActiveTab("Reply");
        setError("");
        setSuccess("");
    };

    const saveAutomation = async () => {
        setAutomationSaving(true);
        setError("");
        try {
            const data = await apiRequest(
                "/api/integrations/meta/whatsapp/automation/settings",
                {
                    method: "PUT",
                    body: JSON.stringify(automation),
                }
            );
            setAutomation(data.settings);
            setSuccess("WhatsApp AI automation settings saved.");
            setAutomationOpen(false);
        } catch (err) {
            setError(err.message || "Unable to save automation settings.");
        } finally {
            setAutomationSaving(false);
        }
    };

    const resumeAutomation = async () => {
        if (!selected) return;
        try {
            await apiRequest(
                `/api/integrations/meta/whatsapp/automation/inbox/${selected.id}/resume`,
                { method: "POST" }
            );
            setSuccess("AI automation resumed for this conversation.");
            await fetchMessages(selected.id, true);
            await fetchConversations(true);
        } catch (err) {
            setError(err.message || "Unable to resume AI automation.");
        }
    };

    return (
        <main className="wa-inbox-page">
            <header className="wa-page-header">
                <div>
                    <div className="wa-eyebrow">
                        <span /> CUSTOMER COMMUNICATION
                    </div>
                    <h1>
                        <span className="wa-brand-mark">◉</span> WhatsApp
                    </h1>
                    <p>
                        Manage your WhatsApp conversations, respond to leads
                        and provide instant support.
                    </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        className="wa-refresh-btn"
                        onClick={() => setAutomationOpen(true)}
                        type="button"
                    >
                        AI &amp; Automation
                    </button>
                    <button
                        className="wa-refresh-btn"
                        onClick={() => fetchConversations()}
                        type="button"
                        disabled={refreshing}
                    >
                        <span className={refreshing ? "wa-spin" : ""}>↻</span>
                        {refreshing ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </header>

            {(error || success) && (
                <div
                    role="status"
                    style={{
                        padding: "10px 14px",
                        marginBottom: 12,
                        borderRadius: 8,
                        background: error ? "#fff0f0" : "#e9fff3",
                        color: error ? "#c62828" : "#07864b",
                        fontSize: 13,
                    }}
                >
                    {error || success}
                </div>
            )}

            {automationOpen && (
                <div className="wa-automation-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setAutomationOpen(false);
                }}>
                    <section className="wa-automation-panel" role="dialog" aria-modal="true" aria-labelledby="wa-automation-title">
                        <div className="wa-automation-header">
                            <div>
                                <span>WHATSAPP AUTOMATION</span>
                                <h2 id="wa-automation-title">AI &amp; Automation</h2>
                            </div>
                            <button type="button" onClick={() => setAutomationOpen(false)}>×</button>
                        </div>
                        <div className="wa-automation-body">
                            <label className="wa-automation-toggle">
                                <div><strong>Custom welcome message</strong><span>Send automatically on the patient's first message.</span></div>
                                <input type="checkbox" checked={automation.welcomeEnabled} onChange={(e) => setAutomation({ ...automation, welcomeEnabled: e.target.checked })} />
                            </label>
                            <textarea
                                className="wa-automation-welcome"
                                value={automation.welcomeMessage}
                                onChange={(e) => setAutomation({ ...automation, welcomeMessage: e.target.value })}
                                disabled={!automation.welcomeEnabled}
                                maxLength={2000}
                            />
                            {[
                                ["aiReplyEnabled", "AI auto-reply", "Answer patient questions from your clinic knowledge base."],
                                ["appointmentEnabled", "Appointment booking", "Collect the patient's name and mobile number in WhatsApp."],
                                ["leadSyncEnabled", "WhatsApp lead creation", "Create or update SaleVitals leads with WhatsApp as the source."],
                                ["humanTakeoverEnabled", "Human takeover", "Pause AI whenever an agent sends a manual reply."],
                            ].map(([key, title, description]) => (
                                <label className="wa-automation-toggle" key={key}>
                                    <div><strong>{title}</strong><span>{description}</span></div>
                                    <input type="checkbox" checked={Boolean(automation[key])} onChange={(e) => setAutomation({ ...automation, [key]: e.target.checked })} />
                                </label>
                            ))}
                        </div>
                        <footer className="wa-automation-footer">
                            <button type="button" onClick={() => setAutomationOpen(false)}>Cancel</button>
                            <button type="button" className="primary" disabled={automationSaving} onClick={saveAutomation}>
                                {automationSaving ? "Saving…" : "Save automation"}
                            </button>
                        </footer>
                    </section>
                </div>
            )}

            <section className="wa-inbox-grid">
                <aside className="wa-panel wa-conversation-panel">
                    <div className="wa-panel-heading">
                        <div className="wa-heading-icon">◉</div>
                        <div>
                            <h2>Conversations</h2>
                            <p>All WhatsApp chats from your business number</p>
                        </div>
                    </div>

                    <div className="wa-list-controls">
                        <label className="wa-search">
                            <span>⌕</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name, number or message..."
                            />
                        </label>

                        <div className="wa-filter-tabs">
                            {["All", "Open", "Closed"].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    className={filter === tab ? "active" : ""}
                                    onClick={() => setFilter(tab)}
                                >
                                    {tab}
                                    <span>{counts[tab]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="wa-conversation-list">
                        {filtered.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`wa-conversation-row ${
                                    selectedId === item.id ? "selected" : ""
                                }`}
                                onClick={() => selectConversation(item.id)}
                            >
                                <span className={`wa-avatar wa-avatar-${Number(item.id.slice(-2), 16) % 4 || 1}`}>
                                    {item.initials}
                                </span>

                                <span className="wa-row-content">
                                    <span className="wa-row-top">
                                        <strong>{item.name}</strong>
                                        <time>{item.time}</time>
                                    </span>
                                    <span className="wa-row-preview">
                                        {item.preview}
                                    </span>
                                    <span className="wa-row-source">
                                        WhatsApp
                                    </span>
                                </span>

                                {item.unread > 0 && (
                                    <span className="wa-unread">
                                        {item.unread}
                                    </span>
                                )}
                            </button>
                        ))}

                        {filtered.length === 0 && (
                            <div className="wa-empty-list">
                                {loadingMessages
                                    ? "Loading conversations..."
                                    : "No WhatsApp conversations yet."}
                            </div>
                        )}
                    </div>

                    <footer className="wa-channel-footer">
                        <span><i /> WhatsApp channel</span>
                        <strong>Connected</strong>
                    </footer>
                </aside>

                <section className="wa-panel wa-chat-panel">
                    {!selected ? (
                        <div style={{ padding: 24, textAlign: "center" }}>
                            Select a conversation to view messages.
                        </div>
                    ) : (
                        <>
                            <div className="wa-chat-heading">
                                <span className={`wa-avatar wa-avatar-${Number(selected.id.slice(-2), 16) % 4 || 1}`}>
                                    {selected.initials}
                                </span>

                                <div className="wa-chat-person">
                                    <h2>{selected.name}</h2>
                                    <p>
                                        {selected.phone}
                                    </p>
                                </div>
                                {selected.aiPaused && (
                                    <button
                                        type="button"
                                        className="wa-resume-ai"
                                        onClick={resumeAutomation}
                                    >
                                        Resume AI
                                    </button>
                                )}

                                <div className="wa-status-wrap"><span className={`wa-status-pill ${statusClass(selected.status)}`}><i /> {selected.status}</span></div>

                                <button className="wa-more-btn"
                                    type="button"
                                    title="More options"
                                    onClick={() => setError("More actions are not configured yet.")}
                                >
                                    ⋮
                                </button>
                            </div>

                            <div className="wa-message-area">
                                <div className="wa-date-divider">
                                    <span>Today</span>
                                </div>

                                {loadingMessages && messages.length === 0 && (
                                    <div className="wa-empty-list">
                                        Loading messages...
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`wa-message-line ${
                                            message.from === "me"
                                                ? "outgoing"
                                                : "incoming"
                                        }`}
                                    >
                                        <div className="wa-message-bubble">
                                            <p>{message.text}</p>
                                            <time>
                                                {message.time}
                                                {message.from === "me" && (
                                                    <span className="wa-checks">
                                                        {" "}✓✓
                                                    </span>
                                                )}
                                            </time>
                                        </div>
                                    </div>
                                ))}

                                {!loadingMessages && messages.length === 0 && (
                                    <div className="wa-empty-list">
                                        No messages in this conversation.
                                    </div>
                                )}
                            </div>

                            <div className="wa-reply-area">
                                <div className="wa-reply-tabs">
                                    {["Reply", "Templates", "Quick Replies"].map((tab) => (
                                        <button
                                            type="button"
                                            key={tab}
                                            className={activeTab === tab ? "active" : ""}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === "Reply" ? (
                                    <div className="wa-composer">
                                        <textarea
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Type a message (Shift + Enter for new line)..."
                                        />

                                        <div className="wa-composer-actions">
                                            <div>
                                                <button
                                                    type="button"
                                                    title="Emoji"
                                                    onClick={() => setDraft((v) => v + " 😊")}
                                                >
                                                    ☺
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className="wa-send-btn"
                                                onClick={sendMessage}
                                                disabled={sending || !draft.trim()}
                                            >
                                                ➤
                                                <span>
                                                    {sending ? "Sending..." : "Send"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="wa-template-panel">
                                        {activeTab === "Templates" ? (
                                            <>
                                                <strong>Message templates</strong>
                                                <p>
                                                    Approved WhatsApp templates
                                                    are managed through your
                                                    connected WhatsApp Business API.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab("Reply")}
                                                >
                                                    Back to reply
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <strong>Quick replies</strong>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDraft("Namaste! Thank you for contacting our clinic. How may we help you?");
                                                        setActiveTab("Reply");
                                                    }}
                                                >
                                                    Greeting
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDraft("We can help arrange a consultation. Please share your preferred date and time.");
                                                        setActiveTab("Reply");
                                                    }}
                                                >
                                                    Book consultation
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDraft("Our team will get back to you shortly.");
                                                        setActiveTab("Reply");
                                                    }}
                                                >
                                                    Follow-up
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <p className="wa-ui-note">
                                    Messages are sent using the WhatsApp number
                                    connected to this client's account.
                                </p>
                            </div>
                        </>
                    )}
                </section>

                <aside className="wa-panel wa-contact-panel">
                    {!selected ? (
                        <div style={{ padding: 24, textAlign: "center" }}>
                            No contact selected.
                        </div>
                    ) : (
                        <>
                            <div className="wa-contact-heading">
                                <h2>Contact Details</h2>
                                <button
                                    type="button"
                                    onClick={() => setError("Contact editing is not connected yet.")}
                                >
                                    ✎ Edit
                                </button>
                            </div>

                            <div className="wa-contact-profile">
                                <span className="wa-avatar wa-avatar-large wa-avatar-1">
                                    {selected.initials}
                                </span>
                                <div>
                                    <h3>{selected.name}</h3>
                                    <p>
                                        <span className="wa-mini-whatsapp">◉</span>
                                        {" "}{selected.phone}
                                    </p>
                                </div>
                            </div>

                            <div className="wa-contact-meta">
                                <div>
                                    <span>✉</span>
                                    <label>Email</label>
                                    <strong>{selected.email}</strong>
                                </div>
                                <div>
                                    <span>♧</span>
                                    <label>Lead Source</label>
                                    <strong>{selected.source}</strong>
                                </div>
                                <div>
                                    <span>▣</span>
                                    <label>Enquiry Type</label>
                                    <strong>{selected.enquiry}</strong>
                                </div>
                                <div>
                                    <span>◉</span>
                                    <label>Status</label>
                                    <strong>
                                        <em className={`wa-mini-status ${statusClass(selected.status)}`} />
                                        {selected.status}
                                    </strong>
                                </div>
                                <div>
                                    <span>♙</span>
                                    <label>Assigned To</label>
                                    <strong className="wa-assigned">
                                        Workspace user
                                    </strong>
                                </div>
                                <div>
                                    <span>◷</span>
                                    <label>Created At</label>
                                    <strong>{selected.created}</strong>
                                </div>
                                <div>
                                    <span>◷</span>
                                    <label>Last Message</label>
                                    <strong>{selected.lastMessage}</strong>
                                </div>
                            </div>

                            <section className="wa-side-section">
                                <div className="wa-side-title">
                                    <h3>Tags</h3>
                                </div>
                                <div className="wa-side-tags">
                                    {(selected.tags || []).map((tag) => (
                                        <span key={tag}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            <section className="wa-side-section wa-notes-section">
                                <div className="wa-side-title">
                                    <h3>Notes</h3>
                                </div>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add notes about this customer..."
                                />
                            </section>

                            <section className="wa-side-section wa-activity-section">
                                <div className="wa-side-title">
                                    <h3>Recent Activity</h3>
                                    <button
                                        type="button"
                                        onClick={() => fetchMessages(selected.id)}
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="wa-activity-item">
                                    <span className="wa-activity-icon">◉</span>
                                    <div>
                                        <strong>
                                            Conversation {selected.status}
                                        </strong>
                                        <p>{selected.preview}</p>
                                    </div>
                                    <time>{selected.time}</time>
                                </div>

                                <div className="wa-activity-item">
                                    <span className="wa-activity-icon tag-icon">◆</span>
                                    <div>
                                        <strong>WhatsApp conversation</strong>
                                        <p>{selected.phone}</p>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </aside>
            </section>
        </main>
    );
}
