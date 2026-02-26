import express from "express";
import dotenv from "dotenv";
import agentRoutes from "./routes/agent.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// middlewares
app.use(express.json());

// routes
app.use("/api/agent", agentRoutes);

// health check endpoint
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "ai-agent",
    status: "running",
  });
});

// start server
app.listen(PORT, () => {
  console.log(`AI Agent server running on port ${PORT}`);
});