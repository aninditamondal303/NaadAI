/**
 * The characteristic phrases of a raag. Where the app has full notes
 * (raagDetails.ts) their pakad is used; otherwise the mukhya ang listed on
 * tanarang.com (see mukhyaAng.ts), phrases separated by "|".
 */
import { RAAG_DETAILS } from "./raagDetails";
import { angPhrases, MUKHYA_ANG } from "./mukhyaAng";

export function pakadFor(raagId: string): string | null {
  const d = RAAG_DETAILS[raagId]?.pakad;
  if (d) return d;
  const a = angPhrases(raagId);
  return a.length ? a.join(" | ") : null;
}

/** Where the phrases shown for a raag come from, for the Library. */
export function pakadSource(raagId: string): { label: string; url?: string } {
  if (RAAG_DETAILS[raagId]) return { label: "Raag notes in this app, awaiting a guru's review" };
  const e = MUKHYA_ANG[raagId];
  if (e?.source === "tanarang") return { label: "Mukhya ang as given by tanarang.com", url: e.url };
  return { label: "Raag notes in this app, awaiting a guru's review" };
}
