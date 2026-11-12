import { useEffect, useState } from "react";
import { recommendationRepository } from "@/application/container";
import type { Recommendation, RecommendationReason } from "@/domain/learning";
import type { KnowledgeNode } from "@/domain/types";

/**
 * The next node in the path, derived by traversing the graph from `from`.
 * Returns null when no edge leads somewhere readable — the caller shows
 * that honestly instead of inventing a suggestion.
 *
 * The walk itself is `RecommendationRepository`'s (§5.A's
 * `GET /v1/paths/recommended`): with a backend the suggestion arrives from the
 * server, without one the same pure `recommendNext` runs over the fixtures. The
 * hook only knows the repository, so the swap is invisible here.
 */
export function useRecommendation(
  from: KnowledgeNode | null,
  exclude: string[],
  prefer?: RecommendationReason[]
) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const fromSlug = from?.slug ?? null;
  // Arrays aren't stable across renders; key the effect on their contents.
  const excludeKey = [...exclude].sort().join(",");
  const preferKey = (prefer ?? []).join(",");

  useEffect(() => {
    let cancelled = false;
    if (!fromSlug) {
      setRecommendation(null);
      return;
    }
    recommendationRepository
      .recommend(
        fromSlug,
        excludeKey ? excludeKey.split(",") : [],
        preferKey ? (preferKey.split(",") as RecommendationReason[]) : []
      )
      .then((dto) => {
        if (!cancelled) setRecommendation(dto?.next ?? null);
      })
      .catch(() => {
        if (!cancelled) setRecommendation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [fromSlug, excludeKey, preferKey]);

  return recommendation;
}
