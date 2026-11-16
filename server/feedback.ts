/**
 * Prompt and input checking for the optional written feedback.
 *
 * Rules (from the project's principles):
 * - The model only sees numbers that were really measured, and must not
 *   invent any other numbers or comment on things that weren't measured
 *   (rhythm, taal, tone, ornaments...).
 * - No quotes or opinions attributed to real musicians. Instead, the
 *   feedback is written through broad gharana-style "lenses": what a
 *   listener focused on a particular stylistic priority would notice.
 * - Strict about swaras outside the raag, gentle about personal style.
 */

export const FEEDBACK_SYSTEM_PROMPT = `You help a Hindustani classical vocalist reflect on one practice recording.
You receive ONLY measurements made by a pitch tracker. You did not hear the recording.

Rules you must follow:
1. Use only the numbers given. Never invent, estimate or round into new numbers. If you mention a number, it must appear in the data.
2. Only discuss what was measured: Sa, held notes, how close held swaras were to their positions, wobble, hold lengths, range, breath, swaras outside the raag's list (ruleFlags, with times) and measured oscillations (speed in Hz and width in cents). Report oscillations as measurements; do not say whether an ornament was good or bad. Do not comment on rhythm, taal, laya, tone, voice quality, emotion, lyrics, murki or taans: they were not measured.
3. Do not quote, imitate or name any real musician, living or dead.
4. "Median position" is measured from equal-tempered positions. Traditional intonation differs a little for some swaras (for example Ga and Ni are often slightly lower, komal Re in Bhairav-family raags is often lower), so treat differences under about 15 cents as normal variation, not errors.
5. Be strict only about raag grammar: a swara marked inRaag=false that was held for a noticeable time deserves a clear mention. Be gentle about personal style.
6. If there is very little data (for example less than 10 seconds of held notes), say the numbers are only a rough indication.

Write plain text (no markdown symbols like *, # or |), under 250 words, in this order:
- One or two sentences summarising what the numbers show.
- "Kirana-style lens:" steadiness and length of sustained swaras (wobble, longest holds), and Sa.
- "Gwalior-style lens:" clarity of each swara's placement (median position, share within ±20 cents).
- "Jaipur-Atrauli-style lens:" raag grammar and the placement of swaras relative to each other (swaras outside the raag, which swaras sit sharp or flat).
- "Practice suggestion:" two short exercises in sargam (S R G m M P D N, komal r g d n, mandra with a comma like N, and taar with an apostrophe like S'), aimed at the weakest measured swaras.
Speak to the singer as "you". Say clearly that these are observations from a pitch tracker, not a guru's judgement.`;

export interface FeedbackSwara {
  swara: string;
  inRaag: boolean | null;
  timesHeld: number;
  totalHeldSec: number;
  longestHoldSec: number;
  medianPositionCents: number;
  wobbleCents: number;
}

export interface FeedbackFlag { atSec: number; swara: string; heldSec: number }
export interface FeedbackOscillation { atSec: number; around: string; rateHz: number; widthCents: number }

export interface FeedbackMeasurements {
  raagName: string;
  saHz: number;
  saSource: "profile" | "detected";
  durationSec: number;
  singingSec: number;
  heldSec: number;
  heldWithin20CentsPct: number | null;
  medianAbsDeviationCents: number | null;
  lowestNote: string | null;
  highestNote: string | null;
  longestPhraseSec: number | null;
  medianPhraseSec: number | null;
  swaras: FeedbackSwara[];
  ruleFlags: FeedbackFlag[];
  oscillations: FeedbackOscillation[];
}

const num = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, max).replace(/[\r\n]/g, " ") : null;

