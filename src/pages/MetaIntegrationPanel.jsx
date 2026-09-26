import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("vitalsToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("vitalsToken") ||
    ""
  );
};

const api = async (path, options = {}) => {
  const token = getToken();

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};

const SourceCard = ({
  title,
  status,
  description,
  children,
  actions,
  disabled = false,
}) => {
  const connected = status === "Connected";

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fff",
        padding: 18,
        minHeight: 150,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {title}
          </h3>

          {status && (
            <span
              style={{
                padding: "5px 9px",
                borderRadius: 999,
                background: connected ? "#edf9f1" : "#f1f5f9",
                color: connected ? "#16803c" : "#64748b",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {status}
            </span>
          )}
        </div>

        {description && (
          <div
            style={{
              marginTop: 9,
              fontSize: 13,
              lineHeight: 1.55,
              color: "#64748b",
            }}
          >
            {description}
          </div>
        )}

        {children}
      </div>

      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 15,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
};

const OutlineButton = ({
  children,
  onClick,
  disabled = false,
  danger = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 36,
        padding: "0 14px",
        borderRadius: 8,
        border: `1px solid ${danger ? "#fecaca" : "#dbe3ec"}`,
        background: "#fff",
        color: danger ? "#dc2626" : "#475569",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
};

const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 36,
        padding: "0 15px",
        borderRadius: 8,
        border: "1px solid #2563eb",
        background: "#2563eb",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {children}
    </button>
  );
};

const GoogleAccountModal = ({
  accounts,
  selectedId,
  setSelectedId,
  onClose,
  onSelect,
  busy,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "80vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(15, 23, 42, .2)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Select Google Ads Account
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Choose the account you want to connect.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#64748b",
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {accounts.length === 0 ? (
            <div
              style={{
                padding: 15,
                borderRadius: 10,
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              No Google Ads accounts were found.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              {accounts.map((account) => {
                const id = account.customerId;

                return (
                  <label
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 13,
                      border: `1px solid ${
                        selectedId === id ? "#93c5fd" : "#e2e8f0"
                      }`,
                      borderRadius: 10,
                      background:
                        selectedId === id ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="googleAdsAccount"
                      checked={selectedId === id}
                      onChange={() => setSelectedId(id)}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: "#2563eb",
                      }}
                    />

                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {account.customerName || "Google Ads Account"}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        Customer ID: {id}
                      </div>

                      {(account.currencyCode || account.timeZone) && (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 11,
                            color: "#94a3b8",
                          }}
                        >
                          {account.currencyCode || ""}
                          {account.currencyCode && account.timeZone
                            ? " • "
                            : ""}
                          {account.timeZone || ""}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <OutlineButton onClick={onClose} disabled={busy}>
              Cancel
            </OutlineButton>

            <PrimaryButton
              onClick={onSelect}
              disabled={!selectedId || busy}
            >
              {busy ? "Connecting..." : "Connect Account"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetaPageModal = ({
  pages,
  selectedId,
  setSelectedId,
  onClose,
  onSelect,
  busy,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "80vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(15, 23, 42, .2)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Select Facebook Page
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Choose the Facebook Page you want to connect.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#64748b",
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {pages.length === 0 ? (
            <div
              style={{
                padding: 15,
                borderRadius: 10,
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              No Facebook Pages were found.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              {pages.map((page) => (
                <label
                  key={page.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 13,
                    border: `1px solid ${
                      selectedId === page.id ? "#93c5fd" : "#e2e8f0"
                    }`,
                    borderRadius: 10,
                    background:
                      selectedId === page.id ? "#eff6ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="metaPage"
                    checked={selectedId === page.id}
                    onChange={() => setSelectedId(page.id)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: "#2563eb",
                    }}
                  />

                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {page.name || "Facebook Page"}
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      Page ID: {page.id}
                    </div>

                    {page.instagramUsername && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: "#94a3b8",
                        }}
                      >
                        Instagram: @{page.instagramUsername}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <OutlineButton onClick={onClose} disabled={busy}>
              Cancel
            </OutlineButton>

            <PrimaryButton
              onClick={onSelect}
              disabled={!selectedId || busy}
            >
              {busy ? "Connecting..." : "Connect Page"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MetaIntegrationPanel() {
  const [loading, setLoading] = useState(true);

  const [metaConnected, setMetaConnected] = useState(false);
  const [metaPage, setMetaPage] = useState(null);
  const [metaPages, setMetaPages] = useState([]);
  const [showMetaPageModal, setShowMetaPageModal] = useState(false);
  const [selectedMetaPage, setSelectedMetaPage] = useState("");

  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleAccount, setGoogleAccount] = useState(null);
  const [googleAccounts, setGoogleAccounts] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [connectingMeta, setConnectingMeta] = useState(false);
  const [disconnectingMeta, setDisconnectingMeta] = useState(false);

  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState("");

  const loadMetaStatus = async () => {
    try {
      const data = await api("/api/integrations/meta/status");

      setMetaConnected(Boolean(data.connected));

      const integration = data.integration || null;

      setMetaPage(
        integration
          ? {
              name: integration.pageName || "",
              pageName: integration.pageName || "",
              pageId: integration.pageId || "",
              instagramUsername:
                integration.instagramUsername || "",
              instagramName: integration.instagramName || "",
            }
          : null
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const loadMetaPages = async () => {
    try {
      const data = await api("/api/integrations/meta/pages");

      const pages = data.pages || [];

      setMetaPages(pages);

      if (pages.length === 1) {
        setSelectedMetaPage(pages[0].id);
      } else {
        setSelectedMetaPage("");
      }

      setShowMetaPageModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadGoogleStatus = async () => {
    try {
      const data = await api(
        "/api/integrations/google/accounts"
      );

      setGoogleConnected(Boolean(data.connected));

      setGoogleAccount(
        data.account ||
          data.selectedAccount ||
          null
      );

      setGoogleAccounts(
        data.accounts ||
          data.availableAccounts ||
          []
      );
    } catch (err) {
      setGoogleConnected(false);
      setGoogleAccount(null);
      setGoogleAccounts([]);
    }
  };

  const loadStatus = async () => {
    setLoading(true);
    setError("");

    await Promise.all([
      loadMetaStatus(),
      loadGoogleStatus(),
    ]);

    setLoading(false);
  };

  const selectMetaPage = async () => {
    if (!selectedMetaPage) {
      return;
    }

    setConnectingMeta(true);
    setError("");
    setMessage("");

    try {
      const data = await api(
        "/api/integrations/meta/select-page",
        {
          method: "POST",
          body: JSON.stringify({
            pageId: selectedMetaPage,
          }),
        }
      );

      setMetaConnected(true);

      const integration = data.integration || null;

      setMetaPage(
        integration
          ? {
              name: integration.pageName || "",
              pageName: integration.pageName || "",
              pageId: integration.pageId || "",
              instagramUsername:
                integration.instagramUsername || "",
              instagramName: integration.instagramName || "",
            }
          : null
      );

      setShowMetaPageModal(false);

      setMessage(
        "Facebook Page connected successfully."
      );

      await loadMetaStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setConnectingMeta(false);
    }
  };

  const connectMeta = async () => {
    setConnectingMeta(true);
    setError("");
    setMessage("");

    try {
      const data = await api(
        "/api/integrations/meta/connect",
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!data.authorizationUrl) {
        throw new Error(
          "Meta authorization URL was not returned."
        );
      }

      window.location.assign(data.authorizationUrl);
    } catch (err) {
      setError(err.message);
      setConnectingMeta(false);
    }
  };

  const disconnectMeta = async () => {
    setDisconnectingMeta(true);
    setError("");
    setMessage("");

    try {
      await api(
        "/api/integrations/meta/disconnect",
        {
          method: "POST",
        }
      );

      setMetaConnected(false);
      setMetaPage(null);
      setMetaPages([]);
      setSelectedMetaPage("");
      setShowMetaPageModal(false);

      setMessage(
        "Meta disconnected successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDisconnectingMeta(false);
    }
  };

  const connectGoogleAds = async () => {
    setGoogleBusy(true);
    setError("");
    setMessage("");

    try {
      const data = await api(
        "/api/integrations/google/connect",
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!data.authorizationUrl) {
        throw new Error(
          "Google authorization URL was not returned."
        );
      }

      window.location.assign(data.authorizationUrl);
    } catch (err) {
      setError(err.message);
      setGoogleBusy(false);
    }
  };

  const openGoogleAccountSelector = async () => {
    setGoogleBusy(true);
    setError("");
    setMessage("");

    try {
      const data = await api(
        "/api/integrations/google/accounts"
      );

      const accounts =
        data.accounts ||
        data.availableAccounts ||
        [];

      setGoogleAccounts(accounts);

      setGoogleAccount(
        data.account ||
          data.selectedAccount ||
          null
      );

      const currentId =
        data.account?.customerId ||
        data.selectedAccount?.customerId ||
        "";

      setSelectedGoogleAccount(currentId);
      setShowGoogleModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleBusy(false);
    }
  };

  const selectGoogleAccount = async () => {
    if (!selectedGoogleAccount) {
      return;
    }

    setGoogleBusy(true);
    setError("");
    setMessage("");

    try {
      const data = await api(
        "/api/integrations/google/select-account",
        {
          method: "POST",
          body: JSON.stringify({
            customerId: selectedGoogleAccount,
          }),
        }
      );

      setGoogleConnected(true);

      setGoogleAccount(
        data.account ||
          data.selectedAccount ||
          googleAccounts.find(
            (account) =>
              account.customerId ===
              selectedGoogleAccount
          ) ||
          null
      );

      setShowGoogleModal(false);

      setMessage(
        "Google Ads account connected successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleBusy(false);
    }
  };

  const disconnectGoogleAds = async () => {
    setGoogleDisconnecting(true);
    setError("");
    setMessage("");

    try {
      await api(
        "/api/integrations/google/disconnect",
        {
          method: "POST",
        }
      );

      setGoogleConnected(false);
      setGoogleAccount(null);
      setSelectedGoogleAccount("");

      setMessage(
        "Google Ads disconnected successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleDisconnecting(false);
    }
  };

  useEffect(() => {
    loadStatus();

    const params = new URLSearchParams(
      window.location.search
    );

    const googleState = params.get("google");
    const metaState = params.get("meta");
    const metaSelectPage =
      params.get("metaSelectPage");

    if (googleState === "connected") {
      setMessage(
        "Google Ads connected successfully."
      );
    }

    if (googleState === "select_account") {
      setMessage(
        "Select the Google Ads account you want to connect."
      );
    }

    if (googleState === "no_accounts") {
      setError(
        "No accessible Google Ads accounts were found."
      );
    }

    if (googleState === "cancelled") {
      setMessage(
        "Google Ads connection was cancelled."
      );
    }

    if (googleState === "error") {
      setError(
        "Google Ads connection failed."
      );
    }

    if (metaState === "connected") {
      setMessage(
        "Meta connected successfully."
      );
    }

    if (metaState === "cancelled") {
      setMessage(
        "Meta connection was cancelled."
      );
    }

    if (metaState === "error") {
      setError(
        "Meta connection failed."
      );
    }

    if (metaSelectPage === "true") {
      loadMetaPages();
    }

    if (
      googleState ||
      metaState ||
      metaSelectPage
    ) {
      const url = new URL(
        window.location.href
      );

      url.searchParams.delete("google");
      url.searchParams.delete("meta");
      url.searchParams.delete(
        "metaSelectPage"
      );
      url.searchParams.delete("message");

      window.history.replaceState(
        {},
        "",
        url.pathname
      );
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          color: "#64748b",
          fontSize: 13,
        }}
      >
        Loading integrations...
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          maxWidth: 960,
        }}
      >
        {message && (
          <div
            style={{
              marginBottom: 14,
              padding: "10px 13px",
              borderRadius: 9,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: 13,
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: "10px 13px",
              borderRadius: 9,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              color: "#2563eb",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Lead Sources
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 25,
              lineHeight: 1.2,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Meta Lead Ads
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Connect your advertising platforms to receive leads
            directly in SaleVitals.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          <SourceCard
            title="Website"
            status={null}
            description="Existing website lead integration"
          />

          <SourceCard
            title="Facebook"
            status={
              metaConnected
                ? "Connected"
                : "Not connected"
            }
            description={
              metaConnected && metaPage
                ? `Page: ${
                    metaPage.name ||
                    metaPage.pageName ||
                    "Connected page"
                  }`
                : "Connect Facebook Pages to receive Facebook leads."
            }
            actions={
              metaConnected ? (
                <OutlineButton
                  onClick={disconnectMeta}
                  disabled={disconnectingMeta}
                  danger
                >
                  {disconnectingMeta
                    ? "Disconnecting..."
                    : "Disconnect"}
                </OutlineButton>
              ) : (
                <PrimaryButton
                  onClick={connectMeta}
                  disabled={connectingMeta}
                >
                  {connectingMeta
                    ? "Connecting..."
                    : "Connect Facebook"}
                </PrimaryButton>
              )
            }
          />

          <SourceCard
            title="Instagram"
            status={
              metaConnected
                ? "Connected"
                : "Not connected"
            }
            description={
              metaConnected
                ? metaPage?.instagramUsername
                  ? `@${metaPage.instagramUsername}`
                  : metaPage?.instagramName ||
                    "Instagram connected through Facebook Page."
                : "Connect Instagram through your Facebook Page."
            }
          />

          <SourceCard
            title="Google Ads"
            status={
              googleConnected
                ? "Connected"
                : "Not connected"
            }
            description={
              googleConnected && googleAccount
                ? googleAccount.customerName ||
                  `Customer ID: ${googleAccount.customerId}`
                : "Connect your Google Ads account to receive leads in SaleVitals."
            }
            actions={
              googleConnected ? (
                <>
                  <OutlineButton
                    onClick={openGoogleAccountSelector}
                    disabled={googleBusy}
                  >
                    Change
                  </OutlineButton>

                  <OutlineButton
                    onClick={disconnectGoogleAds}
                    disabled={googleDisconnecting}
                    danger
                  >
                    {googleDisconnecting
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </OutlineButton>
                </>
              ) : (
                <PrimaryButton
                  onClick={connectGoogleAds}
                  disabled={googleBusy}
                >
                  {googleBusy
                    ? "Connecting..."
                    : "Connect Google Ads"}
                </PrimaryButton>
              )
            }
          >
            {googleConnected && googleAccount && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                Customer ID: {googleAccount.customerId}
              </div>
            )}
          </SourceCard>

          <SourceCard
            title="WhatsApp"
            status="Coming soon"
            description="WhatsApp lead integration will be available soon."
            disabled
          />
        </div>
      </div>

      {showMetaPageModal && (
        <MetaPageModal
          pages={metaPages}
          selectedId={selectedMetaPage}
          setSelectedId={setSelectedMetaPage}
          onClose={() =>
            setShowMetaPageModal(false)
          }
          onSelect={selectMetaPage}
          busy={connectingMeta}
        />
      )}

      {showGoogleModal && (
        <GoogleAccountModal
          accounts={googleAccounts}
          selectedId={selectedGoogleAccount}
          setSelectedId={setSelectedGoogleAccount}
          onClose={() =>
            setShowGoogleModal(false)
          }
          onSelect={selectGoogleAccount}
          busy={googleBusy}
        />
      )}
    </>
  );
}