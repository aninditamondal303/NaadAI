/**
 * Words for the welcome page, the singer picker and the app's main menu,
 * in English, Hindi and Bengali. The Hindi and Bengali were written for
 * this project and are awaiting review by native speakers.
 */
export type Lang = "en" | "hi" | "bn";

export const LANGS: { id: Lang; name: string }[] = [
  { id: "en", name: "English" },
  { id: "hi", name: "हिन्दी" },
  { id: "bn", name: "বাংলা" },
];

export interface Strings {
  langLabel: string;
  nav: { listens: string; accuracy: string; method: string; source: string; open: string; continueAs: (n: string) => string };
  stageLabel: string;
  read: { onNote: string; sharp: (n: number) => string; flat: (n: number) => string; mandra: string; taar: string };
  title: string;
  intro: string;
  sing: string;
  saLegend: string;
  saLow: string;
  saHigh: string;
  saLowHint: string;
  saHighHint: string;
  demo: string;
  stop: string;
  status: { listening: string; demo: string; loading: string; idle: string; seeAnalysis: string };
  err: { demoMissing: string; micBlocked: string; micFailed: (m: string) => string };
  hour: (prahar: number, ofNight: boolean, raags: string[]) => string;
  listens: { h: string; lede: string; items: [string, string][] };
  accuracy: {
    h: string; lede: string;
    rows: [string, string, string][];
    tablesPre: string; real: string; pitch: string; and: string; sa: string; helpPre: string; guide: string; helpPost: string;
  };
  practise: { h: string; items: [string, string][] };
  privacy: { h: string; lede: string };
  review: string; sourceCode: string;
  gate: {
    back: string; who: string; newSinger: string; savedHere: string; add: string; name: string; enterName: string;
    yourSa: string; start: string; backToProfiles: string; import: string; importFailed: string;
    presets: [string, string, string, string];
  };
  tabs: Record<"home" | "tanpura" | "analyzer" | "practice" | "journal" | "progress" | "library" | "profile", string>;
  streak: (n: number) => string;
  switchSinger: string;
  englishOnlyNote: string;
  home: HomeStrings;
  analyzer: AnalyzerStrings;
  tp: TanpuraStrings;
}

export interface TanpuraStrings {
  title: string; play: string; stop: string; sa: string; keyboard: string; octave: (n: number) => string; fine: (c: string) => string;
  first: string; firstHelp: string; volume: string; cycle: (s: string) => string; tapHint: string; droneHint: string; findSaTip: string; sound: string;
  taal: string; playTaal: string; tempo: (bpm: number, laya: string) => string; matras: (n: number) => string;
  sam: string; khali: string; taali: string; legend: string; laya: Record<"vilambit" | "madhya" | "drut", string>;
}

export interface HomeStrings {
  greet: (name: string) => string;
  yourSa: (note: string, hz: string) => string;
  raag: string; minutes: string; minUnit: string; start: string; running: (raag: string) => string;
  stopSave: string; discard: string; tuning: string; speed: string; volume: string; slow: string; fast: string;
  saved: (min: number, raag: string) => string; tooShort: string; complete: (min: number, raag: string) => string;
  stringsLabel: string; recordedDrone: string; left: string;
  aroh: string; avaroh: string; pakad: string; notWritten: string; paltas: string; review: string;
  plan: string; planEmpty: string; open: string; markDone: string; markNotDone: string;
  nowRaags: string; noneNow: string; timesNote: string; streak: (n: number) => string; streakNote: string;
  index: string; items: Record<"tanpura" | "analyzer" | "practice" | "journal" | "progress" | "library", string>;
}

export interface AnalyzerStrings {
  title: string; intro: string; modes: Record<"tuner" | "scale" | "sadhana" | "singing", string>;
  raag: string; measureAgainst: string; mySa: (hz: string) => string; detect: string;
  record: string; stop: string; upload: string; demo: string; recording: string; liveNote: string; saveImage: string;
}

