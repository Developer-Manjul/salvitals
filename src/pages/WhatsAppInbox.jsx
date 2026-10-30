import React, { useMemo, useState } from "react";
import "../styles/WhatsAppInbox.scss";

const initialConversations = [
    {
        id: 1, name: "Rahul Sharma", phone: "+91 9876543245", initials: "RS",
        preview: "Hello, mujhe appointment chahiye", time: "11:32 AM", unread: 2,
        status: "Open", source: "Website", enquiry: "Consultation - Plastic Surgery",
        email: "rahul.sharma@gmail.com", created: "28 Oct 2026, 11:28 AM",
        lastMessage: "28 Oct 2026, 11:32 AM",
        tags: ["New Lead", "Website", "Consultation - Plastic Surgery"],
        messages: [
            { id: 1, from: "them", text: "Hello, mujhe appointment chahiye", time: "11:28 AM" },
            { id: 2, from: "me", text: "Namaste Rahul ji!\\nKis treatment ke liye appointment chahiye?", time: "11:30 AM" },
            { id: 3, from: "them", text: "Consultation ke liye", time: "11:31 AM" },
            { id: 4, from: "me", text: "Bilkul, main aapki appointment request note kar raha hoon.\\nKya aap apni preferred date aur time bata sakte hain?", time: "11:32 AM" },
            { id: 5, from: "them", text: "Haan, is week Wednesday morning possible hai?", time: "11:32 AM" },
        ],
    },
    {
        id: 2, name: "Priya Verma", phone: "+91 9812345678", initials: "PV",
        preview: "What is the cost of rhinoplasty?", time: "10:15 AM", unread: 1,
        status: "Open", source: "Website", enquiry: "Rhinoplasty",
        email: "Not provided", created: "28 Oct 2026, 10:02 AM", lastMessage: "28 Oct 2026, 10:15 AM",
        tags: ["New Lead", "Rhinoplasty"],
        messages: [
            { id: 1, from: "them", text: "What is the cost of rhinoplasty?", time: "10:12 AM" },
            { id: 2, from: "me", text: "Hi Priya, cost depends on your consultation and treatment plan. Would you like us to arrange a consultation?", time: "10:15 AM" },
        ],
    },
    {
        id: 3, name: "Amit Kumar", phone: "+91 9898989898", initials: "AK",
        preview: "Thank you doctor", time: "09:48 AM", unread: 1,
        status: "Open", source: "WhatsApp", enquiry: "General enquiry",
        email: "Not provided", created: "27 Oct 2026, 04:20 PM", lastMessage: "28 Oct 2026, 09:48 AM",
        tags: ["Follow-up"], messages: [{ id: 1, from: "them", text: "Thank you doctor", time: "09:48 AM" }],
    },
    {
        id: 4, name: "Neha Gupta", phone: "+91 9876501234", initials: "NG",
        preview: "Is hair transplant safe?", time: "Yesterday", unread: 0,
        status: "Open", source: "WhatsApp", enquiry: "Hair Transplant",
        email: "neha.gupta@gmail.com", created: "27 Oct 2026, 02:12 PM", lastMessage: "27 Oct 2026, 03:10 PM",
        tags: ["Hair Transplant"], messages: [{ id: 1, from: "them", text: "Is hair transplant safe?", time: "Yesterday" }],
    },
    {
        id: 5, name: "Vikram Singh", phone: "+91 9890012345", initials: "VS",
        preview: "Can I get consultation this week?", time: "Yesterday", unread: 3,
        status: "Open", source: "WhatsApp", enquiry: "Consultation",
        email: "Not provided", created: "26 Oct 2026, 11:15 AM", lastMessage: "27 Oct 2026, 01:30 PM",
        tags: ["Consultation"], messages: [{ id: 1, from: "them", text: "Can I get consultation this week?", time: "Yesterday" }],
    },
    {
        id: 6, name: "Sneha Patel", phone: "+91 9810011223", initials: "SP",
        preview: "Do you have any non-surgical options?", time: "28 Oct", unread: 0,
        status: "Closed", source: "WhatsApp", enquiry: "Non-surgical options",
        email: "Not provided", created: "26 Oct 2026, 12:12 PM", lastMessage: "28 Oct 2026, 05:05 PM",
        tags: ["Non-surgical"], messages: [{ id: 1, from: "them", text: "Do you have any non-surgical options?", time: "28 Oct" }],
    },
    {
        id: 7, name: "Anjali Mehta", phone: "+91 9876123450", initials: "AM",
        preview: "Location please", time: "27 Oct", unread: 0,
        status: "Closed", source: "WhatsApp", enquiry: "Clinic location",
        email: "Not provided", created: "25 Oct 2026, 01:10 PM", lastMessage: "27 Oct 2026, 02:00 PM",
        tags: ["Location"], messages: [{ id: 1, from: "them", text: "Location please", time: "27 Oct" }],
    },
    {
        id: 8, name: "Rohit Bansal", phone: "+91 9876123400", initials: "RB",
        preview: "What is the cost?", time: "26 Oct", unread: 0,
        status: "Closed", source: "WhatsApp", enquiry: "Pricing",
        email: "Not provided", created: "24 Oct 2026, 10:00 AM", lastMessage: "26 Oct 2026, 04:10 PM",
        tags: ["Pricing"], messages: [{ id: 1, from: "them", text: "What is the cost?", time: "26 Oct" }],
    },
];

