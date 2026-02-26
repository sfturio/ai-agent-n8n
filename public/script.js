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
  bubble.textContent = text;

  div.appendChild(bubble);
  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;

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

  const typingEl = addMessage("Digitando...", "bot");

  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    // tenta JSON, mas se vier texto, mostra o texto
    const raw = await res.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { reply: raw };
    }

    if (typingEl?.isConnected) typingEl.remove();

    // aqui o importante: NÃO exigir data.ok
    if (!res.ok) {
      addMessage(data?.error || "Erro ao falar com o agente", "bot");
      return;
    }

    // aceita vários formatos:
    // 1) { reply: "..." }
    // 2) { data: { reply: "..." } }
    // 3) { ok: true, data: "..." }
    // 4) qualquer outro JSON -> stringify
    let reply =
      data?.reply ??
      data?.data?.reply ??
      (typeof data?.data === "string" ? data.data : null);

    if (!reply) reply = JSON.stringify(data, null, 2);

    addMessage(reply || "Não recebi resposta do agente.", "bot");
  } catch (err) {
    if (typingEl?.isConnected) typingEl.remove();
    addMessage("Erro de conexão com o servidor.", "bot");
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
setTimeout(() => addMessage("Posso ajudar com treinos, objetivos e dúvidas.", "bot"), 1500);
setTimeout(() => addMessage("Qual é seu principal objetivo hoje?", "bot"), 2100);