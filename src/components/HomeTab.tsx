/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Sparkles, Flame, HelpCircle, Activity, Music, Compass, 
  BookOpen, AlertCircle, ArrowUpRight, CheckCircle2, ChevronRight,
  Clock, Volume2, Sliders, Settings, Square, RotateCcw, Award
} from 'lucide-react';
import { RAAG_LIST, ComprehensiveRaag } from '../data/allRaags';
import { addRecord, newId } from '../lib/practiceHistory';
import { firstStringForRaag, STRING_ORDER, TanpuraEngine, type FirstString } from '../audio/tanpura';
import { westernNote } from '../analysis/music';
import type { AppTab } from '../types';
import type { AnalyzerMode } from './AnalyzerTab';
import { TodayPanel } from './home/TodayPanel';
import { RAAG_DETAILS } from '../data/raagDetails';
import { generatePaltas } from '../practice/paltas';

// Pitch frequencies corresponding to classical standard scales (C3 base standard)

interface PracticeSession {
  raagId: string;
  raagName: string;
  scaleLabel: string;
  baseHz: number;
  durationMins: number;
  secondsRemaining: number;
  isSelectedTuning: "Pa" | "Ma" | "Ni";
  tempoBpm: number;
  volume: number;
}

interface HomeTabProps {
  setActiveTab: (tab: AppTab) => void;
  setAnalyzerMode?: (mode: AnalyzerMode) => void;
  setPracticeMode?: (mode: "palta" | "pakad" | "ear") => void;
  vocalistName?: string;
  baseTonicHz?: number;
}


