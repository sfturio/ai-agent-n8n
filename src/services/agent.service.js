import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const MAX_RETRIES = Number(process.env.N8N_RETRY_MAX || 2);
const RETRY_BASE_DELAY_MS = Number(process.env.N8N_RETRY_BASE_DELAY_MS || 800);
const REQUEST_TIMEOUT_MS = Number(process.env.N8N_REQUEST_TIMEOUT_MS || 45000);
const WARMUP_URL = process.env.N8N_WARMUP_URL;
const WARMUP_TIMEOUT_MS = Number(process.env.N8N_WARMUP_TIMEOUT_MS || 8000);
const COLD_START_RETRY_DELAY_MS = Number(process.env.N8N_COLD_START_RETRY_DELAY_MS || 3500);
const WARMUP_METHOD = String(process.env.N8N_WARMUP_METHOD || "GET").toUpperCase();
const READY_TTL_MS = Number(process.env.N8N_READY_TTL_MS || 120000);
const WARMUP_MAX_WAIT_MS = Number(process.env.N8N_WARMUP_MAX_WAIT_MS || 30000);
const WARMUP_POLL_INTERVAL_MS = Number(process.env.N8N_WARMUP_POLL_INTERVAL_MS || 3000);

let lastWarmupAt = 0;
let lastWarmupSuccessAt = 0;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value) {
  if (!value) return null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) return Math.round(asNumber * 1000);

  const asDate = Date.parse(String(value));
  if (Number.isFinite(asDate)) {
    const delta = asDate - Date.now();
    return delta > 0 ? delta : null;
  }

  return null;
}

function backoffMs(attempt) {
  return RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
}

async function postToN8N(message) {
  return axios.post(
    WEBHOOK_URL,
    { message: message.trim() },
    {
      headers: { "Content-Type": "application/json" },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    },
  );
}

function resolveWarmupUrl() {
  if (typeof WARMUP_URL === "string" && WARMUP_URL.trim().length > 0) {
    return WARMUP_URL.trim();
  }

  if (typeof WEBHOOK_URL !== "string" || WEBHOOK_URL.trim().length === 0) {
    return "";
  }

  try {
    return new URL(WEBHOOK_URL).origin;
  } catch {
    return "";
  }
}

function shouldRetryForColdStart(error) {
  const code = String(error?.code ?? "").toUpperCase();
  return code === "ECONNABORTED" || code === "ECONNRESET" || code === "EAI_AGAIN" || code === "ETIMEDOUT";
}

export async function warmupN8NService({ force = false } = {}) {
  const warmupTarget = resolveWarmupUrl();
  if (!warmupTarget) {
    return { ok: false, skipped: true, reason: "missing_warmup_url" };
  }

  const now = Date.now();
  if (!force && now - lastWarmupAt < 15_000) {
    return { ok: true, skipped: true, reason: "throttled" };
  }
  lastWarmupAt = now;

  try {
    const requestConfig = {
      timeout: WARMUP_TIMEOUT_MS,
      validateStatus: () => true,
    };

    const res =
      WARMUP_METHOD === "POST"
        ? await axios.post(warmupTarget, { warmup: true }, { ...requestConfig, headers: { "Content-Type": "application/json" } })
        : await axios.get(warmupTarget, requestConfig);

    const isOk = res.status >= 200 && res.status < 300;
    if (isOk) {
      lastWarmupSuccessAt = Date.now();
    }

    return {
      ok: isOk,
      skipped: false,
      status: res.status,
      target: warmupTarget,
      method: WARMUP_METHOD,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      target: warmupTarget,
      method: WARMUP_METHOD,
      error: error?.message || "warmup request failed",
    };
  }
}

export function getN8NReadiness() {
  const now = Date.now();
  const ageMs = lastWarmupSuccessAt > 0 ? now - lastWarmupSuccessAt : null;
  return {
    ready: Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= READY_TTL_MS,
    lastSuccessAt: lastWarmupSuccessAt || null,
    ageMs,
    ttlMs: READY_TTL_MS,
  };
}

export async function ensureN8NReady() {
  const snapshot = getN8NReadiness();
  if (snapshot.ready) {
    return { ok: true, source: "cache", readiness: snapshot };
  }

  const startedAt = Date.now();
  let attempts = 0;
  let lastResult = null;

  while (Date.now() - startedAt < WARMUP_MAX_WAIT_MS) {
    attempts += 1;
    lastResult = await warmupN8NService({ force: true });

    if (lastResult?.ok) {
      return { ok: true, source: "warmup", attempts, readiness: getN8NReadiness(), warmup: lastResult };
    }

    await sleep(WARMUP_POLL_INTERVAL_MS);
  }

  return {
    ok: false,
    source: "warmup-timeout",
    attempts,
    readiness: getN8NReadiness(),
    warmup: lastResult,
  };
}

export async function processMessage(message, { allowColdStartRetry = true } = {}) {
  if (!WEBHOOK_URL) {
    throw new Error("N8N_WEBHOOK_URL is not defined");
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("message must be a non-empty string");
  }

  try {
    let response = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await postToN8N(message);

      if (response.status !== 429) break;

      if (attempt === MAX_RETRIES) break;

      const retryAfterHeader = response.headers?.["retry-after"];
      const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
      const delay = retryAfterMs ?? backoffMs(attempt);

      console.warn("n8n returned 429, retrying...", {
        attempt: attempt + 1,
        delayMs: delay,
      });

      await sleep(delay);
    }

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

      if (allowColdStartRetry && shouldRetryForColdStart(error)) {
        const warm = await warmupN8NService({ force: true });
        console.warn("n8n warmup before retry:", warm);
        await sleep(COLD_START_RETRY_DELAY_MS);
        return processMessage(message, { allowColdStartRetry: false });
      }

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
