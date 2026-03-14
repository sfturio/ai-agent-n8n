import { Router } from "express";
import { handleAgent } from "../controllers/agent.controller.js";
import { apiRateLimit } from "../middlewares/rate-limit.middleware.js";

const router = Router();

// POST /api/agent
router.post("/", apiRateLimit, handleAgent);

export default router;
