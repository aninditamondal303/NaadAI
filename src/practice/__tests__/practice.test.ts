import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../../data/allRaags";
import { RAAG_DETAILS } from "../../data/raagDetails";
import { glide, steady, synthVoice } from "../../../eval/synth";
import { notesOnly, parseNote, parseSargam } from "../notation";
import { generatePaltas } from "../paltas";
import { expectedHz, noteSlots, scoreNote, totalScore } from "../scoring";

const raag = (id: string) => RAAG_LIST.find(r => r.id === id)!;
const SR = 44100;

describe("sargam notation", () => {
  it("parses octaves and breaks", () => {
    expect(parseNote("N,").semitones).toBe(-1);
    expect(parseNote("S'").semitones).toBe(12);
    expect(parseNote("M").semitones).toBe(6);
    expect(parseNote("d,,").semitones).toBe(8 - 24);
    const t = parseSargam("N, R G R | P R");
    expect(t.map(x => (x.kind === "note" ? x.label : "|"))).toEqual(["N,", "R", "G", "R", "|", "P", "R"]);
  });

  it("parses every pakad and chalan in the library", () => {
    for (const d of Object.values(RAAG_DETAILS)) {
      expect(() => parseSargam(d.pakad)).not.toThrow();
      for (const c of d.chalan) expect(() => parseSargam(c)).not.toThrow();
    }
  });
});

describe("palta generation", () => {
  it("uses the raag's own swaras (Yaman: tivra Ma, no shuddha Ma)", () => {
    for (const p of generatePaltas(raag("yaman"))) {
      const semis = new Set(p.notes.map(n => ((n.semitones % 12) + 12) % 12));
      expect(semis.has(5)).toBe(false);
      for (const s of semis) expect(raag("yaman").allowedSwaras).toContain(s);
    }
  });

  it("Bhupali paltas never use Ma or Ni; Bhairav uses komal Re and Dha", () => {
    for (const p of generatePaltas(raag("bhupali"))) {
      for (const n of p.notes) expect([5, 6, 10, 11]).not.toContain(((n.semitones % 12) + 12) % 12);
    }
    const bhairav = generatePaltas(raag("bhairav"))[0].notes.map(n => n.label);
    expect(bhairav).toContain("r");
    expect(bhairav).toContain("d");
  });

  it("builds three-note groups up the aroh and down the avaroh", () => {
    const threes = generatePaltas(raag("bhupali")).find(p => p.id === "threes")!;
    expect(threes.notes.slice(0, 6).map(n => n.label)).toEqual(["S", "R", "G", "R", "G", "P"]);
    expect(threes.notes.slice(-3).map(n => n.label)).toEqual(["G", "R", "S"]);
  });
});

describe("note scoring", () => {
  const sa = 138.59;
  const note = parseNote("G");
  const target = expectedHz(note, sa);

  it("in tune and on time is green", () => {
    const clip = synthVoice("g", [{ durSec: 0.5, f0: steady(target) }], { sampleRate: SR, jitterCents: 0 });
    const s = scoreNote(clip.samples, SR, target);
    expect(s.grade).toBe("green");
    expect(Math.abs(s.deviationCents!)).toBeLessThan(3);
  });

  it("35 cents sharp is yellow, 80 cents off is red", () => {
    const sharp = synthVoice("g", [{ durSec: 0.5, f0: steady(target * Math.pow(2, 35 / 1200)) }], { sampleRate: SR, jitterCents: 0 });
    expect(scoreNote(sharp.samples, SR, target).grade).toBe("yellow");
    const off = synthVoice("g", [{ durSec: 0.5, f0: steady(target * Math.pow(2, 80 / 1200)) }], { sampleRate: SR, jitterCents: 0 });
    expect(scoreNote(off.samples, SR, target).grade).toBe("red");
  });

  it("silence is red; arriving late is downgraded to yellow", () => {
    expect(scoreNote(new Float32Array(SR / 2), SR, target).grade).toBe("red");
    const late = synthVoice("late", [
      { durSec: 0.3, f0: steady(target * Math.pow(2, -200 / 1200)) }, // still on Re for 60% of the slot
      { durSec: 0.2, f0: steady(target) },
    ], { sampleRate: SR, jitterCents: 0 });
    const s = scoreNote(late.samples, SR, target);
    expect(s.arrivalFraction!).toBeGreaterThan(0.4);
    expect(s.grade).not.toBe("green");
  });

  it("a quick meend into the note still counts as on time", () => {
    const clip = synthVoice("meend", [
      { durSec: 0.08, f0: glide(target * Math.pow(2, -100 / 1200), target, 0.08) },
      { durSec: 0.42, f0: steady(target) },
    ], { sampleRate: SR, jitterCents: 0 });
    expect(scoreNote(clip.samples, SR, target).grade).toBe("green");
  });

  it("scores and slots add up", () => {
    expect(totalScore([{ grade: "green", deviationCents: 0, arrivalFraction: 0 }, { grade: "yellow", deviationCents: 30, arrivalFraction: 0 }])).toBe(75);
    const slots = noteSlots(4, 60, 2);
    expect(slots[3]).toEqual({ start: 1.5, end: 2 });
    expect(notesOnly(parseSargam("S | R")).length).toBe(2);
  });
});

describe("basic paltas on shuddha swaras", () => {
  it("covers the standard alankars", async () => {
    const { SHUDDHA_SWARAS } = await import("../paltas");
    const ps = generatePaltas(SHUDDHA_SWARAS);
    const byId = (id: string) => ps.find(p => p.id === id)!.notes.map(n => n.label);
    expect(byId("doubled").slice(0, 4)).toEqual(["S", "S", "R", "R"]);
    expect(byId("threes").slice(0, 6)).toEqual(["S", "R", "G", "R", "G", "M"]);
    expect(byId("one-three-two").slice(0, 3)).toEqual(["S", "G", "R"]);
    expect(byId("sa-leaps").slice(0, 6)).toEqual(["S", "R", "S", "S", "G", "S"]);
    // descending half mirrors the pattern from taar Sa
    const threes = byId("threes");
    expect(threes.slice(threes.length / 2, threes.length / 2 + 3)).toEqual(["S'", "N", "D"]);
  });

  it("leaps from Sa in Yaman use tivra Ma and skip nothing of the aroh", () => {
    const yaman = generatePaltas(raag("yaman")).find(p => p.id === "sa-leaps")!.notes.map(n => n.label);
    expect(yaman.slice(0, 6)).toEqual(["S", "R", "S", "S", "G", "S"]);
    expect(yaman).toContain("M");
  });
});
