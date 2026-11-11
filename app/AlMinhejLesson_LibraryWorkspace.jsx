import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Play, Copy, Bookmark, Share2, Type, Sparkles, BookOpen, Users, MapPin,
  Quote, Sun, Moon, NotebookPen, CircleCheck, Network, Info, Eye, EyeOff,
  ShieldCheck, GitBranch, X, Languages, Sparkle, Brain, RotateCcw, Flame,
  List, ChevronRight, ChevronLeft, Search, Library, Lock,
} from "lucide-react";

/* AlMinhej — Hadith 1, memorization-focused reading studio.
   Core change from the previous preview: the center canvas now renders the
   hadith as ONE compact, continuously-wrapping paragraph (the way it reads
   on a physical page — ~3 lines) instead of six separate clause blocks.
   That preserves the natural rhythm a reader memorizes against. Translation,
   when shown, is a single paragraph underneath rather than interlinear.
   A dedicated Memorize mode adds word-occlusion practice + a repetition
   counter on top of that compact baseline. */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Amiri:wght@400;700&family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');`;

/* ---------- UI strings ---------- */
const T = {
  ar: {
    appName: "المنهج", tagline: "الطريقة الحديثة لتعلّم العلم الشرعي الأصيل",
    lessonTag: "الأربعون النووية · الحديث الأول",
    mChain: "السند", mRead: "القراءة", mStudy: "الدراسة",
    chainEyebrow: "من رواه؟", chainTitle: "كل مسارات السند",
    authenticity: "حديث صحيح، متفق عليه بين البخاري ومسلم — أعلى درجات الصحة في علم الحديث.",
    transmittedBy: "ثم نقله عن يحيى أكثر من ٢٠٠ راوٍ، منهم:",
    tabUnderstand: "الفهم", tabVocab: "المفردات", tabConnect: "الروابط", tabPractice: "التطبيق",
    narratedBy: "رواه عمر بن الخطاب رضي الله عنه · صحيح البخاري ومسلم",
    audio: "استماع", copy: "نسخ", copied: "تم النسخ", bookmark: "حفظ", share: "مشاركة",
    showTranslation: "إظهار الترجمة", hideTranslation: "إخفاء الترجمة",
    originalLabel: "النص الأصلي · محفوظ كما هو",
    tapHint: "اضغط على أي كلمة لتكتشف معناها",
    wordsExplored: "كلمة مكتشَفة", viewChain: "عرض السند ←",
    aiExplanationTitle: "تفسير بالذكاء الاصطناعي", scholarCommentaryTitle: "شرح العلماء",
    whyHijrahTitle: "لماذا الهجرة تحديدًا؟", moreCommentaryTitle: "تعليقات أخرى",
    echoedQuranTitle: "صداه في القرآن", relatedHadithTitle: "أحاديث ذات صلة",
    reflectionLabel: "خلاصة اليوم", reflectionPh: "ما الذي لفت انتباهك اليوم بخصوص النية؟",
    actionLabel: "عمل صغير لهذا اليوم", actionPh: "مثال: تجديد نيتي قبل الصلاة",
    companionTitle: "الرفيق", companionNote: "تبقى تفسيرات الذكاء الاصطناعي منفصلة بوضوح عن النص الديني وشروح العلماء.",
    quizCorrect: "يتوافق هذا مع فكرة الحديث.", quizWrong: "تستحق نظرة أخرى — تحقق من الإجابة المُظلَّلة.",
    welcomeGreet: "مرحبًا بك", welcomeQ: "كيف تفضّل قراءة الحديث؟",
    immersiveTitle: "العربية أولًا", immersiveDesc: "اقرأ النص الأصلي كما هو، والترجمة مخفية افتراضيًا — تجربة مصمَّمة للناطقين بالعربية.",
    guidedTitle: "موجَّه بالترجمة", guidedDesc: "أبقِ ترجمة مساعدة أسفل النص أثناء تعلّمك — مثالية للمبتدئين.",
    startBtn: "ابدأ", reopenPicker: "طريقة القراءة",
    companionPrompts: ["اشرح لي وكأن عمري ١٢ عامًا", "أعطني مثالًا عمليًا", "لماذا يهم السند؟"],
    memorize: "الحفظ", memorizeOn: "وضع الحفظ مُفعَّل", easy: "سهل", medium: "متوسط", hard: "صعب",
    revealAll: "إظهار الكل", recitedBtn: "قرأتها", recitedCount: "مرة اليوم",
    memorizeHint: "الكلمات الباهتة مخفية — اضغط عليها لكشفها واختبار حفظك",
    tabLibrary: "المكتبة", libraryIntro: "كل كتاب يُستشهد به هنا مفهرس رقميًا هنا — من نص كامل إلى صفر بعد.",
    notDigitizedYet: "لم تُرقمَن بعد", digitizedBadge: "مرقمنة", inProgress: "قيد الرقمنة",
    readPassage: "النص المرقمن", openSource: "فتح المصدر", closeSource: "إغلاق",
    helpPrioritize: "صوّت لإعطاء الأولوية", voted: "تم التصويت", votesLabel: "صوت",
    referencedIn: "مرجع في:", goDeeper: "للتعمق أكثر", hadithNo: "برقم", author: "المؤلف", era: "الفترة",
    ofUnits: "من", unitsDigitized: "مرقمَن",
    sourceEmptyNote: "لم يصل فريقنا إلى هذا الجزء بعد. تصويتك يساعدنا على ترتيب الأولويات.",
    libraryShelfTitle: "المكتبة", libraryShelfTag: "نصوص أصلية، مفهرسة صفحة بصفحة",
    searchPlaceholder: "ابحث في المكتبة...", bookNotOpen: "هذا الكتاب لم يُفتح للمعاينة بعد",
    toc: "الفهرس", tocHint: "تصفّح الكتب والأبواب", tocDigitizedPages: "صفحة مرقمنة",
    tocLocked: "هذا الباب لم يُفتح بعد", nextPageLocked: "الصفحة التالية قيد الرقمنة",
    volume: "المجلد", page: "الصفحة", backToLibrary: "العودة إلى المكتبة",
  },
  en: {
    appName: "AlMinhej", tagline: "The modern way to learn authentic Islamic knowledge",
    lessonTag: "Al-Arba'in an-Nawawiyyah · Hadith 1",
    mChain: "Chain", mRead: "Read", mStudy: "Study",
    chainEyebrow: "Who narrated it", chainTitle: "All paths of the chain",
    authenticity: "Graded Sahih — agreed upon by Bukhari & Muslim, the highest tier of authenticity in hadith science.",
    transmittedBy: "then transmitted by 200+ narrators, including:",
    tabUnderstand: "Understand", tabVocab: "Vocabulary", tabConnect: "Connect", tabPractice: "Practice",
    narratedBy: "Narrated by 'Umar ibn al-Khattab · Sahih al-Bukhari & Muslim",
    audio: "Audio", copy: "Copy", copied: "Copied", bookmark: "Bookmark", share: "Share",
    showTranslation: "Show translation", hideTranslation: "Hide translation",
    originalLabel: "Original Text · preserved exactly",
    tapHint: "Tap any word to discover its meaning",
    wordsExplored: "words discovered", viewChain: "view chain →",
    aiExplanationTitle: "AI Explanation", scholarCommentaryTitle: "Scholar Commentary",
    whyHijrahTitle: "Why hijrah, specifically?", moreCommentaryTitle: "More commentary",
    echoedQuranTitle: "Echoed in the Qur'an", relatedHadithTitle: "Related hadith",
    reflectionLabel: "Today's takeaway", reflectionPh: "What stood out about intention today?",
    actionLabel: "One small action for today", actionPh: "e.g. renew my intention before I pray",
    companionTitle: "Companion", companionNote: "AI explanations stay clearly separate from the religious text and scholarly commentary.",
    quizCorrect: "That matches the hadith's point.", quizWrong: "Worth another look — check the highlighted answer.",
    welcomeGreet: "Welcome", welcomeQ: "How would you like to read the hadith?",
    immersiveTitle: "Arabic First", immersiveDesc: "Read the sacred text as-is; translation hidden by default — built for Arabic speakers.",
    guidedTitle: "Guided with translation", guidedDesc: "Keep a helper paragraph under the text while you learn — great for newcomers.",
    startBtn: "Start", reopenPicker: "Reading mode",
    companionPrompts: ["Explain like I'm 12", "Give a practical example", "Why does the chain matter?"],
    memorize: "Memorize", memorizeOn: "Memorize mode on", easy: "Easy", medium: "Medium", hard: "Hard",
    revealAll: "Reveal all", recitedBtn: "I recited it", recitedCount: "times today",
    memorizeHint: "Faded words are hidden — tap to reveal and test your memory",
    tabLibrary: "Library", libraryIntro: "Every book cited here is digitally indexed — from full text down to not-yet-started.",
    notDigitizedYet: "Not yet digitized", digitizedBadge: "Digitized", inProgress: "In progress",
    readPassage: "Digitized passage", openSource: "Open source", closeSource: "Close",
    helpPrioritize: "Vote to prioritize", voted: "Voted", votesLabel: "votes",
    referencedIn: "Referenced in:", goDeeper: "Go deeper", hadithNo: "No.", author: "Author", era: "Era",
    ofUnits: "of", unitsDigitized: "digitized",
    sourceEmptyNote: "Our team hasn't reached this part yet. Your vote helps us prioritize what to digitize next.",
    libraryShelfTitle: "The Library", libraryShelfTag: "Original texts, indexed page by page",
    searchPlaceholder: "Search the library...", bookNotOpen: "This book isn't open for preview yet",
    toc: "Index", tocHint: "Browse books and chapters", tocDigitizedPages: "pages digitized",
    tocLocked: "This chapter hasn't been opened yet", nextPageLocked: "Next page is still being digitized",
    volume: "Vol.", page: "Page", backToLibrary: "Back to the library",
  },
};

