import { useCallback, useEffect, useState } from "react";
import { workspaceRepository } from "@/application/container";
import type { WorkspaceKind, WorkspaceNote } from "@/domain/workspace";
import { useIdentity } from "./useIdentity";

/**
 * The account's journal for one node — §5.A's `/v1/me/notes` and
 * `/v1/me/reflections`, read together because the Practice tab shows them as
 * one list with a kind badge. Keyed by `useIdentity()` like every other
 * per-account hook.
 *
 * `available` is `false` when there is no account to write under (signed out
 * against a real backend) — the caller hides the journal rather than showing
 * an editor whose saves would silently no-op. Without a backend the anonymous
 * local id is the account, so the journal works exactly as it does signed in.
 */
export function useWorkspaceJournal(nodeId: string) {
  const accountKey = useIdentity();
  const available = accountKey !== null;
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    if (!accountKey) {
      setNotes([]);
      setLoaded(true);
      return;
    }
    let live = true;
    setLoaded(false);
    Promise.all([
      workspaceRepository.listNotes(accountKey, "note", nodeId),
      workspaceRepository.listNotes(accountKey, "reflection", nodeId),
    ])
      .then(([noteDocs, reflectionDocs]) => {
        if (!live) return;
        // Both lists arrive newest-first; the merge re-sorts so a note and a
        // reflection written in the same session interleave by timestamp.
        setNotes(
          [...noteDocs, ...reflectionDocs].sort((a, b) =>
            a.createdAt < b.createdAt ? 1 : -1
          )
        );
      })
      .catch(() => {
        if (live) setNotes([]);
      })
      .finally(() => {
        if (live) setLoaded(true);
      });
    return () => {
      live = false;
    };
  }, [accountKey, nodeId]);

  useEffect(() => load(), [load]);

  const add = useCallback(
    async (kind: WorkspaceKind, text: string) => {
      const trimmed = text.trim();
      if (!accountKey || !trimmed) return;
      const doc = await workspaceRepository.createNote(accountKey, kind, nodeId, trimmed);
      setNotes((prev) => [doc, ...prev]);
    },
    [accountKey, nodeId]
  );

  return { notes, loaded, available, add, refresh: load };
}
