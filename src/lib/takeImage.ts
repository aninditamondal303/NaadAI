/**
 * A picture of one take to keep or share: the measured pitch on the raag's
 * swara lines, with the take's main measurements. Everything drawn comes
 * from the analysis; nothing is decorative data.
 */
import { drawStage, gridFor, type TracePoint } from "../components/landing/stage";
import { SKIES } from "../components/landing/sky";
import type { TakeMeasurements } from "../analysis/summary";
import type { PitchTrack } from "../analysis/types";

const W = 1600, H = 900;

export async function renderTakeImage(opts: {
  m: TakeMeasurements; track: PitchTrack; raagName: string; allowedSwaras: number[]; date: Date;
}): Promise<Blob> {
  const { m, track, raagName, allowedSwaras, date } = opts;
  const sky = SKIES.night;
  await document.fonts?.ready;

  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, sky.top);
  bg.addColorStop(1, sky.bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Heading
  ctx.fillStyle = sky.ink;
  ctx.textBaseline = "alphabetic";
  ctx.font = '400 30px "Tiro Devanagari Hindi", serif';
  ctx.fillText("नाद", 64, 76);
  ctx.font = '600 22px "Mukta", sans-serif';
  ctx.fillText("Naad AI", 124, 74);
  ctx.font = '400 60px "Tiro Devanagari Hindi", serif';
  ctx.fillText(raagName.startsWith("Raag") ? raagName : `Raag ${raagName}`, 64, 160);
  ctx.fillStyle = sky.muted;
  ctx.font = '400 24px "Mukta", sans-serif';
  const when = date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  ctx.fillText(`${when}. Sa ${m.saHz.toFixed(1)} Hz, ${fmt(m.durationSec)} recorded.`, 64, 202);

  // Pitch on the swara lines
  const points: TracePoint[] = track.frames.map(f => ({ t: f.timeSec, c: f.hz === null ? null : 1200 * Math.log2(f.hz / m.saHz) }));
  const duration = Math.max(0.1, track.frames.length ? track.frames[track.frames.length - 1].timeSec : 0.1);
  const stage = document.createElement("canvas");
  stage.width = W; stage.height = 470;
  drawStage(stage.getContext("2d")!, W, 470, sky, { kind: "track", points, duration, reveal: duration, ghostRest: false, now: 0 }, "deva", gridFor(allowedSwaras));
  ctx.drawImage(stage, 0, 230);

  // Measurements
  const stats: [string, string][] = [
    ["held within 20 cents", m.heldWithin20CentsPct === null ? "–" : `${m.heldWithin20CentsPct.toFixed(0)}%`],
    ["median distance from the swara", m.medianAbsDeviationCents === null ? "–" : `${m.medianAbsDeviationCents.toFixed(1)} cents`],
    ["longest phrase in one breath", m.longestPhraseSec === null ? "–" : `${m.longestPhraseSec.toFixed(1)} s`],
    ["held notes outside the raag", String(m.ruleFlags.length)],
  ];
  const colW = (W - 128) / stats.length;
  stats.forEach(([label, value], i) => {
    const x = 64 + i * colW;
    ctx.fillStyle = sky.voice;
    ctx.font = '400 52px "Tiro Devanagari Hindi", serif';
    ctx.fillText(value, x, 790);
    ctx.fillStyle = sky.muted;
    ctx.font = '400 22px "Mukta", sans-serif';
    ctx.fillText(label, x, 826);
  });
  ctx.fillStyle = sky.muted;
  ctx.font = '400 18px "Mukta", sans-serif';
  ctx.textAlign = "right";
  ctx.fillText("Measured in the browser by Naad AI: aninditamondal303.github.io/NaadAI", W - 64, 872);

  return await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("image failed"))), "image/png"));
}

function fmt(s: number) {
  return s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${s.toFixed(1)} s`;
}

export async function downloadTakeImage(opts: Parameters<typeof renderTakeImage>[0]) {
  const blob = await renderTakeImage(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = opts.raagName.replace(/^Raag\s+/i, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  a.href = url;
  a.download = `naad-${slug}-${opts.date.toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
