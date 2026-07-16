import React, { useState, useEffect, useMemo } from "react";
import {
  Play, Bookmark, X, Sparkles, BookOpen, Users, MapPin, Quote,
  Sun, Moon, Languages, Compass, Lock, Sparkle, ArrowRight, Volume2,
} from "lucide-react";

/* ============================================================
   AlMinhej — Knowledge Orbit
   A ground-up rethink per the preview assessment:
   - Manuscript-first entry (the text IS the destination, not a page header)
   - No "Lesson" framing anywhere — a Journey, a Stop, a discovery
   - The hadith is the sun; everything else orbits it, expands in place,
     never navigates away (still honors the "center always visible" rule —
     just expressed as astronomy instead of a three-pane app shell)
   - Progressive disclosure via a Knowledge Depth slider — same content,
     different projection, matching the KnowledgeNode architecture
   - Words are alive: hover glows, tap opens a live panel
   - A Knowledge Compass replaces the sidebar
   - The AI only ever asks about what's on screen right now
   ============================================================ */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Amiri:wght@400;700&family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');`;

const T = {
  ar: {
    tapHint: "المس أي مكان للبدء",
    beginBtn: "ابدأ الاستكشاف",
    subtitle: "الحديث الأول من الأربعين النووية",
    compassHere: "أنت هنا",
    compassConnected: "متصل بـ",
    depthLabel: "عمق المعرفة",
    beginner: "مبتدئ", intermediate: "متوسط", scholar: "عالِم",
    locked: "يُفتح في المستوى",
    discovered: "مفهوم مكتشَف",
    discoveredTitle: "لقد اكتشفت",
    newUnlocked: "مفهومًا جديدًا انفتح",
    askAbout: "اسأل عن هذا النص",
    currentlyViewing: "تنظر الآن إلى",
    tapWordHint: "المس أي كلمة لتكتشف معناها",
    showTranslation: "إظهار الترجمة", hideTranslation: "إخفاء الترجمة",
    word: "الكلمة", root: "الجذر", meaning: "المعنى", occurrences: "مرات الورود",
    relatedConcepts: "مفاهيم ذات صلة",
    close: "إغلاق",
  },
  en: {
    tapHint: "Tap anywhere to begin",
    beginBtn: "Begin Exploring",
    subtitle: "Hadith One of the Forty Nawawi",
    compassHere: "You are here",
    compassConnected: "Connected to",
    depthLabel: "Knowledge Depth",
    beginner: "Beginner", intermediate: "Intermediate", scholar: "Scholar",
    locked: "Unlocks at", discovered: "concepts discovered",
    discoveredTitle: "You discovered",
    newUnlocked: "new concepts unlocked",
    askAbout: "Ask about this text",
    currentlyViewing: "Currently viewing",
    tapWordHint: "Tap any word to discover its meaning",
    showTranslation: "Show translation", hideTranslation: "Hide translation",
    word: "Word", root: "Root", meaning: "Meaning", occurrences: "Occurrences",
    relatedConcepts: "Related concepts",
    close: "Close",
  },
};

const CLAUSES_AR = [
  "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ،",
  "وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى،",
  "فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ",
  "فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ،",
  "وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا",
  "فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ",
];
const CLAUSES_EN = [
  "Actions are only judged by the intentions behind them,",
  "and every person will be credited only for what they intended.",
  "So whoever's emigration was for the sake of God and His Messenger,",
  "their emigration counts for God and His Messenger.",
  "And whoever's emigration was for some worldly gain, or to marry a woman,",
  "their emigration counts only for what they emigrated for.",
];

const VOCAB = [
  { id: "amal", word: "الْأَعْمَالُ", root: "ع-م-ل", occ: 364, en: "deeds, actions", ar: "الأفعال والتصرفات", related: { en: ["Worship", "Work", "Character"], ar: ["العبادة", "العمل", "الأخلاق"] } },
  { id: "niyyat", word: "بِالنِّيَّاتِ", root: "ن-و-ي", occ: 47, en: "by intentions", ar: "القصد الباطن للفعل", related: { en: ["Sincerity", "Ikhlas"], ar: ["الإخلاص", "الصدق"] } },
  { id: "imri", word: "امْرِئٍ", root: "م-ر-أ", occ: 81, en: "a person, individual", ar: "الشخص أو الفرد", related: { en: ["Accountability"], ar: ["المسؤولية"] } },
  { id: "hijratuh", word: "هِجْرَتُهُ", root: "ه-ج-ر", occ: 29, en: "his emigration", ar: "هجرته، انتقاله", related: { en: ["The Hijrah", "Sacrifice"], ar: ["الهجرة", "التضحية"] } },
  { id: "yusibuha", word: "يُصِيبُهَا", root: "ص-و-ب", occ: 12, en: "to attain / gain it", ar: "يحصل عليها من الدنيا", related: { en: ["Worldly gain"], ar: ["الدنيا"] } },
  { id: "yankihuha", word: "يَنْكِحُهَا", root: "ن-ك-ح", occ: 9, en: "to marry her", ar: "يتزوج بها", related: { en: ["Marriage"], ar: ["الزواج"] } },
];

