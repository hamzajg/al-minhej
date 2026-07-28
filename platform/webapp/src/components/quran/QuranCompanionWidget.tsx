import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface QuranCompanionWidgetProps {
  companionPrompts: { ar: string[]; en: string[] };
  companionAnswers: { ar: string[]; en: string[] };
  bottomOffset?: number;
}

export function QuranCompanionWidget({
  companionPrompts,
  companionAnswers,
  bottomOffset = 20,
}: QuranCompanionWidgetProps) {
  const { uiLang, dir } = useSettings();
  const [open, setOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState<number | null>(null);

  const isAr = uiLang === "ar";
  const prompts = isAr ? companionPrompts.ar : companionPrompts.en;
  const answers = isAr ? companionAnswers.ar : companionAnswers.en;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI companion"
        style={{ bottom: bottomOffset }}
        className="fixed end-5 w-[50px] h-[50px] rounded-full bg-[var(--color-emerald)] text-[var(--color-gold)] grid place-items-center shadow-xl z-[80] border-none cursor-pointer"
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
              <Sparkles size={13} className="text-[var(--color-gold)]" />{" "}
              {isAr ? "الرفيق" : "Companion"}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--color-sub)] bg-transparent border-none cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="text-[10.5px] text-[var(--color-sub)] bg-[var(--color-gold)]/15 rounded-lg px-2.5 py-1.5 mb-2">
            {isAr
              ? "تبقى تفسيرات الذكاء الاصطناعي منفصلة بوضوح عن كتب التفسير المعتمدة."
              : "AI explanations stay clearly separate from established tafsir works."}
          </div>

          <div className="grid gap-1.5 mb-2">
            {prompts.map((p, i) => (
              <button
                key={p}
                onClick={() => setPromptIndex(i)}
                dir={dir}
                className="text-start text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-panel-2)] border border-[var(--color-line)] text-[var(--color-ink)] cursor-pointer font-inherit"
              >
                {p}
              </button>
            ))}
          </div>

          {promptIndex !== null && answers[promptIndex] && (
            <div className="text-xs leading-relaxed bg-[var(--color-panel-2)] rounded-lg p-2.5 text-[var(--color-ink)]">
              {answers[promptIndex]}
            </div>
          )}
        </div>
      )}
    </>
  );
}
