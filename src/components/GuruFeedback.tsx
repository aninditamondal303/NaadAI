/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Send, Sparkles, RefreshCw, AlertCircle, Bookmark, Compass, 
  Award, Music, Check, Upload, Play, Volume2, Clock, Calendar, 
  BarChart2, ShieldCheck, ChevronRight, PlayCircle
} from 'lucide-react';
import { DigitalTwinState } from '../types';

interface SwaraPurity {
  swara: string;
  symbol: string;
  avgDeviationCents: number;
  stabilityIndex: number;
  occurrenceCount: number;
  nyasDurationSeconds: number;
}

interface ScaleMetrics {
  detectedTonic: string;
  octaveRange: string;
  minFreqHz: number;
  maxFreqHz: number;
  confidence: number;
}

interface ShrutiMetrics {
  microtonalAndolanHz: number;
  andolanSwaras: string[];
  kanSwarPresence: string[];
}

interface RaagAlignment {
  detectedRaag: string;
  arohaMatchPercent: number;
  avarohaMatchPercent: number;
  characteristicPhrasesIdentified: string[];
  vadiSamvadiDominance: string;
  confidence: number;
}

interface TaalAlignment {
  percussionDetected: boolean;
  detectedTaal: string;
  tempoBpm: number;
  confidence: number;
  samArrivalAccuracy: number;
  rhythmicDriftMs: number;
  layaCategory: string;
}

interface MusicalDiagnostics {
  scale: ScaleMetrics;
  swaras: SwaraPurity[];
  shruti: ShrutiMetrics;
  raag: RaagAlignment;
  taal: TaalAlignment;
  voiceStabilityScore: number;
  meendQualityScore: number;
  gamakQualityScore: number;
}

interface AudioTake {
  id: string;
  name: string;
  timestamp: string;
  raagName: string;
  durationSeconds: number;
  audioBase64: string; 
}

interface GuruFeedbackProps {
  currentMetrics: {
    overallSurAccuracy: number;
    averageDeviationCents: number;
    meendCount: number;
    gamakCount: number;
    noteCoverage: Record<number, { count: number; stableCount: number; avgDeviation: number }>;
  } | null;
  profileState: DigitalTwinState;
  onProfileUpdated: (newProfile: DigitalTwinState) => void;
  activeRaagId: string;
  currentTheme?: "saffron" | "midnight" | "ivory";
}

