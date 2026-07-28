import { X } from "lucide-react";
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
  onClose: () => void;
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
  const title = isBasmala
    ? isAr
      ? "البسملة — هل تُعدّ آية؟"
      : "The Basmalah — does it count as an ayah?"
    : isAr
      ? "الآية الرابعة — مَالِكِ / مَلِكِ"
      : "Ayah 4 — Māliki / Maliki";

  const scholarNoteAr = isBasmala
    ? basmalaNote.ar
    : "يذكر الطبري أن الملك والمالك كلاهما صحيح المعنى، إذ لا مالك يوم القيامة إلا الله.";
  const scholarNoteEn = isBasmala
    ? basmalaNote.en
    : "At-Tabari notes both readings converge on the same meaning: on that day, sovereignty belongs to God alone.";

  return (
    <div
      onClick={onClose}
      className={[
        "fixed inset-0 bg-black/60 z-[105] flex justify-center",
        isCompact ? "items-end p-0" : "items-center p-4.5",
      ].join(" ")}
    >
      <div
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        className={[
          "bg-[var(--color-panel)] border border-[var(--color-line)] p-5.5 overflow-y-auto w-full max-h-[82vh]",
          isCompact ? "rounded-t-2xl" : "max-w-[480px] rounded-2xl",
        ].join(" ")}
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
          <button
            onClick={onClose}
            className="bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-full w-7 h-7 flex items-center justify-center text-[var(--color-sub)] cursor-pointer shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        <div className="text-[10.5px] text-[var(--color-sub)] mb-3.5">
          {isAr ? "الروايات المعروضة الآن" : "Riwayat shown now"}: {scope.length}
        </div>

        <div className="grid gap-2 mb-4">
          {scope.map((r) => {
            const src = sourceLabelFor({ collection: r.collection ?? "shatibiyyah" }, qiraatPath);
            let readingText: string;
            let readingBadge: "verified" | "pending";

            if (isBasmala) {
              if (r.countsBasmala === true) {
                readingText = isAr ? "تُعدّ الآية الأولى" : "Counted as ayah one";
                readingBadge = "verified";
              } else if (r.countsBasmala === false) {
                readingText = isAr
                  ? "لا تُعدّ آية مستقلة"
                  : "Not counted as a separate ayah";
                readingBadge = "verified";
              } else {
                readingText = isAr ? "غير محدد هنا" : "Not determined here";
                readingBadge = "pending";
              }
            } else {
              if (r.variant === "verified") {
                readingText = `${r.variantAr} — ${isAr ? "" : r.variantEn}`;
                readingBadge = "verified";
              } else {
                readingText = isAr ? "غير محدد هنا" : "Not determined here";
                readingBadge = "pending";
              }
            }

            return (
              <div
                key={r.id}
                className="bg-[var(--color-panel-2)] rounded-xl p-2.5"
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11.5px] font-bold">
                    {isAr
                      ? `${r.readerAr} — ${r.ar}`
                      : `${r.en} 'an ${r.readerEn}`}
                  </span>
                  <span
                    className={[
                      "text-[9px] font-bold",
                      readingBadge === "verified"
                        ? "text-[var(--color-emerald)]"
                        : "text-[#B0785A]",
                    ].join(" ")}
                  >
                    {readingBadge === "verified"
                      ? isAr
                        ? "موثّقة"
                        : "Verified"
                      : isAr
                        ? "بانتظار المراجعة"
                        : "Pending review"}
                  </span>
                </div>
                <div
                  className={[
                    "mb-1",
                    isBasmala ? "text-[11.5px]" : "font-arabic text-[15px]",
                  ].join(" ")}
                  style={{ color: "var(--color-ink)" }}
                >
                  {readingText}
                </div>
                <div className="text-[9px]" style={{ color: "var(--color-sub)" }}>
                  {isAr ? "المصدر" : "Cited from"}: {isAr ? src.ar : src.en}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded-xl p-3">
          <div className="text-[10px] font-bold text-[var(--color-emerald)] mb-1.5">
            {isAr ? "ملاحظة علمية" : "Scholarly note"}
          </div>
          <p className="text-[11.5px] leading-relaxed m-0 text-[var(--color-ink)]">
            {isAr ? scholarNoteAr : scholarNoteEn}
          </p>
          {isBasmala && (
            <p className="text-[10px] text-[var(--color-sub)] mt-2 mb-0">
              {isAr ? basmalaNote.pendingReaders : basmalaNote.pendingReadersEn}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
