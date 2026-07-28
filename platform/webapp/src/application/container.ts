import { HttpKnowledgeRepository } from "@/infrastructure/http/HttpKnowledgeRepository";
import { HttpRelationshipRepository } from "@/infrastructure/http/HttpRelationshipRepository";
import { HttpIsnadRepository } from "@/infrastructure/http/HttpIsnadRepository";
import { AssembleReadingExperience } from "./AssembleReadingExperience";
import { AssembleQuranExperience } from "./AssembleQuranExperience";

const knowledgeRepository = new HttpKnowledgeRepository();
const relationshipRepository = new HttpRelationshipRepository();
const isnadRepository = new HttpIsnadRepository();

export const readingExperienceService = new AssembleReadingExperience(
  knowledgeRepository,
  relationshipRepository,
  isnadRepository
);

export const quranExperienceService = new AssembleQuranExperience(
  knowledgeRepository,
  relationshipRepository
);

export { knowledgeRepository, relationshipRepository, isnadRepository };
