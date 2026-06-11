/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, Sliders, Music, Zap } from 'lucide-react';

interface TanpuraTabProps {
  baseTonicHz: number;
  onTonicChange?: (hz: number) => void;
  selectedTuning?: "Pa" | "Ma" | "Ni";
  onTuningChange?: (tuning: "Pa" | "Ma" | "Ni") => void;
}

// Convert note labels to frequencies (C3 base standard)
const NOTE_PITCHES = [
  { note: "C", hz: 130.81 },
  { note: "C#", hz: 138.59 },
  { note: "D", hz: 146.83 },
  { note: "D#", hz: 155.56 },
  { note: "E", hz: 164.81 },
  { note: "F", hz: 174.61 },
  { note: "F#", hz: 185.00 },
  { note: "G", hz: 196.00 },
  { note: "G#", hz: 207.65 },
  { note: "A", hz: 220.00 },
  { note: "A#", hz: 233.08 },
  { note: "B", hz: 246.94 }
];

export const TanpuraTab: React.FC<TanpuraTabProps> = ({
  baseTonicHz,
  onTonicChange,
  selectedTuning = "Pa",
  onTuningChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNote, setSelectedNote] = useState("C#");
  const [playbackMode, setPlaybackMode] = useState<"Male" | "Female" | "Instrumental">("Male");
  const [droneOption, setDroneOption] = useState<"Pa" | "Ma" | "Custom">("Pa");
  
  const [volume, setVolume] = useState(70); // 0 to 100
  const [fineTuning, setFineTuning] = useState(0); // cents -50 to +50
  const [tempo, setTempo] = useState(60); // Pluck interval BPM (roughly 40-125)

  // Track active string animation transitions
  const [activeString, setActiveString] = useState<number | null>(null);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const sequencerTimeoutRef = useRef<number | null>(null);
  const activeStringIndexRef = useRef<number>(0);

  // Synchronize Note frequency to baseTonicHz from parent
  useEffect(() => {
    const matched = NOTE_PITCHES.find(n => Math.abs(n.hz - baseTonicHz) < 1.0);
    if (matched) {
      setSelectedNote(matched.note);
    }
  }, [baseTonicHz]);

  const handleNoteChange = (note: string, hz: number) => {
    setSelectedNote(note);
    if (onTonicChange) {
      // Modify frequency multiplier depending we are Female base or Male base
      let adjustedHz = hz;
      if (playbackMode === "Female") {
        adjustedHz = hz * 1.5; // shift up a fifth for typical female Sa (G3 base)
      } else if (playbackMode === "Instrumental") {
        adjustedHz = hz * 1.25; // slightly higher
      }
      onTonicChange(adjustedHz);
    }
  };

  const handlePlaybackModeChange = (mode: "Male" | "Female" | "Instrumental") => {
    setPlaybackMode(mode);
    const matched = NOTE_PITCHES.find(n => n.note === selectedNote);
    if (matched && onTonicChange) {
      let adjustedHz = matched.hz;
      if (mode === "Female") {
        adjustedHz = matched.hz * 1.5;
      } else if (mode === "Instrumental") {
        adjustedHz = matched.hz * 1.25;
      }
      onTonicChange(adjustedHz);
    }
  };

  // Safe cleaner
  const stopTanpuraAudio = () => {
    if (sequencerTimeoutRef.current) {
      clearTimeout(sequencerTimeoutRef.current);
      sequencerTimeoutRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(e => console.error("Audio Context close error:", e));
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
    setActiveString(null);
  };

  useEffect(() => {
    return () => {
      stopTanpuraAudio();
    };
  }, []);

  // Hot refresh of volume if playing
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume / 100, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Plucks a single high-fidelity Tanpura string synthesis
  const playStringPluck = (stringIdx: number, frequency: number, duration: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    // Apply fine-tuning offset cents
    const centsMultiplier = Math.pow(2, fineTuning / 1200);
    const tunedFreq = frequency * centsMultiplier;

    // Rich Jawari resonator combining multiple saw/triangle nodes to recreate "buzzing" string ring
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const pluckGainNode = ctx.createGain();
    const lowpassNode = ctx.createBiquadFilter();

    osc1.type = "sawtooth";
    osc2.type = "triangle";
    subOsc.type = "sine";

    // Set frequencies with slight chorused detuning for String 2 & 3
    osc1.frequency.setValueAtTime(tunedFreq, ctx.currentTime);
    osc2.frequency.setValueAtTime(tunedFreq * 1.002, ctx.currentTime); // slight detune for resonant heat
    subOsc.frequency.setValueAtTime(tunedFreq * 0.5, ctx.currentTime); // sub harmonic for depth

    // Buzzing Jawari filter envelope simulating the bridge thread
    lowpassNode.type = "lowpass";
    lowpassNode.Q.setValueAtTime(4.0, ctx.currentTime);
    lowpassNode.frequency.setValueAtTime(150, ctx.currentTime);
    lowpassNode.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.05);
    lowpassNode.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);

    // Amplitude decay envelope (long ring with exponential fall)
    pluckGainNode.gain.setValueAtTime(0, ctx.currentTime);
    pluckGainNode.gain.linearRampToValueAtTime(stringIdx === 3 ? 0.35 : 0.25, ctx.currentTime + 0.03); // Quick rise
    pluckGainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration); // Long ring decay

    // Route audio blocks
    osc1.connect(lowpassNode);
    osc2.connect(lowpassNode);
    subOsc.connect(pluckGainNode);
    lowpassNode.connect(pluckGainNode);
    pluckGainNode.connect(masterGainRef.current!);

    // Start & Stop
    osc1.start();
    osc2.start();
    subOsc.start();

    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
    subOsc.stop(ctx.currentTime + duration);
  };

  // Continuous loop sequencer triggering the sequential plucks
  const runDroneLoop = () => {
    if (!audioCtxRef.current) return;

    const stringIndex = activeStringIndexRef.current;
    setActiveString(stringIndex);

    // Calculate string pitch depending on the selected tonic (Sa)
    let stringFrequency = baseTonicHz;

    if (stringIndex === 0) {
      // First string: Pa or Ma or Ni (Custom)
      if (droneOption === "Pa") {
        stringFrequency = baseTonicHz * 0.75; // low Pa (dominant fifth)
      } else if (droneOption === "Ma") {
        stringFrequency = baseTonicHz * (4/3) * 0.5; // low Ma
      } else {
        stringFrequency = baseTonicHz * 1.875 * 0.5; // Shuddha Ni
      }
    } else if (stringIndex === 1) {
      // Second string: Middle Sa
      stringFrequency = baseTonicHz;
    } else if (stringIndex === 2) {
      // Third string: Middle Sa (chorus offset)
      stringFrequency = baseTonicHz * 1.001;
    } else if (stringIndex === 3) {
      // Fourth string: Low Kharaj Sa
      stringFrequency = baseTonicHz * 0.5;
    }

    // Play string pluck (4.5s decay time)
    playStringPluck(stringIndex, stringFrequency, 4.5);

    // Advance sequencer index (0 ➔ 1 ➔ 2 ➔ 3 ➔ 0)
    activeStringIndexRef.current = (stringIndex + 1) % 4;

    // Retrieve interval between plucks from tempo (in ms)
    // 60 BPM = 1000ms pause. Higher tempo = faster sequential plucks
    const pluckIntervalMs = (60 / tempo) * 1200;

    sequencerTimeoutRef.current = window.setTimeout(runDroneLoop, pluckIntervalMs);
  };

  const startTanpuraAudio = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume / 100, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      activeStringIndexRef.current = 0;
      setIsPlaying(true);
      
      // Start sequential drone loops
      runDroneLoop();
    } catch (e) {
      console.error("Failed to initialize Web Audio Tanpura Synth:", e);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopTanpuraAudio();
    } else {
      startTanpuraAudio();
    }
  };

  return (
    <div id="tanpura-drone-card" className="bg-[#151A2E] p-6 rounded-2xl border border-[#7C3AED]/40 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
      
      {/* Absolute Decorative Motif Background */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-[#7C3AED]/15 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header section with traditional label */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-850 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED] flex items-center justify-center text-[#FBBF24]">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-sans tracking-wide">Digital Tanpura Drone</h3>
            <p className="text-xs text-slate-400">Microtonal acoustic resonance generator</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#7C3AED]/30 text-[#38BDF8] px-2.5 py-1 rounded-full border border-[#7C3AED]/20 uppercase tracking-widest animate-pulse">
          JAWARI RESWELL active
        </span>
      </div>

      {/* Key Layout: String visual display and note trigger blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Side: String Board (4 long strings with visual vibrational ripple) */}
        <div className="lg:col-span-4 bg-[#0F1115]/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-between min-h-[290px] shadow-inner">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Acoustic String Board</span>
          
          <div className="flex items-stretch justify-around w-full flex-grow my-4 px-2">
            {[0, 1, 2, 3].map((stringIdx) => {
              const isActive = activeString === stringIdx;
              const vibrationStyle = isActive 
                ? "shadow-[0_0_15px_rgba(124,58,237,0.8)] border-[#38BDF8] border-[1.5px] scale-x-[1.05] animate-pulse" 
                : "border-purple-950/55 hover:border-slate-700/80";
              const noteLabel = stringIdx === 0 ? droneOption : stringIdx === 3 ? "Kharaj Sa" : "Sa";

              return (
                <div 
                  key={stringIdx}
                  onClick={() => {
                    // Trigger manual pluck sound on click!
                    if (audioCtxRef.current) {
                      let manualFreq = baseTonicHz;
                      if (stringIdx === 0) manualFreq = baseTonicHz * (droneOption === "Pa" ? 0.75 : 0.66);
                      else if (stringIdx === 3) manualFreq = baseTonicHz * 0.5;
                      playStringPluck(stringIdx, manualFreq, 4.0);
                      setActiveString(stringIdx);
                      setTimeout(() => setActiveString(null), 1500);
                    }
                  }}
                  className="flex flex-col items-center cursor-pointer group px-2"
                  title="Click to pluck string manually"
                >
                  <span className="text-[8px] font-mono text-slate-500 mb-1 group-hover:text-[#FBBF24] transition-colors">{noteLabel}</span>
                  <div className="flex-grow flex justify-center w-6 items-center relative">
                    {/* Glowing vibrating string line */}
                    <div className={`w-[1px] h-full transition-all duration-300 ${
                      isActive ? "bg-gradient-to-b from-[#38BDF8] via-[#7C3AED] to-[#38BDF8]" : "bg-slate-700"
                    } ${vibrationStyle}`} />

                    {/* Sitar jawari bead visual indicator */}
                    <div className={`absolute bottom-4 h-2 w-2 rounded-full transition-all border ${
                      isActive ? 'bg-[#FBBF24] border-white scale-125' : 'bg-slate-900 border-slate-800'
                    }`} />
                  </div>
                  <span className="text-[8px] font-mono text-slate-600 mt-1">S{stringIdx+1}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[9px] font-mono text-slate-500 text-center italic">Click on a string to pluck manually</p>
        </div>

        {/* Right Side: Drone Scale Controllers and Tuning parameters */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Pitch Scale Quick Select buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Select Scale (Sa Tonic)</span>
            <div className="grid grid-cols-6 gap-1.5">
              {NOTE_PITCHES.map((p) => {
                const isSelected = selectedNote === p.note;
                return (
                  <button
                    key={p.note}
                    type="button"
                    onClick={() => handleNoteChange(p.note, p.hz)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/20 scale-105"
                        : "bg-[#0F1115]/50 hover:bg-[#0F1115] border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p.note}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual Toggle Option columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Playback Mode (Male / Female / Instrumental) */}
            <div className="space-y-1.5 bg-[#0F1115]/50 p-3 rounded-xl border border-slate-850">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">Tonal Mode</span>
              <div className="grid grid-cols-3 gap-1">
                {["Male", "Female", "Instrumental"].map((mode) => {
                  const isActive = playbackMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handlePlaybackModeChange(mode as any)}
                      className={`py-1.5 text-[10px] rounded-lg font-mono font-bold transition-all border cursor-pointer ${
                        isActive 
                          ? "bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]" 
                          : "bg-[#0f1115] border-slate-850 text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drone Options (Pa / Ma / Custom) */}
            <div className="space-y-1.5 bg-[#0F1115]/50 p-3 rounded-xl border border-slate-850">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">Tuning Swara</span>
              <div className="grid grid-cols-3 gap-1">
                {["Pa", "Ma", "Custom"].map((opt) => {
                  const isActive = droneOption === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setDroneOption(opt as any);
                        if (onTuningChange) onTuningChange(opt as any);
                      }}
                      className={`py-1.5 text-[10px] rounded-lg font-mono font-bold transition-all border cursor-pointer ${
                        isActive 
                          ? "bg-[#FBBF24]/20 border-[#FBBF24] text-[#FBBF24]" 
                          : "bg-[#0f1115] border-slate-850 text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      {opt === "Custom" ? "Nishad (Ni)" : opt}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Precision Controls Sliders (Volume, Tuning offset, Plucking speed) */}
          <div className="bg-[#0F1115]/40 p-4 rounded-xl border border-slate-850 space-y-4">
            
            {/* Slider 1: Volume */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> Drone Volume</span>
                <span className="font-bold text-slate-200">{volume}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#7C3AED] h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 2: Microtonal Fine Tuning */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1"><Sliders className="h-3 w-3" /> Microtuning (Cents)</span>
                <span className={`font-bold ${fineTuning > 0 ? "text-emerald-400" : fineTuning < 0 ? "text-rose-400" : "text-slate-200"}`}>
                  {fineTuning > 0 ? `+${fineTuning}` : fineTuning} Hz cents
                </span>
              </div>
              <input 
                type="range"
                min="-50"
                max="50"
                value={fineTuning}
                onChange={(e) => setFineTuning(Number(e.target.value))}
                className="w-full accent-[#38BDF8] h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 3: Pluck Speed / Tempo */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Pluck Laya (Tempo)</span>
                <span className="font-bold text-slate-200">{tempo} BPM</span>
              </div>
              <input 
                type="range"
                min="35"
                max="110"
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-full accent-[#FBBF24] h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

          </div>

          {/* Master Trigger Audio Button */}
          <button
            type="button"
            onClick={togglePlayback}
            className={`w-full py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-widest transition-all shadow-xl font-bold cursor-pointer flex items-center justify-center gap-2 ${
              isPlaying
                ? "bg-rose-600 hover:bg-rose-500 text-white hover:scale-102 border-transparent"
                : "bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] text-slate-950 hover:opacity-95 hover:scale-102 border-transparent"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="h-4 w-4 fill-white" />
                <span>Stop Tanpura Drone Session</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Synthesize Tanpura Drone</span>
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
};
