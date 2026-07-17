import type { IsnadData, KnowledgeNode, NodeType, Relationship } from "./types";

/**
 * Storage-agnostic contracts. Application services depend on these
 * interfaces only. `infrastructure/http/*` implements them today against
 * the static JSON served from `public/api/**`; swapping in a real
 * backend later means writing a new class that satisfies the same
 * interface — nothing above this line changes.
 */
export interface KnowledgeRepository {
  findBySlug(slug: string): Promise<KnowledgeNode | null>;
  findById(id: string): Promise<KnowledgeNode | null>;
  findManyByIds(ids: string[]): Promise<KnowledgeNode[]>;
  listByType(type: NodeType): Promise<KnowledgeNode[]>;
}

export interface RelationshipRepository {
  /** Every edge touching this node, in either direction. */
  neighborsOf(nodeId: string): Promise<Relationship[]>;
  /** Every edge pointing *at* this node. */
  incomingTo(nodeId: string): Promise<Relationship[]>;
  /** Every edge originating *from* this node. */
  outgoingFrom(nodeId: string): Promise<Relationship[]>;
}

export interface IsnadRepository {
  findByHadithSlug(hadithSlug: string): Promise<IsnadData | null>;
}
