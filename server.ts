import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI-powered business inventory analysis route
  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { summaryData } = req.body;
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert ERP & Inventory consultant for a business in Nepal. Provide 3 concise actionable inventory and sales optimization tips based on the following JSON data:\n${JSON.stringify(summaryData)}`,
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error("AI Insights error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI insights" });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OmniStock ERP server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
