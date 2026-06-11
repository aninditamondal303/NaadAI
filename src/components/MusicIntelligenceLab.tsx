/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, Sparkles, RefreshCw, Bookmark, Compass, HeartPulse, 
  BarChart2, Play, Pause, AlertCircle, CheckCircle, ChevronRight, 
  Activity, Star, Music, UserCheck, Flame, BookOpen, Clock, 
  ThumbsUp, Navigation, Volume2, ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, LineChart, CartesianGrid, XAxis, 
  YAxis, Tooltip, Legend, Line, AreaChart, Area
} from 'recharts';
import { DigitalTwinState } from '../types';

interface AudioTake {
  id: string;
  name: string;
  timestamp: string;
  raagName: string;
  durationSeconds: number;
  audioBase64: string; 
}

interface MusicIntelligenceLabProps {
  profileState: DigitalTwinState;
  onProfileUpdated: (newProfile: DigitalTwinState) => void;
  activeRaagId: string;
  currentTheme?: "peacock" | "sunset" | "monsoon" | "saffron" | "midnight" | "ivory";
}

export const MusicIntelligenceLab: React.FC<MusicIntelligenceLabProps> = ({
  profileState,
  onProfileUpdated,
  activeRaagId,
  currentTheme = "peacock"
}) => {
  const [activeTab, setActiveTab] = useState<"dna" | "dsp" | "timeline" | "coach">("dna");

  // Interactive Live Simulated Audio Player for click-to-jump timeline feature
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0); // in seconds
  const [playbackDuration, setPlaybackDuration] = useState(400); // 6:40 total duration
  const playbackIntervalRef = useRef<number | null>(null);

  // Growth tracker mock database state variables
  const [selectedGrowthMetric, setSelectedGrowthMetric] = useState<"sur" | "taal" | "hours" | "ragas">("sur");

  // Selection inputs
  const [selectedBandishLevel, setSelectedBandishLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // Fetch takes from localStorage to align audio playback simulation if available
  const [availableTakes, setAvailableTakes] = useState<AudioTake[]>([]);
  const [selectedTakeId, setSelectedTakeId] = useState<string>("simulated_take_01");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("naadai_vocal_takes");
      if (stored) {
        const parsed: AudioTake[] = JSON.parse(stored);
        setAvailableTakes(parsed);
      }
    } catch (e) {
      console.warn("Failed retrieving takes inside lab:", e);
    }
  }, []);

  // Playback timer simulation
  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = window.setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= playbackDuration) {
            setIsPlaying(false);
            if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }

    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, playbackDuration]);

  // Jump to specific timestamp
  const handleJumpToTimestamp = (seconds: number) => {
    setPlaybackTime(seconds);
    setIsPlaying(true);
    
    // Quick notification on UI
    const floatMsg = document.createElement("div");
    floatMsg.className = "fixed bottom-10 right-10 bg-purple-600 text-white font-mono text-xs px-4 py-2.5 rounded-xl border border-purple-400/30 shadow-2xl z-50 animate-bounce";
    floatMsg.innerHTML = `☄️ Switched audio coordinates to ${formatTime(seconds)}`;
    document.body.appendChild(floatMsg);
    setTimeout(() => floatMsg.remove(), 2000);
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Convert theme keys
  const isLight = currentTheme === "ivory";
  const themeColors = {
    primary: isLight ? "#9C541D" : currentTheme === "sunset" ? "#EA580C" : currentTheme === "monsoon" ? "#10B981" : "#A855F7",
    primaryLight: isLight ? "#FDFBF7" : "#1e1136",
    accent: isLight ? "#8B4D1A" : "#22D3EE",
    textMute: isLight ? "text-amber-900/60" : "text-slate-400",
    textMain: isLight ? "text-amber-950" : "text-slate-100",
    border: isLight ? "border-amber-200" : "border-slate-900"
  };

  // ==========================================
  // DATA PRESETS & SIMULATIONS
  // ==========================================

  // 1. Radar data modeling the persistent digital twin
  const radarData = [
    { subject: "Voice Range", value: Math.round(profileState.vocalProfile.effectiveRange.upperBoundaryHz / 3.5), fullMark: 100 },
    { subject: "Timbre Stability", value: Math.round(profileState.vocalProfile.timbreStabilityIndex * 100), fullMark: 100 },
    { subject: "Meend Path", value: Math.round(profileState.stylisticFingerprint.meendExecutionFluidity * 100), fullMark: 100 },
    { subject: "Taal Sensitivity", value: profileState.runningScores.riyazStreakDays > 5 ? 85 : 72, fullMark: 100 },
    { subject: "Breath Control", value: Math.round(profileState.vocalProfile.breathHoldingCapacitySeconds * 5), fullMark: 100 },
    { subject: "Gamak Oscillation", value: Math.round(profileState.stylisticFingerprint.gamakVibratoHzMean * 12), fullMark: 100 }
  ];

  // 2. Swara map nodes
  const swaraMapNodes = [
    { key: "Sa", name: "Shadja", freq: "100%", acc: 98, stab: 95, color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/40" },
    { key: "Re", name: "Rishabh", freq: "72%", acc: 81, stab: 78, color: "text-sky-400 bg-sky-950/40 border-sky-500/40" },
    { key: "Ga", name: "Gandhaar", freq: "85%", acc: 92, stab: 91, color: "text-purple-400 bg-purple-950/40 border-purple-500/40" },
    { key: "Ma", name: "Madhyam", freq: "60%", acc: 74, stab: 68, color: "text-amber-400 bg-amber-950/40 border-amber-500/40" },
    { key: "Pa", name: "Pancham", freq: "90%", acc: 96, stab: 94, color: "text-rose-450 bg-rose-955/40 border-rose-500/40" },
    { key: "Dha", name: "Dhaivat", freq: "45%", acc: 68, stab: 62, color: "text-indigo-400 bg-indigo-950/40 border-indigo-500/40" },
    { key: "Ni", name: "Nishad", freq: "78%", acc: 87, stab: 84, color: "text-teal-400 bg-teal-950/40 border-teal-500/40" }
  ];

  // 3. Timeline structural items
  const timelinePhases = [
    { id: "alaap", name: "ALAAP", startTime: 0, endTime: 90, label: "00:00 - 01:30", desc: "Introductory free rhythmic pitch glide exploration", color: "from-purple-950/40 to-indigo-950/30" },
    { id: "bandish", name: "BANDISH", startTime: 90, endTime: 225, label: "01:30 - 03:45", desc: "Lyrical rhythmic core composition block", color: "from-teal-950/40 to-emerald-950/30" },
    { id: "bolalaap", name: "BOL ALAAP", startTime: 225, endTime: 290, label: "03:45 - 04:50", desc: "Syllabic vocal extensions on the theme lyric", color: "from-amber-950/40 to-orange-950/30" },
    { id: "sargam", name: "SARGAM", startTime: 290, endTime: 340, label: "04:50 - 05:40", desc: "Solfege pitch syllable speed permutations", color: "from-rose-950/40 to-red-950/30" },
    { id: "taan", name: "TAAN", startTime: 340, endTime: 375, label: "05:40 - 06:15", desc: "Rapid, brilliant linear coloratura leaps", color: "from-purple-950/40 to-pink-950/30" },
    { id: "tihai", name: "TIHAI", startTime: 375, endTime: 400, label: "06:15 - 06:40", desc: "Triple cadential rhythmic alignment landing", color: "from-emerald-950/40 to-teal-950/30" }
  ];

  // 4. Mistake Localization nodes
  const localizedMistakes = [
    { id: "mis_1", timeSec: 72, timeLabel: "01:12", title: "Scale Instability near Tivra Ma", type: "pitch", severity: "medium", detail: "Flipped sharp by 28 cents against the Tanpura G string register during the downward avaroha glide." },
    { id: "mis_2", timeSec: 134, timeLabel: "02:14", title: "Diaphragmatic fatigue indicator", type: "health", severity: "low", detail: "Timber stability index dropped momentarily to 58%, suggesting throat constriction / vocal strain." },
    { id: "mis_3", timeSec: 222, timeLabel: "03:42", title: "Flawless Meend transition", type: "success", severity: "none", detail: "Dharmic drift of 0 cents achieved on a gorgeous, uninterrupted 4-second linear pitch slide Ga ➔ Ma ➔ Pa." },
    { id: "mis_4", timeSec: 292, timeLabel: "04:52", title: "Delayed Arrival on Sam", type: "taal", severity: "high", detail: "Solfege onset landed 180 milliseconds behind the central beat, breaking the microtonal cycle focus." },
    { id: "mis_5", timeSec: 358, timeLabel: "05:58", title: "High-velocity Taan landing", type: "success", severity: "none", detail: "Perfect landing precision. All 16 notes executed at double Layakari speed with 94% frequency accuracy." },
    { id: "mis_6", timeSec: 378, timeLabel: "06:18", title: "Sustained Nyas center hold", type: "success", severity: "none", detail: "Maintained baseline tonic frequency hold for 6 seconds straight at a pristine 100% stability purity." }
  ];

  // 5. Monthly growth simulation coordinates
  const growthData = [
    { month: "Jan", sur: 68, taal: 60, hours: 12, ragas: 1, stability: 70 },
    { month: "Feb", sur: 72, taal: 65, hours: 18, ragas: 2, stability: 74 },
    { month: "Mar", sur: 77, taal: 69, hours: 22, ragas: 3, stability: 78 },
    { month: "Apr", sur: 81, taal: 73, hours: 30, ragas: 4, stability: 82 },
    { month: "May", sur: 85, taal: 78, hours: 38, ragas: 5, stability: 86 },
    { month: "Jun", sur: 91, taal: 84, hours: 45, ragas: 6, stability: 90 }
  ];

  // 6. Bandish recommended lists
  const bandishDatabase = {
    beginner: [
      { name: "Jaat Kahan Ho", taal: "Teental (16 Beats)", tempo: "Vilambit (Slow)", artist: "Kishori Amonkar", audioLink: "Aura of Dawn recordings" },
      { name: "Piya Bin Nahi Aavat Chain", taal: "Kaherva (8 Beats)", tempo: "Madhya Laya", artist: "Ustad Rashid Khan", audioLink: "Masterworks volume 1" }
    ],
    intermediate: [
      { name: "Eri Aali Piya Bina", taal: "Teental (16 Beats)", tempo: "Madhya Laya", artist: "Pandit Bhimsen Joshi", audioLink: "Kirana Lineage recordings" },
      { name: "Suhani Raat Dhal Chuki", taal: "Dadra (6 Beats)", tempo: "Drut (Fast)", artist: "Pandit Jasraj", audioLink: "Mewati Devotional anthology" }
    ],
    advanced: [
      { name: "Heeriyala Lalat Jhalat", taal: "Ektal (12 Beats)", tempo: "Drut Layakari", artist: "Ustad Amir Khan", audioLink: "Indore Merukhand references" },
      { name: "Karam Karo Kartar", taal: "Jhaptal (10 Beats)", tempo: "Vilambit", artist: "Kumar Gandharva", audioLink: "Malwa folk-classical tapes" }
    ]
  };

  // 7. AI Practice Coach
  const coachRoutine = {
    focus: activeRaagId.toUpperCase(),
    estimatedMinutes: 35,
    exercises: [
      { title: "Sa-Re/Komal Dha Meend glide holds", duration: "10 mins", instructions: "Slow, breathless glissando connecting lower octaves to upper registers." },
      { title: "Tivra Madhyam stability sustain", duration: "10 mins", instructions: "Maintain standing notes on the standard pitch drone without throat vibration." },
      { title: "Speed-scaled Merukhand permutes", duration: "15 mins", instructions: "Execute 4-note permutation combinations starting slow, scaling up to double speed laya." }
    ]
  };

  // 8. Performance Readiness
  const readinessScores = {
    concert: 82,
    competition: 78,
    exam: 91,
    rationale: "Pranām! Your academic exam readiness sits at a stunning 91% owing to highly meticulous scale pattern accuracy (Aroha/Avaroha matching). However, concert and competitive scores require higher dynamic breath reserves (current capacity stands at 15s) and faster Taan speed response tolerances to command larger physical auditoriums."
  };

  return (
    <div id="advanced-music-intelligence-portal" className={`w-full p-4.5 rounded-2xl border transition-all ${
      isLight 
        ? "bg-white border-amber-200/80 shadow-md" 
        : currentTheme === "midnight" 
        ? "bg-[#0b0821]/95 border-indigo-950/80 shadow-indigo-950/15" 
        : "bg-slate-950 border-slate-900/90"
    }`}>
      
      {/* 2. Brand & Tab Navigation Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 border-b pb-4.5 mb-4.5 border-slate-800/60">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-indigo-950/40 text-purple-400 border border-indigo-900/60 uppercase">
              ✦ PRO LAB
            </span>
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">NaadAI Music Informatics Lab</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight font-serif mt-0.5 flex items-center gap-2">
            Advanced Musical Intelligence Matrix
          </h2>
          <p className="text-xs text-slate-400 leading-normal font-sans">
            Deep-tier digital signal processing (DSP) and cognitive raga-grammar intelligence.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap p-1 gap-1 bg-slate-900/60 border border-slate-900 rounded-xl w-full xl:w-auto">
          {[
            { id: "dna", label: "🧬 DNA & Swara Map" },
            { id: "dsp", label: "🔬 Ornament Analytics" },
            { id: "timeline", label: "⏱️ Mistake Timeline" },
            { id: "coach", label: "📿 Coach & Companion" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            let themeBtnStyle = isActive 
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-indigo-950"
              : "text-slate-400 hover:bg-slate-900/30 hover:text-slate-200";
            if (isLight && isActive) {
              themeBtnStyle = "bg-amber-100 border border-amber-300 text-amber-900 font-bold";
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[11px] font-sans font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer grow text-center xl:grow-0 ${themeBtnStyle}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN CONTAINER                                                          */}
      {/* ========================================================================= */}
      <div className="min-h-[460px]">
        
        {/* ========================================================== */}
        {/* FEATURE 1: DNA & SWARA MAP & JOURNEY                       */}
        {/* ========================================================== */}
        {activeTab === "dna" && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Radar Chart section */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 relative flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase font-mono text-purple-400 flex items-center gap-1.5 mb-1">
                    <Award className="h-3.5 w-3.5" />
                    Interactive Musical DNA
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    Personalized voice coordinate profiling based on multi-session Riyāz runs.
                  </p>
                </div>
                
                <div className="h-56 mt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} />
                      <Radar name="Active Twin" dataKey="value" stroke={themeColors.primary} fill={themeColors.primary} fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[9px] font-mono text-slate-500 text-center uppercase tracking-wide border-t border-slate-900/60 pt-2 text-purple-400 font-bold">
                  ⚡ Persistent Twin Node: MAIN_SHISHYA_01_ACTIVE
                </div>
              </div>

              {/* Musical Fingerprint Card */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase font-mono text-cyan-400 flex items-center gap-1.5 mb-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    Acoustic Fingerprint Card
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    Persistent bio-acoustic attributes extracted from digital signals.
                  </p>
                </div>

                <div className="space-y-2 border-t border-b border-slate-900 py-3 font-mono text-[11px] leading-relaxed">
                  <div className="flex justify-between">
                    <span className="text-slate-500">VOICE REGISTER</span>
                    <span className="text-slate-200 font-bold">Madhya Saptak (Mid range)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">EFFECTIVE RANGE</span>
                    <span className="text-cyan-400 font-bold">{profileState.vocalProfile.effectiveRange.notation} ({profileState.vocalProfile.effectiveRange.lowerBoundaryHz.toFixed(1)}Hz–{profileState.vocalProfile.effectiveRange.upperBoundaryHz.toFixed(1)}Hz)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TIMBRE PURITY</span>
                    <span className="text-slate-200 font-bold">%{Math.round(profileState.vocalProfile.timbreStabilityIndex * 100)} stability average</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PREFFERED OCTAVE</span>
                    <span className="text-slate-200 font-bold">Madhya (Middle Register)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">STRONGEST SWARA</span>
                    <span className="text-emerald-400 font-bold uppercase">Gandhaar (Ga)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">WEAKEST SWARA</span>
                    <span className="text-indigo-400 font-bold uppercase">Dhaivat (Dha - Komal)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">THETA LAYAKARI SENSITIVITY</span>
                    <span className="text-purple-400 font-bold">Sam arrival 120ms standard</span>
                  </div>
                </div>

                <div className="bg-cyan-950/30 border border-cyan-900/40 p-2 rounded-xl text-[10px] text-cyan-300 leading-normal font-sans">
                  <strong>Guru Insight:</strong> Focus on maintaining diaphragmatic air pressure down to Sa when descending to prevent vocal dropouts during avaroha routes.
                </div>
              </div>

              {/* Glowing Swara Map Section */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-[#090b1c]/40 relative space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold uppercase font-mono text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Activity className="h-3.5 w-3.5 animate-pulse" />
                    Interactive Swara Map
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    Usage intensity and pitch accuracy metrics mapped onto glowing scale coordinates.
                  </p>
                </div>

                {/* Glowing Nodes Matrix */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {swaraMapNodes.map((sw) => {
                    return (
                      <div key={sw.key} className={`p-2.5 rounded-xl border transition-all hover:scale-103 ${sw.color} relative overflow-hidden group`}>
                        <div className="absolute right-1 top-1 opacity-5 font-serif font-extrabold text-xs group-hover:opacity-10 transition-opacity">
                          ॐ
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[17px] font-extrabold font-serif leading-none">{sw.key}</span>
                          <span className="text-[8px] font-mono opacity-80 uppercase leading-none">{sw.name}</span>
                        </div>
                        
                        <div className="mt-2 text-[9.5px] font-mono leading-tight space-y-0.5">
                          <div className="flex justify-between">
                            <span className="opacity-60 text-slate-400">Usage:</span>
                            <span className="font-bold text-white">{sw.freq}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-60 text-slate-400">Purity:</span>
                            <span className="font-bold text-white">{sw.acc}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-60 text-slate-400">Stability:</span>
                            <span className="font-bold text-white">{sw.stab}%</span>
                          </div>
                        </div>

                        {/* Purity progress line indicator */}
                        <div className="mt-2 h-1 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400" style={{ width: `${sw.acc}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Raga Journey Exploration Animated SVG Graph */}
            <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 space-y-3.5">
              <div>
                <h4 className="text-xs font-extrabold uppercase font-mono text-purple-400 flex items-center gap-1.5 mb-1">
                  <Navigation className="h-3.5 w-3.5 animate-bounce" />
                  Visual Raga Exploration Journey
                </h4>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                  Real-time cognitive parsing tracking how you explored the melodic boundaries of Raag {activeRaagId.toUpperCase()}.
                </p>
              </div>

              {/* Animated Journey Flow SVG */}
              <div className="p-3 bg-slate-950 rounded-xl relative overflow-hidden border border-slate-900/60 flex flex-col justify-center min-h-[90px] font-sans">
                <div className="absolute inset-0 bg-grid-white/[0.015] z-0" />
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 relative z-10 text-center font-mono">
                  
                  {[
                    { title: "Starting Coordinates", note: "N' ➔ R", desc: "Lower-register anchor focus", label: "00:15" },
                    { title: "Important Phrases", note: "G ➔ P ➔ M R", desc: "Aroha/Avaroha pathways traversed", label: "01:45" },
                    { title: "Nyas Focus Swaras", note: "Gandhaar (Ga)", desc: "Sustained static pitch holding", label: "03:10" },
                    { title: "Climactic Peaks", note: "P ➔ N ➔ S'", desc: "Upper Tar Saptak register peak velocity", label: "05:12" },
                    { title: "Ending Landing", note: "M' G R ➔ S", desc: "Return to central Tonic Sa resonance", label: "06:35" }
                  ].map((node, ind) => (
                    <div key={ind} className="flex-1 flex flex-col items-center justify-between gap-1 p-2 bg-slate-900/40 border border-slate-805 rounded-xl hover:border-purple-600/50 hover:bg-slate-900/80 transition-all duration-300">
                      <span className="text-[8px] text-slate-505 uppercase block font-bold leading-normal">{node.title}</span>
                      <span className="text-[15px] font-bold text-purple-400 my-1 underline underline-offset-4 decoration-purple-600/30">{node.note}</span>
                      <span className="text-[8.5px] text-slate-400 leading-normal max-w-[125px] h-6 flex items-center justify-center">{node.desc}</span>
                      <span className="text-[8px] text-slate-600 mt-1 block px-1.5 py-0.2 bg-slate-950 border border-slate-800 rounded">{node.label}</span>
                    </div>
                  ))}

                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* FEATURE 2: MEEND, GAMAK, TAAN, PAKAD DETECTORS             */}
        {/* ========================================================== */}
        {activeTab === "dsp" && (
          <div className="space-y-4 animate-fade-in font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* 1. Meend Glides Analyzer */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-[#071317]/20 relative space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase font-mono text-cyan-400 flex items-center gap-1.5 mb-1">
                      <Compass className="h-3.5 w-3.5" />
                      Meend Glides Analyzer
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      Continuous frequency glissando evaluations (uninterrupted linear pitch changes).
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-900">
                    Precision Class: 10 Cent Step
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">SMOOTHNESS</span>
                    <span className="text-cyan-405 font-bold text-sm">91% (Pristine)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">AVG LENGTH</span>
                    <span className="text-slate-200 font-bold text-sm">3.4 seconds</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">PRECISION ACC</span>
                    <span className="text-cyan-405 font-bold text-sm">96% Accuracy</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">MUSICALITY</span>
                    <span className="text-slate-200 font-bold text-sm">Excellent</span>
                  </div>
                </div>

                {/* Vector simulation graph */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex flex-col justify-center min-h-[70px] relative overflow-hidden">
                  <span className="text-[8px] text-slate-600 block uppercase font-mono mb-1">Vector microtonal slide graph (Ga ➔ Pa)</span>
                  {/* Decorative slide drawing */}
                  <svg className="w-full h-10 stroke-cyan-500 fill-none opacity-85 z-10" viewBox="0 0 200 40">
                    <path d="M10 32 C 40 32, 60 12, 100 12 C 140 12, 160 8, 190 8" strokeWidth="2.5" />
                    <line x1="10" y1="32" x2="190" y2="32" stroke="#1e293b" strokeDasharray="2" />
                    <circle cx="10" cy="32" r="3" fill="#06b6d4" />
                    <circle cx="100" cy="12" r="3" fill="#38bdf8" />
                    <circle cx="190" cy="8" r="3" fill="#22d3ee" className="animate-ping" />
                  </svg>
                </div>
              </div>

              {/* 2. Gamak Oscillations Analyzer */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-[#120717]/20 relative space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase font-mono text-purple-400 flex items-center gap-1.5 mb-1">
                      <Flame className="h-3.5 w-3.5" />
                      Gamak & Vibrato Analyzer
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      Sustained vigorous pitch oscillation speed and depth analysis.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-purple-950 text-purple-300 border border-purple-900">
                    Target: 5.5 - 6.5 Hz
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">PRESENCE</span>
                    <span className="text-purple-400 font-bold text-sm">Moderate (Active)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">MEAN SPEED</span>
                    <span className="text-slate-200 font-bold text-sm">6.1 Hz</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">STRENGTH DEPTH</span>
                    <span className="text-purple-400 font-bold text-sm">+85 Cents</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-900">
                    <span className="text-[8px] text-slate-500 block">CONSISTENCY</span>
                    <span className="text-slate-200 font-bold text-sm">88% Stable</span>
                  </div>
                </div>

                {/* Vector simulation graph */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex flex-col justify-center min-h-[70px] relative overflow-hidden">
                  <span className="text-[8px] text-slate-600 block uppercase font-mono mb-1">Oscillation envelope capture</span>
                  {/* Decorative wave drawing */}
                  <svg className="w-full h-10 stroke-purple-400 fill-none opacity-85 z-10" viewBox="0 0 200 40">
                    <path d="M10 20 Q18 8 26 20 T42 20 T58 20 T74 20 T90 20 T106 20 T122 20 T138 20 T154 20 T170 20 T186 20 T190 20" strokeWidth="2" />
                    <line x1="10" y1="20" x2="190" y2="20" stroke="#1e293b" />
                  </svg>
                </div>
              </div>

              {/* 3. Expected vs Detected Pakad Section */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 relative space-y-3.5 col-span-1 lg:col-span-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase font-mono text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Music className="h-3.5 w-3.5" />
                      Pakad Signature Phrase Detector
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      Evaluates if the characteristic skeletal raga signature phrases (*Pakad*) are correctly traversed.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-900">
                    92% SIMILARITY MATCH
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono leading-relaxed">
                  <div className="p-3 rounded-xl bg-[#09140e]/40 border border-emerald-900/30 space-y-1.5">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold text-emerald-500">EXPECTED SIGNATURE PHRASES</span>
                    <p className="text-[15px] font-bold text-slate-200">N' R G ➔ M' P ➔ M' G R ➔ S</p>
                    <p className="text-[9.5px] text-slate-500 font-sans italic leading-normal">
                      The core Yaman skeleton demands avoiding direct ascending over Sa, leaning on Ni' to initiate major transitions.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#110d1f]/40 border border-indigo-900/30 space-y-1.5">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold text-indigo-400">DETECTED SIGNATURE PATHWAY</span>
                    <p className="text-[15px] font-bold text-white">N' R G ➔ <span className="text-red-400 font-extrabold">M</span> P ➔ M' G R ➔ S</p>
                    <p className="text-[9.5px] text-red-300 font-sans italic leading-normal">
                      <strong>Rule Deviation:</strong> You executed a flat Shuddha Madhyam (M) instead of the sharp Tivra Madhyam (M') once during peak phrase ascension.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Layakari & Taan Multi Analyzers */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 relative space-y-3.5 col-span-1 lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Layakari Block */}
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-mono font-extrabold uppercase text-amber-500">🥁 Layakari & Sync Engine</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-2 rounded-lg">
                        <span className="text-slate-450 block">SAM ACCURACY</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900/40 font-bold">EXCELLENT (120ms offset)</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-2 rounded-lg">
                        <span className="text-slate-450 block">BEAT ALIGNMENT</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900/40 font-bold">GOOD (89% stability)</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-2 rounded-lg">
                        <span className="text-slate-450 block">RHYTHM METRONOME SYNC</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-amber-950 text-amber-400 border border-amber-900/45 font-bold">DEVELOPING (tempo drift during khali)</span>
                      </div>
                    </div>
                  </div>

                  {/* Taan Block */}
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-mono font-extrabold uppercase text-purple-400">⚡ Taan Trajectory Report</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-2 rounded-lg">
                        <span className="text-slate-455">TRAJECTORY SPEED</span>
                        <span className="text-slate-205 font-mono font-bold">4.2 Notes / Sec</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-2 rounded-lg">
                        <span className="text-slate-455">PITCH CLARITY</span>
                        <span className="text-purple-400 font-mono font-bold">85% Clean Onsets</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-2 rounded-lg">
                        <span className="text-slate-455">LANDING ACCURACY</span>
                        <span className="text-emerald-400 font-mono font-bold">94% Target Purity</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* FEATURE 3: AUDIO TIMELINE & LOCALIZATION SECTIONS          */}
        {/* ========================================================== */}
        {activeTab === "timeline" && (
          <div className="space-y-4 animate-fade-in font-sans">
            
            {/* Live Audio playback controller interface */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isLight ? "bg-amber-50/30 border-amber-200" : "bg-indigo-950/20 border-indigo-950/60"
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                </button>
                <div>
                  <h4 className="text-[13px] font-bold text-white uppercase">
                    Interactive diagnostic player
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Active Take File: <span className="text-purple-400 font-bold uppercase">{availableTakes.find(t => t.id === selectedTakeId)?.name || "NaadAI Simulated Master Take 01"}</span>
                  </p>
                </div>
              </div>

              {/* Progress seeker bar */}
              <div className="flex-grow flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] text-slate-500 font-mono">{formatTime(playbackTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={playbackDuration}
                  value={playbackTime}
                  onChange={(e) => setPlaybackTime(parseInt(e.target.value))}
                  className="flex-grow accent-purple-500 h-1 rounded-lg bg-slate-900 outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">{formatTime(playbackDuration)}</span>
              </div>
            </div>

            {/* Performance Timeline marked blocks */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-mono font-extrabold uppercase text-slate-400">Classical Performance Timeline structure</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 ">
                {timelinePhases.map((ph) => {
                  const isActive = playbackTime >= ph.startTime && playbackTime < ph.endTime;
                  return (
                    <button
                      key={ph.id}
                      onClick={() => handleJumpToTimestamp(ph.startTime)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[95px] ${
                        isActive 
                          ? "bg-purple-950/50 border-purple-600 shadow-lg shadow-purple-950/50" 
                          : "bg-slate-900/30 border-slate-900 hover:border-slate-800"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-white font-mono">{ph.name}</span>
                          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />}
                        </div>
                        <span className="text-[8.5px] text-slate-500 block font-mono font-medium mt-0.5">{ph.label}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight block mt-2">{ph.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mistake Localization interactive list */}
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-mono font-extrabold uppercase text-slate-400">Cognitive Mistake Localization & Event Marks (Click jumps audio)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {localizedMistakes.map((mis) => {
                  const isCurrent = Math.abs(playbackTime - mis.timeSec) < 15;
                  let cardBorder = isCurrent ? "border-purple-650 bg-purple-950/20" : "border-slate-900 bg-slate-950/40";
                  let tagClass = "bg-slate-900 border-slate-805 text-slate-400";
                  
                  if (mis.type === "pitch") {
                    tagClass = "bg-rose-950 text-rose-300 border-rose-900";
                  } else if (mis.type === "taal") {
                    tagClass = "bg-amber-950 text-amber-300 border-amber-900";
                  } else if (mis.type === "success") {
                    tagClass = "bg-emerald-950 text-emerald-300 border-emerald-950";
                  }

                  return (
                    <button
                      key={mis.id}
                      onClick={() => handleJumpToTimestamp(mis.timeSec)}
                      className={`p-3 rounded-xl border text-left flex gap-3 transition-all cursor-pointer relative items-start hover:-translate-y-0.5 duration-300 ${cardBorder}`}
                    >
                      <div className="h-8 w-14 text-center p-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono font-bold text-xs flex flex-col justify-center text-purple-400 shrink-0">
                        {mis.timeLabel}
                      </div>
                      <div className="space-y-0.5 leading-tight">
                        <div className="flex items-center gap-1.5 max-w-full">
                          <span className="text-[11px] font-bold text-slate-200 block truncate">{mis.title}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                        </div>
                        <p className="text-[9.5px] text-slate-400 leading-normal font-sans pt-1">
                          {mis.detail}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* FEATURE 4: COACHING, COMPONENT ROADMAPS, HEALTH, GROWTHS    */}
        {/* ========================================================== */}
        {activeTab === "coach" && (
          <div className="space-y-4 animate-fade-in font-sans">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* AI Riyaz Coach Daily practice planner */}
              <div className="p-3.5 rounded-xl border border-slate-900 bg-[#120717]/30 space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5 font-serif text-5xl rotate-12">
                  ऋ
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase font-mono text-purple-400 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5" />
                    AI Riyāz Practice Coach
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Custom daily schedule compiling exercises targeting your specific weak swara metrics.
                  </p>
                </div>

                <div className="border border-slate-900 bg-slate-950 p-2.5 rounded-xl flex justify-between items-center font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[9px]">TODAY'S RAAG</span>
                    <span className="text-white font-bold text-sm">RAAG {activeRaagId.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">PRACTICE TIME</span>
                    <span className="text-purple-400 font-bold text-sm">35 minutes</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {coachRoutine.exercises.map((ex, ind) => (
                    <div key={ind} className="flex gap-2.5 items-start text-xs bg-slate-900/40 p-2 rounded-xl border border-slate-900">
                      <span className="h-5 w-5 rounded-full bg-purple-950 font-bold border border-purple-900 text-purple-300 font-mono text-[9px] flex items-center justify-center shrink-0">
                        {ind + 1}
                      </span>
                      <div className="leading-tight">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-202 text-[11px]">{ex.title}</span>
                          <span className="text-[9px] font-mono text-slate-505 shrink-0 block">{ex.duration}</span>
                        </div>
                        <p className="text-[9px] text-slate-450 mt-1 leading-normal">{ex.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Readiness Score & Voice Health indexers */}
              <div className="space-y-4">
                
                {/* Score indicators */}
                <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold uppercase font-mono text-amber-500 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" />
                      Digital-Twin Performance Readiness Scores
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-805">
                      <span className="text-[8px] text-slate-500 block font-mono">CONCERT</span>
                      <span className="text-xl font-mono font-bold text-slate-200">{readinessScores.concert}%</span>
                      <span className="text-[8px] text-amber-400 block font-mono font-bold mt-1">Sabhā Ready</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-805">
                      <span className="text-[8px] text-slate-500 block font-mono">COMPETITION</span>
                      <span className="text-xl font-mono font-bold text-slate-200">{readinessScores.competition}%</span>
                      <span className="text-[8px] text-purple-400 block font-mono font-bold mt-1">Excellent</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-805">
                      <span className="text-[8px] text-slate-500 block font-mono">ACADEMIC EXAM</span>
                      <span className="text-xl font-mono font-bold text-slate-200">{readinessScores.exam}%</span>
                      <span className="text-[8px] text-emerald-400 block font-mono font-bold mt-1">Vishārad Master</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal font-sans pt-1">
                    <strong>Readiness Rationale:</strong> {readinessScores.rationale}
                  </p>
                </div>

                {/* Voice Health Monitor card */}
                <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 relative space-y-3">
                  <div className="flex justify-between items-start">
                    <h5 className="text-[11px] font-mono font-extrabold uppercase text-cyan-400 flex items-center gap-1.5">
                      <HeartPulse className="h-3.5 w-3.5" />
                      Vocal Health & Fatigue Insights
                    </h5>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#0b2413] text-emerald-400 border border-emerald-900">
                      Vitals: Stable
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs leading-tight font-mono">
                    <div className="bg-slate-900/40 border border-slate-805 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 block">BREATH PRESSURE CONTROL</span>
                      <span className="text-white font-bold block pt-1">4.2 Liters/Sec hold</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-805 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 block">FATIGUE INDEX</span>
                      <span className="text-cyan-400 font-bold block pt-1">Low (No hoarseness)</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-805 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 block">MAX SUSTAIN DURATION</span>
                      <span className="text-white font-bold block pt-1">15.0 seconds standard Sa</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-805 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 block">LARYNX TENSION MARK</span>
                      <span className="text-white font-bold block pt-1">0.12 Hz jitter variance</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bandish Recommendation Engine Section */}
            <div className="p-4 rounded-xl border border-slate-905 bg-slate-950/40 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-xs font-extrabold uppercase font-mono text-emerald-400 flex items-center gap-1.5 mb-0.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Traditional Bandish Recommendation Engine
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Level-based classical melodies and performance instructions mapping to selected Raga structures.
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex gap-1 p-0.5 bg-slate-900 border border-slate-805 rounded-xl font-mono text-[9px] w-full sm:w-auto">
                  {["beginner", "intermediate", "advanced"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedBandishLevel(lvl as any)}
                      className={`px-3 py-1.5 font-bold uppercase rounded-lg cursor-pointer transition-all ${
                        selectedBandishLevel === lvl 
                          ? "bg-emerald-600 text-white" 
                          : "text-slate-400 hover:text-slate-205"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {bandishDatabase[selectedBandishLevel].map((item, ind) => (
                  <div key={ind} className="p-3.5 rounded-xl border border-slate-905 bg-slate-950 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <h5 className="font-serif font-extrabold text-[15px] text-slate-100 italic leading-none">
                        "{item.name}"
                      </h5>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-emerald-550/10 text-emerald-305 border border-emerald-900/40">
                        {item.taal}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono">
                      Tempo Category: <span className="text-white font-semibold">{item.tempo}</span>
                    </p>

                    <div className="bg-slate-900/60 p-2 border border-slate-905 rounded-xl font-mono text-[9.5px] leading-relaxed">
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">LEGENDARY ARTIST PATHWAY RECORDINGS</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-emerald-430 font-bold">{item.artist}</span>
                        <span className="text-slate-400 text-right">{item.audioLink}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Growth Tracker Line chart wrapper */}
            <div className="p-4 rounded-xl border border-slate-905 bg-slate-950/40 space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-xs font-extrabold uppercase font-mono text-purple-400 flex items-center gap-1.5">
                    <BarChart2 className="h-3.5 w-3.5" />
                    Classical Development Tracker
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Cumulative monthly progression log tracking pitch accuracies, streak hours, and learned raga indices.
                  </p>
                </div>

                {/* Grow selections tab */}
                <div className="flex gap-1 p-0.5 bg-slate-900 border border-slate-805 rounded-xl font-mono text-[9px] w-full sm:w-auto">
                  {[
                    { id: "sur", label: "SUR PURITY" },
                    { id: "taal", label: "TAAL SYNC" },
                    { id: "hours", label: "RIYAZ HOURS" },
                    { id: "ragas", label: "NEW RAGAS" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedGrowthMetric(m.id as any)}
                      className={`px-3 py-1.5 font-bold uppercase rounded-lg cursor-pointer transition-all ${
                        selectedGrowthMetric === m.id 
                          ? "bg-purple-600 text-white" 
                          : "text-slate-400 hover:text-slate-205"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-44 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#f1f5f9', fontSize: 11, fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey={selectedGrowthMetric} stroke={themeColors.primary} fillOpacity={1} fill="url(#growthGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
