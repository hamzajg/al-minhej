import { MemoryKnowledgeRepository } from "@/infrastructure/memory/MemoryKnowledgeRepository";
import { MemoryRelationshipRepository } from "@/infrastructure/memory/MemoryRelationshipRepository";
import { MemoryLearningPathRepository } from "@/infrastructure/memory/MemoryLearningPathRepository";
import { MemoryReaderStateRepository } from "@/infrastructure/memory/MemoryReaderStateRepository";
import { MemorySearchRepository } from "@/infrastructure/memory/MemorySearchRepository";
import { MemoryExploreRepository } from "@/infrastructure/memory/MemoryExploreRepository";
import { HttpKnowledgeRepository } from "@/infrastructure/http/HttpKnowledgeRepository";
import { HttpRelationshipRepository } from "@/infrastructure/http/HttpRelationshipRepository";
import { HttpLearningPathRepository } from "@/infrastructure/http/HttpLearningPathRepository";
import { HttpReaderStateRepository } from "@/infrastructure/http/HttpReaderStateRepository";
import { HttpAuthRepository } from "@/infrastructure/http/HttpAuthRepository";
import { HttpReadingExperienceRepository } from "@/infrastructure/http/HttpReadingExperienceRepository";
import { HttpSearchRepository } from "@/infrastructure/http/HttpSearchRepository";
import { HttpExploreRepository } from "@/infrastructure/http/HttpExploreRepository";
import { AssembleReadingExperience } from "./AssembleReadingExperience";
import { GraphTraversalRecommendationStrategy } from "./RecommendationStrategy";
import type {
  AuthRepository,
  ExploreRepository,
  LearningPathRepository,
  ReaderStateRepository,
  ReadingExperienceRepository,
  SearchRepository,
} from "@/domain/repositories";

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

/**
 * The reading experience is the one *assembled* read — a whole
 * `ReadingExperienceDTO` rather than a raw node or edge. `AssembleReadingExperience`
 * built it in-process from the graph repositories above; the same class is the
 * memory implementation of `ReadingExperienceRepository`, and it stays the
 * service `useNodeProgress`/`useLibrary` call for `progressFor`/`library`
 * (digitization progress is still derived client-side from the graph).
 *
 * The DTO itself now swaps the same way everything else does: with an API base
 * URL it comes from §5.A's `GET /v1/reading/{slug}` in a single request —
 * the server assembles the identical object from `server/readingExperience.mjs`.
 */
const localReadingExperience = new AssembleReadingExperience(
  knowledgeRepository,
  relationshipRepository
);

export const readingExperienceService = localReadingExperience;

export const readingExperienceRepository: ReadingExperienceRepository = apiBaseUrl
  ? new HttpReadingExperienceRepository(apiBaseUrl)
  : localReadingExperience;

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

/**
 * Search is the one *query-shaped* read: it takes a word rather than an id, so
 * unlike the graph repositories above it has no caller who already knows what
 * it wants. Same swap point regardless — with an API base URL the query goes to
 * §5.A's `GET /v1/search?q=` and is answered from §6's `search_index`; without
 * one it is answered in-process by `application/SearchGraph.ts`, over the same
 * fixture graph, which the parity check holds to the server's answers.
 */
export const searchRepository: SearchRepository = apiBaseUrl
  ? new HttpSearchRepository(apiBaseUrl)
  : new MemorySearchRepository();

/**
 * Explore is the other *slug-shaped* assembled read, one endpoint over from the
 * reading experience: §5.A's `GET /v1/explore/{slug}`. Same swap point, same
 * shape of answer (`null` for a slug that isn't published) — with an API base
 * URL the neighborhood is assembled by `server/explore.mjs`, without one by
 * `application/ExploreGraph.ts`, and the parity check holds the two identical.
 */
export const exploreRepository: ExploreRepository = apiBaseUrl
  ? new HttpExploreRepository(apiBaseUrl)
  : new MemoryExploreRepository();

/**
 * Real auth (§5.A's `/v1/auth/*`) is the one contract with no memory
 * implementation, on purpose: without a server there is nobody to verify an
 * email, a password, or a token, and a browser-side login would be theatre.
 * So this is `null` unless `VITE_ALMINHEJ_API_BASE_URL` is set, and the app
 * falls back to the anonymous local identity (`hooks/useAccount.ts`) exactly
 * as it did before auth existed. `AuthProvider` reads `null` as "sign-in
 * unavailable" rather than pretending.
 */
export const authRepository: AuthRepository | null = apiBaseUrl
  ? new HttpAuthRepository(apiBaseUrl)
  : null;

export { knowledgeRepository, relationshipRepository };
