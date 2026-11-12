# PROMPTS.md

Entry point for the next iterations of AlMinhej. Each prompt is written to
be pasted directly into Claude Code (or handed to any engineer) as a
self-contained task, in the shape: **Goal → Why → Scope → Acceptance
criteria**.

**Context for whoever picks this up:** this repo went through a domain
pivot. It was originally Lesson-centric (a `Lesson` type, one file per
lesson). It's now Knowledge-centric — `KnowledgeNode` + `Relationship`,
with a real Repository/Memory-provider layer underneath, matching
`AlMinhej_Backend_Architecture.md`. If you find references to "Lesson"
anywhere outside a code comment explaining the history, that's a bug, not
a design choice — the whole point of the pivot was that there is no Lesson
type in this codebase anymore.

Some prompts from the previous version of this file are done (digitization
progress is now derived, not hand-edited — that used to be Prompt 11) or
obsolete (generalizing `Lesson` beyond hadith — moot, since `KnowledgeNode`
was never hadith-specific). What's below is the current, accurate backlog.

---

## Prompt 1 — Add a second reading experience and prove the model generalizes

**Goal:** Author node #2 — either Hadith 2 of Al-Arba'in an-Nawawiyyah, or
a Qur'an verse (e.g. Al-Fatiha 1:1) — as new `KnowledgeNode` +
`Relationship` entries, without touching `AssembleReadingExperience.ts`,
`ChainOfNarration.tsx`, or any other component.

**Why:** This whole rebuild exists to prove that adding content is a data
change, not a code change. One node in the graph doesn't test that. Two do
— especially if the second one isn't a hadith, since that's what actually
exercises whether `NodeType`/`NodeAttributes` generalize or were secretly
hadith-shaped the whole time.

**Scope:**
- Add nodes to `infrastructure/memory/data/nodes.ts` and edges to
  `relationships.ts`. If it's a Qur'an verse, it won't have an isnad chain
  — confirm `ChainOfNarration` (or a future verse-appropriate left pane)
  degrades sensibly rather than rendering an empty chain.
- If narrating a second hadith with an overlapping isnad (e.g. it also
  passes through a narrator already in the graph), reuse that narrator
  node rather than duplicating it — this is exactly the case the graph
  model is supposed to make free.
