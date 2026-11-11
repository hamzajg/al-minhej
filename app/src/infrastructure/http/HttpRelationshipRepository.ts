import type { RelationshipRepository } from "@/domain/repositories";
import type { Relationship } from "@/domain/types";
import { apiGet } from "./httpClient";

/**
 * `RelationshipRepository` over `GET /v1/relationships?nodeId=`.
 *
 * The three interface methods are the same query with a different
 * `direction` filter, which is why they stay honest over the wire: nothing
 * here re-derives direction client-side, it just asks for the edges it means
 * (`from` / `to` / both) — the direction errors this project has actually
 * been bitten by (see `DigitizationProgressService`) were re-derivations.
 */
export class HttpRelationshipRepository implements RelationshipRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async neighborsOf(nodeId: string): Promise<Relationship[]> {
    return this.query(nodeId, "");
  }

  async incomingTo(nodeId: string): Promise<Relationship[]> {
    return this.query(nodeId, "&direction=to");
  }

  async outgoingFrom(nodeId: string): Promise<Relationship[]> {
    return this.query(nodeId, "&direction=from");
  }

  private async query(nodeId: string, direction: string): Promise<Relationship[]> {
    const edges = await apiGet<Relationship[]>(
      this.baseUrl,
      `/v1/relationships?nodeId=${encodeURIComponent(nodeId)}${direction}`
    );
    return edges ?? [];
  }
}
