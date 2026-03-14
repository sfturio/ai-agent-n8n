import dotenv from "dotenv";

dotenv.config();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 20);
const BLOCK_DURATION_MS = Number(process.env.RATE_LIMIT_BLOCK_MS || 30_000);

const state = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function now() {
  return Date.now();
}

function cleanupOldEntries(record, currentTime) {
  record.hits = record.hits.filter((ts) => currentTime - ts <= WINDOW_MS);
}

export function apiRateLimit(req, res, next) {
  const ip = getClientIp(req);
  const currentTime = now();

  const record = state.get(ip) || { hits: [], blockedUntil: 0 };
  cleanupOldEntries(record, currentTime);

  if (record.blockedUntil > currentTime) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.blockedUntil - currentTime) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      error: "too many requests, please try again in a few seconds",
    });
  }

  record.hits.push(currentTime);

  if (record.hits.length > MAX_REQUESTS) {
    record.blockedUntil = currentTime + BLOCK_DURATION_MS;
    state.set(ip, record);
    res.setHeader("Retry-After", String(Math.ceil(BLOCK_DURATION_MS / 1000)));
    return res.status(429).json({
      ok: false,
      error: "rate limit exceeded",
    });
  }

  state.set(ip, record);
  return next();
}
