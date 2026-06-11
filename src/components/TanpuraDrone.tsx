/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, Activity, HelpCircle } from 'lucide-react';

interface TanpuraDroneProps {
  baseHz: number;
  onTonicChange: (newHz: number) => void;
  selectedTuning: "Pa" | "Ma" | "Ni";
  onTuningChange: (tuning: "Pa" | "Ma" | "Ni") => void;
  currentTheme?: "peacock" | "sunset" | "monsoon";
}

// Preset pitches commonly used in classical music vocal training
const PITCH_PRESETS = [
  { label: "Male Low (A2)", hz: 110.00 },
  { label: "Male Standard (C3)", hz: 130.81 },
  { label: "Male High (D3)", hz: 146.83 },
  { label: "Female Low (F3)", hz: 174.61 },
  { label: "Female Standard (G3)", hz: 196.00 },
  { label: "Female High (A3)", hz: 220.00 }
];

export const TanpuraDrone: React.FC<TanpuraDroneProps> = ({
  baseHz,
  onTonicChange,
  selectedTuning,
  onTuningChange,
  currentTheme
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [activeString, setActiveString] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const cycleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPluckRef = useRef<number>(0);

  // Stop sound if parameters change or on unmount
  useEffect(() => {
    return () => {
      stopDrone();
    };
  }, []);

  // Sync volume node if it changes
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioCtxRef.current.currentTime + 0.1);
    }
  }, [volume]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      // Create a standard or webkit-prefixed audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  /**
   * Synthesizes a natural, rich string pluck using multiple additive harmonics
   * modeling the "Javari" buzzing effect of the brass/steel strings on a Tanpura flat bridge.
   */
  const pluckString = (frequency: number, stringIndex: number) => {
    if (!audioCtxRef.current || !gainNodeRef.current) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Trigger visual string vibration
    setActiveString(stringIndex);
    setTimeout(() => {
      setActiveString(prev => prev === stringIndex ? null : prev);
    }, 1200);

    // Create primary carrier node
    const carrierGain = ctx.createGain();
    carrierGain.connect(gainNodeRef.current);

    // Dynamic pluck envelope
    carrierGain.gain.setValueAtTime(0, now);
    carrierGain.gain.linearRampToValueAtTime(0.8, now + 0.05); // quick pluck attack
    carrierGain.gain.exponentialRampToValueAtTime(0.18, now + 0.6); // decay
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 5.0); // long resonance body tail

    // Create Additive Harmonics to model rich string resonance
    // Tanpura strings have rich buzzing overtones (harmonics 1, 2, 3, 4, 5, 6)
    const harmonics = [1, 2, 3, 4, 5, 6, 8];
    const amplitudes = [1.0, 0.45, 0.35, 0.25, 0.15, 0.08, 0.04];
    const oscNodes: OscillatorNode[] = [];

    harmonics.forEach((harmonic, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      // Use different wave shapes for overtones
      osc.type = harmonic % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frequency * harmonic, now);
      
      // Apply slight frequency modulation for structural organic chorusing warmth
      const modHz = 0.5 + Math.random() * 0.8;
      const modDepth = 0.15 * harmonic;
      osc.frequency.setValueCurveAtTime(
        new Float32Array([
          frequency * harmonic - modDepth,
          frequency * harmonic + modDepth,
          frequency * harmonic - modDepth
        ]),
        now,
        4.0
      );

      oscGain.gain.setValueAtTime(amplitudes[idx], now);
      oscGain.gain.exponentialRampToValueAtTime(amplitudes[idx] * 0.1, now + 1.2);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(oscGain);
      oscGain.connect(carrierGain);
      osc.start(now);
      
      oscNodes.push(osc);
    });

    // Clean up nodes after string resonance ends
    setTimeout(() => {
      try {
        oscNodes.forEach(osc => osc.stop());
      } catch (e) {
        // Safe discard
      }
    }, 5500);
  };

  /**
   * Starts the rhythmic, slow looping pluck sequence of the four Tanpura strings.
   * Cycle rule: String 1 (Pa/Ma/Ni), String 2 (Middle Sa), String 3 (Middle Sa), String 4 (Mandra Sa, 1 octave below).
   */
  const startDroneSequence = () => {
    if (!isPlaying) return;

    const pluckIntervalMs = 1100; // time spacing between each string pluck
    
    // Determine target frequency based on active plucking index
    const pluckIndex = currentPluckRef.current;
    
    let frequency = baseHz;
    if (pluckIndex === 0) {
      // First string: Pa (1.5x of Sa), Ma (1.33x of Sa), or Ni (1.875x of Sa)
      if (selectedTuning === "Pa") {
        frequency = baseHz * 1.5;
      } else if (selectedTuning === "Ma") {
        frequency = baseHz * 4 / 3;
      } else {
        frequency = baseHz * 15 / 8; // Shuddha Ni ratio
      }
    } else if (pluckIndex === 1 || pluckIndex === 2) {
      // Middle strings: Middle Sa
      frequency = baseHz;
    } else if (pluckIndex === 3) {
      // Last string: Mandra Sa (bass, 1 octave lower)
      frequency = baseHz / 2;
    }

    pluckString(frequency, pluckIndex);

    // Loop to next string
    currentPluckRef.current = (pluckIndex + 1) % 4;
    cycleTimeoutRef.current = setTimeout(startDroneSequence, pluckIntervalMs);
  };

  const startDrone = () => {
    initAudio();
    setIsPlaying(true);

    if (audioCtxRef.current) {
      // Create master gain control node
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
      
      // Connect master gain to standard audio destination
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }

    currentPluckRef.current = 0;
    
    // Begin looping
    setTimeout(() => {
      startDroneSequence();
    }, 100);
  };

  const stopDrone = () => {
    setIsPlaying(false);
    setActiveString(null);
    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch (e) {}
      gainNodeRef.current = null;
    }
  };

  const toggleDrone = () => {
    if (isPlaying) {
      stopDrone();
    } else {
      startDrone();
    }
  };

  return (
    <div id="tanpura-drone-card" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100 font-sans tracking-wide">Synthesized Tanpura Drone</h3>
          </div>
          <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
        </div>
        <p className="text-xs text-slate-400 leading-snug">Authentic multi-harmonic drone tuned to your vocal base (Sa) for proper pitch-alignment.</p>
      </div>

      {/* Interactive Tanpura Strings visual plucker */}
      <div className="my-2.5 py-1 flex justify-around items-center bg-slate-900/40 p-2 rounded-xl border border-slate-900">
        {[0, 1, 2, 3].map((index) => {
          const names = [selectedTuning, "Sa", "Sa", "Sa (Bass)"];
          const isActive = activeString === index;
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-mono font-medium ${isActive ? 'text-purple-400 font-bold scale-110' : 'text-slate-500'}`}>
                {names[index]}
              </span>
              <div id={`tanpura-string-${index}`} className="h-20 w-4 flex justify-center relative cursor-pointer" onClick={() => isPlaying && pluckString(index === 0 ? (selectedTuning === "Pa" ? baseHz * 1.5 : (selectedTuning === "Ma" ? baseHz * 4/3 : baseHz * 1.875)) : (index === 3 ? baseHz / 2 : baseHz), index)}>
                {/* Thin string representation */}
                <span className={`absolute h-full w-[1.5px] rounded transition-all duration-300 ${
                  isActive 
                    ? 'bg-purple-400 animate-bounce shadow-glow-purple' 
                    : 'bg-slate-700 hover:bg-slate-500'
                }`} />
              </div>
              <span className="text-[9px] font-mono text-slate-600">Str {index + 1}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {/* Preset selections */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {PITCH_PRESETS.map((preset) => {
            const isSelected = Math.abs(preset.hz - baseHz) < 0.5;
            return (
              <button
                id={`pitch-preset-${preset.label.replace(/[^a-zA-Z0-9]/g, "-")}`}
                key={preset.label}
                onClick={() => onTonicChange(preset.hz)}
                className={`text-[10px] font-mono py-1 px-1.5 rounded transition-all duration-200 border text-center ${
                  isSelected 
                    ? 'bg-purple-950/50 border-purple-600 text-purple-300 font-medium' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Tonic Fine-tuning Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Dynamic Tonic (Sa):</span>
            <span className="text-purple-400 font-bold">{baseHz.toFixed(1)} Hz</span>
          </div>
          <input
            id="tonic-slider"
            type="range"
            min="100"
            max="240"
            step="0.5"
            value={baseHz}
            onChange={(e) => onTonicChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Dynamic First String Selection & Master Volume Group */}
        <div className="flex justify-between gap-4 py-1">
          <div className="flex flex-col gap-1 w-1/2">
            <span className="text-[10px] text-slate-500 font-mono">1ST STRING (PA/MA/NI)</span>
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              {(["Pa", "Ma", "Ni"] as const).map((t) => (
                <button
                  id={`first-string-${t}`}
                  key={t}
                  onClick={() => onTuningChange(t)}
                  className={`flex-1 text-[10px] font-mono py-1 rounded transition-all ${
                    selectedTuning === t 
                      ? 'bg-purple-600/25 text-purple-300 font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 w-1/2 justify-end">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>VOLUME</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Master Playback Triggers */}
        <button
          id="toggle-tanpura-button"
          onClick={toggleDrone}
          className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex justify-center items-center gap-2 border transition-all duration-300 ${
            isPlaying 
              ? 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/40' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-transparent shadow-lg shadow-purple-900/20'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
              <span>PAUSE TANPURA DRONE</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 text-white fill-white" />
              <span>ACTIVATE TANPURA DRONE</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
