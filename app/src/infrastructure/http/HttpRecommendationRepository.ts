import type { RecommendationRepository } from "@/domain/repositories";
import type { RecommendationDTO } from "@/domain/dto";
import type { RecommendationReason } from "@/domain/learning";
import { apiGet } from "./httpClient";

/**
 * `RecommendationRepository` over §5.A's `GET /v1/paths/recommended` — the next
 * node fetched from the server, given where the reader is and what they have
 * already read.
 *
 * A `404` (no published node with that slug) resolves to `null` via `apiGet`,
 * exactly as `HttpExploreRepository` does, so "nothing to suggest from here"
 * (a `200` whose `next` is `null`) stays distinct from "no such starting node".
 */
export class HttpRecommendationRepository implements RecommendationRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async recommend(
    fromSlug: string,
    exclude: string[],
    prefer: RecommendationReason[]
  ): Promise<RecommendationDTO | null> {
    const params = new URLSearchParams({ from: fromSlug });
    if (exclude.length > 0) params.set("exclude", exclude.join(","));
    if (prefer.length > 0) params.set("prefer", prefer.join(","));
    return apiGet<RecommendationDTO>(this.baseUrl, `/v1/paths/recommended?${params.toString()}`);
  }
}
