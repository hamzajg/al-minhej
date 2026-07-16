import { Flame, X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useNodeProgress } from "@/hooks/useNodeProgress";
import { formatPct } from "@/lib/format";
import { SourceProgressBar } from "./SourceProgressBar";
import type { KnowledgeNode } from "@/domain/types";

interface Props {
  node: KnowledgeNode;
  onClose: () => void;
  onVote: (id: string) => void;
  voted: boolean;
  voteCount: number;
}

export function SourceDetailModal({ node, onClose, onVote, voted, voteCount }: Props) {
  const { t, uiLang, dir } = useSettings();
  const { indexedUnits, pct } = useNodeProgress(node);
  const digitized = indexedUnits > 0;
  const attrs = node.attributes.kind === "book" ? node.attributes : null;
  const digitization = node.digitization;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] bg-black/65 flex items-center justify-center p-4"
    >
      <div
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-panel)] rounded-[22px] p-6 max-w-[460px] w-full max-h-[85vh] overflow-y-auto border border-[var(--color-line)]"
      >
        <div className="flex justify-between items-start mb-3.5">
          <div>
            <div
              className={uiLang === "ar" ? "font-arabic text-[22px]" : "font-display text-[19px]"}
              style={{ fontWeight: 600, color: "var(--color-ink)", lineHeight: 1.3 }}
            >
              {uiLang === "ar" ? node.title.ar : node.title.en}
            </div>
            {attrs && (
              <div className="text-[11.5px] text-[var(--color-sub)] mt-1">
                {t.author}: {uiLang === "ar" ? attrs.author.ar : attrs.author.en} · {attrs.eraLabel}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-full w-7 h-7 grid place-items-center text-[var(--color-sub)] shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {digitization && (
          <>
            <div className="mb-1.5">
              <SourceProgressBar pct={pct} height={7} />
            </div>
            <div className="text-[11px] text-[var(--color-sub)] mb-4.5 mb-[18px]">
              {indexedUnits.toLocaleString()} {t.ofUnits} {digitization.totalUnits.toLocaleString()}{" "}
              {uiLang === "ar" ? digitization.unit.ar : digitization.unit.en} {t.unitsDigitized} ·{" "}
              {formatPct(pct, indexedUnits)}
            </div>
          </>
        )}

        {digitized ? (
          <div className="bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/25 rounded-2xl p-4 text-[12.5px] text-[var(--color-ink)]">
            {uiLang === "ar"
              ? "النص المرقمن لهذا الموضع معروض بالفعل ضمن الحديث نفسه أعلاه."
              : "The digitized passage for this exact reference is shown in the hadith reader itself above."}
          </div>
        ) : (
          <div className="bg-[#B0785A]/10 border border-[#B0785A]/25 rounded-2xl p-4">
            <div className="text-[10px] text-[#B0785A] font-bold mb-2">{t.notDigitizedYet}</div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-ink)] mb-3">{t.sourceEmptyNote}</p>
            <button
              onClick={() => onVote(node.id)}
              disabled={voted}
              className={[
                "flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border-none",
                voted ? "bg-[var(--color-panel-2)] text-[var(--color-sub)] cursor-default" : "bg-[var(--color-gold)] text-[#241c0a] cursor-pointer",
              ].join(" ")}
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
