import type { KnowledgeFragment, NodeType, Relationship } from "./types";

/**
 * Storage-agnostic contracts. Application services depend on these
 * interfaces only. `infrastructure/memory/*` implements them today;
 * swapping in a real HTTP-backed or Mongo-backed implementation later
 * means writing a new class that satisfies the same interface — nothing
 * above this line changes.
 */
export interface FragmentRepository {
  findBySlug(slug: string): Promise<KnowledgeFragment | null>;
  findById(id: string): Promise<KnowledgeFragment | null>;
  findManyByIds(ids: string[]): Promise<KnowledgeFragment[]>;
  listByType(type: NodeType): Promise<KnowledgeFragment[]>;
  findByBookAndPage(bookId: string, pageNum: number): Promise<KnowledgeFragment | null>;
  listPagesByBook(bookId: string): Promise<KnowledgeFragment[]>;
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
