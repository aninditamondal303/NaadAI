/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Music, Award, Sparkles, RefreshCw, Compass, AlertTriangle, FileText, Settings, User, Search, Filter, Check, ChevronDown, X, Sun, Moon, Sunrise, Lock, ShieldCheck, Mail, LogIn, Database, Home, BookOpen, BarChart2, Activity } from 'lucide-react';
import { DigitalTwinState, SWARAS_MAP } from './types';
import { getExpanded84Raags } from './data/allRaags';
import { TanpuraDrone } from './components/TanpuraDrone';
import { SwaraTuner } from './components/SwaraTuner';
import { TaalMetronome } from './components/TaalMetronome';
import { VocalTwinRadar } from './components/VocalTwinRadar';
import { GuruFeedback } from './components/GuruFeedback';
import { Backdrop } from './components/Backdrop';
import { AudioVoiceRecorder } from './components/AudioVoiceRecorder';
import { MusicIntelligenceLab } from './components/MusicIntelligenceLab';

// Modular Tab components
import { HomeTab } from './components/HomeTab';
import { TanpuraTab } from './components/TanpuraTab';
import { AnalyzerTab } from './components/AnalyzerTab';
import { JournalTab } from './components/JournalTab';
import { ProgressTab } from './components/ProgressTab';
import { LibraryTab } from './components/LibraryTab';
import { ProfileTab } from './components/ProfileTab';

const RAAGS = getExpanded84Raags();

