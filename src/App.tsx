/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Music, Award, Sparkles, RefreshCw, Compass, AlertTriangle, FileText, Settings, User, Search, Filter, Check, ChevronDown, X, Sun, Moon, Sunrise, Lock, ShieldCheck, Mail, LogIn, Database, Home, BookOpen, BarChart2, Activity } from 'lucide-react';
import { createProfile, currentProfile, loadProfiles, setCurrentProfile, updateProfile, type SingerProfile } from './lib/profiles';
import { Landing } from './components/landing/Landing';
import { useLang } from './i18n/lang';
import { LangPicker } from './i18n/LangPicker';
import './app-shell.css';
import { SingerGate } from './components/landing/SingerGate';
import { loadHistory, onHistoryChange } from './lib/practiceHistory';
import { practiceStreakDays } from './lib/stats';
import { RAAG_LIST } from './data/allRaags';

// Modular Tab components
import { HomeTab } from './components/HomeTab';
import { TanpuraTab } from './components/TanpuraTab';
import { AnalyzerTab, type AnalyzerMode } from './components/AnalyzerTab';
import { JournalTab } from './components/JournalTab';
import { ProgressTab } from './components/ProgressTab';
import { LibraryTab } from './components/LibraryTab';
import { ProfileTab } from './components/ProfileTab';
import { PracticeTab } from './components/PracticeTab';
import type { AppTab } from './types';

const RAAGS = RAAG_LIST;

export default function App() {
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
  const [practiceMode, setPracticeMode] = useState<"palta" | "pakad" | "ear">("palta");

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

      <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-6 py-6 font-sans">
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
        {activeTab === "library" && <LibraryTab />}
        {activeTab === "profile" && <ProfileTab baseTonicHz={baseTonicHz} vocalistName={vocalistName} profileId={profileId}
          onDeleted={() => { setProfileId(null); setIsAuthenticated(false); setActivePage("profiles"); }} />}
      </main>


    </div>
  );
}
