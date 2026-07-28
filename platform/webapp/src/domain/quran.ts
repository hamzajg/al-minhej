export type QiraatPathId = "sughra" | "kubra";
export type RiwayatMode = "single" | "compare" | "all";

export interface Riwayah {
  id: string;
  ar: string;
  en: string;
  readerId: string;
  readerAr?: string;
  readerEn?: string;
  collection?: string;
  countsBasmala?: boolean | "pending";
  variant?: "verified" | "pending";
  variantAr?: string;
  variantEn?: string;
  note?: string;
  noteEn?: string;
}

export interface AyahSegment {
  key: string;
  marker: string | null;
  ar: string;
  arVariant?: string;
  en: string;
  isBasmala?: boolean;
  variant?: boolean;
}

export interface VocabWord {
  id: string;
  word: string;
  root: string;
  pron: string;
  occ: number;
  en: string;
  ar: string;
}
