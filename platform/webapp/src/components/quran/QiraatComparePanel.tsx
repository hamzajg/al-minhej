import { X, BookOpen } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import type { QiraatPathId, RiwayatMode } from "@/domain/quran";

interface RiwayatEntry {
  id: string;
  ar: string;
  en: string;
  readerId: string;
  readerAr: string;
  readerEn: string;
  collection: string;
  countsBasmala: boolean | "pending";
  variant?: "verified" | "pending";
  variantAr?: string;
  variantEn?: string;
  note?: string;
  noteEn?: string;
  rumuz?: string;
  readerRumuz?: string;
  segmentReadings?: Record<string, { ar: string; note?: string; noteEn?: string }>;
}

interface CoupletData {
  ar: string;
  en: string;
  sectionAr?: string;
  sectionEn?: string;
  versesRange?: string;
  rumuzLetters?: string[];
  rumuzNotes?: { ar: string; en: string };
}

interface RumuzData {
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
  letters: Record<string, { reader: string; readerAr: string; readerEn: string; type: string }>;
}

function sourceLabelFor(reader: { collection: string }, path: string) {
  if (path === "kubra") return { ar: "طيبة النشر", en: "At-Tayyibah" };
  return reader.collection === "durrah" ? { ar: "الدرة", en: "Ad-Durrah" } : { ar: "الشاطبية", en: "Ash-Shatibiyyah" };
}

interface QiraatComparePanelProps {
  allRiwayat: RiwayatEntry[];
  basmalaNote: { ar: string; en: string; pendingReaders: string; pendingReadersEn: string };
  forSegment: string;
  mode: RiwayatMode;
  activeRiwayah: string;
  compareSelection: Set<string>;
  qiraatPath: QiraatPathId;
  isCompact?: boolean;
  renderInline?: boolean;
  couplets?: CoupletData;
  additionalCouplets?: CoupletData[];
  durrahCouplets?: CoupletData;
  tayyibahCouplets?: CoupletData;
  rumuz?: RumuzData;
  onClose?: () => void;
}