const ORBIT_NODES = [
  { id: "scholar", angle: -90, icon: BookOpen, minDepth: 0, en: "Scholar", ar: "العلماء" },
  { id: "reflect", angle: -45, icon: Sparkle, minDepth: 0, en: "Reflection", ar: "التأمل" },
  { id: "quran", angle: 0, icon: Sparkles, minDepth: 1, en: "Qur'an", ar: "القرآن" },
  { id: "history", angle: 45, icon: MapPin, minDepth: 1, en: "History", ar: "التاريخ" },
  { id: "related", angle: 90, icon: Quote, minDepth: 2, en: "Related Hadith", ar: "أحاديث ذات صلة" },
  { id: "concepts", angle: 135, icon: Compass, minDepth: 2, en: "Concepts", ar: "مفاهيم" },
  { id: "narrator", angle: 180, icon: Users, minDepth: 1, en: "Narrator", ar: "الراوي" },
  { id: "vocab", angle: -135, icon: Languages, minDepth: 1, en: "Vocabulary", ar: "المفردات" },
];

const COMPASS_CONNECTED = {
  en: ["Prayer", "Faith", "Migration", "Ikhlas", "Business Ethics", "Character"],
  ar: ["الصلاة", "الإيمان", "الهجرة", "الإخلاص", "أخلاقيات المعاملات", "الأخلاق"],
};

const AI_QUESTIONS = {
  en: [
    "Need help understanding this sentence?",
    "Why was this hadith narrated?",
    "Explain migration in this context.",
  ],
  ar: [
    "هل تحتاج مساعدة لفهم هذه الجملة؟",
    "لماذا رُوي هذا الحديث؟",
    "اشرح الهجرة في هذا السياق.",
  ],
};
const AI_ANSWERS = {
  en: [
    "This sentence is the hinge of the whole hadith: everything after it — the two hijrah examples — is just a demonstration of this one rule in action.",
    "Reports say it responded to a real case: a man who emigrated to Madinah to marry, not purely for faith. The Prophet ﷺ turned that one incident into a universal principle.",
    "Migration to Madinah was the costliest, most visible act of faith available. Using it as the example makes the point impossible to miss — if even that can be emptied by motive, nothing is exempt.",
  ],
  ar: [
    "هذه الجملة هي محور الحديث كله — كل ما يليها من مثالي الهجرة هو تطبيق عملي لهذه القاعدة الواحدة.",
    "تذكر بعض الروايات أنه استجابة لحادثة حقيقية: رجل هاجر إلى المدينة ليتزوج لا خالصًا لله. حوّل النبي ﷺ تلك الحادثة إلى قاعدة عامة.",
    "كانت الهجرة إلى المدينة أغلى عمل إيماني ظاهر يمكن تقديمه. اختيارها مثالًا يجعل الفكرة لا تُخطئها العين — إن كانت هي نفسها تُفرَّغ بالدافع، فلا شيء يُستثنى.",
  ],
};

