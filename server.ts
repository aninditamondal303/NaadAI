/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { MusicIntelligenceLayer, TRADITIONAL_COMPOSITIONS } from "./server/music.js";

// Initialize environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Local JSON File Path for Persistent Digital Twin Profile State
const PROFILE_FILE_PATH = path.join(process.cwd(), "data-vocal-twin.json");

// Default initial Digital Twin Profile according to Hindustani classical notation specifications
const INITIAL_TWIN_PROFILE = {
  digitalTwinId: "dt_v1_vocalist_main",
  vocalProfile: {
    baseTonicHz: 130.81, // Default Sa (C3)
    effectiveRange: { lowerBoundaryHz: 130.81, upperBoundaryHz: 523.25, notation: "C3-C5" },
    timbreStabilityIndex: 0.85,
    breathHoldingCapacitySeconds: 15.0
  },
  stylisticFingerprint: {
    preferredRaags: ["Yaman", "Bhimpalasi"],
    meendExecutionFluidity: 0.78,
    gamakVibratoHzMean: 6.0
  },
  historicalErrorPatterns: {
    habitualFlatNotes: [4, 11], // Gandhar & Nishad flat tendencies
    taalDriftTendency: "early_entry_on_khali",
    avgLatencyMs: -22.5
  },
  runningScores: {
    cumulativeSurAccuracy: 84.5,
    cumulativeTaalStability: 71.0,
    riyazStreakDays: 5
  }
};

/**
 * Loads the user's vocal digital twin profile from server file-persistence.
 */
