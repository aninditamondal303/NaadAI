/**
 * Drawing for the welcome page: swara lines and a pitch trace, on a canvas.
 * Everything drawn is a measured pitch (from the demo file or the
 * visitor's microphone); nothing here invents values.
 */
import type { Sky } from "./sky";

export interface TracePoint { t: number; c: number | null }

/** Lines for Raag Yaman's swaras, mandra Pa to taar Sa (cents from Sa). */
export const GRID: GridLine[] = [
  { c: -500, label: "प़", kind: "swara" },
  { c: -300, label: "ध़", kind: "swara" },
  { c: -100, label: "ऩि", kind: "swara" },
  { c: 0, label: "सा", kind: "sa" },
  { c: 200, label: "रे", kind: "swara" },
  { c: 400, label: "ग", kind: "swara" },
  { c: 500, label: "म", kind: "outside" },
  { c: 600, label: "म॑", kind: "swara" },
  { c: 700, label: "प", kind: "swara" },
  { c: 900, label: "ध", kind: "swara" },
  { c: 1100, label: "नि", kind: "swara" },
  { c: 1200, label: "सां", kind: "sa" },
];
export type GridLine = { c: number; label: string; kind: "sa" | "swara" | "outside" };

const DEVA12 = ["सा", "रे॒", "रे", "ग॒", "ग", "म", "म॑", "प", "ध॒", "ध", "नि॒", "नि"];

/**
 * Lines for any raag: its swaras from mandra Pa up to taar Sa (cents from Sa).
 * `allowed` holds semitones 0..11 that belong to the raag.
 */
export function gridFor(allowed: number[]): GridLine[] {
  const out: GridLine[] = [];
  for (let c = -500; c <= 1200; c += 100) {
    const semi = ((c / 100) % 12 + 12) % 12;
    if (!allowed.includes(semi)) continue;
    const base = DEVA12[semi];
    const label = c < 0 ? base[0] + "\u093C" + base.slice(1) : c === 1200 ? "सां" : base;
    out.push({ c, label, kind: semi === 0 ? "sa" : "swara" });
  }
  return out;
}

export const C_MIN = -600;
export const C_MAX = 1300;

export type Script = "deva" | "beng";

function bengLabel(c: number): string {
  if (c === 1200) return "র্সা";
  return TWELVE.beng[(((Math.round(c / 100)) % 12) + 12) % 12];
}

/** All twelve swaras, for naming the nearest one to a sung pitch. */
const TWELVE: Record<Script, string[]> = {
  deva: ["सा", "रे॒", "रे", "ग॒", "ग", "म", "म॑", "प", "ध॒", "ध", "नि॒", "नि"],
  // Bengali notation writes komal swaras as ঋ, জ্ঞ, দ, ণ and tivra Ma as হ্মা
  beng: ["সা", "ঋ", "রে", "জ্ঞ", "গা", "মা", "হ্মা", "পা", "দ", "ধা", "ণ", "নি"],
};

export function nearestSwara(cents: number, script: Script = "deva"): { label: string; off: number; saptak: "mandra" | "madhya" | "taar" } {
  const step = Math.round(cents / 100);
  const off = cents - step * 100;
  const idx = ((step % 12) + 12) % 12;
  const octave = Math.floor(step / 12);
  return { label: TWELVE[script][idx], off, saptak: octave < 0 ? "mandra" : octave > 0 ? "taar" : "madhya" };
}

export interface View {
  kind: "track" | "live";
  points: TracePoint[];
  /** track: total seconds; live: the newest time (s). */
  duration: number;
  /** track: seconds drawn at full strength. */
  reveal: number;
  /** track: dim the part after `reveal` instead of hiding it. */
  ghostRest: boolean;
  now: number;
  /** Largest time gap (s) still drawn as one line; default 0.06 for 10 ms readings. */
  maxGap?: number;
}

const LIVE_WINDOW = 8;

export function layout(w: number) {
  const gutter = w < 640 ? 44 : 92;
  const right = w < 640 ? 16 : 40;
  return { gutter, right, top: 28, bottom: 28 };
}

