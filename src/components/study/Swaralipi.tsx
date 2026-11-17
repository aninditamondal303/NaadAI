/**
 * Bhatkhande-style swaralipi: one row per avartan, matras grouped by vibhag,
 * swaras with their marks (komal underlined, tivra Ma with a line above,
 * a dot below for mandra and above for taar), the words under the swaras
 * and the taal marks (X, 0, 2, 3) under the first matra of each vibhag.
 */
import React from "react";
import { clapAt, type Taal } from "../../data/taals";
import { parseLine } from "../../practice/swaralipi";
import { parseNote, type SargamNote } from "../../practice/notation";

export type NoteScript = "deva" | "beng" | "latin";

const DEVA = ["सा", "रे", "रे", "ग", "ग", "म", "म", "प", "ध", "ध", "नि", "नि"];
const BENG = ["সা", "রে", "রে", "গা", "গা", "মা", "মা", "পা", "ধা", "ধা", "নি", "নি"];
const KOMAL = new Set([1, 3, 8, 10]);

export const Note: React.FC<{ n: SargamNote; script: NoteScript }> = ({ n, script }) => {
  const cls = ((n.semitones % 12) + 12) % 12;
  const oct = Math.floor(n.semitones / 12);
  const text = script === "latin" ? n.label.replace(/[,']/g, "") : (script === "beng" ? BENG : DEVA)[cls];
  const c = ["sl-n"];
  if (script !== "latin" && KOMAL.has(cls)) c.push("sl-komal");
  if (script !== "latin" && cls === 6) c.push("sl-tivra");
  if (oct < 0) c.push("sl-mandra");
  if (oct > 0) c.push("sl-taar");
  return <span className={c.join(" ")}>{text}</span>;
};

/** A phrase of sargam (alaap or generated), "-" shown as ऽ. */
export const Phrase: React.FC<{ text: string; script: NoteScript; active?: boolean }> = ({ text, script, active }) => (
  <span className={`sl-phrase${active ? " sl-active" : ""}`}>
    {text.trim().split(/\s+/).map((tok, i) =>
      tok === "-" ? <span key={i} className="sl-hold">{script === "latin" ? "–" : "ऽ"}</span>
        : tok === "|" ? <span key={i} className="sl-bar">|</span>
          : <Note key={i} n={parseNote(tok)} script={script} />)}
  </span>
);

interface Props {
  taal: Taal;
  lines: { notes: string; words?: string }[];
  script: NoteScript;
  /** Global matra index being played (across all lines), or null. */
  playing: number | null;
  /** Matras before these lines (when several blocks are played in order). */
  offset: number;
}

export const Swaralipi: React.FC<Props> = ({ taal, lines, script, playing, offset }) => {
  const groups: number[][] = [];
  let start = 0;
  for (const v of taal.vibhags) { groups.push(Array.from({ length: v }, (_, k) => start + k)); start += v; }
  return (
    <div className="sl" role="table" aria-label="Swaralipi">
      {lines.map((line, li) => {
        const matras = parseLine(line.notes);
        const words = line.words?.trim().split(/\s+/);
        return (
          <div key={li} className="sl-row" role="row">
            {groups.map((g, gi) => (
              <div key={gi} className="sl-vibhag">
                {g.map(k => {
                  const m = matras[k];
                  const on = playing === offset + li * taal.matras + k;
                  const clap = clapAt(taal, k + 1);
                  return (
                    <div key={k} className={`sl-cell${on ? " sl-on" : ""}`} role="cell">
                      <span className="sl-notes">
                        {m.kind === "notes" ? m.notes.map((n, j) => <Note key={j} n={n} script={script} />)
                          : m.kind === "hold" ? <span className="sl-hold">{script === "latin" ? "–" : "ऽ"}</span> : <span className="sl-empty" />}
                      </span>
                      {words && <span className="sl-word" lang="hi">{words[k] === "-" ? "ऽ" : words[k]}</span>}
                      <span className="sl-clap">{clap === null ? "" : clap}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