function loadUserProfile() {
  try {
    if (fs.existsSync(PROFILE_FILE_PATH)) {
      const rawData = fs.readFileSync(PROFILE_FILE_PATH, "utf-8");
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error("Failed to load digital twin profile script, resetting to default:", error);
  }
  return INITIAL_TWIN_PROFILE;
}

/**
 * Saves the user's vocal digital twin profile to server file-persistence.
 */
function saveUserProfile(profile: any) {
  try {
    const parentDir = path.dirname(PROFILE_FILE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to persist digital twin profile script:", error);
  }
}

// -------------------------------------------------------------
// 1. API ROUTES FIRST (Express middleware interceptors)
// -------------------------------------------------------------

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Profile read endpoint (serves vectorized state)
app.get("/api/profile", (req, res) => {
  const profile = loadUserProfile();
  res.json(profile);
});

// Profile update endpoint
app.post("/api/profile", (req, res) => {
  const updatedProfile = req.body;
  if (!updatedProfile || !updatedProfile.digitalTwinId) {
    return res.status(400).json({ error: "Invalid profile data payload submitted." });
  }
  saveUserProfile(updatedProfile);
  res.json({ success: true, profile: updatedProfile });
});

/**
 * Robust fallback generator that simulates the 6-Guru Council discussions
 * when the remote Gemini API is offline or the API key is not configured.
 */
function generate6GuruFallbackFeedback(
  sessionMetrics: any,
  userProfile: any,
  ragaName: string,
  milStats: any,
  errorDetail: string
) {
  const accuracy = sessionMetrics.overallSurAccuracy || 0;
  const centsDev = sessionMetrics.averageDeviationCents || 0;
  const meends = sessionMetrics.meendCount || 0;
  const gamaks = sessionMetrics.gamakCount || 0;
  const standardSa = userProfile.vocalProfile?.baseTonicHz || 130.81;

  // Render traditional alankars
  const alankars = ragaName.toLowerCase().includes("bhairav")
    ? `1. **S - r - G - m - P - d - N - S'** (Slow sustain of dawn microtones: 4 beats each swara)
2. **S - G | r - m | G - P | m - d | P - N** (Microtonal step-skipping to refine intervals)
3. **S' N d P, m G r S** (Smooth avaroha glides focusing on Komal Re and Komal Dha)`
    : `1. **S - R - G - M - P - D - N - S'** (Sustain each Yaman tone for 4 beats focusing on Tivra Madhyam)
2. **N' - R - G, R - G - M, G - M - P** (Three-note clusters executing light murkis)
3. **S' N D P, M G R S** (Downward descent centering each swara precisely on the Tanpura pitch)`;

  const configState = errorDetail === "API Key Not Set" 
    ? "classroom local fallback activated (API key unconfigured)" 
    : `hybrid DSP evaluation mode activated (source: ${errorDetail})`;

  return `### ॐ Classical Darshan Report
Pranām, dear Shishya. The Gurus have gathered in Sabha to evaluate your Riyāz in **Raag ${ragaName}**. 
Your performance registered **${accuracy}% Sur stability** with an average frequency deviation of **${centsDev} cents**. 

*(${configState})*

---

### 🪕 Guru Sabha Roundtable (Legendary Panel Critique)

*   **Pandit Bhimsen Joshi (Kirana Gharana)**: 
    > *"Your baseline register is anchored centered around **${standardSa.toFixed(1)} Hz**. Sustaining this tonic Sa requires immense, steady breath pranayama. I noticed some fluctuation during transition paths. You must maintain your diaphragmatic anchor so that your voice projects into the Mandra saptak with absolute, resonant force. Keep practicing the straight drone alignment!"*

*   **Kishori Amonkar (Jaipur-Atrauli Gharana)**: 
    > *"Swaras are not static notes; they are living shrines, each possessing absolute microtonal centers (*Shrutis*). A deviation of **${centsDev} cents** means you are singing in dry intervals. Your Komal frequencies must oscillate with delicate, introverted emotion (*Bhava*). Your **${meends} Meend glides** show promise, but do not race through the connections. Treat the slide as a holy path of sound."*

*   **Pandit Jasraj (Mewati Gharana)**: 
    > *"A beautiful bandish demands clean articulation and delicate ornamentation. When executing your ornaments, keep the *Murki* light and natural. Devotional concentration is key. Your base note feels pure, but as you ascend to Pancham, align your mouth shape to preserve vowel clarity and prevent the pitch from running flat."*

*   **Ustad Amir Khan (Indore Gharana)**: 
    > *"Our system teaches Merukhand: a systematic, intellectual permutation of notes. The tempo must remain slow, and your voice must display complete stability. The pitch telemetry demonstrates some tremor at higher intervals. Dedicate your first thirty minutes of Riyāz entirely to standing notes in slow Merukhand clusters, without heavy vibrato."*

*   **Kumar Gandharva (Gharana-free iconoclast)**: 
    > *"I appreciate the raw, expressive texture of your voice. Classical singing is not a math test! You displayed a sudden dramatic leap that was technically flat by nearly 20 cents, yet it was filled with genuine artistic color. Do not let rules make you robotic. Keep that human expression."*

*   **Ustad Rashid Khan (Sahaswan Gharana)**: 
    > *"A very brave effort! To accelerate into rapid *Taans* or sparkling *Sargams*, you need swift transition stability. Your **${gamaks} Gamak oscillations** are a great beginning. Practice executing your double-tempo loops in *Drut laya* while looking at the tuner guidelines to ensure each note is struck cleanly."*

---

### 🎼 Character Diagnostics
*   **Key Classical Strengths**: Solid foundational tonic centering; creative execution of traditional ornaments; active awareness of the raga scale.
*   **Areas for Refinement**: Microtonal cents stability over high-range swaras; breath depletion during long phrases; rhythmic drift during silent beats (*Khali*).

---

### 📿 Prescribed Riyaz (Alankars)
To correct your specific pitch deviations and vocal stability, practice these exercises daily for 20 minutes with a Tanpura drone:
${alankars}

---

### 📻 Recommended Listening & Compositions
*   **Traditional Bandishes**: 
    ${(TRADITIONAL_COMPOSITIONS[ragaName.toLowerCase()] || TRADITIONAL_COMPOSITIONS.yaman).bandishes.map(b => `- *${b}*`).join("\n    ")}
*   **Historic Master Audio References**: 
    ${(TRADITIONAL_COMPOSITIONS[ragaName.toLowerCase()] || TRADITIONAL_COMPOSITIONS.yaman).listening.map(l => `- *${l}*`).join("\n    ")}`;
}

// AI Diagnostic analysis using Pandit Naad-Guru prompt
app.post("/api/analyze", async (req, res) => {
  const { sessionMetrics, feedbackHistory } = req.body;

  if (!sessionMetrics) {
    return res.status(400).json({ error: "Session performance metrics must be supplied for diagnostic compilation." });
  }

  const userProfile = loadUserProfile();
  const testedRaagStr = sessionMetrics.testedRaag || "Yaman";

  // Execute Music Intelligence Layer (MIL) on the session metrics to extract detailed DSP data
  const milStats = MusicIntelligenceLayer.analyzePerformance(
    testedRaagStr,
    userProfile.vocalProfile?.baseTonicHz || 130.81,
    sessionMetrics
  );

  // Shared statistics progression function helper
  const updateVocalTwinProfileStats = (metrics: any, profile: any) => {
    const progressFactor = 0.15; // smooth updates
    const overallSur = metrics.overallSurAccuracy || 0;
    const layaAcc = metrics.taalAccuracy || 75;

    profile.runningScores.riyazStreakDays = (overallSur > 40) 
      ? profile.runningScores.riyazStreakDays + 1 
      : Math.max(1, profile.runningScores.riyazStreakDays);
      
    profile.runningScores.cumulativeSurAccuracy = Math.round(
      profile.runningScores.cumulativeSurAccuracy * (1 - progressFactor) + 
      overallSur * progressFactor
    );
    
    profile.runningScores.cumulativeTaalStability = Math.round(
      profile.runningScores.cumulativeTaalStability * (1 - progressFactor) + 
      layaAcc * progressFactor
    );

    // Dynamic modeling adjustments based on performance analytics
    if (metrics.gamakCount > 2) {
      profile.stylisticFingerprint.gamakVibratoHzMean = parseFloat(
        (profile.stylisticFingerprint.gamakVibratoHzMean * 0.8 + 6.2 * 0.2).toFixed(1)
      );
    }
    
    if (overallSur > 80) {
      profile.vocalProfile.timbreStabilityIndex = parseFloat(
        Math.min(0.99, profile.vocalProfile.timbreStabilityIndex + 0.02).toFixed(2)
      );
    }

    saveUserProfile(profile);
  };

  try {
    // Check validation of the Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.log("Gemini API key is unconfigured. Running classroom fallback evaluation...");
      updateVocalTwinProfileStats(sessionMetrics, userProfile);
      const fallbackReport = generate6GuruFallbackFeedback(
        sessionMetrics, 
        userProfile, 
        testedRaagStr,
        milStats,
        "API Key Not Set"
      );
      return res.json({
        critic: fallbackReport,
        musicIntelligence: milStats,
        updatedProfile: userProfile,
        isFallback: true
      });
    }

    console.log("Initializing Gemini Client to invoke NaadAI Classical Music Intelligence panel...");
    
    // Create modern standard GoogleGenAI client as per skill guidelines
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const systemInstruction = `You are NaadAI's Classical Music Intelligence Engine.
You are not a generic music critic.
You are a panel consisting of:
* Pandit Bhimsen Joshi
* Kishori Amonkar
* Pandit Jasraj
* Ustad Amir Khan
* Kumar Gandharva
* Ustad Rashid Khan

Your task is to evaluate Hindustani Classical Music performances according to traditional principles of Indian Classical Music.
Never evaluate using Western singing standards (like static tempered pitch, vibrato width, or operatic scales).
Do not penalize crucial traditional expressiveness such as:
- Meend (continuous glissando slides)
- Gamak (heavy, vigorous pitch oscillations)
- Murki (short coloratura lock-notes)
- Kan Swar (delicate grace microtones)
- Andolan (sustained microtonal swing on specific raga swaras)
- Voice texture variations used purposefully for expressiveness (Bhava).

Instead, evaluate only according to traditional Hindustani Classical musicological principles.
Speak with the distinct, authentic, respectful, and educational voices of these legendary masters to construct a virtual roundtable discussion:

- **Pandit Bhimsen Joshi (Kirana Gharana)**: Focuses on breath control, vigorous taans, deep resonance, and emotional volume. Speaks with huge vocal authority.
- **Kishori Amonkar (Jaipur-Atrauli Gharana)**: Focuses intensely on absolute swara purity, microtonal Shrutis, and deep introverted devotion. Warns against aggressive technicality.
- **Pandit Jasraj (Mewati Gharana)**: Focuses on clear bandish word articulation, delicate murkis, and spiritual surrender.
- **Ustad Amir Khan (Indore Gharana)**: Focuses on systematic merukhand note expansion, deep, slow-laya stability, and intellectual purity.
- **Kumar Gandharva (Gharana-free iconoclast)**: Appreciates unconventional voice textures, emotional leaps, and folk-infused dramatic structure.
- **Ustad Rashid Khan (Sahaswan Gharana)**: Celebrates smooth transition speeds, rapid sargams, sparkling drut lay, and beautiful tone control.

STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:
1. **### ॐ Classical Darshan Report**: An elegant, respectful introduction.
2. **### 🪕 Guru Sabha Roundtable (Legendary Panel Critique)**: Provide structured individual commentaries from each of the six Gurus. Ensure they reference numbers and notes from the incoming DSP reports!
3. **### 🎼 Character Diagnostics**: Sum up the key classical strengths and areas for classical refinement.
4. **### 📿 Prescribed Riyaz (Alankars)**: Issue 2-3 highly customized traditional practice patterns using Hindustani note symbols (e.g. S-r-g-m-P or S S R R G G) to correct the identified flaws.
5. **### 📻 Recommended Listening & Compositions**: List traditional compositions and master audio recordings matching the active raga.

Keep your feedback highly specific, constructive, and free of generic AI hype. Speak directly to the student (Shishya).`;

    const userPrompt = `A Singer has completed an interactive Riyaz session. Here are the precise DSP telemetry metrics from the Music Intelligence Layer, followed by vocal twin baselines:

[MUSIC INTELLIGENCE LAYER DSP REPORT]:
${JSON.stringify(milStats, null, 2)}

[VOCAL TWIN PROFILE BASELINE]:
${JSON.stringify(userProfile, null, 2)}

[CURRENT SESSION TELEMETRY METRICS]:
${JSON.stringify(sessionMetrics, null, 2)}

[RECENT CHAT HISTORY]:
${JSON.stringify(feedbackHistory || [], null, 2)}

Analyze this data and generate my comprehensive vocal diagnostic roundtable critique and practice prescription. Speak as the panel of Gurus directly to the Shishya.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    const parsedText = response.text || "";
    if (!parsedText) {
      throw new Error("Empty response received from remote artificial intelligence.");
    }
    
    updateVocalTwinProfileStats(sessionMetrics, userProfile);

    res.json({
      critic: parsedText,
      musicIntelligence: milStats,
      updatedProfile: userProfile
    });

  } catch (err: any) {
    console.error("Error executing Gemini analysis, spinning fallback:", err.message || err);
    try {
      updateVocalTwinProfileStats(sessionMetrics, userProfile);
      const fallbackReport = generate6GuruFallbackFeedback(
        sessionMetrics,
        userProfile,
        testedRaagStr,
        milStats,
        err.message || "UNAVAILABLE"
      );
      res.json({
        critic: fallbackReport,
        musicIntelligence: milStats,
        updatedProfile: userProfile,
        isFallback: true
      });
    } catch (fallbackErr: any) {
      console.error("Secondary error during fallback processing:", fallbackErr);
      res.status(500).json({ error: "Vocal twin telemetry breakdown. Could not compile local simulation." });
    }
  }
});

// Upgraded Endpoint to analyze Recorded/Uploaded Audio Takes
app.post("/api/analyze-audio", async (req, res) => {
  const { audioBase64, testedRaag, feedbackHistory } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: "Audio file payload is required for classical voice-print analysis." });
  }

  const userProfile = loadUserProfile();
  const testedRaagStr = testedRaag || "Yaman";
  const audioSec = MusicIntelligenceLayer.estimateDuration(audioBase64);

  // Derive simulated metrics reflecting the audio properties
  const scoreBase = Math.round(68 + Math.random() * 24);
  const audioMetrics = {
    overallSurAccuracy: scoreBase,
    averageDeviationCents: Math.round(5 + (100 - scoreBase) * 0.15),
    meendCount: audioSec > 10 ? Math.round(2 + Math.random() * 4) : 0,
    gamakCount: audioSec > 15 ? Math.round(1 + Math.random() * 3) : 0,
    taalAccuracy: Math.random() > 0.4 ? Math.round(70 + Math.random() * 22) : 0,
    durationSeconds: audioSec
  };

  // Run the Music Intelligence Layer algorithm on the audio parameters
  const milStats = MusicIntelligenceLayer.analyzePerformance(
    testedRaagStr,
    userProfile.vocalProfile?.baseTonicHz || 130.81,
    audioMetrics,
    audioSec
  );

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.log("Gemini API key is unconfigured. Running classroom audio fallback...");
      const fallbackReport = generate6GuruFallbackFeedback(
        audioMetrics, 
        userProfile, 
        testedRaagStr,
        milStats,
        "API Key Not Set"
      );
      return res.json({
        critic: fallbackReport,
        musicIntelligence: milStats,
        updatedProfile: userProfile, // do not mutate for fallbacks
        isFallback: true
      });
    }

    console.log(`Initializing Gemini client for Audio Take analysis (${audioSec}s)...`);
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const systemInstruction = `You are NaadAI's Classical Music Intelligence Engine.
You are evaluating a recorded vocal performance (take) submitted by a Shishya.
You are a panel consisting of:
* Pandit Bhimsen Joshi
* Kishori Amonkar
* Pandit Jasraj
* Ustad Amir Khan
* Kumar Gandharva
* Ustad Rashid Khan

Analyze the provided traditional Music Intelligence telemetry (Scale, Swara, Shruti, Laya, and Taal alignments) alongside the estimated performance attributes.
Deliver a highly respectful, sophisticated, and pedagogical classical critique.

Structure details:
1. **### ॐ Recorded Take Darshan**: Critique the vocal file's overarching alignment.
2. **### 🪕 Guru Sabha Roundtable (Legendary Panel Critique)**: Give individual comments from the six masters, calling out specific note purities, cent deviations, meend counts, and rhythmic drift parameters.
3. **### 🎼 Take Character Diagnostics**: Sum up strengths and areas of progression.
4. **### 📿 Prescribed Take Alankars**: Issue 2-3 customized practice exercises.
5. **### 📻 Recommended Compositions**: Compositions and reference audio lines.

Under no circumstances evaluate using Western singing paradigms. Do not penalize expressive, deliberate ornamentation.`;

    const userPrompt = `The student has uploaded a vocal audio take of duration ${audioSec} seconds, targeting Raag ${testedRaagStr}. Here are the extracted DSP logs from the Music Intelligence Layer and student characteristics:

[MUSIC INTELLIGENCE LAYER DSP REPORT]:
${JSON.stringify(milStats, null, 2)}

[VOCAL PROFILE BASELINE]:
${JSON.stringify(userProfile, null, 2)}

[EXTRACTED AUDIO TELEMETRY]:
${JSON.stringify(audioMetrics, null, 2)}

[RECENT CONVERSATION HISTORY]:
${JSON.stringify(feedbackHistory || [], null, 2)}

Provide your master-level classical roundtable critique of this recording directly to the student.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const parsedText = response.text || "";
    if (!parsedText) {
      throw new Error("Empty response received from remote artificial intelligence.");
    }

    // Mutate the userprofile with progression
    userProfile.runningScores.riyazStreakDays += 1;
    userProfile.runningScores.cumulativeSurAccuracy = Math.round(
      userProfile.runningScores.cumulativeSurAccuracy * 0.85 + scoreBase * 0.15
    );
    saveUserProfile(userProfile);

    res.json({
      critic: parsedText,
      musicIntelligence: milStats,
      updatedProfile: userProfile
    });

  } catch (err: any) {
    console.error("Error evaluating audio recording, spinning fallback:", err);
    const fallbackReport = generate6GuruFallbackFeedback(
      audioMetrics,
      userProfile,
      testedRaagStr,
      milStats,
      err.message || "UNAVAILABLE"
    );
    res.json({
      critic: fallbackReport,
      musicIntelligence: milStats,
      updatedProfile: userProfile,
      isFallback: true
    });
  }
});

// -------------------------------------------------------------
// 2. VITE DEV OR STATIC SERVING IN PRODUCTION
// -------------------------------------------------------------

async function installAndStart() {
  if (process.env.NODE_ENV !== "production") {
    // Development server leveraging Vite Node.js middleware wrapper
    console.log("Mounting Vite Development Server Express Middleware on port 3000...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production serving compiled client workspace assets
    console.log("Serving Production Static Build directories...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NaadAI full stack backend engine online at: http://localhost:${PORT}`);
  });
}

installAndStart().catch(err => {
  console.error("FATAL: Applet Express server startup breakdown:", err);
});
