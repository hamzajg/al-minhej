import type { KnowledgeFragment, Relationship } from "@/domain/types";

// Single source of truth for nodes: the inline `NODES` array in the memory
// repository. Previously this file kept a parallel JSON copy that could drift;
// now it simply re-exports the one canonical list so `@/data` and the
// repository never disagree.
import { NODES as NODES_FROM_REPO } from "@/infrastructure/memory/data/nodes";
import edges from "./relationships.json";

export const NODES: KnowledgeFragment[] = NODES_FROM_REPO;

export const RELATIONSHIPS: Relationship[] = edges as Relationship[];
