/**
 * Compositions and alaap for raag study.
 *
 * IMPORTANT: these are NOT traditional bandishes. They were written for
 * Naad AI to follow each raag's aroh, avaroh, pakad and chalan (see
 * raagDetails.ts), so a student has something correct to sing and read in
 * swaralipi. The lyrics are new. Like the raag notes, everything here is
 * awaiting review by a guru; traditional bandishes should be learnt from a
 * teacher.
 *
 * Swaralipi line format: one token per matra, separated by spaces.
 *   "G"     one swara in the matra
 *   "N.D"   two swaras sharing the matra (more are allowed: "S.R.G.M")
 *   "-"     the previous swara continues (avagraha, written ऽ)
 *   "_"     nothing yet (before the composition starts)
 * Notation: S r R g G m M P d D n N (lowercase = komal, M = tivra Ma),
 * "," = mandra, "'" = taar.
 *
 * Words line: one token per matra, aligned with the swaras; "-" means the
 * previous syllable is held.
 */

export interface ComposedLine {
  notes: string;
  /** Lyrics in Devanagari, one token per matra (bandish only). */
  words?: string;
}

export interface Composition {
  id: string;
  raagId: string;
  kind: "sargam-geet" | "bandish";
  title: string;
  taalId: string;
  laya: "vilambit" | "madhya" | "drut";
  /** Suggested matras per minute for practice. */
  bpm: number;
  sthayi: ComposedLine[];
  antara: ComposedLine[];
  /** Romanised lyrics and meaning (bandish only). */
  roman?: string;
  meaning?: string;
}

export interface AlaapStage { name: string; about: string; phrases: string[] }

/** Alaap in aakar, in three stages: around Sa and mandra, madhya, towards taar. */
export const ALAAP: Record<string, AlaapStage[]> = {
  yaman: [
    { name: "Around Sa", about: "Begin from Sa and settle the mandra Ni and Re.", phrases: ["S - N, - D, - N, R S -", "N, R G - R - S -", "P, - N, R G - R S"] },
    { name: "Madhya saptak", about: "Open Ga and tivra Ma; rest on Ga and Pa.", phrases: ["N, R G M P -", "G M D - P -", "M G R G - R S", "P M G R N, R S -"] },
    { name: "Towards taar Sa", about: "Climb through Dha and Ni to taar Sa, then come home.", phrases: ["G M D N S' -", "N R' S' - N D P -", "M D N S' R' G' R' S'", "S' N D P M G R S"] },
  ],
  bhupali: [
    { name: "Around Sa", about: "Sa, Re and mandra Dha.", phrases: ["S - D, - S R G -", "G R S D, - S -", "D, S R G R S -"] },
    { name: "Madhya saptak", about: "Ga is the centre; rest on Ga and Pa.", phrases: ["S R G P G -", "G P D P G R S", "P G R G - R S"] },
    { name: "Towards taar Sa", about: "Pa, Dha and taar Sa, with taar Re and Ga.", phrases: ["G P D S' -", "S' R' G' R' S' -", "S' D P G R S -"] },
  ],
  bhairav: [
    { name: "Around Sa", about: "Komal Re sung low with a slow andolan.", phrases: ["S - r - S -", "N, S r - S -", "d, N, S r G m r S"] },
    { name: "Madhya saptak", about: "Komal Dha with andolan, resting on Ma and Pa.", phrases: ["G m P - G m r - S", "G m d - d P -", "m P d N d P -", "G m r r S -"] },
    { name: "Towards taar Sa", about: "Through komal Dha and Ni to taar Sa.", phrases: ["m P d N S' -", "S' r' S' N d P -", "S' N d P m G r S"] },
  ],
  malkauns: [
    { name: "Around Sa", about: "Slow, heavy movement in mandra.", phrases: ["S - n, - d, - n, S -", "S g m g S -", "d, n, S g - S -"] },
    { name: "Madhya saptak", about: "Ma is the centre; komal Ga and Dha lean on it.", phrases: ["S g m - g m d - m -", "m d n d m -", "d n d m g m g S"] },
    { name: "Towards taar Sa", about: "Komal Ni to taar Sa and taar komal Ga.", phrases: ["m d n S' -", "S' g' m' g' S' -", "S' n d m g m g S"] },
  ],
  bhimpalasi: [
    { name: "Around Sa", about: "Mandra komal Ni leading to Sa and Ma.", phrases: ["n, S g m - g R S", "n, D, P, n, S -", "S g m g R S -"] },
    { name: "Madhya saptak", about: "Ma and Pa are the resting places.", phrases: ["S g m P - m -", "m g P m g m g R S", "g m P n D P m -"] },
    { name: "Towards taar Sa", about: "Pa and komal Ni to taar Sa.", phrases: ["m P n S' -", "S' g' R' S' n S' -", "S' n D P m P g m g R S"] },
  ],
  bageshree: [
    { name: "Around Sa", about: "Mandra Dha and komal Ni around Sa.", phrases: ["S n, D, - S -", "D, n, S m g - R S", "S g m - g R S"] },
    { name: "Madhya saptak", about: "Ma is the centre; Pa stays weak.", phrases: ["g m D - m -", "m D n D m -", "g m D n D m g R S"] },
    { name: "Towards taar Sa", about: "Dha and komal Ni to taar Sa.", phrases: ["m D n S' -", "S' g' R' S' n D m -", "S' n D m P D m g R S"] },
  ],
  marwa: [
    { name: "Around komal Re", about: "Sa is used sparingly; komal Re carries the weight.", phrases: ["N, r - - S", "D, N, r - G - r -", "D, - N, r - - -"] },
    { name: "Madhya saptak", about: "Tivra Ma and Dha; rest on Dha.", phrases: ["N, r G M D -", "M D G M G r -", "G M D - M G r -"] },
    { name: "Towards taar", about: "Through Ni to taar komal Re.", phrases: ["M D N r' -", "N r' G' r' N D -", "M D N r' N D M G r - S"] },
  ],
  puriya: [
    { name: "Around Sa", about: "The lower range is Puriya's home.", phrases: ["N, r G - r S", "N, D, N, - r S -", "M, D, N, r G - - -"] },
    { name: "Madhya saptak", about: "Ga and Ni are the resting places.", phrases: ["N, r G M D G -", "M G r G -", "G M D N - D M G -"] },
    { name: "Towards taar Sa", about: "Ni to taar Sa, then a slow return.", phrases: ["M D N S' -", "N r' N D M G -", "M D N r' S' N D M G r S"] },
  ],
  todi: [
    { name: "Around Sa", about: "Komal Re and Ga sung low and carefully.", phrases: ["S - r g - r S", "d, N, S r g r S -", "N, S r g M g r S"] },
    { name: "Madhya saptak", about: "Tivra Ma and komal Dha; Pa is rare.", phrases: ["r g M d - M g -", "M d N d M g r g r S", "g M d - P - M g -"] },
    { name: "Towards taar Sa", about: "Komal Dha and Ni to taar Sa.", phrases: ["M d N S' -", "S' r' g' r' S' -", "S' N d P M g r S"] },
  ],
};