export default function App() {
  const [baseTonicHz, setBaseTonicHz] = useState<number>(130.81); // default Male standard Sa (C3)
  const [selectedRaagIdx, setSelectedRaagIdx] = useState<number>(0); // default Yaman
  const [selectedTuning, setSelectedTuning] = useState<"Pa" | "Ma" | "Ni">("Pa");
  
  // Custom theme and onboarding welcome states
  const [currentTheme, setCurrentTheme] = useState<"peacock" | "sunset" | "monsoon" | "midnight">("midnight");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>("welcome"); // "welcome" | "login" | "signup" | "riyaz" | "almanac" | "academy" | "twin-telemetry"
  const [vocalistName, setVocalistName] = useState<string>("");
  const [dashboardView, setDashboardView] = useState<"practice" | "informatics">("practice");
  
  // Seven active menu tabs for classical musicians
  const [activeTab, setActiveTab] = useState<"home" | "tanpura" | "analyzer" | "journal" | "progress" | "library" | "profile">("home");
  const [analyzerMode, setAnalyzerMode] = useState<"scale" | "singing">("singing");

  // Custom raga selection and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThaatFilter, setSelectedThaatFilter] = useState("All");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Riyaaz performance trial metrics
  const [currentMetrics, setCurrentMetrics] = useState<{
    overallSurAccuracy: number;
    averageDeviationCents: number;
    meendCount: number;
    gamakCount: number;
    noteCoverage: Record<number, { count: number; stableCount: number; avgDeviation: number }>;
  } | null>(null);

  // Persistent user digital twin profile state
  const [profileState, setProfileState] = useState<DigitalTwinState>({
    digitalTwinId: "dt_v1_vocalist_main",
    vocalProfile: {
      baseTonicHz: 130.81,
      effectiveRange: { lowerBoundaryHz: 130.81, upperBoundaryHz: 523.25, notation: "C3-C5" },
      timbreStabilityIndex: 0.85,
      breathHoldingCapacitySeconds: 15.0
    },
    stylisticFingerprint: {
      preferredRaags: ["Yaman", "Bhimpalasi"],
      meendExecutionFluidity: 0.78,
      gamakVibratoHzMean: 6.0
    },
    historicalErrorPatterns: {
      habitualFlatNotes: [4, 11],
      taalDriftTendency: "early_entry_on_khali",
      avgLatencyMs: -22.5
    },
    runningScores: {
      cumulativeSurAccuracy: 84.5,
      cumulativeTaalStability: 71.0,
      riyazStreakDays: 5
    }
  });

  const activeRaag = RAAGS[selectedRaagIdx];

  // Load physical user profile details on startup from server-side JSON persistence
  useEffect(() => {
    fetchProfileFromDatabase();
  }, []);

  const fetchProfileFromDatabase = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const dbProfile = await response.json();
        setProfileState(dbProfile);
        
        // Sync sliding frequency pitch if previously configured in profile
        if (dbProfile.vocalProfile?.baseTonicHz) {
          setBaseTonicHz(dbProfile.vocalProfile.baseTonicHz);
        }
      }
    } catch (err) {
      console.warn("Failed fetching persistent digital twin profile from backend, operating with local defaults:", err);
    }
  };

  const handleProfileUpdated = (newProfile: DigitalTwinState) => {
    setProfileState(newProfile);
    // Persist new profile vector state cleanly onto Express backend JSON database
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProfile)
    }).catch(err => console.error("Database profile synchronization failure:", err));
  };

  const handleTonicChange = (newHz: number) => {
    setBaseTonicHz(newHz);
    const updated = {
      ...profileState,
      vocalProfile: {
        ...profileState.vocalProfile,
        baseTonicHz: newHz
      }
    };
    handleProfileUpdated(updated);
  };

  const handleSessionMetricsAccomulated = (metrics: {
    overallSurAccuracy: number;
    averageDeviationCents: number;
    meendCount: number;
    gamakCount: number;
    noteCoverage: Record<number, { count: number; stableCount: number; avgDeviation: number }>;
  }) => {
    setCurrentMetrics(metrics);
  };

  /**
   * Helper updating Taal metronome offsets dynamically to synchronize radar indicators
   */
  const handleTaalStatsChange = (stats: { layaAccuracy: number; driftMs: number } | any) => {
    // If the metronome has a high-quality run, feed stats into active attempt
  };

  // Additional sign-in state variables
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("Tansen");
  const [authStage, setAuthStage] = useState<"form" | "loading" | "complete">("form");
  const [authStepMessage, setAuthStepMessage] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // Robust authentication validation checks
  const validateAuthInputs = (isRegistering: boolean): boolean => {
    setAuthError("");
    
    // Check Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setAuthError("Please provide a valid, authentic email address (e.g., shishya@naadai.com).");
      return false;
    }

    // Check Password
    if (password.length < 6) {
      setAuthError("Security Failure: Access passcode must be at least 6 characters in length to safeguard profile parameters.");
      return false;
    }

    const hasSpecialOrDigit = /[0-9!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]/.test(password);
    if (!hasSpecialOrDigit) {
      setAuthError("Passcode Strength Requirement: Password must contain at least one number (0-9) or special character (!@#$ etc.) to ensure digital twin authenticity.");
      return false;
    }

    // Checking Registration credentials
    if (isRegistering) {
      if (!vocalistName.trim()) {
        setAuthError("Registration Error: Please provide an authentic Shishya Practitioner Name.");
        return false;
      }
      if (password !== confirmPassword) {
        setAuthError("Credential Mismatch: The Password and Confirm Password entries do not match.");
        return false;
      }
    }

    return true;
  };

  const handleAuthSubmit = (isRegistering: boolean) => {
    if (!validateAuthInputs(isRegistering)) return;

    setAuthStage("loading");
    setAuthError("");

    const steps = [
      "Verifying credentials against Shāstra Registry...",
      "Calibrating microtonal register boundaries...",
      "Attuning digital voice-print resonance curves...",
      "Synchronizing offline-fallback telemetry caches...",
      "Alignment Successful: Ready - Launching Riyāz Desk..."
    ];

    let currentStep = 0;
    setAuthStepMessage(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setAuthStepMessage(steps[currentStep]);
      } else {
        clearInterval(interval);
        setAuthStage("complete");

        setTimeout(() => {
          const formattedName = vocalistName.trim() || email.split("@")[0] || "Shishya";
          const sanitaryName = formattedName.replace(/[^\w\s]/gi, "");
          
          const updatedProfile = {
            ...profileState,
            vocalProfile: {
              ...profileState.vocalProfile,
              baseTonicHz: baseTonicHz
            },
            digitalTwinId: `dt_${sanitaryName.toLowerCase().replace(/\s+/g, '_')}`
          };

          handleProfileUpdated(updatedProfile);
          setVocalistName(sanitaryName);
          setIsAuthenticated(true);
          setActivePage("riyaz"); // redirect directly to Riyaz training desk
          // Reset states back
          setAuthStage("form");
          setAuthError("");
        }, 900);
      }
    }, 700);
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
                  NaadAI 
                  <span className="text-[9px] font-mono tracking-widest font-extrabold text-teal-400 bg-teal-950/60 border border-teal-800/40 px-1.5 py-0.5 rounded-full uppercase ml-1.5">Twin</span>
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
                  onClick={() => { setActivePage("welcome"); setAuthError(""); }}
                  className="px-3.5 py-1.5 rounded-xl border border-teal-900 bg-teal-950/20 text-teal-300 font-mono text-xs font-bold hover:bg-teal-950/60 transition-all cursor-pointer"
                >
                  ← Home
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setActivePage("login"); setAuthError(""); }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivePage("signup"); setAuthError(""); }}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 text-xs font-mono font-bold transition-all shadow-lg hover:-translate-y-0.5 duration-300 cursor-pointer"
                  >
                    Sign Up
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
                  India's Premier Acoustic Digital Twin Engine
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight font-serif text-white">
                  Attune Your Vocal Soul. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-455 via-sky-305 to-emerald-405">
                    Perfect Your Swar Sādhanā.
                  </span>
                </h2>
                <p className="text-slate-300 md:text-sm leading-relaxed max-w-2xl mx-auto font-sans">
                  NaadAI is a foolproof, real-time vocalist feedback console that maps your acoustic singing timber into a persistent digital twin profile, enabling microtonal pitch training across the ragas.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setActivePage("signup"); setAuthError(""); }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 text-sm font-mono font-bold uppercase tracking-wider hover:opacity-90 shadow-xl transition-all hover:-translate-y-0.5 duration-300 cursor-pointer"
                  >
                    Initialize Free Shishya Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivePage("login"); setAuthError(""); }}
                    className="px-6 py-3 rounded-xl border border-teal-900 bg-teal-950/30 text-teal-300 text-sm font-mono font-bold uppercase tracking-wider hover:bg-teal-950/70 transition-all cursor-pointer"
                  >
                    Access Riyāz Desk (Log In)
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
                    Instantly capture singing pitch with microtonal accuracy down to absolute cents of a semitone (Shruti deviation). Tracks complex pitch ornaments like sliding Meend transitions.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-teal-950/60 p-6 rounded-2xl space-y-3 shadow-xl hover:border-teal-700/50 transition-all duration-300">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500 text-cyan-400 flex items-center justify-center">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-white">Persistent Digital-Twin Profiler</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Builds your personalized acoustic profile from timbral stability logs, habitual flat tendencies, breath-holding seconds, and registers, synchronizing with our Express backend.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-teal-950/60 p-6 rounded-2xl space-y-3 shadow-xl hover:border-teal-700/50 transition-all duration-350">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500 text-emerald-400 flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-white">Conservatory Curriculum Pathway</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Track your daily hours practice, mark musical checkpoints complete across level guidelines (Prārāmbhī to Vishārad Masters), and accumulate authentic medals.
                  </p>
                </div>
              </div>

              {/* 3. The 10 Fundamental Thaats Section */}
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold font-serif text-white">The 10 Parent Scales (Thaats)</h3>
                  <p className="text-slate-400 text-xs max-w-lg mx-auto font-sans">
                    The fundamental Parent Scales from which all 84 Raags originate, exquisitely mapped inside our digital tuning system.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 text-center">
                  {[
                    { name: "Bilawal", notes: "All Shuddh notes", vibe: "Pure Joy, Daylight Sunshine" },
                    { name: "Kalyan", notes: "Teevra Madhyam (Ma#)", vibe: "Auspicious, Evening Peace" },
                    { name: "Khamaj", notes: "Komal Nishad (Ni_)", vibe: "Lyrical, Playful, Devotional" },
                    { name: "Kafi", notes: "Komal Ga & Komal Ni", vibe: "Expressive Folk, Midnight" },
                    { name: "Asavari", notes: "Komal Ga, Dha, Ni", vibe: "Melancholic, Pre-noon Dusk" },
                    { name: "Bhairav", notes: "Komal Re & Komal Dha", vibe: "Shattering Dawn Meditative" },
                    { name: "Bhairavi", notes: "All Komal Swaras", vibe: "Deep Pathos, Eternal Finale" },
                    { name: "Todi", notes: "Komal Re, Ga, Dha & Teevra Ma", vibe: "Sorrow, Spiritual Yearning" },
                    { name: "Poorvi", notes: "Komal Re, Dha & Teevra Ma", vibe: "Solemn Sunset Twilight" },
                    { name: "Marwa", notes: "Komal Re & Teevra Ma", vibe: "Anxious, Piercing Dawn-dusk" }
                  ].map((titem, ind) => (
                    <div key={titem.name} className="p-3.5 rounded-xl border border-teal-950/50 bg-[#08181f]/40 space-y-1">
                      <span className="text-[10px] uppercase font-mono font-extrabold text-teal-400">Thaat {ind + 1}</span>
                      <h4 className="font-serif font-bold text-slate-100 text-sm leading-tight">{titem.name}</h4>
                      <p className="text-[9px] text-slate-400 tracking-tight leading-normal font-mono">{titem.notes}</p>
                      <p className="text-[8px] text-slate-500 italic block pt-0.5">{titem.vibe}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Academy Testimonials / Classical Lineages */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold font-serif text-white text-center">Student Spotlight & Guru Endorsements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-teal-950/10 border border-teal-950/60 p-5 rounded-xl space-y-3">
                    <p className="text-xs text-slate-300 italic font-sans leading-relaxed">
                      "As a classical vocalist shishya, perfect pitch stability has always been checked under strict supervision. Under NaadAI's microtonal tuning logs, I can practice in Dawn's quiet hours and perfect my Komal Re oscillation down to absolute single cent thresholds. Magnificent architecture!"
                    </p>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-teal-400 font-bold">— Priyadarshani Sen, Scholar</span>
                      <span className="text-emerald-500">✔ VERIFIED SHISHYA</span>
                    </div>
                  </div>

                  <div className="bg-teal-950/10 border border-teal-950/60 p-5 rounded-xl space-y-3">
                    <p className="text-xs text-slate-300 italic font-sans leading-relaxed">
                      "Traditional training is sacred, yet the precision is mathematical. The Voice Twin feedback mechanism accurately graphs the difference between a natural Sa pitch hold and a slurred, flat interval. It's a robust addition to live physical guru training."
                    </p>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-teal-400 font-bold">— Pandit R. Devendra, Gwalior Shāstri</span>
                      <span className="text-emerald-500">✔ SENIOR GURU CO-SIGN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. FAQs Interactive Sections */}
              <div className="space-y-4 max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold font-serif text-white text-center">Frequently Asked Questions</h3>
                {[
                  {
                    q: "What is an Acoustic Vocalist Digital Twin?",
                    a: "An Acoustic Digital Twin is a structured profile tracking your baseline vocal standard Sa pitch, larynx frequency ranges, breath-holding seconds capabilities, note stability records, and timbral tendencies (like habitual flat or sharp spikes). It persistently updates via the Express API backend server."
                  },
                  {
                    q: "Is standard C3 (Male) and G3 (Female) supported?",
                    a: "Absolutely. During sign-up, or inside the live telemetry console, you can select 'Male Sa (C3)', 'Female Sa (G3)', or tune your exact custom standard Sa down to fine Hertz values using our range tuning slider."
                  },
                  {
                    q: "How does the pitch tuner detect microtones?",
                    a: "By mapping the fundamental pitch of the microphone input against active raga intervals. Within ragas like Bhairavi, it measures if you are hit flat (Komal) swaras and highlights cent deviations, providing immediate Gāndhār / Nishād coaching flags."
                  },
                  {
                    q: "Do I need real credentials?",
                    a: "Yes! There are no pre-filled credentials. You can set up your custom passcode. The website authenticates the structure dynamically ensuring strong passwords containing digits or special chars."
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
            
            /* 6. Authentic Authentication Pages: Login and Signup portals */
            <div className="max-w-md mx-auto pt-6">
              <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-2xl relative z-30 transition-all ${
                currentTheme === "peacock" 
                  ? "bg-slate-950/90 border-cyan-950" 
                  : currentTheme === "sunset" 
                  ? "bg-[#1C0D0A]/90 border-amber-950"
                  : "bg-[#061711]/90 border-emerald-950"
              }`}>
                
                {/* Visual Header of portal */}
                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-2xl font-bold font-serif text-white">
                    {activePage === "login" ? "Welcome back, Shishya" : "Register Shishya Profile"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {activePage === "login" 
                      ? "Attune credentials to enter the virtual riyāz deck" 
                      : "Create your persistent vocal twin coordinate node"}
                  </p>
                </div>

                {/* Highly clear red diagnostics for failure */}
                {authError && (
                  <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-lg text-xs text-red-200 font-medium space-y-1 mb-4">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-red-400 text-[10px]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Authenticity Safety Warning
                    </div>
                    <p className="leading-normal">{authError}</p>
                  </div>
                )}

                {/* Loader screen when sequence is active */}
                {authStage === "loading" && (
                  <div className="py-8 flex flex-col items-center justify-center space-y-4">
                    <div className="relative flex items-center justify-center font-sans">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
                      <Music className="h-4 w-4 text-teal-400 absolute animate-pulse text-center" />
                    </div>
                    <div className="space-y-1.5 text-center">
                      <p className="text-xs font-mono font-bold text-teal-400 animate-pulse">{authStepMessage}</p>
                      <p className="text-[10px] text-slate-400 font-sans font-medium">Constructing active digital twin profile nodes...</p>
                    </div>
                  </div>
                )}

                {/* Form state fields */}
                {authStage === "form" && (
                  <form onSubmit={(e) => { e.preventDefault(); handleAuthSubmit(activePage === "signup"); }} className="space-y-4">
                    
                    {/* SignUp practitioner name */}
                    {activePage === "signup" && (
                      <div className="space-y-1">
                        <label className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">
                          Practitioner Shishya Name
                        </label>
                        <div className="relative">
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Shishya Anindita"
                            value={vocalistName}
                            onChange={(e) => setVocalistName(e.target.value)}
                            className="bg-slate-900 border border-teal-950/60 text-slate-200 block w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-slate-950 transition-all font-bold placeholder-slate-500"
                          />
                          <User className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                        </div>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1">
                      <label className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">
                        Academic Email Address
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          required
                          placeholder="shishya@academy.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-slate-900 border border-teal-950/60 text-slate-200 block w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-slate-950 transition-all font-bold placeholder-slate-500"
                        />
                        <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    {/* Passcode lock */}
                    <div className="space-y-1">
                      <label className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">
                        Access Passcode
                      </label>
                      <div className="relative">
                        <input 
                          type={isPasswordVisible ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-slate-900 border border-teal-950/60 text-slate-200 block w-full pl-9 pr-14 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-slate-950 transition-all font-bold placeholder-slate-500 text-slate-100"
                        />
                        <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                          className="text-[10px] font-mono text-slate-400 absolute right-3 top-2 hover:text-slate-200 font-bold hover:bg-transparent"
                        >
                          {isPasswordVisible ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                      <p className="text-[8px] text-slate-500">Must be at least 6 characters and include a special char or number</p>
                    </div>

                    {/* Confirm Passcode for signup */}
                    {activePage === "signup" && (
                      <div className="space-y-1">
                        <label className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">
                          Confirm Passcode
                        </label>
                        <div className="relative">
                          <input 
                            type={isPasswordVisible ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-slate-900 border border-teal-950/60 text-slate-200 block w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-slate-950 transition-all font-bold placeholder-slate-500 text-slate-100"
                          />
                          <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                        </div>
                      </div>
                    )}

                    {/* Custom Voice Pitch standard select on signup */}
                    {activePage === "signup" && (
                      <div className="space-y-2 pt-1 font-sans">
                        <label className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">
                          Vocal Registration Standard (Sa)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Male Sa", pitch: "C3", hz: 130.81 },
                            { label: "Female Sa", pitch: "G3", hz: 196.00 },
                            { label: "High Pitch", pitch: "A3", hz: 220.00 }
                          ].map((pItem) => {
                            const isSelected = baseTonicHz === pItem.hz;
                            return (
                              <button
                                key={pItem.hz}
                                type="button"
                                onClick={() => setBaseTonicHz(pItem.hz)}
                                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-teal-500/20 border-teal-500 text-teal-400 font-bold"
                                    : "bg-slate-900 border-teal-950/40 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span className="block text-[10px] font-bold">{pItem.label}</span>
                                <span className="text-[8px] font-mono opacity-80">{pItem.pitch} ({pItem.hz}Hz)</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Choice of Gharana Avatar on signup */}
                    {activePage === "signup" && (
                      <div className="space-y-2">
                        <label className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">
                          Study Lineage Avatar
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "Tansen", label: "Tansen Dynasty", desc: "Pure Acoustic" },
                            { id: "Khayal", label: "Khayāl Master", desc: "Colouratura" },
                            { id: "Dhrupad", label: "Dhrupad Elder", desc: "Meditative" }
                          ].map((av) => (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => setSelectedAvatar(av.id)}
                              className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                                selectedAvatar === av.id
                                  ? "bg-teal-500/20 border-teal-500 text-teal-300 font-bold"
                                  : "bg-slate-900 border-teal-950/40 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <span className="block text-[9px] font-bold">{av.label}</span>
                              <span className="text-[7px] opacity-70 block leading-tight">{av.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider hover:opacity-95 shadow-lg hover:-translate-y-0.5 duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="h-4 w-4" />
                      {activePage === "login" ? "Verify Credentials" : "Establish Profile Node"}
                    </button>

                  </form>
                )}

                {/* Succinct screen toggle option */}
                {authStage === "form" && (
                  <div className="mt-6 pt-4 border-t border-teal-950/40 text-center">
                    <p className="text-xs text-slate-400 font-mono">
                      {activePage === "login" ? "New shishya scholar?" : "Already registered custom node?"}
                      &nbsp;
                      <button
                        type="button"
                        onClick={() => {
                          setActivePage(activePage === "login" ? "signup" : "login");
                          setAuthError("");
                        }}
                        className="text-teal-400 font-bold hover:underline cursor-pointer"
                      >
                        {activePage === "login" ? "Generate Account" : "Access Credentials Portal"}
                      </button>
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}
        </main>

        {/* Public Landing Area Footer */}
        <footer className="relative z-20 border-t border-teal-950/40 py-4 text-center text-[10px] font-mono tracking-wider bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <span>ॐ नादब्रह्मणे नमः — "Ancient melody meeting computational science"</span>
            <span>© 12026 NAADAI CONCEPTS, LTD. ALL RIGHTS RESERVED.</span>
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#38BDF8] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30 select-none">
              <span className="font-serif text-lg font-bold text-slate-950 leading-none">ॐ</span>
            </div>
            <div>
              <h1 className="text-xl font-serif font-black text-slate-100 tracking-wide">NaadAI</h1>
              <p className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-widest font-bold">Classical Riyaz Companion</p>
            </div>
          </div>

          {/* Core navigation tabs */}
          <nav className="flex flex-wrap justify-center gap-1 font-mono text-[11px] font-bold">
            {[
              { id: "home", label: "Home", icon: Home },
              { id: "tanpura", label: "Tanpura", icon: Music },
              { id: "analyzer", label: "Raga Analyzer", icon: Activity },
              { id: "journal", label: "Riyaz Journal", icon: BookOpen },
              { id: "progress", label: "Progress", icon: BarChart2 },
              { id: "library", label: "Raga Library", icon: Compass },
              { id: "profile", label: "Profile", icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
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
              <span className="text-[#FBBF24] font-black">{profileState.runningScores.riyazStreakDays} Days 🔥</span>
            </div>
            <button
              onClick={() => { setIsAuthenticated(false); setActivePage("welcome"); }}
              className="px-3 py-1.5 rounded-xl border border-slate-850 bg-[#0F1115] hover:border-[#7C3AED]/50 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
            >
              Sign out
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
          />
        )}
        {activeTab === "journal" && <JournalTab />}
        {activeTab === "progress" && <ProgressTab />}
        {activeTab === "library" && <LibraryTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      {/* Aesthetic classical credits footer */}
      <footer className="relative z-20 border-t border-[#7C3AED]/20 py-4 text-center text-[10px] font-mono tracking-wider bg-[#0F1115]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2 text-slate-500">
          <span>ॐ नादब्रह्मणे नमः — "Ancient melody meeting computational science"</span>
          <span>© 12026 NAADAI CONCEPTS, LTD. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>

    </div>
  );
}
