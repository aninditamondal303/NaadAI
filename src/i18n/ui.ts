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
  riyazIntro: ["Sing each swara on its beat. Score 85 to unlock the next laya.", "हर स्वर उसकी मात्रा पर गाइए। 85 अंक पर अगली लय खुलती है।", "প্রতিটি স্বর তার মাত্রায় গান। ৮৫ পেলে পরের লয় খোলে।"],
  riyazGrading: ["Graded note by note: within 25 cents and on time is good, within 50 cents or late is close. Use earphones so the guide doesn't reach the microphone.", "हर स्वर जाँचा जाता है: 25 सेंट के भीतर और समय पर ठीक, 50 सेंट के भीतर या देर से निकट। इयरफ़ोन लगाएँ ताकि संकेत-स्वर माइक तक न पहुँचे।", "প্রতিটি স্বর যাচাই হয়: ২৫ সেন্টের মধ্যে ও সময়ে ঠিক, ৫০ সেন্টের মধ্যে বা দেরিতে কাছাকাছি। ইয়ারফোন ব্যবহার করুন যাতে নির্দেশক স্বর মাইকে না যায়।"],
  raag: ["Raag", "राग", "রাগ"],
  aboutGrading: ["How notes are graded", "स्वर कैसे जाँचे जाते हैं", "স্বর কীভাবে যাচাই হয়"],
  exerciseType: ["Exercise", "अभ्यास", "অনুশীলন"],
  bestSpeed: (l: string) => [`Best clean laya: ${l}`, `सबसे अच्छी साफ़ लय: ${l}`, `সেরা পরিষ্কার লয়: ${l}`],
  bestNone: ["Not yet sung cleanly", "अभी साफ़ नहीं गाया", "এখনও পরিষ্কার গাওয়া হয়নি"],
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
  journalIntro: ["Notes from each riyaz: raag, time, rasa and what you noticed.", "हर रियाज़ की टिप्पणी: राग, समय, रस और आपके अवलोकन।", "প্রতিটি রেওয়াজের নোট: রাগ, সময়, রস আর আপনার পর্যবেক্ষণ।"],
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
  noEntriesTitle: ["Your journal is empty", "आपकी डायरी अभी खाली है", "আপনার ডায়েরি এখনও খালি"],
  noEntries: ["After a riyaz, note the raag, what went well and what to work on next.", "रियाज़ के बाद राग, क्या अच्छा हुआ और आगे किस पर काम करना है, लिखिए।", "রেওয়াজের পরে রাগ, কী ভালো হল আর এরপর কী নিয়ে কাজ করবেন লিখুন।"],
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
  libIntro: (n: number, f: number) => [`${n} raags, ${f} with pakad, alaap, sargam geet and bandish.`, `${n} राग, जिनमें ${f} में पकड़, आलाप, सरगम गीत और बंदिश।`, `${n}টি রাগ, যার ${f}টিতে পকড়, আলাপ, সরগম গীত ও বন্দিশ।`],
  clockMidnight: ["midnight", "मध्यरात्रि", "মধ্যরাত"],
  clockNoon: ["noon", "मध्याह्न", "দুপুর"],
  clockAm: (h: number) => [`${h} am`, `सुबह ${h}`, `সকাল ${h}`],
  clockPm: (h: number) => [`${h} pm`, `${h} बजे (अपराह्न)`, `বিকাল ${h}`],
  raagsThisHour: (n: number) => [n === 1 ? "raag for this hour" : "raags for this hour", "इस प्रहर के राग", "এই প্রহরের রাগ"],
  clockNote: (n: number) => [`Each arc is a raag, over the hours given for it in the raag library; the hand is your time now. Traditions differ on exact hours, and ${n} raags have no clock time listed, so they are only in the index below.`,
    `हर चाप एक राग है, राग-कोश में दिए गए उसके समय पर; सुई आपका वर्तमान समय है। ठीक समय पर परंपराओं में मतभेद है, और ${n} रागों का समय नहीं दिया गया है, इसलिए वे केवल नीचे की सूची में हैं।`,
    `প্রতিটি চাপ একটি রাগ, রাগ-কোষে দেওয়া তার সময় অনুযায়ী; কাঁটা আপনার এখনকার সময়। সঠিক সময় নিয়ে ঘরানাভেদে মতভেদ আছে, এবং ${n}টি রাগের সময় দেওয়া নেই, তাই সেগুলি কেবল নিচের তালিকায় আছে।`],
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
  // Welcome page
  lnFeatures: ["Features", "विशेषताएँ", "বৈশিষ্ট্য"],
  lnF1h: ["See every swara you sing", "जो स्वर गाएँ, वह देखें", "যে স্বর গাইবেন, তা দেখুন"],
  lnF1p: ["Record a take and get its measure: how much of your held time sat in tune, which swaras drifted, where you breathed, and whether anything strayed outside the raag.", "एक रिकॉर्डिंग कीजिए और उसका माप पाइए: ठहराव का कितना समय सुर में रहा, कौन-से स्वर हटे, साँस कहाँ ली, और क्या कुछ राग के बाहर गया।", "একটি রেকর্ডিং করুন আর তার মাপ পান: স্থিতির কতটা সময় সুরে ছিল, কোন স্বর সরে গেল, কোথায় শ্বাস নিলেন, আর কিছু রাগের বাইরে গেল কিনা।"],
  lnF2h: ["A tanpura and tabla tuned to your Sa", "आपके सा पर मिला तानपुरा और तबला", "আপনার সা-য় বাঁধা তানপুরা ও তবলা"],
  lnF2p: ["Recorded strings and bols, not synthesised beeps. Pick your Sa on the harmonium keys, set Pa, Ma or Ni, and play any of ten taals at your laya.", "रिकॉर्ड किए तार और बोल, कृत्रिम ध्वनि नहीं। हारमोनियम की कुंजियों पर सा चुनिए, प, म या नि लगाइए, और दस में से कोई भी ताल अपनी लय में बजाइए।", "রেকর্ড করা তার ও বোল, কৃত্রিম আওয়াজ নয়। হারমোনিয়ামের চাবিতে সা বেছে নিন, প, ম বা নি লাগান, আর দশটির যেকোনো তাল নিজের লয়ে বাজান।"],
  lnF3h: ["Paltas that grade themselves", "पलटे जो स्वयं जाँचे जाते हैं", "পাল্টা যা নিজেই যাচাই হয়"],
  lnF3p: ["Sing along with a guide voice, note by note on the beat. Score 85 and the next laya opens. Pakad, guru-shishya call and response, and ear training too.", "संकेत-स्वर के साथ, ताल पर स्वर-दर-स्वर गाइए। 85 अंक पर अगली लय खुलती है। पकड़, गुरु-शिष्य प्रश्नोत्तर और कर्ण-अभ्यास भी।", "নির্দেশক স্বরের সঙ্গে তালে তালে স্বর ধরে গান। ৮৫ পেলে পরের লয় খোলে। পকড়, গুরু-শিষ্য প্রশ্নোত্তর আর শ্রবণ-অভ্যাসও।"],
  lnF4h: ["Forty-five raags, by the clock", "पैंतालीस राग, समय के अनुसार", "পঁয়তাল্লিশটি রাগ, সময় অনুযায়ী"],
  lnF4p: ["Thaat, aroh, avaroh, vadi, samvadi, mukhya ang and vishranti sthan, with sources. The raag clock shows what suits this hour.", "थाट, आरोह, अवरोह, वादी, संवादी, मुख्य अंग और विश्रांति स्थान, स्रोत सहित। राग-घड़ी बताती है कि इस प्रहर में क्या उचित है।", "ঠাট, আরোহ, অবরোহ, বাদী, সম্বাদী, মুখ্য অঙ্গ ও বিশ্রান্তি স্থান, সূত্রসহ। রাগ-ঘড়ি দেখায় এই প্রহরে কী মানায়।"],
  lnProof: ["of sung notes measured within 20 cents, on 40 real singers whose pitch was marked by musicians.", "गाए स्वर 20 सेंट के भीतर मापे गए, 40 वास्तविक गायकों पर, जिनका सुर संगीतज्ञों ने चिह्नित किया।", "গাওয়া স্বর ২০ সেন্টের মধ্যে মাপা, ৪০ জন প্রকৃত গায়কের উপর, যাঁদের সুর সংগীতজ্ঞরা চিহ্নিত করেছেন।"],
  lnProofLink: ["See how it measures", "देखिए यह कैसे मापता है", "দেখুন কীভাবে মাপে"],
  lnPrivacyH: ["Your voice stays with you", "आपकी आवाज़ आपके पास रहती है", "আপনার গলা আপনার কাছেই থাকে"],
  lnPrivacyP: ["Recordings are analysed on your device. No account, no uploads.", "रिकॉर्डिंग आपके डिवाइस पर जाँची जाती है। न खाता, न अपलोड।", "রেকর্ডিং আপনার ডিভাইসেই বিশ্লেষণ হয়। কোনো অ্যাকাউন্ট নেই, আপলোড নেই।"],
  lnGetH: ["Begin today's riyaz", "आज का रियाज़ शुरू कीजिए", "আজকের রেওয়াজ শুরু করুন"],
  lnGetP: ["Works in the browser and offline once opened. Install it for a home-screen app.", "ब्राउज़र में चलता है, और एक बार खुलने पर ऑफ़लाइन भी। होम-स्क्रीन ऐप के लिए इंस्टॉल कीजिए।", "ব্রাউজারে চলে, আর একবার খুললে অফলাইনেও। হোম-স্ক্রিন অ্যাপের জন্য ইনস্টল করুন।"],
  lnInstall: ["Install the app", "ऐप इंस्टॉल करें", "অ্যাপ ইনস্টল করুন"],
  lnAndroid: ["Download for Android", "Android के लिए डाउनलोड करें", "Android-এর জন্য ডাউনলোড করুন"],
  lnShotAlt: (s: string) => [`The ${s} screen of Naad AI on a phone`, `फ़ोन पर नाद AI की ${s} स्क्रीन`, `ফোনে নাদ AI-এর ${s} স্ক্রিন`],
  // Navigation
  journalSaved: ["Saved to your journal", "डायरी में सहेजा गया", "ডায়েরিতে সংরক্ষিত"],
  reminderAdded: ["Calendar file downloaded", "कैलेंडर फ़ाइल डाउनलोड हुई", "ক্যালেন্ডার ফাইল ডাউনলোড হয়েছে"],
  planDone: (d: number, n: number) => [`${d} of ${n} done`, `${n} में से ${d} पूरे`, `${n}টির মধ্যে ${d}টি সম্পূর্ণ`],
  navLabel: ["Main", "मुख्य", "প্রধান"],
  howItWorks: ["How Naad AI measures", "नाद AI कैसे मापता है", "নাদ AI কীভাবে মাপে"],
  accountMenu: (n: string) => [`${n}: account and more`, `${n}: खाता और अधिक`, `${n}: অ্যাকাউন্ট ও আরও`],
  close: ["Close", "बंद करें", "বন্ধ করুন"],
  short_home: ["Today", "आज", "আজ"],
  short_tanpura: ["Tanpura", "तानपुरा", "তানপুরা"],
  short_analyzer: ["Analyse", "विश्लेषण", "বিশ্লেষণ"],
  short_practice: ["Riyaz", "रियाज़", "রেওয়াজ"],
  short_library: ["Raags", "राग", "রাগ"],
  findLabel: ["Find a screen or raag", "स्क्रीन या राग खोजें", "স্ক্রিন বা রাগ খুঁজুন"],
  findPlaceholder: ["Search raags and screens", "राग और स्क्रीन खोजें", "রাগ ও স্ক্রিন খুঁজুন"],
  findShort: ["Search", "खोजें", "খুঁজুন"],
  findNone: (q: string) => [`Nothing matches "${q}".`, `"${q}" से कुछ नहीं मिला।`, `"${q}"-এর সঙ্গে কিছু মিলল না।`],
  findScreens: ["Go to", "यहाँ जाएँ", "যান"],
  findRaags: ["Raags", "राग", "রাগ"],
  saShort: (note: string, hz: string) => [`Sa ${note}, ${hz} Hz`, `सा ${note}, ${hz} Hz`, `সা ${note}, ${hz} Hz`],
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
