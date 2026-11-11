import type { FragmentRepository } from "@/domain/repositories";
import type { KnowledgeFragment, NodeType } from "@/domain/types";
import { NODES } from "./data/nodes";

/**
 * In-memory implementation of FragmentRepository. A future
 * MongoFragmentRepository or HttpFragmentRepository satisfies the exact
 * same interface — nothing in application/ or components/ needs to know
 * which one is wired up.
 */
export class MemoryFragmentRepository implements FragmentRepository {
  async findBySlug(slug: string): Promise<KnowledgeFragment | null> {
    return NODES.find((n) => n.slug === slug) ?? null;
  }

  async findById(id: string): Promise<KnowledgeFragment | null> {
    return NODES.find((n) => n.id === id) ?? null;
  }

  async findManyByIds(ids: string[]): Promise<KnowledgeFragment[]> {
    const set = new Set(ids);
    return NODES.filter((n) => set.has(n.id));
  }

  async listByType(type: NodeType): Promise<KnowledgeFragment[]> {
    return NODES.filter((n) => n.type === type && n.status === "published");
  }

  async findByBookAndPage(bookId: string, pageNum: number): Promise<KnowledgeFragment | null> {
    return NODES.find(
      (n) => n.type === "PAGE" &&
      n.attributes.kind === "page" &&
      n.attributes.bookId === bookId &&
      n.attributes.pageNum === pageNum &&
      n.status === "published"
    ) ?? null;
  }

  async listPagesByBook(bookId: string): Promise<KnowledgeFragment[]> {
    return NODES.filter(
      (n) => n.type === "PAGE" &&
      n.attributes.kind === "page" &&
      n.attributes.bookId === bookId &&
      n.status === "published"
    ).sort((a, b) => {
      const pageA = a.attributes.kind === "page" ? a.attributes.pageNum : 0;
      const pageB = b.attributes.kind === "page" ? b.attributes.pageNum : 0;
      return pageA - pageB;
    });
  }
}
