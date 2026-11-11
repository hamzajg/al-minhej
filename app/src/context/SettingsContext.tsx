import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ReadingMode, SubtitleLang, UiLang } from "@/types";
import { STRINGS, type UiStrings } from "@/data/i18n";

interface SettingsState {
  uiLang: UiLang;
  setUiLang: (l: UiLang) => void;
  dark: boolean;
  toggleDark: () => void;
  showTranslation: boolean;
  setShowTranslation: (v: boolean | ((v: boolean) => boolean)) => void;
  subtitleLang: SubtitleLang;
  setSubtitleLang: (l: SubtitleLang) => void;
  readingMode: ReadingMode;
  setReadingMode: (m: ReadingMode) => void;
  dir: "rtl" | "ltr";
  t: UiStrings;
  applyReadingMode: (mode: "immersive" | "guided") => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [uiLang, setUiLang] = useState<UiLang>("ar");
  const [dark, setDark] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [subtitleLang, setSubtitleLang] = useState<SubtitleLang>("en");
  const [readingMode, setReadingMode] = useState<ReadingMode>("immersive");

  const dir = uiLang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLang;
  }, [dir, uiLang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const applyReadingMode = (mode: "immersive" | "guided") => {
    setReadingMode(mode);
    if (mode === "immersive") {
      setUiLang("ar");
      setShowTranslation(false);
    } else {
      setUiLang("en");
      setShowTranslation(true);
      setSubtitleLang("en");
    }
  };

  const value: SettingsState = {
    uiLang, setUiLang,
    dark, toggleDark: () => setDark((d) => !d),
    showTranslation, setShowTranslation,
    subtitleLang, setSubtitleLang,
    readingMode, setReadingMode,
    dir,
    t: STRINGS[uiLang],
    applyReadingMode,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
