import React from "react";
import { GitBranch, Layers, ShieldCheck } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import type { QiraatPathId, RiwayatMode } from "@/domain/quran";

interface RiwayatReader {
  node: { id: string };
  order: number;
  collection: string;
  ar: string;
  en: string;
  cityAr: string;
  cityEn: string;
  riwayat: {
    id: string;
    ar: string;
    en: string;
    variant: "verified" | "pending";
    variantAr?: string;
    variantEn?: string;
    note?: string;
    noteEn?: string;
  }[];
}

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

interface RiwayatPanelProps {
  readers: RiwayatReader[];
  allRiwayat: RiwayatEntry[];
  collections: Record<string, { ar: string; en: string; countAr: string; countEn: string }>;
  qiraatPaths: Record<string, { ar: string; en: string; subtitleAr: string; subtitleEn: string; descAr: string; descEn: string }>;
  activeRiwayah: string;
  setActiveRiwayah: (id: string) => void;
  riwayatMode: RiwayatMode;
  setRiwayatMode: (mode: RiwayatMode) => void;
  compareSelection: Set<string>;
  setCompareSelection: React.Dispatch<React.SetStateAction<Set<string>>>;
  qiraatPath: QiraatPathId;
  setQiraatPath: (path: QiraatPathId) => void;
}