const sg = (raagId: string, sthayi: string[], antara: string[], bpm = 90): Composition => ({
  id: `${raagId}-sargam-geet`, raagId, kind: "sargam-geet", title: "Sargam geet", taalId: "teentaal", laya: "madhya", bpm,
  sthayi: sthayi.map(notes => ({ notes })), antara: antara.map(notes => ({ notes })),
});

export const COMPOSITIONS: Composition[] = [
  // ------------------------------------------------------------ Yaman
  sg("yaman",
    ["N, R G - R G M P M G R G R - S -", "G M D N S' - N D P M G R N, R S -"],
    ["M D N S' - S' N R' S' N D P M - G -", "M D N S' N R' G' R' S' N D P M G R S"]),
  {
    id: "yaman-bandish", raagId: "yaman", kind: "bandish", title: "Saanjh bhai", taalId: "teentaal", laya: "madhya", bpm: 80,
    sthayi: [
      { notes: "N, R G R G M D - N D P - M G R S", words: "साँ झ भ ई अ ब दी - प ज ला - ओ - - -" },
      { notes: "P M G M D N S' N D P - M G R S -", words: "म न मं दि र में सु र ब सा - ओ - - - -" },
    ],
    antara: [
      { notes: "M D N S' N S' R' S' N - D N S' - - -", words: "ज ग म ग ज ग म ग जो - त ज ले - - -" },
      { notes: "S' N D P M G M - G - R G R - S -", words: "गु रु च र न न में - शी - श झु के - - -" },
    ],
    roman: "Saanjh bhai ab deep jalao, man mandir mein sur basao. Jagmag jagmag jot jale, guru charanan mein sheesh jhuke.",
    meaning: "Evening has come; light the lamps and let the notes live in the temple of the mind. The flame flickers bright; the head bows at the guru's feet.",
  },
  // ------------------------------------------------------------ Bhupali
  sg("bhupali",
    ["S R G - P G R S D, S R G R - S -", "G P D - S' D P G P D P G R - S -"],
    ["G P D S' - S' R' S' D S' D P G - P -", "G P D S' R' G' R' S' D P G R S - - -"]),
  {
    id: "bhupali-bandish", raagId: "bhupali", kind: "bandish", title: "Chaand uga", taalId: "teentaal", laya: "madhya", bpm: 80,
    sthayi: [
      { notes: "G - R G P - G R S - D, S R - S -", words: "चाँ - द उ गा - न भ में - उ जि या - रा -" },
      { notes: "G P D P G P D S' D - P - G - R S", words: "झि ल मि ल झि ल मि ल ता - रा - ता - रा -" },
    ],
    antara: [
      { notes: "P - D S' S' R' S' - D - S' D P - G -", words: "नी - ल ग ग न में - दी - प ज ले - हैं -" },
      { notes: "G' R' S' - D - S' D P - G P G R S -", words: "म न के - आँ - ग न फू - ल खि ले - हैं -" },
    ],
    roman: "Chaand uga nabh mein ujiyaara, jhilmil jhilmil taara taara. Neel gagan mein deep jale hain, man ke aangan phool khile hain.",
    meaning: "The moon has risen and the sky is bright; every star twinkles. Lamps burn in the blue sky, and flowers bloom in the courtyard of the heart.",
  },
  // ------------------------------------------------------------ Bhairav
  sg("bhairav",
    ["S - r - G m P - G m d - P - - -", "m P d P G m r r S - N, S r - S -"],
    ["G m d N S' - - - r' - S' - N d P -", "m P d N S' r' S' N d P m G r - S -"]),
  {
    id: "bhairav-bandish", raagId: "bhairav", kind: "bandish", title: "Bhor bhai", taalId: "teentaal", laya: "madhya", bpm: 76,
    sthayi: [
      { notes: "S - r G m - P P d - d P G m r S", words: "भो - र भ ई - अ ब जा - ग रे म न वा -" },
      { notes: "m P d - N - S' N d P m G r - S -", words: "ह रि का - ना - म सु मि र ले - - - - -" },
    ],
    antara: [
      { notes: "G m d - N S' S' - r' S' N S' d - P -", words: "सू र ज - कि र न - ज ग म ग - - - -" },
      { notes: "m P d - N - S' - d - P - G m r S", words: "ज ग सा - रा - जा - गा - - - - - - -" },
    ],
    roman: "Bhor bhai ab jaag re manva, Hari ka naam sumir le. Suraj kiran jagmag, jag saara jaaga.",
    meaning: "Dawn has come; wake up, my mind, and remember God's name. The sun's rays shine and the whole world is awake.",
  },
  // ------------------------------------------------------------ Malkauns
  sg("malkauns",
    ["S - g m g - S - n, S g m d - m -", "d n d m g m g S n, S g m g - S -"],
    ["g m d n S' - - - g' m' g' S' n d m -", "d n S' g' S' n d m g m d m g - S -"], 70),
  {
    id: "malkauns-bandish", raagId: "malkauns", kind: "bandish", title: "Rain andheri", taalId: "teentaal", laya: "madhya", bpm: 70,
    sthayi: [
      { notes: "S - g m d - m - g - m g g m g S", words: "रै - न अँ धे - री - दी - प ज ला - ऊँ -" },
      { notes: "m d n - S' n d - m - g - m g S -", words: "प्र भु के - गु न मैं - गा - ऊँ - - - - -" },
    ],
    antara: [
      { notes: "d - n - S' n S' g' S' - n - d - m -", words: "ता - रे - झि ल मि ल गा - ए - - - - -" },
      { notes: "S' n d - m - d - g m g - S - - -", words: "सु न ले - मे - री - बि न ती - - - - -" },
    ],
    roman: "Rain andheri deep jalaaoon, Prabhu ke gun main gaaoon. Taare jhilmil gaaye, sun le meri binati.",
    meaning: "In the dark night I light a lamp and sing the Lord's praise. The stars twinkle and sing; hear my prayer.",
  },
  // ------------------------------------------------------------ Bhimpalasi
  sg("bhimpalasi",
    ["n, S g m P - m - g m g R S - - -", "n, S m - m g P m g m P n S' - - -"],
    ["m P n S' - S' g' R' S' n D P m - P -", "P n S' n D P m P g m g R S - - -"]),
  {
    id: "bhimpalasi-bandish", raagId: "bhimpalasi", kind: "bandish", title: "Dhoop dhale", taalId: "teentaal", laya: "madhya", bpm: 80,
    sthayi: [
      { notes: "n, - S g m - P m g - m g R - S -", words: "धू - प ढ ले - ज ब आँ - ग न में - - -" },
      { notes: "m - g P m - P n S' n D P m g R S", words: "या - द तु म्हा - री - आ - ए - - - - -" },
    ],
    antara: [
      { notes: "m P n - S' - S' n S' - g' R' S' - n -", words: "म न की - बा - त क हूँ - कि स से - - -" },
      { notes: "S' - n - D - P - m - P m g R S -", words: "सू - ना - सू - ना - ये - म न - - - -" },
    ],
    roman: "Dhoop dhale jab aangan mein, yaad tumhaari aaye. Man ki baat kahoon kis se, soona soona ye man.",
    meaning: "When the sunlight fades in the courtyard, I remember you. Whom can I tell what is in my heart? This heart feels empty.",
  },
  // ------------------------------------------------------------ Bageshree
  sg("bageshree",
    ["S - n, D, S - m - g - m D n D m -", "m D n S' n D m - g m g R S - - -"],
    ["g m D n S' - - - g' R' S' n D - m -", "m D n S' n D m P D - m - g R S -"]),
  {
    id: "bageshree-bandish", raagId: "bageshree", kind: "bandish", title: "Beeti jaaye rain", taalId: "teentaal", laya: "madhya", bpm: 76,
    sthayi: [
      { notes: "m - g - m - D - n - D m g - R S", words: "बी - ती - जा - ए - रै - न स खी - री -" },
      { notes: "S n, D, - S - g - m - D n D - m -", words: "पि या बि - ना - नै - ना - भ रे - - - -" },
    ],
    antara: [
      { notes: "m - D n S' n S' - g' - R' - S' n D m", words: "चं - दा - ढ ल ता - जा - ए - - - - -" },
      { notes: "m - D - n - D - m P D - m g R S", words: "मो - रे - पि - या - न हिं आ - ए - - -" },
    ],
    roman: "Beeti jaaye rain sakhi ri, piya bina naina bhare. Chanda dhalta jaaye, more piya nahin aaye.",
    meaning: "The night is passing, my friend; without my beloved my eyes fill with tears. The moon is setting and my beloved has not come.",
  },
  // ------------------------------------------------------------ Marwa
  sg("marwa",
    ["D, - N, r G M G - r - G - M G r -", "G M D - M D N r' N D M G r - S -"],
    ["M D N r' - r' N D M D N S' - - - -", "N r' G' r' N D M D M G r - S - - -"]),
  {
    id: "marwa-bandish", raagId: "marwa", kind: "bandish", title: "Dhalti saanjh", taalId: "teentaal", laya: "madhya", bpm: 80,
    sthayi: [
      { notes: "D, N, r - G - M - D - M G r G r -", words: "ढ ल ती - सां - झ - बे - चै न म न वा -" },
      { notes: "M D N - r' - N - D - M D G M G r", words: "क ब आ - ए - गे - सां - व रि या - - -" },
    ],
    antara: [
      { notes: "M - D - N r' N D M - D - N D M G", words: "दू - र - ग ग न में ता - रा - - - - -" },
      { notes: "N - r' r' G' - r' - N - D M G - r S", words: "दी - प ज ला - ऊँ - रा - ह नि हा - रूँ -" },
    ],
    roman: "Dhalti saanjh bechain manva, kab aayenge saanvariya. Door gagan mein taara, deep jalaoon raah nihaaroon.",
    meaning: "The evening fades and the heart is restless: when will the beloved come? A star in the far sky; I light a lamp and watch the road.",
  },
  // ------------------------------------------------------------ Puriya
  sg("puriya",
    ["N, r G - M G - - r - G r S - - -", "N, D, N, r G M D G M G r G r - S -"],
    ["G M D N - N r' - N D M D G - - -", "M D N r' N D M G M G r - S - - -"]),
  {
    id: "puriya-bandish", raagId: "puriya", kind: "bandish", title: "Shaam ki bela", taalId: "teentaal", laya: "madhya", bpm: 76,
    sthayi: [
      { notes: "N, - r G M - G - r - G - M G r S", words: "शा - म की बे - ला - आ - ई - - - - -" },
      { notes: "D, N, r G M - D - G - M G r - S -", words: "म न अ के ला - सो - चे - - - - - - -" },
    ],
    antara: [
      { notes: "G M D N N - r' - N - D M G - - -", words: "ध ड़ क न गा - ए - गी - त न ए - - -" },
      { notes: "M D N - r' N D - M - G - r - S -", words: "सु र में - ढ ल ता - जा - ए - - - - -" },
    ],
    roman: "Shaam ki bela aayi, man akela soche. Dhadkan gaaye geet naye, sur mein dhalta jaaye.",
    meaning: "The hour of dusk has come and the lonely mind thinks. The heartbeat sings new songs and melts into the notes.",
  },
  // ------------------------------------------------------------ Todi
  sg("todi",
    ["d, N, S r g - r - g - M - g r S -", "r g M d - M g - r g r S N, - S -"],
    ["M d N S' - S' r' S' N d M d g - - -", "M d N S' r' g' r' S' N d P M g r S -"], 76),
  {
    id: "todi-bandish", raagId: "todi", kind: "bandish", title: "Ujli bhor", taalId: "teentaal", laya: "madhya", bpm: 72,
    sthayi: [
      { notes: "S r g - r - S - d, N, S r g r S -", words: "उ ज ली - भो - र - रं - ग बि ख रे - -" },
      { notes: "r g M - d - M g M d N d M g r S", words: "ध र ती - अं - ग ना ज ग म ग - - - -" },
    ],
    antara: [
      { notes: "M - d - N - S' - r' - S' - N d M d", words: "पं - छी - बो - ले - मी - ठे - बो - ल -" },
      { notes: "d N S' - r' g' r' S' N d P M g r S -", words: "प्र भु का - ना - म सु मि र ले - - - - -" },
    ],
    roman: "Ujli bhor rang bikhre, dharti angana jagmag. Panchhi bole meethe bol, Prabhu ka naam sumir le.",
    meaning: "A bright dawn scatters colour and the earth's courtyard shines. Birds speak sweet words; remember the Lord's name.",
  },
];