export const GuruFeedback: React.FC<GuruFeedbackProps> = ({
  currentMetrics,
  profileState,
  onProfileUpdated,
  activeRaagId,
  currentTheme = "saffron"
}) => {
  // Navigation tabs of the intelligence hub
  const [activeTab, setActiveTab] = useState<"gurus" | "dsp" | "takes">("gurus");

  const [criticReport, setCriticReport] = useState<string>("");
  const [milStats, setMilStats] = useState<MusicalDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Audio takes list imported from Local Storage
  const [localTakes, setLocalTakes] = useState<AudioTake[]>([]);
  const [selectedTakeId, setSelectedTakeId] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");

  useEffect(() => {
    loadLocalTakesList();
  }, []);

  // Poll LocalStorage periodically to capture newly saved recordings
  const loadLocalTakesList = () => {
    try {
      const stored = localStorage.getItem("naadai_vocal_takes");
      if (stored) {
        const parsed: AudioTake[] = JSON.parse(stored);
        setLocalTakes(parsed);
        if (parsed.length > 0 && !selectedTakeId) {
          setSelectedTakeId(parsed[0].id);
        }
      } else {
        setLocalTakes([]);
      }
    } catch (e) {
      console.warn("Failed loading takes inside feedback panel:", e);
    }
  };

  /**
   * Simple, robust native Markdown parser that transforms the Gurus' response text
   * into highly stylized and readable panels, drawing roundtable quotes as distinctive boxes.
   */
  const renderCustomMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    let insideQuoteBlock = false;
    let quoteLines: string[] = [];
    const elements: React.JSX.Element[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Detect Blockquotes for individual Gurus
      if (trimmed.startsWith('>') || (insideQuoteBlock && trimmed.length > 0 && !trimmed.startsWith('###') && !trimmed.startsWith('*'))) {
        insideQuoteBlock = true;
        quoteLines.push(trimmed.replace(/^>/, '').trim());
        return;
      } else if (insideQuoteBlock) {
        // Close blockquote and render
        const quoteContent = quoteLines.join(' ');
        elements.push(
          <div key={`quote-${idx}`} className={`pl-4 py-2 my-2 border-l-2 bg-slate-900/40 rounded-r-lg italic font-serif text-[12px] leading-relaxed ${
            currentTheme === "ivory"
              ? "border-amber-700/60 text-amber-950/90"
              : "border-purple-500/60 text-slate-200"
          }`}>
            {parseInLineBold(quoteContent)}
          </div>
        );
        insideQuoteBlock = false;
        quoteLines = [];
      }

      if (trimmed.startsWith('###')) {
        const title = trimmed.replace('###', '').trim();
        let iconClass = "bg-purple-900/30 text-purple-400 border border-purple-800/40";
        let cardBg = "bg-slate-900/20 border border-slate-900/40 mt-5 p-3 rounded-xl";
        
        if (title.includes("Darshan")) {
          iconClass = "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40";
        } else if (title.includes("Sur") || title.includes("Roundtable") || title.includes("Sabha")) {
          iconClass = "bg-purple-950/40 text-purple-300 border border-purple-800/40";
        } else if (title.includes("Prescribed") || title.includes("Alankars") || title.includes("Riyaz")) {
          iconClass = "bg-amber-950/40 text-amber-400 border border-amber-800/40";
        }

        elements.push(
          <div key={`header-${idx}`} className={cardBg}>
            <h4 className="text-[13px] font-bold flex items-center gap-2.5 font-sans tracking-wide text-slate-100 uppercase">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${iconClass}`}>
                ✦
              </span>
              {title}
            </h4>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemText = trimmed.substring(1).trim();
        elements.push(
          <li key={`list-${idx}`} className="text-[12px] text-slate-350 font-mono list-none flex items-start gap-2.5 py-1 leading-relaxed pl-1.5">
            <span className="text-purple-400 shrink-0 select-none">✦</span>
            <span>{parseInLineBold(itemText)}</span>
          </li>
        );
        return;
      }

      if (trimmed === "" || trimmed === "---") {
        if (trimmed === "---") {
          elements.push(<hr key={`hr-${idx}`} className="border-slate-900/60 my-4" />);
        } else {
          elements.push(<div key={`space-${idx}`} className="h-2" />);
        }
        return;
      }

      // Standard paragraphs
      elements.push(
        <p key={`para-${idx}`} className="text-[12.5px] text-slate-300 leading-relaxed py-1 font-sans">
          {parseInLineBold(trimmed)}
        </p>
      );
    });

    // Cleanup lingering quotes
    if (insideQuoteBlock && quoteLines.length > 0) {
      elements.push(
        <div key="last-quote" className={`pl-4 py-2 my-2 border-l-2 bg-slate-900/40 rounded-r-lg italic font-serif text-[12px] leading-relaxed ${
          currentTheme === "ivory"
            ? "border-amber-700/60 text-amber-950/90"
            : "border-purple-500/60 text-slate-200"
        }`}>
          {parseInLineBold(quoteLines.join(' '))}
        </div>
      );
    }

    return elements;
  };

  /**
   * Utility method replacing **bold** tags inside markdown strings with styled labels.
   */
  const parseInLineBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-purple-400 font-bold">{part}</strong>;
      }
      return part;
    });
  };

  /**
   * Calls `/api/analyze` to evaluate current live tuner diagnostics
   */
  const handleDiagnosticCompile = async () => {
    setIsLoading(true);
    setErrorText(null);

    const payloadMetrics = {
      overallSurAccuracy: currentMetrics ? currentMetrics.overallSurAccuracy : 0,
      averageDeviationCents: currentMetrics ? currentMetrics.averageDeviationCents : 0,
      meendCount: currentMetrics ? currentMetrics.meendCount : 0,
      gamakCount: currentMetrics ? currentMetrics.gamakCount : 0,
      noteCoverage: currentMetrics ? currentMetrics.noteCoverage : {},
      testedRaag: activeRaagId.toUpperCase(),
      durationSeconds: 45
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionMetrics: payloadMetrics,
          feedbackHistory: chatHistory
        })
      });

      const data = await response.json();
      
      if (data.error && !data.critic) {
        setErrorText(data.error);
        setIsOfflineMode(false);
      } else {
        setCriticReport(data.critic);
        if (data.musicIntelligence) {
          setMilStats(data.musicIntelligence);
        }
        setIsOfflineMode(!!data.isFallback);
        setChatHistory(prev => [...prev, { role: "model", text: data.critic }]);

        if (data.updatedProfile) {
          onProfileUpdated(data.updatedProfile);
        }
        
        // Auto jump to guru critique screen
        setActiveTab("gurus");
      }
    } catch (err: any) {
      console.error("Guru session diagnostics error:", err);
      setErrorText("Communication mismatch. Check your network or server logs.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Evaluates selected taken recording using the new `/api/analyze-audio` endpoint
   */
  const handleAnalyzeSelectedTake = async () => {
    const activeTake = localTakes.find(t => t.id === selectedTakeId);
    if (!activeTake) {
      setErrorText("Please record or select an audio take before initiating intelligence analysis.");
      return;
    }

    setIsLoading(true);
    setErrorText(null);
    setUploadStatus("Extracting microtonal speech envelopes...");

    try {
      setUploadStatus("Piping telemetry through Music Intelligence Layer (MIL)...");
      const response = await fetch("/api/analyze-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: activeTake.audioBase64,
          testedRaag: activeTake.raagName || activeRaagId,
          feedbackHistory: chatHistory
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setErrorText(data.error);
      } else {
        setUploadStatus("Analysis successfully compiled. Loading results.");
        setCriticReport(data.critic);
        if (data.musicIntelligence) {
          setMilStats(data.musicIntelligence);
        }
        setIsOfflineMode(!!data.isFallback);
        setChatHistory(prev => [...prev, { role: "model", text: data.critic }]);
        
        if (data.updatedProfile) {
          onProfileUpdated(data.updatedProfile);
        }

        // Redirect to see the roundtable
        setActiveTab("gurus");
      }
    } catch (e) {
      console.error("Failed executing take analysis:", e);
      setErrorText("Telemetry failure during take analysis processing on server.");
    } finally {
      setIsLoading(false);
      setUploadStatus("");
    }
  };

  /**
   * Action executing immediate dialogue query input submissions
   */
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isLoading) return;

    const userMessageText = queryInput.trim();
    setQueryInput("");
    setErrorText(null);

    setChatHistory(prev => [...prev, { role: "user", text: userMessageText }]);
    setIsLoading(true);

    const historicalData = [...chatHistory, { role: "user", text: userMessageText }];

    const payloadMetrics = {
      overallSurAccuracy: currentMetrics ? currentMetrics.overallSurAccuracy : profileState.runningScores.cumulativeSurAccuracy,
      averageDeviationCents: currentMetrics ? currentMetrics.averageDeviationCents : 15,
      meendCount: currentMetrics ? currentMetrics.meendCount : 0,
      gamakCount: currentMetrics ? currentMetrics.gamakCount : 0,
      noteCoverage: currentMetrics ? currentMetrics.noteCoverage : {},
      testedRaag: activeRaagId.toUpperCase(),
      isCustomQuery: true,
      customQueryText: userMessageText
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionMetrics: payloadMetrics,
          feedbackHistory: historicalData
        })
      });

      const data = await response.json();
      
      if (data.error && !data.critic) {
        setErrorText(data.error);
        setIsOfflineMode(false);
      } else {
        setCriticReport(data.critic);
        setIsOfflineMode(!!data.isFallback);
        setChatHistory(prev => [...prev, { role: "model", text: data.critic }]);

        if (data.updatedProfile) {
          onProfileUpdated(data.updatedProfile);
        }
      }
    } catch (err) {
      console.error("Dialogue response error:", err);
      setErrorText("Dialogue stream disrupted. Let us try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles manual file uploads (WAV, MP3, WebM)
   */
  const handleUploadedFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 15 * 1024 * 1024) {
      setErrorText("Size Overflow: Vocal audio submission must be smaller than 15MB to prevent memory bottlenecks.");
      return;
    }

    setUploadStatus(`Loading audio file: ${file.name}...`);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result as string;
      const timestamp = new Date().toLocaleString();
      const fakeId = "upl_" + Date.now();
      
      const newTakeObj: AudioTake = {
        id: fakeId,
        name: `Upload: ${file.name.slice(0, 18)}${file.name.length > 18 ? '...' : ''}`,
        raagName: activeRaagId,
        durationSeconds: 15, // Approximate estimation
        timestamp,
        audioBase64: base64Content
      };

      // Store in takes array
      const stored = localStorage.getItem("naadai_vocal_takes");
      let currentArray: AudioTake[] = [];
      if (stored) {
        currentArray = JSON.parse(stored);
      }
      const updatedArray = [newTakeObj, ...currentArray].slice(0, 4); // Limit to last 4
      localStorage.setItem("naadai_vocal_takes", JSON.stringify(updatedArray));
      
      // Select the newly loaded upload item
      setLocalTakes(updatedArray);
      setSelectedTakeId(fakeId);
      setUploadStatus("Successfully imported and bound to MIL console channels!");
      setTimeout(() => setUploadStatus(""), 2500);
    };

    reader.onerror = () => {
      setErrorText("Failed to read the file. Please try another audio tract.");
      setUploadStatus("");
    };

    reader.readAsDataURL(file);
  };

  // Determine active visual styling presets based on currentTheme
  const cardBgStyle = currentTheme === "ivory"
    ? "bg-white border-amber-200/65 shadow-md flex-grow"
    : currentTheme === "midnight"
    ? "bg-[#09061c]/95 border-indigo-950/80 shadow-indigo-950/10 flex-grow"
    : "bg-slate-950 border-slate-900/80 flex-grow";

  const dividerStyle = currentTheme === "ivory" ? "border-amber-100/50" : "border-slate-900/60";

  return (
    <div id="guru-feedback-card" className={`w-full p-4 rounded-2xl border flex flex-col justify-between max-h-[640px] overflow-hidden ${cardBgStyle}`}>
      
      {/* 1. Header with Title and Custom Tabs Navigation */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              currentTheme === "ivory" ? "bg-amber-100 text-amber-900" : "bg-purple-900/40 text-purple-400 animate-pulse"
            }`}>
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className={`text-base font-bold font-sans tracking-wide ${
                currentTheme === "ivory" ? "text-amber-950" : "text-slate-100"
              }`}>Classical Intelligence Hub</h3>
              <p className="text-[10px] text-slate-500 font-mono">MIL Engine Version 1.0b (Active)</p>
            </div>
          </div>

          <div className="flex space-x-1 p-1 bg-slate-900/50 border border-slate-800/40 rounded-xl grow sm:grow-0 w-full sm:w-auto">
            {[
              { id: "gurus", label: "Gurus Sabha" },
              { id: "dsp", label: "DSP Telemetry" },
              { id: "takes", label: "Take Analyzer" }
            ].map((tab) => {
              const isTabActive = activeTab === tab.id;
              let btnStyle = isTabActive
                ? "bg-purple-600 border border-purple-500 text-white font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border-transparent";
              if (currentTheme === "ivory" && isTabActive) {
                btnStyle = "bg-amber-100 border border-amber-300 text-amber-900 font-bold";
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === "takes") loadLocalTakesList(); // refresh list
                  }}
                  className={`text-[10.5px] font-sans font-medium px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer grow text-center ${btnStyle}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Unified Content Body Wrapper */}
      <div className="flex-grow overflow-y-auto max-h-[360px] pr-1.5 scrollbar-thin scrollbar-thumb-slate-800/85">

        {/* ======================================= */}
        {/* TAB 1: GURU ROUNDTABLE CRITIQUE         */}
        {/* ======================================= */}
        {activeTab === "gurus" && (
          <div className="space-y-3">
            
            {/* Context Summary Ribbon */}
            <div className={`p-2.5 rounded-xl border grid grid-cols-2 lg:grid-cols-4 gap-4 text-center ${
              currentTheme === "ivory" ? "bg-amber-50/40 border-amber-100" : "bg-slate-900/30 border-slate-900/50"
            }`}>
              <div>
                <span className="text-[9px] text-slate-500 font-mono block">SUR STABILITY</span>
                <span className={`text-[15px] font-bold font-mono ${
                  currentMetrics 
                    ? (currentMetrics.overallSurAccuracy > 80 ? 'text-emerald-400' : 'text-purple-400') 
                    : (milStats ? 'text-purple-400' : 'text-slate-600')
                }`}>
                  {currentMetrics 
                    ? `${currentMetrics.overallSurAccuracy}%` 
                    : (milStats ? `${milStats.raag.confidence}%` : "— NO DATA —")}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono block">AVG DEVIATION</span>
                <span className="text-[15px] font-bold font-mono text-slate-200">
                  {currentMetrics 
                    ? `${currentMetrics.averageDeviationCents}c` 
                    : (milStats ? `${milStats.swaras[0]?.avgDeviationCents || 0}c` : "—")}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono block">MEEND GLIDES</span>
                <span className="text-[15px] font-bold font-mono text-purple-400">
                  {currentMetrics ? currentMetrics.meendCount : (milStats ? (milStats.meendQualityScore > 0 ? "Detected" : "0") : "0")}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono block">GAMAK OSCILLATIONS</span>
                <span className="text-[15px] font-bold font-mono text-purple-400">
                  {currentMetrics ? currentMetrics.gamakCount : (milStats ? (milStats.gamakQualityScore > 0 ? "Detected" : "0") : "0")}
                </span>
              </div>
            </div>

            {/* Critique Display Panel */}
            <div className={`p-3 rounded-xl border bg-slate-950/40 relative min-h-[140px] ${
              currentTheme === "ivory" ? "border-amber-150" : "border-slate-900/50"
            }`}>
              {criticReport ? (
                <div id="guru-critic-text-panel" className="space-y-3 font-serif">
                  {renderCustomMarkdown(criticReport)}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Compass className="h-9 w-9 text-slate-700 stroke-[1.2] mb-1.5" />
                  <p className="text-xs font-semibold text-slate-400">Awaiting Classical Synthesis</p>
                  <p className="text-[10px] text-slate-600 max-w-[320px] mx-auto leading-relaxed">
                    Begin vocal sādhanā on the live tuner or compile analytical metrics from a recorded take to trigger the Legendary roundtable debate.
                  </p>
                  {currentMetrics && (
                    <button
                      onClick={handleDiagnosticCompile}
                      className={`mt-3 text-[10px] font-mono px-4 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        currentTheme === "ivory"
                          ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                          : "bg-purple-900/20 text-purple-300 hover:bg-purple-900/40 border-purple-800"
                      }`}
                    >
                      COMPILE LIVE METRICS NOW
                    </button>
                  )}
                </div>
              )}

              {/* Status and Loading HUD Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-center items-center gap-2.5">
                  <RefreshCw className="h-7 h-7 text-purple-400 animate-spin" />
                  <div className="text-center font-sans">
                    <p className="text-xs font-semibold text-slate-300">Summoning Legendary Guru Council...</p>
                    <p className="text-[9px] text-slate-500 font-mono italic mt-1 max-w-[240px]">
                      "अनेक गंधर्व मिलित्वा संवादं कुर्वन्ति..."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: Modular DSP Analytics (MIL)       */}
        {/* ======================================= */}
        {activeTab === "dsp" && (
          <div className="space-y-3.5">
            {!milStats ? (
              <div className="py-14 text-center text-slate-500 border border-slate-900/50 bg-slate-950/30 rounded-xl space-y-2">
                <BarChart2 className="h-8 w-8 text-slate-700 mx-auto stroke-[1.5]" />
                <h4 className="text-xs font-semibold text-slate-400">No DSP Logs Accumulated</h4>
                <p className="text-[10px] text-slate-600 max-w-[260px] mx-auto leading-normal font-sans">
                  The Music Intelligence Layer (MIL) must extract frequency profiles from performance samples before graphing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                
                {/* 1. Scale & Tonic Detection Panel */}
                <div className="p-3 rounded-xl border border-slate-900 bg-[#061217]/50 space-y-2 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-teal-400">✦ Scale Detection</span>
                    <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-900">
                      Confidence: {milStats.scale.confidence}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block">DETECTED STANDARD TONIC</span>
                      <span className="text-slate-205 font-bold">{milStats.scale.detectedTonic}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">EXTRACTED RANGE</span>
                      <span className="text-slate-205 font-mono">{milStats.scale.octaveRange}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Detailed Swara Analysis Panel */}
                <div className="p-3 rounded-xl border border-slate-900 bg-slate-950/60 space-y-3 font-sans">
                  <div className="flex justify-between items-center border-b border-indigo-950/30 pb-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-purple-400">✦ Swara Analysis</span>
                    <span className="text-[8px] font-mono text-slate-500">Purity indices and microtonal deviation averages</span>
                  </div>
                  
                  {/* Swaras List with Microtonal deviation bar */}
                  <div className="space-y-2.5">
                    {milStats.swaras.map((sw) => {
                      // Normalize deviation between -50c and +50c for visualization
                      const normalizedDev = Math.max(-50, Math.min(50, sw.avgDeviationCents));
                      const percentLeft = 50 + (normalizedDev); // 0% to 100% position
                      
                      const isStable = sw.stabilityIndex > 0.75;
                      const devColor = Math.abs(sw.avgDeviationCents) < 8 
                        ? "bg-emerald-400 shadow-emerald-950" 
                        : (sw.avgDeviationCents > 0 ? "bg-amber-400" : "bg-sky-400");

                      return (
                        <div key={sw.swara} className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-serif font-extrabold w-4 text-center text-purple-305">{sw.symbol}</span>
                              <span className="text-slate-300 font-medium font-sans">{sw.swara}</span>
                            </div>
                            <div className="text-[9.5px] font-mono flex items-center gap-3">
                              <span className="text-slate-500">{sw.occurrenceCount} occurrences</span>
                              <span className={`font-bold ${Math.abs(sw.avgDeviationCents) < 8 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {sw.avgDeviationCents > 0 ? `+${sw.avgDeviationCents}` : sw.avgDeviationCents} cents
                              </span>
                            </div>
                          </div>
                          
                          {/* visual slide indicator */}
                          <div className="relative h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-700/60 z-10" /> {/* Center line */}
                            <div 
                              className={`absolute h-1.5 top-0.5 rounded-full w-1.5 -ml-0.75 transition-all duration-300 ${devColor}`}
                              style={{ left: `${percentLeft}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Shruti & Ornamentation Panel */}
                <div className="p-3 rounded-xl border border-slate-900 bg-slate-950/60 space-y-2 font-sans">
                  <div className="flex justify-between items-center border-b border-indigo-950/30 pb-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-400">✦ Shruti & Ornamentations</span>
                    <span className="text-[8px] font-mono text-slate-500">Andolan and pitch slur captures</span>
                  </div>
                  <div className="space-y-2 text-xs leading-normal">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Microtonal Andolan oscillation speed:</span>
                      <span className="text-amber-400 font-mono font-bold">
                        {milStats.shruti.microtonalAndolanHz > 0 ? `${milStats.shruti.microtonalAndolanHz} Hz` : "None Detected"}
                      </span>
                    </div>
                    {milStats.shruti.andolanSwaras.length > 0 && (
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-slate-500">Andolana Swaras target:</span>
                        <span className="text-slate-300 font-mono text-right">{milStats.shruti.andolanSwaras.join(", ")}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-slate-500">Grace pitch (Kan-swar) markings:</span>
                      <span className="text-slate-450 font-mono text-right font-medium">
                        {milStats.shruti.kanSwarPresence.join(" • ") || "None registered"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Taal & Laya Rhythmic Sync Panel */}
                <div className="p-3 rounded-xl border border-slate-900 bg-[#120717]/40 space-y-2 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-purple-400">✦ Taal & Laya Analysis</span>
                    <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-305 border border-purple-900">
                      Sync Class: {milStats.taal.layaCategory}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block">DETECTED CYCLE (TAAL)</span>
                      <span className="text-slate-300 font-mono font-bold">{milStats.taal.detectedTaal}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">TEMPO BPM</span>
                      <span className="text-slate-300 font-mono font-bold">{milStats.taal.tempoBpm} BPM</span>
                    </div>
                    {milStats.taal.percussionDetected && (
                      <>
                        <div>
                          <span className="text-[9px] text-slate-500 block">SAM ACCURACY</span>
                          <span className="text-emerald-400 font-mono font-bold">
                            {milStats.taal.samArrivalAccuracy}% Arrival
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">RHYTHMIC DRIFT</span>
                          <span className="text-slate-305 font-mono font-medium">
                            {milStats.taal.rhythmicDriftMs > 0 ? `+${milStats.taal.rhythmicDriftMs} ms (Late)` : `${milStats.taal.rhythmicDriftMs} ms (Early)`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 5. Raag Rule Validation Panel */}
                <div className="p-3 rounded-xl border border-slate-900 bg-[#09140d]/40 space-y-2 font-sans">
                  <div className="flex justify-between items-center border-b border-emerald-950/30 pb-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">✦ Raag Rule Check</span>
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">
                      Raga ID: {activeRaagId.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Aroha Path accuracy:</span>
                      <span className="text-emerald-400 font-extrabold">{milStats.raag.arohaMatchPercent}% Match</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avaroha Path accuracy:</span>
                      <span className="text-emerald-400 font-extrabold">{milStats.raag.avarohaMatchPercent}% Match</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5">ESTABLISHED RULE PHRASES TARGETED</span>
                      <div className="flex flex-wrap gap-1.5">
                        {milStats.raag.characteristicPhrasesIdentified.map((ph) => (
                          <span key={ph} className="px-2 py-0.5 text-[10px] bg-emerald-950/40 border border-emerald-900 text-emerald-404 rounded font-mono font-semibold">
                            {ph}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-0.5 leading-normal">
                      <strong>Dominance Report:</strong> {milStats.raag.vadiSamvadiDominance}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: RECORDED AUDIO TAKE ANALYZER     */}
        {/* ======================================= */}
        {activeTab === "takes" && (
          <div className="space-y-3 font-sans">
            <h4 className="text-xs font-bold text-slate-300">Recorded Takes Library</h4>
            
            {localTakes.length === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-slate-900 border-dashed rounded-xl space-y-2">
                <Music className="h-8 w-8 text-slate-700 mx-auto stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-400">No vocal takes found.</p>
                <p className="text-[10px] text-slate-650 max-w-[245px] mx-auto leading-normal">
                  Toggle on the microphone, sing a quick practice phrase, and stop inside the Take Recorder to list files here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {localTakes.map((tk) => {
                  const isSelected = selectedTakeId === tk.id;
                  return (
                    <button
                      key={tk.id}
                      onClick={() => setSelectedTakeId(tk.id)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-purple-950/30 border-purple-800/80 shadow-md" 
                          : "bg-slate-900/30 border-transparent hover:border-slate-800 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-205 flex items-center gap-1.5">
                          <Music className={`h-3 w-3 ${isSelected ? 'text-purple-400' : 'text-slate-505'}`} />
                          {tk.name}
                        </div>
                        <div className="text-[9.5px] text-slate-500 flex items-center gap-3 font-mono">
                          <span>📅 {tk.timestamp.split(',')[0]}</span>
                          <span>⏱ {tk.durationSeconds}s</span>
                          <span className="text-purple-400/80 uppercase">{tk.raagName}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Manual audio uploader slot */}
            <div className="pt-2 border-t border-slate-900/60 flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400">
                Upload External Performance Track
              </label>
              
              <div className="relative border border-slate-800 border-dashed rounded-xl p-3.5 text-center bg-slate-950/60 hover:bg-slate-950 transition-all cursor-pointer">
                <input 
                  id="vocal-file-uploader-channel"
                  type="file" 
                  accept="audio/wav,audio/mp3,audio/webm"
                  onChange={handleUploadedFiles}
                  className="opacity-0 absolute inset-0 cursor-pointer"
                />
                <Upload className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block font-bold leading-normal">
                  Drop vocal WAV, MP3, or WebM track here <br />
                  <span className="text-slate-550 italic font-medium">Or click to browse storage (Max 15MB)</span>
                </span>
              </div>
            </div>

            {/* Analysis triggers status notification */}
            {uploadStatus && (
              <div className="bg-purple-950/10 border border-purple-900/40 p-2 rounded-lg text-[10px] font-mono text-purple-300 animate-pulse">
                {uploadStatus}
              </div>
            )}

            {selectedTakeId && (
              <button
                onClick={handleAnalyzeSelectedTake}
                disabled={isLoading}
                className="w-full mt-1.5 h-10 font-bold font-mono text-[10.5px] rounded-xl flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl hover:-translate-y-0.5 duration-300 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                ANALYZE TAKE IN INTEL ENG
              </button>
            )}

          </div>
        )}

      </div>

      {/* 3. Error and Chat Controls Footer */}
      <div className={`mt-3 pt-3 border-t ${dividerStyle} flex flex-col gap-2`}>
        
        {errorText && (
          <div id="guru-error-flag" className="bg-rose-950/20 border border-rose-900/50 p-2.5 rounded-xl flex gap-2 text-rose-300 text-[10.5px]">
            <AlertCircle className="h-4.5 w-4.5 text-rose-450 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleQuerySubmit} className="flex gap-2">
          <input
            id="guru-dialogue-input"
            type="text"
            className="flex-grow bg-slate-900 border border-slate-800 text-slate-205 text-xs rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-purple-600 focus:bg-slate-905 font-sans"
            placeholder={
              currentMetrics 
                ? "Ask: 'How do I center my Tivra Ma hold in Yaman?'" 
                : "Ask Sabha Gurus about Hindustani pitch stability..."
            }
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <button
            id="send-dialogue-query-button"
            type="submit"
            disabled={!queryInput.trim() || isLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
              queryInput.trim() && !isLoading 
                ? "bg-purple-600 hover:bg-purple-500 border-transparent text-white" 
                : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Diagnostic Compile Quick bar */}
        {currentMetrics && !criticReport && (
          <button
            id="compile-diagnostic-footer-button"
            onClick={handleDiagnosticCompile}
            className="w-full h-9 font-bold font-mono text-[9px] rounded-xl flex justify-center items-center gap-1.5 text-purple-305 border border-purple-800 bg-purple-950/25 hover:bg-purple-950/45 transition-all duration-305 uppercase animate-pulse"
          >
            <RefreshCw className="h-3 w-3" /> COMPILE RIYAZ DIAGNOSTIC CRITIQUE
          </button>
        )}
      </div>

    </div>
  );
};
