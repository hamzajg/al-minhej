import type { Difficulty } from "@/types";

export const DIFFICULTY_LEVELS: Record<Difficulty, number> = {
  easy: 0.2,
  medium: 0.4,
  hard: 0.65,
};

/**
 * Deterministic pseudo-random occlusion — the same words stay hidden for a
 * given difficulty level until the reader changes it, rather than
 * re-shuffling on every render (which would make repetition practice
 * useless).
 */
export function isOccluded(index: number, difficulty: number): boolean {
  const hash = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
  return hash < difficulty;
}
