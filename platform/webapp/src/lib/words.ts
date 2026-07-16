import type { ClauseTextBlock } from "@/domain/types";

export interface FlatWord {
  key: string;
  raw: string;
  clean: string;
  idx: number;
}

/**
 * Flattens a clause block's items into one continuous, globally-indexed
 * word stream. Both the reading canvas and the "reveal all" control need
 * the exact same key scheme, so this lives in one place rather than being
 * duplicated.
 */
export function flattenClauseWords(clauses: ClauseTextBlock["items"]): FlatWord[] {
  const list: FlatWord[] = [];
  let idx = 0;
  clauses.forEach((cl) => {
    cl.ar.split(" ").forEach((w) => {
      list.push({ key: `${cl.id}-${idx}`, raw: w, clean: w.replace(/[،,.:]/g, ""), idx });
      idx += 1;
    });
  });
  return list;
}
