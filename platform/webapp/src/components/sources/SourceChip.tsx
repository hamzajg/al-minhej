import { useSettings } from "@/context/SettingsContext";
import { useNodeProgress } from "@/hooks/useNodeProgress";
import { formatPct } from "@/lib/format";
import type { KnowledgeNode } from "@/domain/types";

export function SourceChip({ node, onOpen }: { node: KnowledgeNode; onOpen: (id: string) => void }) {
  const { uiLang } = useSettings();
  const { indexedUnits, pct } = useNodeProgress(node);
  const digitized = indexedUnits > 0;

  return (
    <button
      onClick={() => onOpen(node.id)}
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-panel-2)] border border-[var(--color-line)] py-1 ps-1.5 pe-2.5"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${digitized ? "bg-[var(--color-emerald)]" : "bg-[#B0785A]"}`}
      />
      <span className="text-[11px] font-semibold text-[var(--color-ink)]">
        {uiLang === "ar" ? node.title.ar : node.title.en}
      </span>
      <span className="text-[9.5px] text-[var(--color-sub)]">{formatPct(pct, indexedUnits)}</span>
    </button>
  );
}