export function compositionsFor(raagId: string): Composition[] {
  return COMPOSITIONS.filter(c => c.raagId === raagId);
}

// ---------------------------------------------------------------------------
// Basic sargam geet for every other raag, built from its own pakad, aroh and
// avaroh, so it can only use the raag's swaras in the raag's own order:
//   sthayi 1: the pakad          sthayi 2: the avaroh from Pa down to Sa
//   antara 1: the aroh up to taar Sa    antara 2: the avaroh from taar Sa
// ---------------------------------------------------------------------------
import type { ComprehensiveRaag } from "./allRaags";
import { pakadFor } from "./pakad";
import { angPhrases } from "./mukhyaAng";
import { parseNote } from "../practice/notation";

/** Fit a phrase into one avartan: one swara per matra, holds after phrase ends; two per matra if too long. */
export function fitToAvartan(phrase: string, matras = 16): string {
  const groups = phrase.split("|").map(g => g.trim().split(/\s+/).filter(t => t && t !== "-")).filter(g => g.length);
  let notes = groups.flat();
  const breaks = new Set<number>();
  let k = 0;
  for (const g of groups) { k += g.length; breaks.add(k - 1); }
  if (notes.length > matras * 2) notes = notes.slice(0, matras * 2);
  if (notes.length > matras) {
    // pair up swaras from the start until it fits
    const out: string[] = [];
    let extra = notes.length - matras, i = 0;
    while (i < notes.length) {
      if (extra > 0 && i + 1 < notes.length) { out.push(`${notes[i]}.${notes[i + 1]}`); i += 2; extra--; }
      else { out.push(notes[i]); i++; }
    }
    return out.join(" ");
  }
  // short phrases: two matras per swara; otherwise holds after phrase ends; the rest on the last swara
  let spare = matras - notes.length;
  const out: string[] = [];
  const doubled = notes.length * 2 <= matras;
  notes.forEach((n, i) => {
    out.push(n);
    if (i === notes.length - 1) return;
    if ((doubled || breaks.has(i)) && spare > 1) { out.push("-"); spare--; }
  });
  while (spare-- > 0) out.push("-");
  return out.join(" ");
}

