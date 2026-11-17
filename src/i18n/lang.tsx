/** The chosen language, remembered in this browser. */
import React, { createContext, useContext, useEffect, useState } from "react";
import { STRINGS, type Lang, type Strings } from "./strings";

const KEY = "naad.lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "hi" || saved === "bn") return saved;
  } catch { /* storage unavailable */ }
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("bn")) return "bn";
  if (nav.startsWith("hi")) return "hi";
  return "en";
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Strings }>({
  lang: "en", setLang: () => {}, t: STRINGS.en,
});

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(initialLang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  };
  return <Ctx.Provider value={{ lang, setLang, t: STRINGS[lang] }}>{children}</Ctx.Provider>;
};

export const useLang = () => useContext(Ctx);
