import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Serve a interface web
app.use(express.static("public"));

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // MOCK RESPONSE (sem nome)
    const reply = `Olá! Entendi que você disse: "${message}". 
Qual é seu principal objetivo: emagrecer, ganhar massa muscular ou melhorar o condicionamento físico?`;

    return res.json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("Web UI + API running on http://localhost:3000");
});