const statusClass = (status) => status.toLowerCase().replace(/\s+/g, "-");

export default function WhatsAppInbox() {
    const [conversations, setConversations] = useState(initialConversations);
    const [selectedId, setSelectedId] = useState(1);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState("");
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Reply");
    const [note, setNote] = useState("");
    const [tags, setTags] = useState({});
    const [refreshing, setRefreshing] = useState(false);

    const selected = conversations.find((item) => item.id === selectedId) || conversations[0];

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return conversations.filter((item) => {
            const matchesFilter = filter === "All" || item.status === filter;
            const matchesSearch = !q || [item.name, item.phone, item.preview, item.enquiry].some((v) => (v || "").toLowerCase().includes(q));
            return matchesFilter && matchesSearch;
        });
    }, [conversations, filter, search]);

    const updateConversation = (id, updater) => {
        setConversations((items) => items.map((item) => item.id === id ? updater(item) : item));
    };

    const changeStatus = (status) => {
        updateConversation(selected.id, (item) => ({ ...item, status }));
        setStatusMenuOpen(false);
    };

    const sendMessage = () => {
        const text = draft.trim();
        if (!text) return;
        updateConversation(selected.id, (item) => ({
            ...item,
            preview: text.replace(/\n/g, " "),
            time: "Now",
            lastMessage: "Just now",
            messages: [...item.messages, { id: Date.now(), from: "me", text, time: "Now" }],
        }));
        setDraft("");
    };

    const addTag = () => {
        const tag = window.prompt("Enter a tag");
        if (!tag || !tag.trim()) return;
        const clean = tag.trim();
        updateConversation(selected.id, (item) => ({ ...item, tags: [...new Set([...(item.tags || []), clean])] }));
    };

    const removeTag = (tag) => updateConversation(selected.id, (item) => ({ ...item, tags: item.tags.filter((t) => t !== tag) }));

    const refresh = () => {
        setRefreshing(true);
        window.setTimeout(() => setRefreshing(false), 450);
    };

    return (
        <main className="wa-inbox-page">
            <header className="wa-page-header">
                <div>
                    <div className="wa-eyebrow"><span /> CUSTOMER COMMUNICATION</div>
                    <h1><span className="wa-brand-mark">◉</span> WhatsApp</h1>
                    <p>Manage your WhatsApp conversations, respond to leads and provide instant support.</p>
                </div>
                <button className="wa-refresh-btn" onClick={refresh} type="button">
                    <span className={refreshing ? "wa-spin" : ""}>↻</span> {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </header>

            <section className="wa-inbox-grid">
                <aside className="wa-panel wa-conversation-panel">
                    <div className="wa-panel-heading">
                        <div className="wa-heading-icon">◉</div>
                        <div><h2>Conversations</h2><p>All WhatsApp chats from your business number</p></div>
                    </div>
                    <div className="wa-list-controls">
                        <label className="wa-search">
                            <span>⌕</span>
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, number or message..." />
                        </label>
                        <div className="wa-filter-tabs">
                            {["All", "Open", "Closed"].map((tab) => {
                                const count = tab === "All" ? conversations.length : conversations.filter((c) => c.status === tab).length;
                                return <button key={tab} type="button" className={filter === tab ? "active" : ""} onClick={() => setFilter(tab)}>{tab}<span>{count}</span></button>;
                            })}
                        </div>
                    </div>

                    <div className="wa-conversation-list">
                        {filtered.map((item) => (
                            <button key={item.id} type="button" className={`wa-conversation-row ${selectedId === item.id ? "selected" : ""}`} onClick={() => { setSelectedId(item.id); setStatusMenuOpen(false); }}>
                                <span className={`wa-avatar wa-avatar-${item.id % 4}`}>{item.initials}</span>
                                <span className="wa-row-content">
                                    <span className="wa-row-top"><strong>{item.name}</strong><time>{item.time}</time></span>
                                    <span className="wa-row-preview">{item.preview}</span>
                                    <span className="wa-row-source">WhatsApp</span>
                                </span>
                                {item.unread > 0 && <span className="wa-unread">{item.unread}</span>}
                            </button>
                        ))}
                        {filtered.length === 0 && <div className="wa-empty-list">No conversations found.</div>}
                    </div>
                    <footer className="wa-channel-footer"><span><i /> WhatsApp channel</span><strong>Connected UI</strong></footer>
                </aside>

                <section className="wa-panel wa-chat-panel">
                    <div className="wa-chat-heading">
                        <span className={`wa-avatar wa-avatar-${selected.id % 4}`}>{selected.initials}</span>
                        <div className="wa-chat-person"><h2>{selected.name}</h2><p>{selected.phone} <button type="button" title="Copy number" onClick={() => navigator.clipboard?.writeText(selected.phone)}>▢</button></p></div>
                        <div className="wa-status-wrap">
                            <button type="button" className={`wa-status-pill ${statusClass(selected.status)}`} onClick={() => setStatusMenuOpen((v) => !v)}>
                                <i /> {selected.status} <span>⌄</span>
                            </button>
                            {statusMenuOpen && <div className="wa-status-menu">
                                {["Open", "Closed", "Pending", "Lost"].map((status) => <button key={status} type="button" onClick={() => changeStatus(status)}><i className={statusClass(status)} />{status}</button>)}
                            </div>}
                        </div>
                        <button className="wa-more-btn" type="button" title="More options" onClick={() => window.alert("More conversation actions can be connected here.")}>⋮</button>
                    </div>

                    <div className="wa-tag-strip">
                        {(selected.tags || []).slice(0, 3).map((tag) => <span className="wa-tag" key={tag}>{tag}<button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>×</button></span>)}
                        <button className="wa-add-tag" type="button" onClick={addTag}>＋ Add Tag</button>
                    </div>

                    <div className="wa-message-area">
                        <div className="wa-date-divider"><span>Today</span></div>
                        {selected.messages.map((message) => (
                            <div key={message.id} className={`wa-message-line ${message.from === "me" ? "outgoing" : "incoming"}`}>
                                <div className="wa-message-bubble">
                                    <p>{message.text}</p>
                                    <time>{message.time}{message.from === "me" && <span className="wa-checks"> ✓✓</span>}</time>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="wa-reply-area">
                        <div className="wa-reply-tabs">
                            {["Reply", "Templates", "Quick Replies"].map((tab) => <button type="button" key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
                        </div>
                        {activeTab === "Reply" ? (
                            <div className="wa-composer">
                                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type a message (Shift + Enter for new line)..." />
                                <div className="wa-composer-actions"><div><button type="button" title="Emoji" onClick={() => setDraft((v) => v + " 😊")}>☺</button><button type="button" title="Attach" onClick={() => window.alert("Attachment sending can be connected to the WhatsApp API.")}>♧</button><button type="button" title="Image" onClick={() => window.alert("Media sending can be connected to the WhatsApp API.")}>▧</button></div><button type="button" className="wa-send-btn" onClick={sendMessage}>➤ <span>Send</span></button></div>
                            </div>
                        ) : (
                            <div className="wa-template-panel">
                                {activeTab === "Templates" ? (
                                    <><strong>Message templates</strong><p>Approved WhatsApp templates will appear here once the WhatsApp Business API is connected.</p><button type="button" onClick={() => setActiveTab("Reply")}>Back to reply</button></>
                                ) : (
                                    <><strong>Quick replies</strong><button type="button" onClick={() => { setDraft("Namaste! Thank you for contacting our clinic. How may we help you?"); setActiveTab("Reply"); }}>Greeting</button><button type="button" onClick={() => { setDraft("We can help arrange a consultation. Please share your preferred date and time."); setActiveTab("Reply"); }}>Book consultation</button><button type="button" onClick={() => { setDraft("Our team will get back to you shortly."); setActiveTab("Reply"); }}>Follow-up</button></>
                                )}
                            </div>
                        )}
                        <p className="wa-ui-note">UI preview. Sending and receiving live WhatsApp messages requires a connected WhatsApp Business API.</p>
                    </div>
                </section>

                <aside className="wa-panel wa-contact-panel">
                    <div className="wa-contact-heading"><h2>Contact Details</h2><button type="button" onClick={() => window.alert("Contact editing can be connected to your CRM contact API.")}>✎ Edit</button></div>
                    <div className="wa-contact-profile">
                        <span className={`wa-avatar wa-avatar-large wa-avatar-${selected.id % 4}`}>{selected.initials}</span>
                        <div><h3>{selected.name}</h3><p><span className="wa-mini-whatsapp">◉</span> {selected.phone}</p></div>
                    </div>
                    <div className="wa-contact-meta">
                        <div><span>✉</span><label>Email</label><strong>{selected.email || "Not provided"}</strong></div>
                        <div><span>♧</span><label>Lead Source</label><strong>{selected.source}</strong></div>
                        <div><span>▣</span><label>Enquiry Type</label><strong>{selected.enquiry}</strong></div>
                        <div><span>◉</span><label>Status</label><strong><em className={`wa-mini-status ${statusClass(selected.status)}`} />{selected.status}</strong></div>
                        <div><span>♙</span><label>Assigned To</label><strong className="wa-assigned">Dr. Preeti Yadav⌄</strong></div>
                        <div><span>◷</span><label>Created At</label><strong>{selected.created}</strong></div>
                        <div><span>◷</span><label>Last Message</label><strong>{selected.lastMessage}</strong></div>
                    </div>
                    <section className="wa-side-section">
                        <div className="wa-side-title"><h3>Tags</h3><button type="button" onClick={addTag}>＋ Add Tag</button></div>
                        <div className="wa-side-tags">{(selected.tags || []).map((tag) => <span key={tag}>{tag}<button type="button" onClick={() => removeTag(tag)}>×</button></span>)}</div>
                    </section>
                    <section className="wa-side-section wa-notes-section">
                        <div className="wa-side-title"><h3>Notes</h3><button type="button" onClick={() => window.alert("Note saved for this session.")}>＋ Add Note</button></div>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add notes about this customer..." />
                    </section>
                    <section className="wa-side-section wa-activity-section">
                        <div className="wa-side-title"><h3>Recent Activity</h3><button type="button" onClick={() => window.alert("Showing recent activity for this conversation.")}>View All</button></div>
                        <div className="wa-activity-item"><span className="wa-activity-icon">◉</span><div><strong>Conversation {selected.status.toLowerCase()}</strong><p>{selected.preview}</p></div><time>{selected.time}</time></div>
                        <div className="wa-activity-item"><span className="wa-activity-icon tag-icon">◆</span><div><strong>Tags updated</strong><p>{(selected.tags || []).join(", ") || "No tags added"}</p></div></div>
                    </section>
                </aside>
            </section>
        </main>
    );
}
