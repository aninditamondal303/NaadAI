/**
 * Side-by-side facts for two raags, and the differences that can be read
 * straight from the library's data (swaras, vadi/samvadi, thaat, time,
 * aroh/avaroh). Written notes on how close raags differ come from
 * raagDetails.ts where they exist.
 */
import type { ComprehensiveRaag } from "./allRaags";
import { RAAG_DETAILS } from "./raagDetails";

export const SWARA_NAMES = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];
export const SWARA_SYMBOLS = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];

/** Close pairs that students commonly confuse, all present in the library. */
export const CLOSE_PAIRS: [string, string][] = [
  ["yaman", "shuddhakalyan"],
  ["bhupali", "shuddhakalyan"],
  ["marwa", "puriya"],
  ["puriya_dhanashree", "poorvi"],
  ["bhairav", "kalingada"],
  ["bhimpalasi", "dhanashree"],
  ["bageshree", "rageshree"],
  ["darbari", "adana"],
  ["asavari", "jaunpuri"],
  ["todi", "multani"],
  ["bilaskhanitodi", "bhairavi"],
  ["khamaj", "jinjhoti"],
];

export interface RaagComparison {
  shared: number[];
  onlyA: number[];
  onlyB: number[];
  sameSwaras: boolean;
  sameThaat: boolean;
  sameVadi: boolean;
  sameSamvadi: boolean;
  sameTime: boolean;
  sameAroh: boolean;
  sameAvaroh: boolean;
  /** Written notes from the raag library on how these two differ. */
  notes: string[];
}

const timeOf = (r: ComprehensiveRaag) => r.time.replace(/\s*\(.*\)/, "").trim().toLowerCase();

export function compareRaags(a: ComprehensiveRaag, b: ComprehensiveRaag): RaagComparison {
  const A = new Set(a.allowedSwaras), B = new Set(b.allowedSwaras);
  const all = [...new Set([...a.allowedSwaras, ...b.allowedSwaras])].sort((x, y) => x - y);
  const shared = all.filter(s => A.has(s) && B.has(s));
  const onlyA = all.filter(s => A.has(s) && !B.has(s));
  const onlyB = all.filter(s => B.has(s) && !A.has(s));
  const notes: string[] = [];
  for (const [x, y] of [[a, b], [b, a]] as const) {
    for (const s of RAAG_DETAILS[x.id]?.similar ?? []) {
      if (s.raagId === y.id && !notes.includes(s.difference)) notes.push(s.difference);
    }
  }
  return {
    shared, onlyA, onlyB,
    sameSwaras: onlyA.length === 0 && onlyB.length === 0,
    sameThaat: a.thaat === b.thaat,
    sameVadi: a.vadi === b.vadi,
    sameSamvadi: a.samvadi === b.samvadi,
    sameTime: timeOf(a) === timeOf(b),
    sameAroh: a.aroha.join(" ") === b.aroha.join(" "),
    sameAvaroh: a.avaroha.join(" ") === b.avaroha.join(" "),
    notes,
  };
}

/** One-line summary of what separates the two, from the data alone. */
export function differenceSummary(a: ComprehensiveRaag, b: ComprehensiveRaag, c: RaagComparison): string[] {
  const n = (r: ComprehensiveRaag) => r.name.replace(/^Raag\s+/i, "").replace(/\s*\(.*\)/, "");
  const list = (xs: number[]) => xs.map(s => SWARA_NAMES[s]).join(", ");
  const out: string[] = [];
  if (c.sameSwaras) out.push(`Both use the same swaras, so the difference lies in movement (chalan), emphasis and resting notes.`);
  else {
    if (c.onlyA.length) out.push(`${n(a)} uses ${list(c.onlyA)}, which ${n(b)} does not.`);
    if (c.onlyB.length) out.push(`${n(b)} uses ${list(c.onlyB)}, which ${n(a)} does not.`);
  }
  if (a.vadiGiven !== false && b.vadiGiven !== false && (!c.sameVadi || !c.sameSamvadi)) out.push(`Vadi and samvadi: ${n(a)} ${SWARA_NAMES[a.vadi]} and ${SWARA_NAMES[a.samvadi]}; ${n(b)} ${SWARA_NAMES[b.vadi]} and ${SWARA_NAMES[b.samvadi]}.`);
  if (!c.sameAroh || !c.sameAvaroh) out.push(`Their aroh and avaroh differ; compare the lines below.`);
  if (!c.sameTime) out.push(`They belong to different times: ${n(a)} ${timeOf(a)}, ${n(b)} ${timeOf(b)}.`);
  return out;
}
