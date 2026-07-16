import { MemoryKnowledgeRepository } from "@/infrastructure/memory/MemoryKnowledgeRepository";
import { MemoryRelationshipRepository } from "@/infrastructure/memory/MemoryRelationshipRepository";
import { AssembleReadingExperience } from "./AssembleReadingExperience";

/**
 * The only file that decides *which* storage implementation is in use.
 * Swapping the whole app to a real backend later means changing these two
 * lines to `HttpKnowledgeRepository` / `HttpRelationshipRepository` (or a
 * MongoDB-backed pair on a server) — application services, hooks, and
 * every component stay exactly as they are.
 */
const knowledgeRepository = new MemoryKnowledgeRepository();
const relationshipRepository = new MemoryRelationshipRepository();

export const readingExperienceService = new AssembleReadingExperience(
  knowledgeRepository,
  relationshipRepository
);

export { knowledgeRepository, relationshipRepository };
