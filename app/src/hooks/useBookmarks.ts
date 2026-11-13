import { useCallback, useEffect, useState } from "react";
import { workspaceRepository } from "@/application/container";
import { useIdentity } from "./useIdentity";

/**
 * The account's bookmarked node ids — §5.A's `GET /v1/me/bookmarks` behind
 * `workspaceRepository`. Keyed by `useIdentity()` like every other per-account
 * hook: the verified session token with a backend, the local anonymous id
 * without one, and `null` — signed out against a real backend — in which case
 * `bookmarks` stays `null` rather than an empty list that would lie.
 */
export function useBookmarks() {
  const accountKey = useIdentity();
  const [bookmarks, setBookmarks] = useState<string[] | null>(null);

  const load = useCallback(() => {
    if (!accountKey) {
      setBookmarks(null);
      return;
    }
    let live = true;
    workspaceRepository
      .listBookmarks(accountKey)
      .then((ids) => {
        if (live) setBookmarks(ids);
      })
      .catch(() => {
        if (live) setBookmarks(null);
      });
    return () => {
      live = false;
    };
  }, [accountKey]);

  useEffect(() => load(), [load]);

  return { bookmarks, refresh: load };
}
