import type { SearchRepository } from "@/domain/repositories";
import type { SearchResultDTO } from "@/domain/dto";
import { buildSearchIndex, searchGraph, type SearchIndexEntry } from "@/application/SearchGraph";
import { NODES } from "./data/nodes";

/**
 * Search over the same fixture graph the other Memory providers read. The
 * index is built once at module load — §6 says it is *refreshed on publish*,
 * and without a server nothing ever publishes, so one build is the whole
 * lifecycle here. With a server this class is not used at all; the index lives
 * in `search_index` and is refreshed by the write path that changes the graph.
 */
const INDEX: SearchIndexEntry[] = buildSearchIndex(NODES);

export class MemorySearchRepository implements SearchRepository {
  async search(query: string): Promise<SearchResultDTO[]> {
    return searchGraph(query, INDEX, NODES);
  }
}
