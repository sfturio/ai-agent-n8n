const chat = document.getElementById("chat");
const input = document.getElementById("input");
const button = document.getElementById("send");
const form = document.getElementById("form");

//
// ADICIONAR MENSAGEM NA TELA
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
// TYPEWRITER
//
let activeTypeTimer = null;

function typeMessage(text, sender, speed = 12) {
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

  // ===== Typing indicator =====
  const typingEl = addMessage("", "bot");
  const bubble = typingEl.querySelector(".bubble");

  bubble.innerHTML = `
    <div class="typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      typeMessage(data?.error || "Erro ao falar com o agente.", "bot", 10);
      return;
    }

    let reply =
      data?.reply ??
      data?.data?.reply ??
      (typeof data?.data === "string" ? data.data : null);

    if (!reply) reply = JSON.stringify(data, null, 2);

    typeMessage(reply || "Não recebi resposta do agente.", "bot", 10);
  } catch (err) {
    if (typingEl?.isConnected) typingEl.remove();
    typeMessage("Erro de conexão com o servidor.", "bot", 10);
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
// MENSAGENS INICIAIS
//
setTimeout(() => addMessage("Olá 👋", "bot"), 400);
setTimeout(() => addMessage("Sou seu assistente virtual.", "bot"), 900);
setTimeout(
  () => addMessage("Posso ajudar com treinos, objetivos e dúvidas.", "bot"),
  1500
);
setTimeout(
  () => addMessage("Qual é seu principal objetivo hoje?", "bot"),
  2100
);