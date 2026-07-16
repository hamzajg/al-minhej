import { useMemo, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { isOccluded } from "@/lib/memorize";
import { flattenClauseWords } from "@/lib/words";
import { getClauses, getVocabulary } from "@/lib/contentBlocks";
import { VocabPopover } from "./VocabPopover";
import { SourceChip } from "@/components/sources/SourceChip";
import type { ReadingExperienceDTO } from "@/domain/dto";

interface Props {
  dto: ReadingExperienceDTO;
  fontScale: number;
  isCompact: boolean;
  discovered: Set<string>;
  onDiscover: (id: string) => void;
  onIsnadClick: () => void;
  onOpenSource: (id: string) => void;
  memorize: boolean;
  difficulty: number;
  revealed: Set<string>;
  onToggleReveal: (key: string) => void;
}

export function ArabicReader({
  dto,
  fontScale,
  isCompact,
  discovered,
  onDiscover,
  onIsnadClick,
  onOpenSource,
  memorize,
  difficulty,
  revealed,
  onToggleReveal,
}: Props) {
  const { t, showTranslation, subtitleLang } = useSettings();
  const [hoverVocab, setHoverVocab] = useState<string | null>(null);

  const clauses = getClauses(dto.node);
  const vocab = useMemo(() => getVocabulary(dto.node)?.entries ?? [], [dto.node]);

  const vocabByWord = useMemo(() => {
    const m: Record<string, (typeof vocab)[number]> = {};
    vocab.forEach((v) => (m[v.word] = v));
    return m;
  }, [vocab]);

  // Flatten every clause into one continuous word stream — this is the
  // compact-canvas change: the hadith wraps as a single paragraph, the way
  // it reads on a physical page, instead of one block per clause.
  const words = useMemo(() => (clauses ? flattenClauseWords(clauses.items) : []), [clauses]);

  const fullTranslation = clauses?.items.map((cl) => cl.text[subtitleLang as "en" | "fr" | "es"] ?? "").join(" ") ?? "";

  if (!clauses) return null;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-1.5">
        <span className="text-[10.5px] text-[var(--color-gold)]">{t.originalLabel}</span>
      </div>
      <div className="text-center mb-4.5 mb-[18px] text-[11px] text-[var(--color-sub)] opacity-85 max-w-[460px]">
        {memorize ? t.memorizeHint : t.tapHint}
      </div>

      {!memorize && (
        <button
          onClick={onIsnadClick}
          className="block w-full text-center bg-transparent mb-[18px] max-w-[640px]"
        >
          <div dir="rtl" className="font-arabic text-[var(--color-sub)] leading-[1.9]" style={{ fontSize: 13.5 * fontScale }}>
            {clauses.intro.ar}
          </div>
          {showTranslation && (
            <div className="text-[11px] text-[var(--color-sub)] opacity-75 mt-0.5 italic">
              {clauses.intro[subtitleLang as "ar" | "en" | "fr" | "es"] ?? ""}
            </div>
          )}
          <div className="text-[10.5px] text-[var(--color-gold)] mt-1">{t.viewChain}</div>
        </button>
      )}

      {/* Compact continuous Arabic block — the memorization-friendly canvas */}
      <div
        className="w-full rounded-[20px] border border-[var(--color-line)] bg-[var(--color-panel)] transition-shadow"
        style={{
          maxWidth: 640,
          padding: isCompact ? "24px 18px" : "34px 30px",
          boxShadow: memorize ? "0 0 0 2px color-mix(in srgb, var(--color-emerald) 20%, transparent)" : "none",
        }}
      >
        <p
          dir="rtl"
          className="font-arabic text-center m-0"
          style={{ fontSize: (isCompact ? 23 : 27) * fontScale, lineHeight: 1.75 }}
        >
          {words.map((w) => {
            const v = vocabByWord[w.clean];
            const occluded = memorize && isOccluded(w.idx, difficulty);
            const isRevealed = revealed.has(w.key);

            const wordSpan = (
              <span
                className={occluded ? `transition-[filter,opacity] duration-200 cursor-pointer ${isRevealed ? "" : "blur-[5px] opacity-55"}` : ""}
                onClick={(e) => {
                  if (occluded) {
                    e.stopPropagation();
                    onToggleReveal(w.key);
                    return;
                  }
                  if (v) {
                    e.stopPropagation();
                    setHoverVocab((h) => (h === v.id ? null : v.id));
                    onDiscover(v.id);
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
                    className={[
                      "relative cursor-pointer border-b border-dotted border-[var(--color-gold)] hover:text-[var(--color-gold)]",
                      discovered.size === 0 && w.idx === 0 ? "animate-invite-pulse" : "",
                    ].join(" ")}
                    onMouseEnter={() => setHoverVocab(v.id)}
                    onMouseLeave={() => setHoverVocab(null)}
                  >
                    {wordSpan}
                    {hoverVocab === v.id && <VocabPopover v={v} />}
                  </span>{" "}
                </span>
              );
            }
            return <span key={w.key}>{wordSpan} </span>;
          })}
        </p>

        {!memorize && showTranslation && (
          <p className="text-center text-sm text-[var(--color-sub)] italic opacity-80 mt-4.5 mt-[18px] mb-0 leading-relaxed">
            {fullTranslation}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-5.5 mt-[22px]">
        <button
          onClick={onIsnadClick}
          className="text-[11.5px] text-[var(--color-sub)] bg-transparent underline underline-offset-[3px]"
        >
          {t.narratedBy}
        </button>
        <span className="text-[11.5px] text-[var(--color-sub)]">·</span>
        {dto.isnad.books.map(({ node }) => (
          <SourceChip key={node.id} node={node} onOpen={onOpenSource} />
        ))}
      </div>
    </div>
  );
}