const listOf = (names: string[], and: string) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`;

const en: Strings = {
  langLabel: "Language",
  nav: { listens: "How it listens", accuracy: "Accuracy", method: "Method", source: "Source", open: "Open the app", continueAs: n => `Continue as ${n}` },
  stageLabel: "Pitch drawn on the swara lines of Raag Yaman",
  read: { onNote: "on the note", sharp: n => `${n} cents sharp`, flat: n => `${n} cents flat`, mandra: "mandra", taar: "taar" },
  title: "Riyaz with the tanpura, measured swara by swara.",
  intro: "Sing with a recorded tanpura. Naad AI measures each swara against your Sa: how close it is to its true position, how steadily it is held, and whether it belongs to the raag.",
  sing: "Sing with the tanpura",
  saLegend: "Your Sa",
  saLow: "Sa C", saHigh: "Sa G", saLowHint: "Typical for most men", saHighHint: "Typical for most women",
  demo: "Play a demonstration phrase",
  stop: "Stop",
  status: {
    listening: "Listening. Wear earphones so the tanpura stays out of the microphone.",
    demo: "A computer-generated Yaman phrase with one shuddha Ma that doesn't belong.",
    loading: "Tuning the tanpura...",
    idle: "Nothing is recorded or uploaded; the voice is measured in this browser only.",
    seeAnalysis: "See the full analysis of this phrase",
  },
  err: {
    demoMissing: "The demo recording didn't load. Check your connection and reload the page.",
    micBlocked: "Microphone access was blocked. Allow it for this site in your browser's address bar, then press Sing again.",
    micFailed: m => `The microphone didn't open: ${m}`,
  },
  hour: (p, night, raags) => {
    const ord = ["1st", "2nd", "3rd", "4th"][p - 1];
    const base = `It's the ${ord} prahar of the ${night ? "night" : "day"} where you are.`;
    return raags.length ? `${base} Raags for this hour include ${listOf(raags, "and")}.` : base;
  },
  listens: {
    h: "How it listens",
    lede: "The pitch of the voice is measured a hundred times a second and compared with your Sa. When you stop, the readings are summarised in the terms a teacher would use.",
    items: [
      ["Your Sa", "It uses the Sa you set, or finds the one you were singing to from the notes of the raag."],
      ["Each held note", "How many cents sharp or flat it sat, and how much it wavered."],
      ["Phrases and breaths", "Where each phrase starts and ends, split wherever you breathe for a third of a second or more."],
      ["Notes outside the raag", "Held notes that don't belong to the raag you chose, with the moment they happened."],
      ["Andolan and gamak", "Oscillations between half a swing and twelve swings a second, with how wide they were."],
    ],
  },
  accuracy: {
    h: "How well it measures",
    lede: "The first four rows come from real recordings: three from 40 singers whose pitch was marked by musicians (a public research dataset), and one from 27 short recordings of aroh, avaroh and pakad. The rest use computer-generated voices whose pitch is known exactly. The real singers are not Hindustani vocalists, so tests on riyaz recordings will follow.",
    rows: [
      ["Real singing: pitch within 20 cents", "92%", "40 solo singers, 13.6 minutes, compared every 10 ms with pitch marked by musicians"],
      ["Real singing: within 50 cents", "96.6%", "Median error 2.8 cents. The common YIN method scores 84% within 20 cents on the same test"],
      ["Real singing: pitch reported in pauses", "13%", "Mostly breaths and fading note endings marked silent by the annotators; a held note needs a quarter second of steady pitch"],
      ["Real recordings: raag recognised", "22 / 27", "27 raags, chosen among all 125 in the library, with the singer's Sa known. Right raag in the first three for 26; 20 / 27 with Sa found automatically"],
      ["Computer voices: within 20 cents", "100%", "20 clips, 98 seconds, male and female voices, with gamak, meend and background noise"],
      ["Computer voices: pitch in silence", "0%", "Readings wrongly reported during breaths and pauses"],
      ["Sa found, raag and voice known", "56 / 56", "Yaman, Bhairav, Bhupali and Malkauns, Sa from 110 to 233 Hz"],
      ["Sa found, raag known", "91%", "The same 56 phrases, without being told the voice type"],
    ],
    tablesPre: "Full tables:", real: "real singing", pitch: "computer voices", and: "and", sa: "Sa detection",
    helpPre: "To help test it on real singing, see the", guide: "recording guide", helpPost: ".",
  },
  practise: {
    h: "What you can practise",
    items: [
      ["Tanpura and taal", "A recorded tanpura tuned to your Sa, and 23 taals played with recorded tabla bols."],
      ["Paltas", "Exercises built from each raag's aroh and avaroh, scored note by note, with a faster laya unlocked at 85."],
      ["Sa sadhana", "Hold Sa as long and as steadily as you can; it keeps your best."],
      ["Ear training", "After a Sa, hear a swara and name it; later, hear a phrase and name the raag."],
      ["Journal and progress", "Every take is kept, so you can see which swaras are getting steadier."],
    ],
  },
  privacy: {
    h: "Where your voice goes",
    lede: "Nowhere. Recordings are analysed inside your browser, and profiles and practice history stay on this device. There are no accounts or passwords. You can export a profile to move it to another device.",
  },
  review: "Raag notes are awaiting review by a guru.",
  sourceCode: "Source code on GitHub",
  gate: {
    back: "Back to the welcome page", who: "Who is practising?", newSinger: "New singer",
    savedHere: "Profiles are saved only in this browser. No account or password is needed.",
    add: "Add a singer", name: "Name", enterName: "Please enter a name.",
    yourSa: "Your Sa. You can measure it exactly later with Find my Sa.",
    start: "Start practising", backToProfiles: "Back to profiles", import: "Import a profile from another device",
    importFailed: "This file couldn't be imported.",
    presets: ["Lower male voice", "Higher male voice", "Lower female voice", "Higher female voice"],
  },
  tabs: { home: "Today", tanpura: "Tanpura & taal", analyzer: "Analysis", practice: "Riyaz", journal: "Journal", progress: "Progress", library: "Raag library", profile: "Profile" },
  streak: n => `${n}-day streak`,
  switchSinger: "Switch singer",
  englishOnlyNote: "",
  tp: {
    title: "Tanpura", play: "Play tanpura", stop: "Stop", sa: "Sa", keyboard: "Choose your Sa", octave: n => `Octave ${n}`, fine: c => `Fine tune ${c} cents`,
    first: "First string", firstHelp: "Pa for most raags, Ma for raags without Pa (Malkauns), Ni for raags like Marwa.", volume: "Volume",
    cycle: s => `${s} s for four plucks`, tapHint: "Tap a string to pluck it. Strings are tuned in just intonation, like a real tanpura.",
    droneHint: "This is a recorded tanpura, so the strings can't be plucked one by one and the speed is the player's own.",
    findSaTip: "Find my Sa in the Analyzer measures your natural Sa and sets it exactly.", sound: "Sound",
    taal: "Taal", playTaal: "Play theka", tempo: (b, l) => `${b} matras a minute, ${l}`, matras: n => `${n} matras`,
    sam: "sam", khali: "khali", taali: "taali", legend: "The circle is one avartan. X is sam, 0 is khali, numbers are taalis. Your guru may teach some bols differently.",
    laya: { vilambit: "vilambit", madhya: "madhya", drut: "drut" },
  },
  home: {
    greet: n => `Pranam, ${n}.`,
    yourSa: (note, hz) => `Your Sa is ${note}, ${hz} Hz.`,
    raag: "Raag", minutes: "How long", minUnit: "min", start: "Start riyaz", running: r => `Riyaz in ${r}`,
    stopSave: "Stop and save", discard: "Stop without saving", tuning: "First string", speed: "Pluck speed", volume: "Volume",
    slow: "slow", fast: "fast",
    saved: (m, r) => `Saved ${m} min of riyaz in ${r}.`, tooShort: "Sessions shorter than 30 seconds are not saved.",
    complete: (m, r) => `Riyaz complete: ${m} min in ${r} saved.`,
    stringsLabel: "Tanpura strings, moving with the sound you hear",
    recordedDrone: "Recorded tanpura. The strings move with its sound.", left: "left",
    aroh: "Aroh", avaroh: "Avaroh", pakad: "Pakad", notWritten: "Not written yet", paltas: "Paltas for this raag", review: "From the raag library, awaiting a guru's review.",
    plan: "Today's plan", planEmpty: "No measurements yet, so time is split evenly. The plan adapts as you practise.",
    open: "Open", markDone: "Mark done", markNotDone: "Mark not done",
    nowRaags: "Raags for this hour", noneNow: "No raag in the library is listed for this hour.",
    timesNote: "Times come from the raag library; traditions differ on exact hours.",
    streak: n => (n === 1 ? "1 day" : `${n} days`), streakNote: "in a row with practice saved in this browser",
    index: "Everything in the app",
    items: {
      tanpura: "Tanpura tuned to your Sa, and 23 taals with recorded tabla.",
      analyzer: "Record or upload singing and see every swara measured.",
      practice: "Paltas and pakad, scored note by note, and ear training.",
      journal: "Every saved take, with notes.",
      progress: "How your swaras and breath change over weeks.",
      library: "125 raags, 23 taals, the vocal forms and gharanas.",
    },
  },
  analyzer: {
    title: "Analysis", intro: "Record or upload a take and see every swara measured. Nothing leaves your device.",
    modes: { tuner: "Live tuner", scale: "Find my Sa", sadhana: "Sa sadhana", singing: "Analyse singing" },
    raag: "Raag", measureAgainst: "Measure against", mySa: hz => `My Sa (${hz} Hz)`, detect: "Find Sa in the recording",
    record: "Record", stop: "Stop and analyse", upload: "Upload a recording", demo: "Try the demo recording",
    recording: "Recording", liveNote: "Drawn live against your Sa; the full analysis runs when you stop.", saveImage: "Save as image",
  },
};

