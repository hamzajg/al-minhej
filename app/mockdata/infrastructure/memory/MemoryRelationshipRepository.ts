import type { RelationshipRepository } from "@/domain/repositories";
import type { Relationship } from "@/domain/types";
import { RELATIONSHIPS } from "@/data";

export class MemoryRelationshipRepository implements RelationshipRepository {
  async neighborsOf(nodeId: string): Promise<Relationship[]> {
    return RELATIONSHIPS.filter((r) => r.from === nodeId || r.to === nodeId);
  }

  async incomingTo(nodeId: string): Promise<Relationship[]> {
    return RELATIONSHIPS.filter((r) => r.to === nodeId);
  }

  async outgoingFrom(nodeId: string): Promise<Relationship[]> {
    return RELATIONSHIPS.filter((r) => r.from === nodeId);
  }
}
