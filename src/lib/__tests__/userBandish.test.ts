import { describe, expect, it } from "vitest";
import { checkBlock, checkWords } from "../userBandish";

describe("entering a bandish", () => {
  it("accepts a correct teentaal line", () => {
    expect(checkBlock("G R G - P G R S D, S R G R - S -", 16).errors).toEqual([]);
  });
  it("reports a wrong matra count", () => {
    expect(checkBlock("S R G", 16).errors[0]).toMatch(/3 matras/);
  });
  it("reports words that don't fit", () => {
    expect(checkWords("a b c", 16, 1).errors[0]).toMatch(/3 syllables/);
  });
});