const hi: Strings = {
  langLabel: "भाषा",
  nav: { listens: "यह कैसे सुनता है", accuracy: "सटीकता", method: "पद्धति", source: "सोर्स कोड", open: "ऐप खोलें", continueAs: n => `${n} के रूप में जारी रखें` },
  stageLabel: "राग यमन की स्वर-रेखाओं पर आपकी आवाज़ का सुर",
  read: { onNote: "ठीक सुर पर", sharp: n => `${n} सेंट ऊँचा`, flat: n => `${n} सेंट नीचा`, mandra: "मंद्र", taar: "तार" },
  title: "तानपुरे के साथ रियाज़, स्वर-स्वर का माप।",
  intro: "नाद AI रिकॉर्ड किए गए तानपुरे के साथ आपकी आवाज़ सुनता है और दिखाता है कि हर स्वर कहाँ लगा: स्वर से कितना दूर, कितना स्थिर, और कौन-से स्वर राग से बाहर चले गए।",
  sing: "तानपुरे के साथ गाइए",
  saLegend: "आपका सा",
  saLow: "सा C", saHigh: "सा G", saLowHint: "अधिकतर पुरुषों के लिए", saHighHint: "अधिकतर महिलाओं के लिए",
  demo: "डेमो आलाप सुनिए",
  stop: "रोकें",
  status: {
    listening: "सुन रहा है। इयरफ़ोन लगाइए, ताकि तानपुरे की आवाज़ माइक्रोफ़ोन में न जाए।",
    demo: "कंप्यूटर से बना यमन का एक आलाप, जिसमें एक शुद्ध म राग से बाहर है।",
    loading: "तानपुरा मिलाया जा रहा है...",
    idle: "कुछ भी रिकॉर्ड या अपलोड नहीं होता। आपकी आवाज़ इसी टैब में मापी जाती है और फिर भुला दी जाती है।",
    seeAnalysis: "इस आलाप का पूरा विश्लेषण देखिए",
  },
  err: {
    demoMissing: "डेमो रिकॉर्डिंग लोड नहीं हुई। इंटरनेट जाँचकर पेज फिर से खोलिए।",
    micBlocked: "माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र के एड्रेस बार में इस साइट को अनुमति दीजिए, फिर दोबारा गाइए दबाइए।",
    micFailed: m => `माइक्रोफ़ोन नहीं खुला: ${m}`,
  },
  hour: (p, night, raags) => {
    const ord = ["पहला", "दूसरा", "तीसरा", "चौथा"][p - 1];
    const base = `आपके यहाँ अभी ${night ? "रात" : "दिन"} का ${ord} प्रहर है।`;
    return raags.length ? `${base} इस समय के कुछ राग: ${listOf(raags, "और")}।` : base;
  },
  listens: {
    h: "यह कैसे सुनता है",
    lede: "हर सेकंड सौ बार यह आपकी आवाज़ का सुर मापता है और उसे आपके सा से मिलाता है। गाना रोकने पर यह उन मापों को वैसी बातों में बदलता है जो एक गुरु बताते।",
    items: [
      ["आपका सा", "यह आपका चुना हुआ सा लेता है, या राग के स्वरों से पहचान लेता है कि आप किस सा पर गा रहे थे।"],
      ["हर ठहरा हुआ स्वर", "वह कितने सेंट ऊँचा या नीचा लगा, और कितना डगमगाया।"],
      ["आलाप और साँस", "हर वाक्य कहाँ शुरू और कहाँ खत्म हुआ; एक तिहाई सेकंड या उससे लंबी साँस पर उसे बाँटा जाता है।"],
      ["राग से बाहर के स्वर", "ठहरे हुए ऐसे स्वर जो चुने हुए राग में नहीं हैं, और वे कब लगे।"],
      ["आंदोलन और गमक", "आधे से बारह झूलों प्रति सेकंड तक के कंपन, और वे कितने चौड़े थे।"],
    ],
  },
  accuracy: {
    h: "यह कितना सही मापता है",
    lede: "पहली चार पंक्तियाँ असली रिकॉर्डिंग से हैं: तीन 40 गायकों से, जिनका सुर संगीतकारों ने चिह्नित किया है (एक सार्वजनिक शोध डेटासेट), और एक आरोह, अवरोह और पकड़ की 27 छोटी रिकॉर्डिंग से। बाकी कंप्यूटर से बनी आवाज़ों पर हैं जिनका सुर ठीक-ठीक पता है। ये गायक हिंदुस्तानी शास्त्रीय गायक नहीं हैं, इसलिए रियाज़ रिकॉर्डिंग पर परीक्षण आगे होंगे।",
    rows: [
      ["असली गायन: 20 सेंट के भीतर", "92%", "40 गायक, 13.6 मिनट, हर 10 ms पर संगीतकारों के चिह्नित सुर से तुलना"],
      ["असली गायन: 50 सेंट के भीतर", "96.6%", "माध्य त्रुटि 2.8 सेंट। आम YIN विधि इसी परीक्षण में 20 सेंट के भीतर 84% पर है"],
      ["असली गायन: विराम में बताया गया सुर", "13%", "ज़्यादातर साँस और स्वर के धीमे अंत, जिन्हें चिह्नकों ने खामोश माना; ठहरे स्वर के लिए चौथाई सेकंड का स्थिर सुर चाहिए"],
      ["असली रिकॉर्डिंग: राग पहचाना", "22 / 27", "27 राग, कोश के सभी 125 रागों में से, गायक का सा ज्ञात होने पर। 26 में सही राग पहले तीन में; सा अपने-आप खोजने पर 20 / 27"],
      ["कंप्यूटर आवाज़ें: 20 सेंट के भीतर", "100%", "20 क्लिप, 98 सेकंड, पुरुष और महिला आवाज़ें, गमक, मींड और पृष्ठभूमि शोर के साथ"],
      ["कंप्यूटर आवाज़ें: खामोशी में सुर", "0%", "साँस और विराम के समय गलती से बताए गए माप"],
      ["सा मिला, राग और आवाज़ का प्रकार ज्ञात", "56 / 56", "यमन, भैरव, भूपाली और मालकौंस, सा 110 से 233 Hz तक"],
      ["सा मिला, केवल राग ज्ञात", "91%", "वही 56 आलाप, आवाज़ का प्रकार बताए बिना"],
    ],
    tablesPre: "पूरी तालिकाएँ:", real: "असली गायन", pitch: "कंप्यूटर आवाज़ें", and: "और", sa: "सा की पहचान",
    helpPre: "असली गायन पर इसे परखने में मदद के लिए देखिए", guide: "रिकॉर्डिंग गाइड", helpPost: "।",
  },
  practise: {
    h: "आप क्या अभ्यास कर सकते हैं",
    items: [
      ["तानपुरा और ताल", "आपके सा पर मिला रिकॉर्ड किया हुआ तानपुरा, और रिकॉर्ड किए तबला बोलों के साथ 23 ताल।"],
      ["पलटे", "हर राग के आरोह-अवरोह से बने अभ्यास, हर स्वर पर अंक, और 85 पर तेज़ लय खुलती है।"],
      ["सा साधना", "सा को जितना लंबा और स्थिर हो सके, लगाइए; आपका सबसे अच्छा रिकॉर्ड रखा जाता है।"],
      ["कान की तालीम", "सा के बाद एक स्वर सुनकर उसे पहचानिए; आगे चलकर एक वाक्य सुनकर राग पहचानिए।"],
      ["डायरी और प्रगति", "हर रिकॉर्डिंग का माप रखा जाता है, ताकि आप देख सकें कौन-से स्वर स्थिर हो रहे हैं।"],
    ],
  },
  privacy: {
    h: "आपकी आवाज़ कहाँ जाती है",
    lede: "कहीं नहीं। रिकॉर्डिंग का विश्लेषण आपके ब्राउज़र में ही होता है, और प्रोफ़ाइल व अभ्यास का इतिहास इसी डिवाइस पर रहता है। कोई अकाउंट या पासवर्ड नहीं है। दूसरे डिवाइस पर ले जाने के लिए प्रोफ़ाइल एक्सपोर्ट कर सकते हैं।",
  },
  review: "राग-विवरण की गुरु द्वारा जाँच बाकी है।",
  sourceCode: "GitHub पर सोर्स कोड",
  gate: {
    back: "स्वागत पेज पर लौटें", who: "कौन अभ्यास कर रहा है?", newSinger: "नया गायक",
    savedHere: "प्रोफ़ाइल केवल इसी ब्राउज़र में सहेजी जाती हैं। कोई अकाउंट या पासवर्ड नहीं चाहिए।",
    add: "गायक जोड़ें", name: "नाम", enterName: "कृपया नाम लिखिए।",
    yourSa: "आपका सा। बाद में \"मेरा सा खोजें\" से इसे ठीक-ठीक माप सकते हैं।",
    start: "अभ्यास शुरू करें", backToProfiles: "प्रोफ़ाइल पर लौटें", import: "दूसरे डिवाइस से प्रोफ़ाइल लाएँ",
    importFailed: "यह फ़ाइल नहीं खुल सकी।",
    presets: ["नीची पुरुष आवाज़", "ऊँची पुरुष आवाज़", "नीची महिला आवाज़", "ऊँची महिला आवाज़"],
  },
  tabs: { home: "आज", tanpura: "तानपुरा व ताल", analyzer: "विश्लेषण", practice: "रियाज़", journal: "डायरी", progress: "प्रगति", library: "राग-कोश", profile: "प्रोफ़ाइल" },
  streak: n => `लगातार ${n} दिन`,
  switchSinger: "गायक बदलें",
  englishOnlyNote: "कुछ विस्तृत विवरण अभी अंग्रेज़ी में हैं।",
  tp: {
    title: "तानपुरा", play: "तानपुरा बजाएँ", stop: "रोकें", sa: "सा", keyboard: "अपना सा चुनिए", octave: n => `सप्तक ${n}`, fine: c => `बारीक सुर ${c} सेंट`,
    first: "पहला तार", firstHelp: "अधिकतर रागों में प, जिन रागों में प नहीं (मालकौंस) उनमें म, और मारवा जैसे रागों में नि।", volume: "आवाज़",
    cycle: s => `चार तारों में ${s} सेकंड`, tapHint: "तार छेड़ने के लिए उसे छुएँ। तार असली तानपुरे की तरह शुद्ध अनुपात में मिले हैं।",
    droneHint: "यह रिकॉर्ड किया हुआ तानपुरा है, इसलिए तार अलग-अलग नहीं छेड़े जा सकते और गति वादक की अपनी है।",
    findSaTip: "विश्लेषण में \"मेरा सा खोजें\" आपका स्वाभाविक सा मापकर ठीक-ठीक लगा देता है।", sound: "ध्वनि",
    taal: "ताल", playTaal: "ठेका बजाएँ", tempo: (b, l) => `प्रति मिनट ${b} मात्रा, ${l}`, matras: n => `${n} मात्रा`,
    sam: "सम", khali: "खाली", taali: "ताली", legend: "यह वृत्त एक आवर्तन है। X सम है, 0 खाली, अंक ताली हैं। आपके गुरु कुछ बोल अलग सिखा सकते हैं।",
    laya: { vilambit: "विलंबित", madhya: "मध्य", drut: "द्रुत" },
  },
  home: {
    greet: n => `प्रणाम, ${n}।`,
    yourSa: (note, hz) => `आपका सा ${note} है, ${hz} Hz।`,
    raag: "राग", minutes: "कितनी देर", minUnit: "मिनट", start: "रियाज़ शुरू करें", running: r => `${r} में रियाज़`,
    stopSave: "रोकें और सहेजें", discard: "बिना सहेजे रोकें", tuning: "पहला तार", speed: "छेड़ने की गति", volume: "आवाज़",
    slow: "धीमी", fast: "तेज़",
    saved: (m, r) => `${r} में ${m} मिनट का रियाज़ सहेजा गया।`, tooShort: "30 सेकंड से छोटे सत्र सहेजे नहीं जाते।",
    complete: (m, r) => `रियाज़ पूरा: ${r} में ${m} मिनट सहेजे गए।`,
    stringsLabel: "तानपुरे के तार, सुनाई दे रही आवाज़ के साथ हिलते हुए",
    recordedDrone: "रिकॉर्ड किया हुआ तानपुरा। तार उसकी आवाज़ के साथ हिलते हैं।", left: "बाकी",
    aroh: "आरोह", avaroh: "अवरोह", pakad: "पकड़", notWritten: "अभी लिखा नहीं गया", paltas: "इस राग के पलटे", review: "राग-कोश से, गुरु की जाँच बाकी।",
    plan: "आज की योजना", planEmpty: "अभी कोई माप नहीं है, इसलिए समय बराबर बाँटा गया है। अभ्यास के साथ योजना बदलती है।",
    open: "खोलें", markDone: "पूरा हुआ", markNotDone: "पूरा नहीं हुआ",
    nowRaags: "इस समय के राग", noneNow: "राग-कोश में इस समय का कोई राग नहीं है।",
    timesNote: "समय राग-कोश से हैं; परंपराओं में घंटे अलग-अलग माने जाते हैं।",
    streak: n => `${n} दिन`, streakNote: "लगातार, इस ब्राउज़र में सहेजे अभ्यास के साथ",
    index: "ऐप में सब कुछ",
    items: {
      tanpura: "आपके सा पर मिला तानपुरा, और रिकॉर्ड किए तबले के साथ 23 ताल।",
      analyzer: "गायन रिकॉर्ड या अपलोड कीजिए और हर स्वर का माप देखिए।",
      practice: "पलटे और पकड़, हर स्वर पर अंक, और कान की तालीम।",
      journal: "सहेजी गई हर रिकॉर्डिंग, नोट्स के साथ।",
      progress: "हफ़्तों में आपके स्वर और साँस कैसे बदलते हैं।",
      library: "125 राग, 23 ताल, गायन शैलियाँ और घराने।",
    },
  },
  analyzer: {
    title: "विश्लेषण", intro: "रिकॉर्ड या अपलोड कीजिए और हर स्वर का माप देखिए। कुछ भी आपके डिवाइस से बाहर नहीं जाता।",
    modes: { tuner: "लाइव ट्यूनर", scale: "मेरा सा खोजें", sadhana: "सा साधना", singing: "गायन का विश्लेषण" },
    raag: "राग", measureAgainst: "किससे मापें", mySa: hz => `मेरा सा (${hz} Hz)`, detect: "रिकॉर्डिंग से सा खोजें",
    record: "रिकॉर्ड करें", stop: "रोकें और जाँचें", upload: "रिकॉर्डिंग अपलोड करें", demo: "डेमो रिकॉर्डिंग आज़माएँ",
    recording: "रिकॉर्डिंग", liveNote: "आपके सा के सामने लाइव बनाया गया; पूरा विश्लेषण रोकने पर होगा।", saveImage: "चित्र के रूप में सहेजें",
  },
};

