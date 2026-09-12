/* chat-widget.js — floating AI assistant widget, backed by the FastAPI
   service in /fastapi-chat (see its README.md for deployment). No-ops
   entirely if CHAT_API_URL is left unset, so this is safe to ship before
   the backend is deployed. */
(function () {
  // Set this to the deployed backend's base URL once it's live, e.g.
  // "https://portfolio-chat.onrender.com". Left blank, the widget does not
  // render at all.
  var CHAT_API_URL = "https://ai-engineer-portfolio-va7f.onrender.com";

  if (!CHAT_API_URL) return;

  // Persisted so the admin inbox groups a visitor's whole conversation into
  // one session instead of a separate row per message.
  var sessionId = null;
  try {
    sessionId = localStorage.getItem("mh-chat-session");
    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem("mh-chat-session", sessionId);
    }
  } catch (e) {}

  var history = [];
  var open = false;
  var greeted = false;

  var root = document.createElement("div");
  root.id = "chat-widget";
  root.innerHTML =
    '<button id="chat-toggle" type="button" aria-label="Open chat assistant" aria-expanded="false">' +
    '<span class="chat-toggle-icon chat-icon-bubble">💬</span><span class="chat-toggle-icon chat-icon-close">×</span></button>' +
    '<div id="chat-panel" role="dialog" aria-modal="false" aria-label="Chat assistant">' +
    '<div class="chat-header"><span class="chat-header-title"><span class="chat-status-dot"></span>Ask about Montaser</span>' +
    '<button id="chat-close" type="button" aria-label="Close chat">×</button></div>' +
    '<div id="chat-log" role="log" aria-live="polite"></div>' +
    '<form id="chat-form">' +
    '<input id="chat-input" type="text" maxlength="2000" autocomplete="off" placeholder="Ask a question…" aria-label="Message" />' +
    '<button type="submit" aria-label="Send">➤</button>' +
    "</form></div>";
  document.body.appendChild(root);

  var toggle = document.getElementById("chat-toggle");
  var panel = document.getElementById("chat-panel");
  var closeBtn = document.getElementById("chat-close");
  var log = document.getElementById("chat-log");
  var form = document.getElementById("chat-form");
  var input = document.getElementById("chat-input");

  function setOpen(next) {
    open = next;
    root.classList.toggle("chat-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      input.focus();
      if (!greeted) {
        greeted = true;
        addBubble("assistant", "Hi! Ask me anything about Montaser's work, stack, or availability.");
      }
    }
  }

  toggle.addEventListener("click", function () { setOpen(!open); });
  closeBtn.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) setOpen(false);
  });

  function addBubble(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-bubble-" + role;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function addTypingBubble() {
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-bubble-assistant chat-typing";
    bubble.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var message = input.value.trim();
    if (!message) return;
    input.value = "";
    input.disabled = true;
    addBubble("user", message);
    var pending = addTypingBubble();

    fetch(CHAT_API_URL.replace(/\/$/, "") + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, history: history.slice(-10), session_id: sessionId }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("bad status");
        return res.json();
      })
      .then(function (data) {
        pending.classList.remove("chat-typing");
        pending.textContent = data.reply;
        history.push({ role: "user", content: message });
        history.push({ role: "assistant", content: data.reply });
      })
      .catch(function () {
        pending.classList.remove("chat-typing");
        pending.textContent = "Sorry, the assistant is unavailable right now — try the contact page instead.";
      })
      .finally(function () {
        input.disabled = false;
        input.focus();
      });
  });
})();
