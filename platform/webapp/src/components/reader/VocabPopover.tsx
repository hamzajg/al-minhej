import { useSettings } from "@/context/SettingsContext";

interface VocabItem {
  id: string;
  word: string;
  root?: string;
  pron?: string;
  gloss?: { ar: string; en: string };
  ar?: string;
  en?: string;
}

function getGloss(v: VocabItem, lang: string): string {
  if (v.gloss) return v.gloss[lang as "ar" | "en"] ?? "";
  if (lang === "ar") return v.ar ?? "";
  return v.en ?? "";
}

export function VocabPopover({ v }: { v: VocabItem }) {
  const { uiLang } = useSettings();
  const gloss = getGloss(v, uiLang);
  return (
    <span className="absolute bottom-[130%] left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-[var(--color-bg)] rounded-lg px-3 py-2 text-[11.5px] font-sans whitespace-nowrap z-20 shadow-lg text-center leading-relaxed">
      <b>{gloss}</b>
      <br />
      {v.root && <> {uiLang === "ar" ? "الجذر" : "root"} {v.root}</>}
      {v.pron && <> · {v.pron}</>}
    </span>
  );
}
