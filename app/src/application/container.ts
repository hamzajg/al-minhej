import { MemoryKnowledgeRepository } from "@/infrastructure/memory/MemoryKnowledgeRepository";
import { MemoryRelationshipRepository } from "@/infrastructure/memory/MemoryRelationshipRepository";
import { HttpKnowledgeRepository } from "@/infrastructure/http/HttpKnowledgeRepository";
import { HttpRelationshipRepository } from "@/infrastructure/http/HttpRelationshipRepository";
import { AssembleReadingExperience } from "./AssembleReadingExperience";
import { GraphTraversalRecommendationStrategy } from "./RecommendationStrategy";

/**
 * The only file that decides *which* storage implementation is in use.
 *
 * Set `VITE_ALMINHEJ_API_BASE_URL` (e.g. `http://localhost:8787`, and start it
 * with `npm run api`) and the app talks to the real backend; leave it unset and
 * it runs on the in-memory provider. Nothing else changes — not a hook, not a
 * component, not `AssembleReadingExperience`. Vite auto-restarts the dev server
 * when `.env` changes, so the flip doesn't need a rebuild.
 */
const apiBaseUrl: string | undefined = import.meta.env?.VITE_ALMINHEJ_API_BASE_URL;

const knowledgeRepository = apiBaseUrl
  ? new HttpKnowledgeRepository(apiBaseUrl)
  : new MemoryKnowledgeRepository();
const relationshipRepository = apiBaseUrl
  ? new HttpRelationshipRepository(apiBaseUrl)
  : new MemoryRelationshipRepository();

export const readingExperienceService = new AssembleReadingExperience(
  knowledgeRepository,
  relationshipRepository
);

/**
 * Learning paths are a traversal over the graph, so the strategy reads the
 * same repositories everything else does. A future embedding-based strategy
 * implements the same `RecommendationStrategy` interface and replaces this
 * one line.
 */
export const recommendationStrategy = new GraphTraversalRecommendationStrategy(
  knowledgeRepository,
  relationshipRepository
);

export { knowledgeRepository, relationshipRepository };