/** Rebuild the measurements from known fields only, rejecting anything malformed. */
export function sanitiseMeasurements(raw: any): FeedbackMeasurements | null {
  if (!raw || typeof raw !== "object") return null;
  const raagName = str(raw.raagName, 60);
  const saHz = num(raw.saHz, 40, 1000);
  const durationSec = num(raw.durationSec, 0, 3600);
  const singingSec = num(raw.singingSec, 0, 3600);
  const heldSec = num(raw.heldSec, 0, 3600);
  if (!raagName || saHz === null || durationSec === null || singingSec === null || heldSec === null) return null;
  if (!Array.isArray(raw.swaras) || raw.swaras.length > 12) return null;

  const swaras: FeedbackSwara[] = [];
  for (const s of raw.swaras) {
    const swara = str(s?.swara, 30);
    const timesHeld = num(s?.timesHeld, 0, 100000);
    const totalHeldSec = num(s?.totalHeldSec, 0, 3600);
    const longestHoldSec = num(s?.longestHoldSec, 0, 3600);
    const medianPositionCents = num(s?.medianPositionCents, -50, 50);
    const wobbleCents = num(s?.wobbleCents, 0, 100);
    if (!swara || timesHeld === null || totalHeldSec === null || longestHoldSec === null || medianPositionCents === null || wobbleCents === null) return null;
    swaras.push({
      swara,
      inRaag: typeof s.inRaag === "boolean" ? s.inRaag : null,
      timesHeld, totalHeldSec, longestHoldSec, medianPositionCents, wobbleCents,
    });
  }

  const ruleFlags: FeedbackFlag[] = [];
  for (const f of Array.isArray(raw.ruleFlags) ? raw.ruleFlags.slice(0, 50) : []) {
    const atSec = num(f?.atSec, 0, 3600), heldSec = num(f?.heldSec, 0, 3600), swara = str(f?.swara, 30);
    if (atSec === null || heldSec === null || !swara) return null;
    ruleFlags.push({ atSec, swara, heldSec });
  }
  const oscillations: FeedbackOscillation[] = [];
  for (const o of Array.isArray(raw.oscillations) ? raw.oscillations.slice(0, 50) : []) {
    const atSec = num(o?.atSec, 0, 3600), rateHz = num(o?.rateHz, 0, 20), widthCents = num(o?.widthCents, 0, 1200), around = str(o?.around, 8);
    if (atSec === null || rateHz === null || widthCents === null || !around) return null;
    oscillations.push({ atSec, around, rateHz, widthCents });
  }

  return {
    ruleFlags,
    oscillations,
    raagName,
    saHz,
    saSource: raw.saSource === "detected" ? "detected" : "profile",
    durationSec,
    singingSec,
    heldSec,
    heldWithin20CentsPct: num(raw.heldWithin20CentsPct, 0, 100),
    medianAbsDeviationCents: num(raw.medianAbsDeviationCents, 0, 100),
    longestPhraseSec: num(raw.longestPhraseSec, 0, 3600),
    medianPhraseSec: num(raw.medianPhraseSec, 0, 3600),
    lowestNote: str(raw.lowestNote, 8),
    highestNote: str(raw.highestNote, 8),
    swaras,
  };
}

export function buildFeedbackPrompt(m: FeedbackMeasurements): string {
  return `Raag chosen by the singer: ${m.raagName}

Measurements (JSON). These are the only facts you have:
${JSON.stringify(m, null, 2)}

Field meanings:
- saHz: the Sa the recording was measured against (${m.saSource === "profile" ? "the singer's own Sa" : "detected from the recording"}).
- durationSec / singingSec: recording length and time with a clear pitch.
- heldSec: time on held notes (one swara for at least 0.25 s).
- heldWithin20CentsPct: share of held-note time within 20 cents of the swara position.
- medianAbsDeviationCents: typical distance of held notes from the swara position.
- lowestNote / highestNote: range of held notes (comma = mandra, apostrophe = taar).
- longestPhraseSec / medianPhraseSec: phrase lengths between breaths (a silence of 0.3 s or more).
- swaras[].medianPositionCents: + means sharp, - means flat, relative to the equal-tempered position.
- swaras[].wobbleCents: how much held notes on that swara moved around their own centre.
- swaras[].inRaag: false means the swara is not in this app's list for the raag.
- ruleFlags: swaras outside the raag held for 0.4 s or more, with the time (s) they started.
- oscillations: regular swings in pitch (andolan, gamak or vibrato-like): speed in swings per second and width in ± cents.`;
}
