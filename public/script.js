const chat = document.getElementById("chat");
const input = document.getElementById("input");
const button = document.getElementById("send");
const form = document.getElementById("form");
const metricExecutions = document.getElementById("metricExecutions");
const metricSuccessRate = document.getElementById("metricSuccessRate");
const metricResponseTime = document.getElementById("metricResponseTime");
const metricTokenUsage = document.getElementById("metricTokenUsage");
const successBadge = document.getElementById("successBadge");
const execDelta = document.getElementById("execDelta");
const speedBadge = document.getElementById("speedBadge");
const executionRows = document.getElementById("executionRows");

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

function chipClassByStatus(status) {
  if (status === "RUNNING") return "chip chip-running";
  if (status === "ERROR") return "chip chip-error";
  return "chip";
}

function dotClassByStatus(status) {
  if (status === "RUNNING") return "dot dot-info";
  if (status === "ERROR") return "dot dot-error";
  return "dot";
}

function renderExecutions(rows) {
  if (!executionRows) return;

  if (!Array.isArray(rows) || rows.length === 0) {
    executionRows.innerHTML = `
      <tr>
        <td colspan="4">Sem execucoes ainda. Envie uma mensagem para iniciar.</td>
      </tr>
    `;
    return;
  }

  executionRows.innerHTML = rows
    .map((row) => {
      const agent = row?.agent || "Neural_Alpha";
      const status = row?.status || "SUCCESS";
      const duration = row?.durationLabel || "0.0s";
      const id = row?.id ? `#${row.id}` : "-";

      return `
        <tr>
          <td><span class="${dotClassByStatus(status)}"></span>${agent}</td>
          <td><span class="${chipClassByStatus(status)}">${status}</span></td>
          <td>${duration}</td>
          <td>${id}</td>
        </tr>
      `;
    })
    .join("");
}

function updateMetricText(el, value) {
  if (!el) return;
  el.textContent = value;
}

async function refreshDashboard() {
  try {
    const res = await fetch("/api/agent/dashboard", { method: "GET" });
    if (!res.ok) return;

    const data = await res.json();
    const metrics = data?.metrics ?? {};

    updateMetricText(metricExecutions, String(metrics.executions ?? 0));
    updateMetricText(metricSuccessRate, `${Number(metrics.successRate ?? 0).toFixed(1)}%`);
    updateMetricText(metricResponseTime, `${Math.max(0, Number(metrics.avgResponseTimeMs ?? 0))}ms`);
    updateMetricText(metricTokenUsage, String(metrics.tokenUsage ?? "0"));
    updateMetricText(successBadge, Number(metrics.successRate ?? 0) >= 95 ? "Optimal" : "Stable");
    updateMetricText(execDelta, `Running ${Number(metrics.runningCount ?? 0)}`);
    updateMetricText(speedBadge, Number(metrics.avgResponseTimeMs ?? 0) > 0 ? "Measured" : "Live");

    renderExecutions(data?.executions ?? []);
  } catch {
    // Keep current UI state if dashboard fetch fails.
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
    refreshDashboard();
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

setTimeout(() => addBotMessageMarkdown("Console online. Posso analisar logs e execucoes dos agentes."), 350);
setTimeout(() => addBotMessageMarkdown("Envie um ID de execucao para diagnostico rapido."), 900);
refreshDashboard();
setInterval(refreshDashboard, 10000);
