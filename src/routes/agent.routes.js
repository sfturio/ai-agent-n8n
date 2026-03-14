import { Router } from "express";
import { getDashboard, handleAgent } from "../controllers/agent.controller.js";

const router = Router();

// GET /api/agent/dashboard
router.get("/dashboard", getDashboard);

// POST /api/agent
router.post("/", handleAgent);

export default router;
