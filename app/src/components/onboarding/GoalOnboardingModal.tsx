import { Compass } from "lucide-react";
import { LEARNING_GOALS } from "@/data/goals";

/**
 * Goal selection — the "why are you here?" step. Same visual pattern as
 * `OnboardingModal` (the reading-mode picker), but the choice here seeds a
 * learning path instead of a display preference. The copy is bilingual in
 * one view on purpose, matching that modal: a first-time visitor has not
 * chosen a UI language yet.
 */
export function GoalOnboardingModal({
  onChoose,
  onSkip,
}: {
  onChoose: (goalId: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/65 flex items-center justify-center p-5">
      <div className="bg-[var(--color-panel)] rounded-3xl p-7 max-w-[620px] w-full border border-[var(--color-line)] max-h-[88vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] text-[var(--color-gold)] mb-2">
            <Compass size={13} /> PATH
          </div>
          <div className="font-arabic text-[30px] text-[var(--color-gold)] leading-tight mb-0.5">
            لماذا أنت هنا؟
          </div>
          <div className="font-display text-[14px] text-[var(--color-sub)] mb-3">Why are you here?</div>
          <p className="text-[11.5px] text-[var(--color-sub)] leading-relaxed max-w-[440px] mx-auto">
            اختر نقطة البداية، وسيُبنى مسارك من الروابط الحقيقية في شبكة المعرفة — لا من قائمة ثابتة.
            <br />
            Pick a starting point; your path is then built from the real connections in the knowledge
            graph — not a fixed syllabus.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          {LEARNING_GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => onChoose(goal.id)}
              className="text-start p-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-2)] hover:border-[var(--color-emerald)] transition-colors"
            >
              <div className="font-arabic text-[19px] text-[var(--color-ink)] mb-1">{goal.title.ar}</div>
              <div className="text-[12.5px] font-semibold text-[var(--color-emerald)] mb-2">
                {goal.title.en}
              </div>
              <div className="text-[11px] text-[var(--color-sub)] leading-relaxed mb-2">
                {goal.description.ar}
              </div>
              <div className="text-[11px] text-[var(--color-sub)] leading-relaxed">
                {goal.description.en}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-5">
          <button
            onClick={onSkip}
            className="text-[11px] text-[var(--color-sub)] underline underline-offset-2"
          >
            لاحقًا · Not now
          </button>
        </div>
      </div>
    </div>
  );
}
