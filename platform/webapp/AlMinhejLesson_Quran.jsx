import React, { useState, useEffect, useMemo } from "react";
import {
  Play, Copy, Bookmark, Share2, Type, Sparkles, BookOpen, MapPin,
  Quote, Sun, Moon, NotebookPen, CircleCheck, Network, Info, Eye, EyeOff,
  ShieldCheck, GitBranch, X, Sparkle, Brain, RotateCcw, Flame, Layers,
} from "lucide-react";

/* ============================================================
   AlMinhej — Quran Page Reader

   ACCURACY RULE FOR THIS FILE — read before editing anything below:
   This renders sensitive, original scriptural text and qira'at
   (recitation-transmission) data. Nothing here is invented, guessed, or
   "filled in for completeness." Every textual/qira'at fact is either:
     (a) marked verified — checked against multiple independent
         scholarly sources before being written into this file, or
     (b) marked pending  — genuinely unverified, shown honestly as such,
         never silently assumed.
   A production build replaces "pending" entries with data sourced from
   a reviewed qira'at corpus and scholarly sign-off — never AI-generated.

   Qira'at taxonomy modeled here:
   - Ash-Shatibiyyah (حرز الأماني — Imam ash-Shatibi): the Seven Readers,
     two riwayat each = 14 riwayat.
   - Ad-Durrah (الدرة المضية — Ibn al-Jazari): the three readers who
     complete the Ten, two riwayat each = 6 riwayat.
     Shatibiyyah + Durrah together = "the Lesser Ten" (العشر الصغرى),
     one selected route (tariq) per riwayah, 20 turuq total.
   - At-Tayyibah (طيبة النشر — Ibn al-Jazari): the same Ten Readers, but
     covering far more turuq per riwayah — "the Greater Ten"
     (العشر الكبرى). This prototype models readers/riwayat, not the
     individual turuq Tayyibah adds — selecting the "Kubra" path changes
     which work is cited as the source, not which readers appear.

   Traditional order of the Ten: Nafi', Ibn Kathir, Abu 'Amr, Ibn 'Amir,
   'Asim, Hamzah, Al-Kisa'i (the Seven), then Abu Ja'far, Ya'qub,
   Khalaf al-'Ashir (completing the Ten).

   Default reading on this page: Qalun 'an Nafi' al-Madani.
   ============================================================ */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Amiri:wght@400;700&family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');`;

const T = {
  ar: {
    appName: "المنهج", lessonTag: "المصحف الشريف · سورة الفاتحة",
    mChain: "الروايات", mStudy: "الدراسة",
    riwayatEyebrow: "طرق القراءة", riwayatTitle: "روايات القرآن",
    authenticity: "كل الروايات العشر متواترة — منقولة بأسانيد صحيحة متصلة إلى النبي ﷺ.",
    activeNow: "القراءة الحالية", tabUnderstand: "التفسير", tabVocab: "المفردات", tabConnect: "الروابط", tabPractice: "التطبيق", tabLibrary: "المكتبة",
    audio: "استماع", copy: "نسخ", copied: "تم النسخ", bookmark: "حفظ", share: "مشاركة",
    showTranslation: "إظهار الترجمة", hideTranslation: "إخفاء الترجمة",
    originalLabel: "النص الأصلي · محفوظ كما هو",
    tapHint: "اضغط على أي كلمة لتكتشف معناها",
    wordsExplored: "كلمة مكتشَفة",
    aiExplanationTitle: "تفسير ميسّر", moreCommentaryTitle: "تفاسير أخرى",
    relatedTitle: "روابط ذات صلة", reflectionLabel: "خلاصة اليوم", reflectionPh: "ما الذي لفت انتباهك اليوم؟",
    actionLabel: "عمل صغير لهذا اليوم", actionPh: "مثال: تدبّر هذه السورة في الصلاة القادمة",
    companionTitle: "الرفيق", companionNote: "تبقى تفسيرات الذكاء الاصطناعي منفصلة بوضوح عن كتب التفسير المعتمدة.",
    quizCorrect: "إجابة صحيحة.", quizWrong: "تستحق نظرة أخرى — تحقق من الإجابة المُظلَّلة.",
    memorize: "الحفظ", easy: "سهل", medium: "متوسط", hard: "صعب",
    revealAll: "إظهار الكل", recitedBtn: "قرأتها", recitedCount: "مرة اليوم",
    memorizeHint: "الكلمات الباهتة مخفية — اضغط عليها لكشفها واختبار حفظك",
    notDigitizedYet: "لم تُرقمَن بعد", digitizedBadge: "مرقمنة", readPassage: "النص المرقمن",
    helpPrioritize: "صوّت لإعطاء الأولوية", voted: "تم التصويت", votesLabel: "صوت",
    goDeeper: "للتعمق أكثر", author: "المؤلف", ofUnits: "من", unitsDigitized: "مرقمَن",
    sourceEmptyNote: "لم يصل فريقنا إلى هذا الجزء بعد. تصويتك يساعدنا على ترتيب الأولويات.",
    juz: "الجزء", hizb: "الحزب", pageNo: "الصفحة", makki: "مكية", ayahCount: "آيات",
    companionPrompts: ["اشرح لي هذه السورة ببساطة", "لماذا نقرأها في كل صلاة؟", "ما الفرق بين الروايات هنا؟"],
    // Riwayat panel
    pathLabel: "المجموعة المرجعية", pathSughra: "العشر الصغرى", pathKubra: "العشر الكبرى",
    modeSingle: "رواية واحدة", modeCompare: "مقارنة", modeAll: "الكل",
    modeSingleHint: "اختر رواية واحدة لعرضها في الصفحة.",
    modeCompareHint: "اختر عدة روايات يدويًا لمقارنتها عند الضغط على ⇄.",
    modeAllHint: "تُعرض جميع الروايات العشرين عند الضغط على ⇄.",
    verifiedLegend: "موثّقة مقابل مصادر علمية — غير الموسومة بذلك بانتظار المراجعة العلمية ولم تُخترع.",
    pendingNote: "هذا الاختلاف لهذه الرواية بانتظار المراجعة العلمية — لم يُفترض أو يُخترع.",
    compareReadings: "قارن القراءات", compareTitle: "مقارنة القراءات",
    basmalaTitle: "البسملة — هل تُعدّ آية؟", malikTitle: "الآية الرابعة — مَالِكِ / مَلِكِ",
    scholarNote: "ملاحظة علمية", closeBtn: "إغلاق",
    inScope: "الروايات المعروضة الآن", verifiedBadge: "موثّقة", pendingBadge: "بانتظار المراجعة",
    citedFrom: "المصدر",
  },
  en: {
    appName: "AlMinhej", lessonTag: "The Noble Mushaf · Surah Al-Fatiha",
    mChain: "Riwayat", mStudy: "Study",
    riwayatEyebrow: "Reading traditions", riwayatTitle: "Qira'at of the Qur'an",
    authenticity: "All ten canonical qira'at are mutawatir — transmitted through unbroken, verified chains back to the Prophet ﷺ.",
    activeNow: "Currently reading", tabUnderstand: "Tafsir", tabVocab: "Vocabulary", tabConnect: "Connect", tabPractice: "Practice", tabLibrary: "Library",
    audio: "Audio", copy: "Copy", copied: "Copied", bookmark: "Bookmark", share: "Share",
    showTranslation: "Show translation", hideTranslation: "Hide translation",
    originalLabel: "Original Text · preserved exactly",
    tapHint: "Tap any word to discover its meaning",
    wordsExplored: "words discovered",
    aiExplanationTitle: "Plain-language explanation", moreCommentaryTitle: "More tafsir",
    relatedTitle: "Related", reflectionLabel: "Today's takeaway", reflectionPh: "What stood out to you today?",
    actionLabel: "One small action for today", actionPh: "e.g. reflect on this surah in your next prayer",
    companionTitle: "Companion", companionNote: "AI explanations stay clearly separate from established tafsir works.",
    quizCorrect: "That's correct.", quizWrong: "Worth another look — check the highlighted answer.",
    memorize: "Memorize", easy: "Easy", medium: "Medium", hard: "Hard",
    revealAll: "Reveal all", recitedBtn: "I recited it", recitedCount: "times today",
    memorizeHint: "Faded words are hidden — tap to reveal and test your memory",
    notDigitizedYet: "Not yet digitized", digitizedBadge: "Digitized", readPassage: "Digitized passage",
    helpPrioritize: "Vote to prioritize", voted: "Voted", votesLabel: "votes",
    goDeeper: "Go deeper", author: "Author", ofUnits: "of", unitsDigitized: "digitized",
    sourceEmptyNote: "Our team hasn't reached this part yet. Your vote helps us prioritize what to digitize next.",
    juz: "Juz'", hizb: "Hizb", pageNo: "Page", makki: "Makkan", ayahCount: "verses",
    companionPrompts: ["Explain this surah simply", "Why do we recite it in every prayer?", "What's the difference between the riwayat here?"],
    pathLabel: "Reference collection", pathSughra: "The Lesser Ten", pathKubra: "The Greater Ten",
    modeSingle: "Single riwayah", modeCompare: "Compare", modeAll: "All twenty",
    modeSingleHint: "Pick one riwayah to render on the page.",
    modeCompareHint: "Manually pick several riwayat to compare when you tap ⇄.",
    modeAllHint: "All twenty riwayat are included when you tap ⇄.",
    verifiedLegend: "Verified against scholarly sources — anything not marked is pending scholarly review, never invented.",
    pendingNote: "This riwayah's reading here is pending scholarly review — not assumed or invented.",
    compareReadings: "Compare readings", compareTitle: "Comparing readings",
    basmalaTitle: "The Basmalah — does it count as an ayah?", malikTitle: "Ayah 4 — Māliki / Maliki",
    scholarNote: "Scholarly note", closeBtn: "Close",
    inScope: "Riwayat shown now", verifiedBadge: "Verified", pendingBadge: "Pending review",
    citedFrom: "Cited from",
  },
};