export function QiraatComparePanel({
  allRiwayat,
  basmalaNote,
  forSegment,
  mode,
  activeRiwayah,
  compareSelection,
  qiraatPath,
  isCompact,
  renderInline = false,
  couplets,
  additionalCouplets,
  durrahCouplets,
  tayyibahCouplets,
  rumuz,
  onClose,
}: QiraatComparePanelProps) {
  const { uiLang, dir } = useSettings();
  const isAr = uiLang === "ar";

  const scope =
    mode === "single"
      ? allRiwayat.filter((r) => r.id === activeRiwayah)
      : mode === "compare"
        ? allRiwayat.filter((r) => compareSelection.has(r.id))
        : allRiwayat;

  const isBasmala = forSegment === "basmala";
  const isSiratal = forSegment === "siratal" || forSegment === "siratal1" || forSegment === "siratal2";
  const title = isBasmala
    ? isAr ? "البسملة — هل تُعدّ آية؟" : "The Basmalah — does it count as an ayah?"
    : isSiratal
      ? isAr ? "الصراط / السراط — قراءات مختلفة" : "As-Sirat / As-Sarat — variant readings"
      : isAr ? "مالك / مالكي — يوم الدين" : "Malik / Māliki — yawm ad-Din";

  const scholarNoteAr = isBasmala
    ? basmalaNote.ar
    : isSiratal
      ? "يقرأ ابن كثير (د) «السراط» بالألف после الصاد، و(ق) يقرأ (ق) «الصراط» بالصاد فقط، وكلا القراءتين صحيحة."
      : "يذكر الطبري أن الملك والمالك كلاهما صحيح المعنى، إذ لا مالك يوم القيامة إلا الله.";
  const scholarNoteEn = isBasmala
    ? basmalaNote.en
    : isSiratal
      ? "Ibn Kathir (D) reads 'as-Sarat' with an Alif after the Sad, while Qunbul (Q) reads 'as-Sirat' with Sad only — both readings are authentic."
      : "At-Tabari notes both readings converge on the same meaning: on that day, sovereignty belongs to God alone.";

  return (
    <div
      onClick={renderInline ? undefined : onClose}
      className={[
        renderInline 
          ? "bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-4"
          : "fixed inset-0 bg-black/60 z-[105] flex justify-center",
        !renderInline && (isCompact ? "items-end p-0" : "items-center p-4.5"),
      ].filter(Boolean).join(" ")}
    >
      <div
        dir={dir}
        onClick={renderInline ? (e) => e.stopPropagation() : undefined}
        className={[
          renderInline 
            ? "w-full"
            : "bg-[var(--color-panel)] border border-[var(--color-line)] p-5.5 overflow-y-auto w-full max-h-[82vh]",
          !renderInline && (isCompact ? "rounded-t-2xl" : "max-w-[520px] rounded-2xl"),
        ].filter(Boolean).join(" ")}
      >
        <div className="flex justify-between items-start mb-1.5">
          <div>
            <div className="text-[10px] text-[var(--color-gold)] font-bold mb-1">
              {isAr ? "مقارنة القراءات" : "Comparing readings"}
            </div>
            <div
              className={[
                "text-[15px] font-bold",
                isAr ? "font-ui-ar" : "font-display",
              ].join(" ")}
            >
              {title}
            </div>
          </div>
          {!renderInline && onClose && (
            <button
              onClick={onClose}
              className="bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-full w-7 h-7 flex items-center justify-center text-[var(--color-sub)] cursor-pointer shrink-0"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="text-[10.5px] text-[var(--color-sub)] mb-3.5">
          {isAr ? "الروايات المعروضة الآن" : "Riwayat shown now"}: {scope.length}
        </div>

        {/* ── Per-riwayat readings with rumuz ── */}
        <div className="grid gap-2 mb-4">
          {scope.map((r) => {
            const src = sourceLabelFor({ collection: r.collection ?? "shatibiyyah" }, qiraatPath);
            const segReading = r.segmentReadings?.[forSegment];

            if (isBasmala) {
              let readingText: string;
              let readingBadge: "verified" | "pending";
              if (r.countsBasmala === true) {
                readingText = isAr ? "تُعدّ الآية الأولى — البسملة آية رقم ١" : "Counted as ayah one — Basmalah is verse #1";
                readingBadge = "verified";
              } else if (r.countsBasmala === false) {
                readingText = isAr
                  ? "لا تُعدّ آية مستقلة — تبدأ الآية بـ«الحمد لله»"
                  : "Not counted as a separate ayah — verse starts with Al-Hamdu";
                readingBadge = "verified";
              } else {
                readingText = isAr ? "غير محدد هنا" : "Not determined here";
                readingBadge = "pending";
              }
              return (
                <div key={r.id} className="bg-[var(--color-panel-2)] rounded-xl p-2.5">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11.5px] font-bold">
                      {isAr ? `${r.readerAr} — ${r.ar}` : `${r.en} 'an ${r.readerEn}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {r.rumuz && (
                        <span className="font-arabic text-[13px] text-[var(--color-gold)] font-bold" title={isAr ? "رمز الشاطبية" : "Shatibiyyah code"}>
                          {r.rumuz}
                        </span>
                      )}
                      <span className={["text-[9px] font-bold", readingBadge === "verified" ? "text-[var(--color-emerald)]" : "text-[#B0785A]"].join(" ")}>
                        {readingBadge === "verified" ? (isAr ? "موثّقة" : "Verified") : (isAr ? "بانتظار المراجعة" : "Pending review")}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11.5px] mb-1" style={{ color: "var(--color-ink)" }}>
                    {readingText}
                  </div>
                  <div className="text-[9px]" style={{ color: "var(--color-sub)" }}>
                    {isAr ? "المصدر" : "Cited from"}: {isAr ? src.ar : src.en}
                  </div>
                </div>
              );
            }

            /* ── malik / siratal segment ── */
            const hasReading = !!segReading;
            const readingText = hasReading ? segReading.ar : (isAr ? "القراءة标准" : "Standard reading");
            const readingNote = hasReading ? (isAr ? segReading.note : segReading.noteEn) : null;
            const readingBadge = r.variant === "verified" ? "verified" : (hasReading ? "verified" : "pending");

            return (
              <div key={r.id} className="bg-[var(--color-panel-2)] rounded-xl p-2.5">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11.5px] font-bold">
                    {isAr ? `${r.readerAr} — ${r.ar}` : `${r.en} 'an ${r.readerEn}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {r.rumuz && (
                      <span className="font-arabic text-[13px] text-[var(--color-gold)] font-bold" title={isAr ? "رمز الشاطبية" : "Shatibiyyah code"}>
                        {r.rumuz}
                      </span>
                    )}
                    <span className={["text-[9px] font-bold", readingBadge === "verified" ? "text-[var(--color-emerald)]" : "text-[#B0785A]"].join(" ")}>
                      {readingBadge === "verified" ? (isAr ? "موثّقة" : "Verified") : (isAr ? "بانتظار المراجعة" : "Pending review")}
                    </span>
                  </div>
                </div>

                {/* Full verse text in Arabic */}
                <div className="font-arabic text-[17px] mb-1" style={{ color: "var(--color-ink)" }}>
                  {readingText}
                </div>

                {/* Reading note */}
                {readingNote && (
                  <div className="text-[10.5px] leading-relaxed mb-1" style={{ color: "var(--color-sub)" }}>
                    {readingNote}
                  </div>
                )}

                {/* Source citation */}
                <div className="text-[9px] flex items-center gap-1.5" style={{ color: "var(--color-sub)" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-gold)" }} />
                  {isAr ? "المصدر" : "Cited from"}: {isAr ? src.ar : src.en}
                  {r.note && (
                    <span className="ms-1 opacity-70">· {isAr ? r.note : (r.noteEn ?? r.note)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Rumuz Table ── */}
        {rumuz && (
          <div className="bg-[var(--color-panel-2)] rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-bold text-[var(--color-gold)]">
                {isAr ? rumuz.ar : rumuz.en}
              </span>
            </div>
            <div className="text-[10px] mb-2" style={{ color: "var(--color-sub)" }}>
              {isAr ? rumuz.descAr : rumuz.descEn}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(rumuz.letters).map(([letter, info]) => (
                <div
                  key={letter}
                  className="text-center p-1.5 rounded-lg"
                  style={{
                    background: info.type === "reader" ? "var(--color-emerald)14" : "transparent",
                    border: info.type === "reader" ? "1px solid var(--color-emerald)33" : "1px solid var(--color-line)",
                  }}
                >
                  <div className="font-arabic text-[16px] font-bold" style={{ color: "var(--color-ink)" }}>
                    {letter}
                  </div>
                  <div className="text-[8px]" style={{ color: "var(--color-sub)" }}>
                    {isAr ? info.readerAr : info.readerEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Ash-Shatibiyyah Couplets ── */}
        {couplets && (
          <div className="bg-[var(--color-panel-2)] rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} className="text-[var(--color-gold)]" />
              <span className="text-[11px] font-bold text-[var(--color-gold)]">
                {isAr ? "أبيات الشاطبية" : "Ash-Shatibiyyah Couplets"}
              </span>
            </div>
            <div className="text-[9.5px] mb-2" style={{ color: "var(--color-sub)" }}>
              {isAr ? "بحر الطويل — ١١٧٣ بيتًا" : "Bahr al-Tawil — 1,173 couplets"}
            </div>

            {/* Section header */}
            {couplets.sectionAr && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ background: "var(--color-emerald)14", border: "1px solid var(--color-emerald)33" }}>
                <span className="text-[10px] font-bold text-[var(--color-emerald)]">
                  {isAr ? couplets.sectionAr : couplets.sectionEn}
                </span>
                {couplets.versesRange && (
                  <span className="text-[9px] text-[var(--color-sub)]">
                    {isAr ? `أبيات ${couplets.versesRange}` : `Verses ${couplets.versesRange}`}
                  </span>
                )}
              </div>
            )}

            {/* Arabic couplets with rumuz highlighting */}
            <div
              className="font-arabic text-[13px] leading-[2.2] whitespace-pre-line p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
              }}
              dir="rtl"
            >
              {couplets.ar}
            </div>

            {/* English translation */}
            <div
              className="text-[11px] leading-relaxed mt-2 p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-sub)",
                border: "1px solid var(--color-line)",
              }}
            >
              {couplets.en}
            </div>

            {/* Rumuz letters legend */}
            {couplets.rumuzLetters && couplets.rumuzLetters.length > 0 && couplets.rumuzNotes && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: "var(--color-gold)14", border: "1px solid var(--color-gold)33" }}>
                <div className="text-[9.5px] font-bold text-[var(--color-gold)] mb-1">
                  {isAr ? "الرموز المضمنة في النص" : "Embedded Rumuz Codes"}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {couplets.rumuzLetters.map((letter) => (
                    <span
                      key={letter}
                      className="font-arabic text-[14px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--color-gold)20",
                        color: "var(--color-gold)",
                        border: "1px solid var(--color-gold)40",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
                <div className="text-[9px] leading-relaxed" style={{ color: "var(--color-sub)" }}>
                  {isAr ? couplets.rumuzNotes.ar : couplets.rumuzNotes.en}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Additional Couplets (e.g., alayhim section) ── */}
        {additionalCouplets && additionalCouplets.length > 0 && additionalCouplets.map((extra, idx) => (
          <div key={idx} className="bg-[var(--color-panel-2)] rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} className="text-[var(--color-gold)]" />
              <span className="text-[11px] font-bold text-[var(--color-gold)]">
                {isAr ? (extra.sectionAr ?? "أبيات إضافية") : (extra.sectionEn ?? "Additional Couplets")}
              </span>
            </div>

            {extra.versesRange && (
              <div className="text-[9px] mb-2" style={{ color: "var(--color-sub)" }}>
                {isAr ? `أبيات ${extra.versesRange}` : `Verses ${extra.versesRange}`}
              </div>
            )}

            <div
              className="font-arabic text-[13px] leading-[2.2] whitespace-pre-line p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
              }}
              dir="rtl"
            >
              {extra.ar}
            </div>

            <div
              className="text-[11px] leading-relaxed mt-2 p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-sub)",
                border: "1px solid var(--color-line)",
              }}
            >
              {extra.en}
            </div>

            {extra.rumuzLetters && extra.rumuzLetters.length > 0 && extra.rumuzNotes && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: "var(--color-gold)14", border: "1px solid var(--color-gold)33" }}>
                <div className="text-[9.5px] font-bold text-[var(--color-gold)] mb-1">
                  {isAr ? "الرموز المضمنة في النص" : "Embedded Rumuz Codes"}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {extra.rumuzLetters.map((letter) => (
                    <span
                      key={letter}
                      className="font-arabic text-[14px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--color-gold)20",
                        color: "var(--color-gold)",
                        border: "1px solid var(--color-gold)40",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
                <div className="text-[9px] leading-relaxed" style={{ color: "var(--color-sub)" }}>
                  {isAr ? extra.rumuzNotes.ar : extra.rumuzNotes.en}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── Ad-Durrah Couplets ── */}
        {durrahCouplets && (
          <div className="bg-[var(--color-panel-2)] rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} className="text-[#B0785A]" />
              <span className="text-[11px] font-bold text-[#B0785A]">
                {isAr ? "أبيات الدرة المضية" : "Ad-Durrah Couplets"}
              </span>
            </div>
            <div className="text-[9.5px] mb-2" style={{ color: "var(--color-sub)" }}>
              {isAr ? "بحر الطويل — تكملة العشر" : "Bahr al-Tawil — Completing the Ten"}
            </div>

            {durrahCouplets.sectionAr && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ background: "color-mix(in srgb, #B0785A 10%, transparent)", border: "1px solid color-mix(in srgb, #B0785A 25%, transparent)" }}>
                <span className="text-[10px] font-bold text-[#B0785A]">
                  {isAr ? durrahCouplets.sectionAr : durrahCouplets.sectionEn}
                </span>
                {durrahCouplets.versesRange && (
                  <span className="text-[9px] text-[var(--color-sub)]">
                    {isAr ? `أبيات ${durrahCouplets.versesRange}` : `Verses ${durrahCouplets.versesRange}`}
                  </span>
                )}
              </div>
            )}

            <div
              className="font-arabic text-[13px] leading-[2.2] whitespace-pre-line p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
              }}
              dir="rtl"
            >
              {durrahCouplets.ar}
            </div>

            <div
              className="text-[11px] leading-relaxed mt-2 p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-sub)",
                border: "1px solid var(--color-line)",
              }}
            >
              {durrahCouplets.en}
            </div>

            {durrahCouplets.rumuzLetters && durrahCouplets.rumuzLetters.length > 0 && durrahCouplets.rumuzNotes && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: "color-mix(in srgb, #B0785A 8%, transparent)", border: "1px solid color-mix(in srgb, #B0785A 20%, transparent)" }}>
                <div className="text-[9.5px] font-bold text-[#B0785A] mb-1">
                  {isAr ? "الرموز المضمنة في النص" : "Embedded Rumuz Codes"}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {durrahCouplets.rumuzLetters.map((letter) => (
                    <span
                      key={letter}
                      className="font-arabic text-[14px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, #B0785A 12%, transparent)",
                        color: "#B0785A",
                        border: "1px solid color-mix(in srgb, #B0785A 25%, transparent)",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
                <div className="text-[9px] leading-relaxed" style={{ color: "var(--color-sub)" }}>
                  {isAr ? durrahCouplets.rumuzNotes.ar : durrahCouplets.rumuzNotes.en}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── At-Tayyibah Couplets ── */}
        {tayyibahCouplets && (
          <div className="bg-[var(--color-panel-2)] rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} className="text-[#7C6A5A]" />
              <span className="text-[11px] font-bold text-[#7C6A5A]">
                {isAr ? "أبيات طيبة النشر" : "At-Tayyibah Couplets"}
              </span>
            </div>
            <div className="text-[9.5px] mb-2" style={{ color: "var(--color-sub)" }}>
              {isAr ? "بحر الرجز — العشر الكبرى" : "Bahr al-Rajaz — The Greater Ten"}
            </div>

            {tayyibahCouplets.sectionAr && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ background: "color-mix(in srgb, #7C6A5A 10%, transparent)", border: "1px solid color-mix(in srgb, #7C6A5A 25%, transparent)" }}>
                <span className="text-[10px] font-bold text-[#7C6A5A]">
                  {isAr ? tayyibahCouplets.sectionAr : tayyibahCouplets.sectionEn}
                </span>
                {tayyibahCouplets.versesRange && (
                  <span className="text-[9px] text-[var(--color-sub)]">
                    {isAr ? `أبيات ${tayyibahCouplets.versesRange}` : `Verses ${tayyibahCouplets.versesRange}`}
                  </span>
                )}
              </div>
            )}

            <div
              className="font-arabic text-[13px] leading-[2.2] whitespace-pre-line p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
              }}
              dir="rtl"
            >
              {tayyibahCouplets.ar}
            </div>

            <div
              className="text-[11px] leading-relaxed mt-2 p-2.5 rounded-lg"
              style={{
                background: "var(--color-bg)",
                color: "var(--color-sub)",
                border: "1px solid var(--color-line)",
              }}
            >
              {tayyibahCouplets.en}
            </div>

            {tayyibahCouplets.rumuzLetters && tayyibahCouplets.rumuzLetters.length > 0 && tayyibahCouplets.rumuzNotes && (
              <div className="mt-2 p-2 rounded-lg" style={{ background: "color-mix(in srgb, #7C6A5A 8%, transparent)", border: "1px solid color-mix(in srgb, #7C6A5A 20%, transparent)" }}>
                <div className="text-[9.5px] font-bold text-[#7C6A5A] mb-1">
                  {isAr ? "الرموز المضمنة في النص" : "Embedded Rumuz Codes"}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {tayyibahCouplets.rumuzLetters.map((letter) => (
                    <span
                      key={letter}
                      className="font-arabic text-[14px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, #7C6A5A 12%, transparent)",
                        color: "#7C6A5A",
                        border: "1px solid color-mix(in srgb, #7C6A5A 25%, transparent)",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
                <div className="text-[9px] leading-relaxed" style={{ color: "var(--color-sub)" }}>
                  {isAr ? tayyibahCouplets.rumuzNotes.ar : tayyibahCouplets.rumuzNotes.en}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scholarly note ── */}
        <div className="bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded-xl p-3">
          <div className="text-[10px] font-bold text-[var(--color-emerald)] mb-1.5">
            {isAr ? "ملاحظة علمية" : "Scholarly note"}
          </div>
          <p className="text-[11.5px] leading-relaxed m-0 text-[var(--color-ink)]">
            {isAr ? scholarNoteAr : scholarNoteEn}
          </p>
          {isBasmala && basmalaNote.pendingReaders && (
            <p className="text-[10px] text-[var(--color-sub)] mt-2 mb-0">
              {isAr ? basmalaNote.pendingReaders : basmalaNote.pendingReadersEn}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
