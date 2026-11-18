/**
 * Vocal forms (gayan prakar) and gharanas, written for the app from standard
 * references (see `sources`). Form descriptions are short summaries; the
 * raags listed under a form are those in this library for which tanarang.com
 * publishes a composition of that form, so every link can be followed up.
 */

export type FormGroup = "classical" | "semi" | "seasonal" | "devotional";

export interface VocalForm {
  id: string;
  name: string;
  /** Devanagari name. */
  deva: string;
  group: FormGroup;
  summary: string;
  features: string[];
  /** Taal ids from taals.ts that the form is usually sung in. */
  taals: string[];
  /** Bandish types on tanarang.com that count as this form (lower case). */
  matchTypes: string[];
  sources: { label: string; url: string }[];
}

const W = (page: string) => ({ label: `Wikipedia: ${page.replace(/_/g, " ").replace(/\s*\(.*\)/, "")}`, url: `https://en.wikipedia.org/wiki/${page}` });

export const FORMS: VocalForm[] = [
  {
    id: "dhrupad", name: "Dhrupad", deva: "ध्रुपद", group: "classical",
    summary: "The oldest surviving form of Hindustani vocal music: meditative and austere, sung with pakhawaj.",
    features: [
      "A long, unaccompanied alaap on syllables such as nom, tom, ri, na, developing the raag slowly through the three saptaks, followed by jod and jhala.",
      "The composition has four parts: sthayi, antara, sanchari and abhog.",
      "Layakari on the words of the composition (dugun, tigun, chaugun) rather than fast taans.",
      "Traditionally devotional or courtly texts in Braj bhasha; accompanied by pakhawaj.",
    ],
    taals: ["chautaal", "sultaal", "adachautaal"],
    matchTypes: ["dhrupad"],
    sources: [W("Dhrupad")],
  },
  {
    id: "dhamar", name: "Dhamar", deva: "धमार", group: "classical",
    summary: "A sister form of dhrupad, sung in the 14-matra Dhamar taal, usually on Krishna and the festival of Holi.",
    features: [
      "Sung in the dhrupad manner, with alaap before the composition and layakari within it.",
      "Texts describe Krishna, Radha and the play of colours at Holi.",
      "Accompanied by pakhawaj in Dhamar taal (5 + 2 + 3 + 4 matras).",
    ],
    taals: ["dhamar"],
    matchTypes: ["dhamar"],
    sources: [W("Dhamar")],
  },
  {
    id: "khayal", name: "Khayal", deva: "ख़याल", group: "classical",
    summary: "The most widely performed classical vocal form today: a shorter alaap and rich melodic improvisation, accompanied by tabla.",
    features: [
      "Usually two compositions in the same raag: a bada khayal in vilambit laya, then a chhota khayal in madhya or drut laya.",
      "The raag is unfolded through badhat (gradual expansion), bol-alaap, bol-taan and taans, and sargam.",
      "Each gharana has its own approach to the balance of these elements.",
      "Accompanied by tabla and harmonium or sarangi, with tanpura.",
    ],
    taals: ["ektaal", "teentaal", "jhaptaal", "jhoomra", "tilwada", "adachautaal", "rupak"],
    matchTypes: ["bada khayal", "chota khayal", "madhya laya khayal", "sadra"],
    sources: [W("Khyal")],
  },
  {
    id: "tarana", name: "Tarana", deva: "तराना", group: "classical",
    summary: "A fast composition built on rhythmic syllables such as tanana, dir dir, dim, odani and tom instead of meaningful words.",
    features: [
      "Usually sung in madhya or drut laya after a khayal in the same raag.",
      "Its effect comes from clear diction of the syllables and from laya; some taranas include a section of tabla or pakhawaj bols.",
      "Attributed in tradition to Amir Khusrau.",
    ],
    taals: ["teentaal", "ektaal", "jhaptaal"],
    matchTypes: ["tarana"],
    sources: [W("Tarana_(music)")],
  },
  {
    id: "thumri", name: "Thumri", deva: "ठुमरी", group: "semi",
    summary: "An expressive, romantic form in which the words lead and raag rules are applied more freely.",
    features: [
      "Bol-banav: one line of text is shaded in many ways to bring out its meaning.",
      "Themes of love, longing and devotion, often in the voice of a woman waiting for Krishna.",
      "Sung mostly in raags such as Khamaj, Kafi, Pilu, Bhairavi, Des and Tilang, and may touch neighbouring raags.",
      "Banaras and Lucknow (purab ang) and Punjab ang are the main styles.",
    ],
    taals: ["deepchandi", "jat", "punjabi", "keherwa", "teentaal"],
    matchTypes: ["thumri"],
    sources: [W("Thumri")],
  },
  {
    id: "dadra", name: "Dadra", deva: "दादरा", group: "semi",
    summary: "A lighter, lilting form, often set to the 6-matra Dadra taal, with playful or joyful themes.",
    features: [
      "Shorter and quicker than thumri, but sung with the same freedom of expression.",
      "Usually sung after a thumri in the same concert segment.",
    ],
    taals: ["dadra", "keherwa"],
    matchTypes: ["dadra"],
    sources: [W("Dadra")],
  },
  {
    id: "tappa", name: "Tappa", deva: "टप्पा", group: "semi",
    summary: "From the songs of Punjabi camel drivers: quick, intricate runs of notes (tappa taans) at a brisk pace.",
    features: [
      "Built on short, rapid zamzama and khatka phrases that need great agility of voice.",
      "Refined at the court of Lucknow by Shori Miyan; later absorbed into the Gwalior repertoire.",
      "Sung in raags such as Kafi, Khamaj, Bhairavi and Pilu.",
    ],
    taals: ["tappataal", "punjabi"],
    matchTypes: ["tappa"],
    sources: [W("Tappa")],
  },
  {
    id: "hori", name: "Hori", deva: "होरी", group: "seasonal",
    summary: "Songs of Holi and spring: Krishna, Radha and the gopis playing with colour.",
    features: [
      "Sung in the semi-classical manner, in Deepchandi, Jat or Keherwa; in the dhrupad tradition the same theme is the dhamar.",
      "Common in raags such as Kafi, Khamaj, Des, Basant and Bahar.",
    ],
    taals: ["deepchandi", "jat", "keherwa"],
    matchTypes: ["hori"],
    sources: [W("Hori_(music)")],
  },
  {
    id: "chaiti", name: "Chaiti", deva: "चैती", group: "seasonal",
    summary: "Songs of the month of Chaitra (March–April), from the folk traditions of Uttar Pradesh and Bihar.",
    features: [
      "Each line traditionally ends with the refrain 'ho Rama'.",
      "Themes of spring, longing and the absent beloved.",
    ],
    taals: ["deepchandi", "keherwa", "dadra"],
    matchTypes: ["chaiti"],
    sources: [W("Chaiti")],
  },
  {
    id: "kajari", name: "Kajari", deva: "कजरी", group: "seasonal",
    summary: "Songs of the monsoon, especially of Mirzapur and Banaras, about dark clouds and separation from the beloved.",
    features: [
      "Sung through the rainy season in the folk tradition.",
      "Taken into the semi-classical repertoire by the singers of Banaras.",
    ],
    taals: ["keherwa", "dadra"],
    matchTypes: ["kajari"],
    sources: [W("Kajari")],
  },
  {
    id: "sawani", name: "Sawani and jhoola", deva: "सावनी, झूला", group: "seasonal",
    summary: "Songs of the month of Sawan: swings hung from trees, rain and the longing of separated lovers.",
    features: [
      "Jhoola songs describe Krishna and Radha on the swing.",
      "Often sung in Malhar raags and in Des.",
    ],
    taals: ["keherwa", "dadra", "teentaal"],
    matchTypes: ["jhoola", "sawani"],
    sources: [],
  },
  {
    id: "ghazal", name: "Ghazal", deva: "ग़ज़ल", group: "devotional",
    summary: "A poetic form of rhyming couplets (sher) in Urdu or Persian, set to raag-based melodies, on love, longing and philosophy.",
    features: [
      "The poem leads: each couplet is complete in itself and shares the radif (refrain) and qafia (rhyme).",
      "Melodies draw on raags such as Yaman, Bhairavi, Pilu, Khamaj and Darbari, sung with restraint.",
    ],
    taals: ["keherwa", "dadra", "rupak", "pashto"],
    matchTypes: ["ghazal"],
    sources: [W("Ghazal")],
  },
  {
    id: "bhajan", name: "Bhajan", deva: "भजन", group: "devotional",
    summary: "Devotional songs on spiritual themes, simpler in structure than the concert forms.",
    features: [
      "Texts of the bhakti poets such as Kabir, Meera, Surdas and Tulsidas.",
      "The melody serves the words; classical singers often set bhajans in a raag.",
    ],
    taals: ["keherwa", "dadra", "dhumali", "rupak"],
    matchTypes: ["bhajan"],
    sources: [W("Bhajan")],
  },
];

