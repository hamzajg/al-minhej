import { useState } from "react";
import {
  CircleCheck,
  NotebookPen,
  Quote,
  Sparkles,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface TafsirEntry {
  id: string;
  scholar: string;
  scholarEn: string;
  work: string;
  workEn: string;
  note: { ar: string; en: string };
}

interface SourceInfo {
  id: string;
  ar: string;
  en: string;
  authorAr: string;
  authorEn: string;
  era: string;
  total: number;
  indexed: number;
  unit: { ar: string; en: string };
}

interface RelatedLink {
  id: string;
  type: string;
  ar: string;
  en: string;
  src?: { ar: string; en: string };
  note?: { ar: string; en: string };
}

interface VocabEntry {
  id: string;
  word: string;
  root: string;
  pron: string;
  occ: number;
  en: string;
  ar: string;
}

interface QuizQuestion {
  q: { ar: string; en: string };
  options: { ar: string; en: string }[];
  correct: number;
}

interface QuranStudyPanelProps {
  tafsir: TafsirEntry[];
  sources: Record<string, SourceInfo>;
  related: RelatedLink[];
  vocab: VocabEntry[];
  quiz: QuizQuestion[];
  tab: string;
  setTab: (tab: string) => void;
  discovered: Set<string>;
  onVocabClick: (id: string) => void;
  activeGraphNode: string | null;
  setActiveGraphNode: (id: string | null) => void;
  onOpenSource: (sourceId: string) => void;
}

function sourcePct(s: SourceInfo) {
  if (!s || !s.total) return 0;
  return (s.indexed / s.total) * 100;
}

function formatPct(pct: number, indexed: number) {
  if (indexed > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export function QuranStudyPanel({
  tafsir,
  sources,
  related,
  vocab,
  quiz,
  tab,
  setTab,
  discovered,
  onVocabClick,
  activeGraphNode,
  setActiveGraphNode,
  onOpenSource,
}: QuranStudyPanelProps) {
  const { uiLang, dir } = useSettings();
  const isAr = uiLang === "ar";

  const [takeaway, setTakeaway] = useState("");
  const [actionItem, setActionItem] = useState("");
  const [quizState, setQuizState] = useState<Record<number, { picked: number }>>({});

  const deeperSource = Object.values(sources).find(
    (s) => s.indexed === 0
  );

  const tabs = [
    ["understand", isAr ? "التفسير" : "Tafsir"],
    ["vocab", isAr ? "المفردات" : "Vocabulary"],
    ["connect", isAr ? "الروابط" : "Connect"],
    ["practice", isAr ? "التطبيق" : "Practice"],
    ["library", isAr ? "المكتبة" : "Library"],
  ] as const;

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4.5">
        {tabs.map(([k, l]) => {
          const active = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={[
                "text-[11.5px] px-3 py-1.5 rounded-full cursor-pointer transition-all border font-inherit whitespace-nowrap",
                active
                  ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
                  : "bg-transparent text-[var(--color-sub)] border-[var(--color-line)]",
              ].join(" ")}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Understand Tab */}
      {tab === "understand" && (
        <div className="grid gap-3.5">
          {/* AI Explanation Card */}
          <div
            className="border rounded-xl p-3.5"
            style={{
              borderColor: "color-mix(in srgb, var(--color-gold) 33%, transparent)",
              background: "color-mix(in srgb, var(--color-gold) 8%, transparent)",
            }}
          >
            <div
              className="flex items-center gap-1.5 mb-2 font-bold text-[11px]"
              style={{ color: "var(--color-gold)" }}
            >
              <Sparkles size={13} />{" "}
              {isAr ? "تفسير ميسّر" : "Plain-language explanation"}
            </div>
            <p
              className="text-[12.5px] leading-relaxed m-0"
              style={{ color: "var(--color-ink)" }}
            >
              {isAr
                ? "الفاتحة تبدأ بالثناء على الله، ثم تُقرّ أن العبادة والاستعانة لا تكونان إلا له وحده، ثم تُختم بطلب الهداية — فهي دعاء يتكرر في كل صلاة، ويلخّص علاقة العبد بربه في سبع آيات."
                : "Al-Fatiha opens with praise of God, affirms that worship and help are sought from Him alone, then closes with a request for guidance — a prayer repeated in every salah, summarizing the whole relationship between a servant and their Lord in seven lines."}
            </p>
          </div>

          {/* Tafsir Entries */}
          {tafsir.map((cm) => {
            const srcObj = sources[cm.id];
            return (
              <div
                key={cm.id}
                className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5"
              >
                <div className="text-[12.5px] font-semibold mb-1.5">
                  {isAr ? cm.scholar : cm.scholarEn}{" "}
                  <span className="font-normal text-[var(--color-sub)]">
                    · {isAr ? cm.work : cm.workEn}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--color-sub)] leading-relaxed mb-2.5">
                  {cm.note[uiLang as "ar" | "en"]}
                </p>
                {srcObj && (
                  <button
                    onClick={() => onOpenSource(srcObj.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-panel-2)] border border-[var(--color-line)] cursor-pointer font-inherit"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background:
                          srcObj.indexed > 0
                            ? "var(--color-emerald)"
                            : "#B0785A",
                      }}
                    />
                    <span className="text-[11px] font-semibold text-[var(--color-ink)]">
                      {isAr ? srcObj.ar : srcObj.en}
                    </span>
                    <span className="text-[9.5px] text-[var(--color-sub)]">
                      {formatPct(sourcePct(srcObj), srcObj.indexed)}
                    </span>
                  </button>
                )}
              </div>
            );
          })}

          {deeperSource && (
            <button
              onClick={() => onOpenSource(deeperSource.id)}
              className="flex items-center justify-between w-full bg-transparent border border-dashed border-[var(--color-line)] rounded-xl p-3 cursor-pointer font-inherit"
            >
              <span className="text-[11.5px] text-[var(--color-sub)]">
                {isAr ? "للتعمق أكثر" : "Go deeper"}:{" "}
                {isAr ? deeperSource.ar : deeperSource.en}
              </span>
              <span className="text-[10px] text-[#B0785A] font-bold">
                {isAr ? "لم تُرقمَن بعد" : "Not yet digitized"}
              </span>
            </button>
          )}

          {/* Related Items */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-gold)] mb-2">
              <Quote size={12} /> {isAr ? "روابط ذات صلة" : "Related"}
            </div>
            {related.map((r) => (
              <div
                key={r.id}
                className="bg-[var(--color-panel-2)] rounded-xl p-3 border-s-3 border-[var(--color-emerald)] mb-2"
              >
                {r.type === "hadith" ? (
                  <>
                    <p className="text-[12px] leading-relaxed m-0">
                      {isAr ? r.ar : r.en}
                    </p>
                    {r.src && (
                      <div className="text-[10px] text-[var(--color-sub)] mt-1.5">
                        {r.src[uiLang as "ar" | "en"]}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-[12px] font-semibold">
                      {isAr ? r.ar : r.en}
                    </div>
                    {r.note && (
                      <div className="text-[10.5px] text-[var(--color-sub)] mt-1">
                        {r.note[uiLang as "ar" | "en"]}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocab Tab */}
      {tab === "vocab" && (
        <div className="grid gap-2.5">
          {vocab.map((v) => (
            <div
              key={v.id}
              onClick={() => onVocabClick(v.id)}
              className={[
                "bg-[var(--color-panel)] border rounded-xl p-3.5 cursor-pointer transition-all",
                discovered.has(v.id)
                  ? "border-[var(--color-gold)]"
                  : "border-[var(--color-line)]",
              ].join(" ")}
            >
              <div className="font-arabic text-[20px] mb-1">{v.word}</div>
              <div className="text-[12.5px] font-semibold">{v[uiLang as "ar" | "en"]}</div>
              <div className="text-[11px] text-[var(--color-sub)]">
                {isAr ? "الجذر" : "root"} {v.root} · {v.pron}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Tab */}
      {tab === "connect" && (
        <div className="grid gap-2.5">
          {related.map((r) => {
            const active = activeGraphNode === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setActiveGraphNode(r.id)}
                className={[
                  "text-start p-3 rounded-xl cursor-pointer font-inherit border transition-all",
                  active
                    ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
                    : "bg-[var(--color-panel)] text-[var(--color-ink)] border-[var(--color-line)]",
                ].join(" ")}
              >
                <div className="text-[12px] font-bold">{isAr ? r.ar : r.en}</div>
                <div className="text-[10.5px] opacity-85 mt-0.5">
                  {r.type === "hadith"
                    ? r.src
                      ? r.src[uiLang as "ar" | "en"]
                      : ""
                    : r.note
                      ? r.note[uiLang as "ar" | "en"]
                      : ""}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Practice Tab */}
      {tab === "practice" && (
        <div className="grid gap-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-4">
            <label className="text-[11.5px] text-[var(--color-sub)] flex items-center gap-1.5 mb-1.5">
              <NotebookPen size={12} />{" "}
              {isAr ? "خلاصة اليوم" : "Today's takeaway"}
            </label>
            <textarea
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              rows={2}
              placeholder={
                isAr ? "ما الذي لفت انتباهك اليوم؟" : "What stood out to you today?"
              }
              dir={dir}
              className="w-full bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-lg p-2.5 text-[12.5px] text-[var(--color-ink)] font-inherit resize-y mb-3 outline-none"
            />
            <label className="text-[11.5px] text-[var(--color-sub)] flex items-center gap-1.5 mb-1.5">
              <CircleCheck size={12} />{" "}
              {isAr ? "عمل صغير لهذا اليوم" : "One small action for today"}
            </label>
            <input
              value={actionItem}
              onChange={(e) => setActionItem(e.target.value)}
              placeholder={
                isAr
                  ? "مثال: تدبّر هذه السورة في الصلاة القادمة"
                  : "e.g. reflect on this surah in your next prayer"
              }
              dir={dir}
              className="w-full bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-lg p-2.5 text-[12.5px] text-[var(--color-ink)] font-inherit outline-none"
            />
          </div>

          <div className="grid gap-2.5">
            {quiz.map((q, qi) => {
              const st = quizState[qi];
              return (
                <div
                  key={qi}
                  className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5"
                >
                  <div className="text-[12.5px] font-semibold mb-2.5">
                    {q.q[uiLang as "ar" | "en"]}
                  </div>
                  <div className="grid gap-1.5">
                    {q.options.map((opt, oi) => {
                      const picked = st?.picked === oi;
                      const showCorrect = st !== undefined && oi === q.correct;
                      return (
                        <button
                          key={oi}
                          onClick={() =>
                            setQuizState((s) => ({ ...s, [qi]: { picked: oi } }))
                          }
                          className={[
                            "text-start py-2 px-3 rounded-lg text-[12px] cursor-pointer font-inherit transition-all border",
                            showCorrect
                              ? "bg-[var(--color-emerald)]/20 border-[var(--color-emerald)]"
                              : picked
                                ? "bg-[var(--color-gold)]/15 border-[var(--color-gold)]"
                                : "bg-[var(--color-panel-2)] border-[var(--color-line)]",
                          ].join(" ")}
                        >
                          {opt[uiLang as "ar" | "en"]}
                        </button>
                      );
                    })}
                  </div>
                  {st !== undefined && (
                    <div
                      className={[
                        "text-[11.5px] mt-2 font-medium",
                        st.picked === q.correct
                          ? "text-[var(--color-emerald)]"
                          : "text-[var(--color-gold)]",
                      ].join(" ")}
                    >
                      {st.picked === q.correct
                        ? isAr
                          ? "إجابة صحيحة."
                          : "That's correct."
                        : isAr
                          ? "تستحق نظرة أخرى — تحقق من الإجابة المُظلَّلة."
                          : "Worth another look — check the highlighted answer."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Library Tab */}
      {tab === "library" && (
        <div className="grid gap-2">
          {Object.values(sources)
            .sort((a, b) => sourcePct(b) - sourcePct(a))
            .map((s) => {
              const pct = sourcePct(s);
              return (
                <button
                  key={s.id}
                  onClick={() => onOpenSource(s.id)}
                  dir={dir}
                  className="text-start bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3 cursor-pointer font-inherit"
                >
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12.5px] font-semibold">
                      {isAr ? s.ar : s.en}
                    </span>
                    <span className="text-[10.5px] text-[var(--color-sub)]">
                      {formatPct(pct, s.indexed)}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--color-sub)] mb-2">
                    {isAr ? s.authorAr : s.authorEn} · {s.era}
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-panel-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        background:
                          pct > 0 ? "var(--color-emerald)" : "#B0785A",
                      }}
                    />
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
