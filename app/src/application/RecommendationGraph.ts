import type { RecommendationDTO } from "@/domain/dto";
import type { Recommendation, RecommendationReason } from "@/domain/learning";
import type { KnowledgeNode, Relationship, RelationshipType } from "@/domain/types";

/**
 * §5.A's `GET /v1/paths/recommended`, as a pure function over the raw graph.
 *
 * `server/recommendations.mjs` is this same module as plain JS, and the two are
 * held together by a parity check over the fixture graph — the same twin-module
 * rule `SearchGraph.ts`, `ExploreGraph.ts` and `AssembleReadingExperience`
 * already follow. The dependency-free server cannot import a TypeScript module
 * from the browser bundle, so the walk is written twice on purpose and asserted
 * equal rather than shared.
 *
 * This is the rule-based `RecommendationStrategy` the architecture doc's §4
 * names, lifted out of the repository-backed class it used to live in and made
 * a function of `(nodes, relationships)` instead. That is what lets the exact
 * same walk answer from the browser's fixture graph and from the server's store:
 * the strategy read the graph through three repositories; here the graph is the
 * argument. A future embedding/ML strategy replaces this module, not a call
 * site — `RecommendationRepository` is the seam.
 *
 * The whole point is that a suggestion is never invented: every candidate is a
 * node some real edge points to, and the `via` edge travels with it so the UI can
 * say *which* connection produced it. When no rule finds a readable node the
 * honest answer is `next: null`, not a plausible-looking guess.
 */

/** Most pedagogical first: keep a collection together, then explicit
 *  cross-references, then similarity, then the weakest signal. */
const DEFAULT_ORDER: RecommendationReason[] = [
  "same_collection",
  "cross_reference",
  "similar_to",
  "shared_narrator",
];

/** A node is a valid destination only if it can actually be read. */
function isReadable(node: KnowledgeNode): boolean {
  return node.status === "published" && node.content.length > 0;
}

/** Every edge pointing *at* `nodeId` — the repository read `incomingTo` did. */
function incoming(edges: Relationship[], nodeId: string): Relationship[] {
  return edges.filter((r) => r.to === nodeId);
}

/** Every edge originating *from* `nodeId` — the repository read `outgoingFrom` did. */
function outgoing(edges: Relationship[], nodeId: string): Relationship[] {
  return edges.filter((r) => r.from === nodeId);
}

interface Candidate {
  edge: Relationship;
  nodeId: string;
  anchorId: string | null;
}

/** Input for one recommendation: where the reader is, what they've seen, and
 *  which rule order to walk. */
export interface RecommendationQuery {
  /** The node the reader is moving on from, by slug. */
  fromSlug: string;
  /** Node ids already on the path — never re-suggested. */
  exclude: string[];
  /** Rule ordering; a goal supplies its own, otherwise the default is used. */
  prefer: RecommendationReason[];
}

/**
 * The assembled `RecommendationDTO` for one starting slug, or `null` when no
 * *published* node carries it (the route turns that into a `404`).
 *
 * `next` inside the DTO may itself be `null`: the `from` is a real node, but no
 * edge out of it leads somewhere readable. The two nulls are different answers
 * and the caller is expected to tell them apart.
 */
export function recommendNext(
  query: RecommendationQuery,
  nodes: KnowledgeNode[],
  relationships: Relationship[]
): RecommendationDTO | null {
  const published = nodes.filter((n) => n.status === "published");
  const from = published.find((n) => n.slug === query.fromSlug);
  if (!from) return null;

  const skip = new Set(query.exclude);
  skip.add(from.id);
  const order = query.prefer.length > 0 ? query.prefer : DEFAULT_ORDER;

  for (const reason of order) {
    const next = applyRule(reason, from, skip, published, relationships);
    if (next) return { from, next };
  }
  // No edge from here leads to something readable — say so honestly
  // rather than invent a suggestion the graph does not support.
  return { from, next: null };
}

