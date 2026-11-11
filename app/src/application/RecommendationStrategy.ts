import type { KnowledgeRepository, RelationshipRepository } from "@/domain/repositories";
import type { KnowledgeNode, Relationship, RelationshipType } from "@/domain/types";
import type { Recommendation, RecommendationReason } from "@/domain/learning";

export interface RecommendationInput {
  /** The node the reader just finished. */
  from: KnowledgeNode;
  /** Ids already on the current path — never re-suggested. */
  exclude?: ReadonlySet<string>;
  /** Rule ordering; a goal supplies its own, otherwise the default is used. */
  prefer?: RecommendationReason[];
}

/**
 * Strategy in the architecture doc's sense: rule-based today, an
 * embedding/ML strategy later — same contract, swapped in
 * `container.ts` without anything above this file changing.
 */
export interface RecommendationStrategy {
  recommend(input: RecommendationInput): Promise<Recommendation | null>;
}

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

interface Candidate {
  edge: Relationship;
  nodeId: string;
  anchorId: string | null;
}

export class GraphTraversalRecommendationStrategy implements RecommendationStrategy {
  private nodes: KnowledgeRepository;
  private relationships: RelationshipRepository;

  constructor(nodes: KnowledgeRepository, relationships: RelationshipRepository) {
    this.nodes = nodes;
    this.relationships = relationships;
  }

  async recommend({ from, exclude, prefer }: RecommendationInput): Promise<Recommendation | null> {
    const skip = new Set(exclude ?? []);
    skip.add(from.id);
    const order = prefer && prefer.length > 0 ? prefer : DEFAULT_ORDER;

    for (const reason of order) {
      const candidate = await this.applyRule(reason, from, skip);
      if (candidate) return candidate;
    }
    // No edge from here leads to something readable — say so honestly
    // rather than invent a suggestion the graph does not support.
    return null;
  }

  private async applyRule(
    reason: RecommendationReason,
    from: KnowledgeNode,
    skip: ReadonlySet<string>
  ): Promise<Recommendation | null> {
    switch (reason) {
      case "same_collection":
        return this.sameCollection(from, skip);
      case "cross_reference":
        return this.byEdgeType(from, skip, "cross_reference", ["REFERENCES"]);
      case "similar_to":
        return this.byEdgeType(from, skip, "similar_to", ["SIMILAR_TO"]);
      case "shared_narrator":
        return this.sharedNarrator(from, skip);
    }
  }

  /** Another node collected in the same book — e.g. the next hadith of
   *  Al-Arba'in, or a sibling hadith in Sahih Muslim. */
  private async sameCollection(
    from: KnowledgeNode,
    skip: ReadonlySet<string>
  ): Promise<Recommendation | null> {
    const partOf = (await this.relationships.outgoingFrom(from.id)).filter(
      (r) => r.type === "PART_OF"
    );
    const candidates: Candidate[] = [];
    for (const edge of partOf) {
      const siblings = await this.relationships.incomingTo(edge.to);
      for (const r of siblings) {
        if (r.type === "PART_OF" && !skip.has(r.from)) {
          candidates.push({ edge: r, nodeId: r.from, anchorId: edge.to });
        }
      }
    }
    return this.pick(candidates, skip, "same_collection", from);
  }

  /** A direct REFERENCES or SIMILAR_TO edge, in either direction. */
  private async byEdgeType(
    from: KnowledgeNode,
    skip: ReadonlySet<string>,
    reason: RecommendationReason,
    types: RelationshipType[]
  ): Promise<Recommendation | null> {
    const [outgoing, incoming] = await Promise.all([
      this.relationships.outgoingFrom(from.id),
      this.relationships.incomingTo(from.id),
    ]);
    const candidates: Candidate[] = [
      ...outgoing.filter((r) => types.includes(r.type)).map((edge) => ({
        edge,
        nodeId: edge.to,
        anchorId: null,
      })),
      ...incoming.filter((r) => types.includes(r.type)).map((edge) => ({
        edge,
        nodeId: edge.from,
        anchorId: null,
      })),
    ];
    return this.pick(candidates, skip, reason, from);
  }

  /** Another hadith that passes through a narrator this one also does. */
  private async sharedNarrator(
    from: KnowledgeNode,
    skip: ReadonlySet<string>
  ): Promise<Recommendation | null> {
    const mine = (await this.relationships.outgoingFrom(from.id)).filter(
      (r) => r.type === "NARRATED_BY"
    );
    const candidates: Candidate[] = [];
    for (const edge of mine) {
      const others = await this.relationships.incomingTo(edge.to);
      for (const r of others) {
        if (r.type === "NARRATED_BY" && r.from !== from.id && !skip.has(r.from)) {
          candidates.push({ edge: r, nodeId: r.from, anchorId: edge.to });
        }
      }
    }
    return this.pick(candidates, skip, "shared_narrator", from);
  }

  /** Resolve candidates to readable nodes and take the first. Ties break
   *  on node id so the same graph always yields the same suggestion. */
  private async pick(
    candidates: Candidate[],
    skip: ReadonlySet<string>,
    reason: RecommendationReason,
    from: KnowledgeNode
  ): Promise<Recommendation | null> {
    const viable = candidates.filter((c) => !skip.has(c.nodeId) && c.nodeId !== from.id);
    if (viable.length === 0) return null;

    const nodes = await this.nodes.findManyByIds([...new Set(viable.map((c) => c.nodeId))]);
    const readable = viable
      .map((c) => ({ candidate: c, node: nodes.find((n) => n.id === c.nodeId) }))
      .filter((x): x is { candidate: Candidate; node: KnowledgeNode } =>
        x.node !== undefined && isReadable(x.node)
      )
      .sort((a, b) => a.node.id.localeCompare(b.node.id));
    if (readable.length === 0) return null;

    const { candidate, node } = readable[0];
    const anchor = candidate.anchorId ? await this.nodes.findById(candidate.anchorId) : null;
    return { node, reason, via: candidate.edge, anchor };
  }
}
