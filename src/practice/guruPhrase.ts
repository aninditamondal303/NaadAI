/**
 * A phrase sung by the student's own guru. The guru records it once; the app
 * keeps the guru's pitch line (cents from Sa, 25 readings a second) and the
 * swaras it settles on. The pitch line travels in a link, so the student
 * hears a guide voice that follows the guru's own meends and andolans, and
 * is scored against the guru's swaras. No recording is stored or sent.
 */
import { segmentNotes } from "./phraseMatch";
import { decodeJson, encodeJson } from "../lib/shareTake";

export const CONTOUR_RATE = 25;
const SYMBOLS = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];

export interface GuruPhrase {
  v: 1;
  id: string;
  /** Who sang it, as typed by the guru (optional). */
  by: string;
  raagId: string;
  /** Swaras the phrase settles on, in app notation. */
  notes: string;
  /** Cents above Sa at CONTOUR_RATE readings a second; null = silence. */
  contour: (number | null)[];
  created: string;
}

export function semitoneToSymbol(semi: number): string {
  const pc = ((semi % 12) + 12) % 12;
  const oct = Math.floor(semi / 12);
  return SYMBOLS[pc] + (oct < 0 ? ",".repeat(-oct) : "'".repeat(oct));
}

/** Build a guru phrase from live pitch points (seconds, cents from Sa). */
export function phraseFromPoints(points: { t: number; c: number | null }[], raagId: string, by = ""): GuruPhrase | null {
  const voiced = points.filter(p => p.c !== null);
  if (voiced.length < 5) return null;
  // trim silence at both ends
  const t0 = voiced[0].t, t1 = voiced[voiced.length - 1].t;
  const inner = points.filter(p => p.t >= t0 && p.t <= t1);
  const notes = segmentNotes(inner, 0.18);
  if (notes.length < 2) return null;
  const contour: (number | null)[] = [];
  let j = 0;
  for (let t = t0; t <= t1; t += 1 / CONTOUR_RATE) {
    while (j < inner.length - 1 && inner[j + 1].t <= t) j++;
    const p = inner[j];
    contour.push(p && p.c !== null && Math.abs(p.t - t) < 0.08 ? Math.round(p.c) : null);
  }
  return {
    v: 1, id: `g${Date.now().toString(36)}`, by: by.trim().slice(0, 40), raagId,
    notes: notes.map(n => semitoneToSymbol(n.semitone)).join(" "),
    contour, created: new Date().toISOString(),
  };
}

export const encodeGuruPhrase = (g: GuruPhrase) => encodeJson(g);
export async function decodeGuruPhrase(code: string): Promise<GuruPhrase> {
  const g = await decodeJson<GuruPhrase>(code);
  if (g?.v !== 1 || !Array.isArray(g.contour) || typeof g.notes !== "string") throw new Error("This link is not a Naad AI guru phrase.");
  return g;
}
export const guruPhraseUrl = (code: string) => `${window.location.origin}${import.meta.env.BASE_URL}#guru=${code}`;

const KEY = "naad.guruPhrases.v1";
export function loadGuruPhrases(): GuruPhrase[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveGuruPhrase(g: GuruPhrase) {
  const list = loadGuruPhrases().filter(x => x.id !== g.id);
  list.unshift(g);
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50))); } catch { /* storage full */ }
}
export function removeGuruPhrase(id: string) {
  try { localStorage.setItem(KEY, JSON.stringify(loadGuruPhrases().filter(x => x.id !== id))); } catch { /* ignore */ }
}
