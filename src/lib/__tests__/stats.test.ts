import { describe, expect, it } from "vitest";
import type { PracticeRecord } from "../practiceHistory";
import { minutesPerDay, practiceStreakDays } from "../stats";
import { sanitiseMeasurements } from "../../../server/feedback";

const timer = (iso: string, minutes = 10): PracticeRecord => ({ kind: "riyaz-timer", id: iso, dateIso: iso, raagName: "Yaman", minutes });

describe("practice streak", () => {
  const now = new Date(2026, 10, 16, 20, 0); // 16 Nov 2026, 8 pm local

  it("is 0 with no history", () => {
    expect(practiceStreakDays([], now)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const recs = [14, 15, 16].map(d => timer(new Date(2026, 10, d, 9).toISOString()));
    expect(practiceStreakDays(recs, now)).toBe(3);
  });

  it("still counts if the last practice was yesterday, and stops at a gap", () => {
    const recs = [12, 14, 15].map(d => timer(new Date(2026, 10, d, 9).toISOString()));
    expect(practiceStreakDays(recs, now)).toBe(2);
  });

  it("sums minutes per day", () => {
    const recs = [timer(new Date(2026, 10, 16, 9).toISOString(), 12), timer(new Date(2026, 10, 16, 18).toISOString(), 8)];
    const days = minutesPerDay(recs, 7, now);
    expect(days).toHaveLength(7);
    expect(days[6].minutes).toBe(20);
    expect(days[0].minutes).toBe(0);
  });
});

describe("feedback input checking", () => {
  const good = {
    raagName: "Yaman", saHz: 138.6, saSource: "profile", durationSec: 30, singingSec: 25, heldSec: 18,
    heldWithin20CentsPct: 80, medianAbsDeviationCents: 9.5, lowestNote: "N,", highestNote: "P",
    swaras: [{ swara: "G (Ga)", inRaag: true, timesHeld: 4, totalHeldSec: 5, longestHoldSec: 2, medianPositionCents: -12, wobbleCents: 6 }],
  };

  it("accepts valid measurements and keeps only known fields", () => {
    const m = sanitiseMeasurements({ ...good, extra: "ignore me" })!;
    expect(m).not.toBeNull();
    expect((m as any).extra).toBeUndefined();
    expect(m.swaras[0].medianPositionCents).toBe(-12);
  });

  it("rejects missing or out-of-range numbers", () => {
    expect(sanitiseMeasurements({ ...good, saHz: "lots" })).toBeNull();
    expect(sanitiseMeasurements({ ...good, swaras: [{ ...good.swaras[0], medianPositionCents: 400 }] })).toBeNull();
    expect(sanitiseMeasurements(null)).toBeNull();
  });
});
