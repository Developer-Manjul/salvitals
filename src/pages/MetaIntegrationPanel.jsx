import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/api";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("vitalsToken") || sessionStorage.getItem("vitalsToken") || "";
}

async function api(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to complete Meta request");
  return data;
}

export default function MetaIntegrationPanel() {
  const [status, setStatus] = useState(null);
  const [pages, setPages] = useState([]);
  const [showPages, setShowPages] = useState(false);
  const [selectedPage, setSelectedPage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadStatus = async () => {
    try {
      const data = await api("/api/integrations/meta/status");
      setStatus(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadPages = async () => {
    try {
      const data = await api("/api/integrations/meta/pages");
      setPages(data.pages || []);
      setShowPages(true);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("metaSelectPage") === "true") loadPages();
    if (params.get("metaError")) setMessage(params.get("metaError"));
  }, []);

  const connect = async () => {
    setBusy(true);
    setMessage("");
    try {
      const data = await api("/api/integrations/meta/connect", { headers: { Accept: "application/json" } });
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setMessage(error.message);
      setBusy(false);
    }
  };

  const selectPage = async () => {
    if (!selectedPage) return;
    setBusy(true);
    try {
      await api("/api/integrations/meta/select-page", { method: "POST", body: JSON.stringify({ pageId: selectedPage }) });
      setShowPages(false);
      setMessage("Meta Page connected successfully.");
      await loadStatus();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api("/api/integrations/meta/disconnect", { method: "POST" });
      setMessage("Meta connection disconnected.");
      await loadStatus();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      await api("/api/integrations/meta/refresh", { method: "POST" });
      setMessage("Meta connection refreshed.");
      await loadStatus();
    } catch (error) {
      setMessage(error.message);
      await loadStatus();
    } finally {
      setBusy(false);
    }
  };

  const integration = status?.integration;

  return (
    <div className="meta-settings-panel">
      <div className="settings-section-heading"><div><p className="settings-eyebrow">LEAD SOURCES</p><h2>Meta Lead Ads</h2><p>Connect Facebook Pages to receive Facebook and Instagram leads in SaleVitals.</p></div></div>
      {!status?.configured && <div className="meta-settings-alert">Meta integration is not configured yet. Add the server-side Meta environment variables before connecting.</div>}
      {message && <div className="meta-settings-message">{message}</div>}
      <div className="meta-source-grid">
        <div className="meta-source-card"><div><strong>Website</strong><span>Connected</span></div><small>Existing website lead integration</small></div>
        <div className="meta-source-card"><div><strong>Facebook</strong><span className={integration ? "connected" : ""}>{integration ? "Connected" : "Not connected"}</span></div><small>{integration ? `Page: ${integration.pageName || integration.pageId}` : "Facebook Lead Ads"}</small><div className="meta-source-actions">{integration ? <><button type="button" className="dash-btn" onClick={refresh} disabled={busy}>Refresh connection</button><button type="button" className="lead-secondary-btn" onClick={disconnect} disabled={busy}>Disconnect</button></> : <button type="button" className="dash-btn primary" onClick={connect} disabled={busy || !status?.configured}>{busy ? "Connecting..." : "Connect Facebook"}</button>}</div></div>
        <div className="meta-source-card"><div><strong>Instagram</strong><span className={integration?.instagramUsername ? "connected" : ""}>{integration?.instagramUsername ? "Connected" : "Not connected"}</span></div><small>{integration?.instagramUsername ? `@${integration.instagramUsername}` : "Requires a connected Instagram professional account"}</small></div>
        <div className="meta-source-card muted"><div><strong>Google Ads</strong><span>Coming soon</span></div></div>
        <div className="meta-source-card muted"><div><strong>WhatsApp</strong><span>Coming soon</span></div></div>
      </div>
      {showPages && <div className="meta-page-picker"><div className="meta-page-picker-inner"><h3>Select Facebook Page</h3><p>Choose which authorized Page should send leads to this SaleVitals account.</p>{pages.length ? pages.map((page) => <label className="meta-page-option" key={page.id}><input type="radio" name="meta-page" value={page.id} checked={selectedPage === page.id} onChange={() => setSelectedPage(page.id)} /><span><strong>{page.name}</strong><small>{page.id}{page.instagramUsername ? ` · @${page.instagramUsername}` : ""}</small></span></label>) : <p>No Pages were returned by Meta.</p>}<div className="meta-source-actions"><button type="button" className="lead-secondary-btn" onClick={() => setShowPages(false)}>Cancel</button><button type="button" className="dash-btn primary" onClick={selectPage} disabled={busy || !selectedPage}>Connect Page</button></div></div></div>}
    </div>
  );
}
