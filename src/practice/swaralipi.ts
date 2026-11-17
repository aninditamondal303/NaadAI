/**
 * Swaralipi (notation) helpers for compositions and alaap: parsing lines,
 * checking them against a raag, and turning them into timed notes to play.
 */
import { parseNote, type SargamNote } from "./notation";

export type Matra =
  | { kind: "notes"; notes: SargamNote[] }
  | { kind: "hold" }
  | { kind: "empty" };

export function parseLine(line: string): Matra[] {
  return line.trim().split(/\s+/).map(tok => {
    if (tok === "-") return { kind: "hold" as const };
    if (tok === "_") return { kind: "empty" as const };
    return { kind: "notes" as const, notes: tok.split(".").map(parseNote) };
  });
}

export interface TimedNote { semitones: number; start: number; dur: number; matra: number }

/**
 * Timed notes for lines played one after another, `secPerMatra` each.
 * A "-" lengthens the previous note; "_" is silence.
 */
export function timeLines(lines: string[], secPerMatra: number): { notes: TimedNote[]; matras: number } {
  const out: TimedNote[] = [];
  let m = 0;
  for (const line of lines) {
    for (const mt of parseLine(line)) {
      const t0 = m * secPerMatra;
      if (mt.kind === "notes") {
        const d = secPerMatra / mt.notes.length;
        mt.notes.forEach((n, i) => out.push({ semitones: n.semitones, start: t0 + i * d, dur: d, matra: m }));
      } else if (mt.kind === "hold" && out.length && out[out.length - 1].start + out[out.length - 1].dur >= t0 - 1e-9) {
        out[out.length - 1].dur += secPerMatra;
      }
      m++;
    }
  }
  return { notes: out, matras: m };
}

/** Alaap phrases: free rhythm, each swara `sec` long, "-" lengthens, a pause between phrases. */
export function timePhrases(phrases: string[], sec = 0.7, gap = 0.9): TimedNote[] {
  const out: TimedNote[] = [];
  let t = 0;
  phrases.forEach((ph, pi) => {
    for (const tok of ph.trim().split(/\s+/)) {
      if (tok === "-") { if (out.length) out[out.length - 1].dur += sec; t += sec; continue; }
      out.push({ semitones: parseNote(tok).semitones, start: t, dur: sec, matra: pi });
      t += sec;
    }
    t += gap;
  });
  return out;
}

/** Notes in a line or phrase that are not swaras of the raag. */
export function outsideRaag(text: string, allowed: number[]): string[] {
  const bad: string[] = [];
  for (const tok of text.trim().split(/[\s.]+/)) {
    if (tok === "-" || tok === "_" || tok === "|" || !tok) continue;
    const s = ((parseNote(tok).semitones % 12) + 12) % 12;
    if (!allowed.includes(s)) bad.push(tok);
  }
  return bad;
}
