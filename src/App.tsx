/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Music, Award, Sparkles, RefreshCw, Compass, AlertTriangle, FileText, Settings, User, Search, Filter, Check, ChevronDown, X, Sun, Moon, Sunrise, Lock, ShieldCheck, Mail, LogIn, Database, Home, BookOpen, BarChart2, Activity } from 'lucide-react';
import { ProfilePicker } from './components/ProfilePicker';
import { currentProfile, setCurrentProfile, updateProfile, type SingerProfile } from './lib/profiles';
import { loadHistory, onHistoryChange } from './lib/practiceHistory';
import { practiceStreakDays } from './lib/stats';
import { RAAG_LIST } from './data/allRaags';
import { Backdrop } from './components/Backdrop';

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

  // Continue with the last singer on this device, if any
  useEffect(() => {
    const p = currentProfile();
    if (p) enterProfile(p);
  }, []);

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

    return (
      <div className={`min-h-screen relative flex flex-col justify-between font-sans text-slate-100 antialiased transition-colors duration-1000 theme-${currentTheme} bg-[#031115]`}>
        {/* Dynamic Canvas Backgrounds */}
        <Backdrop timeOfDay="Sunrise (6 AM - 9 AM)" themeId={currentTheme} />

        {/* Public Landing Area Header */}
        <header className="relative z-20 border-b border-teal-950/40 bg-slate-950/60 backdrop-blur-md px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            
            {/* Logo and Brand Title */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-cyan-950/20">
                <span className="font-serif text-lg font-bold text-slate-950 leading-none">ॐ</span>
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-0.5">
                  Naad AI
                </h1>
              </div>
            </div>

            {/* Quick Public Pages and Preset switcher right */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 border border-teal-950/60 bg-teal-950/10 px-2 py-1 rounded-xl">
                {["peacock", "sunset", "monsoon"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCurrentTheme(t as any)}
                    className={`h-3 w-3 rounded-full transition-all cursor-pointer ${
                      t === "peacock" ? "bg-teal-500" : t === "sunset" ? "bg-amber-605" : "bg-emerald-500"
                    } ${currentTheme === t ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950" : ""}`}
                    title={`Attune theme preset: ${t}`}
                  />
                ))}
              </div>

              {activePage !== "welcome" ? (
                <button
                  type="button"
                  onClick={() => setActivePage("welcome")}
                  className="px-3.5 py-1.5 rounded-xl border border-teal-900 bg-teal-950/20 text-teal-300 font-mono text-xs font-bold hover:bg-teal-950/60 transition-all cursor-pointer"
                >
                  ← Home
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePage("profiles")}
                    className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Choose singer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage("profiles")}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 text-xs font-mono font-bold transition-all shadow-lg hover:-translate-y-0.5 duration-300 cursor-pointer"
                  >
                    Start
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Public Website Screen Contents */}
        <main className="relative z-10 max-w-7xl w-full mx-auto px-4 py-8 flex-grow">
          {activePage === "welcome" ? (
            <div className="space-y-16">
              
              {/* 1. Hero Introduction Section */}
              <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-900 bg-teal-950/40 text-teal-450 text-xs font-mono tracking-wider font-extrabold uppercase animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  Riyaz companion for Hindustani vocalists
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight font-serif text-white">
                  Sing. See every swara. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-300 to-emerald-400">
                    Improve your sur.
                  </span>
                </h2>
                <p className="text-slate-300 md:text-sm leading-relaxed max-w-2xl mx-auto font-sans">
                  Naad AI listens while you practise and shows how closely you hold each swara, measured in cents against your own Sa. It plays the tanpura and taal for you, so you only need a microphone and earphones.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setActivePage("profiles")}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 text-sm font-mono font-bold uppercase tracking-wider hover:opacity-90 shadow-xl transition-all hover:-translate-y-0.5 duration-300 cursor-pointer"
                  >
                    Start practising
                  </button>
                </div>
              </div>

              {/* 2. Three Pillars Overview Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="bg-slate-950/70 border border-teal-950/60 p-6 rounded-2xl space-y-3 shadow-xl hover:border-teal-700/50 transition-all duration-300">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500 text-teal-400 flex items-center justify-center">
                    <Music className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-white">Interactive Swara Pitch Tuner</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Shows the pitch you are singing, live, as a swara and how many cents sharp or flat it is from your Sa.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-teal-950/60 p-6 rounded-2xl space-y-3 shadow-xl hover:border-teal-700/50 transition-all duration-300">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500 text-cyan-400 flex items-center justify-center">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-white">Practice Profile</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Keeps your Sa and your practice history, so you can see how your swaras change over weeks of riyaz.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-teal-950/60 p-6 rounded-2xl space-y-3 shadow-xl hover:border-teal-700/50 transition-all duration-350">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500 text-emerald-400 flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-white">Practice Journal</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Log your daily riyaz and mark off the lessons you have completed.
                  </p>
                </div>
              </div>

              {/* 3. The 10 Fundamental Thaats Section */}
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold font-serif text-white">The 10 Parent Scales (Thaats)</h3>
                  <p className="text-slate-400 text-xs max-w-lg mx-auto font-sans">
                    Bhatkhande's ten parent scales, used to group raags by their swaras.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 text-center">
                  {[
                    { name: "Bilawal", notes: "All Shuddh notes" },
                    { name: "Kalyan", notes: "Teevra Madhyam (Ma#)" },
                    { name: "Khamaj", notes: "Komal Nishad (Ni_)" },
                    { name: "Kafi", notes: "Komal Ga & Komal Ni" },
                    { name: "Asavari", notes: "Komal Ga, Dha, Ni" },
                    { name: "Bhairav", notes: "Komal Re & Komal Dha" },
                    { name: "Bhairavi", notes: "All Komal Swaras" },
                    { name: "Todi", notes: "Komal Re, Ga, Dha & Teevra Ma" },
                    { name: "Poorvi", notes: "Komal Re, Dha & Teevra Ma" },
                    { name: "Marwa", notes: "Komal Re & Teevra Ma" }
                  ].map((titem, ind) => (
                    <div key={titem.name} className="p-3.5 rounded-xl border border-teal-950/50 bg-[#08181f]/40 space-y-1">
                      <span className="text-[10px] uppercase font-mono font-extrabold text-teal-400">Thaat {ind + 1}</span>
                      <h4 className="font-serif font-bold text-slate-100 text-sm leading-tight">{titem.name}</h4>
                      <p className="text-[9px] text-slate-400 tracking-tight leading-normal font-mono">{titem.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. FAQs Interactive Sections */}
              <div className="space-y-4 max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold font-serif text-white text-center">Frequently Asked Questions</h3>
                {[
                  {
                    q: "Do I need any special equipment?",
                    a: "No. A laptop or phone microphone is enough. Please use earphones, so the app's tanpura does not leak into the microphone and confuse the pitch reading."
                  },
                  {
                    q: "Is standard C3 (Male) and G3 (Female) supported?",
                    a: "Yes. You can pick a common Sa such as C3 (male) or G3 (female), or set your exact Sa in Hertz with the slider."
                  },
                  {
                    q: "How does the pitch tuner detect microtones?",
                    a: "It measures the pitch of your voice many times a second and compares it with your Sa. The difference is shown in cents (100 cents = one semitone), so you can see whether a swara is sharp or flat."
                  },
                  {
                    q: "Where is my data stored?",
                    a: "Only in this browser. Each singer on the device has their own profile, Sa and practice history; there are no passwords and nothing is uploaded. Recordings are analysed in the browser. You can export a profile to move it to another device."
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-b border-teal-950/40 pb-3">
                    <h4 className="text-sm font-bold text-teal-300 font-serif mb-1">✦ {faq.q}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed pr-4 font-sans">{faq.a}</p>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            
            <ProfilePicker onChosen={enterProfile} />
          )}
        </main>

        {/* Public Landing Area Footer */}
        <footer className="relative z-20 border-t border-teal-950/40 py-4 text-center text-[10px] font-mono tracking-wider bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <span>ॐ नादब्रह्मणे नमः</span>
            <span>Naad AI · student project · © 2026</span>
          </div>
        </footer>

      </div>
    );
  }

  return (
    <div id="midnight-mehfil-portal" className="min-h-screen flex flex-col font-sans relative antialiased bg-[#0F1115] text-slate-100 selection:bg-[#7C3AED]/20">
      
      {/* Decorative background grid overlays */}
      <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none z-0" />

      {/* Modern, elegant Midnight Mehfil header */}
      <header className="relative z-20 border-b border-[#7C3AED]/25 bg-[#151A2E]/85 backdrop-blur-md px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30 select-none">
              <span className="font-serif text-lg font-bold text-slate-950 leading-none">ॐ</span>
            </div>
            <div>
              <h1 className="text-xl font-serif font-black text-slate-100 tracking-wide">Naad AI</h1>
              <p className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-widest font-bold">Classical Riyaz Companion</p>
            </div>
          </div>

          {/* Core navigation tabs */}
          <nav className="w-full md:w-auto flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible justify-start md:justify-center gap-1 pb-1 md:pb-0 font-mono text-[11px] font-bold">
            {[
              { id: "home", label: "Home", icon: Home },
              { id: "tanpura", label: "Tanpura & Taal", icon: Music },
              { id: "analyzer", label: "Analyzer", icon: Activity },
              { id: "practice", label: "Paltas", icon: Award },
              { id: "journal", label: "Journal", icon: BookOpen },
              { id: "progress", label: "Progress", icon: BarChart2 },
              { id: "library", label: "Library", icon: Compass },
              { id: "profile", label: "Profile", icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#7C3AED] text-slate-950 font-black shadow-lg shadow-[#7C3AED]/25 scale-102"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/35"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Stats right bar */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Streak</span>
              <span className="text-[#FBBF24] font-black">{streakDays} {streakDays === 1 ? "Day" : "Days"}</span>
            </div>
            <button
              onClick={() => { setCurrentProfile(null); setProfileId(null); setIsAuthenticated(false); setActivePage("profiles"); }}
              className="px-3 py-1.5 rounded-xl border border-slate-850 bg-[#0F1115] hover:border-[#7C3AED]/50 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
            >
              Switch singer
            </button>
          </div>

        </div>
      </header>

      {/* Main active sub-page view container */}
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
          />
        )}
        {activeTab === "journal" && <JournalTab />}
        {activeTab === "progress" && <ProgressTab />}
        {activeTab === "practice" && <PracticeTab baseTonicHz={baseTonicHz} initialMode={practiceMode} />}
        {activeTab === "library" && <LibraryTab />}
        {activeTab === "profile" && <ProfileTab baseTonicHz={baseTonicHz} vocalistName={vocalistName} profileId={profileId}
          onDeleted={() => { setProfileId(null); setIsAuthenticated(false); setActivePage("profiles"); }} />}
      </main>

      {/* Aesthetic classical credits footer */}
      <footer className="relative z-20 border-t border-[#7C3AED]/20 py-4 text-center text-[10px] font-mono tracking-wider bg-[#0F1115]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2 text-slate-500">
          <span>ॐ नादब्रह्मणे नमः</span>
          <span>Naad AI · student project · © 2026</span>
        </div>
      </footer>

    </div>
  );
}
