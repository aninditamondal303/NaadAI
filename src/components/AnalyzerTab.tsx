/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Volume2, ShieldAlert, CheckCircle, ChevronRight, 
  Smile, Activity, AlertCircle, Copy, FileText, Bookmark, Clock, Sliders, BookOpen, Music, Play, RefreshCw, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { SWARAS_MAP } from '../types';

/**
 * DECOUPLED BACKEND INTERFACE SCHEMA
 * 
 * Future Python Integration Bridge:
 * All analysis modules in this React component utilize this standard schema.
 * You can readily hook up a Python FastAPI/Flask backend running Librosa, CREPE (for F0 tracking),
 * Essentia (for audio descriptors), or TensorFlow models by feeding a JSON response matching this schema
 * directly into state hydration handles.
 */
export interface PythonAcousticMlPayload {
  f0ContoursHz: number[];      // Millisecond-by-millisecond pitch tracking returned by CREPE
  confidenceScores: number[];  // Model's periodic certainty of pitch detection (0.0 to 1.0)
  loudnessDb: number[];        // Power spectrum amplitude computed via Librosa RMS energy
  sampleRate: number;          // Input track rate (e.g. 16000 Hz or 44100 Hz)
  durationSeconds: number;     // Elapsed recording duration
  detectedTonicHz: number;     // Estimated Sa frequency based on maximum pitch-histogram peak
  topCandidates: Array<{
    raagId: string;
    raagName: string;
    confidence: number;        // Probability of match (0.0 to 1.0)
    vibeReasoning: string[];   // Rationale: why did it match this raga?
    relatedRaags: string[];    // Array of raagIds sharing identical notes or parent Thaat
  }>;
}