function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 900 : false);
  useEffect(() => {
    const f = () => setM(window.innerWidth < 900);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return m;
}

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export default function AlMinhejOrbit() {
  const [dark, setDark] = useState(true);
  const [uiLang, setUiLang] = useState("ar");
  const [view, setView] = useState("hero"); // hero | orbit
  const [depth, setDepth] = useState(1); // 0 beginner, 1 intermediate, 2 scholar
  const [activeOrbit, setActiveOrbit] = useState(null);
  const [activeWord, setActiveWord] = useState(null);
  const [discovered, setDiscovered] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const isMobile = useIsMobile();
  const t = T[uiLang];
  const dir = uiLang === "ar" ? "rtl" : "ltr";

  const c = dark
    ? { bg: "#0B0F0D", panel: "#141F1A", panel2: "#1B2620", ink: "#F4EFE2", sub: "#9FB0A6", line: "rgba(244,239,226,0.10)", emerald: "#3E8C6F", gold: "#D9B876" }
    : { bg: "#FBF7EE", panel: "#FFFFFF", panel2: "#F3EEE0", ink: "#16211D", sub: "#5C6A61", line: "rgba(22,33,29,0.10)", emerald: "#0E4F3F", gold: "#B4863A" };

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  const vocabByWord = useMemo(() => {
    const m = {};
    VOCAB.forEach((v) => (m[v.word] = v));
    return m;
  }, []);

  const discoverConcept = (id) => {
    setDiscovered((d) => {
      if (d.has(id)) return d;
      const n = new Set(d).add(id);
      if (n.size === 4 || n.size === 8) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
      }
      return n;
    });
  };

  const enterOrbit = () => setView("orbit");

  const orbitPanelSize = isMobile
    ? { position: "fixed", insetInline: 0, bottom: 0, height: "62vh", borderRadius: "22px 22px 0 0" }
    : { position: "fixed", insetInlineEnd: 0, top: 0, bottom: 0, width: 400, borderRadius: "22px 0 0 22px" };

  return (
    <div dir={dir} style={{ height: "100vh", width: "100%", background: c.bg, color: c.ink, fontFamily: uiLang === "ar" ? "'Cairo','Inter',sans-serif" : "'Inter',sans-serif", overflow: "hidden", position: "relative" }}>
      <style>{FONT_IMPORT}{`
        .amiri { font-family: 'Amiri', serif; }
        .fraunces { font-family: 'Fraunces', serif; }
        * { box-sizing: border-box; }
        ::selection { background: ${c.gold}55; }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes softPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @keyframes glowIn { from { opacity:0; transform: scale(.94);} to { opacity:1; transform: scale(1);} }
        @keyframes ringSpin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes wordGlow { 0%,100% { text-shadow: 0 0 0px ${c.gold}00; } 50% { text-shadow: 0 0 14px ${c.gold}aa; } }
        .orbit-node { animation: floatY 5s ease-in-out infinite; }
        .discovered-badge { animation: glowIn .4s ease; }
        .toast-in { animation: glowIn .5s ease; }
        .word-hot { cursor:pointer; transition: color .2s, text-shadow .2s; }
        .word-hot:hover { color: ${c.gold}; text-shadow: 0 0 10px ${c.gold}88; }
        .locked-node { filter: grayscale(1) opacity(.35); cursor: not-allowed !important; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* ---------------- HEADER (always present, minimal) ---------------- */}
      <header style={{ position: "absolute", top: 0, insetInline: 0, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: c.emerald, display: "grid", placeItems: "center" }}>
            <span className="amiri" style={{ color: c.gold, fontSize: 14 }}>ن</span>
          </div>
          {view === "orbit" && (
            <span className="fraunces" style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>AlMinhej</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setUiLang((l) => (l === "ar" ? "en" : "ar"))}
            style={{ width: 30, height: 30, borderRadius: 8, background: `${c.panel2}cc`, border: `1px solid ${c.line}`, color: c.ink, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>
            {uiLang === "ar" ? "EN" : "AR"}
          </button>
          <button onClick={() => setDark((d) => !d)}
            style={{ width: 30, height: 30, borderRadius: 8, background: `${c.panel2}cc`, border: `1px solid ${c.line}`, color: c.ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
            {dark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </header>

      {/* ================= HERO — the manuscript ================= */}
      {view === "hero" && (
        <div
          onClick={enterOrbit}
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: dark
              ? "radial-gradient(ellipse at center, #16241d 0%, #0B0F0D 70%)"
              : "radial-gradient(ellipse at center, #FFFFFF 0%, #FBF7EE 70%)",
          }}
        >
          {/* illuminated frame */}
          <div style={{
            position: "relative", maxWidth: 720, width: "88%", padding: isMobile ? "44px 24px" : "70px 60px",
            border: `1.5px solid ${c.gold}55`, borderRadius: 4, textAlign: "center",
          }}>
            {[["0%", "0%"], ["100%", "0%"], ["0%", "100%"], ["100%", "100%"]].map(([x, y], i) => (
              <div key={i} style={{
                position: "absolute", left: x, top: y, width: 22, height: 22,
                transform: `translate(${x === "0%" ? "-1px" : "-21px"}, ${y === "0%" ? "-1px" : "-21px"})`,
                borderTop: y === "0%" ? `2px solid ${c.gold}` : "none",
                borderBottom: y === "100%" ? `2px solid ${c.gold}` : "none",
                borderLeft: x === "0%" ? `2px solid ${c.gold}` : "none",
                borderRight: x === "100%" ? `2px solid ${c.gold}` : "none",
              }} />
            ))}

            <div style={{ fontSize: 10.5, letterSpacing: 3, color: c.gold, marginBottom: 22, textTransform: uiLang === "en" ? "uppercase" : "none" }}>
              {t.subtitle}
            </div>
            <p className="amiri" style={{ fontSize: isMobile ? 30 : 42, lineHeight: 2, margin: 0, color: c.ink }}>
              {CLAUSES_AR.slice(0, 2).join(" ")}
            </p>
            <div style={{ marginTop: 26, display: "flex", gap: 14, justifyContent: "center" }}>
              <IconGhost c={c} icon={<Play size={13} />} />
              <IconGhost c={c} icon={<Bookmark size={13} fill={bookmarked ? c.gold : "none"} />} onClick={(e) => { e.stopPropagation(); setBookmarked((b) => !b); }} />
            </div>
          </div>

          <div style={{
            marginTop: 34, fontSize: 12, color: c.sub, opacity: hintVisible ? 1 : 0,
            transition: "opacity 1s", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <span style={{ animation: hintVisible ? "softPulse 2.4s ease-in-out infinite" : "none" }}>{t.tapHint}</span>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 999,
              background: c.emerald, color: "#F4EFE2", fontSize: 13, fontWeight: 600,
            }}>
              {t.beginBtn} <ArrowRight size={14} style={{ transform: dir === "rtl" ? "scaleX(-1)" : "none" }} />
            </div>
          </div>
        </div>
      )}

      {/* ================= ORBIT — the exploration workspace ================= */}
      {view === "orbit" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          {/* Knowledge Compass */}
          <div style={{
            position: "absolute", top: 60, insetInlineStart: "50%", transform: "translateX(-50%)",
            zIndex: 30, background: `${c.panel}dd`, backdropFilter: "blur(6px)", border: `1px solid ${c.line}`,
            borderRadius: 999, padding: "7px 16px", display: "flex", alignItems: "center", gap: 10,
            fontSize: 11, whiteSpace: "nowrap", maxWidth: "92vw", overflowX: "auto",
          }}>
            <Compass size={13} color={c.gold} />
            <span style={{ color: c.sub }}>{t.compassHere}:</span>
            <span style={{ fontWeight: 700 }}>{uiLang === "ar" ? "الحديث ← النية" : "Hadith → Intention"}</span>
            <span style={{ color: c.line, opacity: 0.6 }}>|</span>
            <span style={{ color: c.sub }}>{t.compassConnected}:</span>
            {COMPASS_CONNECTED[uiLang].slice(0, isMobile ? 3 : 6).map((topic) => (
              <span key={topic} style={{ padding: "3px 9px", borderRadius: 999, background: c.panel2, fontSize: 10 }}>{topic}</span>
            ))}
          </div>

          {/* discovery badge */}
          {discovered.size > 0 && (
            <div className="discovered-badge" style={{
              position: "absolute", top: 60, insetInlineEnd: 14, zIndex: 30,
              background: `${c.gold}22`, border: `1px solid ${c.gold}55`, borderRadius: 999,
              padding: "6px 12px", fontSize: 10.5, color: c.gold, display: "flex", alignItems: "center", gap: 5,
            }}>
              <Sparkle size={11} /> {discovered.size} {t.discovered}
            </div>
          )}

          {/* Depth slider */}
          <div style={{
            position: "absolute", bottom: isMobile ? 18 : 24, insetInlineStart: "50%", transform: "translateX(-50%)",
            zIndex: 30, background: `${c.panel}dd`, backdropFilter: "blur(6px)", border: `1px solid ${c.line}`,
            borderRadius: 16, padding: "10px 18px", width: isMobile ? "88%" : 360,
          }}>
            <div style={{ fontSize: 10, color: c.sub, marginBottom: 8, textAlign: "center" }}>{t.depthLabel}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🌱</span>
              <div style={{ flex: 1, position: "relative", height: 4, background: c.panel2, borderRadius: 4 }}>
                <div style={{ position: "absolute", top: 0, insetInlineStart: 0, height: 4, width: `${(depth / 2) * 100}%`, background: c.emerald, borderRadius: 4, transition: "width .25s" }} />
                {[0, 1, 2].map((lvl) => (
                  <button key={lvl} onClick={() => setDepth(lvl)}
                    style={{
                      position: "absolute", top: "50%", insetInlineStart: `${(lvl / 2) * 100}%`, transform: "translate(-50%,-50%)",
                      width: 16, height: 16, borderRadius: 999, cursor: "pointer",
                      background: depth >= lvl ? c.emerald : c.panel2, border: `2px solid ${depth === lvl ? c.gold : c.line}`,
                    }} />
                ))}
              </div>
              <span style={{ fontSize: 14 }}>🎓</span>
            </div>
            <div style={{ textAlign: "center", fontSize: 10.5, color: c.gold, marginTop: 6, fontWeight: 700 }}>
              {[t.beginner, t.intermediate, t.scholar][depth]}
            </div>
          </div>

          {/* Orbit canvas */}
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "90px 20px 120px" }}>
            <svg viewBox="0 0 100 100" style={{ position: "absolute", width: isMobile ? 320 : 460, height: isMobile ? 320 : 460, opacity: 0.35 }}>
              <circle cx="50" cy="50" r="38" fill="none" stroke={c.gold} strokeWidth="0.3" strokeDasharray="1 2" />
              <circle cx="50" cy="50" r="38" fill="none" stroke={c.gold} strokeWidth="0.15" style={{ transformOrigin: "50% 50%", animation: "ringSpin 90s linear infinite" }} strokeDasharray="0.5 3" />
            </svg>

            {/* Orbit nodes */}
            {ORBIT_NODES.map((node) => {
              const R = isMobile ? 140 : 205;
              const [x, y] = polar(50, 50, 50, node.angle);
              const px = (x / 100) * (R * 2);
              const py = (y / 100) * (R * 2);
              const locked = depth < node.minDepth;
              const Icon = node.icon;
              return (
                <button
                  key={node.id}
                  className={`orbit-node ${locked ? "locked-node" : ""}`}
                  style={{
                    position: "absolute", left: `calc(50% + ${px - R}px)`, top: `calc(50% + ${py - R}px)`,
                    transform: "translate(-50%,-50%)", animationDelay: `${node.angle}ms`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: locked ? "not-allowed" : "pointer",
                    background: "none", border: "none", zIndex: 20,
                  }}
                  onClick={() => !locked && setActiveOrbit(node.id)}
                  title={locked ? `${t.locked} ${node.minDepth === 1 ? t.intermediate : t.scholar}` : undefined}
                >
                  <div style={{
                    width: isMobile ? 46 : 56, height: isMobile ? 46 : 56, borderRadius: 999, display: "grid", placeItems: "center",
                    background: activeOrbit === node.id ? c.gold : c.panel, color: activeOrbit === node.id ? "#241c0a" : c.ink,
                    border: `1.5px solid ${activeOrbit === node.id ? c.gold : c.line}`, boxShadow: locked ? "none" : `0 8px 20px -8px ${c.emerald}55`,
                  }}>
                    {locked ? <Lock size={16} /> : <Icon size={17} />}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: c.sub, whiteSpace: "nowrap" }}>{node[uiLang]}</span>
                </button>
              );
            })}

            {/* Central hadith — the sun */}
            <div style={{
              position: "relative", zIndex: 25, maxWidth: isMobile ? 240 : 320, textAlign: "center",
              background: c.panel, border: `1.5px solid ${c.gold}44`, borderRadius: 20,
              padding: isMobile ? "22px 18px" : "30px 26px", boxShadow: `0 20px 50px -20px ${c.emerald}66`,
            }}>
              <p dir="rtl" className="amiri" style={{ fontSize: isMobile ? 17 : 20, lineHeight: 2, margin: 0 }}>
                {CLAUSES_AR.map((clause, ci) => (
                  <span key={ci}>
                    {clause.split(" ").map((w, wi) => {
                      const clean = w.replace(/[،,.:]/g, "");
                      const v = depth >= 1 ? vocabByWord[clean] : null;
                      if (v) {
                        return (
                          <span key={wi} className="word-hot" onClick={() => { setActiveWord(v.id); discoverConcept(v.id); }}
                            style={{ animation: activeWord === v.id ? "wordGlow 1.4s ease-in-out infinite" : "none" }}>
                            {w}{" "}
                          </span>
                        );
                      }
                      return <span key={wi}>{w} </span>;
                    })}
                  </span>
                ))}
              </p>
              {showTranslation && (
                <p style={{ fontSize: 11.5, color: c.sub, fontStyle: "italic", marginTop: 12, lineHeight: 1.6 }}>
                  {CLAUSES_EN.join(" ")}
                </p>
              )}
              <button onClick={() => setShowTranslation((s) => !s)}
                style={{ marginTop: 12, fontSize: 10.5, color: c.gold, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                {showTranslation ? t.hideTranslation : t.showTranslation}
              </button>
              {depth >= 1 && (
                <div style={{ fontSize: 9.5, color: c.sub, marginTop: 10, opacity: 0.75 }}>{t.tapWordHint}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Orbit node detail panel (slides in, center stays visible) ---------------- */}
      {activeOrbit && (
        <>
          <div onClick={() => setActiveOrbit(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 60 }} />
          <div className="toast-in" style={{
            ...orbitPanelSize, zIndex: 65, background: c.panel, borderInlineStart: isMobile ? "none" : `1px solid ${c.line}`,
            borderTop: isMobile ? `1px solid ${c.line}` : "none", boxShadow: "0 -10px 40px -10px rgba(0,0,0,.4)",
            padding: 20, overflowY: "auto",
          }}>
            <OrbitPanelContent nodeId={activeOrbit} c={c} uiLang={uiLang} t={t} onClose={() => setActiveOrbit(null)}
              onDiscover={discoverConcept} onAskAi={(idx) => { setAiOpen(true); setAiAnswer(idx); setActiveOrbit(null); }} />
          </div>
        </>
      )}

      {/* ---------------- Word detail panel ---------------- */}
      {activeWord && (
        <>
          <div onClick={() => setActiveWord(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 60 }} />
          <div className="toast-in" style={{
            ...orbitPanelSize, zIndex: 65, background: c.panel, borderInlineStart: isMobile ? "none" : `1px solid ${c.line}`,
            borderTop: isMobile ? `1px solid ${c.line}` : "none", padding: 22, overflowY: "auto",
          }}>
            {(() => {
              const v = VOCAB.find((x) => x.id === activeWord);
              return (
                <div>
                  <button onClick={() => setActiveWord(null)} style={{ float: dir === "rtl" ? "left" : "right", background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 999, width: 28, height: 28, color: c.sub, cursor: "pointer" }}><X size={13} /></button>
                  <div className="amiri" style={{ fontSize: 40, textAlign: "center", margin: "20px 0 6px", color: c.gold }}>{v.word}</div>
                  <div style={{ display: "grid", gap: 14, marginTop: 26 }}>
                    <DetailRow c={c} label={t.meaning} value={v[uiLang]} />
                    <DetailRow c={c} label={t.root} value={v.root} />
                    <DetailRow c={c} label={t.occurrences} value={v.occ.toLocaleString()} />
                    <div>
                      <div style={{ fontSize: 10.5, color: c.sub, marginBottom: 8 }}>{t.relatedConcepts}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {v.related[uiLang].map((r) => (
                          <span key={r} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 999, background: c.panel2, border: `1px solid ${c.line}` }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* ---------------- Discovery toast ---------------- */}
      {showToast && (
        <div className="toast-in" style={{
          position: "fixed", top: 100, insetInlineStart: "50%", transform: "translateX(-50%)", zIndex: 90,
          background: c.emerald, color: "#F4EFE2", padding: "14px 22px", borderRadius: 16, textAlign: "center",
          boxShadow: "0 20px 40px -12px rgba(0,0,0,.4)", maxWidth: 300,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🎉 {t.discoveredTitle}</div>
          <div style={{ fontSize: 11.5, opacity: 0.9 }}>{discovered.size} {t.newUnlocked}</div>
        </div>
      )}

      {/* ---------------- AI companion — contextual, not chat ---------------- */}
      {view === "orbit" && (
        <button onClick={() => setAiOpen((v) => !v)}
          style={{
            position: "fixed", bottom: isMobile ? 88 : 24, insetInlineEnd: isMobile ? 14 : 24, width: 50, height: 50, borderRadius: 999,
            background: c.gold, color: "#241c0a", border: "none", display: "grid", placeItems: "center",
            boxShadow: "0 12px 30px -8px rgba(0,0,0,.4)", zIndex: 70, cursor: "pointer",
          }}>
          <Sparkles size={18} />
        </button>
      )}
      {aiOpen && (
        <div style={{
          position: "fixed", bottom: isMobile ? 146 : 84, insetInlineEnd: isMobile ? 14 : 24, width: 300, maxWidth: "calc(100vw - 28px)",
          background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16, boxShadow: "0 20px 50px -12px rgba(0,0,0,.35)", zIndex: 70,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12.5 }}><Sparkles size={13} color={c.gold} /> {t.askAbout}</div>
            <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", color: c.sub, cursor: "pointer" }}><X size={14} /></button>
          </div>
          <div style={{ fontSize: 10, color: c.sub, marginBottom: 10 }}>{t.currentlyViewing}: {uiLang === "ar" ? "الحديث الأول — النية" : "Hadith 1 — Intention"}</div>
          <div style={{ display: "grid", gap: 6 }}>
            {AI_QUESTIONS[uiLang].map((q, i) => (
              <button key={q} onClick={() => setAiAnswer(i)} style={{ textAlign: dir === "rtl" ? "right" : "left", fontSize: 11.5, padding: "8px 10px", borderRadius: 9, background: c.panel2, border: `1px solid ${c.line}`, color: c.ink, cursor: "pointer" }}>{q}</button>
            ))}
          </div>
          {aiAnswer !== null && (
            <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.6, background: c.panel2, borderRadius: 10, padding: 11 }}>{AI_ANSWERS[uiLang][aiAnswer]}</div>
          )}
        </div>
      )}
    </div>
  );
}

function IconGhost({ c, icon, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 999, background: `${c.panel2}99`, border: `1px solid ${c.line}`, display: "grid", placeItems: "center", color: c.ink, cursor: "pointer" }}>
      {icon}
    </button>
  );
}

function DetailRow({ c, label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dashed ${c.line}`, paddingBottom: 10 }}>
      <span style={{ fontSize: 11, color: c.sub }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

/* ---------------- Orbit node panel content ---------------- */
function OrbitPanelContent({ nodeId, c, uiLang, t, onClose, onDiscover }) {
  const dir = uiLang === "ar" ? "rtl" : "ltr";
  const titleMap = Object.fromEntries(ORBIT_NODES.map((n) => [n.id, n[uiLang]]));

  useEffect(() => {
    onDiscover(nodeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  return (
    <div dir={dir}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{titleMap[nodeId]}</span>
        <button onClick={onClose} style={{ background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 999, width: 28, height: 28, color: c.sub, cursor: "pointer" }}><X size={13} /></button>
      </div>

      {nodeId === "scholar" && (
        <div style={{ display: "grid", gap: 12 }}>
          <Card c={c} tone="gold" title={uiLang === "ar" ? "تفسير مبسّط" : "Simple explanation"}>
            {uiLang === "ar"
              ? "النية هي الفاتورة المرفقة بكل عمل — قد يقوم شخصان بنفس الفعل، ويخرجان بنتيجتين مختلفتين تمامًا بحسب ما قصداه."
              : "Intention is the invoice attached to every action — two people can do the same visible act and walk away with entirely different results, based on what they meant by it."}
          </Card>
          <Card c={c} tone="emerald" title={uiLang === "ar" ? "الإمام النووي · شرح الأربعين" : "Imam an-Nawawi · Sharh al-Arba'in"}>
            {uiLang === "ar"
              ? "يفتتح مجموعته بهذا الحديث، ويصفه بأنه ثلث العلم."
              : "Opens his forty-hadith collection with this narration, calling it a third of all knowledge."}
          </Card>
        </div>
      )}

      {nodeId === "reflect" && (
        <div style={{ display: "grid", gap: 12 }}>
          <textarea rows={3} placeholder={uiLang === "ar" ? "ما الذي لفت انتباهك اليوم؟" : "What stood out to you today?"}
            style={{ width: "100%", background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 10, padding: 12, color: c.ink, fontSize: 13, fontFamily: "inherit" }} />
          <input placeholder={uiLang === "ar" ? "عمل صغير لهذا اليوم" : "One small action for today"}
            style={{ width: "100%", background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 10, padding: 12, color: c.ink, fontSize: 13, fontFamily: "inherit" }} />
        </div>
      )}

      {nodeId === "quran" && (
        <div style={{ display: "grid", gap: 12 }}>
          <QuranCard c={c} ref={uiLang === "ar" ? "سورة البيّنة ٩٨:٥" : "Al-Bayyinah 98:5"} ar="وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ"
            note={uiLang === "ar" ? "تأمر بالإخلاص في العبادة." : "Commands sincerity of purpose in worship."} />
          <QuranCard c={c} ref={uiLang === "ar" ? "سورة الإسراء ١٧:١٩" : "Al-Isra 17:19"} ar="وَمَنْ أَرَادَ الْآخِرَةَ وَسَعَىٰ لَهَا سَعْيَهَا وَهُوَ مُؤْمِنٌ"
            note={uiLang === "ar" ? "تربط السعي بما يطلبه الإنسان فعلًا." : "Ties effort to what a person genuinely seeks."} />
        </div>
      )}

      {nodeId === "history" && (
        <Card c={c} tone="panel" title={uiLang === "ar" ? "لماذا الهجرة تحديدًا؟" : "Why hijrah, specifically?"}>
          {uiLang === "ar"
            ? "كانت الهجرة أغلى ما يمكن أن يقدّمه المؤمن. اختيارها مثالًا يجعل الفكرة لا لبس فيها."
            : "Hijrah was the costliest act a believer could make. Using it as the example makes the point unmissable."}
        </Card>
      )}

      {nodeId === "related" && (
        <div style={{ display: "grid", gap: 10 }}>
          <Card c={c} tone="panel2" title={uiLang === "ar" ? "متفق عليه" : "Sahih al-Bukhari & Muslim"}>
            {uiLang === "ar" ? "قد يفوق العمل الصغير المُخلَص عملًا كبيرًا أُدِّي بإهمال." : "A small act done sincerely can outweigh a large act done carelessly."}
          </Card>
          <Card c={c} tone="panel2" title={uiLang === "ar" ? "صحيح مسلم" : "Sahih Muslim"}>
            {uiLang === "ar" ? "إنّ الله لا ينظر إلى صوَركم وأموالكم، ولكن ينظر إلى قلوبكم." : "God does not look at your bodies or wealth, but looks at your hearts."}
          </Card>
        </div>
      )}

      {nodeId === "concepts" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(uiLang === "ar" ? ["الإخلاص", "الهجرة", "الصدق", "المحاسبة"] : ["Ikhlas", "The Hijrah", "Sincerity", "Accountability"]).map((cpt) => (
            <span key={cpt} style={{ padding: "8px 14px", borderRadius: 999, background: c.panel2, border: `1px solid ${c.line}`, fontSize: 12 }}>{cpt}</span>
          ))}
        </div>
      )}

      {nodeId === "narrator" && (
        <div>
          <div className="fraunces" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{uiLang === "ar" ? "عمر بن الخطاب" : "'Umar ibn al-Khattab"}</div>
          <div style={{ fontSize: 11, color: c.sub, marginBottom: 12 }}>c. 584–644 CE · {uiLang === "ar" ? "صحابي" : "Companion"}</div>
          <p style={{ fontSize: 12.5, lineHeight: 1.7, color: c.ink }}>
            {uiLang === "ar"
              ? "الخليفة الثاني، حضر حين قِيلت هذه الكلمات. رواه عنه علقمة، ثم إبراهيم، ثم يحيى بن سعيد الأنصاري — عنق السند الذي يمر به الإسناد كله قبل أن يتفرع إلى أكثر من ٢٠٠ راوٍ وصولًا إلى البخاري ومسلم."
              : "Second caliph, present when the words were spoken. Narrated onward through 'Alqamah, then Ibrahim, then Yahya ibn Sa'id al-Ansari — the single \"neck\" the whole chain passes through before fanning out to 200+ narrators, reaching both Bukhari and Muslim."}
          </p>
        </div>
      )}

      {nodeId === "vocab" && (
        <div style={{ display: "grid", gap: 8 }}>
          {VOCAB.map((v) => (
            <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: c.panel2, borderRadius: 10, padding: 10 }}>
              <span className="amiri" style={{ fontSize: 16 }}>{v.word}</span>
              <span style={{ fontSize: 11.5, color: c.sub }}>{v[uiLang]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ c, tone, title, children }) {
  const bg = tone === "gold" ? `${c.gold}18` : tone === "emerald" ? `${c.emerald}18` : tone === "panel2" ? c.panel2 : c.panel;
  const border = tone === "gold" ? `${c.gold}44` : tone === "emerald" ? `${c.emerald}44` : c.line;
  const tagColor = tone === "gold" ? c.gold : tone === "emerald" ? c.emerald : c.sub;
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: tagColor, marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: c.ink }}>{children}</p>
    </div>
  );
}

function QuranCard({ c, ref, ar, note }) {
  return (
    <div style={{ background: c.panel2, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 10.5, color: c.gold, fontWeight: 700, marginBottom: 8 }}>{ref}</div>
      <p dir="rtl" className="amiri" style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 8 }}>{ar}</p>
      <p style={{ fontSize: 11.5, color: c.sub, lineHeight: 1.5 }}>{note}</p>
    </div>
  );
}
