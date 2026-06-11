/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity, HelpCircle, RefreshCw, Zap } from 'lucide-react';

interface TaalMetronomeProps {
  onBeatTrigger: (beat: number, totalBeats: number) => void;
  onTaalStatsChange: (stats: { taalAccuracy: number; driftMs: number }) => void;
  currentTheme?: "peacock" | "sunset" | "monsoon";
}

// Predefined traditional Indian Taals with accents and syllables (bols)
const TAAL_PRESETS = [
  {
    id: "teentaal",
    name: "Teentaal (16 Beats)",
    beats: 16,
    subdivisions: [4, 4, 4, 4], // 4 bars of 4 matras
    vibhags: [
      { beat: 1, type: "Sam (Clap 1)", description: "The powerful physical root beat" },
      { beat: 5, type: "Taali 2 (Clap)", description: "Second physical gesture accent" },
      { beat: 9, type: "Khali (Wave)", description: "The critical silence checkpoint" },
      { beat: 13, type: "Taali 3 (Clap)", description: "Third physical gesture accent" }
    ],
    bols: [
      "Dha", "Dhin", "Dhin", "Dha",
      "Dha", "Dhin", "Dhin", "Dha",
      "Dha", "Tin", "Tin", "Ta",
      "Ta", "Dhin", "Dhin", "Dha"
    ]
  },
  {
    id: "ektaal",
    name: "Ektaal (12 Beats)",
    beats: 12,
    subdivisions: [2, 2, 2, 2, 2, 2], // 6 bars of 2 matras
    vibhags: [
      { beat: 1, type: "Sam (Clap 1)", description: "The primary root beat" },
      { beat: 3, type: "Khali 1 (Wave)", description: "First silence bar" },
      { beat: 5, type: "Taali 2 (Clap)", description: "Second physical accent" },
      { beat: 7, type: "Khali 2 (Wave)", description: "Second silence bar" },
      { beat: 9, type: "Taali 3 (Clap)", description: "Third physical accent" },
      { beat: 11, type: "Taali 4 (Clap)", description: "Fourth physical accent" }
    ],
    bols: [
      "Dhin", "Dhin",
      "Dhage", "Tirikit",
      "Tu", "Na",
      "Kat", "Ta",
      "Dhage", "Tirikit",
      "Dhi", "Na"
    ]
  }
];

