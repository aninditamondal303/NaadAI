/**
 * Daily riyaz planner. The order follows a common riyaz routine:
 * aakar warm-up -> Sa sadhana -> kharaj -> paltas -> raag practice -> taans
 * -> ear training. Time given to each step adapts to the singer's real
 * measurements, and each step says which measurement it is based on.
 * With no measurements yet, it says so and uses an even split.
 */
import type { ComprehensiveRaag } from "../data/allRaags";
import type { PracticeRecord } from "../lib/practiceHistory";
import { raagsForHour } from "./raagTime";
import { weakSwaras } from "./weakSwaras";

export interface PlanStep {
  id: "aakar" | "sa-sadhana" | "kharaj" | "paltas" | "raag" | "taans" | "ear";
  title: string;
  minutes: number;
  /** Why this step got this much time, citing real measurements only. */
  reason: string;
  /** Where in the app to do it. */
  goTo: { tab: "analyzer" | "practice" | "tanpura"; mode?: string };
}

const SPEEDS = ["", "thah", "dugun", "tigun", "chaugun"];

export function buildPlan(history: PracticeRecord[], raags: ComprehensiveRaag[], totalMinutes: number, now = new Date()): PlanStep[] {
  const sadhana = history.filter((r): r is Extract<PracticeRecord, { kind: "sa-sadhana" }> => r.kind === "sa-sadhana");
  const analyses = history.filter((r): r is Extract<PracticeRecord, { kind: "analysis" }> => r.kind === "analysis");
  const paltas = history.filter((r): r is Extract<PracticeRecord, { kind: "palta" | "pakad" }> => r.kind === "palta" || r.kind === "pakad");
  const quizzes = history.filter((r): r is Extract<PracticeRecord, { kind: "ear-quiz" }> => r.kind === "ear-quiz");

  // weights (relative); adjusted by measurements below
  const w = { aakar: 1, "sa-sadhana": 2, kharaj: 1.5, paltas: 2.5, raag: 3, taans: 1, ear: 1 };
  const reasons: Record<keyof typeof w, string> = {
    aakar: "Open the voice gently on \"aa\" before measuring anything.",
    "sa-sadhana": "No Sa sadhana measured yet: start by holding Sa against the tanpura.",
    kharaj: "No recordings analysed yet, so your lower range isn't known.",
    paltas: "No paltas practised yet: start at thah.",
    raag: "Practise the raag of this time of day.",
    taans: "Short fast passages as a guide; the app doesn't score taans.",
    ear: "No ear-training quiz taken yet.",
  };

  const lastSadhana = sadhana[sadhana.length - 1];
  if (lastSadhana) {
    const unsteady = lastSadhana.wobbleCents > 8 || Math.abs(lastSadhana.medianOffsetCents) > 10;
    const short = lastSadhana.longestHoldSec < 10;
    w["sa-sadhana"] = unsteady || short ? 3 : 1.5;
    reasons["sa-sadhana"] = `Last Sa sadhana: held ${lastSadhana.longestHoldSec.toFixed(1)} s, ${Math.abs(lastSadhana.medianOffsetCents).toFixed(0)} cents ${lastSadhana.medianOffsetCents >= 0 ? "sharp" : "flat"}, wobble ±${lastSadhana.wobbleCents.toFixed(1)} cents${unsteady || short ? ", so extra time today." : "."}`;
  }

  const withRange = analyses.filter(a => a.lowest);
  if (withRange.length) {
    const lowestSemis = Math.min(...withRange.map(a => 12 * Math.log2(a.lowest!.hz / a.saHz)));
    const reachesMandraPa = lowestSemis <= -5 + 0.5;
    w.kharaj = reachesMandraPa ? 1 : 2;
    reasons.kharaj = `Lowest held note so far is ${lowestSemis.toFixed(0)} semitones from Sa${reachesMandraPa ? " (mandra Pa or below)." : ", above mandra Pa, so extra kharaj today."}`;
  }

  const weak = weakSwaras(history).slice(0, 2);
  if (paltas.length) {
    const best = Math.max(0, ...paltas.filter(p => p.score >= 85).map(p => p.speed));
    reasons.paltas = best ? `Highest clean speed so far: ${SPEEDS[best]}.` : "No palta passed at 85 yet: stay at thah until it's clean.";
  }
  if (weak.length) {
    w.paltas += 1;
    reasons.paltas += ` Include weak-swara paltas for ${weak.map(s => `${s.name} (${s.reason})`).join(" and ")}.`;
  }

  const timeRaags = raagsForHour(raags, now.getHours());
  if (timeRaags.length) reasons.raag = `Raags for this time of day: ${timeRaags.slice(0, 4).map(r => r.name.replace(/^Raag\s+/i, "")).join(", ")}.`;

  if (quizzes.length) {
    const last = quizzes[quizzes.length - 1];
    const pct = (100 * last.correct) / last.total;
    w.ear = pct < 70 ? 1.5 : 1;
    reasons.ear = `Last quiz: ${last.correct} of ${last.total} correct.`;
  }

  const order: (keyof typeof w)[] = ["aakar", "sa-sadhana", "kharaj", "paltas", "raag", "taans", "ear"];
  const totalW = order.reduce((s, k) => s + w[k], 0);
  const titles: Record<keyof typeof w, string> = {
    aakar: "Aakar warm-up", "sa-sadhana": "Sa sadhana", kharaj: "Kharaj (low notes)", paltas: "Paltas",
    raag: "Raag practice", taans: "Taans", ear: "Ear training",
  };
  const goTo: Record<keyof typeof w, PlanStep["goTo"]> = {
    aakar: { tab: "tanpura" }, "sa-sadhana": { tab: "analyzer", mode: "sadhana" }, kharaj: { tab: "tanpura" },
    paltas: { tab: "practice" }, raag: { tab: "analyzer", mode: "singing" }, taans: { tab: "tanpura" }, ear: { tab: "practice", mode: "ear" },
  };
  return order.map(k => ({
    id: k,
    title: titles[k],
    minutes: Math.max(2, Math.round((w[k] / totalW) * totalMinutes)),
    reason: reasons[k],
    goTo: goTo[k],
  }));
}
