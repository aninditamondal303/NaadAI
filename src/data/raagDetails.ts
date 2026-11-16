/**
 * Detailed raag grammar: pakad, chalan, nyas swaras, similar raags and how
 * they differ, and common practice mistakes.
 *
 * Only raags whose details we could write with confidence are included.
 * Everything here follows the commonly taught (Bhatkhande-tradition)
 * descriptions, but phrasing differs between gharanas and books, so every
 * entry stays marked "pending review" until a guru has checked it.
 * `npm run raag:review` prints a checklist for that review.
 *
 * Notation: S r R g G m M P d D n N (lowercase r g d n = komal, m = shuddha
 * Ma, M = tivra Ma), "," = mandra (N,), "'" = taar (S').
 */

export interface SimilarRaag {
  /** id in allRaags.ts when the raag is in the library, otherwise null */
  raagId: string | null;
  name: string;
  difference: string;
}

export interface RaagDetails {
  pakad: string;
  chalan: string[];
  /** Swaras commonly used as resting notes (nyas). */
  nyas: string[];
  /** Ornament or intonation notes that define the raag, if any. */
  specialNotes?: string;
  similar: SimilarRaag[];
  commonMistakes: string[];
  review: { status: "pending" | "reviewed"; reviewer?: string; date?: string; notes?: string };
}

const pending = { status: "pending" as const };

