import { processMessage } from "../services/agent.service.js";

export async function handleAgent(req, res) {
  const response = await processMessage(req.body.message);
  res.json(response);
}