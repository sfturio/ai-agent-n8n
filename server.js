import express from "express";
import agentRoutes from "./routes/agent.routes.js";

const app = express();

app.use(express.json());
app.use("/agent", agentRoutes);

app.listen(3000);