/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Swara {
  index: number;         // 0 to 11
  name: string;          // e.g. "Sa", "Komal Re", "Shuddha Re"
  symbol: string;        // S, r, R, g, G, m, M, P, d, D, n, N
  isAccidental: boolean; // Flat / Sharp compared to Shuddha
  colorCode: string;     // Color representation for UI
}

export interface Raag {
  id: string;
  name: string;
  thaat: string;
  allowedSwaras: number[]; // Array of swara indices (0-11) allowed
  aroha: string[];         // Notes in ascent, e.g. ["N,", "R", "G", "M", "D", "N", "S'"]
  avaroha: string[];       // Notes in descent
  vadi: number;            // Vadi swara index
  samvadi: number;         // Samvadi swara index
  time: string;            // Traditional time of singing
  mood: string;            // Mood / emotional energy
  description: string;
}

export interface PitchFrame {
  timestamp: number;
  frequency: number;
  swaraIndex: number;
  deviationCents: number;
  isStable: boolean;
  intensity: number;      // Volume/amplitude
}

export interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export interface DigitalTwinState {
  digitalTwinId: string;
  vocalProfile: {
    baseTonicHz: number;
    effectiveRange: {
      lowerBoundaryHz: number;
      upperBoundaryHz: number;
      notation: string;
    };
    timbreStabilityIndex: number; // 0 to 1
    breathHoldingCapacitySeconds: number;
  };
  stylisticFingerprint: {
    preferredRaags: string[];
    meendExecutionFluidity: number; // 0 to 1
    gamakVibratoHzMean: number;     // e.g. 6.2 Hz
  };
  historicalErrorPatterns: {
    habitualFlatNotes: number[];    // Swara indices
    taalDriftTendency: string;      // e.g., "early_entry_on_khali"
    avgLatencyMs: number;
  };
  runningScores: {
    cumulativeSurAccuracy: number;  // percentage
    cumulativeTaalStability: number; // percentage
    riyazStreakDays: number;
  };
}

export interface DiagnosticMetrics {
  timestamp: string;
  testedRaag: string;
  durationSeconds: number;
  overallSurAccuracy: number;
  averageDeviationCents: number;
  meendCount: number;
  gamakCount: number;
  taalAccuracy: number;
  driftMs: number;
  noteCoverage: Record<number, { count: number; stableCount: number; avgDeviation: number }>;
}

export const SWARAS_MAP: Swara[] = [
  { index: 0, name: "Shadaj (Sa)", symbol: "S", isAccidental: false, colorCode: "emerald" },
  { index: 1, name: "Komal Rishabh (re)", symbol: "r", isAccidental: true, colorCode: "amber" },
  { index: 2, name: "Shuddha Rishabh (Re)", symbol: "R", isAccidental: false, colorCode: "sky" },
  { index: 3, name: "Komal Gandhar (ga)", symbol: "g", isAccidental: true, colorCode: "amber" },
  { index: 4, name: "Shuddha Gandhar (Ga)", symbol: "G", isAccidental: false, colorCode: "indigo" },
  { index: 5, name: "Shuddha Madhyam (ma)", symbol: "m", isAccidental: false, colorCode: "sky" },
  { index: 6, name: "Tivra Madhyam (Ma)", symbol: "M", isAccidental: true, colorCode: "rose" },
  { index: 7, name: "Pancham (Pa)", symbol: "P", isAccidental: false, colorCode: "emerald" },
  { index: 8, name: "Komal Dhaivat (dha)", symbol: "d", isAccidental: true, colorCode: "amber" },
  { index: 9, name: "Shuddha Dhaivat (Dha)", symbol: "D", isAccidental: false, colorCode: "sky" },
  { index: 10, name: "Komal Rishabh (ni)", symbol: "n", isAccidental: true, colorCode: "amber" },
  { index: 11, name: "Shuddha Nishad (Ni)", symbol: "N", isAccidental: false, colorCode: "indigo" }
];

