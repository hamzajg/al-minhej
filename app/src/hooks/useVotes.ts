import { useCallback, useEffect, useRef, useState } from "react";
import { voteRepository } from "@/application/container";
import { useIdentity } from "./useIdentity";
import { emptyTally, type VoteTally } from "@/domain/votes";

function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `vote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The prioritization tally for one source node — §5.A's
 * `GET`/`POST /v1/nodes/{id}/votes`, replacing the component-state fake the
 * source-detail modal used to keep.
 *
 * The tally is *public*: it loads for any node id, signed in or not, through
 * `voteRepository` (Memory or HTTP, chosen in `container.ts`). `votedByMe` is
 * the only part that needs an account — `useIdentity()` supplies the session
 * token on a real backend and the anonymous local id without one, and is
 * `null` for a signed-out reader on a backend, in which case `canVote` is
 * false and `cast` no-ops rather than pretending a vote landed.
 *
 * `cast` sends an `Idempotency-Key` generated once per (account, node) and
 * held in a ref, so a retried POST replays the first response server-side
 * instead of double-counting — §5.A's flaky-connection contract.
 */
export function useVotes(nodeId: string | undefined) {
  const accountKey = useIdentity();
  const [tally, setTally] = useState<VoteTally>(() => emptyTally(nodeId ?? ""));
  const [pending, setPending] = useState(false);

  // The first read for the *current* (node, account), shared by the mount
  // effect and any cast that races it. Reset whenever either key changes.
  const loadingRef = useRef<Promise<void> | null>(null);
  const loadedNodeRef = useRef<string | undefined>(undefined);
  const loadedKeyRef = useRef<string | null>(null);
  // One idempotency key per (account, node): reused across retries of the
  // same vote intent, regenerated when either side of the pair changes.
  const idemRef = useRef<{ nodeId: string; accountKey: string; key: string } | null>(null);

  const ensureLoaded = useCallback(() => {
    if (!nodeId) return Promise.resolve();
    if (loadedNodeRef.current !== nodeId || loadedKeyRef.current !== accountKey) {
      loadedNodeRef.current = nodeId;
      loadedKeyRef.current = accountKey;
      loadingRef.current = null;
      setTally(emptyTally(nodeId));
    }
    if (!loadingRef.current) {
      loadingRef.current = voteRepository
        .get(nodeId, accountKey)
        .then((stored) => {
          if (stored) setTally(stored);
        })
        .catch(() => {
          /* best-effort — a dead backend leaves the empty tally on screen */
        });
    }
    return loadingRef.current;
  }, [accountKey, nodeId]);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const cast = useCallback(() => {
    if (!nodeId || !accountKey || tally.votedByMe || pending) return;
    if (!idemRef.current || idemRef.current.nodeId !== nodeId || idemRef.current.accountKey !== accountKey) {
      idemRef.current = { nodeId, accountKey, key: newIdempotencyKey() };
    }
    const { key } = idemRef.current;
    setPending(true);
    voteRepository
      .cast(nodeId, accountKey, key)
      .then((stored) => {
        if (stored) setTally(stored);
      })
      .catch(() => {
        /* best-effort — the button stays un-voted so the reader can retry */
      })
      .finally(() => setPending(false));
  }, [accountKey, nodeId, pending, tally.votedByMe]);

  return { tally, cast, canVote: accountKey !== null, pending };
}
