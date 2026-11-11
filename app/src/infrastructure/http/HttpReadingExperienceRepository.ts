import type { ReadingExperienceRepository } from "@/domain/repositories";
import type { ReadingExperienceDTO } from "@/domain/dto";
import { apiGet } from "./httpClient";

/**
 * `ReadingExperienceRepository` over §5.A's `GET /v1/reading/{slug}` — the
 * assembled DTO fetched in one round trip instead of being reassembled in the
 * browser from the raw `nodes`/`relationships` endpoints.
 *
 * A `404` (no published node with that slug) still resolves to `null` via
 * `apiGet`, so the reading screen keeps telling "not found" apart from "the
 * backend is down" exactly as it did when the assembly ran locally.
 */
export class HttpReadingExperienceRepository implements ReadingExperienceRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(slug: string): Promise<ReadingExperienceDTO | null> {
    return apiGet<ReadingExperienceDTO>(this.baseUrl, `/v1/reading/${encodeURIComponent(slug)}`);
  }
}
