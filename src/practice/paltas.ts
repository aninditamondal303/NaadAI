/**
 * Palta (alankar) generation from a raag's aroh and avaroh.
 *
 * A palta applies a pattern to the raag's ladder of swaras: ascending on the
 * aroh, then the mirror pattern descending on the avaroh. Because it uses the
 * raag's own aroh/avaroh, varjit swaras are skipped automatically (Yaman gets
 * tivra Ma, Bhairav komal Re and Dha, Bhupali no Ma or Ni, and so on).
 */
import type { ComprehensiveRaag } from "../data/allRaags";
import { parseNote, type SargamNote } from "./notation";

export interface Palta {
  id: string;
  name: string;
  /** How the pattern reads on Sa, e.g. "S R G, R G M, ..." */
  description: string;
  notes: SargamNote[];
}

/** Patterns as steps along the ladder; each group starts one step higher (or lower on the way down). */
const PATTERNS: { id: string; name: string; steps: number[] }[] = [
  { id: "aroh-avaroh", name: "Aroh–avaroh", steps: [0] },
  { id: "doubled", name: "Each swara twice (S S, R R)", steps: [0, 0] },
  { id: "pairs", name: "Two-note groups", steps: [0, 1] },
  { id: "threes", name: "Three-note groups", steps: [0, 1, 2] },
  { id: "fours", name: "Four-note groups", steps: [0, 1, 2, 3] },
  { id: "fives", name: "Five-note groups", steps: [0, 1, 2, 3, 4] },
  { id: "skip", name: "Skipping (1-3)", steps: [0, 2] },
  { id: "back-and-on", name: "Step back (1-2-1)", steps: [0, 1, 0] },
  { id: "one-three-two", name: "Zigzag (1-3-2)", steps: [0, 2, 1] },
  { id: "up-and-back", name: "Up and back (1-2-3-2-1)", steps: [0, 1, 2, 1, 0] },
  { id: "turn", name: "Turn (1-2-1-2-3)", steps: [0, 1, 0, 1, 2] },
];

/**
 * Not a raag: the seven shuddha swaras (Bilawal thaat), for the basic
 * alankars every student starts with.
 */
export const SHUDDHA_SWARAS: ComprehensiveRaag = {
  id: "shuddha",
  name: "Shuddha swaras (basic paltas)",
  thaat: "Bilawal",
  allowedSwaras: [0, 2, 4, 5, 7, 9, 11],
  aroha: ["S", "R", "G", "M", "P", "D", "N", "S'"],
  avaroha: ["S'", "N", "D", "P", "M", "G", "R", "S"],
  vadi: 0,
  samvadi: 7,
  time: "Any time",
  mood: "Practice",
  jati: "Sampurna-Sampurna",
  description: "The seven shuddha swaras, for basic alankars.",
};

/** The aroh as a ladder from Sa up to taar Sa (any notes below Sa in the written aroh are kept). */
function ladder(seq: string[]): SargamNote[] {
  return seq.map(parseNote);
}

function apply(lad: SargamNote[], steps: number[]): SargamNote[] {
  const span = Math.max(...steps);
  const out: SargamNote[] = [];
  for (let i = 0; i + span < lad.length; i++) for (const s of steps) out.push(lad[i + s]);
  return out;
}

export function generatePaltas(raag: ComprehensiveRaag): Palta[] {
  const up = ladder(raag.aroha);
  const down = ladder(raag.avaroha);
  // Leaps from Sa to each swara of the aroh and back (S R S, S G S, ...), then down from taar Sa
  const sa = parseNote("S");
  const taar = parseNote("S'");
  const fromSa: SargamNote[] = [];
  for (const n of up) if (n.semitones > 0 && n.semitones < 12) fromSa.push(sa, n, sa);
  for (const n of down) if (n.semitones > 0 && n.semitones < 12) fromSa.push(taar, n, taar);
  const leaps: Palta = {
    id: "sa-leaps",
    name: "Leaps from Sa (S R S, S G S)",
    description: fromSa.slice(0, 6).map(n => n.label).join(" ") + " ...",
    notes: fromSa,
  };
  return [...PATTERNS.map(p => {
    const notes = p.steps.length === 1 ? [...up, ...down.slice(1)] : [...apply(up, p.steps), ...apply(down, p.steps)];
    const preview = apply(up, p.steps).slice(0, p.steps.length * 2).map(n => n.label);
    return {
      id: p.id,
      name: p.name,
      description: p.steps.length === 1 ? `${raag.aroha.join(" ")} / ${raag.avaroha.join(" ")}` : `${preview.join(" ")} ...`,
      notes,
    };
  }), leaps];
}

/** Laya ladder: notes per beat at each speed. */
export const LAYAS = [
  { speed: 1, name: "Thah" },
  { speed: 2, name: "Dugun" },
  { speed: 3, name: "Tigun" },
  { speed: 4, name: "Chaugun" },
] as const;

/** Score needed (0–100) at one speed to unlock the next. */
export const UNLOCK_SCORE = 85;
