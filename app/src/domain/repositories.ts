import type { KnowledgeNode, NodeType, Relationship } from "./types";
import type { ReadingExperienceDTO } from "./dto";
import type { LearningPath } from "./learning";
import type { ReaderState } from "./readerState";
import type { AuthSession, AuthUser } from "./auth";

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
  save(accountKey: string, path: LearningPath): Promise<LearningPath>;
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
