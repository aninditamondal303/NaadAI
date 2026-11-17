/**
 * Guru-shishya scoring: compare a phrase sung back with the phrase that was
 * played. The sung pitch (cents from Sa, ~60 readings a second) is cut into
 * notes where it stays within half a semitone for at least 0.15 s; then the
 * written swaras are matched to the sung notes in order (longest common
 * subsequence), so an extra or missed note doesn't spoil the rest.
 */
export interface SungNote { semitone: number; cents: number; start: number; dur: number }

export function segmentNotes(points: { t: number; c: number | null }[], minDur = 0.15): SungNote[] {
  const out: SungNote[] = [];
  let i = 0;
  while (i < points.length) {
    if (points[i].c === null) { i++; continue; }
    const step = Math.round(points[i].c! / 100);
    let j = i;
    const vals: number[] = [];
    while (j < points.length && points[j].c !== null && Math.abs(points[j].c! - step * 100) <= 50) { vals.push(points[j].c! - step * 100); j++; }
    const dur = points[Math.max(i, j - 1)].t - points[i].t;
    if (dur >= minDur) {
      vals.sort((a, b) => a - b);
      const prev = out[out.length - 1];
      const med = vals[vals.length >> 1];
      if (prev && prev.semitone === step && points[i].t - (prev.start + prev.dur) < 0.12) prev.dur = points[j - 1].t - prev.start; // a tiny wobble out and back
      else out.push({ semitone: step, cents: med, start: points[i].t, dur });
    }
    i = Math.max(j, i + 1);
  }
  return out;
}

export interface NoteMark { semitone: number; hit: boolean; cents: number | null }

/** Match expected swaras (semitones from Sa) to sung notes, in order. Octave must match. */
export function matchPhrase(expected: number[], sung: SungNote[]): { marks: NoteMark[]; score: number } {
  // collapse repeats: "S - S" sung on one breath sounds like one long Sa
  const exp: number[] = expected.filter((s, i) => i === 0 || s !== expected[i - 1]);
  const n = exp.length, m = sung.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i][j] = exp[i] === sung[j].semitone ? 1 + L[i + 1][j + 1] : Math.max(L[i + 1][j], L[i][j + 1]);
  const marks: NoteMark[] = [];
  let i = 0, j = 0;
  while (i < n) {
    if (j < m && exp[i] === sung[j].semitone) { marks.push({ semitone: exp[i], hit: true, cents: Math.round(sung[j].cents) }); i++; j++; }
    else if (j < m && L[i][j + 1] >= L[i + 1][j]) j++;
    else { marks.push({ semitone: exp[i], hit: false, cents: null }); i++; }
  }
  const hits = marks.filter(k => k.hit);
  const inTune = hits.filter(k => Math.abs(k.cents!) <= 25).length;
  // half for singing the right swaras in order, half for singing them in tune
  const score = n === 0 ? 0 : Math.round(50 * (hits.length / n) + 50 * (inTune / n));
  return { marks, score };
}
