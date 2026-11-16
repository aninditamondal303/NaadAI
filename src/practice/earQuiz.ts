/**
 * Ear-training questions.
 *  - Swara level: after a Sa reference, the app plays one swara of the raag;
 *    the singer names it.
 *  - Raag level: the app plays a pakad or chalan phrase; the singer picks the
 *    raag from four (similar raags are used as the wrong options when known,
 *    because that's where confusion really happens).
 *
 * `rand` is injected so tests are repeatable; the app uses crypto random numbers.
 */
import type { ComprehensiveRaag } from "../data/allRaags";
import type { RaagDetails } from "../data/raagDetails";
import { parseNote, parseSargam, type SargamToken, type SargamNote } from "./notation";

export type Rand = () => number;

export function cryptoRand(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 2 ** 32;
}

const pick = <T,>(xs: T[], rand: Rand): T => xs[Math.floor(rand() * xs.length)];

function shuffle<T>(xs: T[], rand: Rand): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The raag's madhya swaras (from its aroh, without repeats) plus taar Sa. */
export function swaraChoices(raag: ComprehensiveRaag): SargamNote[] {
  const seen = new Set<number>();
  const out: SargamNote[] = [];
  for (const t of [...raag.aroha, ...raag.avaroha]) {
    const n = parseNote(t);
    if (n.semitones < 0 || n.semitones > 12 || seen.has(n.semitones)) continue;
    seen.add(n.semitones);
    out.push(n);
  }
  return out.sort((a, b) => a.semitones - b.semitones);
}

export interface SwaraQuestion { answer: SargamNote; options: SargamNote[] }

export function swaraQuestion(raag: ComprehensiveRaag, rand: Rand): SwaraQuestion {
  const options = swaraChoices(raag);
  // Sa itself is the reference, so ask about the other swaras
  return { answer: pick(options.filter(o => o.semitones !== 0), rand), options };
}

export interface RaagQuestion { answerId: string; phrase: SargamToken[]; phraseText: string; optionIds: string[] }

export function raagQuestion(raags: ComprehensiveRaag[], details: Record<string, RaagDetails>, rand: Rand): RaagQuestion {
  const ids = Object.keys(details).filter(id => raags.some(r => r.id === id));
  const answerId = pick(ids, rand);
  const d = details[answerId];
  const phraseText = pick([d.pakad, ...d.chalan], rand);
  const similar = d.similar.map(s => s.raagId).filter((x): x is string => !!x && ids.includes(x));
  const others = shuffle(ids.filter(id => id !== answerId && !similar.includes(id)), rand);
  const wrong = [...similar, ...others].slice(0, 3);
  return { answerId, phrase: parseSargam(phraseText), phraseText, optionIds: shuffle([answerId, ...wrong], rand) };
}
