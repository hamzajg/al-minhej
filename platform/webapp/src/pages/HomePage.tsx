import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Library, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { hadithReaderPath } from "@/lib/routes";
import { Header } from "@/components/layout/Header";
import { useReadingIndex } from "@/hooks/useReadingIndex";
import { knowledgeRepository } from "@/application/container";

const NODE_COLORS: Record<string, string> = {
  HADITH: "#C79A46",
  NARRATOR: "#0E4F3F",
  BOOK: "#3E6F5C",
  PAGE: "#5B8C7A",
  VERSE: "#7B8F5D",
  CONCEPT: "#B4763B",
  EVENT: "#6A5A8C",
};

const NODE_TYPE_LABELS: Record<string, [string, string]> = {
  HADITH: ["حديث", "Hadith"],
  NARRATOR: ["راوٍ", "Narrator"],
  BOOK: ["كتاب", "Book"],
  PAGE: ["صفحة", "Page"],
  VERSE: ["آية", "Verse"],
  CONCEPT: ["مفهوم", "Concept"],
  EVENT: ["حدث", "Event"],
};

const GRAPH_NODES = [
  { id: "hadith", type: "HADITH", angle: 0, labelAr: "الحديث الأول", labelEn: "Hadith 1" },
  { id: "umar", type: "NARRATOR", angle: -90, labelAr: "عمر بن الخطاب", labelEn: "'Umar" },
  { id: "bukhari", type: "BOOK", angle: -30, labelAr: "صحيح البخاري", labelEn: "Sahih al-Bukhari" },
  { id: "muslim", type: "BOOK", angle: 40, labelAr: "صحيح مسلم", labelEn: "Sahih Muslim" },
  { id: "bayyinah", type: "VERSE", angle: 100, labelAr: "البيّنة ٩٨:٥", labelEn: "Al-Bayyinah 98:5" },
  { id: "isra", type: "VERSE", angle: 155, labelAr: "الإسراء ١٧:١٩", labelEn: "Al-Isra 17:19" },
  { id: "ikhlas", type: "CONCEPT", angle: -150, labelAr: "الإخلاص", labelEn: "Ikhlas" },
  { id: "hijra", type: "EVENT", angle: 150, labelAr: "الهجرة", labelEn: "Hijrah" },
];

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export default function HomePage() {
  const { t, uiLang } = useSettings();
  const nodes = useReadingIndex();
  const [bookCount, setBookCount] = useState(0);
  const node = nodes[0];

  useEffect(() => {
    knowledgeRepository.listByType("BOOK").then((books) => setBookCount(books.length));
  }, []);

  const cx = 180;
  const cy = 180;
  const R = 140;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(18px);} to { opacity:1; transform: translateY(0);} }
        @keyframes orbitPulse { 0%,100% { opacity:.85; transform: scale(1); } 50% { opacity:1; transform: scale(1.04); } }
        .fade-up { animation: fadeUp .55s ease both; }
        .fade-up-d1 { animation: fadeUp .55s ease .1s both; }
        .fade-up-d2 { animation: fadeUp .55s ease .2s both; }
        .fade-up-d3 { animation: fadeUp .55s ease .3s both; }
      `}</style>

      <Header />

      <main className="flex-1 overflow-y-auto">
        {/* HERO */}
        <section className="geo-bg flex flex-col items-center text-center px-6 pt-20 pb-14">
          <div className="max-w-[680px] fade-up">
            <div
              className="text-xs tracking-[2px] text-[var(--color-gold)] mb-4"
              style={{ textTransform: uiLang === "en" ? "uppercase" : "none" }}
            >
              {t.tagline}
            </div>
            <h1 className="font-display text-[clamp(32px,5vw,52px)] font-semibold leading-[1.15] mb-5">
              {uiLang === "ar" ? "المنهج" : "AlMinhej"}
            </h1>
            <p className="text-[var(--color-sub)] text-base max-w-[520px] mx-auto mb-8 leading-relaxed">
              {uiLang === "ar"
                ? "بوابة موجَّهة لاستكشاف المعرفة الشرعية — كل نص، رواية، ومصدر متصل ببعضه. تبدأ من نقطة واحدة، وتتوسّع تدريجيًا."
                : "A guided portal into authentic knowledge — every text, narration, and source connected. Start from one point, and the graph expands outward."}
            </p>

            {node && (
              <Link
                to={hadithReaderPath(node.slug)}
                className="inline-flex items-center gap-2 bg-[var(--color-emerald)] text-[#F4EFE2] px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
              >
                {t.homeCta} <ArrowRight size={15} />
              </Link>
            )}
          </div>

          <div className="mt-7 flex justify-center gap-7 text-xs text-[var(--color-sub)] fade-up-d1">
            <span>~14 min</span>
            <span className="text-[var(--color-line)]">·</span>
            <span>{uiLang === "ar" ? "مناسب للمبتدئين" : "Beginner friendly"}</span>
            <span className="text-[var(--color-line)]">·</span>
            <span>{uiLang === "ar" ? "شبكة معرفة متصلة" : "Connected knowledge graph"}</span>
          </div>
        </section>

        {/* KNOWLEDGE GRAPH SECTION */}
        <section className="px-6 py-16 max-w-[880px] mx-auto">
          <div className="text-center mb-8 fade-up-d1">
            <div
              className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] mb-2.5"
              style={{ color: "var(--color-gold)", textTransform: uiLang === "en" ? "uppercase" : "none" }}
            >
              <Network size={13} /> {t.homeGraphEyebrow}
            </div>
            <h2 className="font-display text-[28px] font-semibold m-0">{t.homeGraphTitle}</h2>
            <p className="text-[13px] mt-2 max-w-[480px] mx-auto" style={{ color: "var(--color-sub)" }}>
              {t.homeGraphDesc}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 fade-up-d2">
            <div className="w-full max-w-[460px]" style={{ background: "var(--color-panel)", border: "1px solid var(--color-line)", borderRadius: 20, padding: 8 }}>
              <svg viewBox="0 0 360 360" className="w-full h-auto block">
                {GRAPH_NODES.filter((n) => n.id !== "hadith").map((n) => {
                  const [x, y] = polar(cx, cy, R, n.angle);
                  return (
                    <line key={"l" + n.id} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-line)" strokeWidth={1} />
                  );
                })}

                {GRAPH_NODES.map((n) => {
                  const isCenter = n.id === "hadith";
                  if (isCenter) {
                    return (
                      <g key={n.id}>
                        <circle cx={cx} cy={cy} r={24} fill={NODE_COLORS.HADITH} stroke="var(--color-gold)" strokeWidth={2.5} />
                        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="#F4EFE2" fontWeight={700}>
                          {uiLang === "ar" ? "ح" : "H"}
                        </text>
                      </g>
                    );
                  }
                  const [x, y] = polar(cx, cy, R, n.angle);
                  const label = uiLang === "ar" ? n.labelAr : n.labelEn;
                  return (
                    <g key={n.id}>
                      <circle cx={x} cy={y} r={14} fill={NODE_COLORS[n.type]} stroke="var(--color-line)" strokeWidth={1} />
                      <text x={x} y={y + 14 + 10} textAnchor="middle" fontSize="8" fill="var(--color-sub)">
                        {label.length > 12 ? label.slice(0, 11) + "…" : label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs" style={{ color: "var(--color-sub)" }}>
              {Object.entries(NODE_TYPE_LABELS).map(([type, labels]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: NODE_COLORS[type] }} />
                  <span>{uiLang === "ar" ? labels[0] : labels[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIBRARY + CONTINUE LEARNING */}
        <section className="px-6 pb-20 max-w-[880px] mx-auto">
          <div className="grid sm:grid-cols-2 gap-5 fade-up-d3">
            <Link
              to="/library"
              className="block text-start bg-[var(--color-panel)] border border-[var(--color-line)] rounded-2xl p-6 hover:-translate-y-0.5 transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/25 grid place-items-center mb-4">
                <Library size={18} style={{ color: "var(--color-emerald)" }} />
              </div>
              <div className="text-[11px] font-semibold tracking-[1px] mb-1" style={{ color: "var(--color-gold)", textTransform: uiLang === "en" ? "uppercase" : "none" }}>
                {t.homeLibraryEyebrow}
              </div>
              <h3 className="font-display text-lg font-semibold mb-1.5">{t.homeLibraryTitle}</h3>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-sub)" }}>
                {uiLang === "ar"
                  ? `${bookCount} كتابًا مفهرسًا — من النص الكامل إلى الصفر بعد.`
                  : `${bookCount} books indexed — from full text to not-yet-started.`}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold mt-3" style={{ color: "var(--color-emerald)" }}>
                {t.tabLibrary} <ArrowRight size={12} />
              </div>
            </Link>

            {node && (
              <Link
                to={hadithReaderPath(node.slug)}
                className="block text-start bg-[var(--color-panel)] border border-[var(--color-line)] rounded-2xl p-6 hover:-translate-y-0.5 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/25 grid place-items-center mb-4">
                  <BookOpen size={18} style={{ color: "var(--color-gold)" }} />
                </div>
                <div className="text-[11px] font-semibold tracking-[1px] mb-1" style={{ color: "var(--color-gold)", textTransform: uiLang === "en" ? "uppercase" : "none" }}>
                  {t.continueLearning}
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">
                  {uiLang === "ar" ? node.title.ar : node.title.en}
                </h3>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-sub)" }}>
                  {node.attributes.kind === "hadith" ? node.attributes.grade[uiLang] : ""}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold mt-3" style={{ color: "var(--color-emerald)" }}>
                  {t.homeCta} <ArrowRight size={12} />
                </div>
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="text-center py-6 text-[11px] text-[var(--color-sub)] shrink-0">
        AlMinhej · {nodes.length} {uiLang === "ar" ? "نص أساسي" : "core text"}
        {bookCount > 0 && ` · ${bookCount} ${uiLang === "ar" ? "كتابًا في المكتبة" : "books in the library"}`}
      </footer>
    </div>
  );
}
