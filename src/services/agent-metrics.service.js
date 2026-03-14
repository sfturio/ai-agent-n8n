const MAX_HISTORY = 200;
const activeExecutions = new Map();
const history = [];
let sequence = 8700;

function nextId() {
  sequence += 1;
  return `ax-${sequence}`;
}

function inferAgentName(message) {
  const text = String(message ?? "").toLowerCase();
  if (text.includes("support") || text.includes("cliente")) return "CustomerSupport_v2";
  if (text.includes("lead") || text.includes("vendas")) return "LeadGen_Script";
  if (text.includes("pesquisa") || text.includes("market")) return "MarketResearch_v1";
  return "Neural_Alpha";
}

function toSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function estimatedTokens(charCount) {
  if (!Number.isFinite(charCount) || charCount <= 0) return 0;
  return Math.ceil(charCount / 4);
}

export function startExecution(message) {
  const execution = {
    id: nextId(),
    agent: inferAgentName(message),
    startedAt: Date.now(),
    status: "RUNNING",
  };

  activeExecutions.set(execution.id, execution);
  return execution;
}

export function finishExecution(executionId, { ok, estimatedTokenCount = 0 } = {}) {
  const active = activeExecutions.get(executionId);
  if (!active) return null;

  activeExecutions.delete(executionId);

  const finishedAt = Date.now();
  const durationMs = Math.max(1, finishedAt - active.startedAt);

  const item = {
    id: executionId,
    agent: active.agent,
    status: ok ? "SUCCESS" : "ERROR",
    durationMs,
    durationLabel: toSeconds(durationMs),
    timestamp: finishedAt,
    estimatedTokens: Math.max(0, Number(estimatedTokenCount) || 0),
  };

  history.unshift(item);
  if (history.length > MAX_HISTORY) history.pop();
  return item;
}

function formatTokenUsage(totalTokens) {
  if (totalTokens >= 1000000) return `${(totalTokens / 1000000).toFixed(1)}M`;
  if (totalTokens >= 1000) return `${(totalTokens / 1000).toFixed(1)}K`;
  return String(totalTokens);
}

export function getDashboardData() {
  const totalCompleted = history.length;
  const successCount = history.filter((h) => h.status === "SUCCESS").length;
  const successRate = totalCompleted > 0 ? (successCount / totalCompleted) * 100 : 0;

  const avgDurationMs =
    totalCompleted > 0
      ? Math.round(history.reduce((acc, h) => acc + h.durationMs, 0) / totalCompleted)
      : 0;

  const totalTokens = history.reduce((acc, h) => acc + (h.estimatedTokens || 0), 0);

  const running = [...activeExecutions.values()].map((e) => ({
    id: e.id,
    agent: e.agent,
    status: "RUNNING",
    durationLabel: toSeconds(Date.now() - e.startedAt),
    durationMs: Date.now() - e.startedAt,
  }));

  const recentCompleted = history.slice(0, 8).map((h) => ({
    id: h.id,
    agent: h.agent,
    status: h.status,
    durationLabel: h.durationLabel,
    durationMs: h.durationMs,
  }));

  return {
    metrics: {
      executions: totalCompleted + running.length,
      successRate: Number(successRate.toFixed(1)),
      avgResponseTimeMs: avgDurationMs,
      tokenUsage: formatTokenUsage(totalTokens),
      runningCount: running.length,
    },
    executions: [...running, ...recentCompleted].slice(0, 12),
  };
}