const SHELF_BOOKS = [
  { id: "bukhari", ar: "صحيح البخاري", en: "Sahih al-Bukhari", authorAr: "الإمام البخاري", authorEn: "Imam al-Bukhari", total: "7,563", unitAr: "حديث", unitEn: "hadith", active: true },
  { id: "muslim", ar: "صحيح مسلم", en: "Sahih Muslim", authorAr: "الإمام مسلم", authorEn: "Imam Muslim", total: "7,500", unitAr: "حديث", unitEn: "hadith", active: false },
  { id: "quran", ar: "القرآن الكريم", en: "The Noble Qur'an", authorAr: "—", authorEn: "—", total: "6,236", unitAr: "آية", unitEn: "verses", active: false },
  { id: "riyad", ar: "رياض الصالحين", en: "Riyad al-Salihin", authorAr: "الإمام النووي", authorEn: "Imam an-Nawawi", total: "1,896", unitAr: "حديث", unitEn: "hadith", active: false },
];

const TOC_CHAPTERS = [
  { id: "wahy", ar: "كتاب بدء الوحي", en: "Book of the Beginning of Revelation", pages: 1 },
  { id: "iman", ar: "كتاب الإيمان", en: "Book of Faith", pages: 0 },
  { id: "ilm", ar: "كتاب العلم", en: "Book of Knowledge", pages: 0 },
  { id: "wudu", ar: "كتاب الوضوء", en: "Book of Ablution", pages: 0 },
  { id: "ghusl", ar: "كتاب الغسل", en: "Book of Ritual Bath", pages: 0 },
  { id: "hayd", ar: "كتاب الحيض", en: "Book of Menstruation", pages: 0 },
  { id: "tayammum", ar: "كتاب التيمم", en: "Book of Dry Ablution", pages: 0 },
  { id: "salah", ar: "كتاب الصلاة", en: "Book of Prayer", pages: 0 },
];

const ISNAD_INTRO = {
  ar: "عَنْ أَمِيرِ الْمُؤْمِنِينَ أَبِي حَفْصٍ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَقُولُ:",
};
const ISNAD_INTRO_SUB = {
  en: "On the authority of the Commander of the Faithful, Abu Hafs 'Umar ibn al-Khattab — who said: I heard the Messenger of God ﷺ say:",
  fr: "Selon le commandeur des croyants, Abu Hafs 'Umar ibn al-Khattab, qui a dit avoir entendu le Messager de Dieu déclarer :",
  es: "Según el comandante de los creyentes, Abu Hafs 'Umar ibn al-Khattab, quien dijo haber oído al Mensajero de Dios decir:",
};

/* The full hadith as one continuous word stream — this is the key change.
   Each word keeps a reference to which clause it belongs to only so we can
   still assemble a single compact translation paragraph underneath. */
