import type { KnowledgeNode, NodeType, Relationship } from "./types";

/**
 * Storage-agnostic contracts. Application services depend on these
 * interfaces only. `infrastructure/memory/*` implements them today;
 * swapping in a real HTTP-backed or Mongo-backed implementation later
 * means writing a new class that satisfies the same interface — nothing
 * above this line changes.
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
  /** Every edge pointing *at* this node — used to derive digitization
   *  progress and to find "what explains/narrates this". */
  incomingTo(nodeId: string): Promise<Relationship[]>;
  /** Every edge originating *from* this node. */
  outgoingFrom(nodeId: string): Promise<Relationship[]>;
}
