/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Raag } from '../types';

export interface ComprehensiveRaag extends Raag {
  jati: string;
}

/**
 * Raag library: basic facts for every raag in the app (thaat, swaras,
 * aroh/avaroh, vadi/samvadi, time, jati). The swara lists drive the
 * analysis ("swaras outside the raag") and the tanpura's first string.
 *
 * Fuller grammar (pakad, chalan, nyas, similar raags) lives in
 * raagDetails.ts for the raags where it has been written. All entries are
 * awaiting review by a guru; see docs/raag-review.md.
 */
export const RAAG_LIST: ComprehensiveRaag[] = [
  // --- KALYAN THAAT ---
  {
    id: "yaman",
    name: "Raag Yaman (Kalyan)",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 6, 7, 9, 11],
    aroha: ["N,", "R", "G", "M", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "M", "G", "R", "S"],
    vadi: 4,     // Ga
    samvadi: 11, // Ni
    time: "Evening (6 PM - 9 PM)",
    mood: "Devotional, peaceful, serene, romantic",
    jati: "Sampurna-Sampurna",
    description: "Fundamental evening melody with Tivra Ma."
  },
  {
    id: "bhupali",
    name: "Raag Bhupali",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 7, 9],
    aroha: ["S", "R", "G", "P", "D", "S'"],
    avaroha: ["S'", "D", "P", "G", "R", "S"],
    vadi: 4,     // Ga
    samvadi: 9,  // Dha
    time: "First Part of Night (7 PM - 10 PM)",
    mood: "Pure joy, pristine clarity, deep resonance",
    jati: "Audav-Audav",
    description: "Incomparable 5-note pentatonic scale expressing immense divine joy."
  },
  {
    id: "shuddhakalyan",
    name: "Raag Shuddha Kalyan",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 6, 7, 9, 11],
    aroha: ["S", "R", "G", "P", "D", "S'"],
    avaroha: ["S'", "N", "D", "P", "M", "G", "R", "S"],
    vadi: 4,     // Ga
    samvadi: 9,  // Dha
    time: "Night (8 PM - 11 PM)",
    mood: "Serene majesty, blessing, spiritual peace",
    jati: "Audav-Sampurna",
    description: "Combines Bhupali in ascent with Yaman in descent."
  },
  {
    id: "hindol",
    name: "Raag Hindol",
    thaat: "Kalyan",
    allowedSwaras: [0, 4, 6, 9, 11],
    aroha: ["S", "G", "M", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "M", "G", "S"],
    vadi: 9,     // Dha
    samvadi: 4,  // Ga
    time: "Spring Morning (6 AM - 9 AM)",
    mood: "Ethereal, light cheer, divine sunrise",
    jati: "Audav-Audav",
    description: "Ancient raga of spring. Skips Rikhab and Pancham."
  },
  {
    id: "kedar",
    name: "Raag Kedar",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 5, 6, 7, 9, 11],
    aroha: ["S", "m", "G", "P", "M", "P", "D", "S'"],
    avaroha: ["S'", "N", "D", "P", "M", "P", "m", "G", "R", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Late Night (9 PM - 12 AM)",
    mood: "Contemplative beauty, bright devotion, Shiva's energy",
    jati: "Shadav-Sampurna",
    description: "Playful complexity using both Shuddha and Tivra Madhyam."
  },
  {
    id: "hansasdhwani",
    name: "Raag Hansadhwani",
    thaat: "Bilawal",
    allowedSwaras: [0, 2, 4, 7, 11],
    aroha: ["S", "R", "G", "P", "N", "S'"],
    avaroha: ["S'", "N", "P", "G", "R", "S"],
    vadi: 2,     // Re
    samvadi: 7,  // Pa
    time: "Evening (6 PM - 9 PM)",
    mood: "Bright, auspicious energy, dynamic and cheerful",
    jati: "Audav-Audav",
    description: "A popular Carnatic import meaning 'the swan's voice'. Highly resonant."
  },
  {
    id: "shyamkalyan",
    name: "Raag Shyam Kalyan",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 5, 6, 7, 9, 11],
    aroha: ["S", "R", "M", "P", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "M", "P", "G", "m", "R", "S"],
    vadi: 7,     // Pa
    samvadi: 2,  // Sa (or Re)
    time: "Late Evening (6 PM - 9 PM)",
    mood: "Gentle warmth, contemplative devotion",
    jati: "Audav-Sampurna",
    description: "Features a beautiful transition between Shuddha and Tivra Madhyam."
  },
  {
    id: "chayanat",
    name: "Raag Chayanat",
    thaat: "Kalyan",
    allowedSwaras: [0, 2, 4, 5, 6, 7, 9, 11],
    aroha: ["S", "R", "G", "M", "P", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "M", "G", "R", "S"],
    vadi: 7,
    samvadi: 2,
    time: "Night (9 PM - 12 AM)",
    mood: "Cheerful, romantic and graceful",
    jati: "Sampurna-Sampurna",
    description: "Intricate glide patterns with heavy emphasis on Re and Pa."
  },

  // --- BHAIRAV THAAT ---
  {
    id: "bhairav",
    name: "Raag Bhairav",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 4, 5, 7, 8, 11],
    aroha: ["S", "r", "G", "m", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "m", "G", "r", "S"],
    vadi: 8,     // Komal Dha
    samvadi: 1,  // Komal Re
    time: "Morning (4 AM - 6 AM)",
    mood: "Solemn, meditative, prayerful, divine",
    jati: "Sampurna-Sampurna",
    description: "The ultimate early morning sunrise raga with oscillations on Komal Re and Komal Dha."
  },
  {
    id: "ahirbhairav",
    name: "Raag Ahir Bhairav",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 4, 5, 7, 9, 10],
    aroha: ["S", "r", "G", "m", "P", "D", "n", "S'"],
    avaroha: ["S'", "n", "D", "P", "m", "G", "r", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Early Morning (4 AM - 6 AM)",
    mood: "Calm dawn devotion, sunrise warmth, deep peace",
    jati: "Sampurna-Sampurna",
    description: "Sunrise blend of Bhairav (flat Ri) and Kafi (flat Ni). Incredibly soothing."
  },
  {
    id: "natbhairav",
    name: "Raag Nat Bhairav",
    thaat: "Bhairav",
    allowedSwaras: [0, 2, 4, 5, 7, 8, 11],
    aroha: ["S", "R", "G", "m", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "m", "G", "R", "S"],
    vadi: 5,
    samvadi: 0,
    time: "Morning (6 AM - 9 AM)",
    mood: "Graceful, pure, active intelligence",
    jati: "Sampurna-Sampurna",
    description: "Uses a Shuddha Rishabh paired with the Komal Dhaivat of Bhairav."
  },
  {
    id: "kalingada",
    name: "Raag Kalingada",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 4, 5, 7, 8, 11],
    aroha: ["S", "r", "G", "m", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "m", "G", "r", "S"],
    vadi: 4,
    samvadi: 11,
    time: "Late Night / Dawn",
    mood: "Intense, dramatic and romantic",
    jati: "Sampurna-Sampurna",
    description: "Similar notes to Bhairav but executed with less oscillation and standard steps."
  },
  {
    id: "anandbhairav",
    name: "Raag Anand Bhairav",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 4, 5, 7, 9, 11],
    aroha: ["S", "G", "m", "P", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "m", "G", "r", "S"],
    vadi: 5,
    samvadi: 0,
    time: "Morning (6 AM - 9 AM)",
    mood: "Auspicious joy, pleasant awakening",
    jati: "Shadav-Sampurna",
    description: "Introduces Shuddha Dhaivat for a lighter, joyous feel."
  },
  {
    id: "gunakri",
    name: "Raag Gunakri",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 5, 7, 8],
    aroha: ["S", "r", "m", "P", "d", "S'"],
    avaroha: ["S'", "d", "P", "m", "r", "S"],
    vadi: 1,
    samvadi: 8,
    time: "Early Morning (4 AM - 6 AM)",
    mood: "Primal sorrow, ancient prayerfulness",
    jati: "Audav-Audav",
    description: "Extremely serious pentatonic morning raga omitting Ga and Ni."
  },
  {
    id: "ramkali",
    name: "Raag Ramkali",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 4, 5, 6, 7, 8, 10, 11],
    aroha: ["S", "G", "m", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "P", "d", "n", "d", "P", "m", "G", "r", "S"],
    vadi: 7,
    samvadi: 0,
    time: "Sunrise (6 AM - 8 AM)",
    mood: "Pious sorrow, intense emotional dawn",
    jati: "Sampurna-Sampurna",
    description: "Uses both Madhyams and both Nishads to weave deep pathways."
  },
  {
    id: "jogia",
    name: "Raag Jogia",
    thaat: "Bhairav",
    allowedSwaras: [0, 1, 5, 7, 8, 10],
    aroha: ["S", "r", "m", "P", "d", "S'"],
    avaroha: ["S'", "n", "d", "P", "m", "r", "S"],
    vadi: 0,
    samvadi: 5,
    time: "Dawn (4 AM - 6 AM)",
    mood: "Renunciation, spiritual asceticism",
    jati: "Audav-Shadav",
    description: "Highly devotional raga evoking images of saints and temple chants."
  },

  // --- KAFI THAAT ---
  {
    id: "bageshree",
    name: "Raag Bageshree",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 3, 5, 7, 9, 10],
    aroha: ["S", "g", "m", "D", "n", "S'"],
    avaroha: ["S'", "n", "D", "m", "P", "D", "m", "g", "R", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Late Night (9 PM - 12 AM)",
    mood: "Longing, sweet melancholy, romance",
    jati: "Audav-Sampurna",
    description: "Deep elegant evening raga symbolizing wait and sweet sorrow."
  },
  {
    id: "bhimpalasi",
    name: "Raag Bhimpalasi",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 3, 5, 7, 9, 10],
    aroha: ["n,", "S", "g", "m", "P", "n", "S'"],
    avaroha: ["S'", "n", "D", "P", "m", "g", "R", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Mid-Afternoon (3 PM - 6 PM)",
    mood: "Quiet passion, emotional soothing, warmth",
    jati: "Audav-Sampurna",
    description: "Late afternoon masterpiece with heavy emotional focus on Ma and Pa."
  },
  {
    id: "kafi",
    name: "Raag Kafi",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 3, 5, 7, 9, 10],
    aroha: ["S", "R", "g", "m", "P", "D", "n", "S'"],
    avaroha: ["S'", "n", "D", "P", "m", "g", "R", "S"],
    vadi: 7,
    samvadi: 2,
    time: "Late Evening / Holi Festival",
    mood: "Playful cheer, joyful romanticism",
    jati: "Sampurna-Sampurna",
    description: "Representative of the Kafi Thaat. Famed for its spring colors and folk elements."
  },
  {
    id: "dhanashree",
    name: "Raag Dhanashree",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 3, 5, 7, 9, 10],
    aroha: ["S", "g", "m", "P", "n", "S'"],
    avaroha: ["S'", "n", "D", "P", "m", "g", "R", "S"],
    vadi: 7,
    samvadi: 2,
    time: "Afternoon (1 PM - 4 PM)",
    mood: "Peaceful satisfaction, divine grace",
    jati: "Audav-Sampurna",
    description: "An incredibly sweet, traditional raga of afternoon prayers."
  },
  {
    id: "patdeep",
    name: "Raag Patdeep",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 3, 5, 7, 9, 11],
    aroha: ["S", "g", "m", "P", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "m", "g", "R", "S"],
    vadi: 7,
    samvadi: 2,
    time: "Afternoon (3 PM - 6 PM)",
    mood: "Earnest appeal, sweet sadness",
    jati: "Audav-Sampurna",
    description: "Uses Komal Ga but Shuddha Nishad, creating a uniquely bright yet longing mood."
  },
  {
    id: "vrindavanisarang",
    name: "Raag Vrindavani Sarang",
    thaat: "Kafi",
    allowedSwaras: [0, 2, 5, 7, 10, 11],
    aroha: ["S", "R", "m", "P", "N", "S'"],
    avaroha: ["S'", "n", "P", "m", "R", "S"],
    vadi: 2,     // Re
    samvadi: 7,  // Pa
    time: "Midday (12 PM - 3 PM)",
    mood: "Cooling freshness, joyous summer rain",
    jati: "Audav-Audav",
    description: "Deploys both Nishads (Shuddha in ascent, Komal in descent) and deletes Ga/Dha."
  },
  {
    id: "pilu",
    name: "Raag Pilu",
    thaat: "Kafi",
    allowedSwaras: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aroha: ["S", "g", "G", "m", "P", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "m", "g", "R", "S"],
    vadi: 4,
    samvadi: 11,
    time: "Afternoon (3 PM - 6 PM)",
    mood: "Light, descriptive, pastoral romance",
    jati: "Mixed/Sankirna",
    description: "A semi-classical genius raga that allows almost all 12 semitones to express fluid beauty."
  },

  // --- ASAVARI THAAT ---
  {
    id: "darbari",
    name: "Raag Darbari Kanada",
    thaat: "Asavari",
    allowedSwaras: [0, 2, 3, 5, 7, 8, 10],
    aroha: ["S", "R", "g", "m", "P", "d", "n", "S'"],
    avaroha: ["S'", "d", "n", "P", "m", "g", "R", "S"],
    vadi: 2,     // Re
    samvadi: 7,  // Pa
    time: "Midnight (12 AM - 3 AM)",
    mood: "Imperial, royal, profound, deeply epic",
    jati: "Sampurna-Sampurna",
    description: "Grave and majestic courtyard masterwork utilizing deep Meend glides on flat keys."
  },
  {
    id: "jaunpuri",
    name: "Raag Jaunpuri",
    thaat: "Asavari",
    allowedSwaras: [0, 2, 3, 5, 7, 8, 10],
    aroha: ["S", "R", "m", "P", "d", "n", "S'"],
    avaroha: ["S'", "n", "d", "P", "m", "g", "R", "S"],
    vadi: 8,     // Komal Dha
    samvadi: 3,  // Komal Ga
    time: "Late Morning (9 AM - 12 PM)",
    mood: "Soaring longing, majestic resolve",
    jati: "Shadav-Sampurna",
    description: "Skips Ga in ascending lines. Beloved for romantic morning compositions."
  },
  {
    id: "asavari",
    name: "Raag Asavari",
    thaat: "Asavari",
    allowedSwaras: [0, 2, 3, 5, 7, 8, 10],
    aroha: ["S", "R", "m", "P", "d", "S'"],
    avaroha: ["S'", "n", "d", "P", "m", "g", "R", "S"],
    vadi: 8,
    samvadi: 3,
    time: "Morning (9 AM - 11 AM)",
    mood: "Solitude, renunciation, tragic beauty",
    jati: "Audav-Sampurna",
    description: "The primary scale representative. Gentle, devotional yet deeply somber."
  },
  {
    id: "desi",
    name: "Raag Desi",
    thaat: "Asavari",
    allowedSwaras: [0, 2, 3, 5, 7, 8, 10, 11],
    aroha: ["S", "R", "m", "P", "d", "N", "S'"],
    avaroha: ["S'", "n", "d", "P", "m", "g", "R", "S"],
    vadi: 7,
    samvadi: 2,
    time: "Late Morning (10 AM - 12 PM)",
    mood: "Nostalgic pleading, highly vocal",
    jati: "Shadav-Sampurna",
    description: "Features curved, non-linear sequences that create rich vocal challenges."
  },
  {
    id: "adana",
    name: "Raag Adana",
    thaat: "Asavari",
    allowedSwaras: [0, 2, 3, 5, 7, 8, 10],
    aroha: ["S", "R", "m", "P", "n", "P", "S'"],
    avaroha: ["S'", "d", "n", "P", "m", "g", "R", "S"],
    vadi: 0,
    samvadi: 7,
    time: "Midnight (12 AM - 3 AM)",
    mood: "Chivalrous, fast energy, bright midnight",
    jati: "Audav-Sampurna",
    description: "A sister of Darbari but sung in a much faster tempo with a heroic accent."
  },

  // --- BHAIRAVI THAAT ---
  {
    id: "bhairavi",
    name: "Raag Bhairavi",
    thaat: "Bhairavi",
    allowedSwaras: [0, 1, 3, 5, 7, 8, 10],
    aroha: ["S", "r", "g", "m", "P", "d", "n", "S'"],
    avaroha: ["S'", "n", "d", "P", "m", "g", "r", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Morning / Concert Closing",
    mood: "Surrender, complete devotion, divine serenity",
    jati: "Sampurna-Sampurna",
    description: "The supreme queen of Hindustani melodies. Uses all four flat notes."
  },
  {
    id: "malkauns",
    name: "Raag Malkauns",
    thaat: "Bhairavi",
    allowedSwaras: [0, 3, 5, 8, 10],
    aroha: ["S", "g", "m", "d", "n", "S'"],
    avaroha: ["S'", "n", "d", "m", "g", "S"],
    vadi: 5,     // Ma
    samvadi: 0,  // Sa
    time: "Midnight (12 AM - 3 AM)",
    mood: "Mystical, deeply gravity-bound, intense focus",
    jati: "Audav-Audav",
    description: "Ancient 5-note pentatonic scale with majestic spirituality. Completely omits Re and Pa."
  },
  {
    id: "bilaskhanitodi",
    name: "Raag Bilaskhani Todi",
    thaat: "Bhairavi",
    allowedSwaras: [0, 1, 3, 5, 7, 8, 10],
    aroha: ["S", "r", "g", "P", "d", "S'"],
    avaroha: ["S'", "n", "d", "P", "m", "g", "r", "S"],
    vadi: 3,
    samvadi: 8,
    time: "Morning (6 AM - 9 AM)",
    mood: "Unbearable grief, tearful devotion",
    jati: "Audav-Sampurna",
    description: "Created by Bilas Khan at the funeral of his father Tansen. Singularly tragic."
  },
  {
    id: "bhupaltodi",
    name: "Raag Bhupal Todi",
    thaat: "Bhairavi",
    allowedSwaras: [0, 1, 3, 7, 8],
    aroha: ["S", "r", "g", "P", "d", "S'"],
    avaroha: ["S'", "d", "P", "g", "r", "S"],
    vadi: 3,
    samvadi: 8,
    time: "Early Morning (4 AM - 6 AM)",
    mood: "Extreme solitude, spiritual renunciation",
    jati: "Audav-Audav",
    description: "A pentatonic morning melody that replaces Bhupali's bright intervals with flat keys."
  },

  // --- BILAWAL THAAT ---
  {
    id: "bilawal",
    name: "Raag Alhaiya Bilawal",
    thaat: "Bilawal",
    allowedSwaras: [0, 2, 4, 5, 7, 9, 10, 11],
    aroha: ["S", "G", "R", "G", "m", "P", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "D", "n", "D", "P", "m", "G", "R", "S"],
    vadi: 9,     // Dha
    samvadi: 4,  // Ga
    time: "Morning (6 AM - 9 AM)",
    mood: "Bright, peaceful clarity, morning joy",
    jati: "Sampurna-Sampurna",
    description: "Representative scale of pure natural shuddha keys. Delightfully positive."
  },
  {
    id: "devgiri",
    name: "Raag Devgiri Bilawal",
    thaat: "Bilawal",
    allowedSwaras: [0, 2, 4, 5, 7, 9, 11],
    aroha: ["S", "R", "G", "m", "P", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "P", "m", "G", "R", "S"],
    vadi: 0,
    samvadi: 7,
    time: "Morning (7 AM - 10 AM)",
    mood: "Sweet clarity, active, morning prayer",
    jati: "Sampurna-Sampurna",
    description: "Pure natural scale with specialized emphasis on Sa and Pa."
  },

  // --- KHAMAJ THAAT ---
  {
    id: "khamaj",
    name: "Raag Khamaj",
    thaat: "Khamaj",
    allowedSwaras: [0, 2, 4, 5, 7, 9, 10, 11],
    aroha: ["S", "G", "m", "P", "D", "N", "S'"],
    avaroha: ["S'", "n", "D", "P", "m", "G", "R", "S"],
    vadi: 4,     // Ga
    samvadi: 11, // Ni
    time: "Late Evening (9 PM - 12 AM)",
    mood: "Playful romance, thumri focus",
    jati: "Shadav-Sampurna",
    description: "Uses Shuddha Ni in ascent and Komal Ni in descent. Wonderfully expressive."
  },
  {
    id: "kalavati",
    name: "Raag Kalavati",
    thaat: "Khamaj",
    allowedSwaras: [0, 4, 7, 9, 10],
    aroha: ["S", "G", "P", "D", "n", "S'"],
    avaroha: ["S'", "n", "D", "P", "G", "P", "G", "S"],
    vadi: 7,     // Pa
    samvadi: 0,  // Sa
    time: "Midnight (12 AM - 3 AM)",
    mood: "Nocturnal ecstasy, sweet longing",
    jati: "Audav-Audav",
    description: "Pentatonic midnight melody. Emphasizes flowing glide movements."
  },
  {
    id: "jinjhoti",
    name: "Raag Jinjhoti",
    thaat: "Khamaj",
    allowedSwaras: [0, 2, 4, 5, 7, 9, 10, 11],
    aroha: ["S", "R", "G", "m", "P", "D", "N", "S'"],
    avaroha: ["S'", "n", "D", "P", "m", "G", "R", "S"],
    vadi: 2,
    samvadi: 7,
    time: "Night (9 PM - 12 AM)",
    mood: "Sweet devotion, narrative, elegant",
    jati: "Sampurna-Sampurna",
    description: "Beloved instrumental raga that has massive sweet vocal appeal."
  },
  {
    id: "rageshree",
    name: "Raag Rageshree",
    thaat: "Khamaj",
    allowedSwaras: [0, 2, 4, 5, 9, 10],
    aroha: ["S", "G", "m", "D", "n", "S'"],
    avaroha: ["S'", "n", "D", "m", "G", "R", "S"],
    vadi: 4,
    samvadi: 10, // komal Ni
    time: "Late Night (10 PM - 1 AM)",
    mood: "Intimate confession, deep romance",
    jati: "Audav-Shadav",
    description: "Similar to Bageshree but features Shuddha Gandhar (Ga) for an inviting sweet color."
  },

  // --- TODI THAAT ---
  {
    id: "todi",
    name: "Raag Miya ki Todi",
    thaat: "Todi",
    allowedSwaras: [0, 1, 3, 6, 7, 8, 11],
    aroha: ["S", "r", "g", "M", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "g", "r", "S"],
    vadi: 8,     // Komal Dha
    samvadi: 3,  // Komal Ga
    time: "Morning (9 AM - 12 PM)",
    mood: "Melancholy, supreme spiritual yearning",
    jati: "Sampurna-Sampurna",
    description: "Exquisite and mathematically complex raga utilizing tense flat-sharp structures."
  },
  {
    id: "multani",
    name: "Raag Multani",
    thaat: "Todi",
    allowedSwaras: [0, 1, 3, 6, 7, 8, 11],
    aroha: ["N,", "S", "g", "M", "P", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "g", "r", "S"],
    vadi: 7,
    samvadi: 1,
    time: "Afternoon (12 PM - 3 PM)",
    mood: "Severe heat, burning spiritual desire",
    jati: "Audav-Sampurna",
    description: "Ascending lines skip Rishabh and Dhaivat. Extremely emotional and bright."
  },

  // --- MARWA THAAT ---
  {
    id: "marwa",
    name: "Raag Marwa",
    thaat: "Marwa",
    allowedSwaras: [0, 1, 4, 6, 9, 11],
    aroha: ["S", "r", "G", "M", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "M", "G", "r", "S"],
    vadi: 1,     // Komal Re
    samvadi: 9,  // Shuddha Dha
    time: "Sunset Twilight (4 PM - 6 PM)",
    mood: "Sunset tension, transitional awe",
    jati: "Shadav-Shadav",
    description: "Completely omits Pancham. Tense, beautiful sunset twilight masterpiece."
  },
  {
    id: "puriya",
    name: "Raag Puriya",
    thaat: "Marwa",
    allowedSwaras: [0, 1, 4, 6, 9, 11],
    aroha: ["N,", "r", "G", "M", "D", "N", "S'"],
    avaroha: ["S'", "N", "D", "M", "G", "r", "S"],
    vadi: 4,
    samvadi: 11,
    time: "Evening Twilight (6 PM - 8 PM)",
    mood: "Mystic shadows, profound reflection",
    jati: "Shadav-Shadav",
    description: "Twin of Marwa but emphasizes Ga and Ni instead of Re and Dha, creating an entirely different atmosphere."
  },

  // --- POORVI THAAT ---
  {
    id: "poorvi",
    name: "Raag Poorvi",
    thaat: "Poorvi",
    allowedSwaras: [0, 1, 4, 6, 7, 8, 11],
    aroha: ["S", "r", "G", "M", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "G", "r", "S"],
    vadi: 4,     // Ga
    samvadi: 11, // Ni
    time: "Sunset (6 PM - 8 PM)",
    mood: "Devotional contemplative twilight mysticism",
    jati: "Sampurna-Sampurna",
    description: "Deep evening bridge melody combining flat Re/Dha with sharp Ma and natural Ga/Ni."
  },
  {
    id: "shreeraag",
    name: "Raag Shree",
    thaat: "Poorvi",
    allowedSwaras: [0, 1, 4, 6, 7, 8, 11],
    aroha: ["S", "r", "M", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "G", "r", "S"],
    vadi: 1,
    samvadi: 7,
    time: "Sunset (4 PM - 6 PM)",
    mood: "Majestic awe, severe devotion, imperial twilight",
    jati: "Audav-Sampurna",
    description: "One of the oldest, highly complex classical ragas. High tension on Re and Pa."
  },
  {
    id: "puriya_dhanashree",
    name: "Raag Puriya Dhanashree",
    thaat: "Poorvi",
    allowedSwaras: [0, 1, 4, 6, 7, 8, 11],
    aroha: ["S", "r", "G", "M", "P", "d", "N", "S'"],
    avaroha: ["S'", "N", "d", "P", "M", "G", "r", "S"],
    vadi: 7,
    samvadi: 1, // Re
    time: "Evening (6 PM - 9 PM)",
    mood: "Profound romance, supreme prayerfulness",
    jati: "Sampurna-Sampurna",
    description: "An incredibly popular evening scale of deep sweetness, blending Kalyan and Bhairav notes."
  }
];
