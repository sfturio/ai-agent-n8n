import express from "express";
import dotenv from "dotenv";
import agentRoutes from "./routes/agent.routes.js";
import { warmupN8NService } from "./services/agent.service.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middlewares
app.use(express.json());

// servir HTML/CSS/JS (public fica na raiz do projeto)
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// rotas da API
app.use("/api/agent", agentRoutes);

// healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
const WARMUP_ON_BOOT = String(process.env.N8N_WARMUP_ON_BOOT || "true").toLowerCase() !== "false";

// Render/Docker: escutar em 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  if (WARMUP_ON_BOOT) {
    setTimeout(async () => {
      const result = await warmupN8NService({ force: true });
      console.log("n8n warmup on boot:", result);
    }, 1500);
  }
});
