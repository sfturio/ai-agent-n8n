import { processMessage } from "../services/agent.service.js";

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

    const result = await processMessage(message.trim());

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
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