export const RAAG_DETAILS: Record<string, RaagDetails> = {
  yaman: {
    pakad: "N, R G R, P R, N, R S",
    chalan: ["N, R G, R G M P", "M D N S'", "S' N D P, M G R S", "P R, N, R S"],
    nyas: ["G", "P", "N"],
    specialNotes: "Uses tivra Ma. The aroh usually starts from mandra Ni (N, R G) rather than from Sa.",
    similar: [
      {
        raagId: "shuddhakalyan", name: "Shuddha Kalyan",
        difference: "Shuddha Kalyan ascends like Bhupali (S R G P D S'), leaving out Ma and Ni, and uses them only lightly in descent. Yaman uses tivra Ma and Ni freely in both directions.",
      },
    ],
    commonMistakes: [
      "Touching shuddha Ma instead of tivra Ma (shuddha Ma belongs to Yaman Kalyan, not Yaman).",
      "Starting the ascent from Sa with S R G instead of the characteristic N, R G.",
    ],
    review: pending,
  },
  bhupali: {
    pakad: "G R S D, S R G, P G, D P G R S",
    chalan: ["S R G, P G, D P G R S", "G P D S'", "S' D P G R S"],
    nyas: ["G", "P", "S"],
    specialNotes: "Pentatonic: Ma and Ni are omitted (varjit).",
    similar: [
      {
        raagId: null, name: "Deshkar",
        difference: "Same five swaras, but Deshkar (Bilawal thaat, a morning raag) centres on Dha and Pa in the upper half and avoids Bhupali's G R S, D movement. Bhupali (evening) dwells on Ga and Re.",
      },
      {
        raagId: "shuddhakalyan", name: "Shuddha Kalyan",
        difference: "Shuddha Kalyan has Bhupali's ascent but brings tivra Ma and Ni into the descent.",
      },
    ],
    commonMistakes: ["Letting Ma or Ni slip into descending phrases.", "Treating Dha as the main resting note, which drifts towards Deshkar."],
    review: pending,
  },
  bhairav: {
    pakad: "S, G m d d P, G m r r S",
    chalan: ["S r G m P", "G m d d P", "m P d N S'", "S' N d P, m G r S"],
    nyas: ["m", "P", "S"],
    specialNotes: "Komal Re and komal Dha are sung with a slow andolan (gentle oscillation).",
    similar: [
      {
        raagId: "kalingada", name: "Kalingada",
        difference: "Same swaras, but Kalingada is lighter: komal Re and Dha are sung without Bhairav's slow andolan, and it moves more freely.",
      },
      {
        raagId: "ramkali", name: "Ramkali",
        difference: "Ramkali adds tivra Ma and komal Ni in descending phrases (e.g. M P d n d P).",
      },
    ],
    commonMistakes: [
      "Holding komal Re or komal Dha flat and still, without the andolan.",
      "Rushing: Bhairav is usually developed slowly.",
    ],
    review: pending,
  },
  malkauns: {
    pakad: "d n d m, g m g S",
    chalan: ["S g m, g m d", "m d n S'", "S' n d m, g m g S"],
    nyas: ["m", "g", "S"],
    specialNotes: "Pentatonic: Re and Pa are omitted. Sung with slow, heavy movements between swaras.",
    similar: [
      {
        raagId: null, name: "Chandrakauns",
        difference: "Chandrakauns uses shuddha Ni instead of komal Ni.",
      },
    ],
    commonMistakes: ["Letting Pa creep in (the tanpura is tuned to Ma for this reason).", "Singing komal Ga too high."],
    review: pending,
  },
  bhimpalasi: {
    pakad: "n, S m, m g P m, g m g R S",
    chalan: ["n, S g m P", "m P n S'", "S' n D P, m P g m g R S"],
    nyas: ["m", "P", "S"],
    specialNotes: "Re and Dha are left out of the ascent (Audav-Sampurna).",
    similar: [
      {
        raagId: "bageshree", name: "Bageshree",
        difference: "Bageshree uses Pa only weakly and dwells on Dha (m D n D); Bhimpalasi rests on Pa and Ma and skips Dha in the ascent. Bageshree is a night raag, Bhimpalasi an afternoon raag.",
      },
      { raagId: "dhanashree", name: "Dhanashree", difference: "Dhanashree uses the same scale but makes Pa the main resting note (vadi Pa)." },
    ],
    commonMistakes: ["Using Re or Dha in ascending phrases."],
    review: pending,
  },
  bageshree: {
    pakad: "S n D, S m g, m D n D, m g R S",
    chalan: ["S g m D n S'", "m D n D, m g", "S' n D m, g R S"],
    nyas: ["m", "D", "S"],
    specialNotes: "Pa is weak or omitted in the ascent; Ma is the central swara.",
    similar: [
      {
        raagId: "bhimpalasi", name: "Bhimpalasi",
        difference: "Bhimpalasi rests on Pa and avoids Dha in the ascent; Bageshree centres on Ma and Dha with Pa used sparingly.",
      },
    ],
    commonMistakes: ["Resting on Pa, which drifts towards Bhimpalasi.", "Singing shuddha Ga instead of komal Ga."],
    review: pending,
  },
  marwa: {
    pakad: "D, N, r G M G r, S",
    chalan: ["N, r G M D", "M D N r', N D", "M G r, S"],
    nyas: ["r", "D"],
    specialNotes: "Pa is omitted. Sa is used sparingly, which gives Marwa its restless, unresolved feel.",
    similar: [
      {
        raagId: "puriya", name: "Puriya",
        difference: "Same swaras. Marwa emphasises komal Re and Dha and avoids resting on Sa; Puriya emphasises Ga and Ni and the lower half (mandra Ni).",
      },
      { raagId: null, name: "Sohni", difference: "Sohni uses the same swaras but lives in the upper half (around taar Sa) and stresses Dha and Ga." },
    ],
    commonMistakes: ["Resting on Sa for long.", "Letting Pa in."],
    review: pending,
  },
  puriya: {
    pakad: "N, r G, M D G, M G r S",
    chalan: ["N, r G, M G", "M D N, M D G", "M G r S"],
    nyas: ["G", "N"],
    specialNotes: "Pa is omitted. The raag is developed mainly in the lower and middle range.",
    similar: [
      {
        raagId: "marwa", name: "Marwa",
        difference: "Marwa stresses komal Re and Dha and avoids resting on Sa; Puriya stresses Ga and Ni.",
      },
      { raagId: "puriya_dhanashree", name: "Puriya Dhanashree", difference: "Puriya Dhanashree adds Pa and komal Dha (Poorvi thaat)." },
    ],
    commonMistakes: ["Emphasising komal Re as in Marwa."],
    review: pending,
  },
  todi: {
    pakad: "d, N S r g, r g r S",
    chalan: ["S r g, M d", "M d N S'", "S' N d, M g r g r S"],
    nyas: ["g", "d", "S"],
    specialNotes: "Komal Re, komal Ga and komal Dha are sung low and with care; Pa is used sparingly (often skipped in the ascent).",
    similar: [
      {
        raagId: "multani", name: "Multani",
        difference: "Same scale, but Multani uses komal Re and Dha only weakly, rests on Pa and komal Ga, and starts phrases from mandra Ni (N, S g M P). Multani is an afternoon raag.",
      },
      { raagId: "bilaskhanitodi", name: "Bilaskhani Todi", difference: "Bilaskhani Todi belongs to Bhairavi thaat (shuddha Ma, komal Ni) and has an avaroh that moves through Pa unusually." },
    ],
    commonMistakes: ["Singing komal Re and Ga too high.", "Resting on Pa, which drifts towards Multani."],
    review: pending,
  },
};

export function detailsFor(raagId: string): RaagDetails | null {
  return RAAG_DETAILS[raagId] ?? null;
}