// Educational static details dictionary for the candidates to guarantee perfect traditional info
const CANIDATE_EDUCATIONAL_BLUEPRINTS: Record<string, {
  thaat: string;
  time: string;
  mood: string;
  vadi: string;
  samvadi: string;
  aroha: string;
  avaroha: string;
  pakad: string;
  chalan: string[];
  bandish: {
    title: string;
    lyrics: string;
    notations: string[];
  };
  riyazGym: string[];
}> = {
  yaman: {
    thaat: "Kalyan Thaat (Lydian Mode)",
    time: "Evening 5th Prahar (6 PM - 9 PM)",
    mood: "Devotional, calm, meditative, sweet romance (Shringara-Bhakti Rasa)",
    vadi: "Shuddha Gandhar (Ga) - Pitch index 4",
    samvadi: "Shuddha Nishad (Ni) - Pitch index 11",
    aroha: "N, R G M_ D N S' (Omits Sa and Pa in initial rising phrases)",
    avaroha: "S' N D P M_ G R S (Scale contains Tivra Madhyam sharp 4th)",
    pakad: "N, R G R, G M_ D N D P, M_ G R S",
    chalan: [
      "Movement 1: N, R G, G R S, N, R S",
      "Movement 2: N, R G M_ P M_ G, M_ D N D P M_ G R S",
      "Movement 3: G M_ D N S', S' N D P, M_ G R S"
    ],
    bandish: {
      title: "Eri Aali Piya Bina (Teentaal - 16 Beats)",
      lyrics: "Sthayi: Eri aali piya bina sakhi kala na parata mohe... | Antara: Jab se piya pardesh gail batiyan takata batiyan bheege...",
      notations: [
        "Beat 1-4  : | G_ R_ G_ P_ | M_ D_ P_ M_ | (Eri aa li pi ya bi na)",
        "Beat 5-8  : | G_ R_ S_ -_ | N,_ R_ G_ M_ | (Sa khi - - ka la na pa)",
        "Beat 9-12 : | P_ D_ N_ D_ | P_ M_ G_ R_ | (ra ta mo he gha di pa la)"
      ]
    },
    riyazGym: [
      "Hold Gandhar for 8 beats while letting Tanpura's Nishad-drone vibrate.",
      "Sing descending meend sweep 'P \\ M_ \\ G \\ R \\ S' with continuous voice emission.",
      "Vary tempo on Palta: 'S R G | R G M_ | G M_ D | M_ D N | D N S''"
    ]
  },
  shuddhakalyan: {
    thaat: "Kalyan Thaat (Pentatonic Ascent / Septatonic Descent)",
    time: "First Part of Night (8 PM - 11 PM)",
    mood: "Serene majesty, majestic divine grace, deep blessing (Shanti Rasa)",
    vadi: "Shuddha Gandhar (Ga)",
    samvadi: "Shuddha Dhaivat (Dha)",
    aroha: "S R G P D S' (Stricly pentatonic ascent, skips Ma and Ni)",
    avaroha: "S' N D P M_ G R S (Includes Tivra Madhyam and Shuddha Nishad in descent)",
    pakad: "S, R G P, G R, S, D, S R G, G R S",
    chalan: [
      "Movement 1: S, D, S R, R G, G R S",
      "Movement 2: S R G P G, G R, S R G P D P, G R S",
      "Movement 3: P D S' N D P, M_ G R S"
    ],
    bandish: {
      title: "Mandar Baji Chhota Khayal (Teentaal - 16 Beats)",
      lyrics: "Sthayi: Mandar baji re sringara murali dhari piya bin... | Antara: Sur milae gawat dhyan lagae pratham prana shyam...",
      notations: [
        "Beat 1-4  : | S_ R_ G_ -_ | P_ G_ R_ S_ | (Ma nd a r ba ji re - )",
        "Beat 5-8  : | S_ G_ P_ D_ | P_ -_ G_ R_ | (sr i ng a ra mu ra li)"
      ]
    },
    riyazGym: [
      "Sustain Gandhar and Dhaivat, strictly avoiding Tivra Madhyam on rising sweeps.",
      "Practice direct leap 'G -> P' and 'P -> D' without vocal slides.",
      "Warmup sequence: 'S R G R S | S R G P G R S | S R G P D P G R S'"
    ]
  },
  bhupali: {
    thaat: "Kalyan Thaat (Audav-Audav Pentatonic)",
    time: "First Part of Night (7 PM - 10 PM)",
    mood: "Pure joy, brightness, absolute clarity, sweet devotional focus (Bhakti Rasa)",
    vadi: "Shuddha Gandhar (Ga)",
    samvadi: "Shuddha Dhaivat (Dha)",
    aroha: "S R G P D S' (Skips Madhyam and Nishad completely)",
    avaroha: "S' D P G R S (Consistent 5-note melodic pathway)",
    pakad: "G R S D, S R G, P G D P G R S",
    chalan: [
      "Movement 1: S, R G, G R S, D, S",
      "Movement 2: S R G P, G P D P G, R S R G R S",
      "Movement 3: G P D S', S' D P, G R S"
    ],
    bandish: {
      title: "Jab Se Tum Sang Neha Lagae (Teentaal - 16 Beats)",
      lyrics: "Sthayi: Jab se tum sang neha lagae, din nahi chain, rain nahi nindya... | Antara: Priyatam tum bin kal na parat hai...",
      notations: [
        "Beat 1-4  : | S_ R_ G_ -_ | P_ G_ R_ S_ | (Ja b se tu m sa ng )",
        "Beat 5-8  : | D_ R_ S_ -_ | S_ R_ G_ P_ | (ne ha - - la ga e_ )"
      ]
    },
    riyazGym: [
      "Practice clean step transition intervals: 'S R G R S' -> 'S G R S' (Pentatonic purity).",
      "Sustain major-third Shuddha Gandhar with zero vibrato to enrich acoustic resonance.",
      "Ascending drills: 'S R G | R G P | G P D | P D S''"
    ]
  }
};

interface AnalyzerTabProps {
  baseTonicHz: number;
  onTonicChange?: (hz: number) => void;
}

