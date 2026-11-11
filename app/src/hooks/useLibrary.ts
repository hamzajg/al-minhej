import { useEffect, useState } from "react";
import { readingExperienceService } from "@/application/container";
import type { KnowledgeNode } from "@/domain/types";

export interface LibraryEntry {
  node: KnowledgeNode;
  indexedUnits: number;
  pct: number;
}

/**
 * The Library tab is deliberately global, not scoped to the current
 * reading experience — a digitization index should be browsable
 * regardless of which hadith brought you there.
 */
export function useLibrary() {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const books = await readingExperienceService.library();
      const withProgress = await Promise.all(
        books.map(async (node) => {
          const { indexedUnits, pct } = await readingExperienceService.progressFor(node);
          return { node, indexedUnits, pct };
        })
      );
      if (!cancelled) {
        setEntries(withProgress.sort((a, b) => b.pct - a.pct));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading };
}
