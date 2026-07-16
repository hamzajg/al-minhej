import { useState } from "react";
import { CircleCheck, NotebookPen } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getQuiz } from "@/lib/contentBlocks";
import type { KnowledgeNode } from "@/domain/types";

interface QuizAnswer {
  picked: number;
}

export function PracticeTab({ node }: { node: KnowledgeNode }) {
  const { t, uiLang, dir } = useSettings();
  const [takeaway, setTakeaway] = useLocalStorage(`alminhej:${node.slug}:takeaway`, "");
  const [actionItem, setActionItem] = useLocalStorage(`alminhej:${node.slug}:action`, "");
  const [quizState, setQuizState] = useState<Record<number, QuizAnswer>>({});
  const quiz = getQuiz(node)?.questions ?? [];

  return (
    <div className="grid gap-4">
      <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-4">
        <label className="text-[11.5px] text-[var(--color-sub)] flex items-center gap-1.5 mb-1.5">
          <NotebookPen size={12} /> {t.reflectionLabel}
        </label>
        <textarea
          value={takeaway}
          onChange={(e) => setTakeaway(e.target.value)}
          rows={2}
          placeholder={t.reflectionPh}
          dir={dir}
          className="w-full bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-lg p-2.5 text-xs font-sans resize-y mb-3 text-[var(--color-ink)] placeholder:text-[var(--color-sub)]"
        />
        <label className="text-[11.5px] text-[var(--color-sub)] flex items-center gap-1.5 mb-1.5">
          <CircleCheck size={12} /> {t.actionLabel}
        </label>
        <input
          value={actionItem}
          onChange={(e) => setActionItem(e.target.value)}
          placeholder={t.actionPh}
          dir={dir}
          className="w-full bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-lg p-2.5 text-xs font-sans text-[var(--color-ink)] placeholder:text-[var(--color-sub)]"
        />
      </div>

      <div className="grid gap-2.5">
        {quiz.map((q, qi) => {
          const state = quizState[qi];
          return (
            <div key={qi} className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5">
              <div className="text-[12.5px] font-semibold mb-2.5">{q.q[uiLang]}</div>
              <div className="grid gap-1.5">
                {q.options.map((opt, oi) => {
                  const picked = state?.picked === oi;
                  const showCorrect = state !== undefined && oi === q.correct;
                  return (
                    <button
                      key={oi}
                      onClick={() => setQuizState((s) => ({ ...s, [qi]: { picked: oi } }))}
                      dir={dir}
                      className={[
                        "text-start px-3 py-2 rounded-lg text-xs border",
                        showCorrect
                          ? "bg-[var(--color-emerald)]/20 border-[var(--color-emerald)]"
                          : picked
                          ? "bg-[var(--color-gold)]/15 border-[var(--color-gold)]"
                          : "bg-[var(--color-panel-2)] border-[var(--color-line)]",
                      ].join(" ")}
                    >
                      {opt[uiLang]}
                    </button>
                  );
                })}
              </div>
              {state !== undefined && (
                <div
                  className={[
                    "text-[11.5px] mt-2",
                    state.picked === q.correct ? "text-[var(--color-emerald)]" : "text-[var(--color-gold)]",
                  ].join(" ")}
                >
                  {state.picked === q.correct ? t.quizCorrect : t.quizWrong}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
