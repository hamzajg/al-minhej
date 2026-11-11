import { EMPTY_LEARNING_PATH, type LearningPath } from "@/domain/learning";
import type { LearningPathRepository } from "@/domain/repositories";

/**
 * The no-backend stand-in for per-account path storage. It is still *per
 * account* — the storage key includes the account key — so the same swap
 * `container.ts` makes for the graph works here too: point the app at the API
 * and the path moves behind `GET`/`PUT /v1/me/path` with nothing above
 * `infrastructure/` changing.
 *
 * Without a backend there is no auth to verify a credential against, so the
 * account key is the local anonymous id (`hooks/useAccount.ts`) rather than a
 * session token — the honest ceiling of "per-account" when there is no server.
 *
 * It uses `localStorage` only because, with no server, a browser has nowhere
 * else to persist. That is exactly the role `MemoryKnowledgeRepository` plays
 * for the graph: a local stand-in for storage that will live remotely.
 */
const keyFor = (accountKey: string) => `alminhej:path:${accountKey}`;

export class MemoryLearningPathRepository implements LearningPathRepository {
  async get(accountKey: string): Promise<LearningPath> {
    try {
      const raw = window.localStorage.getItem(keyFor(accountKey));
      return raw ? (JSON.parse(raw) as LearningPath) : { ...EMPTY_LEARNING_PATH };
    } catch {
      return { ...EMPTY_LEARNING_PATH };
    }
  }

  async save(accountKey: string, path: LearningPath): Promise<LearningPath> {
    try {
      window.localStorage.setItem(keyFor(accountKey), JSON.stringify(path));
    } catch {
      /* storage unavailable — in-memory state still works for this session */
    }
    return path;
  }
}