export function drawStage(ctx: CanvasRenderingContext2D, w: number, h: number, sky: Sky, view: View | null, script: Script = "deva", grid: GridLine[] = GRID) {
  const { gutter, right, top, bottom } = layout(w);
  ctx.clearRect(0, 0, w, h);
  const y = (c: number) => top + ((C_MAX - c) / (C_MAX - C_MIN)) * (h - top - bottom);
  const small = w < 640;

  // Swara lines
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const g of grid) {
    const yy = Math.round(y(g.c)) + 0.5;
    ctx.strokeStyle = g.kind === "sa" ? sky.lineStrong : sky.line;
    ctx.lineWidth = g.kind === "sa" ? 1.25 : 1;
    ctx.setLineDash(g.kind === "outside" ? [3, 7] : []);
    ctx.beginPath();
    ctx.moveTo(gutter, yy);
    ctx.lineTo(w - right, yy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = g.kind === "outside" ? sky.line : g.kind === "sa" ? sky.ink : sky.muted;
    // Shrink labels on short screens so neighbours a semitone apart don't collide
    const per100 = ((h - top - bottom) / (C_MAX - C_MIN)) * 100;
    const size = Math.max(11, Math.min(g.kind === "sa" ? (small ? 19 : 26) : (small ? 15 : 20), per100 * 1.5));
    ctx.font = script === "beng" ? `${size}px "Tiro Bangla", serif` : `${size}px "Tiro Devanagari Hindi", serif`;
    ctx.fillText(script === "beng" ? bengLabel(g.c) : g.label, gutter - (small ? 10 : 22), yy + 1);
  }
  if (!view || view.points.length === 0) return;

  // Pitch trace
  const x = view.kind === "track"
    ? (t: number) => gutter + (t / view.duration) * (w - gutter - right)
    : (() => {
        const nowX = gutter + 0.84 * (w - gutter - right);
        return (t: number) => nowX - ((view.now - t) / LIVE_WINDOW) * (nowX - gutter);
      })();

  ctx.save();
  ctx.beginPath();
  ctx.rect(gutter, 0, w - gutter - right, h);
  ctx.clip();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const stroke = (from: number, to: number, alpha: number, glow: boolean) => {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = sky.voice;
    ctx.lineWidth = small ? 2.25 : 2.75;
    ctx.shadowColor = sky.voice;
    ctx.shadowBlur = glow ? sky.glow : 0;
    ctx.beginPath();
    let pen = false;
    let prev: TracePoint | null = null;
    for (const p of view.points) {
      if (p.t < from) { prev = p; continue; }
      if (p.t > to) break;
      const broken = p.c === null || prev === null || prev.c === null
        || p.t - prev.t > (view.maxGap ?? 0.06) || Math.abs(p.c - prev.c) > 150;
      if (p.c !== null) {
        if (broken || !pen) ctx.moveTo(x(p.t), y(p.c)); else ctx.lineTo(x(p.t), y(p.c));
        pen = true;
      }
      prev = p;
    }
    ctx.stroke();
  };

  if (view.kind === "track") {
    if (view.ghostRest && view.reveal < view.duration) stroke(view.reveal, view.duration, 0.22, false);
    stroke(0, view.reveal, 1, true);
    const head = lastVoicedBefore(view.points, view.reveal);
    if (head && view.reveal < view.duration && view.reveal - head.t < 0.08) dot(ctx, x(head.t), y(head.c!), sky);
  } else {
    const from = view.now - LIVE_WINDOW;
    stroke(from, view.now, 1, true);
    const nowX = x(view.now);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = sky.lineStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(nowX) + 0.5, top);
    ctx.lineTo(Math.round(nowX) + 0.5, h - bottom);
    ctx.stroke();
    const head = lastVoicedBefore(view.points, view.now);
    if (head && view.now - head.t < 0.1) dot(ctx, x(head.t), y(head.c!), sky);
  }
  ctx.restore();
}

function dot(ctx: CanvasRenderingContext2D, px: number, py: number, sky: Sky) {
  ctx.globalAlpha = 1;
  ctx.shadowColor = sky.voice;
  ctx.shadowBlur = sky.glow * 1.5;
  ctx.fillStyle = sky.voice;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function lastVoicedBefore(points: TracePoint[], t: number): TracePoint | null {
  // points are in time order; binary search for the last point <= t
  let lo = 0, hi = points.length - 1, idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].t <= t) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  for (let i = idx; i >= 0 && i > idx - 8; i--) if (points[i].c !== null) return points[i];
  return null;
}
