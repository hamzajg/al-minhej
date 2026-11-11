import { useCallback, useEffect, useRef, useState } from "react";
import { learningPathRepository } from "@/application/container";
import { useIdentity } from "./useIdentity";
import { LEARNING_GOALS } from "@/data/goals";
import {
  EMPTY_LEARNING_PATH,
  type LearningGoal,
  type LearningPath,
} from "@/domain/learning";

/**
 * The reader's current path, stored per account (`PROMPTS.md` Prompt 6). It
 * still records only a goal id and the nodes actually visited — never a list
 * of nodes to visit, since those come from the graph on demand.
 *
 * The account's stored path is the source of truth, reached through
 * `learningPathRepository` (Memory or HTTP, chosen in `container.ts`), keyed by
 * `useIdentity()` — the verified session token with a backend, the local
 * anonymous id without one, and `null` when signed out against a backend (in
 * which case there is no account to read, so the hook holds the empty path).
 * `loaded` stays false until the first read resolves, so the goal picker can
 * wait instead of re-asking a reader who already chose — a reader whose path is
 * on the server, not in `localStorage`, so it isn't known synchronously.
 */
export function useLearningPath() {
  const accountKey = useIdentity();
  const [path, setPath] = useState<LearningPath>(EMPTY_LEARNING_PATH);
  const [loaded, setLoaded] = useState(false);

  // A ref mirror so mutations read the latest path without re-creating every
  // callback (and without React's StrictMode double-invoke corrupting state).
  const pathRef = useRef<LearningPath>(EMPTY_LEARNING_PATH);
  // The first read, shared by the mount effect and any mutation that races it.
  const loadingRef = useRef<Promise<LearningPath | null> | null>(null);
  // Which account the current path belongs to, so signing in as someone else
  // (or out) drops the previous reader's path instead of showing it.
  const loadedKeyRef = useRef<string | null>(null);

  const apply = useCallback((next: LearningPath) => {
    pathRef.current = next;
    setPath(next);
  }, []);

  /** Read the account's path once. Resolves `null` if there is no account. */
  const ensureLoaded = useCallback(() => {
    if (loadedKeyRef.current !== accountKey) {
      // A different account (or none): drop the read we had and reset to blank
      // so one reader's path is never rendered for another.
      loadedKeyRef.current = accountKey;
      loadingRef.current = null;
      apply({ ...EMPTY_LEARNING_PATH });
    }
    if (!accountKey) {
      // Signed out against a real backend: there is no account to read, so the
      // honest answer is the empty path, and the picker needn't wait.
      setLoaded(true);
      return Promise.resolve<LearningPath | null>(null);
    }
    if (!loadingRef.current) {
      loadingRef.current = learningPathRepository
        .get(accountKey)
        .then((stored) => {
          apply(stored);
          setLoaded(true);
          return stored;
        })
        .catch(() => {
          setLoaded(true);
          return null;
        });
    }
    return loadingRef.current;
  }, [accountKey, apply]);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  /**
   * Load-then-mutate. A visit recorded before the initial read has landed
   * still serializes *after* it, so it can't clobber the server's value with
   * an empty path. Local state updates immediately; the save is best-effort.
   */
  const mutate = useCallback(
    (change: (current: LearningPath) => LearningPath) => {
      if (!accountKey) return;
      void ensureLoaded().then((stored) => {
        // Backend down: keep local state honest rather than fabricating a path
        // the server will never have.
        if (stored === null) return;
        const next = change(pathRef.current);
        if (next === pathRef.current) return;
        apply(next);
        learningPathRepository.save(accountKey, next).catch(() => {
          /* best-effort — the next mutation retries with fresh state */
        });
      });
    },
    [accountKey, apply, ensureLoaded]
  );

  const goal: LearningGoal | null =
    LEARNING_GOALS.find((g) => g.id === path.goalId) ?? null;

  const chooseGoal = useCallback(
    (goalId: string, seedNodeId: string) => {
      mutate(() => ({
        goalId,
        seedNodeId,
        visited: [],
        startedAt: new Date().toISOString(),
        onboardingSeen: true,
      }));
    },
    [mutate]
  );

  const dismissOnboarding = useCallback(() => {
    mutate((p) => (p.onboardingSeen ? p : { ...p, onboardingSeen: true }));
  }, [mutate]);

  const recordVisit = useCallback(
    (nodeId: string) => {
      mutate((p) => (p.visited.includes(nodeId) ? p : { ...p, visited: [...p.visited, nodeId] }));
    },
    [mutate]
  );

  const resetPath = useCallback(() => mutate(() => EMPTY_LEARNING_PATH), [mutate]);

  /** Where the reader is now: the last node opened, else the seed. */
  const currentNodeId = path.visited.length > 0
    ? path.visited[path.visited.length - 1]
    : path.seedNodeId;

  return {
    path,
    goal,
    loaded,
    currentNodeId,
    chooseGoal,
    dismissOnboarding,
    recordVisit,
    resetPath,
  };
}
