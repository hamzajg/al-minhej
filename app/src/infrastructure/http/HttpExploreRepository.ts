import type { ExploreRepository } from "@/domain/repositories";
import type { ExploreDTO } from "@/domain/dto";
import { apiGet } from "./httpClient";

/**
 * `ExploreRepository` over §5.A's `GET /v1/explore/{slug}` — the assembled
 * neighborhood fetched in one round trip.
 *
 * A `404` (no published node with that slug) resolves to `null` via `apiGet`,
 * exactly as `HttpReadingExperienceRepository` does, so the Explore screen keeps
 * "no such node" apart from "the backend is down".
 */
export class HttpExploreRepository implements ExploreRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(slug: string): Promise<ExploreDTO | null> {
    return apiGet<ExploreDTO>(this.baseUrl, `/v1/explore/${encodeURIComponent(slug)}`);
  }
}
