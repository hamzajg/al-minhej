import { useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { getAiContext } from "@/lib/contentBlocks";
import { useCompanion } from "@/hooks/useCompanion";
import type { KnowledgeNode } from "@/domain/types";

/**
 * The study companion. Asks the server's grounded route (§7) and renders the
 * answer with the AI label that keeps it visually separate from the religious
 * text and scholar commentary.
 *
 * The three authored prompts are still here, but as *quick-start questions* —
 * they now send a real question instead of looking up a canned answer. Every
 * reply comes from the model, grounded in `KnowledgeContextBuilder`'s output,
 * which is why the widget has honest states for "not configured" and "failed".
 */
export function CompanionWidget({ node, bottomOffset = 20 }: { node: KnowledgeNode; bottomOffset?: number }) {
  const { t, dir } = useSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const ai = getAiContext(node);
  const { status, answer, error, ask } = useCompanion(node.id);
  if (!ai) return null;

  const busy = status === "thinking";

  const submit = (question: string) => {
    if (!question.trim() || busy) return;
    setDraft("");
    ask(question);
  };

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
            {ai.prompts.map((key) => {
              const label = t.companionPromptLabels?.[key] ?? key;
              return (
                <button
                  key={key}
                  onClick={() => submit(label)}
                  disabled={busy}
                  dir={dir}
                  className="text-start text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-panel-2)] border border-[var(--color-line)] text-[var(--color-ink)] disabled:opacity-50"
                >
                  {label}
                </button>
              );
            })}
          </div>

          {status === "thinking" && (
            <div className="text-[11px] text-[var(--color-sub)] px-1 pb-2">{t.companionThinking}</div>
          )}

          {status === "answered" && answer && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-[9.5px] font-bold text-[var(--color-gold)] mb-1">
                <Sparkles size={10} /> {t.companionAiLabel}
              </div>
              <div
                dir={dir}
                className="text-xs leading-relaxed bg-[var(--color-panel-2)] rounded-lg p-2.5 text-[var(--color-ink)] whitespace-pre-wrap"
              >
                {answer}
              </div>
            </div>
          )}

          {status === "unavailable" && (
            <div
              dir={dir}
              className="text-[11px] leading-relaxed bg-[var(--color-panel-2)] border border-dashed border-[var(--color-line)] rounded-lg p-2.5 mb-2 text-[var(--color-sub)]"
            >
              {t.companionUnavailable}
            </div>
          )}

          {status === "error" && (
            <div
              dir={dir}
              className="text-[11px] leading-relaxed bg-[var(--color-panel-2)] border border-[#B0785A]/50 rounded-lg p-2.5 mb-2 text-[var(--color-sub)]"
            >
              {t.companionError}
              {error && <div className="mt-1 opacity-70 break-words">{error}</div>}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="flex items-center gap-1.5"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              dir={dir}
              placeholder={t.companionAskPlaceholder}
              disabled={busy}
              className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-panel-2)] border border-[var(--color-line)] text-[var(--color-ink)] outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label={t.companionSend}
              disabled={busy || !draft.trim()}
              className="w-[30px] h-[30px] shrink-0 rounded-lg bg-[var(--color-emerald)] text-[var(--color-gold)] grid place-items-center disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
