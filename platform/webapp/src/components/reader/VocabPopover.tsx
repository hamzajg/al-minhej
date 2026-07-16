import { useSettings } from "@/context/SettingsContext";
import type { VocabEntry } from "@/domain/types";

export function VocabPopover({ v }: { v: VocabEntry }) {
  const { uiLang } = useSettings();
  return (
    <span className="absolute bottom-[130%] left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-[var(--color-bg)] rounded-lg px-3 py-2 text-[11.5px] font-sans whitespace-nowrap z-20 shadow-lg text-center leading-relaxed">
      <b>{v.gloss[uiLang as "ar" | "en"]}</b>
      <br />
      {v.root && <> {uiLang === "ar" ? "الجذر" : "root"} {v.root}</>}
      {v.pron && <> · {v.pron}</>}
    </span>
  );
}