const bn: Strings = {
  langLabel: "ভাষা",
  nav: { listens: "এটি কীভাবে শোনে", accuracy: "নির্ভুলতা", method: "পদ্ধতি", source: "সোর্স কোড", open: "অ্যাপ খুলুন", continueAs: n => `${n} হিসেবে চালিয়ে যান` },
  stageLabel: "রাগ ইমনের স্বর-রেখায় আপনার কণ্ঠের সুর",
  read: { onNote: "ঠিক সুরে", sharp: n => `${n} সেন্ট চড়া`, flat: n => `${n} সেন্ট নিচু`, mandra: "মন্দ্র", taar: "তার" },
  title: "তানপুরার সঙ্গে রেওয়াজ, প্রতিটি স্বরের মাপ।",
  intro: "নাদ AI রেকর্ড করা তানপুরার সঙ্গে আপনার গলা শোনে আর দেখায় প্রতিটি স্বর কোথায় লাগল: স্বর থেকে কতটা দূরে, কতটা স্থির, আর কোন স্বর রাগের বাইরে চলে গেল।",
  sing: "তানপুরার সঙ্গে গান",
  saLegend: "আপনার সা",
  saLow: "সা C", saHigh: "সা G", saLowHint: "বেশিরভাগ পুরুষের জন্য", saHighHint: "বেশিরভাগ মহিলার জন্য",
  demo: "ডেমো আলাপ শুনুন",
  stop: "থামান",
  status: {
    listening: "শুনছে। ইয়ারফোন পরুন, যাতে তানপুরার আওয়াজ মাইক্রোফোনে না ঢোকে।",
    demo: "কম্পিউটারে তৈরি ইমনের একটি আলাপ, যেখানে একটি শুদ্ধ মা রাগের বাইরে।",
    loading: "তানপুরা বাঁধা হচ্ছে...",
    idle: "কিছুই রেকর্ড বা আপলোড হয় না। আপনার গলা এই ট্যাবেই মাপা হয়, তারপর ভুলে যাওয়া হয়।",
    seeAnalysis: "এই আলাপের পুরো বিশ্লেষণ দেখুন",
  },
  err: {
    demoMissing: "ডেমো রেকর্ডিং লোড হয়নি। ইন্টারনেট দেখে পেজটি আবার খুলুন।",
    micBlocked: "মাইক্রোফোনের অনুমতি পাওয়া যায়নি। ব্রাউজারের অ্যাড্রেস বারে এই সাইটকে অনুমতি দিন, তারপর আবার গান টিপুন।",
    micFailed: m => `মাইক্রোফোন খোলেনি: ${m}`,
  },
  hour: (p, night, raags) => {
    const ord = ["প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ"][p - 1];
    const base = `আপনার ওখানে এখন ${night ? "রাতের" : "দিনের"} ${ord} প্রহর।`;
    return raags.length ? `${base} এই সময়ের কয়েকটি রাগ: ${listOf(raags, "আর")}।` : base;
  },
  listens: {
    h: "এটি কীভাবে শোনে",
    lede: "প্রতি সেকেন্ডে একশো বার এটি আপনার গলার সুর মাপে আর আপনার সা-এর সঙ্গে মেলায়। গান থামালে সেই মাপগুলোকে এমন কথায় বদলায়, যা একজন গুরু ধরিয়ে দিতেন।",
    items: [
      ["আপনার সা", "আপনার বেছে নেওয়া সা ব্যবহার করে, অথবা রাগের স্বর থেকে বুঝে নেয় আপনি কোন সা-তে গাইছিলেন।"],
      ["প্রতিটি টানা স্বর", "কত সেন্ট চড়া বা নিচু লাগল, আর কতটা কাঁপল।"],
      ["আলাপ আর শ্বাস", "প্রতিটি বাক্য কোথায় শুরু আর শেষ; এক সেকেন্ডের তিন ভাগের এক ভাগ বা তার বেশি শ্বাসে ভাগ করা হয়।"],
      ["রাগের বাইরের স্বর", "টানা স্বর যা বেছে নেওয়া রাগে নেই, আর সেগুলো কখন লাগল।"],
      ["আন্দোলন আর গমক", "সেকেন্ডে আধটা থেকে বারোটা দোলা পর্যন্ত কম্পন, আর তা কতটা চওড়া ছিল।"],
    ],
  },
  accuracy: {
    h: "এটি কতটা ঠিক মাপে",
    lede: "প্রথম চারটি সারি আসল রেকর্ডিং থেকে: তিনটি ৪০ জন শিল্পীর, যাদের সুর সংগীতজ্ঞরা চিহ্নিত করেছেন (একটি উন্মুক্ত গবেষণা ডেটাসেট), আর একটি আরোহ, অবরোহ ও পকড়ের ২৭টি ছোট রেকর্ডিং থেকে। বাকিগুলো কম্পিউটারে তৈরি কণ্ঠে, যার সুর একদম জানা। এই শিল্পীরা হিন্দুস্তানি শাস্ত্রীয় শিল্পী নন, তাই রেওয়াজের রেকর্ডিংয়ে পরীক্ষা পরে হবে।",
    rows: [
      ["আসল গান: ২০ সেন্টের মধ্যে", "92%", "৪০ জন শিল্পী, ১৩.৬ মিনিট, প্রতি ১০ ms-এ সংগীতজ্ঞদের চিহ্নিত সুরের সঙ্গে তুলনা"],
      ["আসল গান: ৫০ সেন্টের মধ্যে", "96.6%", "মধ্যমা ত্রুটি ২.৮ সেন্ট। প্রচলিত YIN পদ্ধতি একই পরীক্ষায় ২০ সেন্টের মধ্যে ৮৪%"],
      ["আসল গান: বিরতিতে জানানো সুর", "13%", "বেশিরভাগ শ্বাস আর স্বরের মিলিয়ে যাওয়া শেষ, যা চিহ্নকরা নীরব ধরেছেন; টানা স্বরের জন্য সিকি সেকেন্ড স্থির সুর লাগে"],
      ["আসল রেকর্ডিং: রাগ চেনা", "22 / 27", "২৭টি রাগ, কোষের সব ১২৫টি রাগের মধ্যে থেকে, শিল্পীর সা জানা থাকলে। ২৬টিতে সঠিক রাগ প্রথম তিনে; সা নিজে খুঁজলে ২০ / ২৭"],
      ["কম্পিউটার কণ্ঠ: ২০ সেন্টের মধ্যে", "100%", "২০টি ক্লিপ, ৯৮ সেকেন্ড, পুরুষ ও মহিলা কণ্ঠ, গমক, মীড় আর পিছনের আওয়াজসহ"],
      ["কম্পিউটার কণ্ঠ: নীরবতায় সুর", "0%", "শ্বাস আর বিরতির সময় ভুল করে জানানো মাপ"],
      ["সা পাওয়া গেছে, রাগ ও কণ্ঠের ধরন জানা", "56 / 56", "ইমন, ভৈরব, ভূপালী আর মালকোষ, সা ১১০ থেকে ২৩৩ Hz"],
      ["সা পাওয়া গেছে, শুধু রাগ জানা", "91%", "একই ৫৬টি আলাপ, কণ্ঠের ধরন না জানিয়ে"],
    ],
    tablesPre: "পুরো তালিকা:", real: "আসল গান", pitch: "কম্পিউটার কণ্ঠ", and: "আর", sa: "সা শনাক্তকরণ",
    helpPre: "আসল গানে এটি যাচাই করতে সাহায্য করতে দেখুন", guide: "রেকর্ডিং গাইড", helpPost: "।",
  },
  practise: {
    h: "আপনি কী অনুশীলন করতে পারেন",
    items: [
      ["তানপুরা আর তাল", "আপনার সা-তে বাঁধা রেকর্ড করা তানপুরা, আর রেকর্ড করা তবলার বোলে ২৩টি তাল।"],
      ["পাল্টা", "প্রতিটি রাগের আরোহ-অবরোহ থেকে তৈরি অনুশীলন, প্রতি স্বরে নম্বর, আর ৮৫ পেলে দ্রুত লয় খোলে।"],
      ["সা সাধনা", "সা যতটা লম্বা আর স্থির পারেন ধরে রাখুন; আপনার সেরা রেকর্ড রাখা হয়।"],
      ["কানের তালিম", "সা-এর পরে একটি স্বর শুনে চিনুন; পরে একটি বাক্য শুনে রাগ চিনুন।"],
      ["ডায়েরি আর অগ্রগতি", "প্রতিটি রেকর্ডিংয়ের মাপ রাখা হয়, যাতে দেখতে পান কোন স্বর স্থির হচ্ছে।"],
    ],
  },
  privacy: {
    h: "আপনার গলা কোথায় যায়",
    lede: "কোথাও না। রেকর্ডিংয়ের বিশ্লেষণ আপনার ব্রাউজারেই হয়, আর প্রোফাইল ও অনুশীলনের ইতিহাস এই ডিভাইসেই থাকে। কোনো অ্যাকাউন্ট বা পাসওয়ার্ড নেই। অন্য ডিভাইসে নিতে প্রোফাইল এক্সপোর্ট করতে পারেন।",
  },
  review: "রাগের বিবরণ এখনও গুরুর যাচাইয়ের অপেক্ষায়।",
  sourceCode: "GitHub-এ সোর্স কোড",
  gate: {
    back: "স্বাগত পেজে ফিরুন", who: "কে অনুশীলন করছেন?", newSinger: "নতুন শিল্পী",
    savedHere: "প্রোফাইল শুধু এই ব্রাউজারেই রাখা হয়। কোনো অ্যাকাউন্ট বা পাসওয়ার্ড লাগে না।",
    add: "শিল্পী যোগ করুন", name: "নাম", enterName: "অনুগ্রহ করে নাম লিখুন।",
    yourSa: "আপনার সা। পরে \"আমার সা খুঁজুন\" দিয়ে ঠিকঠাক মাপতে পারবেন।",
    start: "অনুশীলন শুরু করুন", backToProfiles: "প্রোফাইলে ফিরুন", import: "অন্য ডিভাইস থেকে প্রোফাইল আনুন",
    importFailed: "এই ফাইলটি আনা গেল না।",
    presets: ["নিচু পুরুষ কণ্ঠ", "উঁচু পুরুষ কণ্ঠ", "নিচু মহিলা কণ্ঠ", "উঁচু মহিলা কণ্ঠ"],
  },
  tabs: { home: "আজ", tanpura: "তানপুরা ও তাল", analyzer: "বিশ্লেষণ", practice: "রেওয়াজ", journal: "ডায়েরি", progress: "অগ্রগতি", library: "রাগ-কোষ", profile: "প্রোফাইল" },
  streak: n => `টানা ${n} দিন`,
  switchSinger: "শিল্পী বদলান",
  englishOnlyNote: "কিছু বিস্তারিত বিবরণ এখনও ইংরেজিতে।",
  tp: {
    title: "তানপুরা", play: "তানপুরা বাজান", stop: "থামান", sa: "সা", keyboard: "আপনার সা বাছুন", octave: n => `সপ্তক ${n}`, fine: c => `সূক্ষ্ম সুর ${c} সেন্ট`,
    first: "প্রথম তার", firstHelp: "বেশিরভাগ রাগে পা, যে রাগে পা নেই (মালকোষ) সেখানে মা, আর মারোয়ার মতো রাগে নি।", volume: "আওয়াজ",
    cycle: s => `চার তারে ${s} সেকেন্ড`, tapHint: "তার ছাড়তে ছুঁয়ে দিন। আসল তানপুরার মতো শুদ্ধ অনুপাতে বাঁধা।",
    droneHint: "এটি রেকর্ড করা তানপুরা, তাই তার আলাদা করে ছাড়া যায় না আর গতি বাদকের নিজের।",
    findSaTip: "বিশ্লেষণে \"আমার সা খুঁজুন\" আপনার স্বাভাবিক সা মেপে ঠিকঠাক বসিয়ে দেয়।", sound: "আওয়াজ",
    taal: "তাল", playTaal: "ঠেকা বাজান", tempo: (b, l) => `মিনিটে ${b} মাত্রা, ${l}`, matras: n => `${n} মাত্রা`,
    sam: "সম", khali: "খালি", taali: "তালি", legend: "বৃত্তটি একটি আবর্তন। X সম, 0 খালি, সংখ্যাগুলো তালি। আপনার গুরু কিছু বোল আলাদা শেখাতে পারেন।",
    laya: { vilambit: "বিলম্বিত", madhya: "মধ্য", drut: "দ্রুত" },
  },
  home: {
    greet: n => `প্রণাম, ${n}।`,
    yourSa: (note, hz) => `আপনার সা ${note}, ${hz} Hz।`,
    raag: "রাগ", minutes: "কতক্ষণ", minUnit: "মিনিট", start: "রেওয়াজ শুরু করুন", running: r => `${r}-এ রেওয়াজ`,
    stopSave: "থামিয়ে সংরক্ষণ করুন", discard: "সংরক্ষণ না করে থামান", tuning: "প্রথম তার", speed: "তার ছাড়ার গতি", volume: "আওয়াজ",
    slow: "ধীর", fast: "দ্রুত",
    saved: (m, r) => `${r}-এ ${m} মিনিটের রেওয়াজ সংরক্ষিত হল।`, tooShort: "৩০ সেকেন্ডের কম সময়ের সেশন সংরক্ষণ হয় না।",
    complete: (m, r) => `রেওয়াজ শেষ: ${r}-এ ${m} মিনিট সংরক্ষিত।`,
    stringsLabel: "তানপুরার তার, শোনা আওয়াজের সঙ্গে কাঁপছে",
    recordedDrone: "রেকর্ড করা তানপুরা। তারগুলো তার আওয়াজের সঙ্গে কাঁপে।", left: "বাকি",
    aroh: "আরোহ", avaroh: "অবরোহ", pakad: "পকড়", notWritten: "এখনও লেখা হয়নি", paltas: "এই রাগের পাল্টা", review: "রাগ-কোষ থেকে, গুরুর যাচাই বাকি।",
    plan: "আজকের পরিকল্পনা", planEmpty: "এখনও কোনো মাপ নেই, তাই সময় সমান ভাগ করা হয়েছে। অনুশীলনের সঙ্গে পরিকল্পনা বদলায়।",
    open: "খুলুন", markDone: "হয়ে গেছে", markNotDone: "হয়নি",
    nowRaags: "এই সময়ের রাগ", noneNow: "রাগ-কোষে এই সময়ের কোনো রাগ নেই।",
    timesNote: "সময় রাগ-কোষ থেকে; ঘরানাভেদে সময় আলাদা ধরা হয়।",
    streak: n => `${n} দিন`, streakNote: "টানা, এই ব্রাউজারে সংরক্ষিত অনুশীলনসহ",
    index: "অ্যাপে যা আছে",
    items: {
      tanpura: "আপনার সা-তে বাঁধা তানপুরা, আর রেকর্ড করা তবলায় ২৩টি তাল।",
      analyzer: "গান রেকর্ড বা আপলোড করুন, প্রতিটি স্বরের মাপ দেখুন।",
      practice: "পাল্টা আর পকড়, প্রতি স্বরে নম্বর, আর কানের তালিম।",
      journal: "সংরক্ষিত প্রতিটি রেকর্ডিং, নোটসহ।",
      progress: "সপ্তাহে সপ্তাহে আপনার স্বর আর শ্বাস কীভাবে বদলায়।",
      library: "১২৫টি রাগ, ২৩টি তাল, গায়নরীতি ও ঘরানা।",
    },
  },
  analyzer: {
    title: "বিশ্লেষণ", intro: "রেকর্ড বা আপলোড করুন, প্রতিটি স্বরের মাপ দেখুন। কিছুই আপনার ডিভাইসের বাইরে যায় না।",
    modes: { tuner: "লাইভ টিউনার", scale: "আমার সা খুঁজুন", sadhana: "সা সাধনা", singing: "গানের বিশ্লেষণ" },
    raag: "রাগ", measureAgainst: "কীসের সঙ্গে মাপবে", mySa: hz => `আমার সা (${hz} Hz)`, detect: "রেকর্ডিং থেকে সা খুঁজুন",
    record: "রেকর্ড করুন", stop: "থামিয়ে বিশ্লেষণ করুন", upload: "রেকর্ডিং আপলোড করুন", demo: "ডেমো রেকর্ডিং চালান",
    recording: "রেকর্ডিং", liveNote: "আপনার সা-এর সঙ্গে লাইভ আঁকা; পুরো বিশ্লেষণ থামালে হবে।", saveImage: "ছবি হিসেবে সংরক্ষণ করুন",
  },
};

export const STRINGS: Record<Lang, Strings> = { en, hi, bn };
