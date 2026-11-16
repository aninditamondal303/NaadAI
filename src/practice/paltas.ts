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
  { id: "pairs", name: "Two-note groups", steps: [0, 1] },
  { id: "threes", name: "Three-note groups", steps: [0, 1, 2] },
  { id: "fours", name: "Four-note groups", steps: [0, 1, 2, 3] },
  { id: "skip", name: "Skipping (1-3)", steps: [0, 2] },
  { id: "turn", name: "Turn (1-2-1-2-3)", steps: [0, 1, 0, 1, 2] },
];

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
  return PATTERNS.map(p => {
    const notes = p.steps.length === 1 ? [...up, ...down.slice(1)] : [...apply(up, p.steps), ...apply(down, p.steps)];
    const preview = apply(up, p.steps).slice(0, p.steps.length * 2).map(n => n.label);
    return {
      id: p.id,
      name: p.name,
      description: p.steps.length === 1 ? `${raag.aroha.join(" ")} / ${raag.avaroha.join(" ")}` : `${preview.join(" ")} ...`,
      notes,
    };
  });
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
