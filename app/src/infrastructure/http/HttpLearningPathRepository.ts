import type { LearningPath } from "@/domain/learning";
import type { LearningPathRepository } from "@/domain/repositories";
import { getMyPath, saveMyPath } from "./meClient";

/**
 * The real per-account store: the reader's path lives on the server, keyed by
 * the account token, over `GET`/`PUT /v1/me/path`. `container.ts` selects this
 * vs. `MemoryLearningPathRepository` on `VITE_ALMINHEJ_API_BASE_URL`, the same
 * way it does for the graph repositories.
 */
export class HttpLearningPathRepository implements LearningPathRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get(accountId: string): Promise<LearningPath> {
    return getMyPath(this.baseUrl, accountId);
  }

  save(accountId: string, path: LearningPath): Promise<LearningPath> {
    return saveMyPath(this.baseUrl, accountId, path);
  }
}
