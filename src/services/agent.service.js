import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

function safeJson(value, maxLen = 2000) {
  try {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    return str.length > maxLen ? str.slice(0, maxLen) + "...(truncated)" : str;
  } catch {
    return "[unserializable]";
  }
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

function extractReplyText(payload) {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";

  const direct = firstNonEmptyString(
    payload.reply,
    payload.message,
    payload.content,
    payload.data,
    payload?.choices?.[0]?.message?.content,
    payload?.body?.choices?.[0]?.message?.content,
  );

  if (direct) return direct;

  if (payload.data && typeof payload.data === "object") {
    const nested = firstNonEmptyString(
      payload.data.reply,
      payload.data.message,
      payload.data.content,
      payload.data.data,
    );

    if (nested) return nested;
  }

  return "";
}

export async function processMessage(message) {
  if (!WEBHOOK_URL) {
    throw new Error("N8N_WEBHOOK_URL is not defined");
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("message must be a non-empty string");
  }

  try {
    const response = await axios.post(
      WEBHOOK_URL,
      { message: message.trim() },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
        validateStatus: () => true,
      },
    );

    if (response.status >= 200 && response.status < 300) {
      const replyText = extractReplyText(response.data);

      if (replyText) {
        return replyText;
      }

      console.error("n8n success response missing text:", {
        status: response.status,
        data: safeJson(response.data),
      });

      throw new Error("empty response from n8n");
    }

    console.error("n8n webhook error response:", {
      status: response.status,
      data: safeJson(response.data),
    });

    throw new Error(`n8n error ${response.status}: ${safeJson(response.data)}`);
  } catch (error) {
    const isAxios = Boolean(error?.isAxiosError);

    if (isAxios) {
      console.error("n8n request failed:", {
        message: error.message,
        code: error.code,
        timeout: error.code === "ECONNABORTED",
        url: WEBHOOK_URL,
      });

      if (error.code === "ECONNABORTED") {
        throw new Error("n8n webhook timeout");
      }

      throw new Error("failed to reach n8n webhook");
    }

    if (error instanceof Error) {
      throw error;
    }

    console.error("Unexpected service error:", {
      message: error?.message,
      name: error?.name,
    });

    throw new Error("unexpected error calling n8n");
  }
}
