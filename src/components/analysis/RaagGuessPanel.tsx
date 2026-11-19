/** "Which raag does this sound like?" for a take, from its held notes. */
import { useUi } from "../../i18n/ui";
import React, { useMemo } from "react";
import { RAAG_LIST } from "../../data/allRaags";
import { guessRaag, guessRaagAndSa, type RaagGuess } from "../../analysis/raagGuess";
import { detectSa } from "../../analysis/sa";
import { findHeldNotes, type HeldNote } from "../../analysis/summary";
import type { PitchTrack } from "../../analysis/types";

const SW = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];
const short = (n: string) => n.replace(/^Raag\s+/i, "").replace(/\s*\(.*\)/, "");

interface Props {
  heldNotes: HeldNote[];
  chosenRaag?: string;
  /** When Sa was found from the recording rather than set by the singer, the track lets Sa and raag be chosen together. */
  track?: PitchTrack;
  saHz?: number;
}

export const RaagGuessPanel: React.FC<Props> = ({ heldNotes, chosenRaag, track, saHz }) => {
  const u = useUi();
  const g: RaagGuess & { saHz?: number | null } = useMemo(() => {
    if (!track) return guessRaag(heldNotes, RAAG_LIST);
    const joint = guessRaagAndSa(detectSa(track, {}).candidates, sa => findHeldNotes(track, sa), RAAG_LIST);
    return joint.candidates.length ? joint : guessRaag(heldNotes, RAAG_LIST);
  }, [heldNotes, track]);
  const otherSa = g.saHz && saHz && Math.abs(1200 * Math.log2(g.saHz / saHz)) % 1200 > 50 && Math.abs(1200 * Math.log2(g.saHz / saHz)) % 1200 < 1150 ? g.saHz : null;
  if (g.candidates.length === 0) {
    return (
      <section className="rg">
        <h3 className="rg-h">{u("rgH")}</h3>
        <p className="rg-muted">{u("rgNotEnough", g.heldSec.toFixed(1))}</p>
      </section>
    );
  }
  const [best, ...rest] = g.candidates;
  return (
    <section className="rg">
      <h3 className="rg-h">{u("rgH")}</h3>
      <p className="rg-lead">
        {u(g.confidence === "clear" ? "rgClear" : g.confidence === "likely" ? "rgLikely" : "rgMaybe", short(best.raag.name))}
        {g.sameSwaras.length > 0 && u("rgSame", g.sameSwaras.slice(0, 3).map(r => short(r.name)).join(", "))}.
        {chosenRaag && short(chosenRaag) !== short(best.raag.name) && !g.sameSwaras.some(r => short(r.name) === short(chosenRaag)) && u("rgChose", short(chosenRaag))}
      </p>
      {otherSa && <p className="rg-muted">{u("rgSaJoint", otherSa.toFixed(1))}</p>}
      <ol className="rg-list">
        {[best, ...rest.slice(0, 3)].map(c => (
          <li key={c.raag.id}>
            <span className="rg-name">{short(c.raag.name)}</span>
            <span className="rg-why">
              {u("rgWhy", Math.round(c.inRaag * 100), Math.round(c.coverage * 100))}
              {c.movement !== null && u("rgSteps", Math.round(c.movement * 100))}
              {c.phrase !== null && u("rgPhrase", Math.round(c.phrase * 100))}
              {c.outside.length > 0 && u("rgOutsideIt", c.outside.map(s => SW[s]).join(", "))}
            </span>
          </li>
        ))}
      </ol>
      <p className="rg-muted">{u("rgNote")}</p>
    </section>
  );
};
