import { useSettings } from "@/context/SettingsContext";
import { useLibrary } from "@/hooks/useLibrary";
import { SourceProgressBar } from "@/components/sources/SourceProgressBar";
import { formatPct } from "@/lib/format";

export function LibraryTab({ onOpenSource }: { onOpenSource: (id: string) => void }) {
  const { t, uiLang, dir } = useSettings();
  const { entries, loading } = useLibrary();

  return (
    <div>
      <p className="text-[11.5px] text-[var(--color-sub)] leading-relaxed mb-3.5">{t.libraryIntro}</p>
      {loading && <p className="text-[11.5px] text-[var(--color-sub)]">…</p>}
      <div className="grid gap-2">
        {entries.map(({ node, indexedUnits, pct }) => {
          const attrs = node.attributes.kind === "book" ? node.attributes : null;
          return (
            <button
              key={node.id}
              onClick={() => onOpenSource(node.id)}
              dir={dir}
              className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3 text-start"
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[12.5px] font-semibold text-[var(--color-ink)]">
                  {uiLang === "ar" ? node.title.ar : node.title.en}
                </span>
                <span className="text-[10.5px] text-[var(--color-sub)]">{formatPct(pct, indexedUnits)}</span>
              </div>
              {attrs && (
                <div className="text-[10px] text-[var(--color-sub)] mb-1.5">
                  {uiLang === "ar" ? attrs.author.ar : attrs.author.en} · {uiLang === "ar" ? attrs.eraLabel.ar : attrs.eraLabel.en}
                </div>
              )}
              <SourceProgressBar pct={pct} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
