/**
 * The characteristic phrases of a raag. Where the app has full notes
 * (raagDetails.ts) their pakad is used; otherwise the mukhya ang in
 * mukhyaAng.ts, phrases separated by "|".
 */
import { RAAG_DETAILS } from "./raagDetails";
import { angPhrases, MUKHYA_ANG } from "./mukhyaAng";

export function pakadFor(raagId: string): string | null {
  const d = RAAG_DETAILS[raagId]?.pakad;
  if (d) return d;
  const a = angPhrases(raagId);
  return a.length ? a.join(" | ") : null;
}