export const RAAGS: Raag[] = [
  {
    id: "yaman",
    name: "Raag Yaman",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 6, 7, 9, 11], // Sa, Re, Ga, Tivra Ma, Pa, Dha, Ni
    aroha: ["N,", "R", "G", "M", "D", "N", "S'"], // Note: Tivra M, omits Sa and Pa in ascent usually
    avaroha: ["S'", "N", "D", "P", "M", "G", "R", "S"],
    vadi: 4,     // Ga
    samvadi: 11, // Ni
    time: "Evening (6 PM - 9 PM)",
    mood: "Devotional, peaceful, serene, romantic",
    description: "One of the most fundamental evening melodies of Hindustani Classical Music. Features the sharp fourth (Tivra Ma) and natural shuddha notes elsewhere. Avoids Sa and Pa in initial ascent patterns."
  },
  {
    id: "bhairav",
    name: "Raag Bhairav",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 4, 5, 7, 8, 11], // Sa, Komal Re, Ga, Ma, Pa, Komal Dha, Ni
    aroha: ["S", "r", "G", "m", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "m", "G", "r", "S"],
    vadi: 8,     // Komal Dha
    samvadi: 1,  // Komal Re
    time: "Early Morning (4 AM - 6 AM)",
    mood: "Solemn, deeply meditative, prayerful, divine",
    description: "The ultimate early morning raga. Signature characteristics are the heavy oscillation (Andolan) with microtonal accuracy on Komal Re and Komal Dha, evoking a pure, sacred sunrise vibe."
  },
  {
    id: "bageshree",
    name: "Raag Bageshree",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 3, 5, 7, 9, 10], // Sa, Re, Komal Ga, Ma, Pa, Dha, Komal Ni
    aroha: ["S", "G", "m", "D", "n", "S'"], // Omits Re and Pa in typical ascent
    avaroha: ["S'", "n", "D", "m", "P", "D", "m", "g", "R", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Late Night (9 PM - 12 AM)",
    mood: "Elegiac, longing, quiet romance, sweet melancholia",
    description: "A gorgeous late-night melody depicting the sweet sorrow of waiting for the beloved. Madhyam (Ma) is heavily highlighted and serves as the emotional anchor."
  },
  {
    id: "darbari",
    name: "Raag Darbari Kanada",
    thaat: "Asavari",
    allowedSwaras: [0, 2, 3, 5, 7, 8, 10], // Sa, Re, Komal Ga, Ma, Pa, Komal Dha, Komal Ni
    aroha: ["S", "R", "g", "m", "P", "d", "n", "S'"],
    avaroha: ["S'", "d", "n", "P", "m", "g", "R", "S"],
    vadi: 2,     // Re
    samvadi: 7,  // Pa
    time: "Midnight (12 AM - 3 AM)",
    mood: "Majestic, heavy, profound, deeply emotional, royal",
    description: "A grave and majestic raga written by Tansen for Emperor Akbar's court. Requires extremely slow, controlled pitch glides (Meend) and heavy, slow oscillations (Andolan) on Komal Ga and Komal Dha."
  },
  {
    id: "malkauns",
    name: "Raag Malkauns",
    thaat: "Bhairavi",
    allowedSwaras: [0, 3, 5, 8, 10], // Sa, Komal Ga, Ma, Komal Dha, Komal Ni (audav-audav - omits Re and Pa completely)
    aroha: ["S", "g", "m", "d", "n", "S'"],
    avaroha: ["S'", "n", "d", "m", "g", "s"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Late Night (12 AM - 3 AM)",
    mood: "Severely meditative, mystical, introspective, intense",
    description: "An ancient, highly meditative raga played purely with five notes, omitting Re and Pa. Its powerful, sober mood is perfect for deep spiritual focus."
  },
  {
    id: "bhimpalasi",
    name: "Raag Bhimpalasi",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 3, 5, 7, 9, 10], // Sa, Re, Komal Ga, Ma, Pa, Dha, Komal Ni
    aroha: ["n,", "S", "g", "m", "P", "n", "S'"], // Omits Re and Dha in ascent
    avaroha: ["S'", "n", "D", "P", "m", "g", "R", "S"], // Complete in descent
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Afternoon (3 PM - 6 PM)",
    mood: "Yearning, passionate warmth, peaceful sweetness",
    description: "A beautiful raga for the late afternoon hours. Features heavy emotional rests on Madhyam and Pancham. Incredibly soothing and warm."
  },
  {
    id: "bilawal",
    name: "Raag Alhaiya Bilawal",
    thaat: "Bilawal",
    allowedSwaras: [0, 2, 4, 5, 7, 9, 10, 11], // All natural notes + weak Komal Ni
    aroha: ["S", "G", "R", "G", "m", "P", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "D", "n", "D", "P", "m", "G", "R", "S"],
    vadi: 9,     // Dha
    samvadi: 4,  // Ga
    time: "Morning (6 AM - 9 AM)",
    mood: "Bright, peaceful clarity, morning joy, auspicious",
    description: "The primary representative of the Bilawal Thaat (Major Scale equivalent). Famed for its pure, bright positive morning energy and structured light classical presence."
  },
  {
    id: "bhairavi",
    name: "Raag Bhairavi",
    thaat: "Bhairavi",
    allowedSwaras: [0, 1, 3, 5, 7, 8, 10], // Sa, r, g, m, P, d, n
    aroha: ["S", "r", "g", "m", "P", "d", "n", "S'"],
    avaroha: ["S'", "n", "d", "P", "m", "g", "r", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Mornings / Concluding Piece",
    mood: "Complete surrender, deep devotion, quiet peace",
    description: "The ultimate 'Queen of Melodies'. Belonging to Bhairavi Thaat, it uses all 4 flat accidentals (re, ga, dha, ni). Historically sung to conclude Hindustani classical concerts with emotional completeness."
  },
  {
    id: "khamaj",
    name: "Raag Khamaj",
    thaat: "Khamaj",
    allowedSwaras: [0, 2, 4, 5, 7, 9, 10, 11], // Uses both Ni (Shuddha in ascent, Komal in descent)
    aroha: ["S", "G", "m", "P", "D", "N", "S'"], // Omits Re in ascent
    avaroha: ["S'", "n", "D", "P", "m", "G", "R", "S"],
    vadi: 4,     // Ga
    samvadi: 11, // Ni
    time: "Late Evening (9 PM - 12 AM)",
    mood: "Romantic, playful, light devotional, thumri-oriented",
    description: "A mesmerizing and playful evening melody. Employs Shuddha Nishad in ascent and Komal Nishad in descent, allowing singers to construct elegant, emotional romantic Thumris."
  },
  {
    id: "todi",
    name: "Raag Miya ki Todi",
    thaat: "Todi",
    allowedSwaras: [0, 1, 3, 6, 7, 8, 11], // Sa, r, g, M (Tivra), P (very weak), d, N (Shuddha)
    aroha: ["S", "r", "g", "M", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "g", "r", "S"],
    vadi: 8,     // Komal Dha
    samvadi: 3,  // Komal Ga
    time: "Morning (9 AM - 12 PM)",
    mood: "Deep melancholy, severe spiritual pain, prayerful",
    description: "An mathematically precise morning masterpiece. Its usage of Komal Re, Komal Ga, and Tivra Madhyam creates a complex web of deep spiritual longing and devotional intensity."
  },
  {
    id: "marwa",
    name: "Raag Marwa",
    thaat: "Marwa",
    allowedSwaras: [0, 1, 4, 6, 9, 11], // Sa, Komal Re, Ga, Tivra Ma, Dha, Ni (Omits Pa completely)
    aroha: ["S", "r", "G", "M", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "M", "G", "r", "S"],
    vadi: 1,     // Komal Re
    samvadi: 9,  // Shuddha Dha
    time: "Sunset Twilight (4 PM - 6 PM)",
    mood: "Anxious anticipation, majestic awe, transitional tension",
    description: "A sunset raga omitting Pancham. The tense relation between a heavy Komal Rishabh and a majestic Shuddha Dhaivat evokes the cinematic color-shifts of sunset clouds."
  },
  {
    id: "poorvi",
    name: "Raag Poorvi",
    thaat: "Poorvi",
    allowedSwaras: [0, 1, 4, 6, 7, 8, 11], // Sa, Komal Re, Shuddha Ga, Tivra Ma, Pa, Komal Dha, Shuddha Ni
    aroha: ["S", "r", "G", "M", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "G", "r", "S"],
    vadi: 4,     // Ga
    samvadi: 11, // Ni
    time: "Evening Twilight (6 PM - 8 PM)",
    mood: "Devotional, serious, contemplative, meditative",
    description: "Belonging to the Sandhiprakash (twilight bridge) category, Poorvi is heavy and deeply meditative. It merges flat Rishabh/Dhaivat with Tivra Madhyam for a mystical effect."
  },
  {
    id: "sarang",
    name: "Raag Vrindavani Sarang",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 5, 7, 10, 11], // Sa, Re, Ma, Pa, Komal Ni, Shuddha Ni (Omits Ga & Dha completely)
    aroha: ["S", "R", "m", "P", "N", "S'"], 
    avaroha: ["S'", "n", "P", "m", "R", "S"],
    vadi: 2,     // Re
    samvadi: 7,  // Pa
    time: "Midday (12 PM - 3 PM)",
    mood: "Refreshing, energetic, bright, welcoming spring/rains",
    description: "A pristine summer rain melody. By skipping Ga and Dha and introducing Shuddha Nishad in ascent and Komal Nishad in descent, it evokes beautiful coolness and joyful energy."
  },
  {
    id: "ahirbhairav",
    name: "Raag Ahir Bhairav",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 4, 5, 7, 9, 10], // Sa, Komal Re, Ga, Ma, Pa, Dha, Komal Ni
    aroha: ["S", "r", "G", "m", "P", "D", "n", "S'"],
    avaroha: ["S'", "n", "D", "P", "m", "G", "r", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Early Morning (4 AM - 6 AM)",
    mood: "Calm dawn devotion, sunrise warmth, sweet introspection",
    description: "A highly acclaimed sunrise blend merging the solemn structures of Bhairav (flat Rishabh) with the sweet visual contours of Raag Kafi (flat Nishad). Highly meditative."
  },
  {
    id: "jaunpuri",
    name: "Raag Jaunpuri",
    thaat: "Asavari",
    allowedSwaras: [0, 2, 3, 5, 7, 8, 10], // Sa, Re, Komal Ga, Ma, Pa, Komal Dha, Komal Ni
    aroha: ["S", "R", "m", "P", "d", "n", "S'"], // Omits Ga in ascent
    avaroha: ["S'", "n", "d", "P", "m", "g", "R", "S"],
    vadi: 8,     // Komal Dha
    samvadi: 3,  // Komal Ga
    time: "Late Morning (9 AM - 12 PM)",
    mood: "Melodious longing, majestic resolve, sweetness",
    description: "An elegant morning raga belonging to the Asavari Thaat. It has a beautiful, soaring character in the upper pitch register and is beloved for emotional classical compositions."
  },
  {
    id: "shuddhakalyan",
    name: "Raag Shuddha Kalyan",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 6, 7, 9, 11], // Kalyan notes with pentatonic ascent
    aroha: ["S", "R", "G", "P", "D", "S'"], // Omits Ma and Ni in ascent
    avaroha: ["S'", "N", "D", "P", "M", "G", "R", "S"], // Complete in descent
    vadi: 4,     // Ga
    samvadi: 9,  // Dha
    time: "First Part of Night (8 PM - 10 PM)",
    mood: "Serene majesty, blessing-like calmness, high devotion",
    description: "An elegant hybrid blending the simple pentatonic charm of Raag Bhupali in ascent with the complete majestic microtonal scale of Yaman in descent."
  },
  {
    id: "bhupali",
    name: "Raag Bhupali",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 7, 9], // Sa, Re, Ga, Pa, Dha (completely pentatonic - Audav)
    aroha: ["S", "R", "G", "P", "D", "S'"],
    avaroha: ["S'", "D", "P", "G", "R", "S"],
    vadi: 4,     // Ga
    samvadi: 9,  // Dha
    time: "Evening (7 PM - 10 PM)",
    mood: "Bright joy, pristine clarity, positive, sweet devotion",
    description: "One of the most popular pentatonic melodies. Its pure natural intervals are simple, highly resonant, and bring a feeling of peaceful spiritual illumination to the night."
  },
  {
    id: "hindol",
    name: "Raag Hindol",
    thaat: "Kalyan",
    allowedSwaras: [0, 4, 6, 9, 11], // Sa, Ga, Tivra Ma, Dha, Ni (Omits Re and Pa completely)
    aroha: ["S", "G", "M", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "M", "G", "S"],
    vadi: 9,     // Dha
    samvadi: 4,  // Ga
    time: "Spring Mornings (6 AM - 9 AM)",
    mood: "Ethereal, spring cheer, celestial play, lightness",
    description: "An ancient, highly majestic spring-morning raga. By omitting Rishabh and Pancham, its jumping, floating movements sound celestial, ethereal, and extremely bright."
  },
  {
    id: "kedar",
    name: "Raag Kedar",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 5, 6, 7, 9, 11], // Uses both Madhyams (m & M)
    aroha: ["S", "m", "G", "P", "M", "P", "D", "S'"], // Highly complex non-linear ascent
    avaroha: ["S'", "N", "D", "P", "M", "P", "m", "G", "R", "S"],
    vadi: 5,     // Shuddha Ma
    samvadi: 0,  // Sa
    time: "Late Night (9 PM - 12 AM)",
    mood: "Elegance, dynamic devotion, playful majesty, divine",
    description: "Beloved as a key representation of Lord Shiva's energy. It is characterized by highly intricate, non-linear (Vakra) movements and the beautifully alternating play of both Madhyams."
  },
  {
    id: "kalavati",
    name: "Raag Kalavati",
    thaat: "Khamaj",
    allowedSwaras: [0, 4, 7, 9, 10], // Sa, Ga, Pa, Dha, n (Pentatonic)
    aroha: ["S", "G", "P", "D", "n", "S'"],
    avaroha: ["S'", "n", "D", "P", "G", "P", "G", "S"],
    vadi: 7,     // Pa
    samvadi: 0,  // Sa
    time: "Midnight (12 AM - 3 AM)",
    mood: "Ecstatic happiness, hypnotic nocturnal depth, longing",
    description: "A highly expressive and romantic five-note nighttime scale that uses Komal Nishad to construct deep, flowing glisssandos and hypnotic midnight loops."
  }
];
