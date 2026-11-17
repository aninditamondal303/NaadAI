/**
 * Words for the inner screens (Riyaz, Journal, Progress, Raag library,
 * Profile). Each entry: English, Hindi, Bengali. Functions take numbers or
 * names. The Hindi and Bengali await review by native speakers.
 */
import { useLang } from "./lang";
import type { Lang } from "./strings";

type Entry = [string, string, string] | ((...a: any[]) => [string, string, string]);

export const UI = {
  // Riyaz (practice)
  riyazTitle: ["Riyaz", "रियाज़", "রেওয়াজ"],
  riyazIntro: ["Sing each swara on its beat. Every note is graded for pitch and timing: within 25 cents and on time, within 50 cents or late, or further off or missed. A score of 85 or more opens the next laya. Please use earphones.",
    "हर स्वर उसकी मात्रा पर गाइए। हर स्वर का सुर और समय जाँचा जाता है: 25 सेंट के भीतर और समय पर, 50 सेंट के भीतर या देर से, अथवा उससे दूर या छूटा हुआ। 85 या अधिक अंक पर अगली लय खुलती है। कृपया इयरफ़ोन लगाएँ।",
    "প্রতিটি স্বর তার মাত্রায় গান। প্রতিটি স্বরের সুর ও সময় যাচাই হয়: ২৫ সেন্টের মধ্যে ও সময়ে, ৫০ সেন্টের মধ্যে বা দেরিতে, অথবা আরও দূরে বা বাদ। ৮৫ বা তার বেশি পেলে পরের লয় খোলে। অনুগ্রহ করে ইয়ারফোন ব্যবহার করুন।"],
  raag: ["Raag", "राग", "রাগ"],
  exerciseType: ["Exercise", "अभ्यास", "অনুশীলন"],
  kindPalta: ["Paltas", "पलटे", "পাল্টা"],
  kindPakad: ["Pakad", "पकड़", "পকড়"],
  kindGuru: ["Guru-shishya", "गुरु-शिष्य", "গুরু-শিষ্য"],
  kindMatch: ["Sur milao", "सुर मिलाओ", "সুর মেলাও"],
  kindEar: ["Ear training", "कान की तालीम", "কানের তালিম"],
  basicPaltas: ["Basic paltas", "मूल पलटे", "মৌলিক পাল্টা"],
  raagPaltas: ["Raag paltas", "राग के पलटे", "রাগের পাল্টা"],
  shuddhaSwaras: ["Shuddha swaras (S R G M P D N)", "शुद्ध स्वर (सा रे ग म प ध नि)", "শুদ্ধ স্বর (সা রে গা মা পা ধা নি)"],
  beat: (n: number) => [`Laya: ${n} matras per minute`, `लय: प्रति मिनट ${n} मात्रा`, `লয়: মিনিটে ${n} মাত্রা`],
  tanpuraOn: (hz: string) => [`Tanpura on (Sa ${hz} Hz)`, `तानपुरा चालू (सा ${hz} Hz)`, `তানপুরা চালু (সা ${hz} Hz)`],
  stop: ["Stop", "रोकें", "থামান"],
  recentAttempts: ["Recent attempts", "हाल के प्रयास", "সাম্প্রতিক চেষ্টা"],

  // Journal
  journalTitle: ["Riyaz journal", "रियाज़ डायरी", "রেওয়াজের ডায়েরি"],
  journalIntro: ["A record of each practice session: the raag, the duration, the rasa you worked on, and your own observations. Kept in this browser.",
    "हर अभ्यास का लेखा: राग, अवधि, जिस रस पर काम किया, और आपकी अपनी टिप्पणियाँ। इसी ब्राउज़र में सहेजा जाता है।",
    "প্রতিটি অনুশীলনের হিসাব: রাগ, সময়, যে রস নিয়ে কাজ করলেন, আর আপনার নিজের পর্যবেক্ষণ। এই ব্রাউজারেই রাখা হয়।"],
  newEntry: ["New entry", "नई प्रविष्टि", "নতুন লেখা"],
  cancel: ["Cancel", "रद्द करें", "বাতিল"],
  duration: ["Duration (minutes)", "अवधि (मिनट)", "সময় (মিনিট)"],
  rasa: ["Rasa", "रस", "রস"],
  observations: ["Observations", "टिप्पणियाँ", "পর্যবেক্ষণ"],
  observationsHint: ["For example: in the Yaman meend from Ga to Re the Re was landing flat; slowing the meend corrected it.",
    "उदाहरण: यमन में ग से रे की मींड में रे नीचा लग रहा था; मींड धीमी करने से ठीक हुआ।",
    "উদাহরণ: ইমনে গা থেকে রে-র মীড়ে রে নিচু লাগছিল; মীড় ধীর করায় ঠিক হল।"],
  saveEntry: ["Save entry", "प्रविष्टि सहेजें", "লেখা সংরক্ষণ করুন"],
  pastEntries: ["Previous entries", "पिछली प्रविष्टियाँ", "আগের লেখা"],
  noEntries: ["No entries yet. Use \"New entry\" after a practice session to record what you worked on.",
    "अभी कोई प्रविष्टि नहीं। अभ्यास के बाद \"नई प्रविष्टि\" से लिखिए कि किस पर काम किया।",
    "এখনও কোনো লেখা নেই। অনুশীলনের পরে \"নতুন লেখা\" দিয়ে লিখুন কী নিয়ে কাজ করলেন।"],
  remove: ["Remove", "हटाएँ", "সরান"],
  minutes: (n: number) => [`${n} min`, `${n} मिनट`, `${n} মিনিট`],
  rasas: ["Shanta (peace)|Bhakti (devotion)|Shringar (love)|Karuna (pathos)|Veer (valour)|Adbhut (wonder)",
    "शांत|भक्ति|शृंगार|करुण|वीर|अद्भुत",
    "শান্ত|ভক্তি|শৃঙ্গার|করুণ|বীর|অদ্ভুত"],

  // Progress
  progressTitle: ["Progress", "प्रगति", "অগ্রগতি"],
  ofRiyaz: ["of riyaz", "रियाज़", "রেওয়াজ"],
  daysInRow: (n: number) => [n === 1 ? "day in a row" : "days in a row", "दिन लगातार", "দিন টানা"],
  recordingsAnalysed: ["recordings analysed", "रिकॉर्डिंग जाँची गईं", "রেকর্ডিং বিশ্লেষিত"],
  raagsCount: (n: number) => [n === 1 ? "raag" : "raags", "राग", "রাগ"],

  // Raag library
  libraryTitle: ["Raag library", "राग-कोश", "রাগ-কোষ"],
  allRaags: ["All raags", "सभी राग", "সব রাগ"],
  searchRaags: ["Search by name, thaat or samay", "नाम, थाट या समय से खोजें", "নাম, ঠাট বা সময় দিয়ে খুঁজুন"],
  noMatch: ["No raags match your search.", "आपकी खोज से कोई राग नहीं मिला।", "আপনার খোঁজে কোনো রাগ মেলেনি।"],
  allThaats: ["All thaats", "सभी थाट", "সব ঠাট"],
  withStudy: ["With study material", "अध्ययन सामग्री सहित", "অধ্যয়ন সামগ্রীসহ"],

  // Profile
  profileOf: (name: string) => [`${name}'s profile`, `${name} की प्रोफ़ाइल`, `${name}-এর প্রোফাইল`],
  saCheckEmpty: ["Use \"Find my Sa\" in the Analyzer to measure how steadily you hold Sa.", "विश्लेषण में \"मेरा सा खोजें\" से मापिए कि आप सा कितना स्थिर लगाते हैं।", "বিশ্লেষণে \"আমার সা খুঁজুন\" দিয়ে মাপুন আপনি সা কতটা স্থির ধরেন।"],
  wobbleHolding: (hz: string, s: string) => [`wobble while holding ${hz} Hz for ${s} s`, `${hz} Hz को ${s} सेकंड लगाते समय कंपन`, `${hz} Hz ${s} সেকেন্ড ধরে রাখার সময় কম্পন`],
  rangeEmpty: ["Analyse a recording to measure your range.", "अपना विस्तार मापने के लिए एक रिकॉर्डिंग जाँचिए।", "আপনার বিস্তার মাপতে একটি রেকর্ডিং বিশ্লেষণ করুন।"],
  rangeSemis: (n: string) => [`${n} semitones across all recordings`, `सभी रिकॉर्डिंग में ${n} सेमीटोन`, `সব রেকর্ডিং মিলিয়ে ${n} সেমিটোন`],
  tendEmpty: (n: number) => [`Not enough data yet. A swara appears here once you have held it for at least ${n} seconds in total across your analysed recordings.`, `अभी पर्याप्त आँकड़े नहीं हैं। कोई स्वर यहाँ तब दिखेगा जब जाँची गई रिकॉर्डिंग में आप उसे कुल मिलाकर कम से कम ${n} सेकंड ठहराएँगे।`, `এখনও যথেষ্ট তথ্য নেই। বিশ্লেষিত রেকর্ডিংগুলিতে কোনো স্বর মোট অন্তত ${n} সেকেন্ড ধরে রাখলে তা এখানে দেখা যাবে।`],
  colSwara: ["Swara", "स्वर", "স্বর"],
  colHeld: ["Held in total", "कुल ठहराव", "মোট স্থিতি"],
  colPos: ["Typical position", "सामान्य स्थान", "সাধারণ অবস্থান"],
  colWob: ["Typical wobble", "सामान्य कंपन", "সাধারণ কম্পন"],
  tendNote: ["Position is measured from the equal-tempered swara position and averaged by time held. Differences over 15 cents are highlighted; some swaras are traditionally sung a little lower or higher, so check with your guru before changing anything.",
    "स्थान समान-स्वरित (equal-tempered) स्वर-स्थान से मापा जाता है और ठहराव के समय से औसत निकाला जाता है। 15 सेंट से अधिक अंतर चिह्नित होते हैं; कुछ स्वर परंपरा से थोड़े नीचे या ऊपर लगाए जाते हैं, इसलिए कुछ बदलने से पहले अपने गुरु से पूछिए।",
    "অবস্থান সম-স্বরিত (equal-tempered) স্বর-স্থান থেকে মাপা হয় এবং স্থিতির সময় অনুযায়ী গড় করা হয়। ১৫ সেন্টের বেশি পার্থক্য চিহ্নিত হয়; কিছু স্বর প্রথাগতভাবে একটু নিচু বা উঁচু লাগানো হয়, তাই কিছু বদলানোর আগে আপনার গুরুকে জিজ্ঞাসা করুন।"],
  clearHistory: ["Clear practice history", "अभ्यास इतिहास मिटाएँ", "অনুশীলনের ইতিহাস মুছুন"],
  clearConfirm: ["Delete all practice history saved for this singer? This can't be undone.", "इस गायक का सारा सहेजा अभ्यास इतिहास मिटाएँ? यह वापस नहीं होगा।", "এই গায়কের সব সংরক্ষিত অনুশীলন ইতিহাস মুছবেন? এটি ফেরানো যাবে না।"],
  deleteProfile: ["Delete profile", "प्रोफ़ाइल मिटाएँ", "প্রোফাইল মুছুন"],
  deleteConfirm: (n: string) => [`Delete the profile "${n}" and all its history from this browser?`, `इस ब्राउज़र से "${n}" की प्रोफ़ाइल और उसका सारा इतिहास मिटाएँ?`, `এই ব্রাউজার থেকে "${n}"-এর প্রোফাইল ও তার সব ইতিহাস মুছবেন?`],
  yourProfile: ["Your profile", "आपकी प्रोफ़ाइल", "আপনার প্রোফাইল"],
  builtFrom: (a: number, s: number) => [`Built from ${a} analysed recordings and ${s} Sa checks saved in this browser.`,
    `इस ब्राउज़र में सहेजी ${a} जाँची गई रिकॉर्डिंग और ${s} सा-जाँच से बनी।`,
    `এই ব্রাউজারে রাখা ${a}টি বিশ্লেষিত রেকর্ডিং আর ${s}টি সা-যাচাই থেকে তৈরি।`],
  yourSa: ["Your Sa", "आपका सा", "আপনার সা"],
  latestSaCheck: ["Latest Sa check", "पिछली सा-जाँच", "সর্বশেষ সা-যাচাই"],
  rangeHeld: ["Range of held notes", "ठहरे स्वरों का विस्तार", "টানা স্বরের পরিসর"],
  swaraTendencies: ["Swara tendencies", "स्वरों की प्रवृत्ति", "স্বরের প্রবণতা"],
  exportData: ["Export my data", "मेरा डेटा निर्यात करें", "আমার ডেটা রপ্তানি করুন"],

  // Reminder
  reminderTitle: ["Daily riyaz reminder", "रोज़ रियाज़ की याद", "প্রতিদিন রেওয়াজের স্মরণ"],
  reminderIntro: ["Choose a time and add a daily reminder to your phone's or computer's calendar. The calendar app gives the alert, so it works even when this site is closed.",
    "समय चुनिए और अपने फ़ोन या कंप्यूटर के कैलेंडर में रोज़ की याद जोड़िए। सूचना कैलेंडर देता है, इसलिए यह साइट बंद होने पर भी काम करता है।",
    "সময় বেছে নিয়ে ফোন বা কম্পিউটারের ক্যালেন্ডারে প্রতিদিনের স্মরণ যোগ করুন। সতর্কবার্তা ক্যালেন্ডার দেয়, তাই এই সাইট বন্ধ থাকলেও কাজ করে।"],
  reminderTime: ["Time", "समय", "সময়"],
  reminderLength: ["Duration (minutes)", "अवधि (मिनट)", "সময় (মিনিট)"],
  reminderAdd: ["Add to calendar", "कैलेंडर में जोड़ें", "ক্যালেন্ডারে যোগ করুন"],
  reminderDone: ["A calendar file was downloaded. Open it to add the daily reminder.", "एक कैलेंडर फ़ाइल डाउनलोड हुई है। रोज़ की याद जोड़ने के लिए उसे खोलिए।", "একটি ক্যালেন্ডার ফাইল ডাউনলোড হয়েছে। প্রতিদিনের স্মরণ যোগ করতে সেটি খুলুন।"],
  reminderEventTitle: ["Riyaz", "रियाज़", "রেওয়াজ"],
} satisfies Record<string, Entry>;

type Key = keyof typeof UI;
const idx: Record<Lang, number> = { en: 0, hi: 1, bn: 2 };

export function useUi() {
  const { lang } = useLang();
  return function u<K extends Key>(key: K, ...args: (typeof UI)[K] extends (...a: infer A) => any ? A : []): string {
    const e = UI[key] as Entry;
    const triple = typeof e === "function" ? e(...args) : e;
    return triple[idx[lang]];
  };
}
