import { Router } from "express";
import { handleAgent } from "../controllers/agent.controller.js";

const router = Router();

router.post("/", handleAgent);

export default router;