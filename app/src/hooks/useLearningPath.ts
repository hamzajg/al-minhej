import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { LEARNING_GOALS } from "@/data/goals";
import type { LearningGoal, LearningPath } from "@/domain/learning";

const PATH_KEY = "alminhej:path";

const EMPTY_PATH: LearningPath = {
  goalId: null,
  seedNodeId: null,
  visited: [],
  startedAt: null,
  onboardingSeen: false,
};

/**
 * The reader's current path, persisted locally until there are accounts
 * (that's a later prompt). It stores a goal id and the nodes actually
 * visited — never a list of nodes to visit, since those come from the
 * graph on demand.
 */
export function useLearningPath() {
  const [path, setPath] = useLocalStorage<LearningPath>(PATH_KEY, EMPTY_PATH);

  const goal: LearningGoal | null =
    LEARNING_GOALS.find((g) => g.id === path.goalId) ?? null;

  const chooseGoal = useCallback(
    (goalId: string, seedNodeId: string) => {
      setPath({
        goalId,
        seedNodeId,
        visited: [],
        startedAt: new Date().toISOString(),
        onboardingSeen: true,
      });
    },
    [setPath]
  );

  const dismissOnboarding = useCallback(() => {
    setPath((p) => (p.onboardingSeen ? p : { ...p, onboardingSeen: true }));
  }, [setPath]);

  const recordVisit = useCallback(
    (nodeId: string) => {
      setPath((p) => (p.visited.includes(nodeId) ? p : { ...p, visited: [...p.visited, nodeId] }));
    },
    [setPath]
  );

  const resetPath = useCallback(() => setPath(EMPTY_PATH), [setPath]);

  /** Where the reader is now: the last node opened, else the seed. */
  const currentNodeId = path.visited.length > 0
    ? path.visited[path.visited.length - 1]
    : path.seedNodeId;

  return { path, goal, currentNodeId, chooseGoal, dismissOnboarding, recordVisit, resetPath };
}
