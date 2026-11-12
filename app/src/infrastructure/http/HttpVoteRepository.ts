import type { VoteTally } from "@/domain/votes";
import type { VoteRepository } from "@/domain/repositories";
import { BackendError } from "./httpClient";
import { castVote, getVoteTally } from "./voteClient";

/**
 * The real vote store: §5.A's `GET`/`POST /v1/nodes/{id}/votes`, where the
 * tally is public and casting is per-account. `container.ts` selects this vs.
 * `MemoryVoteRepository` on `VITE_ALMINHEJ_API_BASE_URL`.
 *
 * `accountKey` is the caller's bearer token — required for `cast` (the server
 * answers `401` without a live session, which surfaces here as a
 * `BackendError` the hook treats as "cannot vote right now"), optional for
 * `get`, where `null` simply means `votedByMe: false`.
 *
 * A `404` on either call means the node is not a published source — the same
 * "absent, not broken" rule `apiGet` follows — so it resolves to `null` rather
 * than throwing; every other failure still surfaces.
 */
export class HttpVoteRepository implements VoteRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(nodeId: string, accountKey: string | null): Promise<VoteTally | null> {
    try {
      return await getVoteTally(this.baseUrl, accountKey, nodeId);
    } catch (cause) {
      if (cause instanceof BackendError && cause.status === 404) return null;
      throw cause;
    }
  }

  async cast(
    nodeId: string,
    accountKey: string,
    idempotencyKey: string
  ): Promise<VoteTally | null> {
    try {
      return await castVote(this.baseUrl, accountKey, nodeId, idempotencyKey);
    } catch (cause) {
      if (cause instanceof BackendError && cause.status === 404) return null;
      throw cause;
    }
  }
}