const CLAUSES = [
  { id: 1, ar: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ،", en: "Actions are only judged by the intentions behind them,", fr: "Les actes ne valent que par les intentions qui les animent,", es: "Las acciones solo valen según la intención que las mueve," },
  { id: 2, ar: "وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى،", en: "and every person will be credited only for what they intended.", fr: "et chacun n'obtient que ce qu'il a réellement voulu.", es: "y cada persona solo obtiene lo que realmente quiso alcanzar." },
  { id: 3, ar: "فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ", en: "So whoever's emigration was for the sake of God and His Messenger,", fr: "Ainsi, celui dont l'émigration visait Dieu et Son Messager,", es: "Así, quien emigra buscando a Dios y a Su Mensajero," },
  { id: 4, ar: "فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ،", en: "their emigration counts for God and His Messenger.", fr: "son émigration compte pour Dieu et Son Messager.", es: "su emigración cuenta para Dios y Su Mensajero." },
  { id: 5, ar: "وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا", en: "And whoever's emigration was for some worldly gain, or to marry a woman,", fr: "Et celui dont l'émigration visait un gain de ce monde, ou le mariage avec une femme,", es: "Y quien emigra por un beneficio mundano, o para casarse con una mujer," },
  { id: 6, ar: "فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ", en: "their emigration counts only for what they emigrated for.", fr: "son émigration ne compte que pour cela.", es: "su emigración solo cuenta para eso." },
];
const SUBTITLE_LANGS = { en: "English", fr: "Français", es: "Español" };

const VOCAB = [
  { id: "amal", word: "الْأَعْمَالُ", root: "ع-م-ل", pron: "al-a'māl", occ: 1, en: "deeds, actions", ar: "الأفعال والتصرفات" },
  { id: "niyyat", word: "بِالنِّيَّاتِ", root: "ن-و-ي", pron: "bin-niyyāt", occ: 1, en: "by intentions", ar: "القصد الباطن للفعل" },
  { id: "imri", word: "امْرِئٍ", root: "م-ر-أ", pron: "imri'in", occ: 1, en: "a person, individual", ar: "الشخص أو الفرد" },
  { id: "hijratuh1", word: "هِجْرَتُهُ", root: "ه-ج-ر", pron: "hijratuhu", occ: 3, en: "his emigration", ar: "هجرته، انتقاله" },
  { id: "yusibuha", word: "يُصِيبُهَا", root: "ص-و-ب", pron: "yuṣībuhā", occ: 1, en: "to attain / gain it", ar: "يحصل عليها من الدنيا" },
  { id: "yankihuha", word: "يَنْكِحُهَا", root: "ن-ك-ح", pron: "yankiḥuhā", occ: 1, en: "to marry her", ar: "يتزوج بها" },
];

const QURAN_LINKS = [
  { ref: "Al-Bayyinah 98:5", refAr: "سورة البيّنة ٩٨:٥", ar: "وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ",
    note: { en: "Commands sincerity of purpose in worship — the same root idea of aligning action with a pure inward intention.",
             ar: "تأمر بالإخلاص في العبادة وإفراد الدين لله وحده — وهي نفس فكرة ربط العمل بنية صافية." } },
  { ref: "Al-Isra 17:19", refAr: "سورة الإسراء ١٧:١٩", ar: "وَمَنْ أَرَادَ الْآخِرَةَ وَسَعَىٰ لَهَا سَعْيَهَا وَهُوَ مُؤْمِنٌ",
    note: { en: "Ties effort to what a person is truly seeking — worldly reward or the next life.",
             ar: "تربط السعي بما يطلبه الإنسان فعلًا — الدنيا أو الآخرة." } },
];

const RELATED_HADITH = [
  { src: "Sahih al-Bukhari & Muslim", srcAr: "متفق عليه",
    text: { en: "A small act done sincerely can outweigh a large act done carelessly, because God weighs the heart behind the deed.",
             ar: "قد يفوق العمل الصغير المُخلَص عملًا كبيرًا أُدِّي بإهمال، لأن الله يزن القلب وراء العمل." } },
  { src: "Sahih Muslim", srcAr: "صحيح مسلم",
    text: { en: "God does not look at your bodies or wealth, but looks at your hearts and your deeds.",
             ar: "إنّ الله لا ينظر إلى صوَركم وأموالكم، ولكن ينظر إلى قلوبكم وأعمالكم." } },
];

const COMMENTARY = [
  { scholar: "Imam an-Nawawi", scholarAr: "الإمام النووي", work: "Sharh al-Arba'in", workAr: "شرح الأربعين", sourceId: "sharh_arbain",
    note: { en: "Opens his forty-hadith collection with this narration, calling it a third of all knowledge — every act of worship is judged first at the level of intention.",
             ar: "يفتتح مجموعته من الأربعين حديثًا بهذا الحديث، ويصفه بأنه ثلث العلم — لأن كل عمل عبادة يُحكم عليه أولًا من جهة النية." } },
  { scholar: "Ibn Rajab al-Hanbali", scholarAr: "ابن رجب الحنبلي", work: "Jami' al-'Ulum wal-Hikam", workAr: "جامع العلوم والحكم", sourceId: "jami_ulum",
    note: { en: "Explains the hadith addresses the unseen motive, not the outward form — two people doing the same deed can leave with entirely different outcomes.",
             ar: "يوضّح أن الحديث يتناول الباعث الخفي لا صورة العمل الظاهرة — فقد يقوم شخصان بنفس الفعل ويخرجان بنتيجتين مختلفتين تمامًا." } },
];

/* ---- Isnad ---- */
const CHAIN = [
  { id: "prophet", en: { label: "Prophet Muhammad ﷺ", role: "The source" }, ar: { label: "النبي محمد ﷺ", role: "مصدر الحديث" } },
  { id: "umar", en: { label: "'Umar ibn al-Khattab", role: "Companion — heard it directly" }, ar: { label: "عمر بن الخطاب", role: "صحابي — سمعه مباشرة" } },
  { id: "alqamah", en: { label: "'Alqamah ibn Waqqas", role: "Successor (Tabi'i)" }, ar: { label: "علقمة بن وقّاص", role: "تابعي" } },
  { id: "ibrahim", en: { label: "Muhammad ibn Ibrahim at-Taymi", role: "Narrator" }, ar: { label: "محمد بن إبراهيم التيمي", role: "راوٍ" } },
  { id: "yahya", en: { label: "Yahya ibn Sa'id al-Ansari", role: 'The single "neck" of the chain' }, ar: { label: "يحيى بن سعيد الأنصاري", role: "عنق السند — راوٍ واحد يمر به الإسناد كله" }, neck: true },
];
const BRANCHES = [
  { id: "thawri", en: { label: "Sufyan ath-Thawri" }, ar: { label: "سفيان الثوري" }, to: "bukhari" },
  { id: "malik", en: { label: "Malik ibn Anas" }, ar: { label: "مالك بن أنس" }, to: "both" },
  { id: "uyaynah", en: { label: "Sufyan ibn 'Uyaynah" }, ar: { label: "سفيان بن عيينة" }, to: "muslim" },
  { id: "qattan", en: { label: "Yahya ibn Sa'id al-Qattan" }, ar: { label: "يحيى بن سعيد القطان" }, to: "bukhari" },
  { id: "layth", en: { label: "Al-Layth ibn Sa'd" }, ar: { label: "الليث بن سعد" }, to: "muslim" },
];
const BOOKS = [
  { id: "bukhari", en: { label: "Sahih al-Bukhari", role: "Opens the Book of Revelation" }, ar: { label: "صحيح البخاري", role: "يفتتح كتاب بدء الوحي" } },
  { id: "muslim", en: { label: "Sahih Muslim", role: "Opens the Book of Leadership & Intention" }, ar: { label: "صحيح مسلم", role: "يفتتح أبواب النية والإمارة" } },
];
const TO_LABEL = { bukhari: { en: "Bukhari", ar: "البخاري" }, muslim: { en: "Muslim", ar: "مسلم" }, both: { en: "Both", ar: "كلاهما" } };
const BIO = {
  prophet: { dates: "570–632 CE", en: { grade: "—", note: "Recipient of revelation; the words trace directly back to him." }, ar: { grade: "—", note: "المصدر الذي جاء منه الوحي؛ يعود إليه الحديث مباشرة." } },
  umar: { dates: "c. 584–644 CE", en: { grade: "Companion (Sahabi)", note: "2nd Caliph, present when the words were spoken. Companions are accepted as reliable by consensus." }, ar: { grade: "صحابي", note: "الخليفة الثاني، حضر حين قِيلت هذه الكلمات. الصحابة مقبولون بالإجماع." } },
  alqamah: { dates: "d. c. 80 AH", en: { grade: "Thiqah (trustworthy)", note: "A respected Makkan successor who narrated directly from 'Umar." }, ar: { grade: "ثقة", note: "تابعي مكي موثوق، روى مباشرة عن عمر." } },
  ibrahim: { dates: "d. c. 120 AH", en: { grade: "Thiqah thabt (trustworthy, precise)", note: "Nephew of 'Alqamah; carried the narration forward within the family line." }, ar: { grade: "ثقة ثبت", note: "ابن أخي علقمة؛ حمل الرواية ضمن خط العائلة." } },
  yahya: { dates: "d. c. 143 AH", en: { grade: "Thiqah thabt hujjah (authoritative)", note: "Every chain for this hadith passes through him alone — the classic teaching example of a chain that is single-stranded up to one point, then explodes into mass transmission." }, ar: { grade: "ثقة ثبت حجة", note: "يمر به كل سند لهذا الحديث وحده — يُستخدم كمثال كلاسيكي لسند فرد ثم يتحول إلى تواتر." } },
  thawri: { dates: "d. 161 AH", en: { grade: "Thiqah hafiz", note: "One of over 200 narrators who took this hadith from Yahya." }, ar: { grade: "ثقة حافظ", note: "أحد أكثر من ٢٠٠ راوٍ أخذوا الحديث عن يحيى." } },
  malik: { dates: "d. 179 AH", en: { grade: "Thiqah, Imam", note: "Included it in al-Muwatta; his route reaches both Bukhari and Muslim." }, ar: { grade: "ثقة، إمام", note: "أدرجه في الموطأ، وطريقه يصل إلى البخاري ومسلم معًا." } },
  uyaynah: { dates: "d. 198 AH", en: { grade: "Thiqah hafiz", note: "A major Makkan hadith master; his route is used by Muslim." }, ar: { grade: "ثقة حافظ", note: "من كبار حفاظ الحديث بمكة، طريقه عند مسلم." } },
  qattan: { dates: "d. 198 AH", en: { grade: "Thiqah, Imam of hadith criticism", note: "Known for exacting standards; his acceptance of the chain carries weight." }, ar: { grade: "ثقة، إمام في نقد الحديث", note: "معروف بدقة معاييره؛ لقبوله السند وزن كبير." } },
  layth: { dates: "d. 175 AH", en: { grade: "Thiqah thabt", note: "Egyptian jurist and hadith master; his route is used by Muslim." }, ar: { grade: "ثقة ثبت", note: "فقيه وحافظ مصري، طريقه عند مسلم." } },
  bukhari: { dates: "~846 CE", en: { grade: "Sahih — highest tier", note: "Compiled from source; opens the entire Sahih with this hadith." }, ar: { grade: "صحيح — أعلى الدرجات", note: "جُمع من مصادره؛ يُفتتح به الصحيح كاملًا." } },
  muslim: { dates: "~850 CE", en: { grade: "Sahih — highest tier", note: "Also opens major chapters with this hadith, via a different route from Yahya." }, ar: { grade: "صحيح — أعلى الدرجات", note: "يُفتتح به أيضًا أبواب رئيسية، عبر طريق مختلف عن يحيى." } },
};

/* ---- Source library: the "Google Maps" index. Every referenced book is a
   real, trackable digitization target — not just a citation string. ---- */
const SOURCES = {
  bukhari: {
    id: "bukhari", title: "Sahih al-Bukhari", titleAr: "صحيح البخاري",
    author: "Imam al-Bukhari", authorAr: "الإمام البخاري", eraLabel: "194–256 AH",
    category: "hadith", categoryAr: "مجموعة حديث",
    totalUnits: 7563, indexedUnits: 1, unit: { en: "hadith", ar: "حديث" },
    locator: { en: "Book 1, Hadith 1", ar: "الكتاب ١، الحديث ١" },
    excerpt: null, // the digitized passage IS the hadith text shown in the reader
  },
  muslim: {
    id: "muslim", title: "Sahih Muslim", titleAr: "صحيح مسلم",
    author: "Imam Muslim ibn al-Hajjaj", authorAr: "الإمام مسلم بن الحجاج", eraLabel: "204–261 AH",
    category: "hadith", categoryAr: "مجموعة حديث",
    totalUnits: 7500, indexedUnits: 1, unit: { en: "hadith", ar: "حديث" },
    locator: { en: "Hadith 1907", ar: "الحديث ١٩٠٧" },
    excerpt: null,
  },
  sharh_arbain: {
    id: "sharh_arbain", title: "Sharh al-Arba'in an-Nawawiyyah", titleAr: "شرح الأربعين النووية",
    author: "Imam an-Nawawi", authorAr: "الإمام النووي", eraLabel: "631–676 AH",
    category: "commentary", categoryAr: "شرح",
    totalUnits: 42, indexedUnits: 2, unit: { en: "hadith commentaries", ar: "شرح حديث" },
    locator: { en: "Commentary on Hadith 1", ar: "شرح الحديث الأول" },
    excerpt: {
      en: "This hadith is one of the great foundations of the religion... the scholars say it is a third of Islam, since a person's deeds fall under three categories: heart, tongue, and limbs — and intention is the work of the heart.",
      ar: "هذا الحديث من الأحاديث العظيمة التي هي من قواعد الدين... قال العلماء: هو ثلث الإسلام، لأن كسب العبد يكون بقلبه ولسانه وجوارحه، والنية أحد هذه الأقسام الثلاثة.",
    },
  },
  jami_ulum: {
    id: "jami_ulum", title: "Jami' al-'Ulum wal-Hikam", titleAr: "جامع العلوم والحكم",
    author: "Ibn Rajab al-Hanbali", authorAr: "ابن رجب الحنبلي", eraLabel: "736–795 AH",
    category: "commentary", categoryAr: "شرح",
    totalUnits: 50, indexedUnits: 1, unit: { en: "chapters", ar: "بابًا" },
    locator: { en: "Chapter 1", ar: "الباب الأول" },
    excerpt: {
      en: "The intention referred to here is the motive that prompts a person to act — and it is this that separates worship from habit, and sincerity from show.",
      ar: "والنية المرادة هنا هي الباعث الذي يحمل الإنسان على الفعل، وبها يتميّز العمل العبادي من العادي، ويتميّز الإخلاص من الرياء.",
    },
  },
  fathalbari: {
    id: "fathalbari", title: "Fath al-Bari", titleAr: "فتح الباري بشرح صحيح البخاري",
    author: "Ibn Hajar al-Asqalani", authorAr: "ابن حجر العسقلاني", eraLabel: "773–852 AH",
    category: "commentary", categoryAr: "شرح",
    totalUnits: 9200, indexedUnits: 0, unit: { en: "pages", ar: "صفحة" },
    locator: { en: "Introduction, Book of Revelation", ar: "المقدمة، كتاب بدء الوحي" },
    excerpt: null,
  },
  tabaqat: {
    id: "tabaqat", title: "Al-Tabaqat al-Kubra", titleAr: "الطبقات الكبرى",
    author: "Ibn Sa'd", authorAr: "ابن سعد", eraLabel: "168–230 AH",
    category: "biography", categoryAr: "سِيَر وتراجم",
    totalUnits: 4250, indexedUnits: 0, unit: { en: "biographies", ar: "ترجمة" },
    locator: { en: "Biography of 'Umar ibn al-Khattab", ar: "ترجمة عمر بن الخطاب" },
    excerpt: null,
  },
  bidayah: {
    id: "bidayah", title: "Al-Bidayah wa'n-Nihayah", titleAr: "البداية والنهاية",
    author: "Ibn Kathir", authorAr: "ابن كثير", eraLabel: "701–774 AH",
    category: "history", categoryAr: "تاريخ",
    totalUnits: 14, indexedUnits: 0, unit: { en: "volumes", ar: "مجلدًا" },
    locator: { en: "The Caliphate of 'Umar", ar: "خلافة عمر بن الخطاب" },
    excerpt: null,
  },
};

const NARRATOR_SOURCES = {
  umar: ["tabaqat", "bidayah"],
};

const GRAPH_NODES = [
  { id: "center", en: "Hadith 1", ar: "الحديث الأول", type: "hadith", angle: 0 },
  { id: "umar", en: "'Umar ibn al-Khattab", ar: "عمر بن الخطاب", type: "narrator", angle: -90 },
  { id: "nawawi", en: "Imam an-Nawawi", ar: "الإمام النووي", type: "scholar", angle: -30 },
  { id: "bayyinah", en: "Al-Bayyinah 98:5", ar: "البيّنة ٩٨:٥", type: "verse", angle: 40 },
  { id: "isra", en: "Al-Isra 17:19", ar: "الإسراء ١٧:١٩", type: "verse", angle: 100 },
  { id: "sincerity", en: "Ikhlas", ar: "الإخلاص", type: "topic", angle: 155 },
  { id: "hijra", en: "The Hijrah", ar: "الهجرة", type: "event", angle: -150 },
];
const NODE_COLORS = { hadith: "#C79A46", narrator: "#0E4F3F", scholar: "#3E6F5C", verse: "#7B8F5D", topic: "#B4763B", event: "#6A5A8C" };
const NODE_DETAIL = {
  center: { en: "The opening hadith of the Forty: every action's worth begins with intention.", ar: "الحديث الافتتاحي للأربعين: قيمة كل عمل تبدأ من النية." },
  umar: { en: "Second caliph; narrated this to a gathering. It became the standard opener for books of Islamic law.", ar: "الخليفة الثاني؛ رواه في مجلس. أصبح الافتتاحية المعتادة لكتب الفقه." },
  nawawi: { en: "13th-century Damascene scholar whose commentary made this collection central to beginner study.", ar: "عالم دمشقي من القرن الثالث عشر، جعل شرحه هذه المجموعة محورية لدراسة المبتدئين." },
  bayyinah: { en: "Commands sincerity, devoting religion purely to God.", ar: "تأمر بالإخلاص وإفراد الدين لله." },
  isra: { en: "Effort is only credited for what a person genuinely sought.", ar: "السعي يُحسب فقط لما طلبه الإنسان فعلًا." },
  sincerity: { en: "Ikhlas — purifying intention so an act is for God alone.", ar: "الإخلاص — تصفية النية ليكون العمل لله وحده." },
  hijra: { en: "The migration to Madinah — the example the hadith uses to test motive.", ar: "الهجرة إلى المدينة — المثال الذي يستخدمه الحديث لاختبار الدافع." },
};

const QUIZ = [
  { q: { en: "What determines the value of an action?", ar: "ما الذي يحدد قيمة العمل؟" },
    options: [{ en: "Its visible size", ar: "حجمه الظاهر" }, { en: "The intention behind it", ar: "النية وراءه" }, { en: "Who witnesses it", ar: "من يشهده" }], correct: 1 },
  { q: { en: "What example does the hadith use for mixed intentions?", ar: "ما المثال الذي يستخدمه الحديث لاختلاط النية؟" },
    options: [{ en: "Public prayer", ar: "الصلاة العلنية" }, { en: "Emigration (hijrah)", ar: "الهجرة" }, { en: "Anonymous charity", ar: "الصدقة السرية" }], correct: 1 },
];

const COMPANION_ANSWERS = {
  en: [
    "It's like getting credit for homework based on why you did it — copying it to avoid trouble doesn't count the same as doing it to learn. God looks at your 'why', not just the finished page.",
    "Two students study the same night — one to genuinely understand and help others, one only to show off a grade. Same action, different intention, different weight.",
    "The chain (isnad) is how scholars verified a saying actually reached the Prophet ﷺ reliably — checking that every link was trustworthy and precise, generation by generation.",
  ],
  ar: [
    "الأمر أشبه بالحصول على درجة في الواجب المدرسي بناءً على سبب قيامك به — نسخه لتجنّب المشكلة لا يُحسب مثل أدائه للتعلّم فعلًا. الله ينظر إلى «لماذا» فعلت الشيء، لا فقط إلى الصفحة المكتملة.",
    "طالبان يذاكران في نفس الليلة — أحدهما ليفهم فعلًا ويفيد غيره، والآخر فقط ليتباهى بالدرجة. الفعل نفسه، لكن النية مختلفة، والوزن مختلف.",
    "السند هو الطريقة التي تحقّق بها العلماء من وصول القول فعلًا إلى النبي ﷺ بشكل موثوق — بالتأكد أن كل حلقة كانت أمينة ودقيقة، جيلًا بعد جيل.",
  ],
};

function useIsMobile(breakpoint = 980) {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const f = () => setM(window.innerWidth < breakpoint);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [breakpoint]);
  return m;
}

