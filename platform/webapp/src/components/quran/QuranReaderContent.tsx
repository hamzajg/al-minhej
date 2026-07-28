import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame, List, X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useQuranExperience } from "@/hooks/useQuranExperience";
import { Header } from "@/components/layout/Header";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { SourceDetailModal } from "@/components/sources/SourceDetailModal";
import { QuranCompanionWidget } from "@/components/quran/QuranCompanionWidget";
import { RiwayatPanel } from "@/components/quran/RiwayatPanel";
import { QuranMushafReader } from "@/components/quran/QuranMushafReader";
import { QiraatComparePanel } from "@/components/quran/QiraatComparePanel";
import { QuranStudyPanel } from "@/components/quran/QuranStudyPanel";
import { UnifiedReaderToolbar } from "@/components/reader/UnifiedReaderToolbar";
import { DIFFICULTY_LEVELS } from "@/lib/memorize";
import { quranReaderPath } from "@/lib/routes";
import type { Difficulty, SheetId } from "@/types";
import type { QiraatPathId, RiwayatMode } from "@/domain/quran";

interface QuranReaderContentProps {
  surahSlug?: string;
}

export function QuranReaderContent({
  surahSlug = "fatiha",
}: QuranReaderContentProps) {
  const { t, uiLang, dir } = useSettings();
  const isCompact = useIsMobile(1040);
  const isAr = uiLang === "ar";
  const navigate = useNavigate();

  const { data: dto, loading, notFound } = useQuranExperience(surahSlug);

  const [showToc, setShowToc] = useState(false);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [rightTab, setRightTab] = useState("understand");
  const [activeGraphNode, setActiveGraphNode] = useState<string | null>(null);

  const [activeRiwayah, setActiveRiwayah] = useState("qalun");
  const [qiraatPath, setQiraatPath] = useState<QiraatPathId>("sughra");
  const [riwayatMode, setRiwayatMode] = useState<RiwayatMode>("single");
  const [compareSelection, setCompareSelection] = useState<Set<string>>(
    new Set(["hafs", "warsh", "qalun"])
  );
  const [qiraatCompareFor, setQiraatCompareFor] = useState<string | null>(null);

  const [fontScale, setFontScale] = useState(1);
  const [showTranslation, setShowTranslation] = useState(false);
  const [bookmarked, setBookmarked] = useLocalStorage(
    `alminhej:quran:${surahSlug}:bookmarked`,
    false
  );
  const [copied, setCopied] = useState(false);

  const [discovered, setDiscovered] = useLocalStorage<string[]>(
    `alminhej:quran:${surahSlug}:discovered`,
    []
  );
  const discoveredSet = useMemo(() => new Set(discovered), [discovered]);

  const [memorize, setMemorize] = useState(false);
  const [difficulty, setDifficulty] = useState<number>(DIFFICULTY_LEVELS.medium);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [reciteCount, setReciteCount] = useLocalStorage(
    `alminhej:quran:${surahSlug}:reciteCount`,
    0
  );

  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const toc = dto?.toc ?? [];
  const allRiwayat = dto?.allRiwayat ?? [];
  const activeR = allRiwayat.find((r) => r.id === activeRiwayah) ??
    allRiwayat.find((r) => r.id === "qalun") ?? null;

  const surahNumber = dto?.surah.attributes.kind === "surah" ? dto.surah.attributes.surahNumber : undefined;
  const currentTocIndex = toc.findIndex(
    (item) => item.slug === dto?.surah.slug || (surahNumber !== undefined && item.number === surahNumber)
  );
  const prevSurah = currentTocIndex > 0 ? toc[currentTocIndex - 1] : null;
  const nextSurah =
    currentTocIndex >= 0 && currentTocIndex < toc.length - 1
      ? toc[currentTocIndex + 1]
      : null;

  const onDiscover = (id: string) => {
    if (!discoveredSet.has(id)) setDiscovered([...discovered, id]);
  };

  const onToggleReveal = (key: string) => {
    setRevealed((r) => {
      const next = new Set(r);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const enterMemorize = () => {
    setMemorize(true);
    setShowTranslation(false);
    setRevealed(new Set());
  };

  const castVote = (sourceId: string) => {
    if (voted.has(sourceId)) return;
    setVoted((v) => new Set(v).add(sourceId));
    setVotes((v) => ({ ...v, [sourceId]: (v[sourceId] || 0) + 1 }));
  };

  const selectedSourceObj = activeSource && dto ? dto.sources[activeSource] : null;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-ink)]">
        <div className="text-[14px]" style={{ color: "var(--color-sub)" }}>
          {isAr ? "جاري التحميل..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (notFound || !dto) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-ink)]">
        <div className="text-center">
          <div className="text-[16px] font-semibold mb-2">{isAr ? "سورة غير موجودة" : "Surah not found"}</div>
          <Link to="/library" className="text-[12px] text-[var(--color-emerald)] underline">
            {t.backToLibrary}
          </Link>
        </div>
      </div>
    );
  }

  const surah = dto.surah;
  const attrs = surah.attributes.kind === "surah" ? surah.attributes : null;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Top Header */}
      <Header
        lessonTag={
          isAr
            ? `المصحف الشريف · ${surah.title.ar}`
            : `The Noble Mushaf · ${surah.title.en}`
        }
        discoveredCount={discoveredSet.size}
        totalVocab={dto.vocab.length}
        isCompact={isCompact}
        logoHref="/"
      />

      {/* Surah Navigation & TOC Bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-wrap gap-2 shrink-0"
        style={{ borderColor: "var(--color-line)", background: "var(--color-panel-2)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/library"
            className="text-[11px] px-2.5 py-[5px] rounded-full border cursor-pointer"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            {t.backToLibrary}
          </Link>
          <button
            onClick={() => setShowToc(true)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-[5px] rounded-full cursor-pointer border"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            <List size={12} /> {t.toc}
          </button>
          <div className="text-[11px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: "var(--color-sub)" }}>
            <span className="font-bold" style={{ color: "var(--color-ink)" }}>
              {isAr ? surah.title.ar : surah.title.en}
            </span>
            {" · "}
            {attrs && <>{isAr ? attrs.typeAr : attrs.typeEn} · {attrs.ayahCount} {isAr ? "آيات" : "verses"}</>}
          </div>
        </div>

        {/* Prev / Next Surah controls */}
        <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--color-sub)" }}>
          <button
            disabled={!prevSurah}
            onClick={() => {
              if (prevSurah) navigate(quranReaderPath(prevSurah.slug));
            }}
            className="w-6 h-6 rounded grid place-items-center border disabled:opacity-40 cursor-pointer"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-sub)" }}
          >
            {dir === "rtl" ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
          <span>
            {isAr ? "سورة" : "Surah"} {attrs?.surahNumber} {t.ofUnits} 114 · {isAr ? "الصفحة" : "Page"} {attrs?.pageNo}
          </span>
          <button
            disabled={!nextSurah}
            onClick={() => {
              if (nextSurah) navigate(quranReaderPath(nextSurah.slug));
            }}
            className="w-6 h-6 rounded grid place-items-center border disabled:opacity-40 cursor-pointer"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            {dir === "rtl" ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      {/* Surah Table of Contents (TOC) Sidebar Drawer */}
      {showToc && (
        <>
          <div
            onClick={() => setShowToc(false)}
            className="fixed inset-0 z-[95]"
            style={{ background: "rgba(0,0,0,.4)" }}
          />
          <div
            className="fixed top-0 bottom-0 inset-inline-start-0 w-[86%] max-w-[360px] z-[96] p-[18px] overflow-y-auto border-e"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-[14px]" style={{ color: "var(--color-ink)" }}>
                {isAr ? "سور القرآن الكريم" : "Surahs of the Holy Qur'an"}
              </span>
              <button
                onClick={() => setShowToc(false)}
                className="rounded-full w-7 h-7 cursor-pointer border grid place-items-center"
                style={{ background: "var(--color-panel-2)", borderColor: "var(--color-line)", color: "var(--color-sub)" }}
              >
                <X size={13} />
              </button>
            </div>
            <div className="text-[11px] mb-3.5" style={{ color: "var(--color-sub)" }}>
              {isAr ? "اختر سورة لقراءتها ودراستها برواياتها المختلفة" : "Select a surah to read and study across different riwayat"}
            </div>
            <div className="grid gap-1.5">
              {toc.map((entry) => {
                const available = entry.pagesDigitized > 0;
                const active = entry.slug === surah.slug || entry.number === attrs?.surahNumber;
                return (
                  <button
                    key={entry.id}
                    onClick={() => {
                      setShowToc(false);
                      navigate(quranReaderPath(entry.slug));
                    }}
                    className="flex justify-between items-center text-start w-full p-[11px_12px] rounded-[10px] cursor-pointer font-inherit border"
                    style={{
                      background: active
                        ? "color-mix(in srgb, var(--color-emerald) 14%, transparent)"
                        : available
                          ? "color-mix(in srgb, var(--color-emerald) 8%, transparent)"
                          : "var(--color-panel-2)",
                      borderColor: active
                        ? "color-mix(in srgb, var(--color-emerald) 40%, transparent)"
                        : available
                          ? "color-mix(in srgb, var(--color-emerald) 27%, transparent)"
                          : "var(--color-line)",
                    }}
                  >
                    <div>
                      <div className="text-[12.5px] font-semibold" style={{ color: "var(--color-ink)" }}>
                        {entry.number}. {isAr ? entry.nameAr : entry.nameEn}
                      </div>
                      <div className="text-[9.5px] mt-0.5" style={{ color: available ? "var(--color-emerald)" : "var(--color-sub)" }}>
                        {available
                          ? isAr
                            ? `${entry.ayahs} آية · مرقمنة`
                            : `${entry.ayahs} verses · Digitized`
                          : isAr
                            ? `${entry.ayahs} آية · بانتظار الترقيم`
                            : `${entry.ayahs} verses · Pending`}
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--color-sub)] font-mono">
                      {isAr ? `ص ${entry.pageStart}` : `p. ${entry.pageStart}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main Experience Body */}
      <div className="flex-1 flex min-h-0 relative">
        {/* LEFT: Riwayat Panel */}
        {isCompact ? (
          <BottomSheet
            open={sheet === "chain"}
            title={isAr ? "طرق القراءة" : "Reading traditions"}
            onClose={() => setSheet(null)}
          >
            <RiwayatPanel
              readers={dto.readers}
              allRiwayat={dto.allRiwayat}
              collections={dto.collections}
              qiraatPaths={dto.qiraatPaths}
              activeRiwayah={activeRiwayah}
              setActiveRiwayah={setActiveRiwayah}
              riwayatMode={riwayatMode}
              setRiwayatMode={setRiwayatMode}
              compareSelection={compareSelection}
              setCompareSelection={setCompareSelection}
              qiraatPath={qiraatPath}
              setQiraatPath={setQiraatPath}
            />
          </BottomSheet>
        ) : (
          <aside className="lesson-scroller h-full overflow-y-auto shrink-0 w-[320px] border-e border-[var(--color-line)] p-[18px]">
            <RiwayatPanel
              readers={dto.readers}
              allRiwayat={dto.allRiwayat}
              collections={dto.collections}
              qiraatPaths={dto.qiraatPaths}
              activeRiwayah={activeRiwayah}
              setActiveRiwayah={setActiveRiwayah}
              riwayatMode={riwayatMode}
              setRiwayatMode={setRiwayatMode}
              compareSelection={compareSelection}
              setCompareSelection={setCompareSelection}
              qiraatPath={qiraatPath}
              setQiraatPath={setQiraatPath}
            />
          </aside>
        )}

{/* CENTER: Mushaf Reader View */}
        <main
          className="lesson-scroller h-full overflow-y-auto flex-1 min-w-0 px-[6vw] py-6 flex flex-col items-center"
          style={{ paddingBottom: isCompact ? 76 : 26 }}
        >
          <UnifiedReaderToolbar
            setFontScale={setFontScale}
            bookmarked={bookmarked}
            setBookmarked={setBookmarked}
            copied={copied}
            onCopy={() => {
              const text = Object.values(dto.segments)
                .map((s) => s.ar)
                .join(" ");
              navigator.clipboard?.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            memorize={memorize}
            onToggleMemorize={() => (memorize ? setMemorize(false) : enterMemorize())}
            difficulty={difficulty}
            onSetDifficulty={(d: Difficulty) => {
              setDifficulty(DIFFICULTY_LEVELS[d]);
              setRevealed(new Set());
            }}
            onRevealAll={() => {
              setRevealed(
                new Set(
                  Object.keys(dto.segments).flatMap((key, ayIdx) =>
                    dto.segments[key].ar
                      .split(" ")
                      .map((_, wIdx) => `${key}-${ayIdx + wIdx}`)
                  )
                )
              );
            }}
            readerType="quran"
            showTranslation={showTranslation}
            setShowTranslation={setShowTranslation}
          />

          {/* Central Mushaf Reader */}
          {activeR && (
          <QuranMushafReader
            titleAr={surah.title.ar}
            typeAr={attrs?.typeAr ?? ""}
            typeEn={attrs?.typeEn ?? ""}
            ayahCount={attrs?.ayahCount ?? 0}
            vocab={dto.vocab}
            activeRiwayah={activeR}
            fontScale={fontScale}
            isCompact={isCompact}
            onDiscover={onDiscover}
            memorize={memorize}
            difficulty={difficulty}
            revealed={revealed}
            onToggleReveal={onToggleReveal}
            showTranslation={showTranslation}
            onCompareSegment={(segKey) => setQiraatCompareFor(segKey)}
          />
          )}

          {/* Memorization recited counter button */}
          {memorize && (
            <button
              onClick={() => setReciteCount((n) => n + 1)}
              className="mt-5 flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full bg-[var(--color-gold)] text-[#241c0a] border-none cursor-pointer"
            >
              <Flame size={15} /> {isAr ? "قرأتها" : "I recited it"}{" "}
              {reciteCount > 0 &&
                `· ${reciteCount} ${isAr ? "مرة اليوم" : "times today"}`}
            </button>
          )}
        </main>

        {/* RIGHT: Study Panel */}
        {isCompact ? (
          <BottomSheet
            open={sheet === "study"}
            title={isAr ? "الدراسة" : "Study"}
            onClose={() => setSheet(null)}
          >
            <QuranStudyPanel
              tafsir={dto.tafsir}
              sources={dto.sources}
              related={dto.related}
              vocab={dto.vocab}
              quiz={dto.quiz}
              tab={rightTab}
              setTab={setRightTab}
              discovered={discoveredSet}
              onVocabClick={onDiscover}
              activeGraphNode={activeGraphNode}
              setActiveGraphNode={setActiveGraphNode}
              onOpenSource={setActiveSource}
            />
          </BottomSheet>
        ) : (
          <aside className="lesson-scroller h-full overflow-y-auto shrink-0 w-[340px] border-s border-[var(--color-line)] p-[18px]">
            <QuranStudyPanel
              tafsir={dto.tafsir}
              sources={dto.sources}
              related={dto.related}
              vocab={dto.vocab}
              quiz={dto.quiz}
              tab={rightTab}
              setTab={setRightTab}
              discovered={discoveredSet}
              onVocabClick={onDiscover}
              activeGraphNode={activeGraphNode}
              setActiveGraphNode={setActiveGraphNode}
              onOpenSource={setActiveSource}
            />
          </aside>
        )}
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isCompact && (
        <BottomTabBar
          sheet={sheet}
          onToggle={(next) => setSheet((s) => (s === next ? null : next))}
        />
      )}

      {/* Qira'at Comparison Modal */}
      {qiraatCompareFor && (
        <QiraatComparePanel
          allRiwayat={dto.allRiwayat}
          basmalaNote={dto.basmalaNote}
          forSegment={qiraatCompareFor}
          mode={riwayatMode}
          activeRiwayah={activeRiwayah}
          compareSelection={compareSelection}
          qiraatPath={qiraatPath}
          isCompact={isCompact}
          onClose={() => setQiraatCompareFor(null)}
        />
      )}

      {/* Source Detail Modal */}
      {selectedSourceObj && (
        <SourceDetailModal
          node={{
            id: selectedSourceObj.id,
            type: "BOOK",
            slug: selectedSourceObj.id,
            status: "published",
            digitizationStatus:
              selectedSourceObj.indexed > 0 ? "partial" : "stub",
            title: { ar: selectedSourceObj.ar, en: selectedSourceObj.en },
            attributes: {
              kind: "book",
              author: {
                ar: selectedSourceObj.authorAr,
                en: selectedSourceObj.authorEn,
              },
              eraLabel: {
                ar: selectedSourceObj.era,
                en: selectedSourceObj.era,
              },
              digitization: {
                totalUnits: selectedSourceObj.total,
                authoredUnits: selectedSourceObj.indexed,
                unit: selectedSourceObj.unit,
              },
            },
            content: [],
            schemaVersion: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          onClose={() => setActiveSource(null)}
          onVote={castVote}
          voted={voted.has(selectedSourceObj.id)}
          voteCount={votes[selectedSourceObj.id] || 0}
        />
      )}

      {/* Companion Widget */}
      <QuranCompanionWidget
        companionPrompts={dto.companionPrompts}
        companionAnswers={dto.companionAnswers}
        bottomOffset={isCompact ? 72 : 20}
      />
    </div>
  );
}
