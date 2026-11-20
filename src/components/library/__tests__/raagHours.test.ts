import { describe, expect, it } from "vitest";
import { hoursUntil } from "../RaagHours";

const at = (h: number, m = 0) => new Date(2026, 10, 20, h, m);

describe("hours until a raag's time", () => {
  it("is 0 inside the range", () => {
    expect(hoursUntil([18, 21], at(19, 30))).toBe(0);
  });
  it("counts forward to the start, rounding up", () => {
    expect(hoursUntil([18, 21], at(9, 30))).toBe(9);
  });
  it("handles ranges that cross midnight", () => {
    expect(hoursUntil([21, 0], at(23))).toBe(0);
    expect(hoursUntil([21, 0], at(1))).toBe(20);
  });
});
