/**
 * Sharing a take's measurements as a link, without a server and without the
 * audio: the summary and a coarse pitch line (one point per 100 ms or
 * coarser) are compressed into the part of the URL after "#", which
 * browsers do not send to any server.
 */
import type { TakeMeasurements } from "../analysis/summary";
import type { PitchTrack } from "../analysis/types";

export interface SharedTake {
  v: 1;
  raag: string;
  allowed: number[];
  date: string;
  saHz: number;
  durationSec: number;
  heldWithin20: number | null;
  medianDev: number | null;
  longestPhrase: number | null;
  outside: number;
  /** [swara, held seconds, median deviation, median wobble] */
  swaras: [number, number, number, number][];
  /** step between contour points (s) and the points (cents from Sa, null = silence) */
  step: number;
  contour: (number | null)[];
}

const MAX_POINTS = 600;

export function summariseForShare(m: TakeMeasurements, track: PitchTrack, raag: string, allowed: number[], date = new Date()): SharedTake {
  const dur = track.frames.length ? track.frames[track.frames.length - 1].timeSec : 0;
  const step = Math.max(0.1, Math.ceil((dur / MAX_POINTS) * 10) / 10);
  const contour: (number | null)[] = [];
  for (let t = 0; t <= dur; t += step) {
    const win = track.frames.filter(f => f.timeSec >= t && f.timeSec < t + step && f.hz !== null).map(f => 1200 * Math.log2(f.hz! / m.saHz)).sort((a, b) => a - b);
    contour.push(win.length >= 3 ? Math.round(win[win.length >> 1]) : null);
  }
  return {
    v: 1, raag, allowed, date: date.toISOString().slice(0, 10), saHz: Math.round(m.saHz * 100) / 100,
    durationSec: Math.round(m.durationSec * 10) / 10,
    heldWithin20: m.heldWithin20CentsPct === null ? null : Math.round(m.heldWithin20CentsPct),
    medianDev: m.medianAbsDeviationCents === null ? null : Math.round(m.medianAbsDeviationCents * 10) / 10,
    longestPhrase: m.longestPhraseSec === null ? null : Math.round(m.longestPhraseSec * 10) / 10,
    outside: m.ruleFlags.length,
    swaras: m.swaras.filter(s => s.totalHeldSec > 0).map(s => [s.swara, Math.round(s.totalHeldSec * 10) / 10, Math.round(s.medianDeviationCents), Math.round(s.medianWobbleCents)]),
    step, contour,
  };
}

const toB64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** Compact, URL-safe text for any JSON value (deflated where the browser can). */
export async function encodeJson(value: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value));
  if (typeof CompressionStream !== "undefined") return "z" + toB64url(await pipe(json, new CompressionStream("deflate-raw")));
  return "j" + toB64url(json);
}
export async function decodeJson<T>(s: string): Promise<T> {
  const kind = s[0], body = fromB64url(s.slice(1));
  const bytes = kind === "z" ? await pipe(body, new DecompressionStream("deflate-raw")) : body;
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export async function encodeTake(t: SharedTake): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(t));
  if (typeof CompressionStream !== "undefined") return "z" + toB64url(await pipe(json, new CompressionStream("deflate-raw")));
  return "j" + toB64url(json);
}

export async function decodeTake(s: string): Promise<SharedTake> {
  const kind = s[0], body = fromB64url(s.slice(1));
  const bytes = kind === "z" ? await pipe(body, new DecompressionStream("deflate-raw")) : body;
  const t = JSON.parse(new TextDecoder().decode(bytes)) as SharedTake;
  if (t.v !== 1 || !Array.isArray(t.contour)) throw new Error("This link is not a Naad AI take.");
  return t;
}

export function shareUrl(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#take=${code}`;
}
