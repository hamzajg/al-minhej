import type { LearningPath } from "@/domain/learning";
import type { LearningPathRepository } from "@/domain/repositories";
import { BackendError } from "./httpClient";
import { getMyPath, saveMyPath, startMyOnboarding } from "./meClient";

/**
 * The real per-account store: the reader's path lives on the server, keyed by
 * the session token, over `GET`/`PUT /v1/me/path`. `container.ts` selects this
 * vs. `MemoryLearningPathRepository` on `VITE_ALMINHEJ_API_BASE_URL`, the same
 * way it does for the graph repositories. `accountKey` is the caller's bearer
 * token here.
 */
export class HttpLearningPathRepository implements LearningPathRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get(accountKey: string): Promise<LearningPath> {
    return getMyPath(this.baseUrl, accountKey);
  }

  /**
   * Onboarding goes through `POST /v1/onboarding/goals`, which — unlike the
   * generic `PUT` — refuses to clobber a path the reader has travelled. When
   * it does refuse, the caller's intent was still "replace my path" (the goal
   * picker is reachable after a reset), so the write falls back to `save`,
   * preserving exactly what `PUT /v1/me/path` always allowed.
   */
  async start(accountKey: string, path: LearningPath): Promise<LearningPath> {
    if (!path.goalId || !path.seedNodeId) return this.save(accountKey, path);
    try {
      return await startMyOnboarding(this.baseUrl, accountKey, path.goalId, path.seedNodeId);
    } catch (cause) {
      if (cause instanceof BackendError && cause.code === "PATH_EXISTS") {
        return this.save(accountKey, path);
      }
      throw cause;
    }
  }

  save(accountKey: string, path: LearningPath): Promise<LearningPath> {
    return saveMyPath(this.baseUrl, accountKey, path);
  }
}