/* Deterministic pseudo-random occlusion — same word set hidden for a given
   difficulty until the reader changes level, rather than re-shuffling on
   every render (which would make it useless for repetition practice). */
function isOccluded(index, difficulty) {
  const hash = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
  return hash < difficulty;
}

function sourcePct(source) {
  if (!source || !source.totalUnits) return 0;
  return (source.indexedUnits / source.totalUnits) * 100;
}

function formatPct(pct, indexedUnits) {
  if (indexedUnits > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export default function AlMinhejMemorize() {
  const [view, setView] = useState("library"); // library | workspace
  const [showToc, setShowToc] = useState(false);
  const [toast, setToast] = useState(null);
  const [dark, setDark] = useState(false);
  const [uiLang, setUiLang] = useState("ar");
  const [showTranslation, setShowTranslation] = useState(false);
  const [subtitleLang, setSubtitleLang] = useState("en");
  const [fontScale, setFontScale] = useState(1);
  const [hoverVocab, setHoverVocab] = useState(null);
  const [discovered, setDiscovered] = useState(new Set());
  const [rightTab, setRightTab] = useState("understand");
  const [activeNarrator, setActiveNarrator] = useState("yahya");
  const [activeGraphNode, setActiveGraphNode] = useState("center");
  const [takeaway, setTakeaway] = useState("");
  const [actionItem, setActionItem] = useState("");
  const [quizState, setQuizState] = useState({});
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [companionPrompt, setCompanionPrompt] = useState(null);
  const [sheet, setSheet] = useState(null); // null | 'chain' | 'study'
  const [onboarding, setOnboarding] = useState(true);

  const [memorize, setMemorize] = useState(false);
  const [difficulty, setDifficulty] = useState(0.35);
  const [revealed, setRevealed] = useState(new Set());
  const [reciteCount, setReciteCount] = useState(0);

  const [activeSource, setActiveSource] = useState(null);
  const [votes, setVotes] = useState({});
  const [voted, setVoted] = useState(new Set());

  const isCompact = useIsMobile(1040); // phones + tablets: center-first layout
  const t = T[uiLang];
  const dir = uiLang === "ar" ? "rtl" : "ltr";

  const c = dark
    ? { bg: "#101613", panel: "#182420", panel2: "#1E2C26", ink: "#F4EFE2", sub: "#B9C4BC", line: "rgba(244,239,226,0.12)", emerald: "#3E8C6F", gold: "#D9B876" }
    : { bg: "#FBF7EE", panel: "#FFFFFF", panel2: "#F3EEE0", ink: "#16211D", sub: "#5C6A61", line: "rgba(22,33,29,0.10)", emerald: "#0E4F3F", gold: "#B4863A" };

  const vocabByWord = useMemo(() => { const m = {}; VOCAB.forEach((v) => (m[v.word] = v)); return m; }, []);
  const HEADER_H = 56;
  const paneStyle = { background: c.bg, color: c.ink, height: "100%", overflowY: "auto" };
  const uiFont = uiLang === "ar" ? "'Cairo', 'Inter', sans-serif" : "'Inter', sans-serif";

  const showCenter = true;

  const onVocabClick = (id) => {
    setHoverVocab((h) => (h === id ? null : id));
    setDiscovered((d) => new Set(d).add(id));
  };

  // Flatten every clause into one continuous word list, tagging each word
  // with a stable global index used for occlusion + vocab lookups.
  const words = useMemo(() => {
    const list = [];
    let idx = 0;
    CLAUSES.forEach((cl) => {
      cl.ar.split(" ").forEach((w) => {
        list.push({ key: `${cl.id}-${idx}`, raw: w, clean: w.replace(/[،,.:]/g, ""), idx });
        idx += 1;
      });
    });
    return list;
  }, []);

  const toggleReveal = (key) => {
    setRevealed((r) => {
      const n = new Set(r);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const openBook = (book) => {
    if (!book.active) {
      setToast(t.bookNotOpen);
      return;
    }
    setView("workspace");
  };

  const openChapter = (chapter) => {
    if (chapter.pages === 0) {
      setToast(t.tocLocked);
      return;
    }
    setShowToc(false);
  };

  const fullTranslation = CLAUSES.map((cl) => cl[subtitleLang]).join(" ");

  if (view === "library") {
    return (
      <div dir={dir} style={{ height: "100vh", width: "100%", background: c.bg, color: c.ink, fontFamily: uiFont, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        <style>{FONT_IMPORT}{`
          .amiri { font-family: 'Amiri', serif; }
          .fraunces { font-family: 'Fraunces', serif; }
          * { box-sizing: border-box; }
          @keyframes fadeUpLib { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform:translateY(0);} }
          @keyframes toastInLib { from { opacity:0; transform: translate(-50%,-8px);} to { opacity:1; transform: translate(-50%,0);} }
          .fade-up-lib { animation: fadeUpLib .45s ease both; }
          .book-card { transition: transform .2s, box-shadow .2s; }
          .book-card:hover { transform: translateY(-3px); }
        `}</style>

        <header style={{ height: HEADER_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${c.line}`, flexShrink: 0, background: c.panel }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: c.emerald, display: "grid", placeItems: "center" }}>
              <span className="amiri" style={{ color: c.gold, fontSize: 15 }}>ن</span>
            </div>
            <span className="fraunces" style={{ fontSize: 17, fontWeight: 600 }}>{t.appName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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

        <div className="fade-up-lib" style={{ flex: 1, overflowY: "auto", padding: "50px 24px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: c.gold, fontSize: 11, letterSpacing: 1.5, marginBottom: 10, textTransform: uiLang === "en" ? "uppercase" : "none" }}>
                <Library size={13} /> {t.libraryShelfTag}
              </div>
              <h1 className="fraunces" style={{ fontSize: 38, fontWeight: 600, margin: 0 }}>{t.libraryShelfTitle}</h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: "10px 16px", marginBottom: 36 }}>
              <Search size={15} color={c.sub} />
              <input placeholder={t.searchPlaceholder} style={{ border: "none", outline: "none", background: "none", flex: 1, fontSize: 13, color: c.ink, fontFamily: "inherit" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {SHELF_BOOKS.map((book) => (
                <button key={book.id} onClick={() => openBook(book)} className="book-card"
                  style={{ textAlign: "start", cursor: "pointer", border: `1px solid ${c.line}`, borderRadius: 14, background: c.panel, padding: 0, overflow: "hidden", opacity: book.active ? 1 : 0.6 }}>
                  <div style={{ height: 90, background: `linear-gradient(135deg, ${c.emerald}, ${c.emerald}cc)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <span className="amiri" style={{ fontSize: 22, color: c.gold }}>{book.ar.slice(0, 1)}</span>
                    {!book.active && (
                      <div style={{ position: "absolute", top: 8, insetInlineEnd: 8, width: 22, height: 22, borderRadius: 999, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center" }}>
                        <Lock size={11} color="#fff" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4, lineHeight: 1.35 }}>{uiLang === "ar" ? book.ar : book.en}</div>
                    <div style={{ fontSize: 10, color: c.sub, marginBottom: 6 }}>{uiLang === "ar" ? book.authorAr : book.authorEn}</div>
                    <div style={{ fontSize: 9.5, color: c.gold }}>{book.total} {uiLang === "ar" ? book.unitAr : book.unitEn}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {toast && (
          <div style={{ position: "fixed", top: 66, insetInlineStart: "50%", transform: "translateX(-50%)", zIndex: 90, background: c.ink, color: c.bg, padding: "10px 18px", borderRadius: 999, fontSize: 12, animation: "toastInLib .25s ease", boxShadow: "0 12px 30px -10px rgba(0,0,0,.4)", whiteSpace: "nowrap" }}>
            {toast}
          </div>
        )}
      </div>
    );
  }

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
        button:focus-visible, [tabindex]:focus-visible { outline: 2px solid ${c.gold}; outline-offset: 2px; }
        .pill { font-size:11.5px; padding:6px 11px; border-radius:999px; cursor:pointer; transition:all .15s; border:1px solid ${c.line}; background:transparent; color:${c.sub}; white-space:nowrap; font-family: inherit; }
        .pill.active { background:${c.emerald}; color:#F4EFE2; border-color:${c.emerald}; }
        .occluded-word { filter: blur(5px); opacity: .55; cursor: pointer; transition: filter .25s, opacity .25s; }
        .occluded-word.revealed { filter: blur(0); opacity: 1; }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 ${c.gold}55; } 50% { box-shadow: 0 0 0 6px ${c.gold}00; } }
        .invite-pulse { animation: pulseGlow 1.8s ease-in-out infinite; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      {onboarding && <Onboarding c={c} onPick={(mode) => {
        if (mode === "immersive") { setUiLang("ar"); setShowTranslation(false); }
        else { setUiLang("en"); setShowTranslation(true); setSubtitleLang("en"); }
        setOnboarding(false);
      }} />}

      {activeSource && (
        <SourceDetailModal
          c={c} uiLang={uiLang} dir={dir} t={t}
          sourceId={activeSource}
          onClose={() => setActiveSource(null)}
          onVote={castVote}
          voted={voted.has(activeSource)}
          voteCount={votes[activeSource] || 0}
        />
      )}

      {/* HEADER */}
      <header style={{ height: HEADER_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${c.line}`, flexShrink: 0, background: c.panel }}>
        <button onClick={() => setView("library")} title={t.backToLibrary}
          style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: c.emerald, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <span className="amiri" style={{ color: c.gold, fontSize: 15 }}>ن</span>
          </div>
          <span className="fraunces" style={{ fontSize: 17, fontWeight: 600, color: c.ink }}>{t.appName}</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {discovered.size > 0 && (
            <div style={{ fontSize: 10.5, color: c.gold, background: `${c.gold}18`, borderRadius: 999, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkle size={11} /> {discovered.size}/{VOCAB.length} {t.wordsExplored}
            </div>
          )}
          <button onClick={() => setOnboarding(true)} title={t.reopenPicker}
            style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: c.panel2, border: `1px solid ${c.line}`, cursor: "pointer" }}>
            <Languages size={14} />
          </button>
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

      {/* PAGE CHROME — book / chapter / volume / page, matching real citation structure */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: `1px solid ${c.line}`, background: c.panel2, flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <button onClick={() => setShowToc(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "5px 10px", borderRadius: 999, background: c.panel, border: `1px solid ${c.line}`, color: c.ink, cursor: "pointer" }}>
            <List size={12} /> {t.toc}
          </button>
          <div style={{ fontSize: 11, color: c.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ fontWeight: 700, color: c.ink }}>{uiLang === "ar" ? "صحيح البخاري" : "Sahih al-Bukhari"}</span>
            {" · "}{uiLang === "ar" ? TOC_CHAPTERS[0].ar : TOC_CHAPTERS[0].en}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: c.sub }}>
          <button disabled style={{ width: 24, height: 24, borderRadius: 6, background: c.panel, border: `1px solid ${c.line}`, color: c.sub, opacity: 0.4, display: "grid", placeItems: "center" }}>
            {dir === "rtl" ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
          <span>{t.volume} ١ · {t.page} ٢ {t.ofUnits} ٧٥٦٣</span>
          <button onClick={() => setToast(t.nextPageLocked)}
            style={{ width: 24, height: 24, borderRadius: 6, background: c.panel, border: `1px solid ${c.line}`, color: c.ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
            {dir === "rtl" ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      {/* TOC drawer */}
      {showToc && (
        <>
          <div onClick={() => setShowToc(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 95 }} />
          <div style={{ position: "fixed", top: 0, bottom: 0, insetInlineStart: 0, width: isCompact ? "86%" : 340, zIndex: 96, background: c.panel, borderInlineEnd: `1px solid ${c.line}`, padding: 18, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{t.toc}</span>
              <button onClick={() => setShowToc(false)} style={{ background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 999, width: 28, height: 28, color: c.sub, cursor: "pointer" }}><X size={13} /></button>
            </div>
            <div style={{ fontSize: 11, color: c.sub, marginBottom: 14 }}>{t.tocHint}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {TOC_CHAPTERS.map((chap) => (
                <button key={chap.id} onClick={() => openChapter(chap)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "start",
                    padding: "11px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                    background: chap.pages > 0 ? `${c.emerald}14` : c.panel2,
                    border: `1px solid ${chap.pages > 0 ? c.emerald + "44" : c.line}`,
                  }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: c.ink }}>{uiLang === "ar" ? chap.ar : chap.en}</div>
                    <div style={{ fontSize: 9.5, color: chap.pages > 0 ? c.emerald : c.sub, marginTop: 2 }}>
                      {chap.pages > 0 ? `${chap.pages} ${t.tocDigitizedPages}` : t.notDigitizedYet}
                    </div>
                  </div>
                  {chap.pages === 0 && <Lock size={13} color={c.sub} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", top: HEADER_H + 44, insetInlineStart: "50%", transform: "translateX(-50%)", zIndex: 99, background: c.ink, color: c.bg, padding: "10px 18px", borderRadius: 999, fontSize: 12, boxShadow: "0 12px 30px -10px rgba(0,0,0,.4)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* LEFT — chain of narration (static pane on desktop, bottom sheet on compact) */}
        <aside
          className="scroller"
          style={
            isCompact
              ? {
                  ...paneStyle,
                  position: "fixed",
                  insetInline: 0,
                  bottom: 56,
                  height: "72vh",
                  maxHeight: "72vh",
                  borderRadius: "20px 20px 0 0",
                  borderTop: `1px solid ${c.line}`,
                  boxShadow: "0 -12px 34px -12px rgba(0,0,0,.35)",
                  zIndex: 75,
                  padding: 18,
                  paddingTop: 10,
                  transform: sheet === "chain" ? "translateY(0)" : "translateY(110%)",
                  transition: "transform .32s cubic-bezier(.32,.72,0,1)",
                }
              : { ...paneStyle, width: 300, flexShrink: 0, borderInlineEnd: `1px solid ${c.line}`, padding: 18 }
          }
        >
          {isCompact && <SheetHandle c={c} title={t.chainEyebrow} onClose={() => setSheet(null)} />}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, color: c.gold }}>
              <GitBranch size={14} />
              <span style={{ fontSize: 11.5, letterSpacing: 0.5, textTransform: uiLang === "en" ? "uppercase" : "none", fontWeight: 700 }}>{t.chainEyebrow}</span>
            </div>
            <h2 className="fraunces" style={{ fontSize: 18, fontWeight: 600, marginBottom: 14, fontFamily: uiLang === "ar" ? "'Cairo', sans-serif" : "'Fraunces', serif" }}>{t.chainTitle}</h2>

            <div style={{ background: `${c.emerald}14`, border: `1px solid ${c.emerald}44`, borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", gap: 8 }}>
              <ShieldCheck size={16} color={c.emerald} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11.5, lineHeight: 1.6, color: c.ink }}>{t.authenticity}</p>
            </div>

            <div style={{ position: "relative", paddingInlineStart: 18 }}>
              <div style={{ position: "absolute", insetInlineStart: 5, top: 6, bottom: 6, width: 2, background: c.line }} />
              {CHAIN.map((n) => (
                <ChainNode key={n.id} n={n[uiLang]} neck={n.neck} c={c} active={activeNarrator === n.id} onClick={() => setActiveNarrator(n.id)} />
              ))}
            </div>

            <div style={{ fontSize: 10.5, color: c.sub, margin: "10px 0 8px", paddingInlineStart: 18 }}>{t.transmittedBy}</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingInlineStart: 18, marginBottom: 14 }}>
              {BRANCHES.map((b) => (
                <button key={b.id} onClick={() => setActiveNarrator(b.id)}
                  style={{ fontSize: 11, padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                    background: activeNarrator === b.id ? c.gold : c.panel2, color: activeNarrator === b.id ? "#241c0a" : c.ink,
                    border: `1px solid ${activeNarrator === b.id ? c.gold : c.line}` }}>
                  {b[uiLang].label} <span style={{ opacity: 0.6 }}>← {TO_LABEL[b.to][uiLang]}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, paddingInlineStart: 18, marginBottom: 16 }}>
              {BOOKS.map((b) => (
                <button key={b.id} onClick={() => setActiveNarrator(b.id)}
                  style={{ flex: 1, textAlign: dir === "rtl" ? "right" : "left", padding: 10, borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                    background: activeNarrator === b.id ? c.emerald : c.panel2, color: activeNarrator === b.id ? "#F4EFE2" : c.ink,
                    border: `1px solid ${activeNarrator === b.id ? c.emerald : c.line}` }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>{b[uiLang].label}</div>
                  <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>{b[uiLang].role}</div>
                </button>
              ))}
            </div>

            <BioCard c={c} id={activeNarrator} uiLang={uiLang} t={t} onOpenSource={setActiveSource} />
          </aside>

        {/* CENTER — compact reading / memorization canvas */}
        {showCenter && (
          <main className="scroller" style={{ ...paneStyle, flex: 1, minWidth: 0, padding: `26px 6vw ${isCompact ? 76 : 26}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* toolbar */}
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
              {!memorize && showTranslation && (
                <div style={{ display: "flex", gap: 4 }}>
                  {Object.entries(SUBTITLE_LANGS).map(([k, l]) => (
                    <button key={k} className={`pill ${subtitleLang === k ? "active" : ""}`} onClick={() => setSubtitleLang(k)}>{l}</button>
                  ))}
                </div>
              )}

              <button
                onClick={() => (memorize ? setMemorize(false) : enterMemorize())}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                  background: memorize ? c.emerald : c.panel2, color: memorize ? "#F4EFE2" : c.ink, border: `1px solid ${memorize ? c.emerald : c.line}` }}>
                <Brain size={13} /> {t.memorize}
              </button>
            </div>

            {memorize && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap", justifyContent: "center" }}>
                {[["easy", 0.2], ["medium", 0.4], ["hard", 0.65]].map(([key, val]) => (
                  <button key={key} className={`pill ${Math.abs(difficulty - val) < 0.01 ? "active" : ""}`}
                    onClick={() => { setDifficulty(val); setRevealed(new Set()); }}>
                    {t[key]}
                  </button>
                ))}
                <button onClick={() => setRevealed(new Set(words.map((w) => w.key)))}
                  className="pill" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <RotateCcw size={11} /> {t.revealAll}
                </button>
              </div>
            )}

            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 10.5, letterSpacing: uiLang === "en" ? 1.5 : 0, color: c.gold, textTransform: uiLang === "en" ? "uppercase" : "none" }}>{t.originalLabel}</span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 18, fontSize: 11, color: c.sub, opacity: 0.85, maxWidth: 460 }}>
              {memorize ? t.memorizeHint : t.tapHint}
            </div>

            {/* isnad intro line */}
            {!memorize && (
              <button onClick={() => { setActiveNarrator("umar"); if (isCompact) setSheet("chain"); }}
                style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", cursor: "pointer", marginBottom: 18, maxWidth: 640 }}>
                <div dir="rtl" className="amiri" style={{ fontSize: 13.5 * fontScale, color: c.sub, lineHeight: 1.9 }}>{ISNAD_INTRO.ar}</div>
                {showTranslation && (
                  <div style={{ fontSize: 11, color: c.sub, opacity: 0.75, marginTop: 2, fontStyle: "italic" }}>
                    {ISNAD_INTRO_SUB[subtitleLang]}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: c.gold, marginTop: 4 }}>{t.viewChain}</div>
              </button>
            )}

            {/* ---- Compact continuous Arabic block ---- */}
            <div
              style={{
                maxWidth: 640,
                width: "100%",
                background: c.panel,
                border: `1px solid ${c.line}`,
                borderRadius: 20,
                padding: isCompact ? "24px 18px" : "34px 30px",
                boxShadow: memorize ? `0 0 0 2px ${c.emerald}33` : "none",
                transition: "box-shadow .3s",
              }}
            >
              <p dir="rtl" className="amiri" style={{ fontSize: (isCompact ? 23 : 27) * fontScale, lineHeight: 1.75, textAlign: "center", margin: 0 }}>
                {words.map((w) => {
                  const v = vocabByWord[w.clean];
                  const occluded = memorize && isOccluded(w.idx, difficulty);
                  const isRevealed = revealed.has(w.key);

                  const content = (
                    <span
                      className={occluded ? `occluded-word${isRevealed ? " revealed" : ""}` : ""}
                      onClick={(e) => {
                        if (occluded) {
                          e.stopPropagation();
                          toggleReveal(w.key);
                          return;
                        }
                        if (v) {
                          e.stopPropagation();
                          setHoverVocab((h) => (h === v.id ? null : v.id));
                          onVocabClick(v.id);
                        }
                      }}
                    >
                      {w.raw}
                    </span>
                  );

                  if (v && !occluded) {
                    return (
                      <span key={w.key}>
                        <span
                          className={`vocab-word ${discovered.size === 0 && w.idx === 0 ? "invite-pulse" : ""}`}
                          style={{ position: "relative" }}
                          onMouseEnter={() => setHoverVocab(v.id)}
                          onMouseLeave={() => setHoverVocab(null)}
                        >
                          {content}
                          {hoverVocab === v.id && <VocabPopover v={v} c={c} uiLang={uiLang} />}
                        </span>{" "}
                      </span>
                    );
                  }
                  return <span key={w.key}>{content} </span>;
                })}
              </p>

              {!memorize && showTranslation && (
                <p style={{ textAlign: "center", fontSize: 14, color: c.sub, fontStyle: "italic", opacity: 0.82, marginTop: 18, marginBottom: 0, lineHeight: 1.6 }}>
                  {fullTranslation}
                </p>
              )}
            </div>

            {memorize && (
              <button
                onClick={() => setReciteCount((n) => n + 1)}
                style={{
                  marginTop: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600,
                  padding: "10px 20px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                  background: c.gold, color: "#241c0a", border: "none",
                }}
              >
                <Flame size={15} /> {t.recitedBtn} {reciteCount > 0 && `· ${reciteCount} ${t.recitedCount}`}
              </button>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 22 }}>
              <button
                onClick={() => { setActiveNarrator("umar"); if (isCompact) setSheet("chain"); }}
                style={{ fontSize: 11.5, color: c.sub, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, fontFamily: "inherit" }}
              >
                {uiLang === "ar" ? "عمر بن الخطاب" : "'Umar ibn al-Khattab"}
              </button>
              <span style={{ fontSize: 11.5, color: c.sub }}>·</span>
              <SourceChip c={c} uiLang={uiLang} t={t} sourceId="bukhari" onOpen={setActiveSource} />
              <SourceChip c={c} uiLang={uiLang} t={t} sourceId="muslim" onOpen={setActiveSource} />
            </div>
          </main>
        )}

        {/* RIGHT — study panel (static pane on desktop, bottom sheet on compact) */}
        <aside
          className="scroller"
          style={
            isCompact
              ? {
                  ...paneStyle,
                  position: "fixed",
                  insetInline: 0,
                  bottom: 56,
                  height: "72vh",
                  maxHeight: "72vh",
                  borderRadius: "20px 20px 0 0",
                  borderTop: `1px solid ${c.line}`,
                  boxShadow: "0 -12px 34px -12px rgba(0,0,0,.35)",
                  zIndex: 75,
                  padding: 18,
                  paddingTop: 10,
                  transform: sheet === "study" ? "translateY(0)" : "translateY(110%)",
                  transition: "transform .32s cubic-bezier(.32,.72,0,1)",
                }
              : { ...paneStyle, width: 340, flexShrink: 0, borderInlineStart: `1px solid ${c.line}`, padding: 18 }
          }
        >
          {isCompact && <SheetHandle c={c} title={t.mStudy} onClose={() => setSheet(null)} />}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 }}>
              {[["understand", t.tabUnderstand], ["vocab", t.tabVocab], ["connect", t.tabConnect], ["practice", t.tabPractice], ["library", t.tabLibrary]].map(([k, l]) => (
                <button key={k} className={`pill ${rightTab === k ? "active" : ""}`} onClick={() => setRightTab(k)}>{l}</button>
              ))}
            </div>

            {rightTab === "understand" && (
              <div style={{ display: "grid", gap: 14 }}>
                <LabeledCard c={c} kind="ai" title={t.aiExplanationTitle} icon={<Sparkles size={13} />} uiLang={uiLang}>
                  {uiLang === "ar"
                    ? "النية هي الفاتورة المرفقة بكل عمل — فهي ما يُحاسَب عليه المرء فعليًا. قد يقوم شخصان بنفس الفعل الظاهر، لكنهما يخرجان بنتيجتين مختلفتين تمامًا، لأن قيمة العمل تُقاس بما قصده صاحبه."
                    : "Intention is the invoice attached to every action — it's what's actually being billed. Two people doing the same visible act can walk away with entirely different results, because the deed is only ever worth what they meant by it."}
                </LabeledCard>
                <LabeledCard c={c} kind="scholar" title={t.scholarCommentaryTitle} icon={<BookOpen size={13} />} uiLang={uiLang}>
                  {COMMENTARY[0].note[uiLang]}
                  <div style={{ marginTop: 10 }}>
                    <SourceChip c={c} uiLang={uiLang} t={t} sourceId={COMMENTARY[0].sourceId} onOpen={setActiveSource} />
                  </div>
                </LabeledCard>
                <InfoTile c={c} icon={<MapPin size={14} />} title={t.whyHijrahTitle} uiLang={uiLang}>
                  {uiLang === "ar"
                    ? "كانت الهجرة أغلى ما يمكن أن يقدّمه المؤمن. اختيارها مثالًا يجعل الفكرة لا لبس فيها: إن كانت الهجرة نفسها تُفرَّغ من قيمتها بسبب الدافع، فلا شيء يُستثنى."
                    : "Hijrah was the costliest act a believer could make. Using it as the example makes the point unmissable: if even that can be emptied by motive, nothing is exempt."}
                </InfoTile>
                <div>
                  <SmallHeading c={c} icon={<Quote size={12} />} text={t.moreCommentaryTitle} uiLang={uiLang} />
                  {COMMENTARY.slice(1).map((cm) => (
                    <div key={cm.scholar} style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{uiLang === "ar" ? cm.scholarAr : cm.scholar} <span style={{ fontWeight: 400, color: c.sub }}>· {uiLang === "ar" ? cm.workAr : cm.work}</span></div>
                      <p style={{ fontSize: 12, color: c.sub, lineHeight: 1.6, marginBottom: 8 }}>{cm.note[uiLang]}</p>
                      <SourceChip c={c} uiLang={uiLang} t={t} sourceId={cm.sourceId} onOpen={setActiveSource} />
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveSource("fathalbari")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: `1px dashed ${c.line}`, borderRadius: 12, padding: 12, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <span style={{ fontSize: 11.5, color: c.sub }}>{t.goDeeper}: {uiLang === "ar" ? SOURCES.fathalbari.titleAr : SOURCES.fathalbari.title}</span>
                    <span style={{ fontSize: 10, color: "#B0785A", fontWeight: 700 }}>{t.notDigitizedYet}</span>
                  </button>
                </div>
                <div>
                  <SmallHeading c={c} icon={<Sparkles size={12} />} text={t.echoedQuranTitle} uiLang={uiLang} />
                  {QURAN_LINKS.map((q) => (
                    <div key={q.ref} style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: c.gold, fontWeight: 600, marginBottom: 6 }}>{uiLang === "ar" ? q.refAr : q.ref}</div>
                      <p dir="rtl" className="amiri" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 6 }}>{q.ar}</p>
                      <p style={{ fontSize: 11.5, color: c.sub, lineHeight: 1.55 }}>{q.note[uiLang]}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <SmallHeading c={c} icon={<Info size={12} />} text={t.relatedHadithTitle} uiLang={uiLang} />
                  {RELATED_HADITH.map((h, i) => (
                    <div key={i} style={{ background: c.panel2, borderRadius: 12, padding: 12, borderInlineStart: `3px solid ${c.emerald}`, marginBottom: 8 }}>
                      <p style={{ fontSize: 12, lineHeight: 1.55 }}>{h.text[uiLang]}</p>
                      <div style={{ fontSize: 10, color: c.sub, marginTop: 6 }}>{uiLang === "ar" ? h.srcAr : h.src}</div>
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
              <div>
                <MiniGraph c={c} active={activeGraphNode} setActive={setActiveGraphNode} uiLang={uiLang} />
                <div style={{ marginTop: 12, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Network size={13} color={c.gold} />
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{GRAPH_NODES.find((n) => n.id === activeGraphNode)?.[uiLang]}</span>
                  </div>
                  <p style={{ fontSize: 12, color: c.sub, lineHeight: 1.55 }}>{NODE_DETAIL[activeGraphNode][uiLang]}</p>
                </div>
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
              <div>
                <p style={{ fontSize: 11.5, color: c.sub, lineHeight: 1.55, marginBottom: 14 }}>{t.libraryIntro}</p>
                <div style={{ display: "grid", gap: 8 }}>
                  {Object.values(SOURCES)
                    .sort((a, b) => sourcePct(b) - sourcePct(a))
                    .map((s) => {
                      const pct = sourcePct(s);
                      return (
                        <button
                          key={s.id}
                          onClick={() => setActiveSource(s.id)}
                          style={{ textAlign: dir === "rtl" ? "right" : "left", background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: c.ink }}>{uiLang === "ar" ? s.titleAr : s.title}</span>
                            <span style={{ fontSize: 10.5, color: c.sub }}>{formatPct(pct, s.indexedUnits)}</span>
                          </div>
                          <div style={{ fontSize: 10, color: c.sub, marginBottom: 7 }}>
                            {uiLang === "ar" ? s.categoryAr : s.category} · {uiLang === "ar" ? s.authorAr : s.author}
                          </div>
                          <SourceProgressBar c={c} pct={pct} />
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </aside>
      </div>

      {/* Backdrop for the open bottom sheet (compact layouts only) */}
      {isCompact && sheet && (
        <div
          onClick={() => setSheet(null)}
          style={{ position: "fixed", inset: 0, bottom: 56, background: "rgba(10,14,12,.5)", zIndex: 70 }}
        />
      )}

      {/* Bottom tab bar — compact layouts only. The center canvas is never
          replaced by these tabs; they open an overlay sheet on top of it. */}
      {isCompact && (
        <nav
          style={{
            position: "fixed", bottom: 0, insetInline: 0, height: 56, zIndex: 76,
            display: "flex", background: c.panel, borderTop: `1px solid ${c.line}`,
          }}
        >
          <BottomTabButton
            active={sheet === "chain"}
            icon={<GitBranch size={17} />}
            label={t.mChain}
            c={c}
            onClick={() => setSheet((s) => (s === "chain" ? null : "chain"))}
          />
          <div style={{ width: 1, background: c.line, margin: "10px 0" }} />
          <BottomTabButton
            active={sheet === "study"}
            icon={<BookOpen size={17} />}
            label={t.mStudy}
            c={c}
            onClick={() => setSheet((s) => (s === "study" ? null : "study"))}
          />
        </nav>
      )}

      {/* Companion */}
      <button onClick={() => setCompanionOpen((v) => !v)}
        style={{ position: "fixed", bottom: isCompact ? 72 : 20, insetInlineEnd: 20, width: 50, height: 50, borderRadius: 999, background: c.emerald, color: c.gold, border: "none", display: "grid", placeItems: "center", boxShadow: "0 12px 30px -8px rgba(0,0,0,.4)", zIndex: 80, cursor: "pointer" }}
        aria-label="Open AI companion">
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
            <div style={{ fontSize: 12, lineHeight: 1.6, background: c.panel2, borderRadius: 9, padding: 11, color: c.ink }}>
              {COMPANION_ANSWERS[uiLang][companionPrompt]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Onboarding({ c, onPick }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,12,.72)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: c.panel, borderRadius: 22, padding: 30, maxWidth: 560, width: "100%", border: `1px solid ${c.line}`, textAlign: "center" }}>
        <div className="amiri" style={{ fontSize: 34, color: c.gold, marginBottom: 4 }}>مرحبًا بك</div>
        <div className="fraunces" style={{ fontSize: 15, color: c.sub, marginBottom: 22 }}>Welcome</div>
        <div style={{ fontSize: 13, color: c.ink, marginBottom: 22 }}>كيف تفضّل قراءة الحديث؟ &nbsp;·&nbsp; How would you like to read the hadith?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <button onClick={() => onPick("immersive")} style={{ textAlign: "center", padding: 20, borderRadius: 16, background: c.panel2, border: `1px solid ${c.line}`, cursor: "pointer" }}>
            <div className="amiri" style={{ fontSize: 20, color: c.emerald, marginBottom: 6 }}>العربية أولًا</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8, color: c.ink }}>Arabic First</div>
            <div style={{ fontSize: 11, color: c.sub, lineHeight: 1.6 }}>اقرأ النص كما هو، والترجمة مخفية افتراضيًا.<br />Translation hidden by default.</div>
          </button>
          <button onClick={() => onPick("guided")} style={{ textAlign: "center", padding: 20, borderRadius: 16, background: c.panel2, border: `1px solid ${c.line}`, cursor: "pointer" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: c.gold }}>Guided with translation</div>
            <div className="amiri" style={{ fontSize: 16, color: c.ink, marginBottom: 8 }}>موجَّه بالترجمة</div>
            <div style={{ fontSize: 11, color: c.sub, lineHeight: 1.6 }}>Keep a helper paragraph under the text.<br />أبقِ فقرة مساعدة أسفل النص.</div>
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: c.sub, marginTop: 18 }}>You can switch anytime from the header.</div>
      </div>
    </div>
  );
}

/* ---------- Source library components ---------- */

function SourceProgressBar({ c, pct, height = 5 }) {
  const color = pct >= 40 ? c.emerald : pct >= 5 ? c.gold : "#B0785A";
  return (
    <div style={{ height, borderRadius: 999, background: c.panel2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(pct, 2)}%`, background: color, borderRadius: 999, transition: "width .3s" }} />
    </div>
  );
}

function SourceChip({ c, uiLang, t, sourceId, onOpen }) {
  const s = SOURCES[sourceId];
  if (!s) return null;
  const pct = sourcePct(s);
  const digitized = s.indexedUnits > 0;
  return (
    <button
      onClick={() => onOpen(sourceId)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 6px", borderRadius: 999,
        background: c.panel2, border: `1px solid ${c.line}`, cursor: "pointer", fontFamily: "inherit",
      }}
    >
      <span
        style={{
          width: 7, height: 7, borderRadius: 999, flexShrink: 0,
          background: digitized ? c.emerald : "#B0785A",
        }}
      />
      <span style={{ fontSize: 11, color: c.ink, fontWeight: 600 }}>{uiLang === "ar" ? s.titleAr : s.title}</span>
      <span style={{ fontSize: 9.5, color: c.sub }}>{formatPct(pct, s.indexedUnits)}</span>
    </button>
  );
}

function SourceDetailModal({ c, uiLang, dir, t, sourceId, onClose, onVote, voted, voteCount }) {
  const s = SOURCES[sourceId];
  if (!s) return null;
  const pct = sourcePct(s);
  const digitized = s.indexedUnits > 0;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,14,12,.65)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}
    >
      <div
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        style={{ background: c.panel, borderRadius: 22, padding: 26, maxWidth: 460, width: "100%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${c.line}` }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10.5, color: c.gold, fontWeight: 700, marginBottom: 4 }}>
              {uiLang === "ar" ? s.categoryAr : s.category}
            </div>
            <div className={uiLang === "ar" ? "amiri" : "fraunces"} style={{ fontSize: uiLang === "ar" ? 22 : 19, fontWeight: 600, color: c.ink, lineHeight: 1.3 }}>
              {uiLang === "ar" ? s.titleAr : s.title}
            </div>
            <div style={{ fontSize: 11.5, color: c.sub, marginTop: 4 }}>
              {t.author}: {uiLang === "ar" ? s.authorAr : s.author} · {s.eraLabel}
            </div>
          </div>
          <button onClick={onClose} style={{ background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 999, width: 28, height: 28, display: "grid", placeItems: "center", color: c.sub, cursor: "pointer", flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ fontSize: 11, color: c.sub, marginBottom: 6 }}>
          {t.hadithNo} {uiLang === "ar" ? s.locator.ar : s.locator.en}
        </div>

        <div style={{ marginBottom: 6 }}>
          <SourceProgressBar c={c} pct={pct} height={7} />
        </div>
        <div style={{ fontSize: 11, color: c.sub, marginBottom: 18 }}>
          {s.indexedUnits.toLocaleString()} {t.ofUnits} {s.totalUnits.toLocaleString()} {uiLang === "ar" ? s.unit.ar : s.unit.en} {t.unitsDigitized} · {formatPct(pct, s.indexedUnits)}
        </div>

        {digitized && s.excerpt ? (
          <div style={{ background: c.panel2, borderRadius: 14, padding: 16, marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: c.emerald, fontWeight: 700, marginBottom: 8 }}>{t.readPassage}</div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: c.ink }}>{s.excerpt[uiLang]}</p>
          </div>
        ) : digitized ? (
          <div style={{ background: `${c.emerald}14`, border: `1px solid ${c.emerald}44`, borderRadius: 14, padding: 16, marginBottom: 6, fontSize: 12.5, color: c.ink }}>
            {uiLang === "ar" ? "النص المرقمن لهذا الموضع معروض بالفعل ضمن الحديث نفسه أعلاه." : "The digitized passage for this exact reference is shown in the hadith reader itself above."}
          </div>
        ) : (
          <div style={{ background: "#B0785A14", border: "1px solid #B0785A44", borderRadius: 14, padding: 16, marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: "#B0785A", fontWeight: 700, marginBottom: 8 }}>{t.notDigitizedYet}</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: c.ink, marginBottom: 12 }}>{t.sourceEmptyNote}</p>
            <button
              onClick={() => onVote(sourceId)}
              disabled={voted}
              style={{
                display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, padding: "8px 14px",
                borderRadius: 999, border: "none", cursor: voted ? "default" : "pointer", fontFamily: "inherit",
                background: voted ? c.panel2 : c.gold, color: voted ? c.sub : "#241c0a",
              }}
            >
              <Flame size={13} /> {voted ? t.voted : t.helpPrioritize}
              {voteCount > 0 && ` · ${voteCount} ${t.votesLabel}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SheetHandle({ c, title, onClose }) {
  const startY = useRef(null);
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        onTouchStart={(e) => { startY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 60) onClose();
          startY.current = null;
        }}
        style={{ width: 36, height: 4, borderRadius: 999, background: c.line, margin: "2px auto 12px", cursor: "grab" }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{title}</span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: c.panel2, border: `1px solid ${c.line}`, color: c.sub, cursor: "pointer" }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function BottomTabButton({ active, icon, label, c, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2, background: "none", border: "none", cursor: "pointer",
        color: active ? c.gold : c.sub,
      }}
    >
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}

function ChainNode({ n, neck, c, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "inherit", background: "none", border: "none", cursor: "pointer", padding: "6px 0", position: "relative", fontFamily: "inherit" }}>
      <span style={{ position: "absolute", insetInlineStart: -18, top: 10, width: 10, height: 10, borderRadius: 999, background: active ? c.gold : neck ? c.emerald : c.panel2, border: `2px solid ${active ? c.gold : c.line}` }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 600, color: active ? c.gold : c.ink }}>{n.label}</div>
        <div style={{ fontSize: 10.5, color: c.sub }}>{n.role}</div>
      </div>
    </button>
  );
}

function BioCard({ c, id, uiLang, t, onOpenSource }) {
  const b = BIO[id];
  const chainItem = CHAIN.find((x) => x.id === id) || BRANCHES.find((x) => x.id === id) || BOOKS.find((x) => x.id === id);
  if (!b || !chainItem) return null;

  const isBookEntity = SOURCES[id] && (id === "bukhari" || id === "muslim");
  const narratorSourceIds = NARRATOR_SOURCES[id];

  return (
    <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: 14 }}>
      <div className="fraunces" style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, fontFamily: uiLang === "ar" ? "'Cairo',sans-serif" : "'Fraunces',serif" }}>{chainItem[uiLang].label}</div>
      <div style={{ fontSize: 10.5, color: c.sub, marginBottom: 8 }}>{b.dates}</div>
      <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 600, color: c.gold, background: `${c.gold}18`, borderRadius: 999, padding: "3px 9px", marginBottom: 10 }}>{b[uiLang].grade}</div>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: c.ink, marginBottom: isBookEntity || narratorSourceIds ? 12 : 0 }}>{b[uiLang].note}</p>

      {isBookEntity && (
        <button
          onClick={() => onOpenSource(id)}
          style={{ width: "100%", textAlign: "inherit", background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 10, padding: 10, cursor: "pointer", fontFamily: "inherit" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, color: c.emerald, fontWeight: 700 }}>{t.digitizedBadge}</span>
            <span style={{ fontSize: 10, color: c.sub }}>{formatPct(sourcePct(SOURCES[id]), SOURCES[id].indexedUnits)}</span>
          </div>
          <SourceProgressBar c={c} pct={sourcePct(SOURCES[id])} />
        </button>
      )}

      {narratorSourceIds && (
        <div>
          <div style={{ fontSize: 10, color: c.sub, marginBottom: 6 }}>{t.referencedIn}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {narratorSourceIds.map((sid) => (
              <SourceChip key={sid} c={c} uiLang={uiLang} t={t} sourceId={sid} onOpen={onOpenSource} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SmallHeading({ c, icon, text, uiLang }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: c.gold, textTransform: uiLang === "en" ? "uppercase" : "none", letterSpacing: 0.5, marginBottom: 8 }}>{icon}{text}</div>;
}

function VocabPopover({ v, c, uiLang }) {
  return (
    <span style={{ position: "absolute", bottom: "130%", left: "50%", transform: "translateX(-50%)", background: c.ink, color: c.bg, borderRadius: 10, padding: "9px 12px", fontSize: 11.5, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", zIndex: 20, boxShadow: "0 10px 25px -8px rgba(0,0,0,.4)", textAlign: "center", lineHeight: 1.5 }}>
      <b>{v[uiLang]}</b><br />{uiLang === "ar" ? "الجذر" : "root"} {v.root} · {v.pron}
    </span>
  );
}

function LabeledCard({ c, kind, title, icon, children, uiLang }) {
  const cfg = kind === "ai" ? { border: c.gold, bg: `${c.gold}14`, tag: c.gold } : { border: c.emerald, bg: `${c.emerald}14`, tag: c.emerald };
  return (
    <div style={{ border: `1px solid ${cfg.border}55`, background: cfg.bg, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: cfg.tag, fontWeight: 700, fontSize: 11, textTransform: uiLang === "en" ? "uppercase" : "none" }}>{icon} {title}</div>
      <p style={{ fontSize: 12.5, lineHeight: 1.65, color: c.ink }}>{children}</p>
    </div>
  );
}

function InfoTile({ c, icon, title, children, uiLang }) {
  return (
    <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, color: c.gold }}>{icon}<span style={{ fontWeight: 600, fontSize: 12.5, color: c.ink }}>{title}</span></div>
      <p style={{ fontSize: 12, lineHeight: 1.55, color: c.sub }}>{children}</p>
    </div>
  );
}

function polar(cx, cy, r, deg) { const a = (deg * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }

function MiniGraph({ c, active, setActive, uiLang }) {
  const cx = 150, cy = 150, R = 105;
  return (
    <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: 8 }}>
      <svg viewBox="0 0 300 300" style={{ width: "100%", height: "auto", display: "block" }}>
        {GRAPH_NODES.filter((n) => n.id !== "center").map((n) => {
          const [x, y] = polar(cx, cy, R, n.angle);
          const isActive = active === n.id;
          return <line key={"l" + n.id} x1={cx} y1={cy} x2={x} y2={y} stroke={isActive ? c.gold : c.line} strokeWidth={isActive ? 2 : 1} />;
        })}
        {GRAPH_NODES.map((n) => {
          const isCenter = n.id === "center";
          const [x, y] = isCenter ? [cx, cy] : polar(cx, cy, R, n.angle);
          const isActive = active === n.id;
          const fill = isCenter ? NODE_COLORS.hadith : NODE_COLORS[n.type];
          const radius = isCenter ? 20 : isActive ? 15 : 12;
          return (
            <g key={n.id} onClick={() => setActive(n.id)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={radius} fill={fill} stroke={isActive ? c.gold : "transparent"} strokeWidth={2.5} />
              <text x={x} y={y + radius + 11} textAnchor="middle" fontSize="8.5" fill={c.sub} fontFamily={uiLang === "ar" ? "Cairo, sans-serif" : "Inter, sans-serif"}>
                {n[uiLang].length > 14 ? n[uiLang].slice(0, 13) + "…" : n[uiLang]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
