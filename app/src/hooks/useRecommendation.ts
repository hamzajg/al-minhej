import { useEffect, useState } from "react";
import { recommendationStrategy } from "@/application/container";
import type { Recommendation, RecommendationReason } from "@/domain/learning";
import type { KnowledgeNode } from "@/domain/types";

/**
 * The next node in the path, derived by traversing the graph from `from`.
 * Returns null when no edge leads somewhere readable — the caller shows
 * that honestly instead of inventing a suggestion.
 */
export function useRecommendation(
  from: KnowledgeNode | null,
  exclude: string[],
  prefer?: RecommendationReason[]
) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const fromId = from?.id ?? null;
  // Arrays aren't stable across renders; key the effect on their contents.
  const excludeKey = [...exclude].sort().join(",");
  const preferKey = (prefer ?? []).join(",");

  useEffect(() => {
    let cancelled = false;
    if (!from) {
      setRecommendation(null);
      return;
    }
    recommendationStrategy
      .recommend({
        from,
        exclude: new Set(excludeKey ? excludeKey.split(",") : []),
        prefer: preferKey ? (preferKey.split(",") as RecommendationReason[]) : undefined,
      })
      .then((next) => {
        if (!cancelled) setRecommendation(next);
      })
      .catch(() => {
        if (!cancelled) setRecommendation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [from, fromId, excludeKey, preferKey]);

  return recommendation;
}
