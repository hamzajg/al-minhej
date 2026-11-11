import type { KnowledgeRepository, RelationshipRepository } from "@/domain/repositories";
import type { KnowledgeNode } from "@/domain/types";

/**
 * A book's digitization progress is never hand-edited. It's the count of
 * *published* nodes that actually point at it — via PART_OF (a hadith
 * collected in it) or EXPLAINS (a hadith it comments on). Publish a new
 * node with an edge to a book, and that book's progress bar moves on its
 * own. This is what makes it impossible for the same book cited from two
 * different reading experiences to show two different numbers — there's
 * only one book node, and the count is computed fresh from the graph
 * every time.
 */
export class DigitizationProgressService {
  private nodes: KnowledgeRepository;
  private relationships: RelationshipRepository;

  constructor(nodes: KnowledgeRepository, relationships: RelationshipRepository) {
    this.nodes = nodes;
    this.relationships = relationships;
  }

  async indexedUnitsFor(bookNode: KnowledgeNode): Promise<number> {
    // A book can be "contributed to" two ways: a hadith points AT it
    // (PART_OF, e.g. "this hadith is in Bukhari") or the book points AT a
    // hadith it explains (EXPLAINS, e.g. "Sharh al-Arba'in explains this
    // hadith"). Both directions count toward the same derived progress.
    const [incoming, outgoing] = await Promise.all([
      this.relationships.incomingTo(bookNode.id),
      this.relationships.outgoingFrom(bookNode.id),
    ]);
    const fromPartOf = incoming.filter((r) => r.type === "PART_OF").map((r) => r.from);
    const fromExplains = outgoing.filter((r) => r.type === "EXPLAINS").map((r) => r.to);
    const contributingIds = [...new Set([...fromPartOf, ...fromExplains])];
    const contributingNodes = await this.nodes.findManyByIds(contributingIds);
    return contributingNodes.filter((n) => n.status === "published").length;
  }

  async pctFor(bookNode: KnowledgeNode): Promise<number> {
    if (!bookNode.digitization || !bookNode.digitization.totalUnits) return 0;
    const indexed = await this.indexedUnitsFor(bookNode);
    return (indexed / bookNode.digitization.totalUnits) * 100;
  }
}
