import { useState } from "react";
import { CircleCheck, NotebookPen, PenLine, Quote } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useWorkspaceJournal } from "@/hooks/useWorkspaceJournal";
import { getQuiz } from "@/lib/contentBlocks";
import type { KnowledgeNode } from "@/domain/types";
import type { WorkspaceKind } from "@/domain/workspace";

interface QuizAnswer {
  picked: number;
}

interface Props {
  node: KnowledgeNode;
  takeaway: string;
  actionItem: string;
  setTakeaway: (value: string) => void;
  setActionItem: (value: string) => void;
}

/**
 * The reader's own notes are per account, server-side (`PROMPTS.md` Prompt 7),
 * so this tab takes them as props rather than reaching for `localStorage`
 * itself — the reading experience owns the read/write via `useReaderState`.
 */
export function PracticeTab({ node, takeaway, actionItem, setTakeaway, setActionItem }: Props) {
  const { t, uiLang, dir } = useSettings();
  const [quizState, setQuizState] = useState<Record<number, QuizAnswer>>({});
  const quiz = getQuiz(node)?.questions ?? [];

  // §5.A's user workspace: the journal is the account's own notes and
  // reflections on this node — separate from the single takeaway/action-item
  // pair above, which stay the reader-state fields they always were.
  const journal = useWorkspaceJournal(node.id);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState<WorkspaceKind | null>(null);

  const addEntry = async (kind: WorkspaceKind) => {
    if (!draft.trim() || saving) return;
    setSaving(kind);
    try {
      await journal.add(kind, draft);
      setDraft("");
    } finally {
      setSaving(null);
    }
  };

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

      {journal.available && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-4">
          <div className="text-[11.5px] text-[var(--color-sub)] flex items-center gap-1.5 mb-2">
            <NotebookPen size={12} />
            {uiLang === "ar" ? "دفترك على هذا النص" : "Your journal on this node"}
          </div>

          {journal.notes.length > 0 && (
            <div className="grid gap-2 mb-3">
              {journal.notes.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2"
                >
                  <div className="flex items-center gap-1.5 text-[10px] mb-1" style={{ color: "var(--color-sub)" }}>
                    {entry.kind === "reflection" ? <Quote size={10} /> : <PenLine size={10} />}
                    {entry.kind === "reflection"
                      ? uiLang === "ar" ? "تأمل" : "reflection"
                      : uiLang === "ar" ? "ملاحظة" : "note"}
                    <span>· {new Date(entry.createdAt).toLocaleDateString(uiLang === "ar" ? "ar" : "en")}</span>
                  </div>
                  <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-ink)" }}>
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={uiLang === "ar" ? "اكتب ملاحظة أو تأملًا…" : "Write a note or reflection…"}
            dir={dir}
            className="w-full bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-lg p-2.5 text-xs font-sans resize-y mb-2 text-[var(--color-ink)] placeholder:text-[var(--color-sub)]"
          />
          <div className="flex gap-2">
            <button
              onClick={() => void addEntry("note")}
              disabled={!draft.trim() || saving !== null}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-line)] cursor-pointer disabled:opacity-50"
              style={{ color: "var(--color-ink)", background: "var(--color-panel-2)" }}
            >
              {uiLang === "ar" ? "أضف ملاحظة" : "Add note"}
            </button>
            <button
              onClick={() => void addEntry("reflection")}
              disabled={!draft.trim() || saving !== null}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border cursor-pointer disabled:opacity-50"
              style={{ color: "var(--color-emerald)", borderColor: "var(--color-emerald)", background: "transparent" }}
            >
              {uiLang === "ar" ? "أضف تأملًا" : "Add reflection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
