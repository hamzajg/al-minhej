import type { KnowledgeNode, NodeType, Relationship } from "./types";
import type { ExploreDTO, ReadingExperienceDTO, RecommendationDTO, SearchResultDTO } from "./dto";
import type { LearningPath, ProgressDTO, RecommendationReason } from "./learning";
import type { ReaderState } from "./readerState";
import type { AuthSession, AuthUser } from "./auth";
import type { VoteTally } from "./votes";
import type { WorkspaceKind, WorkspaceNote } from "./workspace";

/**
 * Storage-agnostic contracts. Application services depend on these
 * interfaces only. `infrastructure/memory/*` implements them today;
 * swapping in a real HTTP-backed or Mongo-backed implementation later
 * means writing a new class that satisfies the same interface — nothing
 * above this line changes.
 */
export interface KnowledgeRepository {
  findBySlug(slug: string): Promise<KnowledgeNode | null>;
  findById(id: string): Promise<KnowledgeNode | null>;
  findManyByIds(ids: string[]): Promise<KnowledgeNode[]>;
  listByType(type: NodeType): Promise<KnowledgeNode[]>;
}

export interface RelationshipRepository {
  /** Every edge touching this node, in either direction. */
  neighborsOf(nodeId: string): Promise<Relationship[]>;
  /** Every edge pointing *at* this node — used to derive digitization
   *  progress and to find "what explains/narrates this". */
  incomingTo(nodeId: string): Promise<Relationship[]>;
  /** Every edge originating *from* this node. */
  outgoingFrom(nodeId: string): Promise<Relationship[]>;
}

/**
 * §5.A's `GET /v1/reading/{slug}` — the *assembled* reading experience in one
 * call. The three graph repositories above are the low-level reads; this one is
 * the use case built on top of them ("everything connected to this node, so the
 * frontend never has to"). It was always part of the design — the architecture
 * doc names the endpoint, and `AssembleReadingExperience` is its in-process
 * implementation — but until now the assembly only ever ran in the browser,
 * against three round trips' worth of raw edges.
 *
 * Putting it behind the same boundary the rest of the app uses is what lets the
 * whole DTO be fetched in one request when a backend is configured, while the
 * in-memory provider keeps assembling it locally. Both are the same object; the
 * parity check asserts that, byte for byte.
 */
export interface ReadingExperienceRepository {
  /** The assembled experience for a slug, or `null` when no published node has it. */
  get(slug: string): Promise<ReadingExperienceDTO | null>;
}

/**
 * §5.A's `GET /v1/search?q=` — cross-type search over the graph, §6's own
 * bounded context with its own `search_index` collection.
 *
 * It sits alongside the graph repositories rather than inside them because it
 * answers a different question: they each take an id or a slug you already
 * have, this one takes a word you don't. An empty or whitespace-only query is
 * not an error and returns no rows — there is nothing to match on.
 */
export interface SearchRepository {
  search(query: string): Promise<SearchResultDTO[]>;
}

/**
 * §5.A's `GET /v1/explore/{slug}` — the node's neighborhood, assembled.
 *
 * It sits beside `ReadingExperienceRepository` because it is the same kind of
 * read: one slug in, one assembled DTO out, `null` for a slug that is not in the
 * published graph. It exists separately because it answers a different question
 * — "where does this sit" rather than "what does this say" — and §5.A names it
 * as its own endpoint, with its own DTO.
 */
export interface ExploreRepository {
  get(slug: string): Promise<ExploreDTO | null>;
}

/**
 * §5.A's `GET /v1/paths/recommended` — the *next node* the graph supports from
 * where the reader is, given what they have already read.
 *
 * It belongs beside the assembled reads above because it is one of them: a slug
 * in, one DTO out, `null` for a slug that is not in the published graph. But it
 * is the one read that takes *reader state* as an input too — `exclude` is the
 * ids already on the path (never re-suggested) and `prefer` is the rule ordering
 * a goal supplies — which is what makes the answer "personalized" while still
 * being computed entirely from authored edges. Nothing here invents a
 * suggestion: a recommendation is only ever a node some real edge points to.
 */
export interface RecommendationRepository {
  /**
   * The next node from `fromSlug`, skipping `exclude`, walking the rules in
   * `prefer` order (the default order when it is empty). `null` when no
   * published node carries the slug; `next` inside the DTO is `null` when no
   * rule finds a readable destination.
   */
  recommend(
    fromSlug: string,
    exclude: string[],
    prefer: RecommendationReason[]
  ): Promise<RecommendationDTO | null>;
}

