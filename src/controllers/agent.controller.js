import { processMessage } from "../services/agent.service.js";
import { saveInteractionLog } from "../services/supabase-log.service.js";

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
    const result = await processMessage(normalizedMessage);

    await saveInteractionLog({
      message: normalizedMessage,
      responseBody: result,
      ok: true,
      errorMessage: null,
    });

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
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
