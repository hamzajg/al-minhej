import type { RecommendationRepository } from "@/domain/repositories";
import type { RecommendationDTO } from "@/domain/dto";
import type { RecommendationReason } from "@/domain/learning";
import { recommendNext } from "@/application/RecommendationGraph";
import { NODES } from "./data/nodes";
import { RELATIONSHIPS } from "./data/relationships";

/**
 * `RecommendationRepository` over the same fixture graph every other Memory
 * provider reads. There is no state to keep and nothing to refresh — a
 * recommendation is a walk of the graph as it stands, computed per call, so it
 * always describes the edges the reader is actually on. With a server this class
 * is not used at all; the identical walk lives in `server/recommendations.mjs`.
 */
export class MemoryRecommendationRepository implements RecommendationRepository {
  async recommend(
    fromSlug: string,
    exclude: string[],
    prefer: RecommendationReason[]
  ): Promise<RecommendationDTO | null> {
    return recommendNext({ fromSlug, exclude, prefer }, NODES, RELATIONSHIPS);
  }
}
