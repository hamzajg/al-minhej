import type { ExploreRepository } from "@/domain/repositories";
import type { ExploreDTO } from "@/domain/dto";
import { assembleExplore } from "@/application/ExploreGraph";
import { NODES } from "./data/nodes";
import { RELATIONSHIPS } from "./data/relationships";

/**
 * `ExploreRepository` over the same fixture graph every other Memory provider
 * reads. There is no index to build and nothing to refresh — unlike search,
 * explore is a walk of the graph as it stands, so it is computed per call and
 * always describes the graph the reader is actually on. With a server this class
 * is not used at all; the identical walk lives in `server/explore.mjs`.
 */
export class MemoryExploreRepository implements ExploreRepository {
  async get(slug: string): Promise<ExploreDTO | null> {
    return assembleExplore(slug, NODES, RELATIONSHIPS);
  }
}