function applyRule(
  reason: RecommendationReason,
  from: KnowledgeNode,
  skip: ReadonlySet<string>,
  published: KnowledgeNode[],
  relationships: Relationship[]
): Recommendation | null {
  switch (reason) {
    case "same_collection":
      return sameCollection(from, skip, published, relationships);
    case "cross_reference":
      return byEdgeType(from, skip, published, relationships, "cross_reference", ["REFERENCES"]);
    case "similar_to":
      return byEdgeType(from, skip, published, relationships, "similar_to", ["SIMILAR_TO"]);
    case "shared_narrator":
      return sharedNarrator(from, skip, published, relationships);
  }
}

/** Another node collected in the same book — e.g. the next hadith of
 *  Al-Arba'in, or a sibling hadith in Sahih Muslim. */
function sameCollection(
  from: KnowledgeNode,
  skip: ReadonlySet<string>,
  published: KnowledgeNode[],
  relationships: Relationship[]
): Recommendation | null {
  const partOf = outgoing(relationships, from.id).filter((r) => r.type === "PART_OF");
  const candidates: Candidate[] = [];
  for (const edge of partOf) {
    for (const r of incoming(relationships, edge.to)) {
      if (r.type === "PART_OF" && !skip.has(r.from)) {
        candidates.push({ edge: r, nodeId: r.from, anchorId: edge.to });
      }
    }
  }
  return pick(candidates, skip, "same_collection", from, published);
}

/** A direct REFERENCES or SIMILAR_TO edge, in either direction. */
function byEdgeType(
  from: KnowledgeNode,
  skip: ReadonlySet<string>,
  published: KnowledgeNode[],
  relationships: Relationship[],
  reason: RecommendationReason,
  types: RelationshipType[]
): Recommendation | null {
  const out = outgoing(relationships, from.id).filter((r) => types.includes(r.type));
  const inc = incoming(relationships, from.id).filter((r) => types.includes(r.type));
  const candidates: Candidate[] = [
    ...out.map((edge) => ({ edge, nodeId: edge.to, anchorId: null })),
    ...inc.map((edge) => ({ edge, nodeId: edge.from, anchorId: null })),
  ];
  return pick(candidates, skip, reason, from, published);
}

/** Another hadith that passes through a narrator this one also does. */
function sharedNarrator(
  from: KnowledgeNode,
  skip: ReadonlySet<string>,
  published: KnowledgeNode[],
  relationships: Relationship[]
): Recommendation | null {
  const mine = outgoing(relationships, from.id).filter((r) => r.type === "NARRATED_BY");
  const candidates: Candidate[] = [];
  for (const edge of mine) {
    for (const r of incoming(relationships, edge.to)) {
      if (r.type === "NARRATED_BY" && r.from !== from.id && !skip.has(r.from)) {
        candidates.push({ edge: r, nodeId: r.from, anchorId: edge.to });
      }
    }
  }
  return pick(candidates, skip, "shared_narrator", from, published);
}

/** Resolve candidates to readable nodes and take the first. Ties break
 *  on node id so the same graph always yields the same suggestion. */
function pick(
  candidates: Candidate[],
  skip: ReadonlySet<string>,
  reason: RecommendationReason,
  from: KnowledgeNode,
  published: KnowledgeNode[]
): Recommendation | null {
  const viable = candidates.filter((c) => !skip.has(c.nodeId) && c.nodeId !== from.id);
  if (viable.length === 0) return null;

  const readable = viable
    .map((c) => ({ candidate: c, node: published.find((n) => n.id === c.nodeId) }))
    .filter((x): x is { candidate: Candidate; node: KnowledgeNode } =>
      x.node !== undefined && isReadable(x.node)
    )
    .sort((a, b) => (a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0));
  if (readable.length === 0) return null;

  const { candidate, node } = readable[0];
  const anchor = candidate.anchorId
    ? published.find((n) => n.id === candidate.anchorId) ?? null
    : null;
  return { node, reason, via: candidate.edge, anchor };
}
