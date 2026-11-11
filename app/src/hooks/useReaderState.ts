import { useCallback, useEffect, useRef, useState } from "react";
import { readerStateRepository } from "@/application/container";
import { useAccount } from "./useAccount";
import { EMPTY_READER_STATE, type ReaderState } from "@/domain/readerState";

/**
 * The reader's own state for one node — bookmark, discovered vocabulary,
 * recite count, and the Practice-tab notes (`PROMPTS.md` Prompt 7). It mirrors
 * `useLearningPath`: the account's stored document is the source of truth,
 * reached through `readerStateRepository` (Memory or HTTP, chosen in
 * `container.ts`), and mutations are *load-then-write* so a change made before
 * the first read lands can't clobber the stored document with an empty one.
 *
 * Unlike the path this is keyed by `nodeId`, so a node with no id yet (the
 * reading experience hasn't resolved) simply no-ops: it neither reads nor
 * writes until there is a node to key on. Navigating to another node drops the
 * previous node's read, so one node's bookmark can never render on another.
 */
export function useReaderState(nodeId: string | undefined) {
  const accountId = useAccount();
  const [state, setState] = useState<ReaderState>(EMPTY_READER_STATE);

  // A ref mirror so mutations read the latest state without re-creating every
  // callback (and without React's StrictMode double-invoke corrupting state).
  const stateRef = useRef<ReaderState>(EMPTY_READER_STATE);
  // The first read for the *current* node, shared by the mount effect and any
  // mutation that races it. Reset whenever the node changes.
  const loadingRef = useRef<Promise<ReaderState | null> | null>(null);
  const loadedNodeRef = useRef<string | undefined>(undefined);

  const apply = useCallback((next: ReaderState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /** Read this node's state once. Resolves `null` if the backend is unreachable. */
  const ensureLoaded = useCallback(() => {
    if (!nodeId) return Promise.resolve<ReaderState | null>(null);
    if (loadedNodeRef.current !== nodeId) {
      // A different node: drop the previous node's read and reset to blank so
      // its state is never shown here, then read this node's.
      loadedNodeRef.current = nodeId;
      loadingRef.current = null;
      apply({ ...EMPTY_READER_STATE });
    }
    if (!loadingRef.current) {
      loadingRef.current = readerStateRepository
        .get(accountId, nodeId)
        .then((stored) => {
          apply(stored);
          return stored;
        })
        .catch(() => null);
    }
    return loadingRef.current;
  }, [accountId, nodeId, apply]);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  /**
   * Load-then-mutate: a change recorded before the initial read has landed
   * still serializes *after* it, so it can't clobber the server's document.
   * Local state updates immediately; the save is best-effort. When the backend
   * is unreachable the mutation no-ops rather than fabricating state the server
   * will never have.
   */
  const mutate = useCallback(
    (change: (current: ReaderState) => ReaderState) => {
      if (!nodeId) return;
      void ensureLoaded().then((stored) => {
        if (stored === null) return;
        const next = change(stateRef.current);
        if (next === stateRef.current) return;
        apply(next);
        readerStateRepository.save(accountId, nodeId, next).catch(() => {
          /* best-effort — the next mutation retries with fresh state */
        });
      });
    },
    [accountId, nodeId, apply, ensureLoaded]
  );

  const toggleBookmark = useCallback(
    () => mutate((s) => ({ ...s, bookmarked: !s.bookmarked })),
    [mutate]
  );
  const addDiscovered = useCallback(
    (id: string) =>
      mutate((s) => (s.discovered.includes(id) ? s : { ...s, discovered: [...s.discovered, id] })),
    [mutate]
  );
  const incrementRecite = useCallback(
    () => mutate((s) => ({ ...s, reciteCount: s.reciteCount + 1 })),
    [mutate]
  );
  const setTakeaway = useCallback(
    (value: string) => mutate((s) => (s.takeaway === value ? s : { ...s, takeaway: value })),
    [mutate]
  );
  const setActionItem = useCallback(
    (value: string) => mutate((s) => (s.actionItem === value ? s : { ...s, actionItem: value })),
    [mutate]
  );

  return {
    state,
    toggleBookmark,
    addDiscovered,
    incrementRecite,
    setTakeaway,
    setActionItem,
  };
}
