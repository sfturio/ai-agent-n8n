const chat = document.getElementById("chat");
const input = document.getElementById("input");
const button = document.getElementById("send");

function addMessage(text, sender) {

  const div = document.createElement("div");

  div.className = `msg ${sender}`;

  const bubble = document.createElement("div");

  bubble.className = "bubble";

  bubble.textContent = text;

  div.appendChild(bubble);

  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {

  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "me");

  input.value = "";

  const res = await fetch("/chat", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      message: text
    })
  });

  const data = await res.json();

  addMessage(data.reply, "bot");
}

button.onclick = sendMessage;

input.onkeydown = (e) => {

  if (e.key === "Enter") {

    sendMessage();
  }
};

//
// MENSAGENS INICIAIS
//

setTimeout(() => {

  addMessage("Olá 👋", "bot");

}, 400);

setTimeout(() => {

  addMessage("Sou seu assistente virtual.", "bot");

}, 900);

setTimeout(() => {

  addMessage("Posso ajudar com treinos, objetivos e dúvidas.", "bot");

}, 1500);

setTimeout(() => {

  addMessage("Qual é seu principal objetivo hoje?", "bot");

}, 2100);