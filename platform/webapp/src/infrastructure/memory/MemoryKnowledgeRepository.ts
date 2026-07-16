import type { KnowledgeRepository } from "@/domain/repositories";
import type { KnowledgeNode, NodeType } from "@/domain/types";
import { NODES } from "./data/nodes";

/**
 * In-memory implementation of KnowledgeRepository. A future
 * MongoKnowledgeRepository or HttpKnowledgeRepository satisfies the exact
 * same interface — nothing in application/ or components/ needs to know
 * which one is wired up.
 */
export class MemoryKnowledgeRepository implements KnowledgeRepository {
  async findBySlug(slug: string): Promise<KnowledgeNode | null> {
    return NODES.find((n) => n.slug === slug) ?? null;
  }

  async findById(id: string): Promise<KnowledgeNode | null> {
    return NODES.find((n) => n.id === id) ?? null;
  }

  async findManyByIds(ids: string[]): Promise<KnowledgeNode[]> {
    const set = new Set(ids);
    return NODES.filter((n) => set.has(n.id));
  }

  async listByType(type: NodeType): Promise<KnowledgeNode[]> {
    return NODES.filter((n) => n.type === type && n.status === "published");
  }
}
