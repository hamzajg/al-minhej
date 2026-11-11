import type { KnowledgeFragment } from "@/domain/types";

/**
 * The in-memory fragment table. This stands in for a `knowledge_fragments`
 * MongoDB collection — see MemoryFragmentRepository, which is the only
 * file that reads this array directly. Swapping to a real database later
 * means writing a new class that satisfies the same interface; nothing
 * above this repository layer changes.
 */
import NODES_JSON from "./nodes.json";

export const NODES: KnowledgeFragment[] = NODES_JSON as KnowledgeFragment[];
