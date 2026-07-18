import { useSettings } from "@/context/SettingsContext";
import type { KnowledgeNode } from "@/domain/types";

interface Props {
  narrator: KnowledgeNode;
}

export function LineageDisplay({ narrator }: Props) {
  const { uiLang } = useSettings();

  // Find the lineage block in the narrator's content
  const lineageBlock = narrator.content.find((b) => b.type === "lineage") as any;

  if (!lineageBlock || !lineageBlock.chain) {
    return (
      <div className="text-center py-8 text-[var(--color-sub)]">
        No lineage information available for this narrator.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-[var(--color-ink)]">
        النسب / Lineage
      </h3>

      <div className="space-y-1">
        {lineageBlock.chain.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-center text-xs text-[var(--color-sub)]">
              {idx + 1}
            </span>
            <span className="font-medium flex-1 text-start">
              {item.name[uiLang] || item.name.ar}
            </span>
            {item.note && (
              <span className="text-xs text-[var(--color-sub)] italic">
                ({item.note[uiLang] || item.note.ar})
              </span>
            )}
          </div>
        ))}
      </div>

      {lineageBlock.convergesWithProphetAt && (
        <div className="mt-4 p-3 bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded-lg">
          <div className="font-semibold text-sm text-[var(--color-emerald)] mb-1">
            يلتقي بنسب النبي ﷺ عند / Converges with Prophet's lineage at
          </div>
          <div className="text-sm">
            {lineageBlock.convergesWithProphetAt.name[uiLang] || lineageBlock.convergesWithProphetAt.name.ar}
          </div>
          {lineageBlock.convergesWithProphetAt.note && (
            <div className="text-xs text-[var(--color-sub)] mt-1">
              {lineageBlock.convergesWithProphetAt.note[uiLang] || lineageBlock.convergesWithProphetAt.note.ar}
            </div>
          )}
        </div>
      )}

      {lineageBlock.agreementNote && (
        <div className="mt-4 p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg text-sm">
          <div className="font-semibold text-[var(--color-ink)] mb-1">ملاحظة الإجماع / Agreement Note</div>
          <div className="text-[var(--color-sub)]">
            {lineageBlock.agreementNote[uiLang] || lineageBlock.agreementNote.ar}
          </div>
        </div>
      )}

      {lineageBlock.disputedBeyond && (
        <div className="mt-4 p-3 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-lg text-sm">
          <div className="font-semibold text-[var(--color-gold)] mb-1">مختلف فيه / Disputed</div>
          <div className="text-[var(--color-sub)]">
            بعد: {lineageBlock.disputedBeyond.afterName[uiLang] || lineageBlock.disputedBeyond.afterName.ar}
            <br />
            {lineageBlock.disputedBeyond.note[uiLang] || lineageBlock.disputedBeyond.note.ar}
          </div>
        </div>
      )}

      {lineageBlock.taqribSourceNote && (
        <div className="mt-4 p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg text-xs text-[var(--color-sub)]">
          {lineageBlock.taqribSourceNote[uiLang] || lineageBlock.taqribSourceNote.ar}
        </div>
      )}
    </div>
  );
}