import type { VoteTally } from "@/domain/votes";
import type { VoteRepository } from "@/domain/repositories";

/**
 * The no-backend stand-in for vote tallies, for the same reason
 * `MemoryReaderStateRepository` exists: with no server a browser has nowhere
 * else to persist. The tally is still *per node and per account* — the store
 * keeps the list of account keys that voted, so `count` is distinct accounts
 * and `votedByMe` is honest — and pointing the app at the API moves this
 * behind `GET`/`POST /v1/nodes/{id}/votes` with nothing above
 * `infrastructure/` changing.
 *
 * One JSON document holds every node's voter list:
 * `alminhej:votes` → `{ [nodeId]: accountKey[] }`. A single key keeps the
 * tally and the "did I vote" bit from ever disagreeing, which is the whole
 * reason `VoteTally` travels as one object.
 */
const STORE_KEY = "alminhej:votes";

type VoteStore = Record<string, string[]>;

function readStore(): VoteStore {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as VoteStore) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: VoteStore): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — the tally still works for this session */
  }
}

function tallyFor(store: VoteStore, nodeId: string, accountKey: string | null): VoteTally {
  const voters = store[nodeId] ?? [];
  return {
    nodeId,
    count: voters.length,
    votedByMe: Boolean(accountKey && voters.includes(accountKey)),
  };
}

export class MemoryVoteRepository implements VoteRepository {
  async get(nodeId: string, accountKey: string | null): Promise<VoteTally | null> {
    return tallyFor(readStore(), nodeId, accountKey);
  }

  async cast(
    nodeId: string,
    accountKey: string,
    _idempotencyKey: string
  ): Promise<VoteTally | null> {
    const store = readStore();
    const voters = store[nodeId] ?? [];
    // §6.3's compound key, in miniature: one account, one vote, no recount.
    if (!voters.includes(accountKey)) {
      store[nodeId] = [...voters, accountKey];
      writeStore(store);
    }
    return tallyFor(store, nodeId, accountKey);
  }
}
