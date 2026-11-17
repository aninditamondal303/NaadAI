/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Music, Award, Sparkles, RefreshCw, Compass, AlertTriangle, FileText, Settings, User, Search, Filter, Check, ChevronDown, X, Sun, Moon, Sunrise, Lock, ShieldCheck, Mail, LogIn, Database, Home, BookOpen, BarChart2, Activity } from 'lucide-react';
import { createProfile, currentProfile, loadProfiles, setCurrentProfile, updateProfile, type SingerProfile } from './lib/profiles';
import { Landing } from './components/landing/Landing';
import { SharedTakeView } from './components/SharedTakeView';
import { MethodPage } from './components/landing/MethodPage';
import { useLang } from './i18n/lang';
import { LangPicker } from './i18n/LangPicker';
import './app-shell.css';
import { SingerGate } from './components/landing/SingerGate';
import { loadHistory, onHistoryChange } from './lib/practiceHistory';
import { practiceStreakDays } from './lib/stats';
import { RAAG_LIST } from './data/allRaags';

// Tab screens load on demand, so the welcome page appears quickly on phones.
// They are fetched in the background soon after, so they are ready (and cached
// for offline use) before they are opened.
const loadTabs = {
  home: () => import('./components/HomeTab').then(m => ({ default: m.HomeTab })),
  tanpura: () => import('./components/TanpuraTab').then(m => ({ default: m.TanpuraTab })),
  analyzer: () => import('./components/AnalyzerTab').then(m => ({ default: m.AnalyzerTab })),
  journal: () => import('./components/JournalTab').then(m => ({ default: m.JournalTab })),
  progress: () => import('./components/ProgressTab').then(m => ({ default: m.ProgressTab })),
  library: () => import('./components/LibraryTab').then(m => ({ default: m.LibraryTab })),
  profile: () => import('./components/ProfileTab').then(m => ({ default: m.ProfileTab })),
  practice: () => import('./components/PracticeTab').then(m => ({ default: m.PracticeTab })),
};
const HomeTab = lazy(loadTabs.home);
const TanpuraTab = lazy(loadTabs.tanpura);
const AnalyzerTab = lazy(loadTabs.analyzer);
const JournalTab = lazy(loadTabs.journal);
const ProgressTab = lazy(loadTabs.progress);
const LibraryTab = lazy(loadTabs.library);
const ProfileTab = lazy(loadTabs.profile);
const PracticeTab = lazy(loadTabs.practice);
import type { AnalyzerMode } from './components/AnalyzerTab';
import type { AppTab } from './types';

const RAAGS = RAAG_LIST;

