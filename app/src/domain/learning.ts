import type { KnowledgeNode, Localized, Relationship } from "./types";

/**
 * A learning path is a *projection over the knowledge graph*, never a
 * parallel structure that can drift out of sync with it. Nothing here
 * stores a hand-ordered list of nodes: a goal picks a seed node and a
 * rule ordering, and every subsequent step is a traversal of real edges
 * (see `application/RecommendationGraph.ts`, served by §5.A's
 * `GET /v1/paths/recommended`).
 */

/**
 * Why a node was suggested. Each reason maps to exactly one relationship
 * type — so the UI can always say *which* edge produced the suggestion,
 * and there is no "because you might like it" that isn't backed by the
 * graph.
 */
export type RecommendationReason =
  | "same_collection" // a sibling under the same PART_OF book
  | "cross_reference" // a direct REFERENCES edge
  | "similar_to" // an explicit SIMILAR_TO edge
  | "shared_narrator"; // both hadith pass through the same NARRATED_BY narrator

export interface Recommendation {
  /** The node to read next. */
  node: KnowledgeNode;
  reason: RecommendationReason;
  /** The one graph edge that justifies this suggestion. */
  via: Relationship;
  /** The shared book/narrator the reason is anchored on, when there is one. */
  anchor: KnowledgeNode | null;
}

export interface LearningGoal {
  id: string;
  title: Localized<string>;
  description: Localized<string>;
  /** Where the path begins — a real node, resolved by slug. */
  seedSlug: string;
  /** Rule ordering this goal walks the graph with. */
  prefer: RecommendationReason[];
}

export interface LearningPath {
  goalId: string | null;
  /** The node the path started from; used until the first visit. */
  seedNodeId: string | null;
  /** Reading nodes actually opened, in order. */
  visited: string[];
  startedAt: string | null;
  /** Whether the user has seen (chosen or skipped) the goal picker. */
  onboardingSeen: boolean;
}

/**
 * What a reader's path is before they've done anything. Defined once here so
 * the memory provider, the hook, and the server's `/v1/me/path` default all
 * agree on what "no path yet" means.
 */
export const EMPTY_LEARNING_PATH: LearningPath = {
  goalId: null,
  seedNodeId: null,
  visited: [],
  startedAt: null,
  onboardingSeen: false,
};

/**
 * §5.A's `GET /v1/me/progress` — the aggregate read over the path and every
 * per-node reader state the account owns. It is deliberately counters, not
 * lists: the path's `visited` array and the reader states' contents stay
 * behind their own endpoints, and this DTO exists so a dashboard can answer
 * "how far along am I" in one call without pulling either.
 */
export interface ProgressDTO {
  goalId: string | null;
  seedNodeId: string | null;
  startedAt: string | null;
  /** Distinct nodes opened on the path. */
  visitedCount: number;
  /** Nodes the reader flagged. */
  bookmarkedCount: number;
  /** Distinct vocabulary entries discovered across all reader states. */
  discoveredCount: number;
  /** Total recitations across all reader states. */
  reciteCount: number;
}

/**
 * What progress is before the account has done anything — the same "no path
 * yet" story as `EMPTY_LEARNING_PATH`, one level up.
 */
export const EMPTY_PROGRESS: ProgressDTO = {
  goalId: null,
  seedNodeId: null,
  startedAt: null,
  visitedCount: 0,
  bookmarkedCount: 0,
  discoveredCount: 0,
  reciteCount: 0,
};

/**
 * The edge type each reason is derived from. Kept as data so a
 * recommendation's `reason` and its `via.type` can be checked against
 * each other, rather than trusted by convention.
 */
export const REASON_SOURCE_EDGE = {
  same_collection: "PART_OF",
  cross_reference: "REFERENCES",
  similar_to: "SIMILAR_TO",
  shared_narrator: "NARRATED_BY",
} as const;
