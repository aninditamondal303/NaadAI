/**
 * The app's navigation: a sidebar on wide screens, and on phones a bottom tab
 * bar with the five practice screens plus an account sheet for the rest.
 */
import React, { useEffect, useRef } from "react";
import { Search, AudioWaveform, BookOpenText, ChevronRight, Info, LibraryBig, ListMusic, NotebookPen, Sunrise, TrendingUp, UserRound, Users, X } from "lucide-react";
import type { AppTab } from "../../types";
import { useLang } from "../../i18n/lang";
import { LANGS } from "../../i18n/strings";
import { useUi } from "../../i18n/ui";

/** A tanpura: gourd, neck and strings, drawn to sit with the other line icons. */
export const TanpuraIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M10.4 2.5h3.2" />
    <path d="M10.6 2.5 10.3 13.4M13.4 2.5l.3 10.9" />
    <path d="M10.3 13.4C6.9 14.3 5.5 16.3 5.5 18.2 5.5 20.6 8.3 22 12 22s6.5-1.4 6.5-3.8c0-1.9-1.4-3.9-4.8-4.8" />
    <path d="M11.4 5v13.5M12.6 5v13.5" />
    <path d="M9.5 19.2h5" />
  </svg>
);

type Item = { id: AppTab; icon: React.ReactNode };
const ICON = 20;
export const PRIMARY: Item[] = [
  { id: "home", icon: <Sunrise size={ICON} strokeWidth={1.75} aria-hidden /> },
  { id: "tanpura", icon: <TanpuraIcon size={ICON} /> },
  { id: "analyzer", icon: <AudioWaveform size={ICON} strokeWidth={1.75} aria-hidden /> },
  { id: "practice", icon: <ListMusic size={ICON} strokeWidth={1.75} aria-hidden /> },
  { id: "library", icon: <LibraryBig size={ICON} strokeWidth={1.75} aria-hidden /> },
];
export const SECONDARY: Item[] = [
  { id: "progress", icon: <TrendingUp size={ICON} strokeWidth={1.75} aria-hidden /> },
  { id: "journal", icon: <NotebookPen size={ICON} strokeWidth={1.75} aria-hidden /> },
  { id: "profile", icon: <UserRound size={ICON} strokeWidth={1.75} aria-hidden /> },
];

export interface NavProps {
  active: AppTab;
  onGo: (t: AppTab) => void;
  name: string;
  saLabel: string;
  streakDays: number;
  onSwitchSinger: () => void;
  onMethod: () => void;
  onFind: () => void;
}

export const Wordmark: React.FC = () => {
  const { lang } = useLang();
  return (
    <span className="nv-mark">
      <span className="nv-mark-script" lang={lang === "bn" ? "bn" : "hi"}>{lang === "bn" ? "নাদ" : "नाद"}</span>
      <span className="nv-mark-latin">Naad AI</span>
    </span>
  );
};

const Avatar: React.FC<{ name: string; size?: "sm" | "lg" }> = ({ name, size = "sm" }) => (
  <span className={`nv-avatar nv-avatar-${size}`} aria-hidden="true">{(name.trim()[0] ?? "?").toUpperCase()}</span>
);

const LangSwitch: React.FC = () => {
  const { lang, setLang, t } = useLang();
  return (
    <div className="nv-lang" role="group" aria-label={t.langLabel}>
      {LANGS.map(l => (
        <button key={l.id} type="button" lang={l.id} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.name}</button>
      ))}
    </div>
  );
};

