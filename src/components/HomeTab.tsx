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
import { ALL_84_RAAGS, ComprehensiveRaag } from '../data/allRaags';

// Pitch frequencies corresponding to classical standard scales (C3 base standard)
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
  setActiveTab: (tab: "home" | "tanpura" | "analyzer" | "journal" | "progress" | "library" | "profile") => void;
  setAnalyzerMode?: (mode: "scale" | "singing") => void;
  vocalistName?: string;
  baseTonicHz?: number;
}

// Complete classical profiles for the core interactive practice raga list
const PRACTICE_RAAG_CATALOGUE: Record<string, {
  pakad: string;
  aroha: string;
  avaroha: string;
  goals: string[];
  bandish: {
    title: string;
    description: string;
    tal: string;
    laya: string;
    sthayiLyrics: string;
    sthayiSwaralipi: string[];
    antaraLyrics: string;
    antaraSwaralipi: string[];
    sargam: string[];
  };
  paltas: string[];
}> = {
  yaman: {
    pakad: "N, R G R | G M_ D N | S' N D P | M_ G R S",
    aroha: "N, R G M_ D N S'",
    avaroha: "S' N D P M_ G R S",
    goals: [
      "Master the subtle glide (Meend) between Gandhar and Shuddha Rishabh.",
      "Lock cent-zero tuning with the Tivra Madhyam harmonic pivot.",
      "Sustain pristine resting silence on Gandhar (Vadi) and Nishad (Samvadi)."
    ],
    bandish: {
      title: "Eri Aali Piya Bina",
      description: "A legendary classical composition depicting the sweet longing of separation in late-evening twilight.",
      tal: "Teentaal (16 Beats)",
      laya: "Madhya Laya (Medium tempo)",
      sthayiLyrics: "Eri aali piya bina sakhi kala na parata mohe, ghadi pala chhin dina jiyara dharata nahi...",
      sthayiSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  G_   R_   G_   P_  | M_   D_   P_   M_  | G_   R_   S_   -_  | N,_  R_   G_   M_",
        "Words: E_   ri   aa   li  | pi   ya   bi   na  | sa   khi  -_   -_  | ka   la   na   pa",
        "Swar:  P_   D_   N_   D_  | P_   M_   G_   R_  | S_   -_   -_   -_  | -_   -_   -_   -_",
        "Words: ra   ta   mo   he  | gha  di   pa   la  | chhi n_   -_   -_  | -_   -_   -_   -_"
      ],
      antaraLyrics: "Jab se piya pardesh gail, batiyan takata batiyan bheege, ankhiyaan dharata nahi dhaar...",
      antaraSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  G_   G_   M_   P_  | P_   M_   N_   S'_ | S'_  S'_  R'_  R'_ | S'_  -_   S'_  N_",
        "Words: Ja   b_   se   pi  | ya   pa   r_   de  | sh   ga   i_   l_  | ba_  -_   ti   ya",
        "Swar:  D_   N_   S'_  N_  | D_   P_   M_   G_  | G_   R_   S_   -_  | -_   -_   -_   -_",
        "Words: n_   ta   ka   ta  | ba   ti   ya   n_  | bhee __   ge   -_  | -_   -_   -_   -_"
      ],
      sargam: [
        "Sargam Line 1: N, R G M_ D P M_ G R S",
        "Sargam Line 2: G M_ D N S' N D P M_ G R S",
        "Sargam Line 3: N, R G M_ D N S' R' S' N D P M_ G R S"
      ]
    },
    paltas: [
      "Palta 1 (Ascending): N, R G | R G M_ | G M_ D | M_ D N | D N S'",
      "Palta 1 (Descending): S' N D | N D P | D P M_ | P M_ G | M_ G R | G R S",
      "Palta 2 (Ascending): S G R G | R M_ G M_ | G D M_ D | M_ N D N | D S' N S'",
      "Palta 2 (Descending): S' D N D | N P D P | D M_ P M_ | P G M_ G | M_ R G R | G S R S"
    ]
  },
  bhairav: {
    pakad: "S G m P d_ P | G m r_ S | G m d_ P r_ S",
    aroha: "S r_ G m P d_ N S'",
    avaroha: "S' N d_ P m G r_ S",
    goals: [
      "Perfect the heavy resonant oscillation (Andolan) on Komal Rishabh (r) and Komal Dhaivat (d).",
      "Establish complete vocal control on the long meditative morning microtones.",
      "Sync pitch intervals precisely on Shuddha Madhyam and Pancham."
    ],
    bandish: {
      title: "Jago Mohan Pyare",
      description: "An auspicious transition morning composition invoking spiritual wakefulness, warm sunshine, and gratitude.",
      tal: "Teentaal (16 Beats)",
      laya: "Madhya Laya",
      sthayiLyrics: "Jago mohan pyare ab bhor bhayi hai, nanda ke dulare, jago mohan pyare ab bhor bhayi...",
      sthayiSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  S_   r_   G_   m_  | P_   -_   d_   P_  | m_   G_   r_   S_  | -_   S_   r_   G_",
        "Words: Ja   go   mo   ha  | n_   -_   pya  re  | a_   b_   bho  r_  | -_   bha  yi   hai"
      ],
      antaraLyrics: "Panchhi bana bole sagare ban upaban, phoolan sugandh pasare, jaago mohan...",
      antaraSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  m_   m_   P_   d_  | N_   N_   S'_  -_  | S'_  N_   d_   P_  | m_   G_   r_   S_",
        "Words: Pa   n_   chhi b_  | a_   n_   bo   le  | sa   g_   a_   re  | ba   n_   u   pa"
      ],
      sargam: [
        "Sargam Line 1: S r G m P d N S'",
        "Sargam Line 2: S' N d P m G r S",
        "Sargam Line 3: S G m P | m P d P | P d N S' | S' N d P r S"
      ]
    },
    paltas: [
      "Palta 1 (Andolan Gym): S r_ S - | r_ G r_ - | G m G - | m P m - | P d_ P -",
      "Palta 2 (Ascending): S r_ G | r_ G m | G m P | m P d_ | P d_ N | d_ N S'",
      "Palta 2 (Descending): S' N d_ | N d_ P | d_ P m | P m G | m G r_ | G r_ S"
    ]
  },
  bageshree: {
    pakad: "S R g m | D n D m | g R S",
    aroha: "S g m D n S'",
    avaroha: "S' n D m g R S",
    goals: [
      "Master the slow, smooth slide between Madhyam and Komal Gandhar.",
      "Emphasize Shuddha Madhyam as the primary resting king note (Vadi).",
      "Express elegiac beauty and deep, soft moonlight longing through slow compositions."
    ],
    bandish: {
      title: "Kaun Gata Tum Bin Prabhiya",
      description: "An elegant midnight romantic classic expressing prayerful devotion and melodic surrender.",
      tal: "Teentaal (16 Beats)",
      laya: "Madhya Laya",
      sthayiLyrics: "Kaun gata tum bin prabhu swara ke sanyog bandhan sohe, tum sikhawat sur-taal...",
      sthayiSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  S_   R_   g_   m_  | D_   -_   n_   D_  | m_   g_   R_   S_  | S_   g_   m_   D_",
        "Words: Ka   u_   n_   ga  | ta   -_   tu   m_  | bi   n_   pr_  bhu | swa  ra   ke   sa"
      ],
      antaraLyrics: "Sur gyaan dhyan tum hi deenhe saraswati kripa barasae mohe pritam...",
      antaraSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  m_   m_   D_   n_  | S'_  S'_  S'_  -_  | n_   D_   m_   g_  | R_   g_   S_   -_",
        "Words: Su   r_   gya  a_  | n_   dhya a_   -_  | tu   m_   hi_  de  | e_   nh   e_   _-"
      ],
      sargam: [
        "Sargam Line 1: S g m D n S'",
        "Sargam Line 2: S' n D m g R S",
        "Sargam Line 3: g m D n D m g R S"
      ]
    },
    paltas: [
      "Palta 1 (Ascending): S g m | R m D | m D n | D n S'",
      "Palta 1 (Descending): S' n D | n D m | D m g | m g R | g R S",
      "Palta 2: S g R S | R m g R | m D m g | D n D m | n S' n D"
    ]
  },
  bhupali: {
    pakad: "G R S D, S R G | P G R S G R S",
    aroha: "S R G P D S'",
    avaroha: "S' D P G R S",
    goals: [
      "Sing clean, pure pentatonic leaps skipping Madhyam and Nishad completely.",
      "Lock the major-third Gandhar resonance in high pitch registers.",
      "Sustain immense positive, peaceful morning-like radiance in an evening scale."
    ],
    bandish: {
      title: "Jab Se Tum Sang Neha Lagae",
      description: "A bright, beautiful composition in sweet Teentaal celebrating spiritual joy and pristine clarity.",
      tal: "Teentaal (16 Beats)",
      laya: "Chhota Laya (Medium Up)",
      sthayiLyrics: "Jab se tum sang neha lagae, din nahi chain, rain nahi nindya, sakhi re bin sajan...",
      sthayiSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  S_   R_   G_   -_  | P_   G_   R_   S_  | D_   R_   S_   -_  | S_   R_   G_   P_",
        "Words: Ja   b_   se   -_  | tu   m_   sa   ng  | ne   ha   -_   -_  | la   ga   e_   din"
      ],
      antaraLyrics: "Priyatam tum bin kal na parat hai, rain birah dukh barasat naina...",
      antaraSwaralipi: [
        "Beats: 1     2    3    4   | 5    6    7    8   | 9    10   11   12  | 13   14   15   16",
        "Swar:  G_   G_   P_   D_  | S'_  S'_  S'_  -_  | D_   P_   G_   R_  | S_   R_   S_   -_",
        "Words: Pri  ya   ta   m_  | tu   m_   bi   n_  | ka   l_   na   pa  | ra   t_   ha   i_"
      ],
      sargam: [
        "Sargam Line 1: S R G P D S'",
        "Sargam Line 2: S' D P G R S",
        "Sargam Line 3: G R S D, S R G P G R S"
      ]
    },
    paltas: [
      "Palta 1 (Ascending): S R G | R G P | G P D | P D S'",
      "Palta 1 (Descending): S' D P | D P G | P G R | G R S",
      "Palta 2: S R G P | R G P D | G P D S' | P D S' R'"
    ]
  }
};

