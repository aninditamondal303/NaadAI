/**
 * Sargam notation <-> semitones.
 *
 *   S r R g G m M P d D n N   (lowercase r g d n = komal, m = shuddha Ma, M = tivra Ma)
 *   N,  = mandra Ni (one comma per octave down)
 *   S'  = taar Sa (one apostrophe per octave up)
 *   |   = break between phrases (a rest)
 */

const INDEX: Record<string, number> = { S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6, P: 7, d: 8, D: 9, n: 10, N: 11 };

export interface SargamNote {
  kind: "note";
  /** Semitones above madhya Sa (negative = mandra). */
  semitones: number;
  /** As written, e.g. "N," or "S'". */
  label: string;
}
export interface SargamBreak { kind: "break" }
export type SargamToken = SargamNote | SargamBreak;

export function parseNote(token: string): SargamNote {
  const m = /^([SrRgGmMPdDnN])([,']*)$/.exec(token);
  if (!m) throw new Error(`Not a sargam note: "${token}"`);
  const down = (m[2].match(/,/g) || []).length;
  const up = (m[2].match(/'/g) || []).length;
  return { kind: "note", semitones: INDEX[m[1]] + 12 * (up - down), label: token };
}

/** Parse a phrase such as "N, R G R | P R | N, R S". */
export function parseSargam(text: string): SargamToken[] {
  return text.trim().split(/\s+/).filter(Boolean).map(t => (t === "|" ? { kind: "break" } : parseNote(t)));
}

export function notesOnly(tokens: SargamToken[]): SargamNote[] {
  return tokens.filter((t): t is SargamNote => t.kind === "note");
}
