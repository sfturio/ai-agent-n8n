import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "agent_messages";
const METRICS_SAMPLE_LIMIT = Number(process.env.METRICS_SAMPLE_LIMIT || 500);

let warnedMissingConfig = false;

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function trimForLog(value, maxLen = 1000) {
  if (!value) return value;
  return value.length > maxLen ? `${value.slice(0, maxLen)}...(truncated)` : value;
}

function createEndpoint(query = "") {
  const base = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${SUPABASE_TABLE}`;
  return query ? `${base}?${query}` : base;
}

function baseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

function parseCountFromContentRange(value) {
  if (!value) return 0;
  const parts = String(value).split("/");
  if (parts.length < 2) return 0;
  const total = Number(parts[1]);
  return Number.isFinite(total) ? total : 0;
}

export async function saveInteractionLog({ message, responseBody, ok, errorMessage }) {
  if (!hasSupabaseConfig()) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn("Supabase log disabled: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
    }
    return;
  }

  const endpoint = createEndpoint();

  const payload = {
    message,
    response_body: responseBody ?? null,
    ok: Boolean(ok),
    error_message: errorMessage ?? null,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: baseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Supabase insert failed:", {
        status: res.status,
        body: trimForLog(text),
      });
    }
  } catch (error) {
    console.error("Supabase request failed:", {
      message: error?.message,
      name: error?.name,
    });
  }
}

async function fetchCount(query) {
  const endpoint = createEndpoint(query);
  const res = await fetch(endpoint, {
    method: "HEAD",
    headers: baseHeaders({ Prefer: "count=exact" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`supabase count failed (${res.status}): ${trimForLog(text)}`);
  }

  return parseCountFromContentRange(res.headers.get("content-range"));
}

export async function getInteractionMetrics() {
  if (!hasSupabaseConfig()) return null;

  try {
    const totalExecutions = await fetchCount("select=id");
    const criticalErrors = await fetchCount("select=id&ok=eq.false");

    const samplesRes = await fetch(createEndpoint(`select=response_body&order=created_at.desc&limit=${METRICS_SAMPLE_LIMIT}`), {
      method: "GET",
      headers: baseHeaders({ "Content-Type": "application/json" }),
    });

    if (!samplesRes.ok) {
      const text = await samplesRes.text();
      throw new Error(`supabase metrics sample failed (${samplesRes.status}): ${trimForLog(text)}`);
    }

    const rows = await samplesRes.json();
    let durationSum = 0;
    let durationCount = 0;

    for (const row of rows) {
      const duration = Number(row?.response_body?.duration_ms);
      if (Number.isFinite(duration) && duration >= 0) {
        durationSum += duration;
        durationCount += 1;
      }
    }

    const avgResponseTimeMs = durationCount > 0 ? Math.round(durationSum / durationCount) : 0;

    return {
      totalExecutions,
      criticalErrors,
      avgResponseTimeMs,
      durationSampleSize: durationCount,
      source: "supabase",
    };
  } catch (error) {
    console.error("Supabase metrics failed:", {
      message: error?.message,
      name: error?.name,
    });
    return null;
  }
}
