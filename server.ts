/**
 * Naad AI server.
 *
 * - Serves the app (Vite in development, the built files in production).
 * - Optional written feedback: an AI model comments on measurements that
 *   were made in the browser. It never sees audio and must not invent numbers.
 *   If no API key is set, the endpoint says so and the app shows only the
 *   measurements.
 */
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { FEEDBACK_SYSTEM_PROMPT, buildFeedbackPrompt, sanitiseMeasurements } from "./server/feedback.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "200kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// Written feedback from measured numbers
// -------------------------------------------------------------
app.post("/api/feedback", async (req, res) => {
  const measurements = sanitiseMeasurements(req.body?.measurements);
  if (!measurements) {
    return res.status(400).json({ error: "Missing or invalid measurements." });
  }

  const apiKey = process.env.FEEDBACK_API_KEY?.trim();
  if (!apiKey) {
    return res.json({ unavailable: true, reason: "no API key configured" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.FEEDBACK_MODEL || "gemini-3.5-flash",
      contents: buildFeedbackPrompt(measurements),
      config: { systemInstruction: FEEDBACK_SYSTEM_PROMPT, temperature: 0.4 },
    });
    const text = (response.text || "").trim();
    if (!text) throw new Error("empty response");
    res.json({ text });
  } catch (err: any) {
    console.error("Feedback request failed:", err?.message || err);
    res.status(502).json({ error: "The feedback service didn't respond." });
  }
});

// -------------------------------------------------------------
// App serving
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Naad AI running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
