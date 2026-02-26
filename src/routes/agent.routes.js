import { Router } from "express";
import { handleAgent } from "../controllers/agent.controller.js";

const router = Router();

router.post("/agent", handleAgent);

export default router;