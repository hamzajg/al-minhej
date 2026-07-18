import { useSettings } from "@/context/SettingsContext";
import type { KnowledgeNode } from "@/domain/types";

interface Props {
  narrator: KnowledgeNode;
}

export function BiographyDisplay({ narrator }: Props) {
  const { uiLang } = useSettings();

  // Find the biography block in the narrator's content
  const biographyBlock = narrator.content.find((b) => b.type === "biography") as any;

  if (!biographyBlock) {
    return (
      <div className="text-center py-8 text-[var(--color-sub)]">
        No biography available for this narrator.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg">
          <div className="text-xs font-semibold text-[var(--color-sub)] mb-1">الكنية / Kunya</div>
          <div className="font-medium">{biographyBlock.kunya?.[uiLang] || biographyBlock.kunya?.ar}</div>
        </div>
        <div className="p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg">
          <div className="text-xs font-semibold text-[var(--color-sub)] mb-1">النسب / Nasab</div>
          <div className="font-medium">{biographyBlock.nasab?.[uiLang] || biographyBlock.nasab?.ar}</div>
        </div>
        <div className="p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg">
          <div className="text-xs font-semibold text-[var(--color-sub)] mb-1">الطبقة / Tabaqah</div>
          <div className="font-medium">
            {biographyBlock.tabaqahLabel?.[uiLang] || biographyBlock.tabaqahLabel?.ar}
          </div>
        </div>
        <div className="p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg">
          <div className="text-xs font-semibold text-[var(--color-sub)] mb-1">محل الولادة / Birth Place</div>
          <div className="font-medium">{biographyBlock.birthPlace?.[uiLang] || biographyBlock.birthPlace?.ar}</div>
        </div>
        <div className="p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg">
          <div className="text-xs font-semibold text-[var(--color-sub)] mb-1">معلومات الوفاة / Death Info</div>
          <div className="font-medium">{biographyBlock.deathInfo?.[uiLang] || biographyBlock.deathInfo?.ar}</div>
        </div>
      </div>

      {/* Summary */}
      {biographyBlock.summary && (
        <section className="p-4 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg">
          <h3 className="font-semibold text-sm mb-2 text-[var(--color-ink)]">الملخص / Summary</h3>
          <p className="text-sm leading-relaxed text-[var(--color-ink)]">
            {biographyBlock.summary[uiLang] || biographyBlock.summary.ar}
          </p>
          <div className="text-xs mt-2 text-[var(--color-sub)]">
            مصدر الملخص: {biographyBlock.summaryProvenance === "ai_generated" ? "مُولَّد بالذكاء الاصطناعي" : "أصلي"}
          </div>
        </section>
      )}

      {/* Biographical References */}
      {biographyBlock.biographicalReferences && biographyBlock.biographicalReferences.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-sm text-[var(--color-ink)]">
            المراجع السيرية / Biographical References
          </h3>
          <div className="space-y-3">
            {biographyBlock.biographicalReferences.map((ref: any, idx: number) => (
              <div key={idx} className="p-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 rounded">
                    {ref.provenance === "primary" ? "P" : "AI"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {ref.workTitle[uiLang] || ref.workTitle.ar}
                    </div>
                    <div className="text-xs text-[var(--color-sub)]">
                      المؤلف: {ref.author[uiLang] || ref.author.ar}
                    </div>
                    {ref.locator && (
                      <div className="text-xs text-[var(--color-sub)] mt-0.5">
                        الموقع: {ref.locatorType === "tarjamaNumber" ? "رقم الترجمة" : ref.locatorType === "volumePage" ? "المجلد/الصفحة" : ref.locatorType === "yearEntry" ? "إدخال السنة" : "صفحة"}
                        {ref.locator && ` — ${ref.locator}`}
                      </div>
                    )}
                    {ref.gradeOrNote && (
                      <div className="text-xs mt-1 italic" style={{ color: "var(--color-ink)" }}>
                        {ref.gradeOrNote[uiLang] || ref.gradeOrNote.ar}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Teachers */}
      {biographyBlock.teachers && biographyBlock.teachers.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-[var(--color-ink)]">الشيوخ / Teachers</h3>
          <div className="flex flex-wrap gap-2">
            {biographyBlock.teachers.map((t: any) => (
              <span key={t.narratorId} className="px-2 py-1 text-xs bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border border-[var(--color-emerald)]/30 rounded-full">
                {t.note[uiLang] || t.note.ar}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Students */}
      {biographyBlock.students && biographyBlock.students.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-[var(--color-ink)]">التلاميذ / Students</h3>
          <div className="flex flex-wrap gap-2">
            {biographyBlock.students.map((s: any) => (
              <span key={s.narratorId} className="px-2 py-1 text-xs bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 rounded-full">
                {s.note[uiLang] || s.note.ar}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}