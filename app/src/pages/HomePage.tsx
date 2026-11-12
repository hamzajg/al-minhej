import { useEffect, useState } from "react";
import { ArrowRight, Compass, Library, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { Header } from "@/components/layout/Header";
import { GoalOnboardingModal } from "@/components/onboarding/GoalOnboardingModal";
import { useReadingIndex } from "@/hooks/useReadingIndex";
import { useLearningPath } from "@/hooks/useLearningPath";
import { useProgress } from "@/hooks/useProgress";
import { useRecommendation } from "@/hooks/useRecommendation";
import { useKnowledgeNode } from "@/hooks/useKnowledgeNode";
import { knowledgeRepository } from "@/application/container";
import { LEARNING_GOALS } from "@/data/goals";
import type { KnowledgeNode } from "@/domain/types";
import type { Recommendation } from "@/domain/learning";
import type { UiStrings } from "@/data/i18n";

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

function nodeTitle(node: KnowledgeNode, uiLang: "ar" | "en"): string {
  return uiLang === "ar" ? node.title.ar : node.title.en;
}

/**
 * The "why this one" line. It is assembled from the recommendation's own
 * `via` edge and `anchor` node — the caption cannot claim a connection the
 * graph does not contain, because there is nothing else it can read from.
 */
function reasonCaption(rec: Recommendation, t: UiStrings, uiLang: "ar" | "en"): string {
  switch (rec.reason) {
    case "same_collection":
      return rec.anchor
        ? `${t.pathBecauseSameCollection} ${nodeTitle(rec.anchor, uiLang)}`
        : t.pathBecauseSameCollection;
    case "shared_narrator":
      return rec.anchor
        ? `${t.pathBecauseSharedNarrator} ${nodeTitle(rec.anchor, uiLang)}`
        : t.pathBecauseSharedNarrator;
    case "cross_reference":
      return t.pathBecauseCrossReference;
    case "similar_to":
      return t.pathBecauseSimilarTo;
  }
}

export default function HomePage() {
  const { t, uiLang } = useSettings();
  const nodes = useReadingIndex();
  const [bookCount, setBookCount] = useState(0);
  const node = nodes[0];

  const { path, goal, loaded, currentNodeId, chooseGoal, dismissOnboarding } = useLearningPath();
  const { progress, refresh: refreshProgress } = useProgress();
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    knowledgeRepository.listByType("BOOK").then((books) => setBookCount(books.length));
  }, []);

  // The journey counters catch up after each recorded visit — the path and
  // the reader states are the two things `GET /v1/me/progress` sums.
  useEffect(() => {
    refreshProgress();
  }, [path.visited.length, refreshProgress]);

  // Ask "why are you here?" once, as soon as there is something to read —
  // but only after the account's stored path has loaded, or a reader who
  // already chose a goal would be asked again on every page load.
  useEffect(() => {
    if (loaded && !path.onboardingSeen && nodes.length > 0) setGoalOpen(true);
  }, [loaded, path.onboardingSeen, nodes.length]);

  // A goal's seed always resolves to a real node, degrading to the first
  // readable one if a seed slug is ever missing from the graph.
  const resolveSeed = (slug: string) => nodes.find((n) => n.slug === slug) ?? nodes[0] ?? null;
  const startNode = goal ? resolveSeed(goal.seedSlug) : null;

  const currentNode = useKnowledgeNode(currentNodeId);
  const recommendation = useRecommendation(
    path.visited.length > 0 ? currentNode : null,
    path.visited,
    goal?.prefer
  );

  const pickGoal = (goalId: string) => {
    const picked = LEARNING_GOALS.find((g) => g.id === goalId);
    const chosen = picked ? resolveSeed(picked.seedSlug) : null;
    if (chosen) chooseGoal(goalId, chosen.id);
    setGoalOpen(false);
  };

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

      {goalOpen && (
        <GoalOnboardingModal
          onChoose={pickGoal}
          onSkip={() => {
            dismissOnboarding();
            setGoalOpen(false);
          }}
        />
      )}

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
                to={`/reading/${node.slug}`}
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

            <div className="text-start bg-[var(--color-panel)] border border-[var(--color-line)] rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/25 grid place-items-center mb-4">
                <Compass size={18} style={{ color: "var(--color-gold)" }} />
              </div>
              <div className="text-[11px] font-semibold tracking-[1px] mb-1" style={{ color: "var(--color-gold)", textTransform: uiLang === "en" ? "uppercase" : "none" }}>
                {t.pathEyebrow}
              </div>

              {!goal ? (
                <>
                  <h3 className="font-display text-lg font-semibold mb-1.5">{t.pathChooseTitle}</h3>
                  <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: "var(--color-sub)" }}>
                    {t.pathChooseDesc}
                  </p>
                  <button
                    onClick={() => setGoalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    style={{ color: "var(--color-emerald)" }}
                  >
                    {t.pathChooseCta} <ArrowRight size={12} />
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[10.5px] mb-2.5" style={{ color: "var(--color-sub)" }}>
                    {t.pathGoalLabel}:{" "}
                    <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>
                      {uiLang === "ar" ? goal.title.ar : goal.title.en}
                    </span>
                  </div>

                  {progress &&
                    (progress.visitedCount > 0 ||
                      progress.bookmarkedCount > 0 ||
                      progress.discoveredCount > 0) && (
                      <div className="text-[11px] mb-3" style={{ color: "var(--color-sub)" }}>
                        {uiLang === "ar"
                          ? `${progress.visitedCount} مقروء · ${progress.bookmarkedCount} محفوظ · ${progress.discoveredCount} كلمة مكتشفة`
                          : `${progress.visitedCount} read · ${progress.bookmarkedCount} bookmarked · ${progress.discoveredCount} words discovered`}
                      </div>
                    )}

                  {path.visited.length === 0 && startNode ? (
                    <Link
                      to={`/reading/${startNode.slug}`}
                      className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-2)] p-4 hover:border-[var(--color-emerald)] transition-colors"
                    >
                      <div className="text-[10px] font-semibold mb-1" style={{ color: "var(--color-emerald)" }}>
                        {t.pathStartHere}
                      </div>
                      <div className="font-display text-[15px] font-semibold" style={{ color: "var(--color-ink)" }}>
                        {nodeTitle(startNode, uiLang)}
                      </div>
                    </Link>
                  ) : recommendation ? (
                    <Link
                      to={`/reading/${recommendation.node.slug}`}
                      className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-2)] p-4 hover:border-[var(--color-emerald)] transition-colors"
                    >
                      <div className="text-[10px] font-semibold mb-1" style={{ color: "var(--color-emerald)" }}>
                        {t.pathNext}
                      </div>
                      <div className="font-display text-[15px] font-semibold mb-1" style={{ color: "var(--color-ink)" }}>
                        {nodeTitle(recommendation.node, uiLang)}
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] leading-relaxed" style={{ color: "var(--color-sub)" }}>
                        <Network size={11} className="mt-[3px] shrink-0" />
                        <span>{reasonCaption(recommendation, t, uiLang)}</span>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <h3 className="font-display text-[15px] font-semibold mb-1.5">{t.pathCompleteTitle}</h3>
                      <p className="text-[11.5px] leading-relaxed mb-3" style={{ color: "var(--color-sub)" }}>
                        {t.pathCompleteDesc}
                      </p>
                      <button
                        onClick={() => setGoalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        style={{ color: "var(--color-emerald)" }}
                      >
                        {t.pathChangeGoal} <ArrowRight size={12} />
                      </button>
                    </>
                  )}

                  <div className="text-[10px] mt-3" style={{ color: "var(--color-sub)" }}>
                    {t.pathTraceableNote}
                  </div>
                </>
              )}
            </div>
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
