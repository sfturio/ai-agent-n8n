import { processMessage } from "../services/agent.service.js";
import { getInteractionMetrics, saveInteractionLog } from "../services/supabase-log.service.js";

const runtimeMetrics = {
  totalExecutions: 0,
  criticalErrors: 0,
  totalResponseTimeMs: 0,
  samples: 0,
};

function isUpstreamUnavailable(error) {
  const msg = String(error?.message ?? "").toLowerCase();
  return (
    msg.includes("n8n webhook timeout") ||
    msg.includes("failed to reach n8n webhook") ||
    msg.includes("n8n error") ||
    msg.includes("empty response from n8n")
  );
}

function fallbackReply() {
  return "Estou com instabilidade no provedor agora. Tente novamente em alguns segundos.";
}

function trackRuntimeExecution({ ok, durationMs }) {
  runtimeMetrics.totalExecutions += 1;
  if (!ok) runtimeMetrics.criticalErrors += 1;

  if (Number.isFinite(durationMs) && durationMs >= 0) {
    runtimeMetrics.totalResponseTimeMs += durationMs;
    runtimeMetrics.samples += 1;
  }
}

export async function handleAgent(req, res) {
  const startedAt = Date.now();
  try {
    const { message } = req.body ?? {};

    // input validation
    if (typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: "message is required and must be a non-empty string",
      });
    }

    const normalizedMessage = message.trim();
    const reply = await processMessage(normalizedMessage);
    const durationMs = Date.now() - startedAt;
    trackRuntimeExecution({ ok: true, durationMs });

    await saveInteractionLog({
      message: normalizedMessage,
      responseBody: { reply, duration_ms: durationMs },
      ok: true,
      errorMessage: null,
    });

    // Resposta em texto puro para a UI comportar como chat tradicional
    return res.status(200).type("text/plain; charset=utf-8").send(reply);
  } catch (error) {
    const incomingMessage = typeof req.body?.message === "string" ? req.body.message.trim() : null;
    const upstreamUnavailable = isUpstreamUnavailable(error);
    const fallback = fallbackReply();
    const durationMs = Date.now() - startedAt;
    trackRuntimeExecution({ ok: false, durationMs });

    await saveInteractionLog({
      message: incomingMessage,
      responseBody: upstreamUnavailable ? { reply: fallback, degraded: true, duration_ms: durationMs } : { duration_ms: durationMs },
      ok: false,
      errorMessage: upstreamUnavailable ? `${error?.message ?? "unknown error"} | fallback_response` : error?.message ?? "unknown error",
    });

    // Log completo no servidor (Render logs)
    console.error("Agent controller error:", {
      message: error?.message,
      name: error?.name,
      stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
    });

    // Degrada com resposta de fallback para manter o chat funcional.
    if (upstreamUnavailable) {
      return res.status(200).type("text/plain; charset=utf-8").send(fallback);
    }

    // Resposta controlada no cliente para erros nao previstos.
    return res.status(500).json({
      ok: false,
      error: "internal server error",
    });
  }
}

export async function getAgentMetrics(req, res) {
  const persistedMetrics = await getInteractionMetrics();

  if (persistedMetrics) {
    return res.status(200).json({
      ok: true,
      ...persistedMetrics,
    });
  }

  const avgResponseTimeMs =
    runtimeMetrics.samples > 0
      ? Math.round(runtimeMetrics.totalResponseTimeMs / runtimeMetrics.samples)
      : 0;

  return res.status(200).json({
    ok: true,
    totalExecutions: runtimeMetrics.totalExecutions,
    criticalErrors: runtimeMetrics.criticalErrors,
    avgResponseTimeMs,
    durationSampleSize: runtimeMetrics.samples,
    source: "runtime",
  });
}