- Update `useReadingIndex` / `HomePage` if a second card should appear
  (it should, automatically, if the node's `content.length > 0`).

**Acceptance criteria:**
- `npm run build` passes with zero type errors.
- The new node renders correctly in both `uiLang` states and both reading
  modes, using components that were not modified for this prompt.
- If it shares a narrator or book with hadith 1, that shared node's data
  (bio, digitization progress) is identical in both reading experiences,
  because it's the same node — not asserted by hand, provably true by
  construction.

---

## Prompt 2 — A real backend behind the same interfaces

**Goal:** Write `HttpKnowledgeRepository` and `HttpRelationshipRepository`
(or `Mongo*` if running them server-side) implementing
`domain/repositories.ts`, and swap them in via `application/container.ts`.

**Why:** This is the entire point of the Repository pattern already in
place. If this prompt requires touching anything other than two new files
and `container.ts`, the abstraction has a leak worth fixing before
building on top of it further.

**Scope:**
- Stand up the REST surface from `AlMinhej_Backend_Architecture.md` §5 —
  at minimum `GET /v1/nodes/:id`, `GET /v1/nodes?type=`,
  `GET /v1/relationships?nodeId=`. The frontend's `AssembleReadingExperience`
  can keep running client-side against these lower-level endpoints (matches
  today's structure), or move server-side behind `GET /v1/reading/:slug`
  once the team is ready to trust a server round trip for the whole DTO —
  either is a valid next step, pick based on where the latency budget is.
- `useReadingExperience` and every other hook already treat the
  application layer as async — this prompt should require zero hook
  changes.
- Handle the loading/error states `ReadingPage.tsx` already has stubbed
  in (`loading`, `notFound`) — they're currently unreachable in practice
  since Memory resolves instantly; a real network call will exercise them
  for the first time.

**Acceptance criteria:**
- The app runs identically against Memory and against the real backend —
  provable by an env var flip in `container.ts`, not a rebuild.
- Killing the backend mid-session shows a real error state, not a blank
  screen or an unhandled promise rejection.

---

## Prompt 3 — Content Management API + the digitization review workflow

**Goal:** Build the editor-facing surface: create/edit nodes, add
relationships, move a node through `draft → in_review → published`.

**Why:** Every node in this repo right now is hand-typed TypeScript. That
doesn't scale past a handful of demo nodes, and it's not how a scholarly
reviewer would ever be expected to work. This is also what makes the
derived digitization progress (Prompt-closed, see intro) actually mean
something in production — progress only moves when a real review process
publishes a real node.

**Scope:**
- CRUD endpoints per `AlMinhej_Backend_Architecture.md` §5.B.
- A minimal admin UI (doesn't need the reading app's polish) for creating
  a `HADITH` node, attaching content blocks, and drawing relationships to
  existing nodes — including narrator/book autocomplete against nodes that
  already exist, specifically to prevent an editor from accidentally
  creating a duplicate "Sahih al-Bukhari" node instead of reusing the one
  that exists.
- Role gate: `editor` can create/edit drafts; only `scholar-reviewer` or
  `admin` can publish.

**Acceptance criteria:**
- Publishing a new hadith node with a `PART_OF` edge to Bukhari visibly
  moves Bukhari's digitization progress bar on the reading side, with no
  manual step beyond the publish action itself.
- An editor cannot publish their own draft without review (unless they
  also hold the reviewer role).

---

## Prompt 4 — Learning paths as graph traversal

**Goal:** Build the "why are you here?" onboarding (goal selection) and a
personalized "next" recommendation, implemented as a traversal/ordering
over the knowledge graph — not a separate, hand-authored path structure
disconnected from it.

**Why:** The whole argument against the old Lesson-centric model was that
a "path" should be a projection over knowledge, not a parallel data
structure that can drift out of sync with it. This prompt is where that
argument gets tested for real.

**Scope:**
- A rule-based `RecommendationStrategy` (per the architecture doc's
  Strategy pattern callout) that, given a completed node and the graph,
  suggests a next node — e.g. via shared `REFERENCES`/`SIMILAR_TO` edges,
  or same-collection `PART_OF` siblings.
- Bilingual onboarding modal reusing the pattern already in
  `OnboardingModal.tsx` (goal selection instead of reading-mode selection).
- A `useLocalStorage`-backed "current path" for now — swapping to
  per-account storage is Prompt 6, not this one.

**Acceptance criteria:**
- The recommendation shown is always traceable to a real edge in the
  graph — no hidden/fabricated "because you might like" reasoning.
- Works with only two nodes in the graph (from Prompt 1) — don't design
  something that silently requires ten nodes to produce sensible output.

---

## Prompt 5 — A real AI Study Companion

**Goal:** Replace `getAiContext(node).answers` (static, three canned
responses) with a real, grounded call to the Claude API.

**Why:** Matches `AlMinhej_Backend_Architecture.md` §7 — the AI layer
should never touch storage directly, only a `KnowledgeContextBuilder`-
assembled context. That builder doesn't exist yet; the static answers were
always a placeholder for it.

**Scope:**
- A server route (never call the Anthropic API from the client — the key
  can't live in the browser) implementing `KnowledgeContextBuilder`: given
  a node id, assemble its content blocks plus its immediate graph
  neighbors into a bounded context object, and send *that* — not open
  model access — to the LLM.
- System prompt requires every answer to self-identify as AI-generated,
  matching the visual source-transparency convention already used
  throughout the reading UI.
- Update `CompanionWidget` to accept free-text questions, keeping the
  existing three prompts as quick-start buttons.

**Acceptance criteria:**
- A question outside the node's assembled context gets a graceful decline,
  not a hallucinated answer.
- The Anthropic API key never ships in the client bundle.

---

## Prompt 6 — Per-account path storage

**Goal:** Move the reader's learning path off `localStorage` and onto the
server, stored per account, behind the same repository boundary everything
else uses.

**Why:** Prompt 4 shipped the path on `useLocalStorage` and called this swap
out explicitly. A path that only exists in one browser is a session, not a
path. Every other read in this app already goes through a
`domain/repositories.ts` interface with a Memory and an HTTP implementation;
the path should be no different — and it is the first repository that
*writes*.

**Scope:**
- `LearningPathRepository` in `domain/repositories.ts`, with a
  `MemoryLearningPathRepository` (the no-backend stand-in, still keyed per
  account) and an `HttpLearningPathRepository` over `GET`/`PUT
  /v1/me/path`, selected in `container.ts` exactly like the graph
  repositories.
- Identity is deliberately minimal. Full auth (`/v1/auth/*` in §5.A) is its
  own piece of work, not this one. The client mints an opaque account token
  once and sends it as `x-alminhej-account`; the server persists the path
  per token (§6's `learning_paths` collection). The token is an identity,
  not a credential — there is no password and nothing is verified — which
  is the honest ceiling of "per-account" without an auth prompt.
- `useLearningPath` keeps its shape but becomes load-then-mutate against the
  account's stored path, so a visit recorded before the first read lands
  cannot clobber what the server already had.

**Acceptance criteria:**
- The same account token sees the same path after a reload; a different
  token sees a different one. (Provable locally: the memory provider stores
  under a per-account key, the HTTP provider on the server — same contract.)
- `npm run build` passes with zero type errors, and the app still runs
  identically against Memory and against the real backend.

---

## Prompt 7 — Per-node reader state, off `localStorage`

**Goal:** Move the reader's *per-node* state — the toolbar bookmark, the
vocabulary helper's discovered entries, the memorizer's recite count, and the
Practice tab's takeaway/action note — off `localStorage` and onto the server,
one document per account *and* node, behind the same repository boundary the
graph and the path already use.

**Why:** Prompt 6 moved the learning path server-side and called this out as
the next step: the path was cross-session, but everything else a reader marks
still vanished with the browser. The state is also scoped differently from the
path — a path is one document per account, this is one per account *and* node —
so it can't simply reuse `LearningPathRepository`. And it is the last thing in
the tree reaching for `useLocalStorage`: once it moves, no component persists
anything directly, and every piece of reader-generated data goes through a
`domain/repositories.ts` interface.

**Scope:**
- `ReaderStateRepository` in `domain/repositories.ts`, with a
  `MemoryReaderStateRepository` (the no-backend stand-in, keyed per account and
  node) and an `HttpReaderStateRepository` over `GET`/`PUT
  /v1/me/nodes/{id}/state`, selected in `container.ts` exactly like the path.
  The models (`ReaderState`, `EMPTY_READER_STATE`) live in a new
  `domain/readerState.ts`, mirroring how `learning.ts` holds the path's.
- Server: `GET`/`PUT /v1/me/nodes/{id}/state`, same identity story as the path
  (`x-alminhej-account`, in-memory), one document per account+node. A `GET` for
  an account that has never touched the node returns the empty state, not a
  `404`; a state for a node that isn't in the graph is a `404`.
- `useReaderState(nodeId)`, mirroring `useLearningPath`: the account's stored
  document is the source of truth, mutations are *load-then-write* so a change
  made before the first read lands can't clobber the server's copy, and it is
  keyed by node id — so it resets on navigation and no-ops until the node has
  resolved.
- `ReadingContent`/`StudyPanel`/`PracticeTab` consume that hook's values as
  props; delete `hooks/useLocalStorage.ts` once it has no callers.

**Acceptance criteria:**
- The same account token sees the same bookmark/vocabulary/recite-count/notes
  after a reload; a different token — and a different node — sees blank ones.
  (Provable locally: the memory provider keys per account+node, the HTTP
  provider stores on the server — same contract.)
- `npm run build` passes with zero type errors, `useLocalStorage.ts` is gone,
  and the app still runs identically against Memory and against the real
  backend.

---

## Prompt 8 — Real auth (`/v1/auth/*`), replacing the self-minted identity token

**Goal:** Replace the client-minted `x-alminhej-account` token — a value the
client invented and the server took on faith — with real authentication:
register and login with an email and a password, a verified credential, and a
server-resolved identity behind the same `/v1/me/*` routes.

**Why:** Prompts 6 and 7 both shipped an account that was an *identity*, not a
credential: whoever sent `x-alminhej-account: <value>` *was* that account, so
the header was the whole of the security model and anyone could read anyone
else's path by guessing a string. That was worth calling out and living with
while the point was proving the storage boundary; it is not worth shipping. The
architecture doc names `/v1/auth/*` in §5.A, and the README calls this the
honest next step. It is the largest and most security-sensitive piece of the
backlog.

**Scope:**
- Server: `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/logout`,
  `GET /v1/auth/me`. Passwords are salted and hashed with `scrypt` and compared
  in constant time (`timingSafeEqual`); the server issues an opaque random
  session token (not a JWT — no signing key to leak, and logout is a real
  delete, not a denylist). Login returns one response for both "no such email"
  and "wrong password", so the API can't be used to enumerate accounts. §6's
  `users` collection plus a session store would persist this in a real server;
  in-memory here, like the other §5.A-era writes.
- `/v1/me/*` now resolves the account from `Authorization: Bearer <token>` and
  never trusts a client-supplied id again. A missing or invalid token is a
  `401 UNAUTHENTICATED` — *not* the old `400 INVALID_REQUEST`, because "you are
  not signed in" and "your request was malformed" are different failures and the
  client acts on them differently.
- Client: `AuthRepository` in `domain/repositories.ts` (with `AuthUser` /
  `AuthSession` in a new `domain/auth.ts`), an `HttpAuthRepository` over §5.A,
  and a `null` repository when there is no backend — there is no honest
  in-memory auth, so the app keeps its anonymous local identity exactly as
  before rather than faking a login. `AuthProvider`/`useAuth` hold the session,
  persist the token in `localStorage`, and re-verify it against `/v1/auth/me`
  on boot so a token the server no longer knows is dropped rather than trusted.
- `hooks/useIdentity.ts` is the one place that reconciles the two identity
  sources: the verified session token with a backend, the local anonymous id
  without one, and `null` when signed out against a backend (in which case the
  state hooks no-op). `useLearningPath`/`useReaderState` read it instead of
  `useAccount`, and reset when it changes, so one reader's state is never
  rendered for another.
- An `AuthScreen` at `/signin` (register/login in one form) and a sign-in /
  account affordance in the header.

**Acceptance criteria:**
- Registering, logging in, and logging out all work end to end; a wrong
  password and an unknown email are indistinguishable in the response.
- A forged or absent `Authorization` header on `/v1/me/*` is a `401`, and the
  old `x-alminhej-account` header no longer grants access to anything.
- The same signed-in account sees the same path/bookmark/notes after a reload;
  a different account — and a signed-out reader — sees blank ones.
- `npm run build` passes with zero type errors, and the app still runs against
  the in-memory provider with no backend configured (where `authRepository` is
  `null` and sign-in is unavailable, not faked).

---

## Prompt 9 — The assembled reading DTO as a server endpoint (`GET /v1/reading/{slug}`)

**Goal:** Move the assembler behind a repository, so a backend-served reading
screen fetches the whole `ReadingExperienceDTO` from §5.A's
`GET /v1/reading/{slug}` in one request instead of issuing three raw
graph reads and reassembling the experience in the browser. Keep
`AssembleReadingExperience` as the in-memory implementation of the same
interface, so the Memory path is unchanged.

**Why:** The reading experience is the one *assembled* read in the app — isnad,
commentary, Qur'an cross-references, related hadith, the "go deeper" pointer,
and the graph neighbors, all derived from edges at read time. §5.A names
`/v1/reading/{slug}` for exactly this, and Prompt 2 flagged it as the natural
next step once the backend existed: the server can do the walk once and return
the finished document, rather than shipping the raw `nodes`/`relationships`
surface and duplicating the assembly logic in every client. It also puts the
authority for "what a published reading experience is" on the same side as the
publish endpoint that decides it, and shrinks the reading screen's cold start
from a fan-out of requests to one.

**Scope:**
- Domain: `ReadingExperienceRepository` in `domain/repositories.ts` —
  `get(slug): Promise<ReadingExperienceDTO | null>` — the assembled read built
  on the three graph repositories.
- `AssembleReadingExperience` now *implements* that interface (its
  `execute` becomes `get`); it stays the in-memory implementation and keeps
  `progressFor`/`library` for `useNodeProgress`/`useLibrary`. A new
  `HttpReadingExperienceRepository` over §5.A is the other implementation, and
  `container.ts` picks between them on `VITE_ALMINHEJ_API_BASE_URL` like every
  other repository. `useReadingExperience` calls the repository, so no component
  changes.
- Server: `server/readingExperience.mjs` — the assembler as a dependency-free
  port of the client one, walking only *published* nodes — and the
  `GET /v1/reading/{slug}` route on `api-server.mjs` (§5.A). A published slug
  is `200` with the full DTO; an unknown slug is `404 NODE_NOT_FOUND`; a
  non-GET is `405`.
- A `404` still resolves to `null` through `apiGet`, so "no such published
  node" stays distinguishable from "the backend is down", exactly as it was
  when assembly ran locally.

**Acceptance criteria:**
- `GET /v1/reading/{slug}` returns the assembled DTO for a published slug, a
  `404` for an unknown or unpublished one, and `405` for a non-GET — verified
  against a running `npm run api`.
- The server-produced DTO and the client-assembled one are byte-for-byte equal
  for every published slug (a parity check over the whole corpus), and an
  unknown slug yields `null` from both.
- `npm run build` passes with zero type errors, and the app runs identically
  against Memory and against the real backend — one request for the reading
  screen with a backend, in-process assembly without one.

---

## Prompt 10 — §6's document model, so the server's state outlives the server

**Goal:** Put the server's state behind a store — the §6 collections the
architecture doc has always assumed — so graph edits, accounts, sessions,
learning paths, per-node reader state, and the companion log survive a restart.
Keep the process-level behavior unchanged when no store is configured.

**Why:** Every prompt since the backend existed has been honest that the server
holds its writes in memory for the life of the process. That was acceptable
while it only *served* a fixture graph; it stopped being acceptable once the
server became a system that *writes*. §5.B's whole argument is that publishing a
node is what moves a book's digitization progress — but the publish evaporated on
restart, so the workflow's output was a demo that reset itself. Prompt 6–8's
"per account" storage was per *process*. And §6 names exactly what is missing:
`knowledge_nodes`, `relationships`, `users`, `user_progress`, `ai_sessions`. This
is the last piece of the architecture doc's storage story that the repo had not
implemented at all.

**Scope:**
- `server/store.mjs` — §6's document model as a zero-dependency store. One JSON
  file per collection (`knowledge_nodes`, `relationships`, `users`, the session
  tokens, `learning_paths`, `reader_states` — §6's `user_progress` — and
  `ai_sessions`), a two-method collection API (`all()` / `replace()`), and
  atomic writes (write a temp file, rename over the target, so a crash mid-save
  cannot leave a half-written collection). `reader_states` persists as
  `{ accountId, nodeId, state }` — §6.3's unique compound key — rather than the
  joined string the process uses internally.
- `server/api-server.mjs` — every collection hydrates from the store at boot and
  writes through after every mutation: create/patch/publish a node,
  add-relationship, register/login/logout, `PUT /v1/me/path`,
  `PUT /v1/me/nodes/{id}/state`, and the companion log append. The JSON fixtures
  become the *seed*: they are read only when a collection is empty, so a
  persisted graph is never overwritten by the seed on the next boot.
- `GET /v1/health` reports `persistence: "file" | "memory"` — the same honesty
  it already applies to `companion` — and the boot log names the mode and, when
  durable, the directory.
- **Opt-in, deliberately.** With no `ALMINHEJ_DATA_DIR` the store is a no-op and
  the server behaves exactly as it did before. That keeps `npm run api`
  dependency-free, keeps CI and a first run from writing anything to disk, and
  — most importantly — keeps the server's read surface comparable to the
  client's Memory provider: an edited, persisted graph is not the fixture graph,
  and the client/server parity check only means something while both are seeded
  from the same fixtures.
- The store is the seam a real database slots into: `collection(name)`, then
  `all()`/`replace()`, which a Mongo adapter implements as `find({}).toArray()`
  and `deleteMany` + `insertMany`. Swapping it is one file, not a rewrite — and
  it stays zero-dependency, which is what lets this server run with nothing else
  installed.

**Acceptance criteria:**
- With `ALMINHEJ_DATA_DIR` set: create → submit → publish a node, add an edge,
  register an account, `PUT` a learning path and a per-node reader state, then
  **restart the process** — and every one of those is still there: the node
  count reflects the new node, it is still publicly readable by slug, the same
  session token still authenticates, the same path and reader state come back,
  and the same password still verifies.
- Without the env var the server is unchanged: `/v1/health` reports
  `persistence: "memory"`, the node count is the fixture count regardless of
  what any data directory contains, and nothing is written to disk.
- `npm run build` passes with zero type errors and `npm run lint` reports no
  new problems.
- The HTTP surface is identical in both modes — persistence is a property of the
  store, never of a route, so no endpoint behaves differently.

---

## Prompt 11 — §5.A's `/v1/search?q=`, over §6's `search_index`

**Goal:** Implement `GET /v1/search?q=` — the last public endpoint §5.A names
that nothing implements — as a cross-type search over the knowledge graph,
backed by §6's denormalized `search_index`, refreshed whenever a node's text
changes, and durable through the store.

**Why:** The graph is the product; a word that cannot find it is a graph only
its authors can use. Every other public endpoint reads *one* thing — a node by
id, a slug, a relationship list, one assembled reading experience. Search is the
first read that spans types, which is the point §5.A makes by returning
`SearchResultDTO[]` in one mixed list: a hadith, a book, a narrator and a verse
side by side, because the graph is the index. And §6 has always reserved a
collection for exactly this (`search_index`: "Denormalized, refreshed on
publish") — Prompt 10's store is what lets it stay refreshed across a restart
instead of being rebuilt from scratch at every boot.

**Scope:**
- `application/SearchGraph.ts` — the index and the query, pure and
  dependency-free: `buildSearchIndex(nodes)` flattens each published node's
  title, §3.1's authored `search.keywords`, its attributes and its content into
  a searchable text per script, and `searchGraph(query, index, nodes)` returns
  §5.A's `SearchResultDTO[]`. `server/search.mjs` is the same code as plain JS —
  the twin-module pattern `readingExperience.mjs` and `knowledgeContext.mjs`
  already use — held together by a parity check rather than a shared import.
- Arabic-aware folding, and only that: strip harakat, tatweel and Qur'anic
  marks; fold `آأإٱ→ا`, `ىئ→ي`, `ة→ه`, `ؤ→و`; lowercase. Matching stays
  **exact-token and AND-ed** — every word must land somewhere in the node. No
  fuzzy matching and no stemming: a ranked guess is worse than no result when
  the corpus is scripture, and a near-miss in a hadith isn't a near-miss.
- `matchedIn: "title" | "keyword" | "content"` on each result, ranked by
  `FIELD_WEIGHT[matchedIn] * boost` (title 3, keyword 2, content 1, times
  §3.1's authored `boost`, defaulting to 1), with a short excerpt around the
  match — one per language the node carries, sliced from the *original* text so
  folding never leaks into what the reader sees. The reason is carried because
  "why is this row here?" is the first question a mixed list raises.
- The `search_index` collection in `server/store.mjs`, refreshed in
  `server/api-server.mjs` after every create, PATCH and publish — not only on
  publish, since a PATCH on a live node would otherwise leave text findable in
  the graph but not in search. `/v1/health` reports `searchIndex`, which may be
  smaller than `nodes` because only published nodes are indexed.
- `GET /v1/search?q=` with §5.A's error split: a missing `q` is
  `400 INVALID_REQUEST`; an empty `q` and a query with no matches are both
  `200 []`. `HttpSearchRepository` is the one caller that does *not* fold
  `apiGet`'s 404 into "no results" — a backend that predates search must say so,
  not render as an empty graph.
- The client: `SearchRepository` in `domain/repositories.ts`, a Memory
  implementation (index built once, since without a server nothing publishes)
  and an HTTP one, swapped in `application/container.ts` as usual; `useSearch`
  (debounced), a `/search` page whose query lives in the URL, a Header entry,
  and a Library page whose box hands the query to the real route instead of
  faking a shelf-local filter.

**Acceptance criteria:**
- Client and server produce byte-identical results: index and query parity
  across the whole fixture corpus, including `إنما الأعمال بالنيات` matching
  `انما الاعمال بالنيات` (harakat) and `بخاري` matching `Bukhari` — and a title
  match ranking first with `matchedIn: "title"`.
- Only published nodes are findable: a new node is a draft, `submit-for-review`
  leaves it unfindable, and `publish` makes it findable — and the new node's
  text does *not* match a query that happens to appear in its `type`/`kind`,
  proving structure isn't indexed as language.
- With `ALMINHEJ_DATA_DIR` set, the index is written to `search_index.json` and
  a restarted process answers the same queries without re-seeding; without the
  env var the surface is identical and `/v1/health` reports
  `persistence: "memory"`.
- `npm run build` passes with zero type errors and `npm run lint` reports no
  new problems.

---

## Prompt 12 — §5.A's `/v1/explore/{nodeSlug}`, the graph as its own view

**Goal:** Implement `GET /v1/explore/{nodeSlug}` — the last public read §5.A
names that nothing implements — as an `ExploreDTO`: the node at the center of
its own neighborhood, the neighbors it is dated alongside, and the
cross-references that attach it to the rest of the corpus by meaning.

**Why:** Every read shipped so far answers "what is this node?" — its text, its
chain, its commentary — and the graph is only visible *through* one node at a
time. But the product's claim is that knowledge here is a web, not a shelf, and
the web is exactly what nobody can look at yet. `ConnectTab` shows a node's
neighbors, but only inside a reading session and only as a ring, with no
chronology and nothing about *why* two nodes are adjacent. §5.A names the read
that fixes this (`ExploreDTO (graph neighbors, timeline, cross-refs)`) and §10.2
already flags that the graph traversal behind it is the part that will outgrow
a single `$graphLookup` — the shape of the answer matters more than the query
that produces it. This prompt is that shape, and it is also the honest home for
the timeline: a hadith and a book do not share a clock, and the endpoint is
where that can finally be said out loud.

**Scope:**
- `ExploreDTO` in `domain/dto.ts`, beside `ReadingExperienceDTO`: `node`,
  `neighbors: GraphNeighborDTO[]`, `timeline: TimelineEntryDTO[]`,
  `crossRefs: CrossRefDTO[]`. `TimelineEntryDTO` carries `label` (the date
  exactly as authored — never re-derived, never converted), an `era` of
  `"CE" | "AH" | "unknown"`, and the first `year` parsed from the label for
  ordering *within* an era.
- `application/ExploreGraph.ts` — the whole thing, pure and dependency-free:
  `assembleExplore(slug, nodes, relationships)`. One pass over the edges that
  touch the node, and the three arrays are three *partitions of the same edge
  set* — a neighbor is always added to `neighbors`, and the same edge may also
  land in `timeline` (if the far node is dated) or `crossRefs` (if the edge type
  is one of the five meaning-bearing ones: `REFERENCES`, `SIMILAR_TO`,
  `core_concept`, `thematic_link`, `related_hadith`). Building them together is
  the point: three slices of one adjacency list cannot disagree about what is
  adjacent. `server/explore.mjs` is the same code as plain JS — the twin-module
  pattern `readingExperience.mjs` and `search.mjs` already use — held together
  by a parity check rather than a shared import.
- Era-aware, not sorted-into-a-lie: dating a narrator or an event comes from its
  `attributes.dates`, a book from its `attributes.eraLabel`. `eraOf` reads the
  suffix in the label, `ERA_RANK` orders CE before AH before unknown, and ties
  break on year then id. Hijri and Gregorian years are never interleaved by raw
  number — doing so would assert a chronology the fixtures do not carry.
- Only published nodes are ever visible: an edge pointing at a draft is not a
  neighbor, and a draft's own slug is 404-shaped — the same rule §5.A applies
  everywhere else.
- The client: `ExploreRepository` in `domain/repositories.ts` (one method,
  `get(slug)`), a Memory implementation over the fixtures and an HTTP one over
  `apiGet` (whose 404 is already "absent, not broken"), swapped in
  `application/container.ts` as usual; `useExplore`, a `/explore/:slug` page, and
  a `ConnectTab` hand-off link that opens it rather than growing a second,
  thinner copy of the graph inside the reading session.
- The server: the route behind the same GET-only guard the other public reads
  sit behind, with the `NODE_NOT_FOUND` 404 and an empty-slug guard.

**Acceptance criteria:**
- Client and server produce byte-identical DTOs for every published slug in the
  fixture corpus, and an unknown slug is `null`/404 in both.
- The DTO is internally consistent: every edge to a published node appears in
  `neighbors`; every `crossRef` and every `timeline` entry is also a neighbor;
  `crossRefs` contains only the five meaning-bearing edge types; the timeline
  names each node at most once and is sorted within each era.
- The timeline is era-honest on real fixtures: a narrator's CE date is reported
  as CE and sorts before a book's AH era label, and an AH label is *never*
  silently rewritten as CE.
- Server smoke test over HTTP: `/v1/explore/arbain-1` is `200` with
  `node`/`neighbors`/`timeline`/`crossRefs`; an unknown slug is `404
  NODE_NOT_FOUND`; `POST` is `405`; `/v1/reading/{slug}` and `/v1/search` are
  unregressed; and a node created as a draft is absent from its neighbor's
  explore view until it is published, then present — cross-refs included.
- `npm run build` passes with zero type errors and `npm run lint` reports no
  new problems.

---

## Notes for whoever picks this up

- Keep the Goal → Why → Scope → Acceptance shape for new prompts — it's
  what keeps this backlog traceable back to the architecture doc instead
  of drifting into generic feature work.
- Re-run `npm run build` after every prompt. It currently passes clean
  with zero type errors — keep it that way. For anything touching
  `application/` or `infrastructure/`, also re-run a smoke check against
  `readingExperienceService.execute(...)` directly (see the project
  history for the `tsx --tsconfig tsconfig.app.json` invocation) — the
  type checker will not catch a relationship pointing the wrong direction,
  and that class of bug is exactly what broke digitization-progress math
  during the initial graph rebuild.
