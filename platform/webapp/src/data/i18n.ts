import type { UiLang } from "@/types";
import type { UiStrings } from "./i18n/types";

import arData from "./i18n/ar.json";
import enData from "./i18n/en.json";

export type { UiStrings };
export type { UiLang };

export const STRINGS: Record<UiLang, UiStrings> = {
  ar: arData.strings as UiStrings,
  en: enData.strings as UiStrings,
};

export const SUBTITLE_LANGS: Record<string, string> = enData.subtitleLangs as Record<string, string>;

export const COMPANION_PROMPTS: Record<string, string[]> = {
  ar: arData.companionPrompts,
  en: enData.companionPrompts,
};

export const COMPANION_ANSWERS: Record<string, Record<number, string>> = {
  ar: arData.companionAnswers as Record<number, string>,
  en: enData.companionAnswers as Record<number, string>,
};
