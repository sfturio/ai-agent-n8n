const chat = document.getElementById("chat");
const input = document.getElementById("input");
const button = document.getElementById("send");

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

  return div; // pra poder remover depois (typing...)
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

  // UI: bloqueia enquanto envia
  button.disabled = true;
  input.disabled = true;

  // UI: "digitando..."
  const typingEl = addMessage("Digitando...", "bot");

  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    // tenta ler json; se falhar, cai no catch
    const data = await res.json();

    // remove "digitando..."
    typingEl.remove();

    if (!res.ok || !data.ok) {
      addMessage(data?.error || "Erro ao falar com o agente", "bot");
      return;
    }

    // pega resposta do n8n
    let reply;

    if (typeof data.data === "string") {
      reply = data.data;
    } else if (data.data?.reply) {
      reply = data.data.reply;
    } else {
      reply = JSON.stringify(data.data, null, 2);
    }

    addMessage(reply || "Não recebi resposta do agente.", "bot");
  } catch (err) {
    // remove "digitando..." se ainda existir
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
button.onclick = sendMessage;

input.onkeydown = (e) => {
  if (e.key === "Enter") sendMessage();
};

//
// MENSAGENS INICIAIS
//
setTimeout(() => addMessage("Olá 👋", "bot"), 400);
setTimeout(() => addMessage("Sou seu assistente virtual.", "bot"), 900);
setTimeout(() => addMessage("Posso ajudar com treinos, objetivos e dúvidas.", "bot"), 1500);
setTimeout(() => addMessage("Qual é seu principal objetivo hoje?", "bot"), 2100);