import { describe, expect, it } from "vitest";
import { decodeTake, encodeTake, type SharedTake } from "../shareTake";

const sample: SharedTake = {
  v: 1, raag: "Yaman", allowed: [0, 2, 4, 6, 7, 9, 11], date: "2026-11-17", saHz: 130.81, durationSec: 19.1,
  heldWithin20: 74, medianDev: 9.5, longestPhrase: 6.2, outside: 1,
  swaras: [[0, 3.1, 2, 4], [4, 2.2, -12, 9]], step: 0.1, contour: [0, 2, null, 400, 398, 702],
};

describe("share a take", () => {
  it("round-trips through the link code", async () => {
    const code = await encodeTake(sample);
    expect(code).toMatch(/^[zj][A-Za-z0-9_-]+$/);
    expect(await decodeTake(code)).toEqual(sample);
  });
  it("rejects something that isn't a take", async () => {
    await expect(decodeTake("j" + btoa(JSON.stringify({ v: 9 })))).rejects.toThrow();
  });
});
