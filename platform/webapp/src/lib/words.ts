import type { ClauseItem } from "@/domain/types";

export interface FlatWord {
  key: string;
  raw: string;
  clean: string;
  idx: number;
}

export function flattenClauseWords(clauses: ClauseItem[]): FlatWord[] {
  const list: FlatWord[] = [];
  let idx = 0;
  clauses.forEach((cl) => {
    cl.text.ar.split(" ").forEach((w) => {
      list.push({ key: `${cl.id}-${idx}`, raw: w, clean: w.replace(/[،,.:]/g, ""), idx });
      idx += 1;
    });
  });
  return list;
}
