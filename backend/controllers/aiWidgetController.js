const AIAssistant = require("../models/AIAssistant");

function normalizeColor(value) {
  const color = String(value || "").trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase();
  }

  return "#00656A";
}

exports.getConfig = async (req, res) => {
  try {
    const assistant = await AIAssistant.findById(
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

    return res.json({
      success: true,
      assistant: {
        id: assistant._id,
        assistantName:
          assistant.assistantName || "AI Assistant",
        logoUrl: assistant.logoUrl || "",
        primaryColor: normalizeColor(
          assistant.primaryColor
        ),
        welcomeMessage:
          assistant.welcomeMessage ||
          "Hello 👋 Welcome! How can I help you today?",
        enabled: assistant.enabled,
      },
    });
  } catch (error) {
    console.error("AI WIDGET CONFIG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load AI widget",
    });
  }
};

exports.script = (req, res) => {
  const apiOrigin = `${req.protocol}://${req.get("host")}`;

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

  var apiBase = ${JSON.stringify(apiOrigin)};

  var key = "salevitals_ai_session_" + assistantId;

  var sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId =
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) +
          Math.random().toString(36).slice(2);

    localStorage.setItem(key, sessionId);
  }

  var visitor = {
    name: "",
    phone: "",
    email: "",
    service: ""
  };

  var state = {
    open: false,
    sending: false,
    conversation: null,
    messages: [],
    assistant: null,
    poll: null
  };

  var root = document.createElement("div");
  root.id = "salevitals-ai-widget";
  document.body.appendChild(root);

  var shadow = root.attachShadow
    ? root.attachShadow({ mode: "open" })
    : root;

  var aiIcon =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M7.5 17.5L5 20V15.8C3.76 14.55 3 12.84 3 11C3 7.13 6.58 4 11 4H13C17.42 4 21 7.13 21 11C21 14.87 17.42 18 13 18H10.5L7.5 17.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M16.5 7.5L17.15 9.35L19 10L17.15 10.65L16.5 12.5L15.85 10.65L14 10L15.85 9.35L16.5 7.5Z" fill="currentColor"/>' +
    '</svg>';

  shadow.innerHTML = \`
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
    0 10px 30px rgba(0,0,0,.18),
    0 4px 12px rgba(0,0,0,.08);
  cursor: pointer;
  z-index: 2147483646;
  transition:
    transform .2s ease,
    box-shadow .2s ease,
    opacity .2s ease;
}

#launcher:hover {
  transform: translateY(-2px);
  box-shadow:
    0 14px 34px rgba(0,0,0,.23),
    0 5px 14px rgba(0,0,0,.10);
}

#launcher:active {
  transform: scale(.96);
}

#launcher svg {
  width: 28px;
  height: 28px;
}

#panel {
  position: fixed;
  right: 22px;
  bottom: 94px;
  width: 380px;
  max-width: calc(100vw - 28px);
  height: 570px;
  max-height: calc(100vh - 120px);
  background: #ffffff;
  border: 1px solid #e5e8ee;
  border-radius: 20px;
  box-shadow:
    0 22px 60px rgba(16,24,40,.20),
    0 4px 18px rgba(16,24,40,.08);
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
  padding: 14px 15px;
  min-height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  gap: 11px;
  align-items: center;
  min-width: 0;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
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
  width: 23px;
  height: 23px;
}

.name {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.online {
  font-size: 10px;
  opacity: .84;
  margin-top: 4px;
}

.close {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--ai-text);
  font-size: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .2s ease;
}

.close:hover {
  background: rgba(255,255,255,.13);
}

.details {
  padding: 10px 12px;
  border-bottom: 1px solid #edf0f3;
  background: #fbfcfd;
}

.details summary {
  cursor: pointer;
  font-size: 11px;
  color: var(--ai-color);
  font-weight: 700;
  list-style: none;
}

.details summary::-webkit-details-marker {
  display: none;
}

.details summary:before {
  content: "+";
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  margin-right: 6px;
  border-radius: 50%;
  background: #edf5f5;
  color: var(--ai-color);
  font-size: 13px;
  font-weight: 700;
}

.details details[open] summary:before {
  content: "−";
}

.details form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin-top: 9px;
}

.details input {
  width: 100%;
  height: 33px;
  border: 1px solid #e0e5eb;
  border-radius: 8px;
  padding: 0 9px;
  font-size: 10px;
  outline: none;
  color: #263142;
  background: #ffffff;
}

.details input:focus {
  border-color: var(--ai-color);
}

.details input:first-child {
  grid-column: 1 / -1;
}

.error {
  font-size: 10px;
  color: #b42318;
  padding: 8px 10px;
  background: #fff1f1;
  border-bottom: 1px solid #f5d4d4;
}

.body {
  flex: 1;
  overflow: auto;
  background: #f7f9fb;
  padding: 14px;
}

.body::-webkit-scrollbar {
  width: 5px;
}

.body::-webkit-scrollbar-thumb {
  background: #cbd5d7;
  border-radius: 10px;
}

.welcome {
  font-size: 11px;
  color: #4a5364;
  line-height: 1.6;
  background: #ffffff;
  border: 1px solid #e6e9ee;
  border-radius: 12px;
  padding: 11px;
  margin-bottom: 12px;
  box-shadow: 0 2px 5px rgba(16,24,40,.03);
}

.msg {
  display: flex;
  margin: 9px 0;
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
  gap: 7px;
  max-width: 88%;
}

.message-logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
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
  width: 17px;
  height: 17px;
}

.bubble {
  max-width: 82%;
  padding: 10px 12px;
  border-radius: 13px;
  background: #ffffff;
  border: 1px solid #e5e8ed;
  font-size: 11px;
  line-height: 1.55;
  color: #394255;
  white-space: pre-wrap;
  box-shadow: 0 1px 3px rgba(16,24,40,.03);
}

.user .bubble {
  background: var(--ai-color);
  color: var(--ai-text);
  border-color: var(--ai-color);
  border-bottom-right-radius: 4px;
}

.system .bubble {
  background: #fff7ed;
  border-color: #f5dfc4;
  color: #765a3c;
}

.foot {
  border-top: 1px solid #edf0f3;
  background: #ffffff;
  padding: 10px;
  display: flex;
  gap: 8px;
}

.foot input {
  flex: 1;
  height: 40px;
  border: 1px solid #dfe4ea;
  border-radius: 10px;
  padding: 0 11px;
  font-size: 11px;
  outline: none;
  color: #263142;
  background: #ffffff;
}

.foot input:focus {
  border-color: var(--ai-color);
}

.send {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: var(--ai-color);
  color: var(--ai-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition:
    transform .2s ease,
    opacity .2s ease;
}

.send:hover {
  transform: translateY(-1px);
}

.send:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.powered {
  text-align: center;
  font-size: 8px;
  color: #a5abb5;
  padding: 5px;
  background: #ffffff;
}

@media (max-width: 520px) {
  #launcher {
    right: 14px;
    bottom: 14px;
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }

  #panel {
    right: 10px;
    bottom: 82px;
    width: calc(100vw - 20px);
    height: calc(100vh - 105px);
    max-height: none;
    border-radius: 18px;
  }
}
</style>

<button
  id="launcher"
  aria-label="Open AI Assistant"
  title="Chat with AI Assistant"
>
  \${aiIcon}
</button>

<section id="panel" aria-live="polite">

  <div class="head">
    <div class="brand">

      <div class="avatar" id="brandLogo">
        \${aiIcon}
      </div>

      <div>
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
      aria-label="Close AI Assistant"
    >
      ×
    </button>
  </div>

  <div class="details">
    <details>
      <summary>
        Share your details with our team
      </summary>

      <form id="detailsForm">
        <input
          id="vname"
          placeholder="Name"
        />

        <input
          id="vphone"
          placeholder="Phone"
        />

        <input
          id="vemail"
          placeholder="Email"
        />

        <input
          id="vservice"
          placeholder="Service / treatment"
        />
      </form>
    </details>
  </div>

  <div
    id="error"
    class="error"
    style="display:none"
  ></div>

  <div
    id="body"
    class="body"
  ></div>

  <div class="foot">
    <input
      id="input"
      placeholder="Write a message..."
    />

    <button
      id="send"
      class="send"
      aria-label="Send message"
    >
      ↑
    </button>
  </div>

  <div class="powered">
    Powered by SaleVitals AI
  </div>

</section>
\`;

  var launcher =
    shadow.getElementById("launcher");

  var panel =
    shadow.getElementById("panel");

  var close =
    shadow.getElementById("close");

  var body =
    shadow.getElementById("body");

  var input =
    shadow.getElementById("input");

  var send =
    shadow.getElementById("send");

  var errorBox =
    shadow.getElementById("error");

  var brandLogo =
    shadow.getElementById("brandLogo");

  var assistantName =
    shadow.getElementById("assistantName");

  var nameInput =
    shadow.getElementById("vname");

  var phoneInput =
    shadow.getElementById("vphone");

  var emailInput =
    shadow.getElementById("vemail");

  var serviceInput =
    shadow.getElementById("vservice");

  function getContrastColor(hex) {
    var value = String(hex || "").replace("#", "");

    if (value.length !== 6) {
      return "#FFFFFF";
    }

    var r = parseInt(value.substring(0, 2), 16);
    var g = parseInt(value.substring(2, 4), 16);
    var b = parseInt(value.substring(4, 6), 16);

    var brightness =
      (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 165
      ? "#172033"
      : "#FFFFFF";
  }

  function applyBranding() {
    var assistant = state.assistant || {};

    var color =
      /^#[0-9A-Fa-f]{6}$/.test(
        String(assistant.primaryColor || "")
      )
        ? assistant.primaryColor
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
      assistant.assistantName ||
      "AI Assistant";

    brandLogo.innerHTML = "";

    if (
      assistant.logoUrl &&
      String(assistant.logoUrl).trim()
    ) {
      var logo =
        document.createElement("img");

      logo.src =
        assistant.logoUrl;

      logo.alt =
        assistant.assistantName ||
        "Assistant";

      logo.onerror =
        function () {
          brandLogo.innerHTML =
            aiIcon;
        };

      brandLogo.appendChild(logo);
    } else {
      brandLogo.innerHTML =
        aiIcon;
    }
  }

  function render() {
    body.innerHTML = "";

    if (!state.messages.length) {
      var welcome =
        document.createElement("div");

      welcome.className =
        "welcome";

      welcome.textContent =
        state.assistant &&
        state.assistant.welcomeMessage
          ? state.assistant.welcomeMessage
          : "Hello 👋 Welcome! How can I help you today?";

      body.appendChild(welcome);
    }

    state.messages.forEach(
      function (message) {
        var row =
          document.createElement("div");

        row.className =
          "msg " +
          (
            message.sender === "visitor"
              ? "user"
              : message.sender === "system"
                ? "system"
                : "ai"
          );

        if (
          message.sender !== "visitor"
        ) {
          var wrapper =
            document.createElement("div");

          wrapper.className =
            "ai-message-wrap";

          var logoWrap =
            document.createElement("div");

          logoWrap.className =
            "message-logo";

          if (
            state.assistant &&
            state.assistant.logoUrl
          ) {
            var logo =
              document.createElement("img");

            logo.src =
              state.assistant.logoUrl;

            logo.alt = "";

            logo.onerror =
              function () {
                logoWrap.innerHTML =
                  aiIcon;
              };

            logoWrap.appendChild(logo);
          } else {
            logoWrap.innerHTML =
              aiIcon;
          }

          var bubble =
            document.createElement("div");

          bubble.className =
            "bubble";

          bubble.textContent =
            message.message;

          wrapper.appendChild(
            logoWrap
          );

          wrapper.appendChild(
            bubble
          );

          row.appendChild(
            wrapper
          );
        } else {
          var userBubble =
            document.createElement("div");

          userBubble.className =
            "bubble";

          userBubble.textContent =
            message.message;

          row.appendChild(
            userBubble
          );
        }

        body.appendChild(row);
      }
    );

    body.scrollTop =
      body.scrollHeight;
  }

  function setError(message) {
    errorBox.textContent =
      message || "";

    errorBox.style.display =
      message
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
          )
        );

      var data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        state.assistant =
          data.assistant;

        applyBranding();
      }
    } catch (error) {
    }
  }

  async function start() {
    try {
      await loadConfig();

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
                sessionId,
              visitor:
                visitor,
              service:
                visitor.service
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
        data.conversation;

      state.messages =
        data.messages || [];

      applyBranding();
      render();
      poll();
    } catch (error) {
      setError(
        error.message
      );
    }
  }

  async function sendMessage() {
    var text =
      input.value.trim();

    if (
      !text ||
      state.sending
    ) {
      return;
    }

    setError("");

    state.sending = true;
    send.disabled = true;

    visitor = {
      name:
        nameInput.value.trim(),
      phone:
        phoneInput.value.trim(),
      email:
        emailInput.value.trim(),
      service:
        serviceInput.value.trim()
    };

    localStorage.setItem(
      key,
      sessionId
    );

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
                text,
              visitor:
                visitor,
              service:
                visitor.service
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
            function (message, index) {
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
        data.conversation;

      if (data.message) {
        state.messages.push(
          data.message
        );
      }

      render();
    } catch (error) {
      setError(
        error.message
      );
    } finally {
      state.sending = false;
      send.disabled = false;
    }
  }

  async function poll() {
    if (state.poll) {
      clearInterval(
        state.poll
      );
    }

    state.poll =
      setInterval(
        async function () {
          if (!state.open) {
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
                )
              );

            var data =
              await response.json();

            if (
              data.success &&
              data.messages
            ) {
              state.conversation =
                data.conversation ||
                state.conversation;

              if (
                data.messages.length !==
                state.messages.length
              ) {
                state.messages =
                  data.messages;

                render();
              }
            }
          } catch (error) {
          }
        },
        2000
      );
  }

  launcher.onclick =
    function () {
      state.open = true;

      panel.classList.add(
        "open"
      );

      if (!state.assistant) {
        start();
      } else {
        applyBranding();
        render();
      }
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
    "no-store"
  );

  return res.send(script);
};