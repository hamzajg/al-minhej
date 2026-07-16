/** Avoids a misleading "0%" for books with real but tiny progress
 *  (e.g. 1 of 7,563 hadith digitized). */
export function formatPct(pct: number, indexedUnits: number): string {
  if (indexedUnits > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}
