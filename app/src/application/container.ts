import { MemoryKnowledgeRepository } from "@/infrastructure/memory/MemoryKnowledgeRepository";
import { MemoryRelationshipRepository } from "@/infrastructure/memory/MemoryRelationshipRepository";
import { MemoryLearningPathRepository } from "@/infrastructure/memory/MemoryLearningPathRepository";
import { MemoryProgressRepository } from "@/infrastructure/memory/MemoryProgressRepository";
import { MemoryReaderStateRepository } from "@/infrastructure/memory/MemoryReaderStateRepository";
import { MemorySearchRepository } from "@/infrastructure/memory/MemorySearchRepository";
import { MemoryExploreRepository } from "@/infrastructure/memory/MemoryExploreRepository";
import { MemoryRecommendationRepository } from "@/infrastructure/memory/MemoryRecommendationRepository";
import { MemoryVoteRepository } from "@/infrastructure/memory/MemoryVoteRepository";
import { MemoryWorkspaceRepository } from "@/infrastructure/memory/MemoryWorkspaceRepository";
import { HttpKnowledgeRepository } from "@/infrastructure/http/HttpKnowledgeRepository";
import { HttpRelationshipRepository } from "@/infrastructure/http/HttpRelationshipRepository";
import { HttpLearningPathRepository } from "@/infrastructure/http/HttpLearningPathRepository";
import { HttpProgressRepository } from "@/infrastructure/http/HttpProgressRepository";
import { HttpReaderStateRepository } from "@/infrastructure/http/HttpReaderStateRepository";
import { HttpAuthRepository } from "@/infrastructure/http/HttpAuthRepository";
import { HttpReadingExperienceRepository } from "@/infrastructure/http/HttpReadingExperienceRepository";
import { HttpSearchRepository } from "@/infrastructure/http/HttpSearchRepository";
import { HttpExploreRepository } from "@/infrastructure/http/HttpExploreRepository";
import { HttpRecommendationRepository } from "@/infrastructure/http/HttpRecommendationRepository";
import { HttpVoteRepository } from "@/infrastructure/http/HttpVoteRepository";
import { HttpWorkspaceRepository } from "@/infrastructure/http/HttpWorkspaceRepository";
import { AssembleReadingExperience } from "./AssembleReadingExperience";
import type {
  AuthRepository,
  ExploreRepository,
  LearningPathRepository,
  ProgressRepository,
  ReaderStateRepository,
  ReadingExperienceRepository,
  RecommendationRepository,
  SearchRepository,
  VoteRepository,
  WorkspaceRepository,
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
 * Learning paths are a traversal over the graph, and "what comes next" is one
 * more *read* of that graph (§5.A's `GET /v1/paths/recommended`) — the same
 * swap point as explore and search. It used to be computed in the browser by a
 * repository-backed strategy class; the walk now lives in the pure
 * `application/RecommendationGraph.ts`, so with an API base URL the server
 * (`server/recommendations.mjs`, the parity-checked twin) answers instead and
 * without one the Memory provider runs the identical function locally. Either
 * way the hook above is unchanged. A future embedding-based strategy replaces
 * the pure module, not a call site.
 */
export const recommendationRepository: RecommendationRepository = apiBaseUrl
  ? new HttpRecommendationRepository(apiBaseUrl)
  : new MemoryRecommendationRepository();

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
 * §5.A's `GET /v1/me/progress` — the aggregate journey read, one scope wider
 * than the path: it sums the path *and* every per-node reader state the
 * account owns. Same swap point again — with an API base URL the server does
 * the summing; without one `MemoryProgressRepository` sums the same two
 * localStorage collections locally. `useProgress` is the only caller.
 */
export const progressRepository: ProgressRepository = apiBaseUrl
  ? new HttpProgressRepository(apiBaseUrl)
  : new MemoryProgressRepository();

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
/**
 * §5.A's `GET`/`POST /v1/nodes/{id}/votes` — the digitization-prioritization
 * tally. The read is public (the count is for everyone; `votedByMe` needs a
 * session), the write is per-account, so `cast` is a no-op without an account
 * key — `useIdentity()` returns `null` for a signed-out reader on a real
 * backend, exactly the "don't pretend" rule auth already follows. Same swap
 * point as everything else: Memory tallies live in `localStorage` keyed by the
 * anonymous account id; HTTP talks to the server's `votes` collection.
 */
export const voteRepository: VoteRepository = apiBaseUrl
  ? new HttpVoteRepository(apiBaseUrl)
  : new MemoryVoteRepository();

/**
 * §5.A's user workspace — `/v1/me/bookmarks`, `/v1/me/notes` and
 * `/v1/me/reflections`. Same swap point as the other per-account state: with
 * an API base URL the workspace lives on the server (§6's `user_notes`, plus
 * the bookmark flag on `user_progress`); without one the memory provider
 * keeps the same two localStorage homes. `useBookmarks` and
 * `useWorkspaceJournal` are the only callers.
 */
export const workspaceRepository: WorkspaceRepository = apiBaseUrl
  ? new HttpWorkspaceRepository(apiBaseUrl)
  : new MemoryWorkspaceRepository();

export const authRepository: AuthRepository | null = apiBaseUrl
  ? new HttpAuthRepository(apiBaseUrl)
  : null;

export { knowledgeRepository, relationshipRepository };
