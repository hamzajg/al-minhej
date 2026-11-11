import type { UiLang } from "@/types";

export interface UiStrings {
  appName: string;
  tagline: string;
  homeCta: string;
  continueLearning: string;
  library: string;
  lessonTag: string;
  mChain: string;
  mRead: string;
  mStudy: string;
  chainEyebrow: string;
  chainTitle: string;
  authenticity: string;
  transmittedBy: string;
  tabUnderstand: string;
  tabVocab: string;
  tabConnect: string;
  tabPractice: string;
  tabLibrary: string;
  tabPages: string;
  narratedBy: string;
  audio: string;
  audioStop: string;
  copy: string;
  copied: string;
  bookmark: string;
  share: string;
  shared: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  hadithLabel: string;
  prevHadith: string;
  nextHadith: string;
  showTranslation: string;
  hideTranslation: string;
  originalLabel: string;
  tapHint: string;
  wordsExplored: string;
  viewChain: string;
  aiExplanationTitle: string;
  scholarCommentaryTitle: string;
  moreCommentaryTitle: string;
  echoedQuranTitle: string;
  relatedHadithTitle: string;
  reflectionLabel: string;
  reflectionPh: string;
  actionLabel: string;
  actionPh: string;
  companionTitle: string;
  companionNote: string;
  quizCorrect: string;
  quizWrong: string;
  welcomeGreet: string;
  welcomeQ: string;
  immersiveTitle: string;
  immersiveDesc: string;
  guidedTitle: string;
  guidedDesc: string;
  startBtn: string;
  reopenPicker: string;
  heroEyebrow: string;
  heroTitle: string;
  heroArabic: string;
  heroDesc: string;
  heroBtn: string;
  companionPromptLabels: Record<string, string>;
  // Memorize mode
  memorize: string;
  easy: string;
  medium: string;
  hard: string;
  revealAll: string;
  recitedBtn: string;
  recitedCount: string;
  memorizeHint: string;
  // Source / digitization library
  libraryIntro: string;
  notDigitizedYet: string;
  digitizedBadge: string;
  readPassage: string;
  closeSource: string;
  helpPrioritize: string;
  voted: string;
  votesLabel: string;
  referencedIn: string;
  goDeeper: string;
  hadithNo: string;
  author: string;
    ofUnits: string;
    unitsDigitized: string;
    sourceEmptyNote: string;
    // Library page (search / TOC / lock states)
    librarySearch: string;
    librarySearchPh: string;
    lockedSource: string;
    closedSource: string;
    openToc: string;
    tocTitle: string;
    startReading: string;
    digitizeSoon: string;
  }

