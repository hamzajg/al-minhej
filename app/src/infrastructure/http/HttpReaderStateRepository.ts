import type { ReaderState } from "@/domain/readerState";
import type { ReaderStateRepository } from "@/domain/repositories";
import { getMyNodeState, saveMyNodeState } from "./meClient";

/**
 * The real per-node reader-state store: bookmark, discovered vocabulary,
 * recite count and Practice-tab notes live on the server, keyed by the
 * session token and the node id, over `GET`/`PUT /v1/me/nodes/{id}/state`.
 * `container.ts` selects this vs. `MemoryReaderStateRepository` on
 * `VITE_ALMINHEJ_API_BASE_URL`, the same way it does for the path and graph
 * repositories. `accountKey` is the caller's bearer token here.
 *
 * The base URL is a plain field, not a constructor parameter property — this
 * project's `tsconfig` sets `erasableSyntaxOnly`, so parameter properties are
 * not allowed.
 */
export class HttpReaderStateRepository implements ReaderStateRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get(accountKey: string, nodeId: string): Promise<ReaderState> {
    return getMyNodeState(this.baseUrl, accountKey, nodeId);
  }

  save(accountKey: string, nodeId: string, state: ReaderState): Promise<ReaderState> {
    return saveMyNodeState(this.baseUrl, accountKey, nodeId, state);
  }
}
