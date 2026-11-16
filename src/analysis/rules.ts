/**
 * Raag rule checker: flags swaras that are not in the raag and were clearly
 * held. Very short touches (passing notes, kan, quick ornaments) are
 * ignored, because they are allowed; only holds of at least
 * MIN_FLAG_SEC are flagged.
 */
import { noteLabel, SWARA_NAMES, type HeldNote } from "./summary";

export const MIN_FLAG_SEC = 0.4;

export interface RuleFlag {
  atSec: number;
  durSec: number;
  label: string;
  name: string;
  deviationCents: number;
}

export function checkRaagRules(held: HeldNote[], allowedSwaras: number[], minSec = MIN_FLAG_SEC): RuleFlag[] {
  const allowed = new Set(allowedSwaras);
  return held
    .filter(n => !allowed.has(n.swara) && n.durSec >= minSec)
    .map(n => ({
      atSec: n.startSec,
      durSec: n.durSec,
      label: noteLabel(n.swara, n.octave),
      name: SWARA_NAMES[n.swara],
      deviationCents: n.deviationCents,
    }));
}

/** "1:05" style timestamp. */
export function mmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
