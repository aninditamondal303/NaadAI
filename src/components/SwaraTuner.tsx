/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, AlertTriangle, Check, Award, Eye } from 'lucide-react';
import { Swara, Raag, SWARAS_MAP } from '../types';

interface SwaraTunerProps {
  baseTonicHz: number;
  activeRaag: Raag;
  onSessionMetricsAccumulated: (metrics: {
    overallSurAccuracy: number;
    averageDeviationCents: number;
    meendCount: number;
    gamakCount: number;
    noteCoverage: Record<number, { count: number; stableCount: number; avgDeviation: number }>;
  }) => void;
  currentTheme?: "peacock" | "sunset" | "monsoon";
}

export const SwaraTuner: React.FC<SwaraTunerProps> = ({
  baseTonicHz,
  activeRaag,
  onSessionMetricsAccumulated,
  currentTheme
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  
  // Real-time tracking state
  const [currentFreq, setCurrentFreq] = useState<number>(-1);
  const [currentSwara, setCurrentSwara] = useState<Swara | null>(null);
  const [deviation, setDeviation] = useState<number>(0); // cents
  const [isNoteStable, setIsNoteStable] = useState<boolean>(false);
  
  // Ornaments state
  const [detectedOrnament, setDetectedOrnament] = useState<"Meend" | "Gamak" | null>(null);
  const [gamakSpeedHz, setGamakSpeedHz] = useState<number>(0);
  
  // Real-time grammar validation alerts
  const [isGrammarViolation, setIsGrammarViolation] = useState<boolean>(false);

  // Audio nodes and animation frame refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pcmDataRef = useRef<Float32Array | null>(null);

  // Live session statistics accumulation
  const totalFramesRef = useRef<number>(0);
  const stableFramesRef = useRef<number>(0);
  const sumDeviationRef = useRef<number>(0);
  const meendsCountRef = useRef<number>(0);
  const gamaksCountRef = useRef<number>(0);

  // Window history for trend calculations (Meend and Gamak tracking)
  const pitchHistoryRef = useRef<{ timestamp: number; freq: number; cents: number; swaraIndex: number }[]>([]);
  const noteCoverageRef = useRef<Record<number, { count: number; stableCount: number; sumDev: number }>>({});

  // Canvas ref for drawing the real-time audio oscillograph
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Reset tracker stats if Raag or Tonic changes
    pitchHistoryRef.current = [];
    noteCoverageRef.current = {};
    totalFramesRef.current = 0;
    stableFramesRef.current = 0;
    sumDeviationRef.current = 0;
    meendsCountRef.current = 0;
    gamaksCountRef.current = 0;
    setDetectedOrnament(null);
    setIsGrammarViolation(false);
  }, [baseTonicHz, activeRaag]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  /**
   * High-accuracy Autocorrelation pitch-tracking algorithm with Parabolic Interpolation
   * for microtonal sub-Hertz sensitivity.
   */
  const performPitchDetection = (buffer: Float32Array, sampleRate: number): number => {
    const size = buffer.length;
    let totalPower = 0;

    // 1. Calculate Signal Root-Mean-Square (RMS) to build simple noise threshold gate
    for (let i = 0; i < size; i++) {
      totalPower += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(totalPower / size);
    if (rms < 0.015) return -1; // gate quiet breaths or room hums

    // 2. Perform Center-Clipping to clean signal noise
    let r1 = 0, r2 = size - 1;
    const clippingThreshold = 0.15;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < clippingThreshold) { r1 = i; break; }
    }
    for (let i = size - 1; i >= size / 2; i--) {
      if (Math.abs(buffer[i]) < clippingThreshold) { r2 = i; break; }
    }
    const clipped = buffer.subarray(r1, r2);
    const clippedSize = clipped.length;

    // 3. Compute Autocorrelation coefficients
    const rValues = new Float32Array(clippedSize);
    for (let lag = 0; lag < clippedSize; lag++) {
      let sum = 0;
      for (let j = 0; j < clippedSize - lag; j++) {
        sum += clipped[j] * clipped[j + lag];
      }
      rValues[lag] = sum;
    }

    // 4. Trace the first local dip descending from prime autocorrelation origin
    let lagOffset = 0;
    while (lagOffset < clippedSize - 1 && rValues[lagOffset] > rValues[lagOffset + 1]) {
      lagOffset++;
    }

    // 5. Hunt for the highest correlation peak beyond the dip boundary
    let highestPeakVal = -1;
    let highestPeakLag = -1;
    for (let lag = lagOffset; lag < clippedSize - 1; lag++) {
      if (rValues[lag] > rValues[lag - 1] && rValues[lag] > rValues[lag + 1]) {
        if (rValues[lag] > highestPeakVal) {
          highestPeakVal = rValues[lag];
          highestPeakLag = lag;
        }
      }
    }

    // 6. Apply Parabolic Interpolation over neighboring peaks for fine cents tracking
    if (highestPeakLag !== -1 && highestPeakLag > 0 && highestPeakLag < clippedSize - 1) {
      const alpha = rValues[highestPeakLag - 1];
      const beta = rValues[highestPeakLag];
      const gamma = rValues[highestPeakLag + 1];
      const divisor = 2 * (alpha + gamma - 2 * beta);
      
      const interpolationOffset = divisor !== 0 ? (alpha - gamma) / divisor : 0;
      const truePeriod = highestPeakLag + interpolationOffset;
      
      const pitchHz = sampleRate / truePeriod;
      
      // Limit detection limits to typical classical vocal domains (e.g. 90Hz to 900Hz)
      if (pitchHz >= 85 && pitchHz <= 850) {
        return pitchHz;
      }
    }

    return -1;
  };

  /**
   * Tracks ornamentation events (Meend and Gamak) using temporal sliding windows:
   *   - Meend (Glissando): Smooth, continuous transition crossing multiple scale intervals.
   *   - Gamak (Vibrato/Andolan): Controlled quick pitch oscillation of 10-40 cents at 4.5-8 Hz.
   */
  const parseVocalOrnamentsAndGrammar = (freq: number, cents: number, swaraIdx: number) => {
    const now = Date.now();
    const history = pitchHistoryRef.current;

    // Append to window (limit history span of last 2 seconds)
    history.push({ timestamp: now, freq, cents, swaraIndex: swaraIdx });
    if (history.length > 50) history.shift();

    if (history.length < 15) return;

    // 1. Diagnose GAMAK: evaluate periodic pitch swing
    // Scan recent frame segments for sinusoidal oscillations
    let minCents = Infinity;
    let maxCents = -Infinity;
    let crossCount = 0;
    let sumCents = 0;

    const recentFrames = history.slice(-25);
    recentFrames.forEach(f => {
      sumCents += f.cents;
      if (f.cents < minCents) minCents = f.cents;
      if (f.cents > maxCents) maxCents = f.cents;
    });

    const avgCents = sumCents / recentFrames.length;
    let lastSign = 0;

    // Count transitions over the central moving average axis (zero-crossings) to estimate frequency
    recentFrames.forEach(f => {
      const sign = f.cents > avgCents ? 1 : -1;
      if (lastSign !== 0 && sign !== lastSign) {
        crossCount++;
      }
      lastSign = sign;
    });

    const amplitudeSpan = maxCents - minCents;
    const durationSec = (recentFrames[recentFrames.length - 1].timestamp - recentFrames[0].timestamp) / 1000;
    
    // Estimate vibrato speed: crossCount zero-crossings corresponds to (crossCount/2) waves
    const estimatedHz = durationSec > 0 ? (crossCount / 2) / durationSec : 0;

    if (amplitudeSpan > 15 && amplitudeSpan < 50 && estimatedHz >= 4.0 && estimatedHz <= 8.5) {
      if (detectedOrnament !== "Gamak") {
        setDetectedOrnament("Gamak");
        setGamakSpeedHz(parseFloat(estimatedHz.toFixed(1)));
        gamaksCountRef.current++;
        
        // Temporarily clear ornamental badge after 1.5 seconds
        setTimeout(() => setDetectedOrnament(null), 1500);
      }
      return;
    }

    // 2. Diagnose MEEND (Continuous sliding glide):
    // If the pitch moves in a steady, unified direction crossing at least 2 swara boundaries
    const firstFrame = recentFrames[0];
    const lastFrame = recentFrames[recentFrames.length - 1];
    
    const swaraDistance = Math.abs(lastFrame.swaraIndex - firstFrame.swaraIndex);
    let monotonicMove = true;
    
    // Confirm continuous monotonicity to verify glide structure
    for (let i = 1; i < recentFrames.length; i++) {
      const step = recentFrames[i].freq - recentFrames[i - 1].freq;
      // If there's an sudden step breakdown in direction, fail glissando
      if (Math.abs(step) > 40) {
        monotonicMove = false;
        break;
      }
    }

    if (monotonicMove && swaraDistance >= 2 && swaraDistance <= 5) {
      if (detectedOrnament !== "Meend") {
        setDetectedOrnament("Meend");
        meendsCountRef.current++;
        setTimeout(() => setDetectedOrnament(null), 1500);
      }
    }
  };

  /**
   * Maps fundamental frequency f0 to nearest Hindustani Swara, calculates cents deviation:
   *   cents_from_sa = 1200 * log2(f0 / baseTonicHz)
   */
  const processFrameDetections = (freq: number) => {
    setCurrentFreq(freq);

    const centsFromSa = 1200 * Math.log2(freq / baseTonicHz);
    const semitonesFromSa = Math.round(centsFromSa / 100);
    const rawCentsDev = centsFromSa - (semitonesFromSa * 100);

    // Standard 12 Swara index wrap
    const swaraIdx = ((semitonesFromSa % 12) + 12) % 12;
    const swara = SWARAS_MAP[swaraIdx];
    
    setCurrentSwara(swara);
    setDeviation(parseFloat(rawCentsDev.toFixed(1)));

    // A note is categorized as "sur" (stable) if it is within 20 cents of perfect center
    const stable = Math.abs(rawCentsDev) < 22;
    setIsNoteStable(stable);

    // Evaluate grammar compliance relative to selected Raag allowed notes
    const isAllowed = activeRaag.allowedSwaras.includes(swaraIdx);
    setIsGrammarViolation(!isAllowed);

    // Profile logs accumulating
    totalFramesRef.current++;
    if (stable) stableFramesRef.current++;
    sumDeviationRef.current += Math.abs(rawCentsDev);

    // Update note coverage statistics dictionary
    if (!noteCoverageRef.current[swaraIdx]) {
      noteCoverageRef.current[swaraIdx] = { count: 0, stableCount: 0, sumDev: 0 };
    }
    const cell = noteCoverageRef.current[swaraIdx];
    cell.count++;
    if (stable) cell.stableCount++;
    cell.sumDev += Math.abs(rawCentsDev);

    // Parse ornamental patterns and trajectory lines
    parseVocalOrnamentsAndGrammar(freq, centsFromSa, swaraIdx);
  };

  /**
   * Draw the real time audio oscillograph overlaying the UI card
   */
  const drawAudioOscillogram = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isNoteStable ? "rgba(16, 185, 129, 0.65)" : "rgba(168, 85, 247, 0.45)";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  /**
   * Animation processing loop running in rhythm with display refreshes
   */
  const runDetectionLoop = () => {
    if (!analyserRef.current || !pcmDataRef.current) return;

    // Extract time domain pcm data buffers
    analyserRef.current.getFloatTimeDomainData(pcmDataRef.current);
    
    const sampleRate = audioCtxRef.current?.sampleRate || 44100;
    const detectedHz = performPitchDetection(pcmDataRef.current, sampleRate);

    if (detectedHz > 0) {
      processFrameDetections(detectedHz);
    } else {
      // Quiet frame resetting
      setCurrentFreq(-1);
    }

    drawAudioOscillogram();

    animationFrameRef.current = requestAnimationFrame(runDetectionLoop);
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      // Setup Web Audio nodes
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const source = audioCtxRef.current.createMediaStreamSource(streamRef.current);
      
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048; // Large FFT buffer for robust low pitch capturing
      
      source.connect(analyserRef.current);
      
      pcmDataRef.current = new Float32Array(analyserRef.current.fftSize);
      setIsRecording(true);

      // Trigger standard continuous animation capture loop
      setTimeout(() => {
        runDetectionLoop();
      }, 100);

    } catch (err: any) {
      console.error("Microphone linkage failure:", err);
      setMicError(
        "Microphone connection blocked. Please allow browser microphone permission to enable the real-time Swara tuner."
      );
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }

    // Deliver aggregated diagnostic metrics up to parent state upon session closing
    if (totalFramesRef.current > 15) {
      const accuracy = Math.round((stableFramesRef.current / totalFramesRef.current) * 100);
      const avgDev = totalFramesRef.current > 0 ? parseFloat((sumDeviationRef.current / totalFramesRef.current).toFixed(1)) : 0;

      // Restructure raw coverage dictionaries matches types mappings
      const coverageResults: Record<number, { count: number; stableCount: number; avgDeviation: number }> = {};
      Object.keys(noteCoverageRef.current).forEach(key => {
        const idx = parseInt(key);
        const cell = noteCoverageRef.current[idx];
        coverageResults[idx] = {
          count: cell.count,
          stableCount: cell.stableCount,
          avgDeviation: parseFloat((cell.sumDev / cell.count).toFixed(1))
        };
      });

      onSessionMetricsAccumulated({
        overallSurAccuracy: accuracy,
        averageDeviationCents: avgDev,
        meendCount: meendsCountRef.current,
        gamakCount: gamaksCountRef.current,
        noteCoverage: coverageResults
      });
    }

    // Reset clean states
    setCurrentFreq(-1);
    setCurrentSwara(null);
  };

  return (
    <div id="swara-tuner-card" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800/80 shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Absolute micro-oscill oscillograph rendering under headers */}
      <canvas 
        ref={canvasRef} 
        width={340} 
        height={80} 
        className="absolute top-2 right-2 pointer-events-none opacity-20 w-44 h-11" 
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mic className={`h-4.5 w-4.5 ${isRecording ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <h3 className="text-base font-bold text-slate-100 font-sans tracking-wide">Dynamic Swara Tuner</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900 text-purple-400 border border-slate-800 uppercase">
            Sur Analyzer
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Autocorrelation pitch-tracking matches vocal cents offsets against {activeRaag.name} scale limits.
        </p>
      </div>

      {micError && (
        <div id="mic-error-notice" className="my-3 bg-rose-950/40 border border-rose-900 p-3 rounded-xl flex gap-2.5 text-rose-300 text-[11.5px] leading-relaxed">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{micError}</span>
        </div>
      )}

      {/* Main pitch detection feedback meters container */}
      <div className="my-4 flex flex-col items-center">
        {currentFreq > 0 && currentSwara ? (
          <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
            {/* Visual Swara Symbol Circle badge */}
            <div className="relative">
              <div id="visual-swara-badge" className={`h-24 w-24 rounded-full flex flex-col items-center justify-center border-3 transition-colors duration-300 shadow-xl ${
                isGrammarViolation
                  ? 'border-amber-600 bg-amber-950/20 text-amber-300 shadow-amber-950/30'
                  : (isNoteStable 
                      ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 shadow-emerald-950/40' 
                      : 'border-purple-600 bg-purple-950/25 text-purple-300 shadow-purple-950/40')
              }`}>
                <span className="text-4xl font-extrabold tracking-tight leading-none">
                  {currentSwara.symbol}
                </span>
                <span className="text-[10px] font-mono mt-0.5 font-bold uppercase opacity-80">
                  {currentSwara.name.split(" ")[0]}
                </span>
              </div>
              
              {/* Stable checkmark overlay */}
              {isNoteStable && !isGrammarViolation && (
                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border border-slate-900 flex items-center justify-center shadow-lg text-slate-950">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
              )}
            </div>

            {/* Note details and digital freq readouts */}
            <div className="text-center">
              <span className="text-xs text-slate-400 font-mono">DETECTED FREQUENCY</span>
              <p className="text-lg font-bold text-slate-200 font-mono tracking-tight">
                {currentFreq.toFixed(1)} Hz 
                <span className="text-xs text-slate-500 ml-1.5">(Sa reference: {baseTonicHz} Hz)</span>
              </p>
            </div>

            {/* Custom fine Tuning target Cents needle slider */}
            <div id="cents-tuning-meter shadow" className="w-full bg-slate-900/60 border border-slate-900 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold">
                <span>FLAT (-50 cents)</span>
                <span className={`text-xs ${isNoteStable ? 'text-emerald-400' : (deviation > 0 ? 'text-rose-400' : 'text-rose-500')}`}>
                  {deviation > 0 ? `+${deviation}` : deviation} CENTS
                </span>
                <span>SHARP (+50 cents)</span>
              </div>
              
              <div className="relative w-full h-2.5 bg-slate-800 rounded-full flex items-center">
                {/* Visual stable Sur green center boundary anchor */}
                <div className="absolute left-[calc(50%-8%)] w-[16%] h-full bg-emerald-500/25 border-x border-emerald-500/20 rounded-sm" />
                <div className="absolute left-1/2 w-[1.5px] h-full bg-slate-700" />
                
                {/* Simulated dynamic slider needle */}
                <div 
                  className={`absolute h-4 w-4 rounded-full border shadow-md transition-all duration-100 ${
                    isNoteStable 
                      ? 'bg-emerald-400 border-emerald-300 shadow-emerald-500/35 scale-110' 
                      : 'bg-rose-500 border-rose-300 shadow-rose-900/40'
                  }`}
                  style={{
                    left: `calc(${50 + (deviation / 50) * 50}% - 8px)`
                  }}
                />
              </div>

              <div className="text-center pt-1.5 flex justify-center gap-1.5">
                {isGrammarViolation ? (
                  <span id="grammar-flag-warning" className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    GRAMMAR ALERT: NOTE OUTSIDE {activeRaag.name.slice(5).toUpperCase()} ALLOWED SET
                  </span>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 ${
                    isNoteStable 
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60' 
                      : 'bg-purple-950/40 text-purple-300 border border-purple-800/60'
                  }`}>
                    {isNoteStable ? <Award className="h-3 w-3" /> : <Activity className="h-3 w-3 text-purple-400" />}
                    {isNoteStable ? "SUR-PRANAM (IN-TUNE PERFECT ON-PITCH)" : "SUR-STABILIZING (ADJUST VOICE)"}
                  </span>
                )}
              </div>
            </div>

            {/* Simulated Ornament Recognition active badges (Meend & Gamak feedback) */}
            {detectedOrnament && (
              <div id="detected-ornament-toast" className="w-full flex justify-center animate-bounce">
                <span className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 text-purple-200 border-purple-700/80 shadow-lg shadow-purple-950/40">
                  <Activity className="h-3.5 w-3.5 text-purple-400" />
                  {detectedOrnament === "Gamak" 
                    ? `GAMAK DETECTED (OSCILLATION: ${gamakSpeedHz} Hz)` 
                    : "MEEND DETECTED (ESTEEMED GLISSANDO GLIDE)"}
                </span>
              </div>
            )}

          </div>
        ) : (
          <div className="py-14 text-center space-y-3.5">
            <div className="inline-flex h-12 w-12 rounded-full items-center justify-center bg-slate-900 border border-slate-800 text-slate-600">
              <Eye className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Silent / Ambient Calibration...</p>
              <p className="text-xs text-slate-600 max-w-[280px] mx-auto mt-1 leading-relaxed">
                Activate vocal tracking below and sing a steady "Aaa" vowels to map your microtonal trajectory onto the Swara grid.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Raag scale legend layout */}
        <div className="bg-slate-900/35 border border-slate-900 p-3 rounded-xl space-y-1.5">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block tracking-wider">
            {activeRaag.name} Scale Reference
          </span>
          <div className="flex flex-wrap gap-1">
            {SWARAS_MAP.map((swara) => {
              const isAllowed = activeRaag.allowedSwaras.includes(swara.index);
              const isSingerActive = currentSwara?.index === swara.index && currentFreq > 0;
              return (
                <span
                  id={`scale-legend-swara-${swara.index}`}
                  key={swara.index}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border uppercase transition-all ${
                    isAllowed
                      ? (isSingerActive 
                          ? 'bg-purple-600 text-white border-transparent font-bold shadow-sm shadow-purple-800' 
                          : 'bg-purple-950/20 text-purple-200 border-purple-950 hover:border-purple-800')
                      : 'bg-slate-900/30 text-slate-600 border-transparent strike-through'
                  }`}
                  title={swara.name}
                >
                  {swara.symbol}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Toggle buttons */}
        <button
          id="toggle-vocal-recording-button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-xs flex justify-center items-center gap-2 border transition-all duration-300 ${
            isRecording 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/40 animate-pulse' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-transparent shadow-lg shadow-purple-900/20'
          }`}
        >
          {isRecording ? (
            <>
              <Check className="h-4 w-4" />
              <span>VOICE TRACKER ACTIVE (TAP TO FREEZE LOG)</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 text-white" />
              <span>ACTIVATE REAL-TIME VOICE ENTRY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