/**
 * Fit short phrases into avartans so that every phrase begins on a vibhag
 * (matras 1, 5, 9, 13 of Teentaal) and its last swara is held to the end of
 * that vibhag; a phrase longer than a vibhag takes two (or more) vibhags.
 */
export function fitPhrasesToVibhags(phrases: string[], matras = 16, vibhag = 4): string[] {
  const cells: string[] = [];
  for (const ph of phrases) {
    let notes = ph.trim().split(/\s+/).filter(t => t && t !== "-" && t !== "|");
    if (!notes.length) continue;
    // more than two swaras per matra would be a taan, not a sargam: cap at two per matra over two vibhags
    if (notes.length > vibhag * 4) notes = notes.slice(0, vibhag * 4);
    const span = Math.ceil(notes.length / vibhag) * vibhag;
    const slots = Math.min(span, vibhag * 2);
    const block: string[] = [];
    if (notes.length <= slots) {
      block.push(...notes);
      while (block.length < slots) block.push("-");
    } else {
      let extra = notes.length - slots, i = 0;
      while (i < notes.length) {
        if (extra > 0 && i + 1 < notes.length) { block.push(`${notes[i]}.${notes[i + 1]}`); i += 2; extra--; }
        else { block.push(notes[i]); i++; }
      }
    }
    // keep a phrase inside one avartan
    const used = cells.length % matras;
    if (used + block.length > matras) while (cells.length % matras) cells.push("-");
    cells.push(...block);
  }
  while (cells.length % matras) cells.push("-");
  const lines: string[] = [];
  for (let i = 0; i < cells.length; i += matras) lines.push(cells.slice(i, i + matras).join(" "));
  return lines;
}

