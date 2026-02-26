import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function processMessage(message) {
  if (!WEBHOOK_URL) {
    throw new Error("N8N_WEBHOOK_URL is not defined");
  }

  try {
    const response = await axios.post(
      WEBHOOK_URL,
      { message },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // evita travar indefinidamente
      }
    );

    return response.data;

  } catch (error) {
    // 🔎 Tratamento profissional de erro axios
    if (error.response) {
      console.error("n8n responded with error:", {
        status: error.response.status,
        data: error.response.data,
      });

      throw new Error(
        `n8n error ${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    }

    if (error.request) {
      console.error("No response received from n8n webhook");
      throw new Error("No response from n8n webhook");
    }

    console.error("Axios config error:", error.message);
    throw new Error(`Axios error: ${error.message}`);
  }
}