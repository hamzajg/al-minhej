import { useCallback, useEffect, useRef, useState } from "react";
import { learningPathRepository } from "@/application/container";
import { useAccount } from "./useAccount";
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
 * `learningPathRepository` (Memory or HTTP, chosen in `container.ts`). `loaded`
 * stays false until the first read resolves, so the goal picker can wait
 * instead of re-asking a reader who already chose — a reader whose path is on
 * the server, not in `localStorage`, so it isn't known synchronously.
 */
export function useLearningPath() {
  const accountId = useAccount();
  const [path, setPath] = useState<LearningPath>(EMPTY_LEARNING_PATH);
  const [loaded, setLoaded] = useState(false);

  // A ref mirror so mutations read the latest path without re-creating every
  // callback (and without React's StrictMode double-invoke corrupting state).
  const pathRef = useRef<LearningPath>(EMPTY_LEARNING_PATH);
  // The first read, shared by the mount effect and any mutation that races it.
  const loadingRef = useRef<Promise<LearningPath | null> | null>(null);

  const apply = useCallback((next: LearningPath) => {
    pathRef.current = next;
    setPath(next);
  }, []);

  /** Read the account's path once. Resolves `null` if the backend is unreachable. */
  const ensureLoaded = useCallback(() => {
    if (!loadingRef.current) {
      loadingRef.current = learningPathRepository
        .get(accountId)
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
  }, [accountId, apply]);

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
      void ensureLoaded().then((stored) => {
        // Backend down: keep local state honest rather than fabricating a path
        // the server will never have.
        if (stored === null) return;
        const next = change(pathRef.current);
        if (next === pathRef.current) return;
        apply(next);
        learningPathRepository.save(accountId, next).catch(() => {
          /* best-effort — the next mutation retries with fresh state */
        });
      });
    },
    [accountId, apply, ensureLoaded]
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
