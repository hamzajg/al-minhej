import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { getAiContext } from "@/lib/contentBlocks";
import type { KnowledgeNode } from "@/domain/types";

export function CompanionWidget({ node, bottomOffset = 20 }: { node: KnowledgeNode; bottomOffset?: number }) {
  const { t, uiLang, dir } = useSettings();
  const [open, setOpen] = useState(false);
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);
  const ai = getAiContext(node);
  if (!ai) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI companion"
        style={{ bottom: bottomOffset }}
        className="fixed end-5 w-[50px] h-[50px] rounded-full bg-[var(--color-emerald)] text-[var(--color-gold)] grid place-items-center shadow-xl z-[80]"
      >
        <Sparkles size={18} />
      </button>

      {open && (
        <div
          style={{ bottom: bottomOffset + 62 }}
          className="fixed end-5 w-[300px] max-w-[calc(100vw-32px)] bg-[var(--color-panel)] border border-[var(--color-line)] rounded-2xl p-4 shadow-2xl z-[80]"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-[13px]">
              <Sparkles size={13} className="text-[var(--color-gold)]" /> {t.companionTitle}
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--color-sub)]">
              <X size={15} />
            </button>
          </div>
          <div className="text-[10.5px] text-[var(--color-sub)] bg-[var(--color-gold)]/15 rounded-lg px-2.5 py-1.5 mb-2">
            {t.companionNote}
          </div>
          <div className="grid gap-1.5 mb-2">
            {ai.prompts.map((key, i) => (
              <button
                key={key}
                onClick={() => setAnswerIndex(i)}
                dir={dir}
                className="text-start text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-panel-2)] border border-[var(--color-line)] text-[var(--color-ink)]"
              >
                {t.companionPromptLabels[key]}
              </button>
            ))}
          </div>
          {answerIndex !== null && (
            <div className="text-xs leading-relaxed bg-[var(--color-panel-2)] rounded-lg p-2.5 text-[var(--color-ink)]">
              {ai.answers[uiLang][answerIndex]}
            </div>
          )}
        </div>
      )}
    </>
  );
}
