import type { KnowledgeRepository } from "@/domain/repositories";
import type { KnowledgeNode, NodeType } from "@/domain/types";

const API_BASE = "/api";

let cachedNodes: KnowledgeNode[] | null = null;

async function fetchNodes(): Promise<KnowledgeNode[]> {
  if (cachedNodes) return cachedNodes;
  const res = await fetch(`${API_BASE}/knowledge/nodes.json`);
  if (!res.ok) throw new Error(`Failed to fetch nodes: ${res.status}`);
  cachedNodes = (await res.json()) as KnowledgeNode[];
  return cachedNodes;
}

export class HttpKnowledgeRepository implements KnowledgeRepository {
  async findBySlug(slug: string): Promise<KnowledgeNode | null> {
    const nodes = await fetchNodes();
    return nodes.find((n) => n.slug === slug) ?? null;
  }

  async findById(id: string): Promise<KnowledgeNode | null> {
    const nodes = await fetchNodes();
    return nodes.find((n) => n.id === id) ?? null;
  }

  async findManyByIds(ids: string[]): Promise<KnowledgeNode[]> {
    const nodes = await fetchNodes();
    const set = new Set(ids);
    return nodes.filter((n) => set.has(n.id));
  }

  async listByType(type: NodeType): Promise<KnowledgeNode[]> {
    const nodes = await fetchNodes();
    return nodes.filter((n) => n.type === type && n.status === "published");
  }
}