/**
 * The reader's own path (§2/§6's `learning_paths` document), stored per
 * account. Unlike the two graph repositories above, this one *writes* — a
 * path is the reader's state, not authored content, so it never touches the
 * node/edge fixtures.
 *
 * `accountKey` is whatever scopes the state to one reader: the verified session
 * token when a real backend is in use (`Authorization: Bearer`), or a local
 * anonymous id without one. The implementation only ever treats it as an opaque
 * key — it never inspects it.
 */
export interface LearningPathRepository {
  get(accountKey: string): Promise<LearningPath>;
  /**
   * §5.A's `POST /v1/onboarding/goals` — the *initial* path write, distinct
   * from `save` because it is the one moment a path is created rather than
   * updated: the server refuses (`PATH_EXISTS`) to clobber a path the reader
   * has already travelled, which the generic `save` deliberately does not
   * police. `path` carries the goal and seed the picker chose; the server
   * owns `startedAt`. Implementations that cannot refuse (the memory
   * provider, or a server without the route) fall back to `save` semantics.
   */
  start(accountKey: string, path: LearningPath): Promise<LearningPath>;
  save(accountKey: string, path: LearningPath): Promise<LearningPath>;
}

/**
 * §5.A's `GET /v1/me/progress` — the aggregate journey read: the path's own
 * counters plus what the account's per-node reader states add up to, in one
 * document. Read-only, per account, same `accountKey` story as the path.
 */
export interface ProgressRepository {
  get(accountKey: string): Promise<ProgressDTO>;
}

/**
 * The reader's own state *for a single node* — bookmark, discovered
 * vocabulary, recite count, and the Practice-tab notes. Like
 * `LearningPathRepository` this one *writes*, but the scope is one node, so
 * it is keyed by `(accountKey, nodeId)` rather than by account alone. `nodeId`
 * is the node's stable id (the same id `KnowledgeRepository.findById` uses).
 */
export interface ReaderStateRepository {
  get(accountKey: string, nodeId: string): Promise<ReaderState>;
  save(accountKey: string, nodeId: string, state: ReaderState): Promise<ReaderState>;
}

/**
 * §5.A's `/v1/auth/*` — real identity, replacing the client-minted token. The
 * server verifies an email/password pair or a bearer token; nothing here trusts
 * a caller-supplied id. Unlike the state repositories above this one is
 * *only* meaningful with a backend: without one there is no one to verify
 * against, so `container.ts` leaves the whole repository `null` and the app
 * runs on the anonymous local identity as it did before auth.
 */
export interface AuthRepository {
  register(email: string, password: string): Promise<AuthSession>;
  login(email: string, password: string): Promise<AuthSession>;
  /** The user behind a token, or `null` when the token is not a live session. */
  me(token: string): Promise<AuthUser | null>;
  /** Invalidate a session. Idempotent: an unknown token is not an error. */
  logout(token: string): Promise<void>;
}

/**
 * §5.A's `POST /v1/nodes/{id}/votes` — one vote per account per node, counted
 * in public so a source's digitization queue can be prioritized by readers
 * rather than by guesswork. `GET` is the matching read: the tally is public,
 * `votedByMe` is not (it is false without an account).
 *
 * Casting is idempotent twice over: the same account cannot increment the
 * count twice, and a retried POST with the same `Idempotency-Key` returns the
 * first response rather than a second vote. `accountKey` is optional on `get`
 * so a signed-out reader can still see the public count.
 */
export interface VoteRepository {
  get(nodeId: string, accountKey: string | null): Promise<VoteTally | null>;
  cast(nodeId: string, accountKey: string, idempotencyKey: string): Promise<VoteTally | null>;
}

/**
 * §5.A's user workspace — `/v1/me/bookmarks`, `/v1/me/notes` and
 * `/v1/me/reflections`. The reader's own collection, so it writes like the
 * path and reader state do: per `accountKey`, never anonymous.
 *
 * Bookmarks are the aggregate *list* view over the `bookmarked` flag the
 * per-node reader state already carries — `setBookmark` merges into that
 * document rather than writing a parallel collection, which is why it takes
 * the flag rather than a whole `ReaderState`.
 */
export interface WorkspaceRepository {
  /** The account's bookmarked node ids. */
  listBookmarks(accountKey: string): Promise<string[]>;
  /** Set or clear one node's bookmark; everything else on the reader state is preserved. */
  setBookmark(accountKey: string, nodeId: string, bookmarked: boolean): Promise<void>;
  /** The account's journal entries of one kind, newest first; `nodeId` narrows to one node. */
  listNotes(
    accountKey: string,
    kind: WorkspaceKind,
    nodeId?: string
  ): Promise<WorkspaceNote[]>;
  /** Append a journal entry; the server stamps id and timestamps. */
  createNote(
    accountKey: string,
    kind: WorkspaceKind,
    nodeId: string,
    text: string
  ): Promise<WorkspaceNote>;
}
