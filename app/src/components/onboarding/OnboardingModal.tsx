import { useSettings } from "@/context/SettingsContext";
import type { ReadingMode } from "@/types";

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const { applyReadingMode, readingMode } = useSettings();

  const pick = (mode: ReadingMode) => {
    applyReadingMode(mode);
    onClose();
  };

  const immersiveActive = readingMode === "immersive";
  const guidedActive = readingMode === "guided";

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-5">
      <div className="bg-[var(--color-panel)] rounded-3xl p-7 max-w-[560px] w-full border border-[var(--color-line)] text-center">
        <div className="font-arabic text-[34px] text-[var(--color-gold)] mb-1">مرحبًا بك</div>
        <div className="font-display text-[15px] text-[var(--color-sub)] mb-5">Welcome</div>
        <div className="text-[13px] text-[var(--color-ink)] mb-5">
          كيف تفضّل قراءة الحديث؟ &nbsp;·&nbsp; How would you like to read the hadith?
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => pick("immersive")}
            className={`text-center p-5 rounded-2xl border transition-colors ${
              immersiveActive
                ? "bg-[var(--color-emerald)]/10 border-[var(--color-emerald)]"
                : "bg-[var(--color-panel-2)] border-[var(--color-line)] hover:border-[var(--color-emerald)]"
            }`}
          >
            <div className="font-arabic text-xl text-[var(--color-emerald)] mb-1.5">العربية أولًا</div>
            <div className="text-[12.5px] font-semibold mb-2 text-[var(--color-ink)]">Arabic First</div>
            <div className="text-[11px] text-[var(--color-sub)] leading-relaxed">
              اقرأ النص كما هو، والترجمة مخفية افتراضيًا.
              <br />
              Translation hidden by default.
            </div>
            {immersiveActive && (
              <div className="text-[10px] text-[var(--color-emerald)] font-semibold mt-2">✓ نشط</div>
            )}
          </button>
          <button
            onClick={() => pick("guided")}
            className={`text-center p-5 rounded-2xl border transition-colors ${
              guidedActive
                ? "bg-[var(--color-gold)]/10 border-[var(--color-gold)]"
                : "bg-[var(--color-panel-2)] border-[var(--color-line)] hover:border-[var(--color-gold)]"
            }`}
          >
            <div className="text-[12.5px] font-semibold mb-1.5 text-[var(--color-gold)]">
              Guided with translation
            </div>
            <div className="font-arabic text-base text-[var(--color-ink)] mb-2">موجَّه بالترجمة</div>
            <div className="text-[11px] text-[var(--color-sub)] leading-relaxed">
              Keep a translation paragraph under the text.
              <br />
              أبقِ فقرة ترجمة مساعدة أسفل النص.
            </div>
            {guidedActive && (
              <div className="text-[10px] text-[var(--color-gold)] font-semibold mt-2">✓ Active</div>
            )}
          </button>
        </div>
        <div className="text-[10.5px] text-[var(--color-sub)] mt-4">
          You can switch anytime from the header.
        </div>
      </div>
    </div>
  );
}
