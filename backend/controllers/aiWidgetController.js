const AIAssistant = require("../models/AIAssistant");

function normalizeColor(value) {
  const color = String(value || "").trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase();
  }

  return "#00656A";
}

function getClientName(assistant) {
  return String(
    assistant.clientName ||
      assistant.businessName ||
      assistant.companyName ||
      assistant.clinicName ||
      assistant.fromName ||
      ""
  ).trim();
}

function getAssistantName(assistant) {
  return String(
    assistant.assistantName || "AI Assistant"
  ).trim();
}

function getFromName(assistant) {
  return String(
    assistant.fromName || ""
  ).trim();
}

function getDefaultWelcomeMessage(assistant) {
  const assistantName =
    getAssistantName(assistant);

  const fromName =
    getFromName(assistant);

  if (fromName) {
    return `Hi 👋 I'm ${assistantName} from ${fromName}. How can I help you today?`;
  }

  return `Hi 👋 I'm ${assistantName}. How can I help you today?`;
}

exports.getConfig = async (req, res) => {
  try {
    const assistant =
      await AIAssistant.findById(
        req.params.assistantId
      ).lean();

    if (
      !assistant ||
      !assistant.enabled ||
      assistant.status !== "active"
    ) {
      return res.status(404).json({
        success: false,
        message: "AI Assistant is unavailable",
      });
    }

    const assistantName =
      getAssistantName(assistant);

    const fromName =
      getFromName(assistant);

    const clientName =
      getClientName(assistant);

    let welcomeMessage =
      String(
        assistant.welcomeMessage || ""
      ).trim();

    if (!welcomeMessage) {
      welcomeMessage =
        getDefaultWelcomeMessage(
          assistant
        );
    }

    return res.json({
      success: true,
      assistant: {
        id: assistant._id,
        assistantName,
        fromName,
        clientName,
        logoUrl: String(
          assistant.logoUrl || ""
        ).trim(),
        primaryColor:
          normalizeColor(
            assistant.primaryColor
          ),
        welcomeMessage,
        enabled: assistant.enabled,
      },
    });
  } catch (error) {
    console.error(
      "AI WIDGET CONFIG ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load AI widget",
    });
  }
};

