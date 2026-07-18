import { ChevronLeft, ChevronRight, Flame, List, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useReadingExperience } from "@/hooks/useReadingExperience";
import { useKnowledgeNode } from "@/hooks/useKnowledgeNode";
import { DIFFICULTY_LEVELS } from "@/lib/memorize";
import { flattenClauseWords } from "@/lib/words";
import { getClauses, getVocabulary } from "@/lib/contentBlocks";
import { Header } from "@/components/layout/Header";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { ChainOfNarration } from "@/components/chain/ChainOfNarration";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { ArabicReader } from "@/components/reader/ArabicReader";
import { StudyPanel } from "@/components/study/StudyPanel";
import { CompanionWidget } from "@/components/companion/CompanionWidget";
import { SourceDetailModal } from "@/components/sources/SourceDetailModal";
import { hadithReaderPath } from "@/lib/routes";
import type { Difficulty, RightTab, SheetId } from "@/types";

interface HadithReaderContentProps {
  slug: string;
}

export function HadithReaderContent({ slug }: HadithReaderContentProps) {
  const { data: dto, loading, notFound } = useReadingExperience(slug);
  const { t, uiLang, dir } = useSettings();
  const isCompact = useIsMobile(1040);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navMode = searchParams.get("nav") === "page" ? "page" : "hadith";

  const [onboarding, setOnboarding] = useState(true);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [activeNarrator, setActiveNarrator] = useState("narrator-yahya");
  const [rightTab, setRightTab] = useState<RightTab>("understand");
  const [activeGraphNode, setActiveGraphNode] = useState("center");
  const [fontScale, setFontScale] = useState(1);
  const [bookmarked, setBookmarked] = useLocalStorage(`alminhej:${slug}:bookmarked`, false);
  const [copied, setCopied] = useState(false);
  const [discovered, setDiscovered] = useLocalStorage<string[]>(`alminhej:${slug}:discovered`, []);
  const discoveredSet = useMemo(() => new Set(discovered), [discovered]);

  const [memorize, setMemorize] = useState(false);
  const [difficulty, setDifficulty] = useState<number>(DIFFICULTY_LEVELS.medium);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [reciteCount, setReciteCount] = useLocalStorage(`alminhej:${slug}:reciteCount`, 0);

  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [showToc, setShowToc] = useState(false);
  const activeSourceNode = useKnowledgeNode(activeSource);

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
    setRevealed(new Set());
  };

  const castVote = (sourceId: string) => {
    if (voted.has(sourceId)) return;
    setVoted((v) => new Set(v).add(sourceId));
    setVotes((v) => ({ ...v, [sourceId]: (v[sourceId] || 0) + 1 }));
  };

  const openChainForNarrator = (id: string) => {
    setActiveNarrator(id);
    if (isCompact) setSheet("chain");
  };

  if (loading) {
    return <div className="h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-sub)]">…</div>;
  }
  if (notFound || !dto) {
    return (
      <div className="h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-ink)] text-sm">
        Not found.
      </div>
    );
  }

  const libraryNav = dto.libraryNav;
  const prevHadith = libraryNav && libraryNav.currentHadithIndex > 0
    ? libraryNav.hadiths[libraryNav.currentHadithIndex - 1]
    : null;
  const nextHadith = libraryNav && libraryNav.currentHadithIndex < libraryNav.hadiths.length - 1
    ? libraryNav.hadiths[libraryNav.currentHadithIndex + 1]
    : null;
  const pageNumbers = libraryNav ? [...new Set(libraryNav.hadiths.map((entry) => entry.pageNum))] : [];
  const currentPageIndex = libraryNav ? pageNumbers.findIndex((pageNum) => pageNum === libraryNav.currentPageNum) : -1;
  const previousPageNum = currentPageIndex > 0 ? pageNumbers[currentPageIndex - 1] : null;
  const nextPageNum = currentPageIndex >= 0 && currentPageIndex < pageNumbers.length - 1 ? pageNumbers[currentPageIndex + 1] : null;

  const firstHadithSlugForPage = (pageNum: number) => {
    return libraryNav?.hadiths.find((entry) => entry.pageNum === pageNum)?.node.slug ?? null;
  };

  const navigateWithinBook = (targetSlug: string | null) => {
    if (!targetSlug) return;
    navigate(hadithReaderPath(targetSlug, { navMode }));
  };

  const jumpToTocEntry = (pageStart: number) => {
    const targetSlug = firstHadithSlugForPage(pageStart);
    if (!targetSlug) return;
    setShowToc(false);
    navigateWithinBook(targetSlug);
  };

  const headerStatus = libraryNav
    ? navMode === "page"
      ? `${t.volume} ${libraryNav.currentVolumeNum} · ${t.page} ${libraryNav.currentPageNum} ${t.ofUnits} ${pageNumbers.length}`
      : `${t.hadith} ${libraryNav.currentHadithIndex + 1} ${t.ofUnits} ${libraryNav.hadiths.length}`
    : null;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      {onboarding && <OnboardingModal onClose={() => setOnboarding(false)} />}

      {activeSourceNode && (
        <SourceDetailModal
          node={activeSourceNode}
          onClose={() => setActiveSource(null)}
          onVote={castVote}
          voted={voted.has(activeSourceNode.id)}
          voteCount={votes[activeSourceNode.id] || 0}
        />
      )}

      <Header
        lessonTag={t.lessonTag}
        discoveredCount={discoveredSet.size}
        totalVocab={getVocabulary(dto.node)?.entries.length ?? 0}
        onReopenOnboarding={() => setOnboarding(true)}
        isCompact={isCompact}
        logoHref="/"
      />

      {libraryNav && (
        <>
          <div
            className="flex items-center justify-between px-4 py-2 border-b flex-wrap gap-2 shrink-0"
            style={{ borderColor: "var(--color-line)", background: "var(--color-panel-2)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to="/library"
                className="text-[11px] px-2.5 py-[5px] rounded-full border"
                style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}
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
                  {uiLang === "ar" ? libraryNav.book.title.ar : libraryNav.book.title.en}
                </span>
                {" · "}
                {t.chapter} {uiLang === "ar" ? libraryNav.currentChapterTitle.ar : libraryNav.currentChapterTitle.en}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--color-sub)" }}>
              <div className="flex rounded-full overflow-hidden border" style={{ borderColor: "var(--color-line)" }}>
                {(["hadith", "page"] as const).map((mode) => {
                  const active = navMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => navigate(hadithReaderPath(dto.node.slug, { navMode: mode }), { replace: true })}
                      className="px-2.5 py-[5px] text-[10px]"
                      style={{
                        background: active ? "var(--color-emerald)" : "var(--color-panel)",
                        color: active ? "#f6f1e6" : "var(--color-sub)",
                      }}
                    >
                      {mode === "hadith" ? t.navByHadith : t.navByPage}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={navMode === "page" ? !previousPageNum : !prevHadith}
                onClick={() => {
                  if (navMode === "page") {
                    navigateWithinBook(previousPageNum ? firstHadithSlugForPage(previousPageNum) : null);
                    return;
                  }
                  navigateWithinBook(prevHadith?.node.slug ?? null);
                }}
                className="w-6 h-6 rounded grid place-items-center border disabled:opacity-40"
                style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-sub)" }}
              >
                {dir === "rtl" ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
              </button>
              <span>{headerStatus}</span>
              <button
                disabled={navMode === "page" ? !nextPageNum : !nextHadith}
                onClick={() => {
                  if (navMode === "page") {
                    navigateWithinBook(nextPageNum ? firstHadithSlugForPage(nextPageNum) : null);
                    return;
                  }
                  navigateWithinBook(nextHadith?.node.slug ?? null);
                }}
                className="w-6 h-6 rounded grid place-items-center border disabled:opacity-40"
                style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
              >
                {dir === "rtl" ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
              </button>
            </div>
          </div>

          {showToc && (
            <>
              <div onClick={() => setShowToc(false)} className="fixed inset-0 z-[95]" style={{ background: "rgba(0,0,0,.4)" }} />
              <div className="fixed top-0 bottom-0 inset-inline-start-0 w-[86%] max-w-[360px] z-[96] p-[18px] overflow-y-auto border-e" style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-[14px]" style={{ color: "var(--color-ink)" }}>{t.toc}</span>
                  <button
                    onClick={() => setShowToc(false)}
                    className="rounded-full w-7 h-7 cursor-pointer border grid place-items-center"
                    style={{ background: "var(--color-panel-2)", borderColor: "var(--color-line)", color: "var(--color-sub)" }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="text-[11px] mb-3.5" style={{ color: "var(--color-sub)" }}>{t.tocHint}</div>
                <div className="grid gap-1.5">
                  {libraryNav.toc.map((entry) => {
                    const available = entry.pages > 0;
                    const active = entry.id === libraryNav.currentChapterId;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => {
                          if (!available) return;
                          jumpToTocEntry(entry.pageStart);
                        }}
                        className="flex justify-between items-center text-start w-full p-[11px_12px] rounded-[10px] cursor-pointer font-family-inherit border"
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
                            {uiLang === "ar" ? entry.title.ar : entry.title.en}
                          </div>
                          <div className="text-[9.5px] mt-0.5" style={{ color: available ? "var(--color-emerald)" : "var(--color-sub)" }}>
                            {available ? `${entry.pages} ${t.tocDigitizedPages}` : t.notDigitizedYet}
                          </div>
                        </div>
                        {entry.sourcePath && (
                          <div className="text-[10px]" style={{ color: "var(--color-sub)" }}>
                            {entry.sourcePath}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="flex-1 flex min-h-0 relative">
        {isCompact ? (
          <BottomSheet open={sheet === "chain"} title={t.chainEyebrow} onClose={() => setSheet(null)}>
            <ChainOfNarration
              isnad={dto.isnad}
              activeId={activeNarrator}
              onSelect={setActiveNarrator}
              onOpenSource={setActiveSource}
            />
          </BottomSheet>
        ) : (
          <aside className="lesson-scroller h-full overflow-y-auto shrink-0 w-[300px] border-e border-[var(--color-line)] p-[18px]">
            <ChainOfNarration
              isnad={dto.isnad}
              activeId={activeNarrator}
              onSelect={setActiveNarrator}
              onOpenSource={setActiveSource}
            />
          </aside>
        )}

        <main
          className="lesson-scroller h-full overflow-y-auto flex-1 min-w-0 px-[6vw] py-6 flex flex-col items-center"
          style={{ paddingBottom: isCompact ? 76 : 24 }}
        >
          <ReaderToolbar
            setFontScale={setFontScale}
            bookmarked={bookmarked}
            setBookmarked={setBookmarked}
            copied={copied}
            onCopy={() => {
              const clauses = getClauses(dto.node);
              navigator.clipboard?.writeText(clauses?.items.map((c) => c.text.ar).join(" ") ?? "");
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
              const clauses = getClauses(dto.node);
              if (clauses) setRevealed(new Set(flattenClauseWords(clauses.items).map((w) => w.key)));
            }}
          />
          <ArabicReader
            dto={dto}
            fontScale={fontScale}
            isCompact={isCompact}
            discovered={discoveredSet}
            onDiscover={onDiscover}
            onIsnadClick={() => openChainForNarrator("narrator-umar")}
            onOpenSource={setActiveSource}
            memorize={memorize}
            difficulty={difficulty}
            revealed={revealed}
            onToggleReveal={onToggleReveal}
          />

          {memorize && (
            <button
              onClick={() => setReciteCount((n) => n + 1)}
              className="mt-5 flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full bg-[var(--color-gold)] text-[#241c0a]"
            >
              <Flame size={15} /> {t.recitedBtn}
              {reciteCount > 0 && ` · ${reciteCount} ${t.recitedCount}`}
            </button>
          )}
        </main>

        {isCompact ? (
          <BottomSheet open={sheet === "study"} title={t.mStudy} onClose={() => setSheet(null)}>
            <StudyPanel
              dto={dto}
              tab={rightTab}
              setTab={setRightTab}
              discovered={discoveredSet}
              onDiscover={onDiscover}
              activeGraphNode={activeGraphNode}
              setActiveGraphNode={setActiveGraphNode}
              onOpenSource={setActiveSource}
            />
          </BottomSheet>
        ) : (
          <aside className="lesson-scroller h-full overflow-y-auto shrink-0 w-[340px] border-s border-[var(--color-line)] p-[18px]">
            <StudyPanel
              dto={dto}
              tab={rightTab}
              setTab={setRightTab}
              discovered={discoveredSet}
              onDiscover={onDiscover}
              activeGraphNode={activeGraphNode}
              setActiveGraphNode={setActiveGraphNode}
              onOpenSource={setActiveSource}
            />
          </aside>
        )}
      </div>

      {isCompact && (
        <BottomTabBar sheet={sheet} onToggle={(next) => setSheet((s) => (s === next ? null : next))} />
      )}

      <CompanionWidget node={dto.node} bottomOffset={isCompact ? 72 : 20} />
    </div>
  );
}

export default HadithReaderContent;
