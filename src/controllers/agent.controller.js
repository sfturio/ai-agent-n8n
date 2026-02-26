import { processMessage } from "../services/agent.service.js";

export async function handleAgent(req, res) {
  try {
    const { message } = req.body;

    // input validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        ok: false,
        error: "message is required and must be a string",
      });
    }

    const response = await processMessage(message);

    return res.status(200).json({
      ok: true,
      data: response,
    });
  } catch (error) {
    console.error("Agent controller error:", error.message);

    return res.status(500).json({
      ok: false,
      error: "internal server error",
    });
  }
}