export function basicSargamGeet(raag: ComprehensiveRaag): Composition {
  const ang = angPhrases(raag.id);
  if (ang.length >= 2) {
    // phrases of the mukhya ang in their order; the sthayi takes the phrases that stay below taar Sa,
    // the antara those that reach it, followed by the aroh to taar Sa and the avaroh
    const reachesTaar = (ph: string) => ph.split(" ").some(t => parseNote(t).semitones >= 12);
    const low = ang.filter(p => !reachesTaar(p)), high = ang.filter(reachesTaar);
    const sthayi = fitPhrasesToVibhags(low.length ? low : ang).slice(0, 3);
    const antara = fitPhrasesToVibhags([...(low.length ? high : []), raag.aroha.join(" "), raag.avaroha.join(" ")]).slice(0, 3);
    return {
      id: `${raag.id}-basic-sargam-geet`, raagId: raag.id, kind: "sargam-geet", title: "Sargam from the mukhya ang",
      taalId: "teentaal", laya: "madhya", bpm: 80,
      sthayi: sthayi.map(notes => ({ notes })), antara: antara.map(notes => ({ notes })),
    };
  }
  const pakad = pakadFor(raag.id) ?? raag.aroha.join(" ");
  const semi = (t: string) => parseNote(t).semitones;
  const up = raag.aroha, down = raag.avaroha;
  // sthayi 2: up the aroh to around Pa, then down the avaroh to Sa
  const lowUp = up.filter(t => semi(t) >= 0 && semi(t) <= 7);
  const top = lowUp.length ? semi(lowUp[lowUp.length - 1]) : 7;
  const lowDown = down.filter(t => semi(t) < top && semi(t) >= 0);
  const fromPa = `${lowUp.join(" ")} | ${lowDown.join(" ")}`;
  // antara 1: up the aroh from Ga/Ma to taar Sa, a turn down the avaroh, and back to taar Sa
  const gaIdx = up.findIndex(t => semi(t) >= 4);
  const upper = up.slice(Math.max(0, gaIdx));
  const turn = down.slice(1, 3);
  const back = upper.filter(t => semi(t) > semi(turn[turn.length - 1] ?? "S'"));
  const upToTaar = `${upper.join(" ")} | ${turn.join(" ")} ${back.join(" ")}`;
  return {
    id: `${raag.id}-basic-sargam-geet`, raagId: raag.id, kind: "sargam-geet", title: "Basic sargam geet",
    taalId: "teentaal", laya: "madhya", bpm: 80,
    sthayi: [{ notes: fitToAvartan(pakad) }, { notes: fitToAvartan(fromPa) }],
    antara: [{ notes: fitToAvartan(upToTaar) }, { notes: fitToAvartan(down.join(" ")) }],
  };
}

/** Written compositions where they exist, otherwise the basic sargam geet. */
export function compositionsForRaag(raag: ComprehensiveRaag): Composition[] {
  const written = compositionsFor(raag.id);
  return written.length ? written : [basicSargamGeet(raag)];
}
