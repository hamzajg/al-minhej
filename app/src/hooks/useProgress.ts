import { useCallback, useEffect, useState } from "react";
import { progressRepository } from "@/application/container";
import type { ProgressDTO } from "@/domain/learning";
import { useIdentity } from "./useIdentity";

/**
 * The account's aggregate journey read — §5.A's `GET /v1/me/progress` behind
 * `progressRepository` (HTTP with a backend, the localStorage sum without
 * one). Keyed by `useIdentity()` exactly like `useLearningPath`: the verified
 * session token with a backend, the local anonymous id without one, and
 * `null` — meaning "signed out against a real backend, no account to read" —
 * in which case `progress` stays `null` rather than a fabricated zero.
 *
 * `refresh` re-reads on demand; readers that mutate path or reader state
 * (a visit recorded, a bookmark toggled) call it so the counters catch up
 * without a remount.
 */
export function useProgress() {
  const accountKey = useIdentity();
  const [progress, setProgress] = useState<ProgressDTO | null>(null);

  const load = useCallback(() => {
    if (!accountKey) {
      setProgress(null);
      return;
    }
    let live = true;
    progressRepository
      .get(accountKey)
      .then((dto) => {
        if (live) setProgress(dto);
      })
      .catch(() => {
        if (live) setProgress(null);
      });
    return () => {
      live = false;
    };
  }, [accountKey]);

  useEffect(() => load(), [load]);

  return { progress, refresh: load };
}
