/**
 * Naad AI server.
 *
 * - Serves the app (Vite in development, the built files in production).
 * - Stores the singer's Sa (profile).
 * - Optional written feedback: an AI model comments on measurements that
 *   were made in the browser. It never sees audio and must not invent numbers.
 *   If no API key is set, the endpoint says so and the app shows only the
 *   measurements.
 */
import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { FEEDBACK_SYSTEM_PROMPT, buildFeedbackPrompt, sanitiseMeasurements } from "./server/feedback.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "200kb" }));

// -------------------------------------------------------------
// Profile (the singer's Sa)
// NOTE: one file shared by everyone using this server. Per-user accounts are
// planned (Phase 8); until then the app is meant for one singer per server.
// -------------------------------------------------------------
const PROFILE_FILE_PATH = path.join(process.cwd(), "data-vocal-twin.json");

const INITIAL_PROFILE = {
  digitalTwinId: "local_profile",
  vocalProfile: { baseTonicHz: 130.81 }, // C3, a common male Sa; changed at sign-up or in "Find my Sa"
};

function loadUserProfile() {
  try {
    if (fs.existsSync(PROFILE_FILE_PATH)) {
      const saved = JSON.parse(fs.readFileSync(PROFILE_FILE_PATH, "utf-8"));
      const hz = Number(saved?.vocalProfile?.baseTonicHz);
      return {
        digitalTwinId: String(saved?.digitalTwinId || INITIAL_PROFILE.digitalTwinId),
        vocalProfile: { baseTonicHz: Number.isFinite(hz) && hz > 40 && hz < 1000 ? hz : INITIAL_PROFILE.vocalProfile.baseTonicHz },
      };
    }
  } catch (error) {
    console.error("Couldn't read the profile file, using defaults:", error);
  }
  return INITIAL_PROFILE;
}

function saveUserProfile(profile: typeof INITIAL_PROFILE) {
  try {
    fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
  } catch (error) {
    console.error("Couldn't save the profile file:", error);
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/profile", (_req, res) => {
  res.json(loadUserProfile());
});

app.post("/api/profile", (req, res) => {
  const hz = Number(req.body?.vocalProfile?.baseTonicHz);
  if (!Number.isFinite(hz) || hz <= 40 || hz >= 1000) {
    return res.status(400).json({ error: "Profile must include vocalProfile.baseTonicHz between 40 and 1000 Hz." });
  }
  const profile = {
    digitalTwinId: String(req.body?.digitalTwinId || INITIAL_PROFILE.digitalTwinId).slice(0, 80),
    vocalProfile: { baseTonicHz: hz },
  };
  saveUserProfile(profile);
  res.json({ success: true, profile });
});

// -------------------------------------------------------------
// Written feedback from measured numbers
// -------------------------------------------------------------
app.post("/api/feedback", async (req, res) => {
  const measurements = sanitiseMeasurements(req.body?.measurements);
  if (!measurements) {
    return res.status(400).json({ error: "Missing or invalid measurements." });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.json({ unavailable: true, reason: "no API key configured" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
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
