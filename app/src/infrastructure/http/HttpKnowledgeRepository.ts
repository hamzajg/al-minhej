import type { KnowledgeRepository } from "@/domain/repositories";
import type { KnowledgeNode, NodeType } from "@/domain/types";
import { apiGet } from "./httpClient";

/**
 * `KnowledgeRepository` over the Public Reading API
 * (`AlMinhej_Backend_Architecture.md` §5.A, `/v1/nodes/*`).
 *
 * Satisfies the exact same contract as `MemoryKnowledgeRepository`, including
 * the "published only" rule that `listByType` encodes — the server applies it,
 * so a draft node is invisible here for the same reason it's invisible there.
 */
export class HttpKnowledgeRepository implements KnowledgeRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async findBySlug(slug: string): Promise<KnowledgeNode | null> {
    return apiGet<KnowledgeNode>(this.baseUrl, `/v1/nodes?slug=${encodeURIComponent(slug)}`);
  }

  async findById(id: string): Promise<KnowledgeNode | null> {
    return apiGet<KnowledgeNode>(this.baseUrl, `/v1/nodes/${encodeURIComponent(id)}`);
  }

  async findManyByIds(ids: string[]): Promise<KnowledgeNode[]> {
    if (ids.length === 0) return [];
    const nodes = await apiGet<KnowledgeNode[]>(
      this.baseUrl,
      `/v1/nodes?ids=${encodeURIComponent(ids.join(","))}`
    );
    return nodes ?? [];
  }

  async listByType(type: NodeType): Promise<KnowledgeNode[]> {
    const nodes = await apiGet<KnowledgeNode[]>(
      this.baseUrl,
      `/v1/nodes?type=${encodeURIComponent(type)}`
    );
    return nodes ?? [];
  }
}