export const HomeTab: React.FC<HomeTabProps> = ({
  setActiveTab,
  setAnalyzerMode,
  setPracticeMode,
  vocalistName = "Shishya",
  baseTonicHz = 138.59
}) => {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Practice session state
  const [activePractice, setActivePractice] = useState<PracticeSession | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [selectedPracticeRaag, setSelectedPracticeRaag] = useState<string>("yaman");
  const [selectedPracticeDuration, setSelectedPracticeScaleDuration] = useState<number>(30);
  
  // Pluck indicator active wave state (0-3 strings)
  const [activeString, setActiveString] = useState<number | null>(null);

  // Audio Context Ref block for Practice Mode Tanpura
  const audioCtxRef = useRef<AudioContext | null>(null);
  const practiceCountdownIntervalRef = useRef<number | null>(null);

  // Keep a live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync practice state countdown
  useEffect(() => {
    if (activePractice) {
      practiceCountdownIntervalRef.current = window.setInterval(() => {
        setActivePractice(prev => {
          if (!prev) return null;
          if (prev.secondsRemaining <= 1) {
            // Session complete: stop the drone and save the full duration
            stopPracticeTanpura();
            addRecord({ kind: "riyaz-timer", id: newId(), dateIso: new Date().toISOString(), raagName: prev.raagName, minutes: prev.durationMins });
            setSavedMessage(`Riyaz complete: saved ${prev.durationMins} min on ${prev.raagName}.`);
            window.setTimeout(() => setSavedMessage(null), 5000);
            return null;
          }
          return {
            ...prev,
            secondsRemaining: prev.secondsRemaining - 1
          };
        });
      }, 1000);
    } else {
      if (practiceCountdownIntervalRef.current) {
        clearInterval(practiceCountdownIntervalRef.current);
      }
    }
    return () => {
      if (practiceCountdownIntervalRef.current) {
        clearInterval(practiceCountdownIntervalRef.current);
      }
    };
  }, [activePractice !== null]);

  // Handle active session cleanup on unmount
  useEffect(() => {
    return () => {
      stopPracticeTanpura();
    };
  }, []);

  // Shared tanpura engine (same sound and tuning as the Tanpura tab)
  const tanpuraRef = useRef<TanpuraEngine | null>(null);
  const cycleFromTempo = (bpm: number) => (4 * 60 / bpm) * 1.15;

  const startPracticeTanpura = async (session: PracticeSession) => {
    stopPracticeTanpura();
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioCtxClass();
    audioCtxRef.current = ctx;
    const eng = new TanpuraEngine(ctx, ctx.destination, {
      saHz: session.baseHz,
      firstString: session.isSelectedTuning,
      cycleSec: cycleFromTempo(session.tempoBpm),
      volume: session.volume / 100,
    });
    eng.onPluck = s => setActiveString(STRING_ORDER.indexOf(s));
    tanpuraRef.current = eng;
    await eng.loadSamples();
    if (tanpuraRef.current === eng) eng.start();
  };

  const stopPracticeTanpura = () => {
    tanpuraRef.current?.disconnect();
    tanpuraRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setActiveString(null);
  };

  const handleStartPracticeSession = () => {
    // The drone uses the singer's own Sa; the first string follows the raag's swaras.
    const raagData = RAAG_LIST.find(r => r.id === selectedPracticeRaag);
    const optimalTuning: FirstString = raagData ? firstStringForRaag(raagData.allowedSwaras) : "Pa";
    const saHz = baseTonicHz ?? 130.81;

    const session: PracticeSession = {
      raagId: selectedPracticeRaag,
      raagName: selectedPracticeRaag === "yaman" ? "Raag Yaman" : 
                selectedPracticeRaag === "bhairav" ? "Raag Bhairav" : 
                selectedPracticeRaag === "bageshree" ? "Raag Bageshree" : "Raag Bhupali",
      scaleLabel: westernNote(saHz).name,
      baseHz: saHz,
      durationMins: selectedPracticeDuration,
      secondsRemaining: selectedPracticeDuration * 60,
      isSelectedTuning: optimalTuning,
      tempoBpm: 65,
      volume: 75
    };

    setActivePractice(session);
    startPracticeTanpura(session);
  };

  const handleStopPracticeSession = (saveToJournal: boolean) => {
    stopPracticeTanpura();
    
    if (saveToJournal && activePractice) {
      // Real elapsed time of this timed session
      const totalSeconds = activePractice.durationMins * 60;
      const elapsedMinutes = (totalSeconds - activePractice.secondsRemaining) / 60;
      if (elapsedMinutes >= 0.5) {
        addRecord({
          kind: "riyaz-timer",
          id: newId(),
          dateIso: new Date().toISOString(),
          raagName: activePractice.raagName,
          minutes: Number(elapsedMinutes.toFixed(1)),
        });
        setSavedMessage(`Saved ${Math.round(elapsedMinutes)} min of riyaz on ${activePractice.raagName}.`);
      } else {
        setSavedMessage("Sessions shorter than 30 seconds are not saved.");
      }
      window.setTimeout(() => setSavedMessage(null), 4000);
    }
    setActivePractice(null);
  };

  const togglePracticeTuning = (tuning: "Pa" | "Ma" | "Ni") => {
    if (!activePractice) return;
    setActivePractice({ ...activePractice, isSelectedTuning: tuning });
    tanpuraRef.current?.setOptions({ firstString: tuning });
  };

  const handleTempoChange = (newTempo: number) => {
    if (!activePractice) return;
    setActivePractice({ ...activePractice, tempoBpm: newTempo });
    tanpuraRef.current?.setOptions({ cycleSec: cycleFromTempo(newTempo) });
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!activePractice) return;
    setActivePractice({ ...activePractice, volume: newVolume });
    tanpuraRef.current?.setOptions({ volume: newVolume / 100 });
  };


  const handleAction = (tab: AppTab, mode?: string) => {
    if (tab === "analyzer" && mode) setAnalyzerMode?.(mode as AnalyzerMode);
    if (tab === "practice") setPracticeMode?.((mode as "palta" | "pakad" | "ear") ?? "palta");
    setActiveTab(tab);
  };


  // Human countdown converter helper
  const renderFormattedSeconds = (secTotal: number) => {
    const mins = Math.floor(secTotal / 60);
    const secs = secTotal % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active practice raag details

  return (
    <div className="space-y-6">
      {savedMessage && (
        <div className="p-3 rounded-xl border border-emerald-600/40 bg-emerald-500/10 text-emerald-200 text-xs" role="status">{savedMessage}</div>
      )}
      
      {/* IMMERSIVE RIYAZ PRACTICE ACTIVE COMPANION SCREEN */}
      {activePractice ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500" id="riyaz-practice-dashboard">
          
          {/* Active Status header panel */}
          <div className="bg-gradient-to-r from-[#171424] to-[#111827] border-2 border-[#7C3AED]/70 p-6 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 h-48 w-48 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-2 text-center md:text-left z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse">
                <Music className="h-3.5 w-3.5 text-[#FBBF24]" />
                Live Riyāz Session Active
              </div>
              <h1 className="text-3xl font-serif font-black text-slate-100 tracking-wide">
                Practice: {activePractice.raagName}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Anchored to Scale: <span className="text-[#38BDF8] font-bold">{activePractice.scaleLabel} ({activePractice.baseHz.toFixed(1)} Hz)</span> • 
                Plucking Drone Tuning: <span className="text-[#FBBF24] font-bold">Shaddaj + {activePractice.isSelectedTuning}</span>
              </p>
            </div>

            {/* Countdown Clock Panel */}
            <div className="flex flex-col items-center bg-[#0F1115]/80 border border-slate-800 p-4 rounded-2xl min-w-[150px] shadow-inner shrink-0 relative">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Riyāz Timer</span>
              <div className="text-3xl font-black font-mono text-[#FBBF24] py-1 tracking-wider leading-none">
                {renderFormattedSeconds(activePractice.secondsRemaining)}
              </div>
              <span className="text-[8px] font-mono text-slate-400">Total duration: {activePractice.durationMins} mins</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Physical Tanpura PLUCK engine controllers */}
            <div className="lg:col-span-4 bg-[#151A2E] p-5 rounded-2xl border border-slate-850 shadow-xl flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="border-b border-slate-850 pb-2">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest block">Acoustic Anchor Synthesizer</span>
                </div>

                {/* Simulated 4-string Pluck Bridge Wave representation */}
                <div className="bg-[#0F1115] border border-slate-900 rounded-xl p-4 flex flex-col justify-center items-center min-h-[140px] relative">
                  <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider absolute top-2 block">Tanpura Plucking Bridge Signals</span>
                  
                  <div className="flex justify-around items-center w-full h-16 max-w-xs mt-3">
                    {[0, 1, 2, 3].map((strIdx) => {
                      const labels = [activePractice.isSelectedTuning, "Sa", "Sa", "Kharaj Sa"];
                      const isPlucking = activeString === strIdx;
                      return (
                        <div key={strIdx} className="flex flex-col items-center gap-2">
                          {/* Animated Plucking String Node */}
                          <div className="h-20 w-3 bg-slate-900 rounded-full relative flex justify-center">
                            {/* The vibrating inner string wire line */}
                            <div className={`w-[1px] h-full transition-all bg-slate-600 ${
                              isPlucking ? "bg-purple-500 shadow-[0_0_15px_#7C3AED] scale-x-[3] animate-pulse" : ""
                            }`} />
                            {/* Plucking node dot indicator */}
                            <div className={`absolute top-1/2 -transform-y-1/2 h-3.5 w-3.5 rounded-full border border-slate-800 transition-all duration-150 ${
                              isPlucking ? "bg-[#FBBF24] scale-125 border-orange-500 shadow-[0_0_8px_#FBBF24]" : "bg-slate-800"
                            }`} />
                          </div>
                          <span className={`text-[9px] font-mono font-bold ${isPlucking ? "text-[#FBBF24]" : "text-slate-500"}`}>
                            {labels[strIdx]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Synthesizer parameter tuners */}
                <div className="space-y-3.5 pt-2">
                  
                  {/* Select Pluck Mode tuning anchors */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">1st String Plucking Standard (Anchor)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {["Pa", "Ma", "Ni"].map((opt) => {
                        const isSel = activePractice.isSelectedTuning === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => togglePracticeTuning(opt as any)}
                            className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                              isSel 
                                ? "bg-[#7C3AED] border-purple-500 text-white shadow-md shadow-purple-950/20" 
                                : "bg-[#0F1115] border-slate-850 hover:border-slate-800 text-slate-400"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plucking Tempo (interval spacing) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 font-bold">
                      <span className="uppercase">Plucking String Interval Tempo</span>
                      <span className="text-slate-400">{activePractice.tempoBpm} BPM</span>
                    </div>
                    <input 
                      type="range" 
                      min="40" 
                      max="110" 
                      value={activePractice.tempoBpm}
                      onChange={(e) => handleTempoChange(parseInt(e.target.value))}
                      className="w-full accent-[#7C3AED] bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 font-bold">
                      <span className="uppercase">Volume Level</span>
                      <span className="text-slate-400">{activePractice.volume}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-slate-500 shrink-0" />
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={activePractice.volume}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                        className="w-full accent-amber-500 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Action Close Buttons */}
              <div className="pt-4 border-t border-slate-900 flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStopPracticeSession(true)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-mono text-xs font-black uppercase tracking-widest hover:opacity-95 shadow-lg transform active:translate-y-0.5 duration-200 cursor-pointer flex justify-center items-center gap-1.5"
                >
                  <Award className="h-4 w-4" />
                  Complete Riyāz & Save Log
                </button>
                <button
                  type="button"
                  onClick={() => handleStopPracticeSession(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold uppercase cursor-pointer flex justify-center items-center gap-1"
                >
                  <Square className="h-3.5 w-3.5" />
                  Discard Live Session
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: raag facts from the library, its pakad, and generated paltas */}
            <div className="lg:col-span-8 space-y-6">
              {(() => {
                const r = RAAG_LIST.find(x => x.id === activePractice.raagId);
                if (!r) return null;
                const d = RAAG_DETAILS[r.id];
                const SYM = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];
                const paltas = generatePaltas(r).slice(0, 3);
                return (
                  <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">{r.name.replace(/^Raag\s+/i, "")}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      {[["Thaat", r.thaat], ["Vadi", SYM[r.vadi]], ["Samvadi", SYM[r.samvadi]], ["Time", r.time]].map(([k, v]) => (
                        <div key={k} className="bg-[#0F1115] p-3 rounded-xl border border-slate-800">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">{k}</span>
                          <span className="text-slate-200 font-bold block mt-0.5">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-center">
                      {[["Aroh", r.aroha.join(" ")], ["Avaroh", r.avaroha.join(" ")], ["Pakad", d ? d.pakad : "Not written yet"]].map(([k, v]) => (
                        <div key={k} className="bg-[#0F1115]/80 p-3 rounded-xl border border-slate-900">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">{k}</span>
                          <span className="text-sm font-bold text-slate-300 block mt-1">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">Paltas for this raag (score them in the Paltas tab)</span>
                      {paltas.map(p => (
                        <div key={p.id} className="font-mono text-xs text-slate-400 border-b border-slate-900 pb-1">
                          <span className="text-slate-300 font-bold">{p.name}:</span> {p.notes.map(n => n.label).join(" ")}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500">From the raag library (awaiting a guru's review).</p>
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      ) : (
        /* STANDARD MULTI-RESOURCE HOMETAB SCREEN */
        <div className="space-y-6">
          
          {/* 1. Hero Welcoming Section with classic motifs */}
          <div className="bg-[#151A2E] border-2 border-[#7C3AED]/40 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Background Mandala Vector effect */}
            <div className="absolute top-0 right-0 h-64 w-64 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-[#38BDF8]/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Texts */}
            <div className="space-y-4 max-w-xl text-center lg:text-left relative z-10 font-sans">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 text-[#FBBF24]" />
                Classical Music Learning Companion
              </div>
              
              <h1 className="text-3xl font-serif font-black text-slate-100 tracking-wide leading-tight">
                Pranam, {vocalistName}
              </h1>
              
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                Start the tanpura, sing, and see your swaras measured against your own Sa. Your plan for today is below.
              </p>

              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-2 text-xs font-mono">
                <span className="bg-[#0F1115] border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold">Your Sa: {baseTonicHz.toFixed(1)} Hz ({westernNote(baseTonicHz).name})</span>
              </div>
            </div>

            {/* Traditional Tanpura Neck design visual badge */}
            <div className="hidden lg:flex h-44 w-44 shrink-0 rounded-2xl bg-[#0F1115]/90 border border-slate-800 p-4 flex-col items-center justify-between relative shadow-inner">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Naad AI</span>
              <div className="flex flex-col items-center flex-grow justify-center gap-1.5">
                <div className="relative">
                  {/* Diya Oil Lamp symbol */}
                  <div className="h-10 w-10 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/50 flex items-center justify-center relative">
                    <span className="text-lg text-[#FBBF24] leading-none select-none">ॐ</span>
                    <div className="absolute -top-1.5 h-3 w-1.5 bg-orange-500 rounded-full blur-[0.5px] animate-pulse" />
                  </div>
                </div>
                <span className="text-xs text-slate-300 font-serif font-bold text-center">Riyaz</span>
              </div>
            </div>

          </div>

          {/* NEW INTERACTIVE PRACTICE LAUNCH ALTAR */}
          <div className="bg-[#151A2E] border border-slate-850 p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden" id="practice-setup-card">
            
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#7C3AED]">
                <Flame className="h-5 w-5 text-amber-500 fill-amber-500/20" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-widest">Timed riyaz with tanpura</h3>
                <span className="text-[10px] text-slate-450 block font-normal font-sans">Choose a raag and a duration; the tanpura plays your Sa and the time is saved to your progress.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              
              {/* Selector A: Choose Raga */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Select Raga Profile</label>
                <div className="relative">
                  <select 
                    value={selectedPracticeRaag}
                    onChange={(e) => setSelectedPracticeRaag(e.target.value)}
                    className="w-full bg-[#0F1115] border border-slate-800 text-slate-300 font-bold p-3 rounded-xl appearance-none cursor-pointer hover:border-purple-500/50 focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="yaman">Raag Yaman (Evening - Kalyan)</option>
                    <option value="bhairav">Raag Bhairav (Dawn - Meditative)</option>
                    <option value="bageshree">Raag Bageshree (Late Night - Longing)</option>
                    <option value="bhupali">Raag Bhupali (Night Pentatonic - Joy)</option>
                  </select>
                  <ChevronRight className="h-4 w-4 text-slate-500 absolute top-4 right-3 transform rotate-45 pointer-events-none" />
                </div>
              </div>

              {/* Sa: always the singer's own */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Sa</label>
                <div className="w-full bg-[#0F1115] border border-slate-800 text-slate-300 font-bold p-3 rounded-xl">
                  {(baseTonicHz ?? 130.81).toFixed(1)} Hz ({westernNote(baseTonicHz ?? 130.81).name}) · change it in the Tanpura tab or with "Find my Sa"
                </div>
              </div>

              {/* Selector C: Choose Duration */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Select Segment Duration</label>
                <div className="relative">
                  <select 
                    value={selectedPracticeDuration}
                    onChange={(e) => setSelectedPracticeScaleDuration(parseInt(e.target.value))}
                    className="w-full bg-[#0F1115] border border-slate-800 text-slate-300 font-bold p-3 rounded-xl appearance-none cursor-pointer hover:border-purple-500/50 focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                  <ChevronRight className="h-4 w-4 text-slate-500 absolute top-4 right-3 transform rotate-45 pointer-events-none" />
                </div>
              </div>

            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartPracticeSession}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] hover:opacity-95 text-slate-950 font-mono text-xs font-black uppercase tracking-widest shadow-xl transform active:translate-y-0.5 transition duration-200 cursor-pointer flex justify-center items-center gap-2"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                Start timed riyaz
              </button>
            </div>

          </div>

          {/* 3. Primary Fast Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            <button
              onClick={() => handleAction("analyzer", "scale")}
              className="p-4 bg-[#151A2E] hover:border-[#38BDF8]/65 border border-slate-805 rounded-2xl flex flex-col items-start gap-4 transition-all text-left shadow-lg cursor-pointer group"
            >
              <div className="h-10 w-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/35 flex items-center justify-center text-[#38BDF8]">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide flex items-center gap-1">
                  Find My Scale
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Measure your natural Sa</span>
              </div>
            </button>

            <button
              onClick={() => handleAction("analyzer", "singing")}
              className="p-4 bg-[#151A2E] hover:border-[#7C3AED]/65 border border-slate-805 rounded-2xl flex flex-col items-start gap-4 transition-all text-left shadow-lg cursor-pointer group"
            >
              <div className="h-10 w-10 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/35 flex items-center justify-center text-[#7C3AED]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide flex items-center gap-1">
                  Analyze Singing
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Record or upload, and see every swara measured</span>
              </div>
            </button>

            <button
              onClick={() => handleAction("tanpura")}
              className="p-4 bg-[#151A2E] hover:border-[#FBBF24]/65 border border-slate-805 rounded-2xl flex flex-col items-start gap-4 transition-all text-left shadow-lg cursor-pointer group"
            >
              <div className="h-10 w-10 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/35 flex items-center justify-center text-[#FBBF24]">
                <Music className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide flex items-center gap-1">
                  Start Tanpura
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Tanpura drone and taal</span>
              </div>
            </button>

            <button
              onClick={() => handleAction("library")}
              className="p-4 bg-[#151A2E] hover:border-[#38BDF8]/50 border border-slate-805 rounded-2xl flex flex-col items-start gap-4 transition-all text-left shadow-lg cursor-pointer group"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-950/20 border border-slate-750 flex items-center justify-center text-indigo-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide flex items-center gap-1">
                  Explore Raags
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Aroh, avaroh, pakad and similar raags</span>
              </div>
            </button>

          </div>

          {/* 4. Raags for now, today's plan from measurements, real streak */}
          <TodayPanel onGo={g => handleAction(g.tab, g.mode)} />

        </div>
      )}

    </div>
  );
};
