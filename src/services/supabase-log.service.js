import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "agent_messages";

let warnedMissingConfig = false;

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function trimForLog(value, maxLen = 1000) {
  if (!value) return value;
  return value.length > maxLen ? `${value.slice(0, maxLen)}...(truncated)` : value;
}

export async function saveInteractionLog({ message, responseBody, ok, errorMessage }) {
  if (!hasSupabaseConfig()) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn("Supabase log disabled: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
    }
    return;
  }

  const endpoint = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${SUPABASE_TABLE}`;

  const payload = {
    message,
    response_body: responseBody ?? null,
    ok: Boolean(ok),
    error_message: errorMessage ?? null,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
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
