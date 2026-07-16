import { HttpKnowledgeRepository } from "@/infrastructure/http/HttpKnowledgeRepository";
import { HttpRelationshipRepository } from "@/infrastructure/http/HttpRelationshipRepository";
import { AssembleReadingExperience } from "./AssembleReadingExperience";

/**
 * The only file that decides *which* storage implementation is in use.
 * Data is served as static JSON from public/api/ and fetched via HTTP,
 * mimicking real backend API calls. Swapping to a real backend later
 * means pointing these to actual API endpoints — nothing above this
 * line changes.
 */
const knowledgeRepository = new HttpKnowledgeRepository();
const relationshipRepository = new HttpRelationshipRepository();

export const readingExperienceService = new AssembleReadingExperience(
  knowledgeRepository,
  relationshipRepository
);

export { knowledgeRepository, relationshipRepository };