exports.script = (req, res) => {
const apiOrigin = "https://salevitals.com";

  const widgetHtml = `
<style>
* {
  box-sizing: border-box;
}

:host {
  --ai-color: #00656A;
  --ai-text: #FFFFFF;
}

#launcher {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 60px;
  height: 60px;
  border: 0;
  border-radius: 18px;
  background: var(--ai-color);
  color: var(--ai-text);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 12px 30px rgba(16, 24, 40, 0.18),
    0 4px 12px rgba(16, 24, 40, 0.08);
  cursor: pointer;
  z-index: 2147483646;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

#launcher:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 36px rgba(16, 24, 40, 0.22),
    0 5px 14px rgba(16, 24, 40, 0.10);
}

#launcher:active {
  transform: scale(0.96);
}

#launcher svg {
  width: 28px;
  height: 28px;
}

#panel {
  position: fixed;
  right: 22px;
  bottom: 94px;
  width: 390px;
  max-width: calc(100vw - 28px);
  height: 590px;
  max-height: calc(100vh - 120px);
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow:
    0 24px 70px rgba(16, 24, 40, 0.18),
    0 6px 20px rgba(16, 24, 40, 0.07);
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
  z-index: 2147483645;
  display: none;
}

#panel.open {
  display: flex;
  flex-direction: column;
}

.head {
  background: var(--ai-color);
  color: var(--ai-text);
  min-height: 78px;
  padding: 15px 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: #ffffff;
  color: var(--ai-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
  background: #ffffff;
}

.avatar svg {
  width: 24px;
  height: 24px;
}

.name {
  font-size: 17px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--ai-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 245px;
}

.online {
  margin-top: 5px;
  font-size: 10px;
  line-height: 1;
  color: var(--ai-text);
  opacity: 0.78;
  font-weight: 500;
}

.close {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--ai-text);
  font-size: 25px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  flex-shrink: 0;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
}

.close:hover {
  background: rgba(255, 255, 255, 0.13);
  opacity: 1;
}

.body {
  flex: 1;
  overflow-y: auto;
  background: #f7f9fb;
  padding: 16px;
}

.body::-webkit-scrollbar {
  width: 5px;
}

.body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.welcome {
  width: fit-content;
  max-width: 88%;
  margin: 0 0 14px 0;
  padding: 11px 13px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #3f4858;
  font-size: 12px;
  line-height: 1.55;
  box-shadow:
    0 2px 6px rgba(16, 24, 40, 0.03);
}

.msg {
  display: flex;
  width: 100%;
  margin: 10px 0;
}

.msg.user {
  justify-content: flex-end;
}

.msg.ai,
.msg.system {
  justify-content: flex-start;
}

.ai-message-wrap {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 90%;
}

.message-logo {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ai-color);
  flex-shrink: 0;
}

.message-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 3px;
}

.message-logo svg {
  width: 18px;
  height: 18px;
}

.bubble {
  max-width: 86%;
  padding: 11px 13px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow:
    0 1px 4px rgba(16, 24, 40, 0.03);
}

.user .bubble {
  background: var(--ai-color);
  color: var(--ai-text);
  border-color: var(--ai-color);
  border-bottom-right-radius: 5px;
}

.system .bubble {
  background: #fff7ed;
  border-color: #f5dfc4;
  color: #765a3c;
}

.error {
  font-size: 11px;
  line-height: 1.4;
  color: #b42318;
  padding: 9px 12px;
  background: #fff1f1;
  border-bottom: 1px solid #f3d4d4;
}

.foot {
  border-top: 1px solid #edf0f3;
  background: #ffffff;
  padding: 9px 11px 11px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex-shrink: 0;
}

.powered {
  width: 100%;
  text-align: center;
  font-size: 11px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: #8b95a3;
  padding: 1px 3px 2px;
  background: #ffffff;
}

.input-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
}

.foot input {
  flex: 1;
  width: 100%;
  height: 42px;
  border: 1px solid #dfe4ea;
  border-radius: 11px;
  padding: 0 12px;
  font-size: 12px;
  outline: none;
  color: #263142;
  background: #ffffff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.foot input::placeholder {
  color: #98a1ad;
}

.foot input:focus {
  border-color: var(--ai-color);
  box-shadow:
    0 0 0 3px rgba(0, 101, 106, 0.08);
}

.send {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border: 0;
  border-radius: 11px;
  background: var(--ai-color);
  color: var(--ai-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.send:hover {
  transform: translateY(-1px);
}

.send:active {
  transform: scale(0.96);
}

.send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 520px) {
  #launcher {
    right: 14px;
    bottom: 14px;
    width: 58px;
    height: 58px;
    border-radius: 17px;
  }

  #panel {
    right: 10px;
    bottom: 82px;
    width: calc(100vw - 20px);
    height: calc(100vh - 105px);
    max-height: none;
    border-radius: 19px;
  }

  .head {
    min-height: 74px;
    padding: 13px 14px;
  }

  .avatar {
    width: 43px;
    height: 43px;
  }

  .name {
    font-size: 16px;
    max-width: calc(100vw - 125px);
  }

  .online {
    font-size: 9px;
  }

  .body {
    padding: 13px;
  }

  .bubble {
    font-size: 12px;
  }

  .powered {
    font-size: 10px;
  }
}
</style>

<button
  id="launcher"
  type="button"
  aria-label="Open AI Assistant"
  title="Chat with AI Assistant"
>
  <span id="launcherIcon"></span>
</button>

<section id="panel" aria-live="polite">
  <div class="head">
    <div class="brand">
      <div class="avatar" id="brandLogo"></div>

      <div class="brand-text">
        <div class="name" id="assistantName">
          AI Assistant
        </div>

        <div class="online">
          ● Online
        </div>
      </div>
    </div>

    <button
      class="close"
      id="close"
      type="button"
      aria-label="Close AI Assistant"
    >
      ×
    </button>
  </div>

  <div
    id="error"
    class="error"
    style="display:none"
  ></div>

  <div id="body" class="body"></div>

  <div class="foot">
    <div class="powered">
      Powered by SaleVitals
    </div>

    <div class="input-row">
      <input
        id="input"
        type="text"
        placeholder="Write a message..."
        autocomplete="off"
      />

      <button
        id="send"
        class="send"
        type="button"
        aria-label="Send message"
      >
        ↑
      </button>
    </div>
  </div>
</section>
`;

  const aiIcon = `
<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path
    d="M7.5 17.5L5 20V15.8C3.76 14.55 3 12.84 3 11C3 7.13 6.58 4 11 4H13C17.42 4 21 7.13 21 11C21 14.87 17.42 18 13 18H10.5L7.5 17.5Z"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M16.5 7.5L17.15 9.35L19 10L17.15 10.65L16.5 12.5L15.85 10.65L14 10L15.85 9.35L16.5 7.5Z"
    fill="currentColor"
  />
</svg>
`;

  const script = `
(function () {
  "use strict";

  var scriptEl = document.currentScript;

  if (!scriptEl) {
    return;
  }

  var assistantId =
    scriptEl.getAttribute("data-assistant") ||
    new URL(scriptEl.src).searchParams.get("assistantId");

  if (!assistantId) {
    return;
  }

  var apiBase =
    ${JSON.stringify(apiOrigin)};

  var sessionKey =
    "salevitals_ai_session_" +
    assistantId;

  var sessionId =
    localStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId =
      window.crypto &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) +
          Math.random()
            .toString(36)
            .slice(2);

    localStorage.setItem(
      sessionKey,
      sessionId
    );
  }

  var state = {
    open: false,
    sending: false,
    conversation: null,
    messages: [],
    assistant: null,
    poll: null,
    started: false
  };

  var root =
    document.createElement("div");

  root.id =
    "salevitals-ai-widget";

  document.body.appendChild(root);

  var shadow =
    root.attachShadow
      ? root.attachShadow({
          mode: "open"
        })
      : root;

  shadow.innerHTML =
    ${JSON.stringify(widgetHtml)};

  var launcher =
    shadow.getElementById(
      "launcher"
    );

  var launcherIcon =
    shadow.getElementById(
      "launcherIcon"
    );

  var panel =
    shadow.getElementById(
      "panel"
    );

  var close =
    shadow.getElementById(
      "close"
    );

  var body =
    shadow.getElementById(
      "body"
    );

  var input =
    shadow.getElementById(
      "input"
    );

  var send =
    shadow.getElementById(
      "send"
    );

  var errorBox =
    shadow.getElementById(
      "error"
    );

  var brandLogo =
    shadow.getElementById(
      "brandLogo"
    );

  var assistantName =
    shadow.getElementById(
      "assistantName"
    );

  var iconHtml =
    ${JSON.stringify(aiIcon)};

  launcherIcon.innerHTML =
    iconHtml;

  function getContrastColor(hex) {
    var value =
      String(hex || "")
        .replace("#", "");

    if (value.length !== 6) {
      return "#FFFFFF";
    }

    var r =
      parseInt(
        value.substring(0, 2),
        16
      );

    var g =
      parseInt(
        value.substring(2, 4),
        16
      );

    var b =
      parseInt(
        value.substring(4, 6),
        16
      );

    var brightness =
      (
        r * 299 +
        g * 587 +
        b * 114
      ) / 1000;

    return brightness > 165
      ? "#172033"
      : "#FFFFFF";
  }

  function getWelcomeMessage() {
    var assistant =
      state.assistant || {};

    var configured =
      String(
        assistant.welcomeMessage || ""
      ).trim();

    if (configured) {
      return configured;
    }

    var aiName =
      String(
        assistant.assistantName ||
          "AI Assistant"
      ).trim();

    var fromName =
      String(
        assistant.fromName || ""
      ).trim();

    if (fromName) {
      return (
        "Hi 👋 I'm " +
        aiName +
        " from " +
        fromName +
        ". How can I help you today?"
      );
    }

    return (
      "Hi 👋 I'm " +
      aiName +
      ". How can I help you today?"
    );
  }

  function applyBranding() {
    var assistant =
      state.assistant || {};

    var rawColor =
      String(
        assistant.primaryColor || ""
      ).trim();

    var color =
      /^#[0-9A-Fa-f]{6}$/.test(
        rawColor
      )
        ? rawColor
        : "#00656A";

    var textColor =
      getContrastColor(color);

    shadow.host.style.setProperty(
      "--ai-color",
      color
    );

    shadow.host.style.setProperty(
      "--ai-text",
      textColor
    );

    assistantName.textContent =
      String(
        assistant.assistantName ||
          "AI Assistant"
      ).trim();

    brandLogo.innerHTML = "";

    var logoUrl =
      String(
        assistant.logoUrl || ""
      ).trim();

    if (logoUrl) {
      var logo =
        document.createElement("img");

      logo.src = logoUrl;

      logo.alt =
        String(
          assistant.assistantName ||
            "Assistant"
        ).trim();

      logo.onerror =
        function () {
          brandLogo.innerHTML =
            iconHtml;
        };

      brandLogo.appendChild(
        logo
      );
    } else {
      brandLogo.innerHTML =
        iconHtml;
    }
  }

  function render() {
    body.innerHTML = "";

    if (
      !Array.isArray(
        state.messages
      ) ||
      !state.messages.length
    ) {
      var welcome =
        document.createElement(
          "div"
        );

      welcome.className =
        "welcome";

      welcome.textContent =
        getWelcomeMessage();

      body.appendChild(
        welcome
      );
    }

    (
      Array.isArray(state.messages)
        ? state.messages
        : []
    ).forEach(
      function (message) {
        var row =
          document.createElement(
            "div"
          );

        var sender =
          String(
            message.sender || ""
          ).toLowerCase();

        if (
          sender === "visitor"
        ) {
          row.className =
            "msg user";

          var userBubble =
            document.createElement(
              "div"
            );

          userBubble.className =
            "bubble";

          userBubble.textContent =
            String(
              message.message || ""
            );

          row.appendChild(
            userBubble
          );
        } else {
          row.className =
            sender === "system"
              ? "msg system"
              : "msg ai";

          var wrapper =
            document.createElement(
              "div"
            );

          wrapper.className =
            "ai-message-wrap";

          var logoWrap =
            document.createElement(
              "div"
            );

          logoWrap.className =
            "message-logo";

          var assistant =
            state.assistant || {};

          var logoUrl =
            String(
              assistant.logoUrl || ""
            ).trim();

          if (logoUrl) {
            var messageLogo =
              document.createElement(
                "img"
              );

            messageLogo.src =
              logoUrl;

            messageLogo.alt = "";

            messageLogo.onerror =
              function () {
                logoWrap.innerHTML =
                  iconHtml;
              };

            logoWrap.appendChild(
              messageLogo
            );
          } else {
            logoWrap.innerHTML =
              iconHtml;
          }

          var bubble =
            document.createElement(
              "div"
            );

          bubble.className =
            "bubble";

          bubble.textContent =
            String(
              message.message || ""
            );

          wrapper.appendChild(
            logoWrap
          );

          wrapper.appendChild(
            bubble
          );

          row.appendChild(
            wrapper
          );
        }

        body.appendChild(
          row
        );
      }
    );

    body.scrollTop =
      body.scrollHeight;
  }

  function setError(message) {
    var value =
      String(
        message || ""
      ).trim();

    errorBox.textContent =
      value;

    errorBox.style.display =
      value
        ? "block"
        : "none";
  }

  async function loadConfig() {
    try {
      var response =
        await fetch(
          apiBase +
            "/api/ai-widget/config/" +
            encodeURIComponent(
              assistantId
            ),
          {
            method: "GET",
            cache: "no-store"
          }
        );

      var data =
        await response.json();

      if (
        response.ok &&
        data.success &&
        data.assistant
      ) {
        state.assistant =
          data.assistant;

        applyBranding();

        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async function start() {
    if (state.started) {
      return;
    }

    state.started = true;

    setError("");

    try {
      var configLoaded =
        await loadConfig();

      if (!configLoaded) {
        state.started = false;

        setError(
          "AI Assistant is currently unavailable."
        );

        return;
      }

      var response =
        await fetch(
          apiBase +
            "/api/ai-widget/start",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              assistantId:
                assistantId,
              sessionId:
                sessionId
            })
          }
        );

      var data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load chat"
        );
      }

      state.assistant =
        Object.assign(
          {},
          state.assistant || {},
          data.assistant || {}
        );

      state.conversation =
        data.conversation ||
        null;

      state.messages =
        Array.isArray(
          data.messages
        )
          ? data.messages
          : [];

      applyBranding();

      render();

      startPolling();
    } catch (error) {
      state.started = false;

      setError(
        error.message ||
          "Unable to load chat"
      );

      render();
    }
  }

  async function sendMessage() {
    var text =
      String(
        input.value || ""
      ).trim();

    if (
      !text ||
      state.sending
    ) {
      return;
    }

    setError("");

    state.sending = true;

    send.disabled = true;

    state.messages.push({
      sender: "visitor",
      message: text
    });

    input.value = "";

    render();

    try {
      var response =
        await fetch(
          apiBase +
            "/api/ai-widget/message",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              assistantId:
                assistantId,
              sessionId:
                sessionId,
              message:
                text
            })
          }
        );

      var data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        state.messages =
          state.messages.filter(
            function (
              message,
              index
            ) {
              return !(
                index ===
                  state.messages.length - 1 &&
                message.sender ===
                  "visitor" &&
                message.message ===
                  text
              );
            }
          );

        throw new Error(
          data.message ||
            "Unable to send message"
        );
      }

      state.conversation =
        data.conversation ||
        state.conversation;

      if (data.message) {
        state.messages.push(
          data.message
        );
      }

      render();
    } catch (error) {
      setError(
        error.message ||
          "Unable to send message"
      );
    } finally {
      state.sending = false;

      send.disabled = false;

      input.focus();
    }
  }

  function startPolling() {
    if (state.poll) {
      clearInterval(
        state.poll
      );
    }

    state.poll =
      setInterval(
        async function () {
          if (
            !state.open ||
            !state.started
          ) {
            return;
          }

          try {
            var response =
              await fetch(
                apiBase +
                  "/api/ai-widget/messages?assistantId=" +
                  encodeURIComponent(
                    assistantId
                  ) +
                  "&sessionId=" +
                  encodeURIComponent(
                    sessionId
                  ),
                {
                  method: "GET",
                  cache: "no-store"
                }
              );

            var data =
              await response.json();

            if (
              data.success &&
              Array.isArray(
                data.messages
              )
            ) {
              state.conversation =
                data.conversation ||
                state.conversation;

              var oldMessages =
                JSON.stringify(
                  state.messages
                );

              var newMessages =
                JSON.stringify(
                  data.messages
                );

              if (
                oldMessages !==
                newMessages
              ) {
                state.messages =
                  data.messages;

                render();
              }
            }
          } catch (error) {}
        },
        2000
      );
  }

  launcher.onclick =
    async function () {
      state.open = true;

      panel.classList.add(
        "open"
      );

      if (!state.started) {
        await start();
      } else {
        applyBranding();
        render();
      }

      setTimeout(
        function () {
          input.focus();
        },
        100
      );
    };

  close.onclick =
    function () {
      state.open = false;

      panel.classList.remove(
        "open"
      );
    };

  send.onclick =
    sendMessage;

  input.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendMessage();
      }
    }
  );

  loadConfig();
})();
`;

  res.setHeader(
    "Content-Type",
    "application/javascript; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  return res.send(script);
};