export const FORM_GROUPS: { id: FormGroup; label: string }[] = [
  { id: "classical", label: "Classical forms" },
  { id: "semi", label: "Semi-classical and light classical forms" },
  { id: "seasonal", label: "Seasonal songs" },
  { id: "devotional", label: "Devotional and poetic forms" },
];

export interface Gharana {
  id: string;
  name: string;
  place: string;
  founders: string;
  /** Points of style a listener can recognise. */
  style: string[];
  exponents: string;
  /** Where the commonly given account differs from a shorter one in circulation. */
  note?: string;
  sources: { label: string; url: string }[];
}

export const GHARANAS: Gharana[] = [
  {
    id: "gwalior", name: "Gwalior", place: "Gwalior (the court of the Scindias)",
    founders: "Naththan Pir Bakhsh, who came to Gwalior from Lucknow; developed by his grandsons Haddu Khan and Hassu Khan, and Natthu Khan",
    style: ["Regarded as the oldest khayal gharana.", "Straightforward, open-voiced presentation that keeps the composition (bandish) at the centre.", "Bol-taan and gamak taans; a broad repertoire including tappa and tarana."],
    exponents: "Haddu Khan and Hassu Khan, Vishnu Digambar Paluskar (through Balakrishnabuwa Ichalkaranjikar), Krishnarao Shankar Pandit",
    note: "Some lists name the founder as Nathan Khan; he is the same Naththan Pir Bakhsh.",
    sources: [W("Gwalior_gharana")],
  },
  {
    id: "agra", name: "Agra", place: "Agra",
    founders: "Haji Sujan Khan, a dhrupad singer at Akbar's court (16th century); the khayal style took shape with Ghagge Khuda Bakhsh, who learnt from Naththan Pir Bakhsh of Gwalior",
    style: ["Close to dhrupad: a nom-tom alaap before the composition.", "Bold, full-throated voice production and vigorous layakari.", "Rich in dhrupad and dhamar as well as khayal."],
    exponents: "Faiyaz Khan, Vilayat Hussain Khan, Khadim Hussain Khan, S. N. Ratanjankar",
    sources: [W("Agra_gharana")],
  },
  {
    id: "rangila", name: "Rangila (Agra)", place: "Agra",
    founders: "The name given to the Agra tradition as shaped by Ustad Faiyaz Khan (1886–1950), called 'Aftab-e-Mausiqi', who composed as 'Prem Piya'",
    style: ["Agra gayaki with greater charm and colour (rang) in presentation.", "Faiyaz Khan sang khayal, dhrupad, dhamar, thumri and ghazal with equal mastery."],
    exponents: "Faiyaz Khan and his disciples, among them Dipali Nag and S. N. Ratanjankar",
    note: "Rangila is usually described as a name of, or a branch within, the Agra gharana rather than a separately founded gharana; Faiyaz Khan did not found it but is its foremost representative.",
    sources: [W("Faiyaz_Khan"), W("Agra_gharana")],
  },
  {
    id: "jaipur", name: "Jaipur-Atrauli", place: "Atrauli (near Aligarh), and Jaipur, where the family served at court",
    founders: "Alladiya Khan (1855–1946)",
    style: ["Intricate, vakra phrases that weave around the raag's structure.", "Fine layakari and continuity of the melodic line.", "Known for rare and jod raags created or revived by Alladiya Khan."],
    exponents: "Kesarbai Kerkar, Mogubai Kurdikar, Mallikarjun Mansur, Kishori Amonkar",
    sources: [W("Jaipur-Atrauli_gharana"), W("Alladiya_Khan")],
  },
  {
    id: "kirana", name: "Kirana", place: "Kairana (Kirana), a town in Shamli district of western Uttar Pradesh",
    founders: "Abdul Karim Khan (1872–1937) and his cousin Abdul Wahid Khan; the family traces its music to the been player Bande Ali Khan",
    style: ["Unhurried, note-by-note development of the raag in very slow (ati-vilambit) laya.", "Great attention to the exact placement (sur) of each swara.", "Introspective and meditative in mood."],
    exponents: "Sawai Gandharva, Hirabai Barodekar, Gangubai Hangal, Bhimsen Joshi, Prabha Atre",
    note: "The town of Kairana is in western Uttar Pradesh, not in Awadh.",
    sources: [W("Kirana_gharana"), W("Abdul_Karim_Khan")],
  },
];
