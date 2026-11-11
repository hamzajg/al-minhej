import { MemoryKnowledgeRepository } from "@/infrastructure/memory/MemoryKnowledgeRepository";
import { MemoryRelationshipRepository } from "@/infrastructure/memory/MemoryRelationshipRepository";
import { MemoryLearningPathRepository } from "@/infrastructure/memory/MemoryLearningPathRepository";
import { MemoryReaderStateRepository } from "@/infrastructure/memory/MemoryReaderStateRepository";
import { HttpKnowledgeRepository } from "@/infrastructure/http/HttpKnowledgeRepository";
import { HttpRelationshipRepository } from "@/infrastructure/http/HttpRelationshipRepository";
import { HttpLearningPathRepository } from "@/infrastructure/http/HttpLearningPathRepository";
import { HttpReaderStateRepository } from "@/infrastructure/http/HttpReaderStateRepository";
import { AssembleReadingExperience } from "./AssembleReadingExperience";
import { GraphTraversalRecommendationStrategy } from "./RecommendationStrategy";
import type { LearningPathRepository, ReaderStateRepository } from "@/domain/repositories";

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

/**
 * The AI companion is HTTP-only, and by construction: the model call has to
 * happen server-side so `ANTHROPIC_API_KEY` never reaches the browser. There is
 * therefore no in-memory strategy to swap in here — with no API base URL the
 * companion is `null` and the widget says so honestly, which is the same
 * "don't paper over a missing backend" rule `httpClient.ts` follows.
 */
export const companionApiBaseUrl: string | null = apiBaseUrl ?? null;

/**
 * The reader's path is per account, and is the one repository that *writes*.
 * Same swap point as the graph repositories: with an API base URL the path
 * lives behind `GET`/`PUT /v1/me/path`; without one the memory provider stands
 * in (keyed by account, so it is still per account). `useLearningPath` is the
 * only caller.
 */
export const learningPathRepository: LearningPathRepository = apiBaseUrl
  ? new HttpLearningPathRepository(apiBaseUrl)
  : new MemoryLearningPathRepository();

/**
 * Per-node reader state — bookmark, discovered vocabulary, recite count, and
 * the Practice-tab notes — is the same kind of per-account state as the path,
 * one scope narrower (keyed by `(account, node)`). Same swap point again: with
 * an API base URL it lives behind `GET`/`PUT /v1/me/nodes/{id}/state`; without
 * one the memory provider stands in, keyed by account and node. `useReaderState`
 * is the only caller.
 */
export const readerStateRepository: ReaderStateRepository = apiBaseUrl
  ? new HttpReaderStateRepository(apiBaseUrl)
  : new MemoryReaderStateRepository();

export { knowledgeRepository, relationshipRepository };
