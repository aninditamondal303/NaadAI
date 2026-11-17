import { describe, expect, it } from "vitest";
import { analyseRecording } from "../analyseRecording";
import { centsBetween } from "../music";
import { steady, synthVoice } from "../../../eval/synth";

const SR = 44100;
const YAMAN = [0, 2, 4, 6, 7, 9, 11];
const phrase = (sa: number) => synthVoice("p", [
  { durSec: 0.2, f0: null }, { durSec: 2, f0: steady(sa) }, { durSec: 0.1, f0: null },
  { durSec: 1, f0: steady(sa * 2 ** (4 / 12)) }, { durSec: 0.1, f0: null },
  { durSec: 1.5, f0: steady(sa * 2 ** (7 / 12)) }, { durSec: 0.1, f0: null },
  { durSec: 1, f0: steady(sa * 2 ** (2 / 12)) }, { durSec: 0.1, f0: null },
  { durSec: 2, f0: steady(sa) }, { durSec: 0.2, f0: null },
], { sampleRate: SR });

describe("analyseRecording", () => {
  it("warns when the recording seems to use a different Sa from the profile", () => {
    const r = analyseRecording({ samples: phrase(146.83).samples, sampleRate: SR, saHz: 130.81, saChoice: "mine", allowedSwaras: YAMAN });
    expect(r.m.saHz).toBe(130.81);
    expect(r.notes.join(" ")).toMatch(/different Sa/);
  });

  it("uses the detected Sa when asked and confident", () => {
    const r = analyseRecording({ samples: phrase(146.83).samples, sampleRate: SR, saHz: 130.81, saChoice: "detect", allowedSwaras: YAMAN });
    expect(Math.abs(centsBetween(r.m.saHz, 146.83))).toBeLessThan(10);
    expect(r.notes.join(" ")).toMatch(/Sa detected/);
  });

  it("falls back to the profile Sa with a note when detection isn't possible", () => {
    const r = analyseRecording({ samples: new Float32Array(SR * 2), sampleRate: SR, saHz: 130.81, saChoice: "detect", allowedSwaras: YAMAN });
    expect(r.m.saHz).toBe(130.81);
    expect(r.notes.join(" ")).toMatch(/Couldn't detect Sa/);
    expect(r.notes.join(" ")).toMatch(/Very little clear singing/);
  });
});
