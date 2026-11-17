import { describe, expect, it } from "vitest";
import { scoreMatch } from "../SurMilao";

describe("sur milao scoring", () => {
  it("counts singing in another octave as the same swara", () => {
    const sung = Array.from({ length: 51 }, (_, i) => 700 - 1200 + (i % 2 ? 5 : -5));
    expect(scoreMatch(sung, 700)).toEqual({ within20Pct: 100, medianCents: -5 });
  });
  it("needs enough clear singing", () => {
    expect(scoreMatch([null, null, 700], 700).within20Pct).toBeNull();
  });
  it("reports flat singing", () => {
    const sung = Array.from({ length: 40 }, () => 370);
    expect(scoreMatch(sung, 400)).toEqual({ within20Pct: 0, medianCents: -30 });
  });
});
