import { EMPTY_READER_STATE, type ReaderState } from "@/domain/readerState";
import type { ReaderStateRepository } from "@/domain/repositories";

/**
 * The no-backend stand-in for per-node reader state, for the same reason
 * `MemoryLearningPathRepository` exists: with no server a browser has nowhere
 * else to persist. It is still *per account and per node* — both are in the
 * storage key — so pointing the app at the API moves this behind
 * `GET`/`PUT /v1/me/nodes/{id}/state` with nothing above `infrastructure/`
 * changing. As with the path, the account key is the local anonymous id when
 * there is no backend to authenticate against.
 */
const keyFor = (accountKey: string, nodeId: string) =>
  `alminhej:readerstate:${accountKey}:${nodeId}`;

export class MemoryReaderStateRepository implements ReaderStateRepository {
  async get(accountKey: string, nodeId: string): Promise<ReaderState> {
    try {
      const raw = window.localStorage.getItem(keyFor(accountKey, nodeId));
      return raw ? (JSON.parse(raw) as ReaderState) : { ...EMPTY_READER_STATE };
    } catch {
      return { ...EMPTY_READER_STATE };
    }
  }

  async save(accountKey: string, nodeId: string, state: ReaderState): Promise<ReaderState> {
    try {
      window.localStorage.setItem(keyFor(accountKey, nodeId), JSON.stringify(state));
    } catch {
      /* storage unavailable — in-memory state still works for this session */
    }
    return state;
  }
}
