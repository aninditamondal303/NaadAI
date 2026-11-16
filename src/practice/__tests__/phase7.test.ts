import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../../data/allRaags";
import { RAAG_DETAILS } from "../../data/raagDetails";
import type { PracticeRecord } from "../../lib/practiceHistory";
import { raagQuestion, swaraChoices, swaraQuestion } from "../earQuiz";
import { buildPlan } from "../planner";
import { inRange, parseTimeRange, praharFor, raagsForHour } from "../raagTime";
import { weakSwaraPalta, weakSwaras } from "../weakSwaras";

const raag = (id: string) => RAAG_LIST.find(r => r.id === id)!;
let idCounter = 0;
/** Deterministic pseudo-random sequence for tests. */
const seq = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const analysis = (swaras: { symbol: string; dev: number; wob: number; sec: number }[], extra: Partial<Extract<PracticeRecord, { kind: "analysis" }>> = {}): PracticeRecord => ({
  kind: "analysis", id: String(++idCounter), dateIso: "2026-11-16T10:00:00Z", raagId: "yaman", raagName: "Yaman",
  durationSec: 60, singingSec: 50, saHz: 138.59, heldWithin20CentsPct: 80, medianAbsDeviationCents: 10,
  lowest: { label: "N,", hz: 130.8 }, highest: { label: "P", hz: 207.7 },
  swaras: swaras.map(s => ({ symbol: s.symbol, medianDeviationCents: s.dev, medianWobbleCents: s.wob, totalHeldSec: s.sec })),
  ...extra,
});

describe("time of day", () => {
  it("parses ranges, including ones that cross midnight", () => {
    expect(parseTimeRange("Evening (6 PM - 9 PM)")).toEqual([18, 21]);
    expect(parseTimeRange("Midnight (12 AM - 3 AM)")).toEqual([0, 3]);
    expect(parseTimeRange("Late Night (10 PM - 1 AM)")).toEqual([22, 1]);
    expect(parseTimeRange("Monsoon Season")).toBeNull();
    expect(inRange(23, [22, 1])).toBe(true);
    expect(inRange(2, [22, 1])).toBe(false);
  });

  it("suggests Yaman in the evening and Bhairav at dawn", () => {
    expect(raagsForHour(RAAG_LIST, 19).map(r => r.id)).toContain("yaman");
    expect(raagsForHour(RAAG_LIST, 5).map(r => r.id)).toContain("bhairav");
    expect(raagsForHour(RAAG_LIST, 19).map(r => r.id)).not.toContain("bhairav");
    expect(praharFor(7).name).toMatch(/1st prahar of the day/);
    expect(praharFor(19).name).toMatch(/1st prahar of the night/);
  });
});

describe("weak swaras", () => {
  it("finds swaras that are often off or unsteady, needs enough data, and skips Sa", () => {
    const h = [analysis([
      { symbol: "G", dev: -25, wob: 5, sec: 8 },  // flat
      { symbol: "N", dev: 3, wob: 18, sec: 6 },   // unsteady
      { symbol: "R", dev: 30, wob: 5, sec: 2 },   // not enough data
      { symbol: "S", dev: 20, wob: 20, sec: 20 }, // Sa excluded
      { symbol: "P", dev: 2, wob: 4, sec: 10 },   // fine
    ])];
    const w = weakSwaras(h);
    expect(w.map(x => x.symbol)).toEqual(["G", "N"]);
    expect(w[0].reason).toMatch(/25 cents flat/);
  });

  it("builds a palta around the weak swara from the raag's own neighbours", () => {
    expect(weakSwaraPalta(raag("yaman"), 4)!.map(n => n.label)).toEqual(["R", "G", "R", "G", "M", "G", "M", "G", "G", "G", "G", "G"]);
    expect(weakSwaraPalta(raag("bhupali"), 5)).toBeNull(); // Bhupali has no Ma
  });
});

describe("riyaz planner", () => {
  it("keeps the routine order and the total time, and says when there's no data", () => {
    const plan = buildPlan([], RAAG_LIST, 45, new Date(2026, 10, 16, 19));
    expect(plan.map(p => p.id)).toEqual(["aakar", "sa-sadhana", "kharaj", "paltas", "raag", "taans", "ear"]);
    expect(Math.abs(plan.reduce((s, p) => s + p.minutes, 0) - 45)).toBeLessThanOrEqual(3);
    expect(plan[1].reason).toMatch(/No Sa sadhana measured yet/);
    expect(plan[4].reason).toMatch(/Yaman/);
  });

  it("gives more Sa sadhana time after an unsteady hold, citing the real numbers", () => {
    const steady = buildPlan([{ kind: "sa-sadhana", id: "a", dateIso: "2026-11-16T10:00:00Z", saHz: 138.59, durationSec: 30, longestHoldSec: 20, totalOnSaSec: 25, medianOffsetCents: 2, wobbleCents: 3 }], RAAG_LIST, 60);
    const shaky = buildPlan([{ kind: "sa-sadhana", id: "b", dateIso: "2026-11-16T10:00:00Z", saHz: 138.59, durationSec: 30, longestHoldSec: 6, totalOnSaSec: 8, medianOffsetCents: 14, wobbleCents: 11.5 }], RAAG_LIST, 60);
    const mins = (p: ReturnType<typeof buildPlan>) => p.find(s => s.id === "sa-sadhana")!.minutes;
    expect(mins(shaky)).toBeGreaterThan(mins(steady));
    expect(shaky.find(s => s.id === "sa-sadhana")!.reason).toMatch(/held 6\.0 s, 14 cents sharp, wobble ±11\.5 cents/);
  });

  it("mentions weak swaras in the palta step", () => {
    const plan = buildPlan([analysis([{ symbol: "G", dev: -25, wob: 5, sec: 8 }])], RAAG_LIST, 45);
    expect(plan.find(s => s.id === "paltas")!.reason).toMatch(/Ga/);
  });
});

describe("ear training", () => {
  it("asks about the raag's own swaras, never Sa (the reference)", () => {
    const r = seq(7);
    expect(swaraChoices(raag("bhupali")).map(n => n.label)).toEqual(["S", "R", "G", "P", "D", "S'"]);
    for (let i = 0; i < 50; i++) {
      const q = swaraQuestion(raag("yaman"), r);
      expect(q.answer.semitones).not.toBe(0);
      expect(q.options.map(o => o.semitones)).toContain(q.answer.semitones);
    }
  });

  it("raag questions include the answer and prefer similar raags as wrong options", () => {
    const r = seq(11);
    for (let i = 0; i < 30; i++) {
      const q = raagQuestion(RAAG_LIST, RAAG_DETAILS, r);
      expect(q.optionIds).toContain(q.answerId);
      expect(new Set(q.optionIds).size).toBe(4);
      const similar = RAAG_DETAILS[q.answerId].similar.map(s => s.raagId).filter(x => x && RAAG_DETAILS[x]);
      for (const s of similar) expect(q.optionIds).toContain(s);
    }
  });
});
