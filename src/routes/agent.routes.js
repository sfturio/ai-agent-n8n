import { Router } from "express";
import { handleAgent } from "../controllers/agent.controller.js";

const router = Router();

// POST /api/agent
router.post("/", handleAgent);

export default router;