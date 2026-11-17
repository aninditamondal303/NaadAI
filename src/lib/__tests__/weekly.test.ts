import { describe, expect, it } from "vitest";
import { weeklyReport } from "../weekly";
import type { PracticeRecord } from "../practiceHistory";

const now = new Date("2026-11-17T12:00:00");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const take = (d: number, pct: number, wob: number): PracticeRecord => ({
  kind: "analysis", id: `a${d}`, dateIso: daysAgo(d), raagId: "yaman", raagName: "Yaman", durationSec: 120, singingSec: 100, saHz: 130.8,
  heldWithin20CentsPct: pct, medianAbsDeviationCents: 8, lowest: null, highest: null,
  swaras: [{ symbol: "G", medianDeviationCents: 5, medianWobbleCents: wob, totalHeldSec: 10 }],
});

describe("weekly report", () => {
  it("compares the last seven days with the seven before", () => {
    const r = weeklyReport([take(10, 60, 20), take(2, 80, 10), { kind: "riyaz-timer", id: "t", dateIso: daysAgo(1), raagName: "Yaman", minutes: 30 }], now);
    expect(r.thisWeek.minutes).toBe(32);
    expect(r.thisWeek.days).toBe(2);
    expect(r.thisWeek.inTunePct).toBe(80);
    expect(r.lastWeek.inTunePct).toBe(60);
    expect(r.steadier).toEqual([{ symbol: "G", before: 20, after: 10, kind: "wobble" }]);
  });
  it("is empty without practice", () => {
    const r = weeklyReport([], now);
    expect(r.thisWeek.minutes).toBe(0);
    expect(r.steadier).toEqual([]);
  });
});
