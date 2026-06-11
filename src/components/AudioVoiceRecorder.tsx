/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Play, Pause, Download, Volume2, Save, Disc, Sparkles, Music } from 'lucide-react';

interface AudioTake {
  id: string;
  name: string;
  timestamp: string;
  raagName: string;
  durationSeconds: number;
  audioBase64: string; // Persistent base64 audio data
}

interface AudioVoiceRecorderProps {
  activeRaagName: string;
  currentTheme: "peacock" | "sunset" | "monsoon";
}

export const AudioVoiceRecorder: React.FC<AudioVoiceRecorderProps> = ({
  activeRaagName,
  currentTheme
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [takes, setTakes] = useState<AudioTake[]>([]);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [vocalTitleInput, setVocalTitleInput] = useState<string>("");

  // Refs for audio media streams
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlaybackTimeRef = useRef<number>(0);

  // Audio Context refs for drawing real time input level visualization on canvas
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load saved takes on initiation
  useEffect(() => {
    try {
      const stored = localStorage.getItem("naadai_vocal_takes");
      if (stored) {
        setTakes(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed loading storage vocal takes:", e);
    }
  }, []);

  // Save takes on modification
  const saveTakesToLocalStorage = (updatedTakes: AudioTake[]) => {
    try {
      localStorage.setItem("naadai_vocal_takes", JSON.stringify(updatedTakes));
      setTakes(updatedTakes);
    } catch (e) {
      console.error("Failed saving vocal takes to storage:", e);
      setAudioError("Vocal takes library limit reached. Please prune older recordings to store more takes.");
    }
  };

  // Clean elements on unmounting
  useEffect(() => {
    return () => {
      stopRecordingElements();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  const stopRecordingElements = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
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
  };

  /**
   * Continuous animation drawing the microphone audio wave on a canvas
   */
  const drawRealTimeWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;

    // Apply color palettes according to classical theme configuration
    if (currentTheme === "ivory") {
      ctx.strokeStyle = "#9C541D"; // Cinnamon Amber
    } else if (currentTheme === "midnight") {
      ctx.strokeStyle = "#A38BFF"; // Lavender Starry Neon
    } else {
      ctx.strokeStyle = "#F59E0B"; // Saffron orange
    }

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

    animationFrameRef.current = requestAnimationFrame(drawRealTimeWaveform);
  };

  const startRecording = async () => {
    setAudioError(null);
    audioChunksRef.current = [];
    setRecordTime(0);

    try {
      const liveStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = liveStream;

      // Initialize Web Audio context analyzer for drawing levels
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
      const source = audioCtxRef.current.createMediaStreamSource(liveStream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start drawing
      drawRealTimeWaveform();

      // Setup MediaRecorder
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(liveStream, options);
      } catch (e) {
        // Fallback for browsers that don't support audio/webm completely
        recorder = new MediaRecorder(liveStream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Safety constraint: require at least 1.5 seconds of content
        if (recordTime < 2) {
          setAudioError("Vocal recording was too short. Sing a longer alankar phrase.");
          return;
        }

        // Convert blob to base64 for persistent browser history storage
        const fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = () => {
          const base64Audio = fileReader.result as string;
          
          const title = vocalTitleInput.trim() || `Take #${takes.length + 1}`;
          const newTake: AudioTake = {
            id: `vtake_${Date.now()}`,
            name: title,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            raagName: activeRaagName,
            durationSeconds: recordTime,
            audioBase64: base64Audio
          };

          const updated = [newTake, ...takes];
          // Limit safe size to 4 items in localStorage to prevent 5MB storage limit crashes
          if (updated.length > 4) {
            updated.pop();
          }
          saveTakesToLocalStorage(updated);
          setVocalTitleInput("");
        };
      };

      recorder.start(250); // Slice recording bytes continuously
      setIsRecording(true);

      recordIntervalRef.current = window.setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);

    } catch (e: any) {
      console.error("Failed starting recorder flow:", e);
      setAudioError("Could not gain microphone input control. Please verify permissions.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopRecordingElements();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const playTake = (take: AudioTake) => {
    // If clicking on already playing element, pause it
    if (currentlyPlayingId === take.id && activeAudioRef.current) {
      activeAudioRef.current.pause();
      setCurrentlyPlayingId(null);
      return;
    }

    // Stop current playbacks
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(take.audioBase64);
    activeAudioRef.current = audio;
    setCurrentlyPlayingId(take.id);

    audio.onended = () => {
      setCurrentlyPlayingId(null);
    };

    audio.onerror = (e) => {
      console.error("Audio playback error event:", e);
      setAudioError("Could not decode and play this vocal take.");
      setCurrentlyPlayingId(null);
    };

    audio.play().catch(err => {
      console.error("Audio play promise failed:", err);
      setCurrentlyPlayingId(null);
    });
  };

  const deleteTake = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering playTake on parent element
    if (currentlyPlayingId === id && activeAudioRef.current) {
      activeAudioRef.current.pause();
      setCurrentlyPlayingId(null);
    }
    const filtered = takes.filter(t => t.id !== id);
    saveTakesToLocalStorage(filtered);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div id="vocal-take-recorder-card" className={`p-3 rounded-xl border transition-colors duration-300 shadow-xl flex flex-col justify-between ${
      currentTheme === "ivory"
        ? "bg-white border-amber-200/60 text-amber-950"
        : currentTheme === "midnight"
        ? "bg-slate-950 border-slate-900/80 text-slate-100"
        : "bg-slate-950 border-slate-800/80 text-slate-150"
    }`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Disc className={`h-4.5 w-4.5 ${isRecording ? 'text-rose-500 animate-spin' : 'text-purple-400'}`} />
            <h3 className="text-base font-bold font-sans tracking-wide">Take Recorder</h3>
          </div>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
            currentTheme === "ivory"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-purple-950/40 text-purple-400 border-purple-800/50"
          }`}>
            Live RIYĀZ TAKES
          </span>
        </div>
        <p className={`text-xs ${currentTheme === 'ivory' ? 'text-amber-900/80' : 'text-slate-400'}`}>
          Record actual voice clips. Audition takes directly in real-time or export recordings as native audio files.
        </p>
      </div>

      {audioError && (
        <div className="my-3.5 bg-rose-950/40 border border-rose-900/70 p-3 rounded-xl text-rose-300 text-[11px] leading-snug">
          {audioError}
        </div>
      )}

      {/* Interactive Recording Panel */}
      <div className="my-5 p-4 rounded-xl border flex flex-col items-center gap-3 relative overflow-hidden bg-slate-900/10 border-slate-900/60">
        
        {isRecording ? (
          <div className="w-full flex flex-col items-center gap-2.5 py-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-sm font-bold tracking-widest text-rose-400">
                REC • {formatTimer(recordTime)}
              </span>
            </div>
            
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={50} 
              className="w-full h-11 pointer-events-none opacity-85 rounded-lg"
            />
            
            <p className="text-[10px] uppercase font-mono text-slate-500 text-center tracking-wide mt-1">
              Singing {activeRaagName.toUpperCase()} Scales...
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-3.5 py-1">
            <input
              type="text"
              maxLength={25}
              placeholder="vocal phrase index (e.g. Yaman Alaap #1)"
              value={vocalTitleInput}
              onChange={(e) => setVocalTitleInput(e.target.value)}
              className={`w-full py-2 px-3 text-xs rounded-lg border text-center transition-all ${
                currentTheme === 'ivory'
                  ? 'bg-amber-50/40 border-amber-200 text-amber-950 placeholder-amber-800/55 focus:bg-white focus:border-amber-600'
                  : 'bg-slate-900/60 border-slate-800 text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-purple-600'
              }`}
            />
            
            <button
              onClick={startRecording}
              className={`w-28 h-11 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md border animate-in fade-in transition-all cursor-pointer ${
                currentTheme === "ivory"
                  ? "bg-amber-950 hover:bg-amber-900 text-white border-transparent"
                  : "bg-purple-600 hover:bg-purple-500 hover:scale-105 border-transparent text-white"
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>Record</span>
            </button>
          </div>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-28 h-10 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white animate-pulse transition-all cursor-pointer shadow-lg mt-1"
          >
            <Square className="h-3.5 w-3.5 fill-white" />
            <span>Stop</span>
          </button>
        )}
      </div>

      {/* Takes Library Container */}
      <div className="space-y-2.5">
        <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
          currentTheme === 'ivory' ? 'text-amber-800' : 'text-slate-500'
        }`}>
          Vocal Takes Library ({takes.length}/4)
        </h4>

        {takes.length === 0 ? (
          <div className="py-7 text-center rounded-xl border border-dashed border-slate-900/65 flex flex-col items-center justify-center gap-1">
            <Music className="h-6 w-6 text-slate-700" />
            <span className="text-xs font-semibold text-slate-500">No recorded takes yet</span>
            <span className="text-[10px] text-slate-600 leading-snug">Press Record above to capture a sung session.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {takes.map((take) => {
              const isPlaying = currentlyPlayingId === take.id;
              return (
                <div
                  key={take.id}
                  onClick={() => playTake(take)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer hover:-translate-y-0.2 group ${
                    isPlaying
                      ? currentTheme === 'ivory'
                        ? 'bg-amber-900/10 border-amber-700 text-amber-950 font-bold'
                        : 'bg-purple-900/35 border-purple-600/90 text-slate-100 font-bold'
                      : currentTheme === 'ivory'
                      ? 'bg-amber-50/20 border-amber-100 hover:bg-amber-50/60 text-amber-950'
                      : 'bg-slate-900/50 border-slate-900 hover:border-slate-800 hover:bg-slate-900/80 text-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 transition-transform ${
                        isPlaying
                          ? 'bg-emerald-500 text-slate-950 border-transparent animate-pulse'
                          : currentTheme === 'ivory'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="h-3.5 w-3.5 fill-slate-950" />
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-sans truncate font-bold ${currentTheme === 'ivory' ? 'text-amber-950' : 'text-slate-200'}`}>
                          {take.name}
                        </p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 bg-slate-900/60 rounded font-mono ${
                          currentTheme === 'ivory' ? 'text-amber-800' : 'text-purple-400'
                        }`}>
                          {take.raagName.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Duration: {formatTimer(take.durationSeconds)} • recorded at {take.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Native Web download hook */}
                    <a
                      href={take.audioBase64}
                      download={`NaadAI_Riyaz_Take_${take.name.replace(/\s+/g, '_')}.webm`}
                      title="Download audio take file"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2 rounded-lg border transition-all ${
                        currentTheme === 'ivory'
                          ? 'bg-amber-50 border-amber-200/50 text-amber-800 hover:bg-amber-100/55'
                          : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    
                    <button
                      title="Delete take"
                      onClick={(e) => deleteTake(take.id, e)}
                      className={`p-2 rounded-lg border transition-all ${
                        currentTheme === 'ivory'
                          ? 'border-transparent text-amber-800/80 hover:bg-red-50 hover:text-red-600'
                          : 'border-transparent text-slate-500 hover:bg-red-950/40 hover:text-red-400'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
