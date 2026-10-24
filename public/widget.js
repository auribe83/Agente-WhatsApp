(function () {
  const currentScript = document.currentScript;
  const appUrl = (currentScript && currentScript.getAttribute("data-app-url")) || "http://localhost:3000";
  const primaryColor = (currentScript && currentScript.getAttribute("data-color")) || "#2563eb";

  // Prevenir duplicados
  if (document.getElementById("atiende-widget-root")) return;

  const root = document.createElement("div");
  root.id = "atiende-widget-root";
  document.body.appendChild(root);

  const style = document.createElement("style");
  style.textContent = `
    #atiende-widget-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background-color: ${primaryColor};
      color: white;
      box-shadow: 0 4px 18px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #atiende-widget-bubble:hover {
      transform: scale(1.08);
    }
    #atiende-widget-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      height: 540px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.18);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      border: 1px solid #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .atiende-header {
      background: ${primaryColor};
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .atiende-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .atiende-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .atiende-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      opacity: 0.8;
    }
    .atiende-close:hover { opacity: 1; }
    .atiende-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .atiende-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.45;
      word-break: break-word;
    }
    .atiende-msg-bot {
      background: #ffffff;
      color: #1e293b;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .atiende-msg-user {
      background: ${primaryColor};
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .atiende-input-area {
      padding: 12px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }
    .atiende-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      font-size: 13px;
      outline: none;
    }
    .atiende-input:focus {
      border-color: ${primaryColor};
    }
    .atiende-send-btn {
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 12px;
      padding: 0 16px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
    }
    .atiende-typing {
      font-size: 11px;
      color: #64748b;
      font-style: italic;
      padding-left: 8px;
    }
  `;
  document.head.appendChild(style);

  root.innerHTML = `
    <div id="atiende-widget-bubble" title="Chatear con el Asistente">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
      </svg>
    </div>

    <div id="atiende-widget-window">
      <div class="atiende-header">
        <div class="atiende-header-info">
          <div class="atiende-avatar">🤖</div>
          <div>
            <div style="font-weight: bold; font-size: 14px;">Asistente Virtual</div>
            <div style="font-size: 11px; opacity: 0.85;">En línea · Respuesta instantánea</div>
          </div>
        </div>
        <button class="atiende-close" id="atiende-close-btn">&times;</button>
      </div>

      <div class="atiende-messages" id="atiende-messages-list">
        <div class="atiende-msg atiende-msg-bot">
          ¡Hola! Bienvenido a nuestro consultorio. ¿En qué podemos ayudarte hoy? Puedes preguntarme por tratamientos, precios o agendar una cita.
        </div>
      </div>

      <div class="atiende-input-area">
        <input type="text" id="atiende-chat-input" class="atiende-input" placeholder="Escribe tu mensaje aquí..." />
        <button id="atiende-chat-send" class="atiende-send-btn">Enviar</button>
      </div>
    </div>
  `;

  const bubble = document.getElementById("atiende-widget-bubble");
  const win = document.getElementById("atiende-widget-window");
  const closeBtn = document.getElementById("atiende-close-btn");
  const sendBtn = document.getElementById("atiende-chat-send");
  const inputEl = document.getElementById("atiende-chat-input");
  const messagesList = document.getElementById("atiende-messages-list");

  let isOpen = false;
  let sessionId = localStorage.getItem("atiende_widget_session") || "";

  function toggleChat() {
    isOpen = !isOpen;
    win.style.display = isOpen ? "flex" : "none";
    if (isOpen) {
      inputEl.focus();
    }
  }

  bubble.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // Agregar mensaje del usuario en pantalla
    const userMsg = document.createElement("div");
    userMsg.className = "atiende-msg atiende-msg-user";
    userMsg.textContent = text;
    messagesList.appendChild(userMsg);
    inputEl.value = "";
    messagesList.scrollTop = messagesList.scrollHeight;

    // Indicador de escribiendo
    const typing = document.createElement("div");
    typing.className = "atiende-typing";
    typing.id = "atiende-typing-indicator";
    typing.textContent = "Escribiendo...";
    messagesList.appendChild(typing);
    messagesList.scrollTop = messagesList.scrollHeight;

    try {
      const res = await fetch(`${appUrl}/api/chat/widget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const data = await res.json();
      typing.remove();

      if (data.sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem("atiende_widget_session", sessionId);
      }

      const botMsg = document.createElement("div");
      botMsg.className = "atiende-msg atiende-msg-bot";
      botMsg.textContent = data.reply || "He recibido tu mensaje.";
      messagesList.appendChild(botMsg);
      messagesList.scrollTop = messagesList.scrollHeight;
    } catch (e) {
      typing.remove();
      const botMsg = document.createElement("div");
      botMsg.className = "atiende-msg atiende-msg-bot";
      botMsg.textContent = "Disculpa, no pudimos conectar con el servidor en este momento.";
      messagesList.appendChild(botMsg);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
