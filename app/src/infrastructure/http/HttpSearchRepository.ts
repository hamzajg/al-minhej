import type { SearchRepository } from "@/domain/repositories";
import type { SearchResultDTO } from "@/domain/dto";
import { apiGet, BackendError } from "./httpClient";

/**
 * `SearchRepository` over §5.A's `GET /v1/search?q=`.
 *
 * A `404` here means the route is missing, not that nothing matched — an
 * empty result is a `200` with `[]`. So this is the one `apiGet` caller that
 * must *not* fold the two together: returning `[]` for a 404 would render
 * "your backend predates search" as "no results", which is precisely the
 * conflation `httpClient.ts` exists to prevent.
 */
export class HttpSearchRepository implements SearchRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async search(query: string): Promise<SearchResultDTO[]> {
    const results = await apiGet<SearchResultDTO[]>(
      this.baseUrl,
      `/v1/search?q=${encodeURIComponent(query)}`
    );
    if (results === null) {
      throw new BackendError("NOT_FOUND", "The AlMinhej API has no /v1/search route");
    }
    return results;
  }
}
