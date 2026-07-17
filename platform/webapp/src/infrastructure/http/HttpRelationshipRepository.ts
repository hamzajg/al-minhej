import type { RelationshipRepository } from "@/domain/repositories";
import type { Relationship } from "@/domain/types";

const API_BASE = "/api/v1";

let cachedRelationships: Relationship[] | null = null;

async function fetchRelationships(): Promise<Relationship[]> {
  if (cachedRelationships) return cachedRelationships;
  const res = await fetch(`${API_BASE}/relationships/all.json`);
  if (!res.ok) throw new Error(`Failed to fetch relationships: ${res.status}`);
  cachedRelationships = (await res.json()) as Relationship[];
  return cachedRelationships;
}

export class HttpRelationshipRepository implements RelationshipRepository {
  async neighborsOf(nodeId: string): Promise<Relationship[]> {
    const rels = await fetchRelationships();
    return rels.filter((r) => r.from === nodeId || r.to === nodeId);
  }

  async incomingTo(nodeId: string): Promise<Relationship[]> {
    const rels = await fetchRelationships();
    return rels.filter((r) => r.to === nodeId);
  }

  async outgoingFrom(nodeId: string): Promise<Relationship[]> {
    const rels = await fetchRelationships();
    return rels.filter((r) => r.from === nodeId);
  }
}