/** Wide screens: a fixed sidebar. */
export const Sidebar: React.FC<NavProps> = ({ active, onGo, name, saLabel, streakDays, onSwitchSinger, onMethod, onFind }) => {
  const { t } = useLang();
  const u = useUi();
  const link = (it: Item) => (
    <li key={it.id}>
      <button type="button" className="nv-link" aria-current={active === it.id ? "page" : undefined} onClick={() => onGo(it.id)}>
        {it.icon}<span>{t.tabs[it.id]}</span>
      </button>
    </li>
  );
  return (
    <aside className="nv-side" aria-label={u("navLabel")}>
      <div className="nv-side-top"><Wordmark /></div>
      <button type="button" className="nv-find" onClick={onFind}>
        <Search size={16} strokeWidth={1.9} aria-hidden /><span>{u("findShort")}</span><kbd className="nv-kbd">{navigator.platform.includes("Mac") ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <nav>
        <ul className="nv-list">{PRIMARY.map(link)}</ul>
        <ul className="nv-list nv-list-2">{SECONDARY.map(link)}</ul>
      </nav>
      <div className="nv-side-foot">
        <button type="button" className="nv-quiet" onClick={onMethod}><Info size={16} strokeWidth={1.75} aria-hidden />{u("howItWorks")}</button>
        <LangSwitch />
        <div className="nv-me">
          <Avatar name={name} />
          <div className="nv-me-text">
            <span className="nv-me-name">{name}</span>
            <span className="nv-me-sub">{streakDays > 0 ? t.streak(streakDays) : saLabel}</span>
          </div>
          <button type="button" className="nv-icon-btn" onClick={onSwitchSinger} aria-label={t.switchSinger} title={t.switchSinger}>
            <Users size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
};

/** Phones: top bar with the account button, and a bottom tab bar. */
export const MobileNav: React.FC<NavProps & { sheetOpen: boolean; setSheetOpen: (b: boolean) => void }> = props => {
  const { active, onGo, name, saLabel, streakDays, onSwitchSinger, onMethod, onFind, sheetOpen, setSheetOpen } = props;
  const { t } = useLang();
  const u = useUi();
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    sheetRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [sheetOpen, setSheetOpen]);
  const go = (id: AppTab) => { setSheetOpen(false); onGo(id); };
  const inSheet = SECONDARY.some(s => s.id === active);
  return (
    <>
      <header className="nv-bar">
        <Wordmark />
        <span className="nv-bar-actions">
        <button type="button" className="nv-icon-btn" onClick={onFind} aria-label={u("findLabel")}><Search size={20} strokeWidth={1.8} aria-hidden /></button>
        <button type="button" className="nv-me-btn" onClick={() => setSheetOpen(true)} aria-haspopup="dialog" aria-expanded={sheetOpen}
          aria-label={u("accountMenu", name)} data-active={inSheet || undefined}>
          {streakDays > 0 && <span className="nv-streak">{streakDays}</span>}
          <Avatar name={name} />
        </button>
        </span>
      </header>
      <nav className="nv-tabbar" aria-label={u("navLabel")}>
        {PRIMARY.map(it => (
          <button key={it.id} type="button" aria-current={active === it.id ? "page" : undefined} onClick={() => onGo(it.id)}>
            {it.icon}<span>{u(`short_${it.id}` as "short_home")}</span>
          </button>
        ))}
      </nav>
      {sheetOpen && (
        <div className="nv-scrim" onClick={() => setSheetOpen(false)}>
          <div ref={sheetRef} className="nv-sheet" role="dialog" aria-modal="true" aria-label={u("accountMenu", name)} onClick={e => e.stopPropagation()}>
            <div className="nv-sheet-grip" aria-hidden="true" />
            <div className="nv-sheet-head">
              <Avatar name={name} size="lg" />
              <div className="nv-me-text">
                <span className="nv-me-name">{name}</span>
                <span className="nv-me-sub">{saLabel}{streakDays > 0 ? `, ${t.streak(streakDays)}` : ""}</span>
              </div>
              <button type="button" className="nv-icon-btn" onClick={() => setSheetOpen(false)} aria-label={u("close")}><X size={20} aria-hidden /></button>
            </div>
            <ul className="nv-sheet-list">
              {SECONDARY.map(it => (
                <li key={it.id}>
                  <button type="button" aria-current={active === it.id ? "page" : undefined} onClick={() => go(it.id)}>
                    {it.icon}<span>{t.tabs[it.id]}</span><ChevronRight size={18} aria-hidden className="nv-chev" />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => { setSheetOpen(false); onMethod(); }}>
                  <BookOpenText size={ICON} strokeWidth={1.75} aria-hidden /><span>{u("howItWorks")}</span><ChevronRight size={18} aria-hidden className="nv-chev" />
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { setSheetOpen(false); onSwitchSinger(); }}>
                  <Users size={ICON} strokeWidth={1.75} aria-hidden /><span>{t.switchSinger}</span><ChevronRight size={18} aria-hidden className="nv-chev" />
                </button>
              </li>
            </ul>
            <div className="nv-sheet-lang"><span>{t.langLabel}</span><LangSwitch /></div>
          </div>
        </div>
      )}
    </>
  );
};