export default function App() {
  useEffect(() => {
    const id = window.setTimeout(() => { for (const load of Object.values(loadTabs)) load().catch(() => {}); }, 2500);
    return () => window.clearTimeout(id);
  }, []);
  const { lang, t } = useLang();
  const [baseTonicHz, setBaseTonicHz] = useState<number>(130.81); // default Male standard Sa (C3)
  const [selectedRaagIdx, setSelectedRaagIdx] = useState<number>(0); // default Yaman
  const [selectedTuning, setSelectedTuning] = useState<"Pa" | "Ma" | "Ni">("Pa");
  
  // Custom theme and onboarding welcome states
  const [currentTheme, setCurrentTheme] = useState<"peacock" | "sunset" | "monsoon" | "midnight">("midnight");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>("welcome"); // "welcome" | "profiles"
  const [vocalistName, setVocalistName] = useState<string>("");
  const [dashboardView, setDashboardView] = useState<"practice" | "informatics">("practice");
  
  // Seven active menu tabs for classical musicians
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [analyzerMode, setAnalyzerMode] = useState<AnalyzerMode>("singing");
  const [practiceMode, setPracticeMode] = useState<"palta" | "pakad" | "ear" | "match" | "guru">("palta");

  // Custom raga selection and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThaatFilter, setSelectedThaatFilter] = useState("All");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // The active singer (profiles live in this browser; see src/lib/profiles.ts)
  const [profileId, setProfileId] = useState<string | null>(null);

  const enterProfile = (p: SingerProfile) => {
    setProfileId(p.id);
    setVocalistName(p.name);
    setBaseTonicHz(p.saHz);
    setStreakDays(practiceStreakDays(loadHistory()));
    setIsAuthenticated(true);
    setActiveTab("home");
  };

  // The last singer on this device, offered on the welcome page
  const returning = isAuthenticated ? null : currentProfile();
  // A take shared as a link (#take=...) opens in a read-only view
  const [showMethod, setShowMethod] = useState(() => window.location.hash === "#how-it-works");
  useEffect(() => {
    const on = () => setShowMethod(window.location.hash === "#how-it-works");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const [sharedCode, setSharedCode] = useState<string | null>(() => (window.location.hash.startsWith("#take=") ? window.location.hash.slice(6) : null));
  // Opened from "See the full analysis" on the welcome page
  const [autoDemo, setAutoDemo] = useState(false);
  useEffect(() => { if (activeTab !== "analyzer") setAutoDemo(false); }, [activeTab]);

  // Riyaz streak: consecutive days with saved practice in this browser
  const [streakDays, setStreakDays] = useState<number>(() => practiceStreakDays(loadHistory()));
  useEffect(() => onHistoryChange(() => setStreakDays(practiceStreakDays(loadHistory()))), []);

  const activeRaag = RAAGS[selectedRaagIdx];

  const handleTonicChange = (newHz: number) => {
    setBaseTonicHz(newHz);
    if (profileId) updateProfile(profileId, { saHz: newHz });
  };

  /**
   * Helper updating Taal metronome offsets dynamically to synchronize radar indicators
   */
  const handleTaalStatsChange = (stats: { layaAccuracy: number; driftMs: number } | any) => {
    // If the metronome has a high-quality run, feed stats into active attempt
  };

  if (showMethod && !isAuthenticated) {
    return <MethodPage onBack={() => { window.location.hash = ""; setShowMethod(false); }} onOpenApp={() => { window.location.hash = ""; setShowMethod(false); if (returning) enterProfile(returning); else setActivePage("profiles"); }} />;
  }

  if (sharedCode) {
    return <SharedTakeView code={sharedCode} onOpenApp={() => { window.history.replaceState(null, "", window.location.pathname); setSharedCode(null); }} />;
  }

  if (!isAuthenticated) {
    if (activePage === "welcome") {
      return (
        <Landing
          returningName={returning?.name ?? null}
          onOpenApp={() => (returning ? enterProfile(returning) : setActivePage("profiles"))}
          onDemoAnalysis={() => {
            const p = returning ?? loadProfiles().find(x => x.name === "Guest") ?? createProfile("Guest", 130.81);
            setCurrentProfile(p.id);
            enterProfile(p);
            setAnalyzerMode("singing");
            setAutoDemo(true);
            setActiveTab("analyzer");
          }}
        />
      );
    }
    return <SingerGate onBack={() => setActivePage("welcome")} onChosen={enterProfile} />;
  }

  return (
    <div id="app" lang={lang} className="app-shell min-h-screen flex flex-col relative antialiased text-slate-100">
      <header className="app-top">
        <span className="app-mark"><span className="app-mark-script">{lang === "bn" ? "নাদ" : "नाद"}</span> Naad AI</span>
        <nav className="app-tabs" aria-label="Sections">
          {(["home", "tanpura", "analyzer", "practice", "journal", "progress", "library", "profile"] as const).map(id => (
            <button key={id} type="button" aria-current={activeTab === id ? "page" : undefined}
              onClick={() => setActiveTab(id)}>{t.tabs[id]}</button>
          ))}
        </nav>
        <div className="app-side">
          <span className="app-who">{vocalistName}{streakDays > 0 ? `, ${t.streak(streakDays)}` : ""}</span>
          <LangPicker />
          <button type="button" className="app-switch"
            onClick={() => { setCurrentProfile(null); setProfileId(null); setIsAuthenticated(false); setActivePage("profiles"); }}>
            {t.switchSinger}
          </button>
        </div>
      </header>
      {t.englishOnlyNote && <p className="app-note">{t.englishOnlyNote}</p>}

      <main className="app-main relative z-10 flex-grow max-w-7xl w-full mx-auto px-6 py-6 font-sans">
        <Suspense fallback={<p className="text-sm text-slate-400 py-10">…</p>}>
        {activeTab === "home" && (
          <HomeTab 
            setActiveTab={setActiveTab} 
            setAnalyzerMode={setAnalyzerMode}
            setPracticeMode={setPracticeMode}
            vocalistName={vocalistName} 
            baseTonicHz={baseTonicHz} 
          />
        )}
        {activeTab === "tanpura" && (
          <TanpuraTab 
            baseTonicHz={baseTonicHz} 
            onTonicChange={handleTonicChange} 
            selectedTuning={selectedTuning}
            onTuningChange={setSelectedTuning}
          />
        )}
        {activeTab === "analyzer" && (
          <AnalyzerTab 
            baseTonicHz={baseTonicHz} 
            onTonicChange={handleTonicChange} 
            initialMode={analyzerMode}
            autoDemo={autoDemo}
          />
        )}
        {activeTab === "journal" && <JournalTab />}
        {activeTab === "progress" && <ProgressTab />}
        {activeTab === "practice" && <PracticeTab baseTonicHz={baseTonicHz} initialMode={practiceMode} />}
        {activeTab === "library" && <LibraryTab saHz={baseTonicHz} />}
        {activeTab === "profile" && <ProfileTab baseTonicHz={baseTonicHz} vocalistName={vocalistName} profileId={profileId}
          onDeleted={() => { setProfileId(null); setIsAuthenticated(false); setActivePage("profiles"); }} />}
        </Suspense>
      </main>


    </div>
  );
}
