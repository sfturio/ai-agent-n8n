import { processMessage } from "../services/agent.service.js";
import { saveInteractionLog } from "../services/supabase-log.service.js";

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

export async function handleAgent(req, res) {
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

    await saveInteractionLog({
      message: normalizedMessage,
      responseBody: { reply },
      ok: true,
      errorMessage: null,
    });

    // Resposta em texto puro para a UI comportar como chat tradicional
    return res.status(200).type("text/plain; charset=utf-8").send(reply);
  } catch (error) {
    const incomingMessage = typeof req.body?.message === "string" ? req.body.message.trim() : null;
    const upstreamUnavailable = isUpstreamUnavailable(error);
    const fallback = fallbackReply();

    await saveInteractionLog({
      message: incomingMessage,
      responseBody: upstreamUnavailable ? { reply: fallback, degraded: true } : null,
      ok: upstreamUnavailable,
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
