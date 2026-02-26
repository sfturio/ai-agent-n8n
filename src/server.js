import express from "express";
import dotenv from "dotenv";
import agentRoutes from "./routes/agent.routes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middlewares
app.use(express.json());

// servir HTML/CSS/JS
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// rotas da API
app.use("/api/agent", agentRoutes);

// healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

// Render/Docker: escutar em 0.0.0.0 pra aceitar conexões externas
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});