/* ---- Al-Fatiha as text segments. Which segments form which numbered
   ayah depends on the active reader's counting convention — computed by
   buildDisplayAyat(), never hardcoded per-ayah. ---- */
const SEGMENTS = {
  basmala: { ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", en: "In the name of God, the Most Compassionate, the Most Merciful." },
  hamd: { ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", en: "All praise belongs to God, Lord of all the worlds." },
  rahman: { ar: "الرَّحْمَٰنِ الرَّحِيمِ", en: "The Most Compassionate, the Most Merciful." },
  malik: { ar: "مَلِكِ يَوْمِ الدِّينِ", arVariant: "مَالِكِ يَوْمِ الدِّينِ", en: "Master of the Day of Judgment.", variant: true },
  iyyaka: { ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "You alone we worship, and You alone we ask for help." },
  ihdina: { ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", en: "Guide us to the straight path." },
  siratal1: { ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ", en: "The path of those You have blessed," },
  siratal2: { ar: "غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", en: "not of those who have earned anger, nor of those who have gone astray." },
};

/* countsBasmala true (Kufi/Makki) -> Basmalah = ayah 1, final two
   segments merge into one ayah 7.
   countsBasmala false/"pending" (Madani/Basri/Shami, incl. default
   Qalun) -> Basmalah carries no ayah number; "al-hamdu" becomes ayah 1;
   the final ayah splits in two to still total seven. */
function buildDisplayAyat(countsBasmala) {
  if (countsBasmala === true) {
    return [
      { key: "basmala", marker: "١", ...SEGMENTS.basmala, isBasmala: true },
      { key: "hamd", marker: "٢", ...SEGMENTS.hamd },
      { key: "rahman", marker: "٣", ...SEGMENTS.rahman },
      { key: "malik", marker: "٤", ...SEGMENTS.malik },
      { key: "iyyaka", marker: "٥", ...SEGMENTS.iyyaka },
      { key: "ihdina", marker: "٦", ...SEGMENTS.ihdina },
      { key: "siratal", marker: "٧", ar: SEGMENTS.siratal1.ar + " " + SEGMENTS.siratal2.ar, en: SEGMENTS.siratal1.en + " " + SEGMENTS.siratal2.en },
    ];
  }
  return [
    { key: "basmala", marker: null, ...SEGMENTS.basmala, isBasmala: true },
    { key: "hamd", marker: "١", ...SEGMENTS.hamd },
    { key: "rahman", marker: "٢", ...SEGMENTS.rahman },
    { key: "malik", marker: "٣", ...SEGMENTS.malik },
    { key: "iyyaka", marker: "٤", ...SEGMENTS.iyyaka },
    { key: "ihdina", marker: "٥", ...SEGMENTS.ihdina },
    { key: "siratal1", marker: "٦", ...SEGMENTS.siratal1 },
    { key: "siratal2", marker: "٧", ...SEGMENTS.siratal2 },
  ];
}

const BASMALA_NOTE = {
  ar: "كل القراء متفقون أن الفاتحة سبع آيات، لكنهم يختلفون في عدّها: عند الكوفيين (عاصم وحمزة والكسائي) والمكي (ابن كثير) تُعدّ البسملة الآية الأولى، وتنتهي السورة بآية سابعة واحدة. أما عند المدني (نافع: قالون وورش) فلا تُعدّ البسملة آية، فتبدأ الآية الأولى بـ«الحمد لله ربّ العالمين»، ويُعوَّض عن ذلك بتقسيم الآية الأخيرة إلى آيتين عند أول «عليهم».",
  en: "All readers agree Al-Fatiha has seven ayahs, but count them differently: for the Kufan riwayat ('Asim, Hamzah, Al-Kisa'i) and the Makkan riwayah (Ibn Kathir), the Basmalah is ayah one, ending with a single seventh ayah. For the Madani riwayat (Nafi': Qalun and Warsh), the Basmalah is not counted — ayah one begins with \"All praise belongs to God\" — and to still reach seven, the final ayah splits in two at the first \"'alayhim.\"",
  pendingReaders: "الحكم في هذه المسألة لأبي عمرو وابن عامر وأبي جعفر ويعقوب وخلف العاشر بانتظار المراجعة العلمية في هذا العرض التجريبي.",
  pendingReadersEn: "The convention for Abu 'Amr, Ibn 'Amir, Abu Ja'far, Ya'qub, and Khalaf al-'Ashir is pending scholarly review in this prototype — not assumed.",
};

const READERS = [
  {
    id: "nafi", order: 1, collection: "shatibiyyah", countsBasmala: false,
    ar: "نافع", en: "Nafi'", cityAr: "المدني", cityEn: "Madani",
    riwayat: [
      { id: "qalun", ar: "قالون", en: "Qalun", variant: "verified", variantAr: "مَلِكِ", variantEn: "Maliki — without the long ā",
        note: "شائعة تاريخيًا في ليبيا وتونس وأجزاء من شمال إفريقيا", noteEn: "Historically common in Libya, Tunisia, and parts of North Africa" },
      { id: "warsh", ar: "ورش", en: "Warsh", variant: "verified", variantAr: "مَلِكِ", variantEn: "Maliki — without the long ā",
        note: "الأكثر انتشارًا في شمال وغرب إفريقيا", noteEn: "Most widespread across North and West Africa" },
    ],
  },
  {
    id: "ibnkathir", order: 2, collection: "shatibiyyah", countsBasmala: true,
    ar: "ابن كثير", en: "Ibn Kathir", cityAr: "المكي", cityEn: "Makki",
    riwayat: [
      { id: "bazzi", ar: "البزّي", en: "Al-Bazzi", variant: "pending" },
      { id: "qunbul", ar: "قنبل", en: "Qunbul", variant: "pending" },
    ],
  },
  {
    id: "abuamr", order: 3, collection: "shatibiyyah", countsBasmala: false,
    ar: "أبو عمرو", en: "Abu 'Amr", cityAr: "البصري", cityEn: "Basri",
    riwayat: [
      { id: "duri_abuamr", ar: "الدوري", en: "Ad-Duri", variant: "pending" },
      { id: "susi", ar: "السوسي", en: "As-Susi", variant: "pending" },
    ],
  },
  {
    id: "ibnamir", order: 4, collection: "shatibiyyah", countsBasmala: false,
    ar: "ابن عامر", en: "Ibn 'Amir", cityAr: "الشامي", cityEn: "Shami",
    riwayat: [
      { id: "hisham", ar: "هشام", en: "Hisham", variant: "pending" },
      { id: "ibndhakwan", ar: "ابن ذكوان", en: "Ibn Dhakwan", variant: "pending" },
    ],
  },
  {
    id: "asim", order: 5, collection: "shatibiyyah", countsBasmala: true,
    ar: "عاصم", en: "'Asim", cityAr: "الكوفي", cityEn: "Kufi",
    riwayat: [
      { id: "shubah", ar: "شعبة", en: "Shu'bah", variant: "pending" },
      { id: "hafs", ar: "حفص", en: "Hafs", variant: "verified", variantAr: "مَالِكِ", variantEn: "Māliki — with the long ā",
        note: "الأكثر انتشارًا؛ المعتمدة في الحرمين وأغلب المصاحف المطبوعة", noteEn: "Most widespread; used in the Haramayn and most printed Mushafs" },
    ],
  },
  {
    id: "hamzah", order: 6, collection: "shatibiyyah", countsBasmala: true,
    ar: "حمزة", en: "Hamzah", cityAr: "الكوفي", cityEn: "Kufi",
    riwayat: [
      { id: "khalaf_hamzah", ar: "خلف", en: "Khalaf", variant: "pending" },
      { id: "khallad", ar: "خلاد", en: "Khallad", variant: "pending" },
    ],
  },
  {
    id: "kisai", order: 7, collection: "shatibiyyah", countsBasmala: true,
    ar: "الكسائي", en: "Al-Kisa'i", cityAr: "الكوفي", cityEn: "Kufi",
    riwayat: [
      { id: "abualharith", ar: "أبو الحارث", en: "Abu al-Harith", variant: "pending" },
      { id: "duri_kisai", ar: "الدوري", en: "Ad-Duri", variant: "pending",
        note: "راوٍ آخر باسم «الدوري»، غير الدوري عن أبي عمرو أعلاه", noteEn: "A different narrator also called \"al-Duri\" — not the same person as Abu 'Amr's al-Duri above." },
    ],
  },
  {
    id: "abujafar", order: 8, collection: "durrah", countsBasmala: "pending",
    ar: "أبو جعفر", en: "Abu Ja'far", cityAr: "المدني", cityEn: "Madani",
    riwayat: [
      { id: "ibnwardan", ar: "ابن وردان", en: "Ibn Wardan", variant: "pending" },
      { id: "ibnjammaz", ar: "ابن جمّاز", en: "Ibn Jammaz", variant: "pending" },
    ],
  },
  {
    id: "yaqub", order: 9, collection: "durrah", countsBasmala: "pending",
    ar: "يعقوب", en: "Ya'qub", cityAr: "البصري", cityEn: "Basri",
    riwayat: [
      { id: "ruways", ar: "رويس", en: "Ruways", variant: "pending" },
      { id: "rawh", ar: "روح", en: "Rawh", variant: "pending" },
    ],
  },
  {
    id: "khalaf_ashir", order: 10, collection: "durrah", countsBasmala: "pending",
    ar: "خلف العاشر", en: "Khalaf al-'Ashir", cityAr: "الكوفي", cityEn: "Kufi",
    riwayat: [
      { id: "ishaq", ar: "إسحاق", en: "Ishaq", variant: "pending" },
      { id: "idris", ar: "إدريس", en: "Idris", variant: "pending" },
    ],
  },
];

const COLLECTIONS = {
  shatibiyyah: { ar: "الشاطبية · السبع", en: "Ash-Shatibiyyah · The Seven", countAr: "٧ قراءات، ١٤ رواية", countEn: "7 qira'at, 14 riwayat" },
  durrah: { ar: "الدرة · تكملة العشر", en: "Ad-Durrah · Completing the Ten", countAr: "٣ قراءات، ٦ روايات", countEn: "3 qira'at, 6 riwayat" },
};

const QIRAAT_PATHS = {
  sughra: {
    ar: "العشر الصغرى", en: "The Lesser Ten",
    subtitleAr: "الشاطبية (السبع) + الدرة (تكملة العشر)", subtitleEn: "Ash-Shatibiyyah (the Seven) + Ad-Durrah (completing the Ten)",
    descAr: "طريق واحد مختار لكل رواية — ٢٠ طريقًا إجمالًا.", descEn: "One selected route per riwayah — 20 turuq in total.",
  },
  kubra: {
    ar: "العشر الكبرى", en: "The Greater Ten",
    subtitleAr: "طيبة النشر — ابن الجزري", subtitleEn: "At-Tayyibah (Tayyibat an-Nashr) — Ibn al-Jazari",
    descAr: "نفس القراء العشرة، لكن بعدد أكبر بكثير من الطرق لكل رواية.", descEn: "The same ten readers, but with far more turuq per riwayah than the Lesser Ten selects.",
  },
};

function sourceLabelFor(reader, path) {
  if (path === "kubra") return { ar: "طيبة النشر", en: "At-Tayyibah" };
  return reader.collection === "durrah" ? { ar: "الدرة", en: "Ad-Durrah" } : { ar: "الشاطبية", en: "Ash-Shatibiyyah" };
}

const ALL_RIWAYAT = READERS.flatMap((rdr) =>
  rdr.riwayat.map((rw) => ({ ...rw, readerId: rdr.id, readerAr: rdr.ar, readerEn: rdr.en, collection: rdr.collection, countsBasmala: rdr.countsBasmala }))
);

const VOCAB = [
  { id: "hamd", word: "الْحَمْدُ", root: "ح-م-د", pron: "al-hamdu", occ: 1, en: "praise, gratitude", ar: "الثناء والشكر" },
  { id: "rabb", word: "رَبِّ", root: "ر-ب-ب", pron: "rabbi", occ: 1, en: "Lord, Sustainer", ar: "المالك والمربّي والمدبّر" },
  { id: "rahman", word: "الرَّحْمَٰنِ", root: "ر-ح-م", pron: "ar-raḥmān", occ: 1, en: "The Most Compassionate", ar: "واسع الرحمة بجميع الخلق" },
  { id: "malik", word: "مَلِكِ", root: "م-ل-ك", pron: "maliki", occ: 1, en: "Master, Sovereign", ar: "المتصرّف المالك للأمر كله" },
  { id: "nastain", word: "نَسْتَعِينُ", root: "ع-و-ن", pron: "nasta'īn", occ: 1, en: "we seek help", ar: "نطلب العون والمعونة" },
  { id: "sirat", word: "الصِّرَاطَ", root: "ص-ر-ط", pron: "aṣ-ṣirāṭ", occ: 2, en: "the path", ar: "الطريق الواضح" },
  { id: "dallin", word: "الضَّالِّينَ", root: "ض-ل-ل", pron: "aḍ-ḍāllīn", occ: 1, en: "those who are astray", ar: "من ضلّ عن الطريق الصحيح" },
];

const TAFSIR = [
  {
    id: "ibnkathir", scholar: "ابن كثير", scholarEn: "Ibn Kathir", work: "تفسير القرآن العظيم", workEn: "Tafsir Ibn Kathir",
    note: {
      ar: "يبيّن أن الفاتحة جمعت أنواع التوحيد الثلاثة، وسُمّيت أمّ الكتاب لاشتمالها على مقاصد القرآن كله.",
      en: "Explains that Al-Fatiha gathers the core themes of the whole Qur'an in miniature — praise, sovereignty, worship, and the request for guidance — which is why it's called 'the Mother of the Book.'",
    },
  },
  {
    id: "tabari", scholar: "الطبري", scholarEn: "At-Tabari", work: "جامع البيان", workEn: "Tafsir al-Tabari",
    note: {
      ar: "يذكر عدة أقوال في معنى «مالك يوم الدين»، ويرجّح أن الملك والمالك كلاهما صحيح المعنى، إذ لا مالك يوم القيامة إلا الله.",
      en: "Records several early interpretive traditions on 'Master of the Day of Judgment,' concluding that on that day, sovereignty and possession belong to God alone — which is why both canonical readings converge on the same meaning.",
    },
  },
];

const RELATED = [
  { id: "hadith-prayer", type: "hadith", ar: "لا صلاة لمن لم يقرأ بفاتحة الكتاب", en: "There is no prayer for the one who does not recite the Opening of the Book.", src: { ar: "متفق عليه", en: "Sahih al-Bukhari & Muslim" } },
  { id: "surah-baqarah", type: "surah", ar: "سورة البقرة", en: "Surah Al-Baqarah", note: { ar: "السورة التالية، تبدأ بالحديث عن الهداية التي طلبتها الفاتحة", en: "The surah that follows — opens by describing the very guidance Al-Fatiha asks for." } },
  { id: "concept-tawhid", type: "concept", ar: "التوحيد", en: "Tawhid", note: { ar: "إفراد الله بالعبادة والربوبية والأسماء والصفات", en: "Affirming God's oneness in lordship, worship, and attributes." } },
];

const SOURCES = {
  ibnkathir: { id: "ibnkathir", ar: "تفسير ابن كثير", en: "Tafsir Ibn Kathir", authorAr: "ابن كثير", authorEn: "Ibn Kathir", era: "701–774 AH", total: 114, indexed: 1, unit: { ar: "سورة", en: "surahs" } },
  tabari: { id: "tabari", ar: "تفسير الطبري", en: "Tafsir al-Tabari", authorAr: "الإمام الطبري", authorEn: "Imam at-Tabari", era: "224–310 AH", total: 114, indexed: 1, unit: { ar: "سورة", en: "surahs" } },
  qurtubi: { id: "qurtubi", ar: "تفسير القرطبي", en: "Tafsir al-Qurtubi", authorAr: "الإمام القرطبي", authorEn: "Imam al-Qurtubi", era: "d. 671 AH", total: 114, indexed: 0, unit: { ar: "سورة", en: "surahs" } },
  razi: { id: "razi", ar: "مفاتيح الغيب", en: "Tafsir al-Razi", authorAr: "فخر الدين الرازي", authorEn: "Fakhr ad-Din ar-Razi", era: "544–606 AH", total: 114, indexed: 0, unit: { ar: "سورة", en: "surahs" } },
  baghawi: { id: "baghawi", ar: "تفسير البغوي", en: "Tafsir al-Baghawi", authorAr: "الإمام البغوي", authorEn: "Imam al-Baghawi", era: "d. 516 AH", total: 114, indexed: 0, unit: { ar: "سورة", en: "surahs" } },
};

const QUIZ = [
  { q: { ar: "كم عدد آيات سورة الفاتحة؟", en: "How many ayahs does Surah Al-Fatiha have?" }, options: [{ ar: "٦", en: "6" }, { ar: "٧", en: "7" }, { ar: "٨", en: "8" }], correct: 1 },
  { q: { ar: "ماذا نطلب في «اهدنا الصراط المستقيم»؟", en: "What does 'Guide us to the straight path' ask for?" }, options: [{ ar: "المغفرة", en: "Forgiveness" }, { ar: "الرزق", en: "Provision" }, { ar: "الهداية", en: "Guidance" }], correct: 2 },
];

const COMPANION_ANSWERS = {
  ar: [
    "الفاتحة سبع آيات تفتتح كل صلاة: تبدأ بالثناء على الله، ثم تُقرّ أنه وحده المستحق للعبادة والاستعانة، ثم تطلب الهداية إلى الطريق الصحيح — وهذا هو محور القرآن كله في سبع آيات.",
    "لأن النبي ﷺ قال إنه لا صلاة صحيحة بلا قراءتها — فهي ركن من أركان الصلاة، تُقرأ في كل ركعة تقريبًا، فيكررها المسلم أكثر من أي نص آخر في حياته.",
    "الاختلاف الأشهر هنا في كلمة واحدة: «مالك» بالألف عند حفص، و«ملك» بدونها عند ورش وقالون. كلا اللفظين صحيحان متواتران، والمعنى يتقارب: من يملك يوم الدين ويتصرف فيه هو الله وحده. وهناك اختلاف آخر في عدّ البسملة آية، تجده في تبويب الروايات.",
  ],
  en: [
    "Al-Fatiha is seven ayahs that open every prayer: it begins with praise of God, affirms that He alone deserves worship and is sought for help, then asks for guidance to the right path — the whole Qur'an's core message, in seven lines.",
    "Because the Prophet ﷺ said there is no valid prayer without reciting it — it's a pillar of the prayer itself, repeated in nearly every rak'ah, making it the most-recited passage in a Muslim's life.",
    "The most famous difference here is a single word: 'Māliki' (with a long ā) in Hafs's reading, 'Maliki' (without it) in Warsh's and Qalun's — both authentically transmitted, meaning converging either way. There's also a difference in whether the Basmalah is counted as an ayah — see the Riwayat panel for that one.",
  ],
};

function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 1040 : false);
  useEffect(() => {
    const f = () => setM(window.innerWidth < 1040);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return m;
}

function isOccluded(index, difficulty) {
  const hash = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
  return hash < difficulty;
}

function sourcePct(s) {
  if (!s || !s.total) return 0;
  return (s.indexed / s.total) * 100;
}
function formatPct(pct, indexed) {
  if (indexed > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export default function AlMinhejQuran() {
  const [dark, setDark] = useState(false);
  const [uiLang, setUiLang] = useState("ar");
  const [showTranslation, setShowTranslation] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [hoverVocab, setHoverVocab] = useState(null);
  const [discovered, setDiscovered] = useState(new Set());
  const [rightTab, setRightTab] = useState("understand");
  const [activeGraphNode, setActiveGraphNode] = useState(null);
  const [takeaway, setTakeaway] = useState("");
  const [actionItem, setActionItem] = useState("");
  const [quizState, setQuizState] = useState({});
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [companionPrompt, setCompanionPrompt] = useState(null);
  const [sheet, setSheet] = useState(null); // null | 'chain' | 'study'

  const [activeRiwayah, setActiveRiwayah] = useState("qalun");
  const [qiraatPath, setQiraatPath] = useState("sughra"); // sughra | kubra
  const [riwayatMode, setRiwayatMode] = useState("single"); // single | compare | all
  const [compareSelection, setCompareSelection] = useState(new Set(["hafs", "warsh", "qalun"]));
  const [qiraatCompareFor, setQiraatCompareFor] = useState(null); // 'basmala' | 'malik' | null

  const [memorize, setMemorize] = useState(false);
  const [difficulty, setDifficulty] = useState(0.35);
  const [revealed, setRevealed] = useState(new Set());
  const [reciteCount, setReciteCount] = useState(0);

  const [activeSource, setActiveSource] = useState(null);
  const [votes, setVotes] = useState({});
  const [voted, setVoted] = useState(new Set());

  const isCompact = useIsMobile();
  const t = T[uiLang];
  const dir = uiLang === "ar" ? "rtl" : "ltr";

  const c = dark
    ? { bg: "#0F1512", panel: "#182420", panel2: "#1E2C26", page: "#1B2621", ink: "#F2ECDD", sub: "#9FB0A6", line: "rgba(244,239,226,0.12)", emerald: "#3E8C6F", gold: "#D9B876" }
    : { bg: "#F1ECDD", panel: "#FFFFFF", panel2: "#F3EEE0", page: "#FCF9F0", ink: "#241F17", sub: "#6B6152", line: "rgba(36,31,23,0.12)", emerald: "#0E4F3F", gold: "#A9782E" };

  const HEADER_H = 56;
  const paneStyle = { background: c.bg, color: c.ink, height: "100%", overflowY: "auto" };
  const uiFont = uiLang === "ar" ? "'Cairo', 'Inter', sans-serif" : "'Inter', sans-serif";

  const vocabByWord = useMemo(() => {
    const m = {};
    VOCAB.forEach((v) => (m[v.word] = v));
    return m;
  }, []);

  const activeR = ALL_RIWAYAT.find((r) => r.id === activeRiwayah) || ALL_RIWAYAT.find((r) => r.id === "qalun");
  const usesMalikVariant = activeR.variant === "verified" && activeR.variantAr === "مَالِكِ";

  const displayAyat = useMemo(() => buildDisplayAyat(activeR.countsBasmala), [activeR.countsBasmala]);

  const onVocabClick = (id) => {
    setHoverVocab((h) => (h === id ? null : id));
    setDiscovered((d) => new Set(d).add(id));
  };

  const words = useMemo(() => {
    const list = [];
    let idx = 0;
    displayAyat.forEach((ay) => {
      const text = usesMalikVariant && ay.variant ? ay.arVariant : ay.ar;
      text.split(" ").forEach((w) => {
        list.push({ key: `${ay.key}-${idx}`, raw: w, clean: w.replace(/[،,.:]/g, ""), idx, ayah: ay.key });
        idx += 1;
      });
    });
    return list;
  }, [displayAyat, usesMalikVariant]);

  const enterMemorize = () => {
    setMemorize(true);
    setShowTranslation(false);
    setRevealed(new Set());
  };

  const castVote = (sourceId) => {
    if (voted.has(sourceId)) return;
    setVoted((v) => new Set(v).add(sourceId));
    setVotes((v) => ({ ...v, [sourceId]: (v[sourceId] || 0) + 1 }));
  };

  const deeperSource = Object.values(SOURCES).find((s) => s.indexed === 0);

  return (
    <div dir={dir} style={{ height: "100vh", width: "100%", background: c.bg, color: c.ink, fontFamily: uiFont, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{FONT_IMPORT}{`
        .amiri { font-family: 'Amiri', serif; }
        .fraunces { font-family: 'Fraunces', serif; }
        * { box-sizing: border-box; }
        ::selection { background: ${c.gold}55; }
        .scroller::-webkit-scrollbar { width: 7px; }
        .scroller::-webkit-scrollbar-thumb { background: ${c.line}; border-radius: 8px; }
        .vocab-word { cursor: pointer; border-bottom: 1.5px dotted ${c.gold}; transition: color .2s; }
        .vocab-word:hover { color: ${c.gold}; }
        .pill { font-size:11.5px; padding:6px 11px; border-radius:999px; cursor:pointer; transition:all .15s; border:1px solid ${c.line}; background:transparent; color:${c.sub}; white-space:nowrap; font-family: inherit; }
        .pill.active { background:${c.emerald}; color:#F4EFE2; border-color:${c.emerald}; }
        .occluded-word { filter: blur(5px); opacity: .55; cursor: pointer; transition: filter .25s, opacity .25s; }
        .occluded-word.revealed { filter: blur(0); opacity: 1; }
        .ayah-marker { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:999px; border:1.5px solid ${c.gold}; color:${c.gold}; font-size:11px; margin: 0 4px; vertical-align:middle; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      {/* HEADER */}
      <header style={{ height: HEADER_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${c.line}`, flexShrink: 0, background: c.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: c.emerald, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <span className="amiri" style={{ color: c.gold, fontSize: 15 }}>ن</span>
          </div>
          <span className="fraunces" style={{ fontSize: 17, fontWeight: 600 }}>{t.appName}</span>
          {!isCompact && <span style={{ fontSize: 11.5, color: c.sub, borderInlineStart: `1px solid ${c.line}`, paddingInlineStart: 10 }}>{t.lessonTag}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {discovered.size > 0 && (
            <div style={{ fontSize: 10.5, color: c.gold, background: `${c.gold}18`, borderRadius: 999, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkle size={11} /> {discovered.size}/{VOCAB.length} {t.wordsExplored}
            </div>
          )}
          <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: `1px solid ${c.line}` }}>
            {["ar", "en"].map((l) => (
              <button key={l} onClick={() => setUiLang(l)}
                style={{ fontSize: 11, padding: "7px 9px", border: "none", cursor: "pointer", fontFamily: l === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif",
                  background: uiLang === l ? c.emerald : c.panel2, color: uiLang === l ? "#F4EFE2" : c.sub }}>
                {l === "ar" ? "AR" : "EN"}
              </button>
            ))}
          </div>
          <button onClick={() => setDark((d) => !d)} aria-label="Toggle dark mode" style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: c.panel2, border: `1px solid ${c.line}`, cursor: "pointer" }}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* page chrome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: `1px solid ${c.line}`, background: c.panel2, flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: c.sub }}>
          <span style={{ fontWeight: 700, color: c.ink }}>{uiLang === "ar" ? "سورة الفاتحة" : "Surah Al-Fatiha"}</span>
          {" · "}{t.makki} · ٧ {t.ayahCount}
        </div>
        <div style={{ fontSize: 10.5, color: c.sub }}>
          {t.juz} ١ · {t.hizb} ١ · {t.pageNo} ١
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* LEFT — Riwayat */}
        {!isCompact && (
          <aside className="scroller" style={{ ...paneStyle, width: 320, flexShrink: 0, borderInlineEnd: `1px solid ${c.line}`, padding: 18 }}>
            <RiwayatPanel c={c} t={t} uiLang={uiLang} dir={dir}
              activeRiwayah={activeRiwayah} setActiveRiwayah={setActiveRiwayah}
              riwayatMode={riwayatMode} setRiwayatMode={setRiwayatMode}
              compareSelection={compareSelection} setCompareSelection={setCompareSelection}
              qiraatPath={qiraatPath} setQiraatPath={setQiraatPath} />
          </aside>
        )}
        {isCompact && (
          <>
            {sheet === "chain" && (
              <div onClick={() => setSheet(null)} style={{ position: "fixed", inset: 0, bottom: 56, background: "rgba(0,0,0,.5)", zIndex: 70 }} />
            )}
            <aside className="scroller" style={{
              ...paneStyle, position: "fixed", insetInline: 0, bottom: 56, height: "76vh", maxHeight: "76vh",
              borderRadius: "20px 20px 0 0", borderTop: `1px solid ${c.line}`, boxShadow: "0 -12px 34px -12px rgba(0,0,0,.35)",
              zIndex: 75, padding: 18, paddingTop: 10, transform: sheet === "chain" ? "translateY(0)" : "translateY(110%)",
              transition: "transform .32s cubic-bezier(.32,.72,0,1)",
            }}>
              <SheetHandle c={c} title={t.riwayatEyebrow} onClose={() => setSheet(null)} />
              <RiwayatPanel c={c} t={t} uiLang={uiLang} dir={dir}
                activeRiwayah={activeRiwayah} setActiveRiwayah={setActiveRiwayah}
                riwayatMode={riwayatMode} setRiwayatMode={setRiwayatMode}
                compareSelection={compareSelection} setCompareSelection={setCompareSelection}
                qiraatPath={qiraatPath} setQiraatPath={setQiraatPath} />
            </aside>
          </>
        )}

        {/* CENTER — Mushaf page */}
        <main className="scroller" style={{ ...paneStyle, flex: 1, minWidth: 0, padding: `26px 6vw ${isCompact ? 76 : 26}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 18, width: "100%" }}>
            {[
              { icon: <Play size={13} />, label: t.audio },
              { icon: <Copy size={13} />, label: copied ? t.copied : t.copy, onClick: () => { setCopied(true); setTimeout(() => setCopied(false), 1200); } },
              { icon: <Bookmark size={13} fill={bookmarked ? c.gold : "none"} />, label: t.bookmark, onClick: () => setBookmarked((b) => !b) },
              { icon: <Share2 size={13} />, label: t.share },
            ].map((b) => (
              <button key={b.label} onClick={b.onClick} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, padding: "6px 12px", borderRadius: 999, background: c.panel2, border: `1px solid ${c.line}`, color: c.ink, cursor: "pointer", fontFamily: "inherit" }}>
                {b.icon}{b.label}
              </button>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 999, padding: "4px 8px" }}>
              <Type size={12} />
              <button onClick={() => setFontScale((s) => Math.max(0.8, s - 0.1))} style={{ background: "none", border: "none", cursor: "pointer", color: c.ink, fontSize: 13, padding: "0 4px" }}>–</button>
              <button onClick={() => setFontScale((s) => Math.min(1.5, s + 0.1))} style={{ background: "none", border: "none", cursor: "pointer", color: c.ink, fontSize: 13, padding: "0 4px" }}>+</button>
            </div>
            {!memorize && (
              <button onClick={() => setShowTranslation((s) => !s)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                  background: showTranslation ? c.gold : c.panel2, color: showTranslation ? "#241c0a" : c.ink, border: `1px solid ${showTranslation ? c.gold : c.line}` }}>
                {showTranslation ? <EyeOff size={13} /> : <Eye size={13} />} {showTranslation ? t.hideTranslation : t.showTranslation}
              </button>
            )}
            <button onClick={() => (memorize ? setMemorize(false) : enterMemorize())}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                background: memorize ? c.emerald : c.panel2, color: memorize ? "#F4EFE2" : c.ink, border: `1px solid ${memorize ? c.emerald : c.line}` }}>
              <Brain size={13} /> {t.memorize}
            </button>
          </div>

          {memorize && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap", justifyContent: "center" }}>
              {[["easy", 0.2], ["medium", 0.4], ["hard", 0.65]].map(([key, val]) => (
                <button key={key} className={`pill ${Math.abs(difficulty - val) < 0.01 ? "active" : ""}`}
                  onClick={() => { setDifficulty(val); setRevealed(new Set()); }}>{t[key]}</button>
              ))}
              <button onClick={() => setRevealed(new Set(words.map((w) => w.key)))} className="pill" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <RotateCcw size={11} /> {t.revealAll}
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, color: c.gold }}>{t.originalLabel}</span>
          </div>
          <div style={{ textAlign: "center", marginBottom: 18, fontSize: 11, color: c.sub, opacity: 0.85, maxWidth: 460 }}>
            {memorize ? t.memorizeHint : t.tapHint}
          </div>

          {/* the Mushaf page */}
          <div style={{
            width: "100%", maxWidth: 640, background: c.page, border: `1px solid ${c.line}`, borderRadius: 8,
            padding: isCompact ? "26px 20px" : "42px 46px", boxShadow: memorize ? `0 0 0 2px ${c.emerald}33` : "0 20px 50px -30px rgba(0,0,0,.4)",
            transition: "box-shadow .3s",
          }}>
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <div style={{ display: "inline-block", border: `1.5px solid ${c.gold}77`, borderRadius: 10, padding: "8px 26px" }}>
                <div className="amiri" style={{ fontSize: 18, color: c.gold }}>سُورَةُ الْفَاتِحَةِ</div>
                <div style={{ fontSize: 9, color: c.sub, letterSpacing: 1, marginTop: 2 }}>{uiLang === "ar" ? "مكية · سبع آيات" : "Makkan · 7 verses"}</div>
              </div>
            </div>

            <p dir="rtl" className="amiri" style={{ fontSize: (isCompact ? 22 : 26) * fontScale, lineHeight: 2.1, textAlign: "center", margin: 0 }}>
              {displayAyat.map((ay) => {
                const ayahWords = words.filter((w) => w.ayah === ay.key);
                return (
                  <span key={ay.key}>
                    {ayahWords.map((w) => {
                      const v = vocabByWord[w.clean];
                      const occluded = memorize && isOccluded(w.idx, difficulty);
                      const isRevealed = revealed.has(w.key);
                      const content = (
                        <span
                          className={occluded ? `occluded-word${isRevealed ? " revealed" : ""}` : ""}
                          onClick={(e) => {
                            if (occluded) { e.stopPropagation(); setRevealed((r) => { const n = new Set(r); n.has(w.key) ? n.delete(w.key) : n.add(w.key); return n; }); return; }
                            if (v) { e.stopPropagation(); setHoverVocab((h) => (h === v.id ? null : v.id)); onVocabClick(v.id); }
                          }}
                        >
                          {w.raw}
                        </span>
                      );
                      if (v && !occluded) {
                        return (
                          <span key={w.key}>
                            <span className="vocab-word" style={{ position: "relative" }} onMouseEnter={() => setHoverVocab(v.id)} onMouseLeave={() => setHoverVocab(null)}>
                              {content}
                              {hoverVocab === v.id && <VocabPopover v={v} c={c} uiLang={uiLang} />}
                            </span>{" "}
                          </span>
                        );
                      }
                      return <span key={w.key}>{content} </span>;
                    })}
                    {ay.marker && <span className="ayah-marker">{ay.marker}</span>}
                    {ay.isBasmala && !ay.marker && (
                      <span style={{ fontSize: 9.5, color: c.sub, opacity: 0.75, verticalAlign: "middle" }}>
                        {uiLang === "ar" ? "(افتتاحية، غير معدودة)" : "(opening, not numbered)"}
                      </span>
                    )}
                    {(ay.key === "basmala" || ay.key === "malik") && (
                      <button
                        onClick={() => setQiraatCompareFor(ay.key)}
                        title={t.compareReadings}
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20,
                          borderRadius: 999, border: `1px solid ${c.gold}88`, background: `${c.gold}1a`, color: c.gold,
                          fontSize: 10, cursor: "pointer", verticalAlign: "middle", marginInlineStart: 2, fontFamily: "inherit",
                        }}
                      >
                        ⇄
                      </button>
                    )}{" "}
                  </span>
                );
              })}
            </p>

            {!memorize && showTranslation && (
              <div style={{ marginTop: 22, borderTop: `1px dashed ${c.line}`, paddingTop: 16 }}>
                {displayAyat.map((ay) => (
                  <p key={ay.key} style={{ fontSize: 12.5, color: c.sub, fontStyle: "italic", lineHeight: 1.7, marginBottom: 6 }}>
                    <b style={{ color: c.gold, fontStyle: "normal" }}>{ay.marker ?? "—"}.</b> {ay.en}
                  </p>
                ))}
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 30, fontSize: 10.5, color: c.sub, borderTop: `1px dashed ${c.line}`, paddingTop: 10 }}>١</div>
          </div>

          {memorize && (
            <button onClick={() => setReciteCount((n) => n + 1)}
              style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", background: c.gold, color: "#241c0a", border: "none" }}>
              <Flame size={15} /> {t.recitedBtn} {reciteCount > 0 && `· ${reciteCount} ${t.recitedCount}`}
            </button>
          )}
        </main>

        {/* RIGHT — study panel */}
        {!isCompact && (
          <aside className="scroller" style={{ ...paneStyle, width: 340, flexShrink: 0, borderInlineStart: `1px solid ${c.line}`, padding: 18 }}>
            <StudyContent c={c} t={t} uiLang={uiLang} dir={dir}
              rightTab={rightTab} setRightTab={setRightTab} discovered={discovered} onVocabClick={onVocabClick}
              activeGraphNode={activeGraphNode} setActiveGraphNode={setActiveGraphNode}
              takeaway={takeaway} setTakeaway={setTakeaway} actionItem={actionItem} setActionItem={setActionItem}
              quizState={quizState} setQuizState={setQuizState} setActiveSource={setActiveSource} deeperSource={deeperSource} />
          </aside>
        )}
        {isCompact && (
          <>
            {sheet === "study" && (
              <div onClick={() => setSheet(null)} style={{ position: "fixed", inset: 0, bottom: 56, background: "rgba(0,0,0,.5)", zIndex: 70 }} />
            )}
            <aside className="scroller" style={{
              ...paneStyle, position: "fixed", insetInline: 0, bottom: 56, height: "76vh", maxHeight: "76vh",
              borderRadius: "20px 20px 0 0", borderTop: `1px solid ${c.line}`, boxShadow: "0 -12px 34px -12px rgba(0,0,0,.35)",
              zIndex: 75, padding: 18, paddingTop: 10, transform: sheet === "study" ? "translateY(0)" : "translateY(110%)",
              transition: "transform .32s cubic-bezier(.32,.72,0,1)",
            }}>
              <SheetHandle c={c} title={t.mStudy} onClose={() => setSheet(null)} />
              <StudyContent c={c} t={t} uiLang={uiLang} dir={dir}
                rightTab={rightTab} setRightTab={setRightTab} discovered={discovered} onVocabClick={onVocabClick}
                activeGraphNode={activeGraphNode} setActiveGraphNode={setActiveGraphNode}
                takeaway={takeaway} setTakeaway={setTakeaway} actionItem={actionItem} setActionItem={setActionItem}
                quizState={quizState} setQuizState={setQuizState} setActiveSource={setActiveSource} deeperSource={deeperSource} />
            </aside>
          </>
        )}
      </div>

      {isCompact && (
        <nav style={{ position: "fixed", bottom: 0, insetInline: 0, height: 56, zIndex: 76, display: "flex", background: c.panel, borderTop: `1px solid ${c.line}` }}>
          <BottomTabButton active={sheet === "chain"} icon={<GitBranch size={17} />} label={t.mChain} c={c} onClick={() => setSheet((s) => (s === "chain" ? null : "chain"))} />
          <div style={{ width: 1, background: c.line, margin: "10px 0" }} />
          <BottomTabButton active={sheet === "study"} icon={<BookOpen size={17} />} label={t.mStudy} c={c} onClick={() => setSheet((s) => (s === "study" ? null : "study"))} />
        </nav>
      )}

      {/* Qira'at comparison panel */}
      {qiraatCompareFor && (
        <QiraatComparePanel c={c} t={t} uiLang={uiLang} dir={dir} isCompact={isCompact}
          forSegment={qiraatCompareFor} mode={riwayatMode} activeRiwayah={activeRiwayah}
          compareSelection={compareSelection} qiraatPath={qiraatPath}
          onClose={() => setQiraatCompareFor(null)} />
      )}

      {/* Source modal */}
      {activeSource && SOURCES[activeSource] && (
        <SourceDetailModal c={c} t={t} uiLang={uiLang} dir={dir} source={SOURCES[activeSource]} onClose={() => setActiveSource(null)}
          onVote={castVote} voted={voted.has(activeSource)} voteCount={votes[activeSource] || 0} />
      )}

      {/* Companion */}
      <button onClick={() => setCompanionOpen((v) => !v)}
        style={{ position: "fixed", bottom: isCompact ? 72 : 20, insetInlineEnd: 20, width: 50, height: 50, borderRadius: 999, background: c.emerald, color: c.gold, border: "none", display: "grid", placeItems: "center", boxShadow: "0 12px 30px -8px rgba(0,0,0,.4)", zIndex: 80, cursor: "pointer" }}>
        <Sparkles size={18} />
      </button>
      {companionOpen && (
        <div style={{ position: "fixed", bottom: isCompact ? 134 : 82, insetInlineEnd: 20, width: 300, maxWidth: "calc(100vw - 32px)", background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16, boxShadow: "0 20px 50px -12px rgba(0,0,0,.35)", zIndex: 80 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 13 }}><Sparkles size={13} color={c.gold} /> {t.companionTitle}</div>
            <button onClick={() => setCompanionOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: c.sub }}><X size={15} /></button>
          </div>
          <div style={{ fontSize: 10.5, color: c.sub, background: `${c.gold}18`, borderRadius: 8, padding: "6px 9px", marginBottom: 8 }}>{t.companionNote}</div>
          <div style={{ display: "grid", gap: 5, marginBottom: 8 }}>
            {t.companionPrompts.map((p, i) => (
              <button key={p} onClick={() => setCompanionPrompt(i)} style={{ textAlign: dir === "rtl" ? "right" : "left", fontSize: 12, padding: "7px 9px", borderRadius: 8, background: c.panel2, border: `1px solid ${c.line}`, color: c.ink, cursor: "pointer", fontFamily: "inherit" }}>{p}</button>
            ))}
          </div>
          {companionPrompt !== null && (
            <div style={{ fontSize: 12, lineHeight: 1.6, background: c.panel2, borderRadius: 9, padding: 11, color: c.ink }}>{COMPANION_ANSWERS[uiLang][companionPrompt]}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Riwayat left pane ---------------- */
function RiwayatPanel({ c, t, uiLang, dir, activeRiwayah, setActiveRiwayah, riwayatMode, setRiwayatMode, compareSelection, setCompareSelection, qiraatPath, setQiraatPath }) {
  const active = ALL_RIWAYAT.find((r) => r.id === activeRiwayah);

  const toggleCompare = (id) => {
    setCompareSelection((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, color: c.gold }}>
        <GitBranch size={14} />
        <span style={{ fontSize: 11.5, letterSpacing: 0.5, fontWeight: 700 }}>{t.riwayatEyebrow}</span>
      </div>
      <h2 className="fraunces" style={{ fontSize: 18, fontWeight: 600, marginBottom: 14, fontFamily: uiLang === "ar" ? "'Cairo', sans-serif" : "'Fraunces', serif" }}>{t.riwayatTitle}</h2>

      <div style={{ background: `${c.emerald}14`, border: `1px solid ${c.emerald}44`, borderRadius: 12, padding: 12, marginBottom: 14, display: "flex", gap: 8 }}>
        <ShieldCheck size={16} color={c.emerald} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11.5, lineHeight: 1.6, color: c.ink }}>{t.authenticity}</p>
      </div>

      {/* Path: Sughra vs Kubra */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, color: c.sub }}>
          <Layers size={12} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: uiLang === "en" ? "uppercase" : "none" }}>{t.pathLabel}</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["sughra", "kubra"].map((p) => (
            <button key={p} onClick={() => setQiraatPath(p)}
              style={{
                flex: 1, textAlign: "start", padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                background: qiraatPath === p ? c.emerald : c.panel, color: qiraatPath === p ? "#F4EFE2" : c.ink,
                border: `1px solid ${qiraatPath === p ? c.emerald : c.line}`,
              }}>
              <div style={{ fontSize: 11.5, fontWeight: 700 }}>{uiLang === "ar" ? QIRAAT_PATHS[p].ar : QIRAAT_PATHS[p].en}</div>
              <div style={{ fontSize: 9, opacity: 0.85, marginTop: 2 }}>{uiLang === "ar" ? QIRAAT_PATHS[p].subtitleAr : QIRAAT_PATHS[p].subtitleEn}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: c.sub, marginTop: 6, lineHeight: 1.5 }}>
          {uiLang === "ar" ? QIRAAT_PATHS[qiraatPath].descAr : QIRAAT_PATHS[qiraatPath].descEn}
        </div>
      </div>

      {/* Selection mode */}
      <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {[["single", t.modeSingle], ["compare", t.modeCompare], ["all", t.modeAll]].map(([k, l]) => (
          <button key={k} onClick={() => setRiwayatMode(k)}
            style={{
              flex: 1, fontSize: 10.5, padding: "7px 6px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
              background: riwayatMode === k ? c.emerald : c.panel2, color: riwayatMode === k ? "#F4EFE2" : c.sub,
              border: `1px solid ${riwayatMode === k ? c.emerald : c.line}`,
            }}>{l}</button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: c.sub, marginBottom: 14, lineHeight: 1.5 }}>
        {riwayatMode === "single" ? t.modeSingleHint : riwayatMode === "compare" ? t.modeCompareHint : t.modeAllHint}
      </div>

      {/* Reader list, grouped by collection */}
      {["shatibiyyah", "durrah"].map((colId) => (
        <div key={colId} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: c.gold }}>{uiLang === "ar" ? COLLECTIONS[colId].ar : COLLECTIONS[colId].en}</span>
            <span style={{ fontSize: 9, color: c.sub }}>{uiLang === "ar" ? COLLECTIONS[colId].countAr : COLLECTIONS[colId].countEn}</span>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {READERS.filter((r) => r.collection === colId).map((reader) => (
              <div key={reader.id} style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.ink, marginBottom: 5 }}>
                  {reader.order}. {uiLang === "ar" ? reader.ar : reader.en} <span style={{ fontWeight: 400, color: c.sub }}>· {uiLang === "ar" ? reader.cityAr : reader.cityEn}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {reader.riwayat.map((rw) => {
                    const id = rw.id;
                    const isSelected = riwayatMode === "single" ? activeRiwayah === id : riwayatMode === "all" ? true : compareSelection.has(id);
                    const onClick = () => {
                      if (riwayatMode === "single") setActiveRiwayah(id);
                      else if (riwayatMode === "compare") toggleCompare(id);
                    };
                    return (
                      <button key={id} onClick={onClick} disabled={riwayatMode === "all"}
                        style={{
                          fontSize: 10.5, padding: "4px 9px", borderRadius: 999, cursor: riwayatMode === "all" ? "default" : "pointer", fontFamily: "inherit",
                          background: isSelected ? c.emerald : c.panel2, color: isSelected ? "#F4EFE2" : c.sub,
                          border: `1px solid ${isSelected ? c.emerald : c.line}`,
                        }}>
                        {uiLang === "ar" ? rw.ar : rw.en}
                        {rw.variant === "verified" && <span style={{ marginInlineStart: 4, opacity: 0.85 }}>●</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ fontSize: 9.5, color: c.sub, lineHeight: 1.5, marginBottom: 14 }}>
        <span style={{ color: c.emerald }}>●</span> {t.verifiedLegend}
      </div>

      {riwayatMode === "single" && active && (
        <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10.5, color: c.sub, marginBottom: 6 }}>{t.activeNow}</div>
          <div className="fraunces" style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, fontFamily: uiLang === "ar" ? "'Cairo',sans-serif" : "'Fraunces',serif" }}>
            {uiLang === "ar" ? `${active.readerAr} — ${active.ar}` : `${active.en} 'an ${active.readerEn}`}
          </div>
          {active.variant === "verified" ? (
            <div>
              <div className="amiri" style={{ fontSize: 20, color: c.gold, marginBottom: 4 }}>{active.variantAr}</div>
              <p style={{ fontSize: 11.5, color: c.sub, lineHeight: 1.55 }}>{uiLang === "ar" ? active.note || "" : active.noteEn || active.variantEn}</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.sub }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#B0785A" }} />
              {t.pendingNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Qira'at comparison panel ---------------- */
function QiraatComparePanel({ c, t, uiLang, dir, isCompact, forSegment, mode, activeRiwayah, compareSelection, qiraatPath, onClose }) {
  const scope =
    mode === "single" ? ALL_RIWAYAT.filter((r) => r.id === activeRiwayah)
    : mode === "compare" ? ALL_RIWAYAT.filter((r) => compareSelection.has(r.id))
    : ALL_RIWAYAT;

  const isBasmala = forSegment === "basmala";
  const title = isBasmala ? t.basmalaTitle : t.malikTitle;
  const scholarNoteAr = isBasmala ? BASMALA_NOTE.ar : "يذكر الطبري أن الملك والمالك كلاهما صحيح المعنى، إذ لا مالك يوم القيامة إلا الله.";
  const scholarNoteEn = isBasmala ? BASMALA_NOTE.en : "At-Tabari notes both readings converge on the same meaning: on that day, sovereignty belongs to God alone.";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 105, display: "flex", alignItems: isCompact ? "flex-end" : "center", justifyContent: "center", padding: isCompact ? 0 : 18 }}>
      <div dir={dir} onClick={(e) => e.stopPropagation()}
        style={{
          background: c.panel, border: `1px solid ${c.line}`, padding: 22, overflowY: "auto",
          ...(isCompact
            ? { width: "100%", maxHeight: "82vh", borderRadius: "20px 20px 0 0" }
            : { maxWidth: 480, width: "100%", maxHeight: "82vh", borderRadius: 20 }),
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: c.gold, fontWeight: 700, marginBottom: 4 }}>{t.compareTitle}</div>
            <div className="fraunces" style={{ fontSize: 15, fontWeight: 700, fontFamily: uiLang === "ar" ? "'Cairo',sans-serif" : "'Fraunces',serif" }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 999, width: 28, height: 28, color: c.sub, cursor: "pointer", flexShrink: 0 }}><X size={13} /></button>
        </div>

        <div style={{ fontSize: 10.5, color: c.sub, marginBottom: 14 }}>{t.inScope}: {scope.length}</div>

        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {scope.map((r) => {
            const src = sourceLabelFor({ collection: r.collection }, qiraatPath);
            let readingText, readingBadge;
            if (isBasmala) {
              if (r.countsBasmala === true) { readingText = uiLang === "ar" ? "تُعدّ الآية الأولى" : "Counted as ayah one"; readingBadge = "verified"; }
              else if (r.countsBasmala === false) { readingText = uiLang === "ar" ? "لا تُعدّ آية مستقلة" : "Not counted as a separate ayah"; readingBadge = "verified"; }
              else { readingText = uiLang === "ar" ? "غير محدد هنا" : "Not determined here"; readingBadge = "pending"; }
            } else {
              if (r.variant === "verified") { readingText = r.variantAr + " — " + (uiLang === "ar" ? "" : r.variantEn); readingBadge = "verified"; }
              else { readingText = uiLang === "ar" ? "غير محدد هنا" : "Not determined here"; readingBadge = "pending"; }
            }
            return (
              <div key={r.id} style={{ background: c.panel2, borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700 }}>{uiLang === "ar" ? `${r.readerAr} — ${r.ar}` : `${r.en} 'an ${r.readerEn}`}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: readingBadge === "verified" ? c.emerald : "#B0785A" }}>
                    {readingBadge === "verified" ? t.verifiedBadge : t.pendingBadge}
                  </span>
                </div>
                <div className={isBasmala ? "" : "amiri"} style={{ fontSize: isBasmala ? 11.5 : 15, color: c.ink, marginBottom: 4 }}>{readingText}</div>
                <div style={{ fontSize: 9, color: c.sub }}>{t.citedFrom}: {uiLang === "ar" ? src.ar : src.en}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: `${c.emerald}14`, border: `1px solid ${c.emerald}44`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: c.emerald, marginBottom: 6 }}>{t.scholarNote}</div>
          <p style={{ fontSize: 11.5, lineHeight: 1.6, color: c.ink, margin: 0 }}>{uiLang === "ar" ? scholarNoteAr : scholarNoteEn}</p>
          {isBasmala && (
            <p style={{ fontSize: 10, color: c.sub, marginTop: 8, marginBottom: 0 }}>{uiLang === "ar" ? BASMALA_NOTE.pendingReaders : BASMALA_NOTE.pendingReadersEn}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Study panel (right) ---------------- */
function StudyContent({ c, t, uiLang, dir, rightTab, setRightTab, discovered, onVocabClick, activeGraphNode, setActiveGraphNode, takeaway, setTakeaway, actionItem, setActionItem, quizState, setQuizState, setActiveSource, deeperSource }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 }}>
        {[["understand", t.tabUnderstand], ["vocab", t.tabVocab], ["connect", t.tabConnect], ["practice", t.tabPractice], ["library", t.tabLibrary]].map(([k, l]) => (
          <button key={k} className={`pill ${rightTab === k ? "active" : ""}`} onClick={() => setRightTab(k)}>{l}</button>
        ))}
      </div>

      {rightTab === "understand" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ border: `1px solid ${c.gold}55`, background: `${c.gold}14`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: c.gold, fontWeight: 700, fontSize: 11 }}>
              <Sparkles size={13} /> {t.aiExplanationTitle}
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.65, color: c.ink }}>
              {uiLang === "ar"
                ? "الفاتحة تبدأ بالثناء على الله، ثم تُقرّ أن العبادة والاستعانة لا تكونان إلا له وحده، ثم تُختم بطلب الهداية — فهي دعاء يتكرر في كل صلاة، ويلخّص علاقة العبد بربه في سبع آيات."
                : "Al-Fatiha opens with praise of God, affirms that worship and help are sought from Him alone, then closes with a request for guidance — a prayer repeated in every salah, summarizing the whole relationship between a servant and their Lord in seven lines."}
            </p>
          </div>

          {TAFSIR.map((cm) => (
            <div key={cm.id} style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                {uiLang === "ar" ? cm.scholar : cm.scholarEn} <span style={{ fontWeight: 400, color: c.sub }}>· {uiLang === "ar" ? cm.work : cm.workEn}</span>
              </div>
              <p style={{ fontSize: 12, color: c.sub, lineHeight: 1.6, marginBottom: 10 }}>{cm.note[uiLang]}</p>
              <SourceChip c={c} uiLang={uiLang} source={SOURCES[cm.id]} onOpen={setActiveSource} />
            </div>
          ))}

          {deeperSource && (
            <button onClick={() => setActiveSource(deeperSource.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: `1px dashed ${c.line}`, borderRadius: 12, padding: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 11.5, color: c.sub }}>{t.goDeeper}: {uiLang === "ar" ? deeperSource.ar : deeperSource.en}</span>
              <span style={{ fontSize: 10, color: "#B0785A", fontWeight: 700 }}>{t.notDigitizedYet}</span>
            </button>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: c.gold, marginBottom: 8 }}>
              <Quote size={12} /> {t.relatedTitle}
            </div>
            {RELATED.map((r) => (
              <div key={r.id} style={{ background: c.panel2, borderRadius: 12, padding: 12, borderInlineStart: `3px solid ${c.emerald}`, marginBottom: 8 }}>
                {r.type === "hadith" ? (
                  <>
                    <p style={{ fontSize: 12, lineHeight: 1.55 }}>{uiLang === "ar" ? r.ar : r.en}</p>
                    <div style={{ fontSize: 10, color: c.sub, marginTop: 6 }}>{r.src[uiLang]}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{uiLang === "ar" ? r.ar : r.en}</div>
                    <div style={{ fontSize: 10.5, color: c.sub, marginTop: 4 }}>{r.note[uiLang]}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {rightTab === "vocab" && (
        <div style={{ display: "grid", gap: 10 }}>
          {VOCAB.map((v) => (
            <div key={v.id} onClick={() => onVocabClick(v.id)} style={{ background: c.panel, border: `1px solid ${discovered.has(v.id) ? c.gold : c.line}`, borderRadius: 12, padding: 14, cursor: "pointer" }}>
              <div className="amiri" style={{ fontSize: 20, marginBottom: 4 }}>{v.word}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{v[uiLang]}</div>
              <div style={{ fontSize: 11, color: c.sub }}>{uiLang === "ar" ? "الجذر" : "root"} {v.root} · {v.pron}</div>
            </div>
          ))}
        </div>
      )}

      {rightTab === "connect" && (
        <div style={{ display: "grid", gap: 10 }}>
          {RELATED.map((r) => (
            <button key={r.id} onClick={() => setActiveGraphNode(r.id)}
              style={{ textAlign: "start", background: activeGraphNode === r.id ? c.emerald : c.panel, color: activeGraphNode === r.id ? "#F4EFE2" : c.ink, border: `1px solid ${activeGraphNode === r.id ? c.emerald : c.line}`, borderRadius: 12, padding: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{uiLang === "ar" ? r.ar : r.en}</div>
              <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 3 }}>{r.type === "hadith" ? (r.src ? r.src[uiLang] : "") : r.note[uiLang]}</div>
            </button>
          ))}
        </div>
      )}

      {rightTab === "practice" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 16 }}>
            <label style={{ fontSize: 11.5, color: c.sub, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <NotebookPen size={12} /> {t.reflectionLabel}
            </label>
            <textarea value={takeaway} onChange={(e) => setTakeaway(e.target.value)} rows={2} placeholder={t.reflectionPh} dir={dir}
              style={{ width: "100%", background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 9, padding: 10, color: c.ink, fontSize: 12.5, fontFamily: "inherit", resize: "vertical", marginBottom: 12 }} />
            <label style={{ fontSize: 11.5, color: c.sub, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <CircleCheck size={12} /> {t.actionLabel}
            </label>
            <input value={actionItem} onChange={(e) => setActionItem(e.target.value)} placeholder={t.actionPh} dir={dir}
              style={{ width: "100%", background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 9, padding: 10, color: c.ink, fontSize: 12.5, fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {QUIZ.map((q, qi) => {
              const st = quizState[qi];
              return (
                <div key={qi} style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>{q.q[uiLang]}</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {q.options.map((opt, oi) => {
                      const picked = st?.picked === oi;
                      const showCorrect = st !== undefined && oi === q.correct;
                      return (
                        <button key={oi} onClick={() => setQuizState((s) => ({ ...s, [qi]: { picked: oi } }))}
                          style={{ textAlign: dir === "rtl" ? "right" : "left", padding: "8px 12px", borderRadius: 9, fontSize: 12, cursor: "pointer", color: c.ink, fontFamily: "inherit",
                            background: showCorrect ? `${c.emerald}33` : picked ? `${c.gold}22` : c.panel2,
                            border: `1px solid ${showCorrect ? c.emerald : picked ? c.gold : c.line}` }}>
                          {opt[uiLang]}
                        </button>
                      );
                    })}
                  </div>
                  {st !== undefined && (
                    <div style={{ fontSize: 11.5, color: st.picked === q.correct ? c.emerald : c.gold, marginTop: 8 }}>
                      {st.picked === q.correct ? t.quizCorrect : t.quizWrong}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rightTab === "library" && (
        <div style={{ display: "grid", gap: 8 }}>
          {Object.values(SOURCES).sort((a, b) => sourcePct(b) - sourcePct(a)).map((s) => {
            const pct = sourcePct(s);
            return (
              <button key={s.id} onClick={() => setActiveSource(s.id)} dir={dir}
                style={{ textAlign: "start", background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{uiLang === "ar" ? s.ar : s.en}</span>
                  <span style={{ fontSize: 10.5, color: c.sub }}>{formatPct(pct, s.indexed)}</span>
                </div>
                <div style={{ fontSize: 10, color: c.sub, marginBottom: 7 }}>{uiLang === "ar" ? s.authorAr : s.authorEn} · {s.era}</div>
                <div style={{ height: 5, borderRadius: 999, background: c.panel2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(pct, 2)}%`, background: pct > 0 ? c.emerald : "#B0785A", borderRadius: 999 }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SourceChip({ c, uiLang, source, onOpen }) {
  if (!source) return null;
  const pct = sourcePct(source);
  const digitized = source.indexed > 0;
  return (
    <button onClick={() => onOpen(source.id)}
      style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 6px", borderRadius: 999, background: c.panel2, border: `1px solid ${c.line}`, cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, flexShrink: 0, background: digitized ? c.emerald : "#B0785A" }} />
      <span style={{ fontSize: 11, color: c.ink, fontWeight: 600 }}>{uiLang === "ar" ? source.ar : source.en}</span>
      <span style={{ fontSize: 9.5, color: c.sub }}>{formatPct(pct, source.indexed)}</span>
    </button>
  );
}

function SourceDetailModal({ c, t, uiLang, dir, source, onClose, onVote, voted, voteCount }) {
  const pct = sourcePct(source);
  const digitized = source.indexed > 0;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div dir={dir} onClick={(e) => e.stopPropagation()} style={{ background: c.panel, borderRadius: 22, padding: 26, maxWidth: 440, width: "100%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${c.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div className={uiLang === "ar" ? "amiri" : "fraunces"} style={{ fontSize: uiLang === "ar" ? 22 : 19, fontWeight: 600, color: c.ink, lineHeight: 1.3 }}>{uiLang === "ar" ? source.ar : source.en}</div>
            <div style={{ fontSize: 11.5, color: c.sub, marginTop: 4 }}>{t.author}: {uiLang === "ar" ? source.authorAr : source.authorEn} · {source.era}</div>
          </div>
          <button onClick={onClose} style={{ background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 999, width: 28, height: 28, display: "grid", placeItems: "center", color: c.sub, cursor: "pointer", flexShrink: 0 }}><X size={14} /></button>
        </div>
        <div style={{ height: 7, borderRadius: 999, background: c.panel2, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${Math.max(pct, 2)}%`, background: digitized ? c.emerald : "#B0785A", borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: 11, color: c.sub, marginBottom: 18 }}>
          {source.indexed} {t.ofUnits} {source.total} {source.unit[uiLang]} {t.unitsDigitized} · {formatPct(pct, source.indexed)}
        </div>
        {digitized ? (
          <div style={{ background: `${c.emerald}14`, border: `1px solid ${c.emerald}44`, borderRadius: 14, padding: 16, fontSize: 12.5, color: c.ink }}>
            {uiLang === "ar" ? "التفسير المرقمن لهذه السورة معروض بالفعل في تبويب التفسير." : "The digitized commentary for this surah is shown in the Tafsir tab already."}
          </div>
        ) : (
          <div style={{ background: "#B0785A14", border: "1px solid #B0785A44", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, color: "#B0785A", fontWeight: 700, marginBottom: 8 }}>{t.notDigitizedYet}</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: c.ink, marginBottom: 12 }}>{t.sourceEmptyNote}</p>
            <button onClick={() => onVote(source.id)} disabled={voted}
              style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 999, border: "none", cursor: voted ? "default" : "pointer", fontFamily: "inherit", background: voted ? c.panel2 : c.gold, color: voted ? c.sub : "#241c0a" }}>
              <Flame size={13} /> {voted ? t.voted : t.helpPrioritize}{voteCount > 0 && ` · ${voteCount} ${t.votesLabel}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VocabPopover({ v, c, uiLang }) {
  return (
    <span style={{ position: "absolute", bottom: "130%", left: "50%", transform: "translateX(-50%)", background: c.ink, color: c.bg, borderRadius: 10, padding: "9px 12px", fontSize: 11.5, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", zIndex: 20, boxShadow: "0 10px 25px -8px rgba(0,0,0,.4)", textAlign: "center", lineHeight: 1.5 }}>
      <b>{v[uiLang]}</b><br />{uiLang === "ar" ? "الجذر" : "root"} {v.root} · {v.pron}
    </span>
  );
}

function SheetHandle({ c, title, onClose }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ width: 36, height: 4, borderRadius: 999, background: c.line, margin: "2px auto 12px" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{title}</span>
        <button onClick={onClose} aria-label="Close" style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: c.panel2, border: `1px solid ${c.line}`, color: c.sub, cursor: "pointer" }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function BottomTabButton({ active, icon, label, c, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: active ? c.gold : c.sub }}>
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}