export function RiwayatPanel({
  readers,
  allRiwayat,
  collections,
  qiraatPaths,
  activeRiwayah,
  setActiveRiwayah,
  riwayatMode,
  setRiwayatMode,
  compareSelection,
  setCompareSelection,
  qiraatPath,
  setQiraatPath,
}: RiwayatPanelProps) {
  const { uiLang } = useSettings();
  const active = allRiwayat.find((r) => r.id === activeRiwayah);

  const toggleCompare = (id: string) => {
    setCompareSelection((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAr = uiLang === "ar";

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1 text-[var(--color-gold)]">
        <GitBranch size={14} />
        <span className="text-[11.5px] tracking-wide font-bold">
          {isAr ? "طرق القراءة" : "Reading traditions"}
        </span>
      </div>
      <h2
        className={[
          "text-[18px] font-semibold mb-3.5",
          isAr ? "font-ui-ar" : "font-display",
        ].join(" ")}
      >
        {isAr ? "روايات القرآن" : "Qira'at of the Qur'an"}
      </h2>

      <div className="bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded-xl p-3 mb-3.5 flex gap-2">
        <ShieldCheck
          size={16}
          className="text-[var(--color-emerald)] shrink-0 mt-0.5"
        />
        <p className="text-[11.5px] leading-relaxed text-[var(--color-ink)]">
          {isAr
            ? "كل الروايات العشر متواترة — منقولة بأسانيد صحيحة متصلة إلى النبي ﷺ."
            : "All ten canonical qira'at are mutawatir — transmitted through unbroken, verified chains back to the Prophet ﷺ."}
        </p>
      </div>

      {/* Path Selection: Sughra vs Kubra */}
      <div className="mb-3.5">
        <div className="flex items-center gap-1.5 mb-1.5 text-[var(--color-sub)]">
          <Layers size={12} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {isAr ? "المجموعة المرجعية" : "Reference collection"}
          </span>
        </div>
        <div className="flex gap-1.5">
          {(["sughra", "kubra"] as const).map((p) => {
            const activePath = qiraatPath === p;
            const pathInfo = qiraatPaths[p];
            return (
              <button
                key={p}
                onClick={() => setQiraatPath(p)}
                className={[
                  "flex-1 text-start p-2 rounded-xl cursor-pointer font-inherit transition-all border",
                  activePath
                    ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
                    : "bg-[var(--color-panel)] text-[var(--color-ink)] border-[var(--color-line)]",
                ].join(" ")}
              >
                <div className="text-[11.5px] font-bold">
                  {isAr ? pathInfo.ar : pathInfo.en}
                </div>
                <div className="text-[9px] opacity-85 mt-0.5">
                  {isAr ? pathInfo.subtitleAr : pathInfo.subtitleEn}
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-[9.5px] text-[var(--color-sub)] mt-1.5 leading-normal">
          {isAr ? qiraatPaths[qiraatPath].descAr : qiraatPaths[qiraatPath].descEn}
        </div>
      </div>

      {/* Selection Mode */}
      <div className="flex gap-1 mb-2">
        {(
          [
            ["single", isAr ? "رواية واحدة" : "Single riwayah"],
            ["compare", isAr ? "مقارنة" : "Compare"],
            ["all", isAr ? "الكل" : "All twenty"],
          ] as const
        ).map(([k, l]) => {
          const activeMode = riwayatMode === k;
          return (
            <button
              key={k}
              onClick={() => setRiwayatMode(k)}
              className={[
                "flex-1 text-[10.5px] py-1.5 px-1.5 rounded-lg cursor-pointer font-inherit font-bold transition-all border",
                activeMode
                  ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
                  : "bg-[var(--color-panel-2)] text-[var(--color-sub)] border-[var(--color-line)]",
              ].join(" ")}
            >
              {l}
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-[var(--color-sub)] mb-3.5 leading-relaxed">
        {riwayatMode === "single"
          ? isAr
            ? "اختر رواية واحدة لعرضها في الصفحة."
            : "Pick one riwayah to render on the page."
          : riwayatMode === "compare"
            ? isAr
              ? "اختر عدة روايات يدويًا لمقارنتها عند الضغط على ⇄."
              : "Manually pick several riwayat to compare when you tap ⇄."
            : isAr
              ? "تُعرض جميع الروايات العشرين عند الضغط على ⇄."
              : "All twenty riwayat are included when you tap ⇄."}
      </div>

      {/* Reader list grouped by collection */}
      {(["shatibiyyah", "durrah"] as const).map((colId) => {
        const col = collections[colId];
        return (
          <div key={colId} className="mb-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[10.5px] font-bold text-[var(--color-gold)]">
                {isAr ? col.ar : col.en}
              </span>
              <span className="text-[9px] text-[var(--color-sub)]">
                {isAr ? col.countAr : col.countEn}
              </span>
            </div>
            <div className="grid gap-1.5">
              {readers.filter((r) => r.collection === colId).map((reader) => (
                <div
                  key={reader.node.id}
                  className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-2.5"
                >
                  <div className="text-[11px] font-bold text-[var(--color-ink)] mb-1.5">
                    {reader.order}. {isAr ? reader.ar : reader.en}{" "}
                    <span className="font-normal text-[var(--color-sub)]">
                      · {isAr ? reader.cityAr : reader.cityEn}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {reader.riwayat.map((rw) => {
                      const id = rw.id;
                      const isSelected =
                        riwayatMode === "single"
                          ? activeRiwayah === id
                          : riwayatMode === "all"
                            ? true
                            : compareSelection.has(id);
                      const onClick = () => {
                        if (riwayatMode === "single") setActiveRiwayah(id);
                        else if (riwayatMode === "compare") toggleCompare(id);
                      };
                      return (
                        <button
                          key={id}
                          onClick={onClick}
                          disabled={riwayatMode === "all"}
                          className={[
                            "text-[10.5px] px-2.5 py-1 rounded-full font-inherit transition-all border",
                            riwayatMode === "all" ? "cursor-default" : "cursor-pointer",
                            isSelected
                              ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
                              : "bg-[var(--color-panel-2)] text-[var(--color-sub)] border-[var(--color-line)]",
                          ].join(" ")}
                        >
                          {isAr ? rw.ar : rw.en}
                          {rw.variant === "verified" && (
                            <span className="ms-1 opacity-85">●</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="text-[9.5px] text-[var(--color-sub)] leading-normal mb-3.5">
        <span className="text-[var(--color-emerald)]">●</span>{" "}
        {isAr
          ? "موثّقة مقابل مصادر علمية — غير الموسومة بذلك بانتظار المراجعة العلمية ولم تُخترع."
          : "Verified against scholarly sources — anything not marked is pending scholarly review, never invented."}
      </div>

      {riwayatMode === "single" && active && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5">
          <div className="text-[10.5px] text-[var(--color-sub)] mb-1.5">
            {isAr ? "القراءة الحالية" : "Currently reading"}
          </div>
          <div
            className={[
              "text-[14px] font-semibold mb-2",
              isAr ? "font-ui-ar" : "font-display",
            ].join(" ")}
          >
            {isAr
              ? `${active.readerAr} — ${active.ar}`
              : `${active.en} 'an ${active.readerEn}`}
          </div>
          {active.variant === "verified" ? (
            <div>
              <div className="font-arabic text-[20px] text-[var(--color-gold)] mb-1">
                {active.variantAr}
              </div>
              <p className="text-[11.5px] text-[var(--color-sub)] leading-relaxed">
                {isAr
                  ? active.note || ""
                  : active.noteEn || active.variantEn}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-sub)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B0785A]" />
              {isAr
                ? "هذا الاختلاف لهذه الرواية بانتظار المراجعة العلمية — لم يُفترض أو يُخترع."
                : "This riwayah's reading here is pending scholarly review — not assumed or invented."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