export const HomeTab: React.FC<HomeTabProps> = ({
  setActiveTab,
  setAnalyzerMode,
  vocalistName = "Shishya",
  baseTonicHz = 138.59
}) => {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [todayRiyazCompleted, setTodayRiyazCompleted] = useState<Record<string, boolean>>({
    kharaj: false,
    alankar: true,
    yaman_meend: false,
    sargam: false
  });

  // Practice session state
  const [activePractice, setActivePractice] = useState<PracticeSession | null>(null);
  const [selectedPracticeRaag, setSelectedPracticeRaag] = useState<string>("yaman");
  const [selectedPracticeScale, setSelectedPracticeScale] = useState<string>("C#");
  const [selectedPracticeDuration, setSelectedPracticeScaleDuration] = useState<number>(30);
  
  // Pluck indicator active wave state (0-3 strings)
  const [activeString, setActiveString] = useState<number | null>(null);

  // Audio Context Ref block for Practice Mode Tanpura
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const sequencerTimeoutRef = useRef<number | null>(null);
  const stringIndexRef = useRef<number>(0);
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
            // Stop sound
            stopPracticeTanpura();
            alert("Congratulations! You have completed your Riyāz standard segment safely. Pranam.");
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

  // synthesized Tanpura physical pluck helper node
  const playAcousticPluckSynth = (ctx: AudioContext, frequency: number, idx: number, volume: number) => {
    // Standard detuning multiplier to simulate Jawari buzzing bridge
    const tunedFreq = frequency;
    const duration = 4.2;

    const oscSaw = ctx.createOscillator();
    const oscTri = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const bandpassNode = ctx.createBiquadFilter();
    const pluckGain = ctx.createGain();

    oscSaw.type = "sawtooth";
    oscTri.type = "triangle";
    subOsc.type = "sine";

    // Chorus detuning coefficients for acoustic resonance
    oscSaw.frequency.setValueAtTime(tunedFreq, ctx.currentTime);
    oscTri.frequency.setValueAtTime(tunedFreq * 1.002, ctx.currentTime);
    subOsc.frequency.setValueAtTime(tunedFreq * 0.5, ctx.currentTime); // low sub third

    bandpassNode.type = "lowpass";
    bandpassNode.Q.setValueAtTime(3.5, ctx.currentTime);
    bandpassNode.frequency.setValueAtTime(200, ctx.currentTime);
    bandpassNode.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.05);
    bandpassNode.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + duration);

    pluckGain.gain.setValueAtTime(0, ctx.currentTime);
    // Pluck amplitude envelope curve
    pluckGain.gain.linearRampToValueAtTime(idx === 3 ? (volume / 100) * 0.4 : (volume / 100) * 0.28, ctx.currentTime + 0.025);
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscSaw.connect(bandpassNode);
    oscTri.connect(bandpassNode);
    bandpassNode.connect(pluckGain);
    subOsc.connect(pluckGain);
    pluckGain.connect(masterGainRef.current || ctx.destination);

    oscSaw.start();
    oscTri.start();
    subOsc.start();

    oscSaw.stop(ctx.currentTime + duration);
    oscTri.stop(ctx.currentTime + duration);
    subOsc.stop(ctx.currentTime + duration);
  };

  const sequencerDroneLoop = () => {
    if (!audioCtxRef.current || !activePractice) return;
    const ctx = audioCtxRef.current;
    
    // Safety check for suspension state (Safari/Chrome autoplay restrictions)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const currentIdx = stringIndexRef.current;
    setActiveString(currentIdx);

    const baseTonic = activePractice.baseHz;
    let PluckFrequency = baseTonic;

    // Plucking strings sequentially: 1st (Pa/Ma/Ni), 2nd (Sa), 3rd (Sa), 4th (Low Sa)
    if (currentIdx === 0) {
      if (activePractice.isSelectedTuning === "Pa") {
        PluckFrequency = baseTonic * 0.75; // Low Dominant Pa fifth
      } else if (activePractice.isSelectedTuning === "Ma") {
        PluckFrequency = baseTonic * 0.666; // Subdominant Shuddha Ma
      } else {
        PluckFrequency = baseTonic * 0.9375; // Shuddha Nishad standard
      }
    } else if (currentIdx === 1) {
      PluckFrequency = baseTonic; // Middle octave drone
    } else if (currentIdx === 2) {
      PluckFrequency = baseTonic * 1.0012; // Chorused Sa drone
    } else if (currentIdx === 3) {
      PluckFrequency = baseTonic * 0.5; // Deep Kharaj Sa (low octave)
    }

    playAcousticPluckSynth(ctx, PluckFrequency, currentIdx, activePractice.volume);

    // Advance index
    stringIndexRef.current = (currentIdx + 1) % 4;

    // Schedule next string pluck in sequence (determined by tempo in BPM)
    const pluckIntervalMs = (60 / activePractice.tempoBpm) * 1150;
    sequencerTimeoutRef.current = window.setTimeout(sequencerDroneLoop, pluckIntervalMs);
  };

  const startPracticeTanpura = (session: PracticeSession) => {
    try {
      stopPracticeTanpura();
      
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(session.volume / 100, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      stringIndexRef.current = 0;
      
      // Seed interval and start loop
      sequencerTimeoutRef.current = window.setTimeout(sequencerDroneLoop, 50);
    } catch(err) {
      console.error("Autoplay browser constraints prevented Audio Drone setup:", err);
    }
  };

  const stopPracticeTanpura = () => {
    if (sequencerTimeoutRef.current) {
      clearTimeout(sequencerTimeoutRef.current);
      sequencerTimeoutRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(e => console.log("Context close error: ", e));
      audioCtxRef.current = null;
    }
    setActiveString(null);
  };

  const handleStartPracticeSession = () => {
    // Resolve matching base scale freq
    const matchedNote = NOTE_PITCHES.find(n => n.note === selectedPracticeScale) || NOTE_PITCHES[1];
    
    // Choose appropriate tuning style for Raga
    let optimalTuning: "Pa" | "Ma" | "Ni" = "Pa";
    if (selectedPracticeRaag === "yaman") optimalTuning = "Ni"; // Yaman customarily tuned to Nishad
    else if (selectedPracticeRaag === "bageshree") optimalTuning = "Ma"; // Bageshree tunes to Madhyam

    const session: PracticeSession = {
      raagId: selectedPracticeRaag,
      raagName: selectedPracticeRaag === "yaman" ? "Raag Yaman" : 
                selectedPracticeRaag === "bhairav" ? "Raag Bhairav" : 
                selectedPracticeRaag === "bageshree" ? "Raag Bageshree" : "Raag Bhupali",
      scaleLabel: selectedPracticeScale,
      baseHz: matchedNote.hz,
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
      // Calculate practice elapsed
      const totalSeconds = activePractice.durationMins * 60;
      const actualElapsedSeconds = totalSeconds - activePractice.secondsRemaining;
      const elapsedMins = Math.floor(actualElapsedSeconds / 60);
      
      // Increment streak
      alert(`Riyāz Session Log Saved! You completed ${elapsedMins || 1} minutes of disciplined practice on ${activePractice.raagName} (${activePractice.scaleLabel} Standard). Pranam.`);
    }
    setActivePractice(null);
  };

  const togglePracticeTuning = (tuning: "Pa" | "Ma" | "Ni") => {
    if (!activePractice) return;
    const updated = { ...activePractice, isSelectedTuning: tuning };
    setActivePractice(updated);
    
    // Restart Sequencer with new parameter on the fly
    if (audioCtxRef.current) {
      stringIndexRef.current = 0;
    }
  };

  const handleTempoChange = (newTempo: number) => {
    if (!activePractice) return;
    setActivePractice({ ...activePractice, tempoBpm: newTempo });
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!activePractice) return;
    setActivePractice({ ...activePractice, volume: newVolume });
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(newVolume / 100, audioCtxRef.current.currentTime);
    }
  };

  // Determine current Prahar Raga based on hour of the day
  const getPraharDetails = (hour: number) => {
    if (hour >= 6 && hour < 9) {
      return {
        praharNum: "1st Prahar (Dawn)",
        raagName: "Raag Bhairav",
        scale: "S r G m P d N S'",
        timeStr: "Morning (06:00 - 09:00)",
        ragaId: "bhairav"
      };
    } else if (hour >= 9 && hour < 12) {
      return {
        praharNum: "2nd Prahar (Morning)",
        raagName: "Raag Todi",
        scale: "S r g M d N S'",
        timeStr: "Mid-day (09:00 - 12:00)",
        ragaId: "todi_thaat"
      };
    } else if (hour >= 12 && hour < 15) {
      return {
        praharNum: "3rd Prahar (Noon)",
        raagName: "Raag Bhimpalasi",
        scale: "S g m P N S' / S' n D P m g R S",
        timeStr: "Afternoon (12:00 - 15:00)",
        ragaId: "bhimpalasi"
      };
    } else if (hour >= 15 && hour < 18) {
      return {
        praharNum: "4th Prahar (Late Afternoon)",
        raagName: "Raag Patdeep",
        scale: "S R g m P D N S' | S' N D P m g R S",
        timeStr: "Late Afternoon (15:00 - 18:00)",
        ragaId: "patdeep"
      };
    } else if (hour >= 18 && hour < 21) {
      return {
        praharNum: "5th Prahar (Twilight)",
        raagName: "Raag Yaman",
        scale: "N' R G M D N S' | S' N D P M G R S",
        timeStr: "Sunset / Dusk (18:00 - 21:00)",
        ragaId: "yaman"
      };
    } else if (hour >= 21 && hour < 24) {
      return {
        praharNum: "6th Prahar (Early Night)",
        raagName: "Raag Bageshree",
        scale: "S R g m D n S' | S' n D m g R S",
        timeStr: "Nightfall (21:00 - 00:00)",
        ragaId: "bageshree"
      };
    } else if (hour >= 0 && hour < 3) {
      return {
        praharNum: "7th Prahar (Deep Night)",
        raagName: "Raag Darbari",
        scale: "S R g m P d n S' | S' d n P m g R S",
        timeStr: "Midnight (00:00 - 03:00)",
        ragaId: "darbari_kanada"
      };
    } else {
      return {
        praharNum: "8th Prahar (Pre-Dawn)",
        raagName: "Raag Malkauns",
        scale: "S g m d n S' | S' n d m g S",
        timeStr: "Dawn-break (03:00 - 06:00)",
        ragaId: "malkauns"
      };
    }
  };

  const prahar = getPraharDetails(currentHour);

  const handleAction = (tab: any, mode?: any) => {
    if (mode && setAnalyzerMode) {
      setAnalyzerMode(mode);
    }
    setActiveTab(tab);
  };

  const toggleTodo = (key: string) => {
    setTodayRiyazCompleted(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Human countdown converter helper
  const renderFormattedSeconds = (secTotal: number) => {
    const mins = Math.floor(secTotal / 60);
    const secs = secTotal % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active practice raag details
  const currentPracticeDetails = activePractice ? PRACTICE_RAAG_CATALOGUE[activePractice.raagId] : null;

  return (
    <div className="space-y-6">
      
      {/* IMMERSIVE RIYAZ PRACTICE ACTIVE COMPANION SCREEN */}
      {activePractice && currentPracticeDetails ? (
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
                            {opt} (Fifth)
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

            {/* RIGHT COLUMN: Raga blueprint info tabs, goals, and Swaralipi composition */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Raga traditional descriptors & goals card */}
              <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-850 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-850 pb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Raga Melody Blueprint</h3>
                  <span className="text-[10px] font-mono text-[#38BDF8] border border-indigo-950 px-2 py-0.5 bg-[#38BDF8]/5 rounded-full uppercase">Hindustani Grammar Profile</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#0F1115] p-3 rounded-xl border border-slate-850/40">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Thaat Srot</span>
                    <span className="text-slate-250 font-black block mt-0.5">Kalyan Foundation</span>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded-xl border border-slate-850/40">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Vadi King note</span>
                    <span className="text-[#38BDF8] font-black block mt-0.5">Gandhar (G)</span>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded-xl border border-slate-850/40">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Samvadi Queen</span>
                    <span className="text-[#FBBF24] font-black block mt-0.5">Nishad (N)</span>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded-xl border border-slate-850/40">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Traditional Prahar</span>
                    <span className="text-purple-300 font-black block mt-0.5 truncate">Evening Twilight</span>
                  </div>
                </div>

                {/* Aroha/Avaroha Swaralipi layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#0f1115]/80 p-3 rounded-xl border border-slate-900 font-mono text-center">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Aroha (Ascension)</span>
                    <span className="text-sm font-bold text-slate-300 block mt-1 tracking-wider">{currentPracticeDetails.aroha}</span>
                  </div>
                  <div className="bg-[#0f1115]/80 p-3 rounded-xl border border-slate-900 font-mono text-center">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Avaroha (Descension)</span>
                    <span className="text-sm font-bold text-slate-300 block mt-1 tracking-wider">{currentPracticeDetails.avaroha}</span>
                  </div>
                  <div className="bg-[#0f1115]/80 p-3 rounded-xl border border-slate-900 font-mono text-center col-span-1 md:col-span-1">
                    <span className="text-[8px] text-slate-500 block uppercase font-bold">Pakad (Catchphrase)</span>
                    <span className="text-xs font-bold text-[#FBBF24] block mt-1 tracking-wider overflow-x-hidden truncate" title={currentPracticeDetails.pakad}>
                      {currentPracticeDetails.pakad}
                    </span>
                  </div>
                </div>

                {/* Interactive Practice Goals list */}
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="text-[9px] font-mono text-slate-550 block uppercase font-bold">Disciplined Riyāz Focus Goals:</span>
                  <ul className="space-y-1.5 text-xs text-slate-350 list-inside leading-relaxed list-disc">
                    {currentPracticeDetails.goals.map((g, gi) => (
                      <li key={gi} className="pl-1 text-slate-300">{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Complete Bandish and Swaralipi sheet */}
              <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-850 shadow-xl space-y-5">
                <div className="border-b border-slate-850 pb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Full Classical Composition (Bandish)</span>
                    <span className="text-[10px] text-emerald-400 font-black">{currentPracticeDetails.bandish.tal}</span>
                  </h3>
                </div>

                <div className="space-y-1">
                  <span className="text-base font-serif font-bold text-[#FBBF24] block">" {currentPracticeDetails.bandish.title} " ({currentPracticeDetails.bandish.laya})</span>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{currentPracticeDetails.bandish.description}</p>
                </div>

                {/* Sthayi (Part 1 Envelopes) */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center gap-2 border-l-2 border-[#7C3AED] pl-2 font-mono text-[10px] text-purple-400 uppercase font-black tracking-wider">
                    Sthayi Section (First Verse)
                  </div>
                  
                  {/* Lyrics row and Swaralipi aligned */}
                  <div className="p-4 bg-[#0F1115] border border-slate-900 rounded-xl space-y-3 font-mono text-[11px] overflow-x-auto select-none leading-relaxed text-slate-350">
                    {currentPracticeDetails.bandish.sthayiSwaralipi.map((line, idx) => (
                      <div 
                        key={idx} 
                        className={`whitespace-pre border-b border-slate-900/40 pb-1 ${
                          line.startsWith("Swar:") ? "text-[#38BDF8] font-bold" : 
                          line.startsWith("Beats:") ? "text-slate-550 font-black" : "text-slate-300 font-sans"
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Antara (Part 2 Envelopes) */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center gap-2 border-l-2 border-amber-500 pl-2 font-mono text-[10px] text-amber-500 uppercase font-black tracking-wider">
                    Antara Section (Second Verse Chorus)
                  </div>
                  
                  <div className="p-4 bg-[#0F1115] border border-slate-900 rounded-xl space-y-3 font-mono text-[11px] overflow-x-auto select-none leading-relaxed text-slate-350">
                    {currentPracticeDetails.bandish.antaraSwaralipi.map((line, idx) => (
                      <div 
                        key={idx} 
                        className={`whitespace-pre border-b border-slate-900/40 pb-1 ${
                          line.startsWith("Swar:") ? "text-[#38BDF8] font-bold" : 
                          line.startsWith("Beats:") ? "text-slate-550 font-black" : "text-slate-300 font-sans"
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sargam and Paltas Exercises tab */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  <div className="bg-[#0f1115]/70 border border-slate-900 p-4 rounded-xl space-y-2.5">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">Example Sargam Phrasings</span>
                    <div className="font-mono text-xs text-slate-400 space-y-1.5 leading-relaxed">
                      {currentPracticeDetails.bandish.sargam.map((sline, si) => (
                        <div key={si} className="border-b border-slate-900/80 pb-1 last:border-0">{sline}</div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0f1115]/70 border border-slate-900 p-4 rounded-xl space-y-2.5">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">Recommended Riyāz Paltas (Scale Gymnastics)</span>
                    <div className="font-mono text-xs text-slate-400 space-y-1.5 leading-relaxed">
                      {currentPracticeDetails.paltas.map((pline, pi) => (
                        <div key={pi} className="border-b border-slate-900/80 pb-1 last:border-0">{pline}</div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

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
                "Understand Your Music. Deepen Your Riyaz."<br />
                Step onto your carpet, start your drone, and perfect the ancient microtonal aesthetics of Hindustani Classical Music.
              </p>

              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-2 text-xs font-mono">
                <span className="bg-[#0F1115] border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold">Base scale: C#</span>
                <span className="bg-[#0F1115] border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold">Lineage: Hindustani Purist V2</span>
              </div>
            </div>

            {/* Traditional Tanpura Neck design visual badge */}
            <div className="h-44 w-44 shrink-0 rounded-2xl bg-[#0F1115]/90 border border-slate-800 p-4 flex flex-col items-center justify-between relative shadow-inner">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Acoustic Anchor</span>
              <div className="flex flex-col items-center flex-grow justify-center gap-1.5">
                <div className="relative">
                  {/* Diya Oil Lamp symbol */}
                  <div className="h-10 w-10 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/50 flex items-center justify-center relative">
                    <span className="text-lg text-[#FBBF24] leading-none select-none">ॐ</span>
                    <div className="absolute -top-1.5 h-3 w-1.5 bg-orange-500 rounded-full blur-[0.5px] animate-pulse" />
                  </div>
                </div>
                <span className="text-xs text-slate-300 font-serif font-bold text-center">Riyāz Altar</span>
                <span className="text-[8px] font-mono text-[#38BDF8] select-none uppercase tracking-widest font-bold">Acoustic standards ready</span>
              </div>
              <span className="text-[8px] font-mono text-slate-650 block">S-P-S-S SYNTH</span>
            </div>

          </div>

          {/* NEW INTERACTIVE PRACTICE LAUNCH ALTAR */}
          <div className="bg-[#151A2E] border border-slate-850 p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden" id="practice-setup-card">
            
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#7C3AED]">
                <Flame className="h-5 w-5 text-amber-500 fill-amber-500/20" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-widest">Riyāz Altar Practice Mode</h3>
                <span className="text-[10px] text-slate-450 block font-normal font-sans">Configure your real-time plucking standard, load classical sheets, and start your discipline.</span>
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

              {/* Selector B: Choose Scale */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Select Sa Scale Frequency</label>
                <div className="relative">
                  <select 
                    value={selectedPracticeScale}
                    onChange={(e) => setSelectedPracticeScale(e.target.value)}
                    className="w-full bg-[#0F1115] border border-slate-800 text-slate-300 font-bold p-3 rounded-xl appearance-none cursor-pointer hover:border-purple-500/50 focus:border-[#7C3AED] focus:outline-none"
                  >
                    {NOTE_PITCHES.map((n) => (
                      <option key={n.note} value={n.note}>
                        Sa Pitch: {n.note} ({n.hz.toFixed(1)} Hz)
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="h-4 w-4 text-slate-500 absolute top-4 right-3 transform rotate-45 pointer-events-none" />
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
                    <option value="5">5 Minutes (Warmup)</option>
                    <option value="15">15 Minutes (Standard alankar segment)</option>
                    <option value="30">30 Minutes (Thorough Bandish session)</option>
                    <option value="45">45 Minutes (Full Concert rehearsal)</option>
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
                Start Live Practice Companion Mode
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
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Tune and discover your ideal Sa frequency</span>
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
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Evaluate performance types and raags</span>
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
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Activate sequenced plucked string drone</span>
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
                  Explore 84+ Raags
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal font-sans">Search and review master scale blueprints</span>
              </div>
            </button>

          </div>

          {/* 4. Splitted Rows: Today's classical scale recommendations vs routines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Today's Raga matching the Prahar */}
            <div className="lg:col-span-4 bg-[#151A2E] p-5 rounded-2xl border border-slate-850 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Today's Raga (Prahar Match)</span>
                  <span className="text-[8px] font-mono text-[#FBBF24] uppercase border border-[#FBBF24]/20 px-2 py-0.5 bg-[#FBBF24]/5 rounded-full">Recommended</span>
                </div>

                <div className="space-y-1 pt-1 font-sans">
                  <h3 className="text-xl font-serif font-black text-slate-100">{prahar.raagName}</h3>
                  <p className="text-[10px] font-mono text-[#38BDF8] uppercase font-bold">{prahar.praharNum} • {prahar.timeStr}</p>
                </div>

                <div className="bg-[#0f1115]/50 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-400 font-bold">
                  <span className="text-[8px] text-slate-500 block uppercase mb-1">Scale path (Aroha)</span>
                  <span>{prahar.scale}</span>
                </div>
              </div>

              <div className="pt-6 shrink-0">
                <button
                  onClick={() => handleAction("library")}
                  className="w-full text-center py-2.5 border border-slate-800 hover:border-[#7C3AED] bg-[#0F1115]/60 hover:bg-[#0F1115] text-[#38BDF8] text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
                >
                  Learn Raga Profile Details →
                </button>
              </div>
            </div>

            {/* Today's Riyaz Routine Checklist */}
            <div className="lg:col-span-5 bg-[#151A2E] p-5 rounded-2xl border border-slate-850 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Today's Riyāz Recommendations
                </h3>
                <span className="text-[9.5px] font-mono text-[#38BDF8] font-bold font-bold">4 Tasks</span>
              </div>

              <div className="space-y-2 text-xs">
                
                <div 
                  onClick={() => toggleTodo("kharaj")}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    todayRiyazCompleted.kharaj ? 'bg-[#0f1115]/40 border-slate-900/60 opacity-60' : 'bg-[#0F1115] hover:bg-slate-900/35 border-slate-850'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`font-bold ${todayRiyazCompleted.kharaj ? 'line-through text-slate-500' : 'text-slate-300'}`}>1. Kharaj Riyāz (Bass standard meditation)</span>
                    <span className="text-[9px] font-mono text-slate-500 block">15 minutes on sustained low-Sa drone string</span>
                  </div>
                  <CheckCircle2 className={`h-4.5 w-4.5 ${todayRiyazCompleted.kharaj ? 'text-emerald-500' : 'text-slate-700'}`} />
                </div>

                <div 
                  onClick={() => toggleTodo("alankar")}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    todayRiyazCompleted.alankar ? 'bg-[#0f1115]/40 border-slate-900/60 opacity-60' : 'bg-[#0F1115] hover:bg-slate-900/35 border-slate-850'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`font-bold ${todayRiyazCompleted.alankar ? 'line-through text-slate-500' : 'text-slate-300'}`}>2. Audition Alankāras</span>
                    <span className="text-[9px] font-mono text-slate-550 block font-bold">10 patterns of Sa-Re-Ga-Ma ascension templates</span>
                  </div>
                  <CheckCircle2 className={`h-4.5 w-4.5 ${todayRiyazCompleted.alankar ? 'text-emerald-500' : 'text-slate-700'}`} />
                </div>

                <div 
                  onClick={() => toggleTodo("yaman_meend")}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    todayRiyazCompleted.yaman_meend ? 'bg-[#0f1115]/40 border-slate-900/60 opacity-60' : 'bg-[#0F1115] hover:bg-slate-900/35 border-slate-850'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`font-bold ${todayRiyazCompleted.yaman_meend ? 'line-through text-slate-500' : 'text-slate-300'}`}>3. Meend Stability Calibration</span>
                    <span className="text-[9px] font-mono text-slate-500 block">Glide development between Nishad and Gandhar</span>
                  </div>
                  <CheckCircle2 className={`h-4.5 w-4.5 ${todayRiyazCompleted.yaman_meend ? 'text-emerald-500' : 'text-slate-700'}`} />
                </div>

                <div 
                  onClick={() => toggleTodo("sargam")}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    todayRiyazCompleted.sargam ? 'bg-[#0f1115]/40 border-slate-900/60 opacity-60' : 'bg-[#0F1115] hover:bg-slate-900/35 border-slate-850'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`font-bold ${todayRiyazCompleted.sargam ? 'line-through text-slate-500' : 'text-slate-300'}`}>4. Sargam Geeta Speed Calibration</span>
                    <span className="text-[9px] font-mono text-slate-500 block">Drut laya alignment with teentaal (16 beats)</span>
                  </div>
                  <CheckCircle2 className={`h-4.5 w-4.5 ${todayRiyazCompleted.sargam ? 'text-emerald-500' : 'text-slate-700'}`} />
                </div>

              </div>
            </div>

            {/* Practice Streak Lamp */}
            <div className="lg:col-span-3 bg-[#151A2E] p-5 rounded-2xl border border-slate-850 shadow-lg justify-between flex flex-col min-h-[300px]">
              <div className="space-y-1.5 border-b border-slate-850 pb-2">
                <span className="text-[9px] font-mono text-slate-550 font-bold uppercase tracking-widest block">Practice Streak Panel</span>
                <span className="text-xs text-slate-400 font-sans">Riyāz regularity rating indicator</span>
              </div>

              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="relative">
                  <div className="absolute -top-6 -left-6 h-28 w-28 rounded-full bg-orange-700/10 border border-orange-500/10 blur-xl animate-pulse" />
                  <div className="h-16 w-16 bg-gradient-to-tr from-[#7c3aed] to-orange-700 rounded-b-full rounded-tr-full flex items-center justify-center relative shadow-lg transform rotate-45 border border-purple-800">
                    <div className="h-7 w-3.5 bg-gradient-to-t from-[#FBBF24] to-red-500 rounded-full absolute -top-8 -left-1 text-center shadow-lg transform -rotate-45 animate-bounce" />
                  </div>
                </div>

                <div className="text-center mt-6 z-10 font-sans">
                  <span className="text-3xl font-black font-mono text-orange-400 block tracking-wider">14 Days</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase leading-snug block font-bold">Consistent Riyāz dedication</span>
                </div>
              </div>

              <div className="bg-[#0F1115] px-3 py-2.5 rounded-xl border border-slate-900 text-[10px] text-slate-400 leading-normal flex items-center gap-1.5 font-sans">
                <Flame className="h-4 w-4 text-orange-400 min-w-4 shrink-0" />
                <span>Guru says: "Fourteen continuous sunrises of melodic training clears the internal ear standard."</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
