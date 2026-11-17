/** Choosing or adding a singer, in the welcome page's night colours. */
import React from "react";
import { ProfilePicker } from "../ProfilePicker";
import type { SingerProfile } from "../../lib/profiles";
import { SKIES } from "./sky";
import "./landing.css";
import { useLang } from "../../i18n/lang";
import { LangPicker } from "../../i18n/LangPicker";

export const SingerGate: React.FC<{ onBack: () => void; onChosen: (p: SingerProfile) => void }> = ({ onBack, onChosen }) => {
  const sky = SKIES.night;
  const { lang, t } = useLang();
  const vars = {
    "--sky-top": sky.top, "--sky-bottom": sky.bottom, "--ink": sky.ink, "--muted": sky.muted,
    "--line": sky.line, "--line-strong": sky.lineStrong, "--voice": sky.voice,
    "--btn-bg": sky.buttonBg, "--btn-ink": sky.buttonInk,
  } as React.CSSProperties;
  return (
    <div className="ln ln-gate" style={vars} lang={lang}>
      <header className="ln-top">
        <span className="ln-mark"><span className="ln-mark-deva">{lang === "bn" ? "নাদ" : "नाद"}</span> Naad AI</span>
        <nav className="ln-nav" aria-label="Page">
          <LangPicker />
          <button type="button" className="ln-open" onClick={onBack}>{t.gate.back}</button>
        </nav>
      </header>
      <main className="ln-gate-main">
        <ProfilePicker onChosen={onChosen} />
      </main>
    </div>
  );
};
