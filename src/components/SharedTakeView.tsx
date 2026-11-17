/** What a guru sees when opening a share link: the take's measurements and pitch line. */
import React, { useEffect, useMemo, useState } from "react";
import { decodeTake, type SharedTake } from "../lib/shareTake";
import { SwaraCanvas } from "./shared/SwaraCanvas";
import { gridFor, type TracePoint, type View } from "./landing/stage";
import { ShrutiView } from "./analysis/ShrutiView";
import { RaagGuessPanel } from "./analysis/RaagGuessPanel";
import type { HeldNote, SwaraStats } from "../analysis/summary";
import { SKIES } from "./landing/sky";

const NAMES = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];

/** Held notes rebuilt from the coarse contour, for the raag guess (steady stretches of 0.3 s or more). */
function heldFromContour(t: SharedTake): HeldNote[] {
  const out: HeldNote[] = [];
  let i = 0;
  while (i < t.contour.length) {
    const c = t.contour[i];
    if (c === null) { i++; continue; }
    const step = Math.round(c / 100);
    let j = i;
    while (j + 1 < t.contour.length && t.contour[j + 1] !== null && Math.round(t.contour[j + 1]! / 100) === step) j++;
    const dur = (j - i + 1) * t.step;
    if (dur >= 0.3) out.push({ startSec: i * t.step, durSec: dur, swara: ((step % 12) + 12) % 12, octave: Math.floor(step / 12), deviationCents: 0, wobbleCents: 0 });
    i = j + 1;
  }
  return out;
}

export const SharedTakeView: React.FC<{ code: string; onOpenApp: () => void }> = ({ code, onOpenApp }) => {
  const [take, setTake] = useState<SharedTake | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { decodeTake(code).then(setTake).catch(e => setError(e?.message || "This link could not be read.")); }, [code]);

  const points: TracePoint[] = useMemo(() => (take ? take.contour.map((c, i) => ({ t: i * take.step, c })) : []), [take]);
  const grid = useMemo(() => gridFor(take?.allowed ?? [0, 2, 4, 5, 7, 9, 11]), [take]);
  const duration = take ? take.contour.length * take.step : 1;
  const view = (): View => ({ kind: "track", points, duration, reveal: duration, ghostRest: false, now: 0, maxGap: (take?.step ?? 0.1) * 1.5 });
  const swaras: SwaraStats[] = take ? take.swaras.map(([s, sec, dev, wob]) => ({
    swara: s, symbol: "", name: NAMES[s], inRaag: take.allowed.includes(s), heldNotes: 0, totalHeldSec: sec, longestHoldSec: 0, medianDeviationCents: dev, medianWobbleCents: wob,
  })) : [];

  return (
    <div className="ln ln-gate" style={{ "--sky-top": SKIES.night.top, "--sky-bottom": SKIES.night.bottom, "--ink": SKIES.night.ink, "--muted": SKIES.night.muted, "--line": SKIES.night.line, "--line-strong": SKIES.night.lineStrong, "--voice": SKIES.night.voice, "--btn-bg": SKIES.night.buttonBg, "--btn-ink": SKIES.night.buttonInk } as React.CSSProperties}>
      <header className="ln-top">
        <span className="ln-mark"><span className="ln-mark-deva">नाद</span> Naad AI</span>
        <nav className="ln-nav"><button type="button" className="ln-open" onClick={onOpenApp}>Open Naad AI</button></nav>
      </header>
      <main className="st-shared">
        {error && <p className="tp-error">{error}</p>}
        {!take && !error && <p className="rg-muted">Opening the shared riyaz...</p>}
        {take && (
          <>
            <h1 className="lib-title">Riyaz in {take.raag}</h1>
            <p className="lib-intro">
              Shared from Naad AI. Recorded {new Date(take.date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })},
              {" "}{take.durationSec.toFixed(0)} seconds, Sa {take.saHz} Hz. The recording itself is not included; these are its measurements.
            </p>
            <p className="pg-figures">
              <span><b>{take.heldWithin20 ?? "–"}{take.heldWithin20 !== null && "%"}</b> held within 20 cents</span>
              <span><b>{take.medianDev ?? "–"}</b> cents median distance</span>
              <span><b>{take.longestPhrase ?? "–"}</b> s longest phrase</span>
              <span><b>{take.outside}</b> held notes outside the raag</span>
            </p>
            <SwaraCanvas className="rz-live st-shared-canvas" grid={grid} getView={view} running={false} label="The singer's pitch on the raag's swara lines" />
            <ShrutiView swaras={swaras} />
            <RaagGuessPanel heldNotes={heldFromContour(take)} chosenRaag={take.raag} />
          </>
        )}
      </main>
    </div>
  );
};
