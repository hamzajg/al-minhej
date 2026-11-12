import { type ProgressDTO } from "@/domain/learning";
import type { ReaderState } from "@/domain/readerState";
import type { ProgressRepository } from "@/domain/repositories";
import { MemoryLearningPathRepository } from "./MemoryLearningPathRepository";

/**
 * The no-backend stand-in for `GET /v1/me/progress`: the same aggregate the
 * server computes, summed over the two localStorage collections the memory
 * providers already write — `alminhej:path:{account}` and every
 * `alminhej:readerstate:{account}:{node}` document. The prefix scan is the
 * local equivalent of the server's `(accountId, nodeId)` compound key.
 */
const READER_STATE_PREFIX = (accountKey: string) =>
  `alminhej:readerstate:${accountKey}:`;

export class MemoryProgressRepository implements ProgressRepository {
  private paths = new MemoryLearningPathRepository();

  async get(accountKey: string): Promise<ProgressDTO> {
    const path = await this.paths.get(accountKey);
    const states: ReaderState[] = [];

    try {
      const prefix = READER_STATE_PREFIX(accountKey);
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          states.push(JSON.parse(window.localStorage.getItem(key) ?? "null") as ReaderState);
        } catch {
          /* one corrupt document must not hide the rest of the account's state */
        }
      }
    } catch {
      /* storage unavailable — report the path alone rather than fail */
    }

    const valid = states.filter((s): s is ReaderState => s !== null);
    const discovered = new Set(valid.flatMap((s) => s.discovered ?? []));

    return {
      goalId: path.goalId,
      seedNodeId: path.seedNodeId,
      startedAt: path.startedAt,
      visitedCount: path.visited.length,
      bookmarkedCount: valid.filter((s) => s.bookmarked).length,
      discoveredCount: discovered.size,
      reciteCount: valid.reduce((sum, s) => sum + (s.reciteCount ?? 0), 0),
    };
  }
}