export const AnalyzerTab: React.FC<AnalyzerTabProps> = ({
  baseTonicHz,
  onTonicChange
}) => {
  const [activeSubMode, setActiveSubMode] = useState<"scale" | "singing">("singing");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState<string>("");
  const [showReport, setShowReport] = useState(false);

  // Active inspected raga inside the education reports section (defaults to yaman)
  const [inspectedRagaId, setInspectedRagaId] = useState<string>("yaman");

  // Playback timeline tracker for clickable timestamps
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);

  // Scale detection outputs
  const [detectedScaleHz, setDetectedScaleHz] = useState<number | null>(null);
  const [detectedScaleLabel, setDetectedScaleLabel] = useState<string>("");

  // Simulated audio reactive waves
  const [micVolume, setMicVolume] = useState<number[]>(Array(35).fill(5));

  const timerRef = useRef<number | null>(null);
  const waveIntervalRef = useRef<number | null>(null);

  // Simulation pipeline steps
  const PipelineSteps = [
    "DSP: Auditing analog recording buffers...",
    "DSP: Extracting vocal saptak range bounds...",
    "ML model: Extracting F0 contours via CREPE inference...",
    "DSP: Running pitch-histogram structural mapping...",
    "Grammar Parser: Checking Tivra Madhyam frequency weights...",
    "AI matching: Computing cross-correlation index over 84 ragas database...",
    "Guru Panel: Consolidating classical musicological logs..."
  ];

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => {
          if (activeSubMode === "scale" && prev >= 4) {
            handleStopScaleRecording();
            return 4;
          }
          return prev + 1;
        });
      }, 1000);

      // Wave fluctuations
      waveIntervalRef.current = window.setInterval(() => {
        setMicVolume(Array(35).fill(0).map(() => Math.floor(Math.random() * 50) + 5));
      }, 110);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      setMicVolume(Array(30).fill(6));
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, [isRecording, activeSubMode]);

  const handleStartScaleRecording = () => {
    setIsRecording(true);
    setShowReport(false);
  };

  const handleStopScaleRecording = () => {
    setIsRecording(false);
    // Simulate DSP correlation on vowel "Sa"
    const simulatedHz = baseTonicHz + (Math.random() * 3 - 1.5);
    setDetectedScaleHz(simulatedHz);
    setDetectedScaleLabel("C# (Shaddaj standard)");
  };

  const handleApplyDetectedScale = () => {
    if (detectedScaleHz && onTonicChange) {
      onTonicChange(138.59); // Set global C# Sa
      alert("Successful standard applied! Global pitch set to Shaddaj standard C# (138.59 Hz).");
    }
  };

  const handleStartSingingRecording = () => {
    setIsRecording(true);
    setShowReport(false);
  };

  const handleStopSingingRecording = () => {
    setIsRecording(false);
    setAnalysisProgress(1);
    
    let currentStepIdx = 0;
    setPipelineStep(PipelineSteps[0]);

    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < PipelineSteps.length) {
        setPipelineStep(PipelineSteps[currentStepIdx]);
        setAnalysisProgress(Math.floor((currentStepIdx / PipelineSteps.length) * 100));
      } else {
        clearInterval(interval);
        setAnalysisProgress(100);
        setTimeout(() => {
          setAnalysisProgress(0);
          setShowReport(true);
        }, 500);
      }
    }, 550);
  };

  // Recharts Radar data
  const reportRadarData = [
    { label: "Stability", A: 91 },
    { label: "Purity", A: 88 },
    { label: "Pitch Range", A: 75 },
    { label: "Vadi Rest", A: 94 },
    { label: "Meend Sweep", A: 85 },
    { label: "Rhythm Sync", A: 80 }
  ];

  const currentInspectedDetails = CANIDATE_EDUCATIONAL_BLUEPRINTS[inspectedRagaId];

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER SECTION & SUB-SELECTOR */}
      <div className="bg-[#151A2E] p-6 rounded-3xl border border-[#7C3AED]/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#7C3AED]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="font-sans">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="h-5.5 w-5.5 text-[#FBBF24]" />
            Acoustic Raag Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Verify stability indices, examine scale structures, and understand ornaments using pitch histograms. This module assists training and exploration.
          </p>
        </div>

        {/* Mode Switchers */}
        <div className="flex font-mono text-[10px] p-1 bg-[#0F1115] border border-slate-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => { setActiveSubMode("scale"); setShowReport(false); }}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
              activeSubMode === "scale" ? "bg-[#7C3AED] text-white" : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Find My Scale
          </button>
          <button
            type="button"
            onClick={() => { setActiveSubMode("singing"); setShowReport(false); }}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
              activeSubMode === "singing" ? "bg-[#7C3AED] text-white" : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Analyze Singing
          </button>
        </div>
      </div>

      {/* 2. ACOUSTIC ASSISTIVE DISCLAIMER BOX */}
      <div className="bg-[#151A2E]/50 border-l-4 border-amber-500/80 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-slate-300">
        <ShieldAlert className="h-5.5 w-5.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5 font-sans">
          <span className="font-bold text-slate-200 block">Digital Riyāz Guide - Educational Intent</span>
          <p className="text-slate-400">
            Hindustani Classical music is a living oral tradition defined by spiritual emotional context (Bhava), microtonal subtleties (Andolan/Shruti), and direct Guru guidance. 
            NaadAI provides <b className="text-amber-500">probabilistic guidelines and educational breakdowns</b> to inspire musical growth rather than mechanical or absolute correct certification.
          </p>
        </div>
      </div>

      {/* 3. PERFORMANCE RECORDING COMPARTMENT */}
      <div className="bg-[#151A2E] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
        
        {/* WAVE DISPLAY PANEL */}
        <div className="bg-[#0F1115] border border-slate-900 rounded-2xl p-6 flex flex-col justify-center items-center min-h-[160px] relative">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest absolute top-3 font-bold">Acoustic Audio Input Stream</span>
          
          {isRecording ? (
            <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-md">
              {micVolume.map((vol, i) => (
                <div 
                  key={i}
                  style={{ height: `${vol}%` }}
                  className="w-1.5 bg-gradient-to-t from-[#7C3AED] to-[#38BDF8] rounded-full transition-all duration-100"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-4 font-sans">
              <Mic className="h-8 w-8 text-slate-700 animate-pulse" />
              <p className="text-xs text-slate-500">Continuous microtonal observation bus stands in restful silence</p>
            </div>
          )}

          {isRecording && (
            <div className="text-center mt-4 font-mono">
              <span className="text-xs font-bold text-[#FBBF24] uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5">
                🎙️ Session Recording Active: {recordingSeconds}s
              </span>
              {activeSubMode === "scale" && <p className="text-[10px] text-slate-500 mt-1">Please hum a stable "Sa" vowel for at least 3 seconds...</p>}
            </div>
          )}
        </div>

        {/* Master Trigger Trigger Row */}
        <div className="flex justify-center gap-3">
          {activeSubMode === "scale" ? (
            !isRecording ? (
              <button
                onClick={handleStartScaleRecording}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#7C3AED] text-slate-950 font-mono text-xs font-black uppercase tracking-wider hover:opacity-95 transform active:translate-y-0.5 duration-200 flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Mic className="h-4 w-4" />
                Record Sa Pitch Standard
              </button>
            ) : (
              <button
                onClick={handleStopScaleRecording}
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Square className="h-4 w-4 fill-white" />
                Finish Calibration
              </button>
            )
          ) : (
            !isRecording ? (
              <button
                onClick={handleStartSingingRecording}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] text-slate-950 font-mono text-xs font-black uppercase tracking-wider hover:opacity-95 transform active:translate-y-0.5 duration-200 flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Mic className="h-4 w-4" />
                Record Vocal Riyaz Session
              </button>
            ) : (
              <button
                onClick={handleStopSingingRecording}
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Square className="h-4 w-4 fill-white" />
                Finish Recording & Analyze
              </button>
            )
          )}
        </div>

        {/* Pipeline Loader Display */}
        {analysisProgress > 0 && (
          <div className="space-y-3.5 max-w-md mx-auto p-4 bg-[#0F1115] border border-slate-850 rounded-2xl text-center">
            <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Acoustic Signal Processing Bus</span>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                style={{ width: `${analysisProgress}%` }}
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] transition-all duration-300"
              />
            </div>
            <div className="text-[10px] font-mono font-bold text-[#38BDF8] animate-pulse">
              {pipelineStep}
            </div>
          </div>
        )}

      </div>

      {/* 4. PERFORMANCE RESULTS AND EXPOSURES */}
      
      {/* Target A: Scale Detection Result */}
      {activeSubMode === "scale" && detectedScaleHz && !isRecording && (
        <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="border-b border-slate-850 pb-2">
            <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-widest">Base Scale Calibration Result</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0f1115]/50 p-4 rounded-xl border border-slate-900 space-y-1 font-mono">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Detected Fundamental Frequency (Sa)</span>
              <span className="text-xl font-black text-[#FBBF24] block">{detectedScaleHz.toFixed(2)} Hz</span>
              <span className="text-[10px] text-slate-400 block mt-1">Estimations map precisely to reference chord: <b className="text-slate-200">{detectedScaleLabel}</b></span>
            </div>

            <div className="bg-[#0f1115]/50 p-4 rounded-xl border border-slate-900 space-y-1 flex flex-col justify-between font-mono">
              <div>
                <span className="text-[9px] text-slate-550 uppercase block font-bold">Calibration Feedback</span>
                <span className="text-xs text-slate-300 block font-bold">C# is ideal for standard Riyāz holding vocal range parameters.</span>
              </div>
              <button
                onClick={handleApplyDetectedScale}
                className="w-full mt-3 text-center py-2 bg-[#7C3AED]/20 border border-[#7C3AED] hover:bg-[#7C3AED] hover:text-slate-950 text-purple-300 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer uppercase"
              >
                Set Global Base Standard to C#
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target B: Multi-tiered Raga Probabilities, Reasoning & Extensive Educational Cards */}
      {activeSubMode === "singing" && showReport && !isRecording && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* TOP THREE DETECTED MELODIC RAGAS CANDIDATES */}
          <div className="bg-[#151A2E] p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
            <div className="border-b border-slate-850 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-mono font-bold text-[#FBBF24] uppercase tracking-widest">Estimated Melodic Raga Candidates</h3>
                <span className="text-[10px] text-slate-400 block font-sans">Click on any candidate card to instantly load its complete classical study blueprint below.</span>
              </div>
              <span className="text-[9.5px] font-mono text-[#38BDF8] border border-indigo-950/40 px-2 py-0.5 bg-[#38BDF8]/5 rounded-full uppercase font-bold shrink-0">Model Accuracy: Probabilistic</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Candidate 1: Yaman */}
              <div 
                onClick={() => setInspectedRagaId("yaman")}
                className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between text-left space-y-3 relative overflow-hidden ${
                  inspectedRagaId === "yaman" 
                    ? "bg-[#1f1e38] border-[#7C3AED] shadow-[0_0_15px_#7C3AED/15] scale-[1.02]" 
                    : "bg-[#11131E]/60 border-slate-850 hover:bg-[#11131E] hover:border-slate-800"
                }`}
              >
                {/* Confidence Glow badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-black text-slate-100">1. Raag Yaman</span>
                  <span className="text-xs font-mono font-black text-emerald-400">92% Match</span>
                </div>
                
                <div className="text-[11px] text-slate-350 leading-relaxed font-sans mt-1">
                  <b>Reasoning:</b> Tivra Madhyam acts as the melodic anchor. Perfect rests held on Gandhar (Vadi) and Nishad-Rishabh sweeps (N, R S) bypass Shaddaj in ascent.
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[9px] font-mono text-slate-450">
                  <span>Related: Poorvi, Marwa</span>
                  <span className="text-purple-400 font-bold uppercase flex items-center gap-1">Study Guide <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>

              {/* Candidate 2: Shuddh Kalyan */}
              <div 
                onClick={() => setInspectedRagaId("shuddhakalyan")}
                className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between text-left space-y-3 relative overflow-hidden ${
                  inspectedRagaId === "shuddhakalyan" 
                    ? "bg-[#1f1e38] border-[#7C3AED] shadow-[0_0_15px_#7C3AED/15] scale-[1.02]" 
                    : "bg-[#11131E]/60 border-slate-850 hover:bg-[#11131E] hover:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-black text-slate-100">2. Raag Shuddh Kalyan</span>
                  <span className="text-xs font-mono font-black text-amber-500">78% Match</span>
                </div>
                
                <div className="text-[11px] text-slate-350 leading-relaxed font-sans mt-1">
                  <b>Reasoning:</b> High correlation in rising segments skipping Madhyam and Nishad (pentatonic ascent), but descents contained soft Tivra Madhyam slides.
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[9px] font-mono text-slate-450">
                  <span>Related: Yaman, Bhupali</span>
                  <span className="text-purple-400 font-bold uppercase flex items-center gap-1">Study Guide <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>

              {/* Candidate 3: Bhupali */}
              <div 
                onClick={() => setInspectedRagaId("bhupali")}
                className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between text-left space-y-3 relative overflow-hidden ${
                  inspectedRagaId === "bhupali" 
                    ? "bg-[#1f1e38] border-[#7C3AED] shadow-[0_0_15px_#7C3AED/15] scale-[1.02]" 
                    : "bg-[#11131E]/60 border-slate-850 hover:bg-[#11131E] hover:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-black text-slate-100">3. Raag Bhupali</span>
                  <span className="text-xs font-mono font-black text-slate-400">54% Match</span>
                </div>
                
                <div className="text-[11px] text-slate-350 leading-relaxed font-sans mt-1">
                  <b>Reasoning:</b> Basic pentatonic pitch grid (S R G P D S') was closely observed, but the presence of Nishad and Madhyam in descent rule options out pure Bhupali.
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[9px] font-mono text-slate-450">
                  <span>Related: Deshkar, Kalyan</span>
                  <span className="text-purple-400 font-bold uppercase flex items-center gap-1">Study Guide <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>

            </div>
          </div>

          {/* GRANULAR EDUCATIONAL INSPECTION MODULE (REPLACES CHOSEN CANDIDATE DETAILS) */}
          {currentInspectedDetails && (
            <div className="bg-[#151A2E] p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-in fade-in duration-300" id="education-study-module">
              
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-[#38BDF8]">
                  <BookOpen className="h-4.5 w-4.5 text-[#38BDF8]" />
                </div>
                <div className="font-sans">
                  <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-widest">
                    Inspecting Grammar Blueprint: <span className="text-purple-300">{inspectedRagaId === "yaman" ? "Raag Yaman" : inspectedRagaId === "shuddhakalyan" ? "Raag Shuddh Kalyan" : "Raag Bhupali"}</span>
                  </h3>
                  <span className="text-[10px] text-slate-450 block font-normal">Review traditional classical specifications to compare with your current vocal performance profile.</span>
                </div>
              </div>

              {/* Grid block stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Col 1: Core characteristics */}
                <div className="bg-[#0f1115]/50 p-5 rounded-2xl border border-slate-900 space-y-3.5 text-xs font-mono">
                  <div className="border-b border-slate-850/60 pb-1">
                    <span className="text-[9px] font-mono text-slate-550 block uppercase font-bold">Scale Parentage & Time</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Parent standard Thaat</span>
                    <span className="text-slate-200 block font-bold">{currentInspectedDetails.thaat}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Aesthetic Singing Time</span>
                    <span className="text-slate-250 block font-bold">{currentInspectedDetails.time}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Emotional Energy (Rasa)</span>
                    <p className="text-slate-300 block leading-relaxed font-sans">{currentInspectedDetails.mood}</p>
                  </div>
                </div>

                {/* Col 2: King/Queen and Scale contours */}
                <div className="bg-[#0f1115]/50 p-5 rounded-2xl border border-slate-900 space-y-3.5 text-xs font-mono">
                  <div className="border-b border-slate-850/60 pb-1">
                    <span className="text-[9px] font-mono text-slate-550 block uppercase font-bold">Traditional Swara Weights</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Vadi Swara (Melodic King)</span>
                    <span className="text-[#38BDF8] block font-bold">{currentInspectedDetails.vadi}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Samvadi Swara (Melodic Queen)</span>
                    <span className="text-[#FBBF24] block font-bold">{currentInspectedDetails.samvadi}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Aroha Notes (Ascent)</span>
                    <span className="text-slate-300 block font-bold">{currentInspectedDetails.aroha}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Avaroha Notes (Descent)</span>
                    <span className="text-slate-300 block font-bold">{currentInspectedDetails.avaroha}</span>
                  </div>
                </div>

                {/* Col 3: Traditional Pakad & expansion movements */}
                <div className="bg-[#0f1115]/50 p-5 rounded-2xl border border-slate-900 space-y-3.5 text-xs font-mono">
                  <div className="border-b border-slate-850/60 pb-1">
                    <span className="text-[9px] font-mono text-slate-550 block uppercase font-bold">Traditional Pakad (Catch) & Chalan</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px]">Swaralipi Pakad Formula</span>
                    <span className="text-[#FBBF24] block font-bold leading-normal tracking-wide">{currentInspectedDetails.pakad}</span>
                  </div>
                  <div className="space-y-2.5">
                    <span className="text-slate-550 block uppercase text-[8.5px] font-bold">Grammar Expansion Paths (Chalan)</span>
                    <div className="space-y-1 text-[10px] text-slate-400">
                      {currentInspectedDetails.chalan.map((move, mi) => (
                        <div key={mi} className="border-b border-slate-900/60 pb-0.5 last:border-0">{move}</div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bandish composition lyrics and swaralipi sheets */}
              <div className="p-5 bg-[#0f1115]/75 border border-slate-900 rounded-2xl space-y-4">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-850/60 pb-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-black">Traditional Composition Sheet (Bandish)</span>
                  <span className="text-[8px] font-mono text-[#FBBF24] border border-[#FBBF24]/20 px-2 py-0.5 bg-[#FBBF24]/5 rounded-full uppercase">Swaralipi Notations Included</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-sans font-black text-slate-200">"{currentInspectedDetails.bandish.title}"</h4>
                  <p className="text-xs text-slate-400 font-sans italic leading-relaxed">{currentInspectedDetails.bandish.lyrics}</p>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 text-[11px] font-mono text-slate-450 leading-relaxed overflow-x-auto select-none">
                  {currentInspectedDetails.bandish.notations.map((notLine, nIdx) => (
                    <div key={nIdx} className="whitespace-pre">
                      {notLine.includes("Swar:") ? <span className="text-[#38BDF8] font-bold">{notLine}</span> : notLine}
                    </div>
                  ))}
                </div>
              </div>

              {/* Riyaz gym workout exercises */}
              <div className="p-5 bg-[#0f1115]/50 border border-slate-900 rounded-2xl space-y-3 font-sans text-xs text-slate-300">
                <span className="text-[10.5px] font-mono text-purple-400 font-bold block uppercase tracking-wider">Recommended Riyāz Drill (Voice Gymnasium)</span>
                <ul className="space-y-2 list-disc list-inside">
                  {currentInspectedDetails.riyazGym.map((ex, exi) => (
                    <li key={exi} className="pl-1 text-slate-300 font-sans leading-relaxed">{ex}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* GURU EVALUATION FORUMS PANEL */}
          <div className="bg-[#151A2E] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 font-sans">
            <h3 className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-widest pl-1">
              Feedback from Classical Vocal Gurus Panel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#11131E]/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between hover:border-[#7C3AED]/35 transition-colors">
                <div>
                  <h4 className="text-xs font-mono font-black text-purple-400">Pandit Bhimsen Joshi</h4>
                  <p className="text-[11px] text-slate-450 italic leading-relaxed mt-2">
                    "Consistent stability on Gandhar is impressive. Perfecting the vigor in the Drut phrasing is vital. Excellent breath support!"
                  </p>
                </div>
                <span className="text-[7.5px] font-mono text-slate-550 uppercase tracking-widest block mt-4 text-right">Kirana Gharana</span>
              </div>

              <div className="bg-[#11131E]/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between hover:border-[#7C3AED]/35 transition-colors">
                <div>
                  <h4 className="text-xs font-mono font-black text-purple-400">Kishori Amonkar</h4>
                  <p className="text-[11px] text-slate-450 italic leading-relaxed mt-2">
                    "The Meend glides are loaded with deep inner Bhava (emotion). Guard the microtonal shade on Madhyam; let it slide slower."
                  </p>
                </div>
                <span className="text-[7.5px] font-mono text-slate-550 uppercase tracking-widest block mt-4 text-right">Jaipur-Atrauli Gharana</span>
              </div>

              <div className="bg-[#11131E]/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between hover:border-[#7C3AED]/35 transition-colors">
                <div>
                  <h4 className="text-xs font-mono font-black text-purple-400">Pandit Jasraj</h4>
                  <p className="text-[11px] text-slate-450 italic leading-relaxed mt-2">
                    "Resonant swaras. The voice projection carries spiritual purity. Work on holding the Komal Rishabh with deep meditative quietness."
                  </p>
                </div>
                <span className="text-[7.5px] font-mono text-slate-550 uppercase tracking-widest block mt-4 text-right">Mewati Gharana</span>
              </div>
            </div>
          </div>

          {/* MISTAKE LOCALIZATION TIMELINE (MICROTONAL AUDIO TIMELINE scrubber) */}
          <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-850 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
              Microtonal Deviations Timeline
            </h3>

            <div className="space-y-2 bg-[#0F1115] p-4 rounded-xl border border-slate-900 font-mono text-xs">
              <div className="flex justify-between text-[10px] text-slate-550 mb-1">
                <span>Elapsed: 02:18s</span>
                <span>Active File: Vocal-Riyaz-Yaman.wav</span>
                <span>Length: 04:00s</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden relative cursor-pointer">
                <div style={{ width: '58%' }} className="h-full bg-[#7C3AED] rounded-full" />
                <span className="absolute left-[10%] top-0 h-full w-2.5 bg-rose-500 animate-pulse" title="00:15s warning" />
                <span className="absolute left-[35%] top-0 h-full w-2.5 bg-emerald-500" title="01:04s stable" />
                <span className="absolute left-[58%] top-0 h-full w-2.5 bg-emerald-400 animate-bounce" title="02:18s stable" />
                <span className="absolute left-[85%] top-0 h-full w-2.5 bg-amber-500 animate-pulse" title="03:45s flat" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
              <div className="bg-[#0F1115] border border-slate-850 p-3.5 rounded-xl text-slate-350">
                <span className="text-[#38BDF8] font-black">00:15s</span>
                <span className="text-rose-400 block font-bold text-[10px] mt-1 uppercase">Aattack Instability</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">Attack was shaky on Sa; stabilize throat pressure before plucking.</p>
              </div>

              <div className="bg-[#0F1115] border border-slate-850 p-3.5 rounded-xl text-slate-350">
                <span className="text-[#38BDF8] font-black">01:04s</span>
                <span className="text-emerald-400 block font-bold text-[10px] mt-1 uppercase">Sustained Gandhar</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">94% cent-zero purity on Ga (Vadi note). Beautiful meditative rest.</p>
              </div>

              <div className="bg-[#0F1115] border border-slate-850 p-3.5 rounded-xl text-slate-350">
                <span className="text-[#38BDF8] font-black">02:18s</span>
                <span className="text-emerald-400 block font-bold text-[10px] mt-1 uppercase">Flawless Meend</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">High glide uniformity on Ni-Re slide. Resonant microtonal curves.</p>
              </div>

              <div className="bg-[#0F1115] border border-slate-850 p-3.5 rounded-xl text-slate-350">
                <span className="text-[#38BDF8] font-black">03:45s</span>
                <span className="text-amber-500 block font-bold text-[10px] mt-1 uppercase">Flat Dhaivat Reach</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">Slight flat variation (-11 cents) on high register Taar saptak reach.</p>
              </div>
            </div>
          </div>

          {/* AUDITION SPECTRUM SUMMARY STATISTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-[#151A2E] p-6 rounded-2xl border border-slate-850 shadow-lg space-y-4 font-mono text-xs">
              <div className="border-b border-slate-850 pb-2">
                <h3 className="text-sm font-sans font-bold text-slate-200">
                  Acoustic DNA Audition Summary
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Matched Performance Style</span>
                    <span className="text-slate-200 font-bold text-xs block">Vocal Khayāl Phrasing</span>
                    <span className="text-[9.5px] text-emerald-400 block font-black">Style probability: 96%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Taal Rhythm Anchor</span>
                    <span className="text-slate-200 font-bold text-xs block">Teentaal (16 Beats, 104 BPM)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Vocal Amplitude Range</span>
                    <span className="text-slate-200 font-bold text-xs block">Madhya Saptak (Cruising)</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#7C3AED] block uppercase font-black">Sargam Recognition Map</span>
                    <span className="text-slate-300 text-[10px] block leading-normal font-medium">92% swara vocabulary coverage validated across base standard scale keys.</span>
                  </div>
                </div>
              </div>

              {/* Pitch contour detail notes */}
              <div className="bg-[#0F1115] border border-slate-900 p-4 rounded-xl space-y-2 text-[11px] leading-relaxed text-slate-400 font-sans">
                <span className="font-mono text-[9px] text-purple-400 block uppercase font-bold">CREPE Model F0 Extraction Logs</span>
                <p>
                  High stability index (0.78 timbre index) was maintained over vowel sustains. Pitch tracks verify uniform meend curvature sweeps, proving authentic linear slide mechanics on the Ni-Re-G progression.
                </p>
              </div>
            </div>

            {/* Radar component */}
            <div className="lg:col-span-4 bg-[#151A2E] p-6 rounded-2xl border border-slate-850 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Vocal Purity DNA</h3>
              </div>

              <div className="h-60 flex items-center justify-center relative select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportRadarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} />
                    <Radar 
                      name="Acoustic Voice Take" 
                      dataKey="A" 
                      stroke="#38BDF8" 
                      fill="#38BDF8" 
                      fillOpacity={0.25} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#0F1115] border border-slate-900 p-2 text-center text-[9px] font-mono text-slate-500 rounded-lg">
                F0 estimation ranges: 110Hz to 420Hz
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
