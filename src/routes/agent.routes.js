import { Router } from "express";
import { getAgentMetrics, handleAgent, warmupAgentProvider } from "../controllers/agent.controller.js";
import { apiRateLimit } from "../middlewares/rate-limit.middleware.js";

const router = Router();

// GET /api/agent/metrics
router.get("/metrics", getAgentMetrics);

// GET /api/agent/warmup
router.get("/warmup", warmupAgentProvider);

// POST /api/agent
router.post("/", apiRateLimit, handleAgent);

export default router;
