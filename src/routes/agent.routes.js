import express from "express";
import { handleAgent } from "../controllers/agent.controller.js";

const router = express.Router();

router.post("/", handleAgent);

export default router;