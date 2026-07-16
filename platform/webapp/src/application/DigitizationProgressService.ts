import type { KnowledgeRepository, RelationshipRepository } from "@/domain/repositories";
import type { KnowledgeNode } from "@/domain/types";

/**
 * A book's digitization progress uses the attributes.digitization object
 * from the spec: totalUnits (claimed corpus size) and authoredUnits
 * (actually authored count, generated at build time).
 */
export class DigitizationProgressService {
  constructor(_nodes: KnowledgeRepository, _relationships: RelationshipRepository) {}

  async indexedUnitsFor(bookNode: KnowledgeNode): Promise<number> {
    if (bookNode.attributes.kind !== "book") return 0;
    // Use authoredUnits from the book's digitization attributes
    return bookNode.attributes.digitization.authoredUnits;
  }

  async pctFor(bookNode: KnowledgeNode): Promise<number> {
    if (bookNode.attributes.kind !== "book") return 0;
    const { totalUnits, authoredUnits } = bookNode.attributes.digitization;
    if (totalUnits === 0) return 0;
    return (authoredUnits / totalUnits) * 100;
  }
}
