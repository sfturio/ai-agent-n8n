const chat = document.getElementById("chat");
const input = document.getElementById("input");
const button = document.getElementById("send");
const form = document.getElementById("form");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const span = document.createElement("span");
  span.className = "text";
  span.textContent = text;

  bubble.appendChild(span);
  div.appendChild(bubble);
  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;

  return div;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMarkdown(md) {
  // Force numbered lists into dash-style lists to keep a single list format.
  const normalized = String(md ?? "").replace(/^\s*\d+\.\s+/gm, "- ");
  let html = escapeHtml(normalized);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  html = html.replace(/(?:^|\n)- (.+)(?=\n|$)/g, "\n<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul>${m}</ul>`);

  html = html.replace(/\n/g, "<br />");

  return html;
}

function addBotMessageMarkdown(text) {
  const div = document.createElement("div");
  div.className = "msg bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  bubble.innerHTML = `<div class="md">${renderMarkdown(text)}</div>`;

  div.appendChild(bubble);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  return div;
}

let activeTypeTimer = null;

function typeMessage(
  text,
  sender,
  speed = 12,
  { finalizeMarkdown = false } = {},
) {
  if (activeTypeTimer) {
    clearInterval(activeTypeTimer);
    activeTypeTimer = null;
  }

  const div = addMessage("", sender);
  const span = div.querySelector(".bubble .text");

  let i = 0;

  activeTypeTimer = setInterval(() => {
    span.textContent += text[i] ?? "";
    i++;

    chat.scrollTop = chat.scrollHeight;

    if (i >= text.length) {
      clearInterval(activeTypeTimer);
      activeTypeTimer = null;

      if (finalizeMarkdown && sender === "bot") {
        const bubble = div.querySelector(".bubble");

        bubble.style.opacity = "0";

        setTimeout(() => {
          bubble.innerHTML = `<div class="md">${renderMarkdown(text)}</div>`;
          bubble.style.opacity = "1";
          chat.scrollTop = chat.scrollHeight;
        }, 120);
      }
    }
  }, speed);

  return div;
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return "";
}

function extractReply(data, raw) {
  return firstNonEmptyString(
    data?.reply,
    data?.message,
    data?.data?.reply,
    data?.data?.message,
    typeof data?.data === "string" ? data.data : "",
    raw,
  );
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "me");
  input.value = "";
  input.focus();

  button.disabled = true;
  input.disabled = true;

  const typingEl = addMessage("", "bot");
  const typingBubble = typingEl.querySelector(".bubble");

  typingBubble.innerHTML = `
    <div class="typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const raw = (await res.text()) || "";

    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }

    if (typingEl?.isConnected) typingEl.remove();

    const reply = extractReply(data, raw);

    if (!res.ok) {
      typeMessage(
        firstNonEmptyString(data?.error, reply, "Erro ao falar com o agente."),
        "bot",
        12,
        { finalizeMarkdown: false },
      );
      return;
    }

    typeMessage(reply || "Nao recebi resposta do agente.", "bot", 10, {
      finalizeMarkdown: true,
    });
  } catch (err) {
    if (typingEl?.isConnected) typingEl.remove();
    typeMessage("Erro de conexao com o servidor.", "bot", 12, {
      finalizeMarkdown: false,
    });
  } finally {
    button.disabled = false;
    input.disabled = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

button.addEventListener("click", (e) => {
  e.preventDefault();
  sendMessage();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

setTimeout(() => addBotMessageMarkdown("Ola!"), 400);
setTimeout(() => addBotMessageMarkdown("Sou seu assistente virtual."), 900);
setTimeout(() => addBotMessageMarkdown("Posso ajudar com treinos, objetivos e duvidas."), 1500);
setTimeout(() => addBotMessageMarkdown("Qual e seu principal objetivo hoje?"), 2100);