export const TaalMetronome: React.FC<TaalMetronomeProps> = ({
  onBeatTrigger,
  onTaalStatsChange,
  currentTheme
}) => {
  const [activeTaalIdx, setActiveTaalIdx] = useState(0);
  const [bpm, setBpm] = useState(90);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [tapHistory, setTapHistory] = useState<{ beat: number; deltaMs: number; status: string }[]>([]);

  // Refs for tracking scheduling timer accurate timestamps
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const currentTaal = TAAL_PRESETS[activeTaalIdx];

  // Keep track of expected beat timings for tap latency measurements
  const expectedBeatTimeRef = useRef<number>(0);
  const runningTapsRef = useRef<{ timestamp: number }[]>([]);

  useEffect(() => {
    return () => {
      stopMetronome();
    };
  }, [bpm, activeTaalIdx]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  /**
   * Synthesizes authentic, high/low Indian Tabla drums using Web Audio API:
   *  - Bayan (bass drum): clean, pitch-swept sine wave at low frequencies (60Hz to 110Hz).
   *  - Dayan (high drum/brass rim ring): resonant high-passed wave or swept bandpass at ~300Hz.
   * This provides an unbelievably rich and authentic rhythmic baseline compared to standard click tracks!
   */
  const playTablaDrum = (bol: string, isSam: boolean) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // 1. Synthesize Dayan (Treble Drum) 'Tin / Ta / Dhin rim chime'
    const trebleOsc = ctx.createOscillator();
    const trebleGain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();

    trebleOsc.type = "sine";
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(isSam ? 240 : 280, now);
    bandpass.Q.setValueAtTime(12, now);

    // Dayan envelope
    trebleGain.gain.setValueAtTime(0, now);
    trebleGain.gain.linearRampToValueAtTime(isSam ? 0.75 : 0.5, now + 0.005);
    trebleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    trebleOsc.frequency.setValueAtTime(isSam ? 240 : 280, now);
    // Add subtle pitch sweep for Dayan ring
    trebleOsc.frequency.exponentialRampToValueAtTime(isSam ? 220 : 260, now + 0.15);

    trebleOsc.connect(bandpass);
    bandpass.connect(trebleGain);
    trebleGain.connect(ctx.destination);
    trebleOsc.start(now);
    trebleOsc.stop(now + 0.4);

    // 2. Synthesize Bayan (Bass drum sweep) for 'Dha / Dhin / Dhi' sounds
    const hasBass = ["Dha", "Dhin", "Dhi", "Dhage"].some(b => bol.includes(b));
    if (hasBass) {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();

      bassOsc.type = "sine";
      bassGain.gain.setValueAtTime(0, now);
      bassGain.gain.linearRampToValueAtTime(isSam ? 0.65 : 0.45, now + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      // Deep sliding Indian bass sweep
      bassOsc.frequency.setValueAtTime(65, now);
      bassOsc.frequency.exponentialRampToValueAtTime(110, now + 0.08); // traditional pitch upward slide
      bassOsc.frequency.exponentialRampToValueAtTime(50, now + 0.3); // decay slide down

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.5);
    }
  };

  const playSynthesizedMetronomeTick = (beatIndex: number) => {
    const isSam = beatIndex === 1;
    const currentBol = currentTaal.bols[beatIndex - 1] || "Ta";
    
    // Play the physical Tabla sound synthetic modeling
    playTablaDrum(currentBol, isSam);
  };

  const startMetronome = () => {
    initAudio();
    setIsMetronomeActive(true);
    setCurrentBeat(1);
    onBeatTrigger(1, currentTaal.beats);

    const msPerBeat = (60 / bpm) * 1000;
    expectedBeatTimeRef.current = Date.now();
    playSynthesizedMetronomeTick(1);

    let nextBeatNum = 2;

    metronomeIntervalRef.current = setInterval(() => {
      setCurrentBeat(nextBeatNum);
      onBeatTrigger(nextBeatNum, currentTaal.beats);
      
      expectedBeatTimeRef.current = Date.now();
      playSynthesizedMetronomeTick(nextBeatNum);

      // Loop beats increment
      nextBeatNum = nextBeatNum >= currentTaal.beats ? 1 : nextBeatNum + 1;
    }, msPerBeat);
  };

  const stopMetronome = () => {
    setIsMetronomeActive(false);
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
  };

  const toggleMetronome = () => {
    if (isMetronomeActive) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  /**
   * Action trigger evaluating singer Tap Synchronization against the metronome bpm grid:
   * Measures physical motor action delay: calculates timing latency drift in milliseconds (Early/Late offsets).
   */
  const handleRhythmTap = () => {
    if (!isMetronomeActive) return;

    const tapTime = Date.now();
    const expectedTime = expectedBeatTimeRef.current;
    const msPerBeat = (60 / bpm) * 1000;

    // Find the difference in time relative to nearest beat
    let delta = tapTime - expectedTime;
    
    // If we tapped closer to the next impending beat, wrap around
    if (delta > msPerBeat / 2) {
      delta = delta - msPerBeat;
    } else if (delta < -msPerBeat / 2) {
      delta = delta + msPerBeat;
    }

    // Classify performance rating based on precision boundaries
    let status = "ON-BEAT (SUR-SYNC)";
    let borderClass = "text-emerald-400";
    if (Math.abs(delta) < 30) {
      status = "PERFECT (MATRA-MATCH)";
    } else if (delta > 30) {
      status = `${Math.round(delta)}ms LATE`;
    } else {
      status = `${Math.round(Math.abs(delta))}ms EARLY`;
    }

    const newTapLog = {
      beat: currentBeat,
      deltaMs: delta,
      status: status
    };

    const updatedHistory = [newTapLog, ...tapHistory].slice(0, 5);
    setTapHistory(updatedHistory);

    // Calculate aggregated metrics to feed into user's overall session stats
    const avgAbsDrift = updatedHistory.reduce((sum, h) => sum + Math.abs(h.deltaMs), 0) / updatedHistory.length;
    const accuracy = Math.max(20, Math.min(100, Math.round(100 - (avgAbsDrift / 2.5))));

    onTaalStatsChange({
      taalAccuracy: accuracy,
      driftMs: Math.round(updatedHistory.reduce((sum, h) => sum + h.deltaMs, 0) / updatedHistory.length)
    });
  };

  // Find active accent vibhag description
  const activeVibhag = currentTaal.vibhags.find(v => v.beat === currentBeat);

  return (
    <div id="taal-metronome-card" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100 font-sans tracking-wide">Taal & Rhythmic Grid</h3>
          </div>
          <select
            id="taal-selector"
            className="bg-slate-900 border border-slate-700/85 text-slate-200 text-[11px] rounded-lg py-0.5 px-2 font-sans font-medium focus:outline-none focus:border-purple-600 cursor-pointer"
            value={activeTaalIdx}
            onChange={(e) => {
              stopMetronome();
              setActiveTaalIdx(parseInt(e.target.value));
            }}
          >
            {TAAL_PRESETS.map((t, idx) => (
              <option key={t.id} value={idx}>{t.name}</option>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">Master Hindustani cycles via Tabla beat-synthetics, and tap sync to measure laya offsets.</p>
      </div>

      {/* Visual rhythmic circular progress dial mapping single aavartan */}
      <div className="my-2 relative flex flex-col items-center">
        <div id="aavartan-cycle-ring" className="h-28 w-28 rounded-full border border-dashed border-slate-800/80 flex items-center justify-center p-2 transition-all duration-300 relative bg-slate-900/10">
          
          {/* Dynamic rotating outer indicator ball representing temporal rhythm flow */}
          <div 
            className="absolute h-4 w-4 rounded-full bg-purple-500 border border-purple-300 shadow-glow flex items-center justify-center text-[7.5px] font-bold text-slate-950 transition-all duration-300"
            style={{
              transform: `rotate(${(currentBeat - 1) * (360 / currentTaal.beats) - 90}deg) translate(56px) rotate(-${(currentBeat - 1) * (360 / currentTaal.beats) - 90}deg)`
            }}
          >
            {currentBeat}
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-slate-500 font-mono">MATRA</span>
            <span className="text-2xl font-extrabold text-slate-100 font-sans leading-none">{currentBeat}</span>
            <span className={`text-[9px] uppercase font-mono tracking-wider transition-all duration-300 mt-1.5 ${
              activeVibhag ? 'text-purple-400 font-bold scale-105' : 'text-slate-400'
            }`}>
              {activeVibhag ? activeVibhag.type : `Matra ${currentBeat}`}
            </span>
          </div>
        </div>

        {/* Tabla syllable / accent indicator below radial dial */}
        <div className="mt-2 text-center max-w-[200px]">
          <span className="text-[9px] text-slate-500 font-mono block uppercase">BOL</span>
          <span className="text-lg font-bold font-serif text-purple-300 drop-shadow-md">
            "{currentTaal.bols[currentBeat - 1]}"
          </span>
          {activeVibhag && (
            <p className="text-[9px] text-slate-400 italic mt-0.5">{activeVibhag.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Dynamic tempo BPM control */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Tempo (BPM):</span>
            <span className="text-purple-400 font-bold">{bpm} BPM</span>
          </div>
          <input
            id="bpm-slider"
            type="range"
            min="50"
            max="160"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Interactive Tap Rhythm block sync zone */}
        <div className="flex gap-3">
          <button
            id="tap-sync-action-button"
            disabled={!isMetronomeActive}
            onClick={handleRhythmTap}
            className={`flex-grow h-12 rounded-xl text-xs font-semibold font-mono tracking-wide border transition-all duration-200 ${
              isMetronomeActive 
                ? 'bg-purple-900/20 text-purple-300 border-purple-800 hover:bg-purple-900/30' 
                : 'bg-slate-900/30 text-slate-600 border-slate-900/40 cursor-not-allowed'
            }`}
          >
            TAP ON-BEAT (SPACEBAR)
          </button>
          
          <button
            id="toggle-metronome-button"
            onClick={toggleMetronome}
            className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${
              isMetronomeActive 
                ? 'bg-rose-950/40 text-rose-300 border-rose-800' 
                : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent'
            }`}
          >
            {isMetronomeActive ? <Square className="h-4.5 w-4.5 fill-rose-300" /> : <Play className="h-4.5 w-4.5 fill-white" />}
          </button>
        </div>

        {/* Dynamic Tap History metrics readout */}
        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900">
          <span className="text-[10px] text-slate-500 font-mono block mb-1">RHYTHM DEVIATION LOG</span>
          {tapHistory.length === 0 ? (
            <div className="py-2 text-[10px] font-mono text-slate-600 text-center">
              Activate rhythm and tap to record timing error patterns.
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[10px]">
              {tapHistory.map((t, idx) => {
                const isEarly = t.deltaMs < 0;
                const isPerfect = Math.abs(t.deltaMs) < 30;
                return (
                  <div key={idx} className="flex justify-between items-center text-slate-400">
                    <span>Matra {t.beat}</span>
                    <span className={isPerfect ? 'text-emerald-400' : (isEarly ? 'text-amber-400' : 'text-blue-400')}>
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