export const STRINGS: Record<UiLang, UiStrings> = {
  ar: {
    appName: "المنهج",
    tagline: "الطريقة الحديثة لتعلّم العلم الشرعي الأصيل",
    homeCta: "ابدأ القراءة",
    continueLearning: "تابع التعلّم",
    library: "المكتبة",
    lessonTag: "الأربعون النووية · الحديث الأول",
    mChain: "السند", mRead: "القراءة", mStudy: "الدراسة",
    chainEyebrow: "من رواه؟", chainTitle: "كل مسارات السند",
    authenticity: "حديث صحيح، متفق عليه بين البخاري ومسلم — أعلى درجات الصحة في علم الحديث.",
    transmittedBy: "ثم نقله عن يحيى أكثر من ٢٠٠ راوٍ، منهم:",
    tabUnderstand: "الفهم", tabVocab: "المفردات", tabConnect: "الروابط", tabPractice: "التطبيق", tabLibrary: "المكتبة", tabPages: "الصفحات",
    narratedBy: "رواه عمر بن الخطاب رضي الله عنه",
    audio: "استماع", audioStop: "إيقاف", copy: "نسخ", copied: "تم النسخ", bookmark: "حفظ", share: "مشاركة", shared: "تم النسخ", pageLabel: "صفحة", prevPage: "السابق", nextPage: "التالي", hadithLabel: "حديث", prevHadith: "السابق", nextHadith: "التالي",
    showTranslation: "إظهار الترجمة", hideTranslation: "إخفاء الترجمة",
    originalLabel: "النص الأصلي · محفوظ كما هو",
    tapHint: "اضغط على أي كلمة لتكتشف معناها",
    wordsExplored: "كلمة مكتشَفة", viewChain: "عرض السند ←",
    aiExplanationTitle: "تفسير بالذكاء الاصطناعي", scholarCommentaryTitle: "شرح العلماء",
    moreCommentaryTitle: "تعليقات أخرى",
    echoedQuranTitle: "صداه في القرآن", relatedHadithTitle: "أحاديث ذات صلة",
    reflectionLabel: "خلاصة اليوم", reflectionPh: "ما الذي لفت انتباهك اليوم بخصوص النية؟",
    actionLabel: "عمل صغير لهذا اليوم", actionPh: "مثال: تجديد نيتي قبل الصلاة",
    companionTitle: "الرفيق", companionNote: "تبقى تفسيرات الذكاء الاصطناعي منفصلة بوضوح عن النص الديني وشروح العلماء.",
    quizCorrect: "يتوافق هذا مع فكرة الحديث.", quizWrong: "تستحق نظرة أخرى — تحقق من الإجابة المُظلَّلة.",
    welcomeGreet: "مرحبًا بك", welcomeQ: "كيف تفضّل قراءة الحديث؟",
    immersiveTitle: "العربية أولًا", immersiveDesc: "اقرأ النص الأصلي كما هو، والترجمة مخفية افتراضيًا — تجربة مصمَّمة للناطقين بالعربية.",
    guidedTitle: "موجَّه بالترجمة", guidedDesc: "أبقِ فقرة ترجمة مساعدة أسفل النص أثناء تعلّمك — مثالية للمبتدئين.",
    startBtn: "ابدأ", reopenPicker: "طريقة القراءة",
    heroEyebrow: "مكتبة العلم الأصيل", heroTitle: "افهم الحديث من منبعه", heroArabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", heroDesc: "لا تكتفِ بالقراءة — اكتشف المعنى، والمصدر، والسياق، والطريق من حوله.", heroBtn: "ابدأ الفهم",
    companionPromptLabels: {
      explain_12: "اشرح لي وكأن عمري ١٢ عامًا",
      practical_example: "أعطني مثالًا عمليًا",
      why_chain: "لماذا يهم السند؟",
    },
    memorize: "الحفظ", easy: "سهل", medium: "متوسط", hard: "صعب",
    revealAll: "إظهار الكل", recitedBtn: "قرأتها", recitedCount: "مرة اليوم",
    memorizeHint: "الكلمات الباهتة مخفية — اضغط عليها لكشفها واختبار حفظك",
    libraryIntro: "كل كتاب يُستشهد به هنا مفهرس رقميًا — من نص كامل إلى صفر بعد.",
    notDigitizedYet: "لم تُرقمَن بعد", digitizedBadge: "مرقمنة",
    readPassage: "النص المرقمن", closeSource: "إغلاق",
    helpPrioritize: "صوّت لإعطاء الأولوية", voted: "تم التصويت", votesLabel: "صوت",
    referencedIn: "مرجع في:", goDeeper: "للتعمق أكثر", hadithNo: "برقم", author: "المؤلف",
    ofUnits: "من", unitsDigitized: "مرقمَن",
    sourceEmptyNote: "لم يصل فريقنا إلى هذا الجزء بعد. تصويتك يساعدنا على ترتيب الأولويات.",
    librarySearch: "بحث في المكتبة", librarySearchPh: "ابحث بعنوان الكتاب أو المؤلف…",
    lockedSource: "قريبًا", closedSource: "لم يُفتح بعد", openToc: "جدول المحتويات",
    tocTitle: "فهرس الكتاب", startReading: "ابدأ القراءة", digitizeSoon: "سيُرقمن قريبًا — صوّت لإعطائه الأولوية",
  },
  en: {
    appName: "AlMinhej",
    tagline: "The modern way to learn authentic Islamic knowledge",
    homeCta: "Start Reading",
    continueLearning: "Continue learning",
    library: "Library",
    lessonTag: "Al-Arba'in an-Nawawiyyah · Hadith 1",
    mChain: "Chain", mRead: "Read", mStudy: "Study",
    chainEyebrow: "Who narrated it", chainTitle: "All paths of the chain",
    authenticity: "Graded Sahih — agreed upon by Bukhari & Muslim, the highest tier of authenticity in hadith science.",
    transmittedBy: "then transmitted by 200+ narrators, including:",
    tabUnderstand: "Understand", tabVocab: "Vocabulary", tabConnect: "Connect", tabPractice: "Practice", tabLibrary: "Library", tabPages: "Pages",
    narratedBy: "Narrated by 'Umar ibn al-Khattab",
    audio: "Audio", audioStop: "Stop", copy: "Copy", copied: "Copied", bookmark: "Bookmark", share: "Share", shared: "Link copied", pageLabel: "Page", prevPage: "Previous", nextPage: "Next", hadithLabel: "Hadith", prevHadith: "Previous", nextHadith: "Next",
    showTranslation: "Show translation", hideTranslation: "Hide translation",
    originalLabel: "Original Text · preserved exactly",
    tapHint: "Tap any word to discover its meaning",
    wordsExplored: "words discovered", viewChain: "view chain →",
    aiExplanationTitle: "AI Explanation", scholarCommentaryTitle: "Scholar Commentary",
    moreCommentaryTitle: "More commentary",
    echoedQuranTitle: "Echoed in the Qur'an", relatedHadithTitle: "Related hadith",
    reflectionLabel: "Today's takeaway", reflectionPh: "What stood out about intention today?",
    actionLabel: "One small action for today", actionPh: "e.g. renew my intention before I pray",
    companionTitle: "Companion", companionNote: "AI explanations stay clearly separate from the religious text and scholarly commentary.",
    quizCorrect: "That matches the hadith's point.", quizWrong: "Worth another look — check the highlighted answer.",
    welcomeGreet: "Welcome", welcomeQ: "How would you like to read the hadith?",
    immersiveTitle: "Arabic First", immersiveDesc: "Read the sacred text as-is; translation hidden by default — built for Arabic speakers.",
    guidedTitle: "Guided with translation", guidedDesc: "Keep a helper paragraph under the text while you learn — great for newcomers.",
    startBtn: "Start", reopenPicker: "Reading mode",
    heroEyebrow: "The library of authentic knowledge", heroTitle: "Understand the hadith at its source", heroArabic: "Innamā al-aʿmālu bin-niyyāt", heroDesc: "Don't just read — discover the meaning, the source, the context, and the path that branches out from it.", heroBtn: "Begin Understanding",
    companionPromptLabels: {
      explain_12: "Explain like I'm 12",
      practical_example: "Give a practical example",
      why_chain: "Why does the chain matter?",
    },
    memorize: "Memorize", easy: "Easy", medium: "Medium", hard: "Hard",
    revealAll: "Reveal all", recitedBtn: "I recited it", recitedCount: "times today",
    memorizeHint: "Faded words are hidden — tap to reveal and test your memory",
    libraryIntro: "Every book cited here is digitally indexed — from full text down to not-yet-started.",
    notDigitizedYet: "Not yet digitized", digitizedBadge: "Digitized",
    readPassage: "Digitized passage", closeSource: "Close",
    helpPrioritize: "Vote to prioritize", voted: "Voted", votesLabel: "votes",
    referencedIn: "Referenced in:", goDeeper: "Go deeper", hadithNo: "No.", author: "Author",
    ofUnits: "of", unitsDigitized: "digitized",
    sourceEmptyNote: "Our team hasn't reached this part yet. Your vote helps us prioritize what to digitize next.",
    librarySearch: "Search the library", librarySearchPh: "Search by book title or author…",
    lockedSource: "Soon", closedSource: "Not opened yet", openToc: "Contents",
    tocTitle: "Table of contents", startReading: "Start reading", digitizeSoon: "Will be digitized soon — vote to prioritize it",
  },
};

export const SUBTITLE_LANGS: Record<string, string> = { en: "English", fr: "Français", es: "Español" };
