const chat = document.getElementById("chat");
const input = document.getElementById("input");
const button = document.getElementById("send");
const form = document.getElementById("form");

//
// ADICIONAR MENSAGEM NA TELA (texto puro)
//
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

//
// MARKDOWN (básico, seguro)
//
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMarkdown(md) {
  let html = escapeHtml(md);

  // code inline
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // bold / italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // listas com "-"
  html = html.replace(/(?:^|\n)- (.+)(?=\n|$)/g, "\n<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul>${m}</ul>`);

  // lista numerada (simples)
  html = html.replace(/(?:^|\n)\d+\. (.+)(?=\n|$)/g, "\n<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (m) => {
    if (m.includes("<ul>")) return m; // já virou ul
    return `<ol>${m}</ol>`;
  });

  // quebra de linha
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

//
// TYPEWRITER (com opção de finalizar em markdown)
//
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

  // escreve como texto puro (mais simples/estável), depois troca pra markdown
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

      // ao terminar, se for bot, troca o conteúdo para markdown renderizado
      if (finalizeMarkdown && sender === "bot") {
        const bubble = div.querySelector(".bubble");

        // fade-out rápido
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

//
// ENVIAR MENSAGEM PARA O BACKEND
//
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "me");
  input.value = "";
  input.focus();

  button.disabled = true;
  input.disabled = true;

  // Typing indicator
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

    const raw = await res.text();

    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { reply: raw };
    }

    if (typingEl?.isConnected) typingEl.remove();

    if (!res.ok) {
      typeMessage(data?.error || "Erro ao falar com o agente.", "bot", 12, {
        finalizeMarkdown: false,
      });
      return;
    }

    let reply =
      data?.reply ??
      data?.data?.reply ??
      (typeof data?.data === "string" ? data.data : null);

    if (!reply) reply = JSON.stringify(data, null, 2);

    // Bot: typewriter e ao final aplica markdown (fica bem formatado)
    typeMessage(reply || "Não recebi resposta do agente.", "bot", 10, {
      finalizeMarkdown: true,
    });
  } catch (err) {
    if (typingEl?.isConnected) typingEl.remove();
    typeMessage("Erro de conexão com o servidor.", "bot", 12, {
      finalizeMarkdown: false,
    });
  } finally {
    button.disabled = false;
    input.disabled = false;
  }
}

//
// EVENTOS
//
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

//
// MENSAGENS INICIAIS (renderizadas em markdown pra já ficar bonito)
//
setTimeout(() => addBotMessageMarkdown("Olá 👋"), 400);
setTimeout(() => addBotMessageMarkdown("Sou seu assistente virtual."), 900);
setTimeout(
  () => addBotMessageMarkdown("Posso ajudar com treinos, objetivos e dúvidas."),
  1500,
);
setTimeout(
  () => addBotMessageMarkdown("Qual é seu principal objetivo hoje?"),
  2100,
);
