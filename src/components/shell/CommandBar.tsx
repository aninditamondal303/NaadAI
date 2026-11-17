/**
 * Quick find (Ctrl+K, or the search button): jump to any screen or open any
 * raag by typing a few letters of its name, thaat or swaras.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import type { AppTab } from "../../types";
import { RAAG_LIST } from "../../data/allRaags";
import { useLang } from "../../i18n/lang";
import { useUi } from "../../i18n/ui";
import { PRIMARY, SECONDARY } from "./Nav";

type Hit =
  | { kind: "screen"; id: AppTab; label: string; icon: React.ReactNode }
  | { kind: "raag"; id: string; label: string; sub: string };

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^raag\s+/, "");

export const CommandBar: React.FC<{ open: boolean; onClose: () => void; onScreen: (t: AppTab) => void; onRaag: (id: string) => void }> = ({ open, onClose, onScreen, onRaag }) => {
  const { t } = useLang();
  const u = useUi();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { if (open) { setQ(""); setSel(0); requestAnimationFrame(() => inputRef.current?.focus()); } }, [open]);

  const hits: Hit[] = useMemo(() => {
    const f = fold(q.trim());
    const screens: Hit[] = [...PRIMARY, ...SECONDARY].map(it => ({ kind: "screen", id: it.id, label: t.tabs[it.id], icon: it.icon }));
    const raags: Hit[] = RAAG_LIST.map(r => ({ kind: "raag", id: r.id, label: r.name.replace(/^Raag\s+/i, "").replace(/\s*\(.*\)/, ""), sub: `${r.thaat}, ${r.aroha.join(" ")}` }));
    if (!f) return [...screens, ...raags.slice(0, 6)];
    const score = (h: Hit) => {
      const name = fold(h.label);
      if (name.startsWith(f)) return 3;
      if (name.split(/\s+/).some(w => w.startsWith(f))) return 2;
      if (name.includes(f) || (h.kind === "raag" && fold(h.sub).includes(f))) return 1;
      return 0;
    };
    return [...screens, ...raags].map(h => [score(h), h] as const).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).map(([, h]) => h).slice(0, 12);
  }, [q, t]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" }); }, [sel]);

  if (!open) return null;
  const choose = (h: Hit | undefined) => {
    if (!h) return;
    onClose();
    if (h.kind === "screen") onScreen(h.id); else onRaag(h.id);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(hits.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(hits[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };
  const firstRaag = hits.findIndex(h => h.kind === "raag");
  const firstScreen = hits.findIndex(h => h.kind === "screen");

  return (
    <div className="cb-scrim" onMouseDown={onClose}>
      <div className="cb" role="dialog" aria-modal="true" aria-label={u("findLabel")} onMouseDown={e => e.stopPropagation()}>
        <div className="cb-field">
          <Search size={18} aria-hidden />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder={u("findPlaceholder")}
            role="combobox" aria-expanded="true" aria-controls="cb-list" aria-activedescendant={hits[sel] ? `cb-${sel}` : undefined} aria-autocomplete="list" />
          <kbd className="cb-esc">Esc</kbd>
        </div>
        <ul id="cb-list" ref={listRef} className="cb-list" role="listbox">
          {hits.length === 0 && <li className="cb-empty">{u("findNone", q)}</li>}
          {hits.map((h, i) => (
            <React.Fragment key={h.kind + h.id}>
              {i === firstScreen && <li className="cb-group" role="presentation">{u("findScreens")}</li>}
              {i === firstRaag && <li className="cb-group" role="presentation">{u("findRaags")}</li>}
              <li id={`cb-${i}`} data-i={i} role="option" aria-selected={i === sel} className="cb-item"
                onMouseMove={() => setSel(i)} onClick={() => choose(h)}>
                {h.kind === "screen" ? <span className="cb-ico">{h.icon}</span> : <span className="cb-ico cb-ico-raag" aria-hidden>{h.label[0]}</span>}
                <span className="cb-text">
                  <span className="cb-label">{h.label}</span>
                  {h.kind === "raag" && <span className="cb-sub">{h.sub}</span>}
                </span>
                {i === sel && <CornerDownLeft size={15} aria-hidden className="cb-enter" />}
              </li>
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
};
