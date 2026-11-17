/** "Which raag does this sound like?" for a take, from its held notes. */
import React, { useMemo } from "react";
import { RAAG_LIST } from "../../data/allRaags";
import { guessRaag } from "../../analysis/raagGuess";
import type { HeldNote } from "../../analysis/summary";

const SW = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];
const short = (n: string) => n.replace(/^Raag\s+/i, "").replace(/\s*\(.*\)/, "");

export const RaagGuessPanel: React.FC<{ heldNotes: HeldNote[]; chosenRaag?: string }> = ({ heldNotes, chosenRaag }) => {
  const g = useMemo(() => guessRaag(heldNotes, RAAG_LIST), [heldNotes]);
  if (g.candidates.length === 0) {
    return (
      <section className="rg">
        <h3 className="rg-h">Which raag does this sound like?</h3>
        <p className="rg-muted">Not enough held notes to tell ({g.heldSec.toFixed(1)} s). Sing for longer, with notes held at least a quarter of a second.</p>
      </section>
    );
  }
  const [best, ...rest] = g.candidates;
  const verdict = g.confidence === "clear" ? "sounds like" : g.confidence === "likely" ? "most likely" : "might be";
  return (
    <section className="rg">
      <h3 className="rg-h">Which raag does this sound like?</h3>
      <p className="rg-lead">
        It {verdict} <b>{short(best.raag.name)}</b>
        {g.sameSwaras.length > 0 && <> or {g.sameSwaras.slice(0, 3).map(r => short(r.name)).join(", ")}, which use exactly the same swaras and differ in phrasing</>}.
        {chosenRaag && short(chosenRaag) !== short(best.raag.name) && !g.sameSwaras.some(r => short(r.name) === short(chosenRaag)) && <> You chose {short(chosenRaag)}.</>}
      </p>
      <ol className="rg-list">
        {[best, ...rest.slice(0, 3)].map(c => (
          <li key={c.raag.id}>
            <span className="rg-name">{short(c.raag.name)}</span>
            <span className="rg-why">
              {Math.round(c.inRaag * 100)}% of held time on its swaras, {Math.round(c.coverage * 100)}% of its swaras used
              {c.movement !== null && <>, {Math.round(c.movement * 100)}% of steps follow its aroh and avaroh</>}
              {c.outside.length > 0 && <>; outside it: {c.outside.map(s => SW[s]).join(", ")}</>}
            </span>
          </li>
        ))}
      </ol>
      <p className="rg-muted">
        A guess from which swaras you held and how you moved between them, not a trained model. Raags that share swaras are told apart by
        their phrases, which this does not judge. Tested on the alaap and compositions in the app: the right raag, or one with the same swaras, came first for all 9.
      </p>
    </section>
  );
};
