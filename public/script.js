const chat = document.getElementById("chat");
const input = document.getElementById("input");
const button = document.getElementById("send");
const form = document.getElementById("form");
const menuItems = document.querySelectorAll(".side-item[data-view-target]");
const viewChat = document.getElementById("view-chat");
const viewChangelog = document.getElementById("view-changelog");
const viewAbout = document.getElementById("view-about");
const defaultInputPlaceholder = input?.getAttribute("placeholder") || "";
const metricTotalExecutions = document.getElementById("metric-total-executions");
const metricCriticalErrors = document.getElementById("metric-critical-errors");
const metricAvgResponseTime = document.getElementById("metric-avg-response-time");

function showView(target) {
  const views = {
    chat: viewChat,
    changelog: viewChangelog,
    about: viewAbout,
  };

  Object.values(views).forEach((view) => {
    if (view) view.classList.remove("is-active");
  });

  const selectedView = views[target] || viewChat;
  if (selectedView) selectedView.classList.add("is-active");

  menuItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.viewTarget === target);
  });
}

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
  const escaped = escapeHtml(String(md ?? ""));
  const lines = escaped.split("\n");
  const output = [];
  let activeList = null;

  const formatInline = (text) => {
    let html = text;
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return html;
  };

  const closeListIfNeeded = () => {
    if (activeList === "ul") output.push("</ul>");
    if (activeList === "ol") output.push("</ol>");
    activeList = null;
  };

  for (const line of lines) {
    const ulMatch = line.match(/^\s*-\s+(.+)$/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);

    if (ulMatch) {
      if (activeList !== "ul") {
        closeListIfNeeded();
        output.push("<ul>");
        activeList = "ul";
      }
      output.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    if (olMatch) {
      if (activeList !== "ol") {
        closeListIfNeeded();
        output.push("<ol>");
        activeList = "ol";
      }
      output.push(`<li>${formatInline(olMatch[1])}</li>`);
      continue;
    }

    closeListIfNeeded();
    output.push(formatInline(line));
  }

  closeListIfNeeded();
  return output.join("<br />");
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

function formatInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return new Intl.NumberFormat("pt-BR").format(Math.round(num));
}

function formatMs(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${Math.max(0, Math.round(num))}ms`;
}

function setMetrics({ totalExecutions, criticalErrors, avgResponseTimeMs }) {
  if (metricTotalExecutions) metricTotalExecutions.textContent = formatInt(totalExecutions);
  if (metricCriticalErrors) metricCriticalErrors.textContent = formatInt(criticalErrors);
  if (metricAvgResponseTime) metricAvgResponseTime.textContent = formatMs(avgResponseTimeMs);
}

async function refreshMetrics() {
  try {
    const res = await fetch("/api/agent/metrics", { method: "GET" });
    if (!res.ok) return;

    const data = await res.json();
    setMetrics(data ?? {});
  } catch {
    // Keep previous metrics if request fails.
  }
}

async function warmupProvider() {
  try {
    await fetch("/api/agent/warmup", { method: "GET" });
  } catch {
    // Warmup is best-effort only.
  }
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
    refreshMetrics();
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

input.addEventListener("focus", () => {
  input.setAttribute("placeholder", "");
});

input.addEventListener("blur", () => {
  if (!input.value.trim()) {
    input.setAttribute("placeholder", defaultInputPlaceholder);
  }
});

menuItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    showView(item.dataset.viewTarget);
  });
});

setTimeout(() => addBotMessageMarkdown("Console online. Posso analisar logs e comportamento da aplicacao."), 400);
setTimeout(() => addBotMessageMarkdown("Se quiser, posso detalhar os pontos do changelog ou da arquitetura do projeto."), 950);
warmupProvider();
refreshMetrics();
setInterval(refreshMetrics, 15000);
