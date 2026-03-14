import { processMessage } from "../services/agent.service.js";
import { saveInteractionLog } from "../services/supabase-log.service.js";
import {
  finishExecution,
  getDashboardData,
  startExecution,
} from "../services/agent-metrics.service.js";

export async function handleAgent(req, res) {
  let execution = null;
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
    execution = startExecution(normalizedMessage);
    const reply = await processMessage(normalizedMessage);
    const estimatedTokenCount = Math.ceil((normalizedMessage.length + reply.length) / 4);
    finishExecution(execution.id, { ok: true, estimatedTokenCount });

    await saveInteractionLog({
      message: normalizedMessage,
      responseBody: { reply },
      ok: true,
      errorMessage: null,
    });

    // Resposta em texto puro para a UI comportar como chat tradicional
    return res.status(200).type("text/plain; charset=utf-8").send(reply);
  } catch (error) {
    if (execution?.id) {
      finishExecution(execution.id, { ok: false, estimatedTokenCount: 0 });
    }

    const incomingMessage = typeof req.body?.message === "string" ? req.body.message.trim() : null;

    await saveInteractionLog({
      message: incomingMessage,
      responseBody: null,
      ok: false,
      errorMessage: error?.message ?? "unknown error",
    });

    // Log completo no servidor (Render logs)
    console.error("Agent controller error:", {
      message: error?.message,
      name: error?.name,
      stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
    });

    // Resposta controlada no cliente
    return res.status(500).json({
      ok: false,
      error: "internal server error",
    });
  }
}

export function getDashboard(req, res) {
  const data = getDashboardData();
  return res.status(200).json({ ok: true, ...data });
}
