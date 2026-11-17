/** Three-way language switch, each language written in its own script. */
import React from "react";
import { LANGS } from "./strings";
import { useLang } from "./lang";

export const LangPicker: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`ln-lang ${className ?? ""}`} role="group" aria-label={t.langLabel}>
      {LANGS.map(l => (
        <button key={l.id} type="button" lang={l.id} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
          {l.name}
        </button>
      ))}
    </div>
  );
};
