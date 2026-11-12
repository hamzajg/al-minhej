# AlMinhej — Frontend

**Domain: Knowledge, not Lessons.**

An Arabic-first, guided reading experience for authentic Islamic knowledge,
built around a knowledge graph — `KnowledgeNode`s connected by
`Relationship`s — instead of a lesson/course hierarchy. There is no
`Lesson` type anywhere in this codebase. What renders as "Hadith 1" is a
generated `ReadingExperienceDTO`, assembled at read time from one hadith
node and everything connected to it.

This is the engineering continuation of `AlMinhej_Backend_Architecture.md`
(the design doc this repo implements client-side, ahead of a real
backend) and the approval deck before it. See `PROMPTS.md` for the roadmap.

## Stack

- **React 19 + TypeScript** — strict typing through the whole domain model
- **Vite** — dev server & build
- **Tailwind CSS v4** — CSS-first config (`@theme` in `src/index.css`), no `tailwind.config.js`
- **React Router** — `/` (Home) and `/reading/:slug` (the reading experience)
- **lucide-react** — icon set

A real HTTP backend now exists behind those same interfaces — same app, same
hooks, same components, one env var apart. See Architecture below, and
`PROMPTS.md` for the roadmap.

## Getting started

```bash
npm install

# 1. In-memory provider (the default — no server needed)
npm run dev       # http://localhost:5173

# 2. …or the real backend, same app code
npm run api       # http://localhost:8787 (the REST surface from §5 of the doc)
echo 'VITE_ALMINHEJ_API_BASE_URL=http://localhost:8787' > .env.local
npm run dev       # Vite restarts itself; no rebuild

# 2b. …and make that server's writes survive a restart. Unset, `npm run api`
#     holds everything in memory for the life of the process — and says so on
#     `/v1/health`. With a data directory it keeps §6's collections on disk:
ALMINHEJ_DATA_DIR=.data npm run api
#     Publish a node, register an account, build a path, mark up a page — then
#     kill the server and start it again. It is all still there. Delete
#     `.data/` to re-seed from the fixtures.

# 3. …and the editor-facing Content Management API (§5.B) at /admin
#    Same `npm run api` process, same graph. Create a HADITH node, link it
#    with PART_OF to a book that already exists, submit it, publish it —
#    and the book's digitization progress moves on the reading side with
#    no other step. Try it with only the `editor` role ticked and notice
#    Publish is refused; add `scholar-reviewer` to allow it.

# 4. …the AI Companion (§7) is opt-in and server-side only. The key is
#    read from the server's environment and never reaches the browser:
ANTHROPIC_API_KEY=sk-ant-… npm run api   # enables /v1/nodes/{id}/companion/ask
#    Without it the endpoint answers 503 and the widget says so rather
#    than inventing an answer. `/v1/health` reports `companion: ready`.
```

```bash
npm run build     # type-checks + production build to dist/
npm run preview   # serve the production build locally
```

## Architecture

```
src/
  domain/
    types.ts        KnowledgeNode, ContentBlock (union), Relationship,
                     NodeType, RelationshipType, DigitizationTarget —
                     the core model. No Lesson type.
    dto.ts           ReadingExperienceDTO and friends — the shape §5.A's
                     `GET /v1/reading/{slug}` returns: the whole reading
                     experience, assembled into one document — plus
                     SearchResultDTO, one row of §5.A's `GET /v1/search?q=`
                     (the matched node, which field it hit, its score, and a
                     per-language excerpt) — and ExploreDTO, the shape of §5.A's
                     `GET /v1/explore/{slug}`: the node at the center, its
                     `neighbors`, its era-aware `timeline`
                     (`TimelineEntryDTO` — the authored date `label`, an `era`
                     of `"CE" | "AH" | "unknown"`, and a parsed `year`) and its
                     `crossRefs` (`CrossRefDTO`) — and RecommendationDTO, §5.A's
                     `GET /v1/paths/recommended`: the resolved `from` node and
                     the single `next` suggestion (a `Recommendation` — the
                     node, its `reason`, the one `via` edge, and the `anchor`
                     it hangs off), or `null`.
    repositories.ts  KnowledgeRepository / RelationshipRepository /
                     ReadingExperienceRepository / SearchRepository /
                     ExploreRepository / RecommendationRepository /
                     LearningPathRepository /
                     ReaderStateRepository / AuthRepository interfaces — the
                     storage-agnostic boundary. The first two read the authored
                     graph; ReadingExperienceRepository is the *assembled* read
                     built on them (§5.A's `/v1/reading/{slug}`),
                     ExploreRepository is the neighborhood read beside it
                     (§5.A's `/v1/explore/{slug}`), and RecommendationRepository
                     is the "what next" read (§5.A's `/v1/paths/recommended`) —
                     the one assembled read that also takes the reader's own
                     state as input (the ids already seen, the goal's rule
                     order); VoteRepository is the public tally plus the
                     per-account cast (§5.A's `/v1/nodes/{id}/votes`); the next
                     two *write* the reader's own state: the path (one document
                     per account) and the per-node reader state (one per
                     account *and* node). AuthRepository is the odd one out: it
                     has no memory implementation, because there is no honest
                     way to verify a credential without a server.
    auth.ts          AuthUser / AuthSession — the verified identity behind a
                     session (§5.A's `/v1/auth/*`): an opaque bearer token plus
                     the user it belongs to. The token is the credential; the
                     server, not the client, decides which account it maps to.
    learning.ts      Recommendation / LearningGoal / LearningPath, plus
                     REASON_SOURCE_EDGE — the vocabulary a path is described
                     in. A path is a *projection over the graph*, never a
                     parallel structure: nothing here stores a hand-ordered
                     node list. `EMPTY_LEARNING_PATH` is the canonical blank a
                     new account starts from, shared by every implementation.
    readerState.ts   The reader's own markings on a single node — the reading
                     toolbar's bookmark, the vocabulary helper's discovered
                     entry ids, the memorizer's recite count, and the
                     Practice tab's takeaway/action note. `EMPTY_READER_STATE`
                     is the canonical blank, shared by every implementation.
    votes.ts         §5.A's `POST /v1/nodes/{id}/votes` tally — `VoteTally`
                     keeps the public `count` and the private `votedByMe` in
                     one object so the button and the number can never
                     disagree; `emptyTally` is the canonical blank.

  infrastructure/
    memory/
      data/
        nodes.ts          The mock node "database" (70 nodes)
        relationships.ts  The mock edge "database"
      MemoryKnowledgeRepository.ts
      MemoryRelationshipRepository.ts
                           Implement the two graph interfaces against the
                           arrays above. A MongoKnowledgeRepository later
                           satisfies the same interface — nothing above
                           this layer changes.
      MemoryLearningPathRepository.ts
                           The path repository against `localStorage`, keyed
                           per account, so the app is still per-account with
                           no server running.
      MemoryReaderStateRepository.ts
                           The per-node reader-state repository, likewise
                           against `localStorage` but keyed per account *and*
                           node — the no-backend stand-in for the same
                           contract.
      MemorySearchRepository.ts
                           §5.A's `/v1/search?q=` with no server: builds §6's
                           `search_index` once at module load over the fixture
                           graph (nothing ever publishes without a server) and
                           runs the same `SearchGraph` the server's twin runs.
      MemoryExploreRepository.ts
                           §5.A's `/v1/explore/{slug}` with no server: runs
                           `assembleExplore` over the fixture graph. No index
                           to build — unlike search, a neighborhood is derived
                           per request from the edges already in hand.
      MemoryRecommendationRepository.ts
                           §5.A's `/v1/paths/recommended` with no server: runs
                           the same pure `recommendNext` the server's twin runs
                           (`RecommendationGraph.ts`) over the fixture graph.
                           Nothing to store — a recommendation is a walk of the
                           graph as it stands, so it always reflects the edges
                           the reader is actually on.
      MemoryVoteRepository.ts
                           §5.A's `/v1/nodes/{id}/votes` with no server: one
                           `localStorage` document maps each node id to the
                           account keys that voted it, so `count` is distinct
                           accounts and `votedByMe` is honest — the same
                           `(account, node)` dedup §6.3 gives the server.
    http/
      httpClient.ts     Thin fetch wrapper shared by the two HTTP
                        repositories. A 404 means "absent" (null); anything
                        else that isn't 2xx throws BackendError — which is
                        what stops "the backend is down" from rendering as
                        "Not found."
      HttpKnowledgeRepository.ts
      HttpRelationshipRepository.ts
                        The same two interfaces over the §5.A REST API.
                        `container.ts` picks between these and the Memory
                        pair; nothing above this layer knows which won.
      meClient.ts       The §5.A `/v1/me/*` transport: reads and writes the
                        account's own state, sending the session token as
                        `Authorization: Bearer <token>` (the server resolves it
                        to an account; the client never names one). Kept
                        separate from `httpClient.ts` because it *writes*, and
                        because it must not collapse a 404 into `null` — "your
                        path" is the account's, so a missing one is the server's
                        honest empty answer and anything else is a real error.
      authClient.ts     §5.A's `/v1/auth/*` transport — register, login,
                        logout, and "who am I". It can't reuse `apiGet`: auth is
                        POST-heavy, and `me` must read a `401` as "nobody is
                        signed in" rather than an error, while every other
                        non-2xx surfaces as a `BackendError` the UI branches on
                        by `code`.
      HttpAuthRepository.ts
                        The §5.A auth repository. `container.ts` exports it only
                        when an API base URL is set — without a backend there is
                        nothing to verify against, so it exports `null` and the
                        app keeps its anonymous local identity.
      HttpLearningPathRepository.ts
                        The path repository — the first one that writes —
                        over `GET`/`PUT /v1/me/path`.
      HttpReaderStateRepository.ts
                        The per-node reader-state repository over `GET`/`PUT
                        /v1/me/nodes/{id}/state`, on the same transport and
                        with the same identity.
      HttpReadingExperienceRepository.ts
                        The assembled-read repository over `GET /v1/reading/{slug}` —
                        one request for the whole DTO instead of reassembling it
                        in the browser from the raw graph endpoints.
      HttpSearchRepository.ts
                        §5.A's `GET /v1/search?q=` over the network. The one
                        caller that does *not* fold `httpClient`'s 404 into
                        "no results": a backend that predates the route must
                        say so, never render as an empty graph.
      HttpExploreRepository.ts
                        §5.A's `GET /v1/explore/{slug}` over the network — one
                        request for the whole neighborhood. Unlike search, the
                        404 *is* "no such node", so it rides the shared
                        `httpClient` and a missing slug comes back as `null`.
      HttpRecommendationRepository.ts
                        §5.A's `GET /v1/paths/recommended` over the network —
                        one request for the next node, carrying the reader's
                        already-seen ids and the goal's rule order as query
                        lists. A `404` (starting slug not published) is `null`
                        via `httpClient`; a `200` whose `next` is `null` means
                        "nothing to suggest from here", so the two stay apart.
      voteClient.ts     §5.A's `/v1/nodes/{id}/votes` transport. The GET is
                        public — the token rides along only when signed in, so
                        `votedByMe` can resolve; the POST requires it, and
                        carries the `Idempotency-Key` §5.A asks of mutating
                        endpoints. Its own module rather than a `meClient`
                        reuse because the read is *not* account-scoped.
      HttpVoteRepository.ts
                        The vote repository over that transport. `get` maps a
                        `404` to `null` ("not a published source", same
                        absent-not-broken rule); `cast` needs the session
                        token and surfaces a `401` as a `BackendError` the
                        hook treats as "cannot vote".
      adminClient.ts    §5.B's Content Management client — the one place
                        that knows about roles (`x-alminhej-roles`). It
                        deliberately does *not* collapse a 404 into `null`
                        the way `httpClient.ts` does: "the node you linked
                        to doesn't exist" is the error an editor needs to
                        see, and refusing it is what stops a duplicate
                        "Sahih al-Bukhari" node from being minted by typo.
      companionClient.ts §7's client — `askCompanion(baseUrl, nodeId,
                        question, lang)`. The browser only ever calls the
                        server route; it holds no key and no Anthropic URL.
                        A `503` is surfaced verbatim so the widget can say
                        "the companion isn't configured" instead of faking
                        an answer.

  application/
    AssembleReadingExperience.ts   Walks nodes + relationships into a
                                    ReadingExperienceDTO — the isnad chain,
                                    commentary, Qur'an cross-references,
                                    related hadith, the "go deeper" pointer,
                                    and the knowledge-graph neighbor list.
                                    This class *is* the in-memory
                                    `ReadingExperienceRepository`, and the
                                    one implementation §5.A's
                                    `GET /v1/reading/{slug}` is faithful to:
                                    `server/readingExperience.mjs` is the
                                    same walk on the server, asserted
                                    byte-for-byte against this one.
    DigitizationProgressService.ts A book's progress is *derived*, never
                                    hand-edited — see "Why this structure"
                                    below.
    RecommendationGraph.ts         §5.A's `/v1/paths/recommended` — the
                                    architecture doc's §4 Strategy, pure and
                                    dependency-free: `recommendNext` walks real
                                    edges (`PART_OF` siblings, `REFERENCES`,
                                    `SIMILAR_TO`, shared `NARRATED_BY`
                                    narrators) from a finished node and returns
                                    the one next node, in the rule order a goal
                                    supplies. Every suggestion carries the one
                                    `Relationship` that justifies it, so the UI
                                    can never claim an edge the graph lacks.
                                    Extracted from the repository-backed
                                    strategy class it used to be, so the *same*
                                    walk can answer from the browser's fixtures
                                    and from the server's store —
                                    `server/recommendations.mjs` is the same
                                    code as plain JS, held together by a parity
                                    check. Rule-based today; an embedding/ML
                                    strategy replaces this module, not a call
                                    site.
    SearchGraph.ts                 §5.A's `/v1/search?q=`, and §6's
                                    `search_index` — pure and dependency-free:
                                    `buildSearchIndex` flattens each
                                    *published* node's title, authored
                                    `search.keywords`, attributes and content
                                    into a searchable text per script, and
                                    `searchGraph` answers a query with
                                    §5.A's `SearchResultDTO[]`. Arabic-aware
                                    folding, but exact-token matching: every
                                    word must land, because a ranked guess is
                                    worse than no result when the corpus is
                                    scripture. `server/search.mjs` is the
                                    same code as plain JS, held together by a
                                    parity check over the whole corpus.
    ExploreGraph.ts                §5.A's `/v1/explore/{slug}` — pure and
                                    dependency-free. `assembleExplore` makes
                                    one pass over the edges touching the node
                                    and returns three *partitions of the same
                                    edge set*: `neighbors`, the era-aware
                                    `timeline` (dated from the node's own
                                    `attributes`, sorted within an era, never
                                    across one), and `crossRefs` (the five
                                    meaning-bearing edge types). Because the
                                    three are sliced in one pass they cannot
                                    disagree about what is adjacent — a
                                    property a separate timeline or cross-ref
                                    query would quietly break. `server/explore.mjs`
                                    is the same code as plain JS, held
                                    together by a parity check over every
                                    published slug.
    container.ts                   The only file that decides *which*
                                    storage implementation is active. Set
                                    `VITE_ALMINHEJ_API_BASE_URL` and the app
                                    talks to the real backend; leave it unset
                                    and it runs on the Memory provider — for
                                    the graph repositories *and* the reader's
                                    own path and per-node state alike. It also
                                    exports `authRepository` as `null` when
                                    there's no backend, since real auth has no
                                    honest in-memory form.

  context/
    SettingsContext.tsx            Interface language, dark mode, reading mode —
                                   the chrome, kept separate from the reading
                                   content's translation language.
    AuthContext.tsx                The reader's session (`useAuth`): holds the
                                   token + user, persists the token in
                                   `localStorage`, and re-verifies it against
                                   `/v1/auth/me` on boot so a token the server
                                   no longer knows is dropped rather than
                                   trusted. With no backend it reports sign-in
                                   as *unavailable* rather than faking a login.

  hooks/
    useAccount.ts              The *anonymous* local identity — the account key
                               used only when no backend is configured, so
                               offline dev still persists per-account state in
                               `localStorage`. A key, not a credential: with a
                               backend, real auth supersedes it entirely.
    useIdentity.ts             The one place that reconciles the two identity
                               sources: the verified session token with a
                               backend, the local anonymous id without one, and
                               `null` when signed out against a backend (in
                               which case the state hooks no-op). What
                               `useLearningPath`/`useReaderState` key off.
    useReadingExperience.ts   Bridges React to the *assembled* read. It asks
                               `readingExperienceRepository`, so with a
                               backend the whole DTO arrives in one request
                               and without one `AssembleReadingExperience`
                               builds it in-process — the hook, and every
                               component above it, is identical either way.
    useLibrary.ts              Global digitization index (Library tab)
    useNodeProgress.ts         Live progress for a single book node
    useReferencedBooks.ts      A node's REFERENCES-linked books (narrator
                                biography sources)
    useKnowledgeNode.ts        Resolve any node by id (source detail modal)
    useReadingIndex.ts         Published reading experiences (Home page)
    useLearningPath.ts         The current path — goal id + the node ids
                               actually opened — read from and written to the
                               account's store through
                               `LearningPathRepository`, so it survives a reload
                               and follows the account rather than the browser.
                               Stores no to-visit list: what comes next is
                               always re-derived from the graph.
    useRecommendation.ts       Asks §5.A's `/v1/paths/recommended` for the next
                               node via `RecommendationRepository` — the
                               suggestion and its "because …" reason, or `null`
                               when no edge leads somewhere readable. With a
                               backend the walk happens server-side; without one
                               the same pure `recommendNext` runs in-process.
                               The hook's contract is unchanged either way.
    useReaderState.ts          The reader's own state for the node on screen —
                               bookmark, discovered vocabulary, recite count,
                               Practice notes — read from and written to the
                               account's store through `ReaderStateRepository`.
                               Keyed by node id, so it resets on navigation and
                               no-ops until the node has resolved; mutations are
                               load-then-write like the path's.
    useVotes.ts                The prioritization tally for the source-detail
                               modal — `VoteRepository`'s public `get` for the
                               count, per-account `cast` for the vote, with one
                               `Idempotency-Key` per (account, node) so a
                               retried POST replays rather than recounts.
                               `canVote` is false for a signed-out reader on a
                               real backend — the button disables rather than
                               pretending.
    useCompanion.ts            Asks §7's server route a free-text question
                               about one node. States are explicit —
                               idle / thinking / answered / unavailable /
                               error — so "not configured" can never render
                               as a fabricated answer.
    useSearch.ts               Runs §5.A's `/v1/search?q=` through
                               `SearchRepository`, debounced, with the states
                               explicit (results / loading / error) and an
                               empty query short-circuited to no results —
                               so a cleared box never shows a request in
                               flight.
    useExplore.ts              Runs §5.A's `/v1/explore/{slug}` through
                               `ExploreRepository`. States are explicit
                               (data / loading / notFound / error), and a
                               rejection is never folded into "no
                               connections" — a dead backend must not look
                               like an isolated node.
    useIsMobile.ts              Responsive breakpoint

  lib/
    contentBlocks.ts   Typed accessors for pulling a specific block off a
                        node's `content` array
    memorize.ts         Deterministic word-occlusion for Memorize mode
    words.ts             Shared clause -> flat word-stream helper
    format.ts             Percentage formatting shared by source components

  components/
    layout/         Header, BottomSheet, BottomTabBar
    onboarding/      Bilingual goal picker (`GoalOnboardingModal`) and
                      reading-mode picker (Arabic First / Guided)
    reader/          Toolbar + compact continuous Arabic canvas + Memorize mode
    chain/           Isnad explorer, driven by IsnadDTO
    graph/           Radial mini knowledge-graph (SVG), driven by real
                      relationship data — no hand-placed mock angles
    sources/         SourceChip, SourceProgressBar, SourceDetailModal —
                      operate directly on KnowledgeNode, not a separate
                      "Source" type
    study/           Tabbed panel: Understand / Vocabulary / Connect /
                      Practice / Library
    companion/       Floating AI companion: the node's three authored
                      prompts are quick-start buttons, plus a free-text
                      question box. Every answer is a grounded call to §7 —
                      labelled AI-generated, and never shown for a node
                      that has no `ai_context` block.
    ui/              Pill, Card, IconBadge primitives

  pages/
    HomePage.tsx     Lists published reading experiences from the graph
    ReadingPage.tsx  Composes the responsive reading studio around one
                      ReadingExperienceDTO
    SearchPage.tsx   §5.A's `/v1/search?q=` as a screen (`/search`). The
                      query lives in the URL, so a result list is a link you
                      can share; each row names *why* it matched (title,
                      keyword or content) and links into `/reading/{slug}`.
                      The Library shelf's box hands its query here rather than
                      faking a shelf-local filter — the index spans the whole
                      graph, not the books on one shelf.
    ExplorePage.tsx  §5.A's `/v1/explore/{slug}` as a screen
                      (`/explore/:slug`) — the graph as its own view rather
                      than a tab inside a reading session. The center's
                      neighborhood draws on `MiniGraph`; beside it the
                      era-aware timeline lists each dated neighbor
                      (`label · era`, each a link into `/reading/{slug}`) and
                      a "See also" section lists the cross-references. An
                      unknown slug says so and offers the way back; a
                      backend error never renders as "nothing is connected".
                      `ConnectTab` links here instead of growing a second,
                      thinner copy of the same graph.
    AuthScreen.tsx   The §5.A sign-in/register screen at `/signin` — one form
                      for both, since they differ only in which call they make.
                      Validation is the browser's, so messages match the
                      reader's locale; the server's error `code` decides the
                      rest. When no backend is configured it says so honestly
                      instead of offering a login that can't work.
    AdminPage.tsx    The §5.B editor workbench (/admin) — create a HADITH
                      node, attach content blocks, link it to a node that
                      already exists via autocomplete, and move it through
                      draft → in_review → published. Plain on purpose: it's
                      a workbench, not a reading experience. It reads the
                      target book's progress through the *same*
                      AssembleReadingExperience the reading app uses, so
                      what it shows is what a reader will see.

server/
  api-server.mjs     §5.A + §5.B + §7 over plain `node:http`, zero
                     dependencies. The graph is seeded from the same JSON
                     fixtures the Memory provider ships, and every write the
                     server accepts — nodes, edges, accounts, sessions,
                     learning paths, per-node reader state, vote tallies, the
                     search index, the companion log
                     — goes through `store.mjs`. §5.A's auth is real:
                     `POST /v1/auth/register`, `/login`, `/logout` and
                     `GET /v1/auth/me`, with passwords salted and hashed via
                     `scrypt` (compared in constant time) and an opaque random
                     session token — not a JWT, so there is no signing key to
                     leak and logout is a real delete. `/v1/me/*` resolves the
                     account from `Authorization: Bearer <token>` and stores
                     each account's own state through the same store — the
                     learning path (`GET`/`PUT /v1/me/path`) and the per-node
                     reader state (`GET`/`PUT /v1/me/nodes/{id}/state`).
                     §5.A's `GET /v1/reading/{slug}` returns the *whole*
                     assembled reading DTO in one call — the same object the
                     client assembles in-process without a backend, so the
                     reading screen never has to reassemble it from raw edges.
                     §5.A's `GET /v1/search?q=` answers over §6's
                     `search_index`, refreshed on every create, PATCH and
                     publish — a missing `q` is a `400`, an empty or unmatched
                     one is an empty `200`. §5.A's `GET /v1/explore/{slug}`
                     returns the node's whole neighborhood — `neighbors`,
                     `timeline` and `crossRefs` — in one call, 404 when no
                     *published* node carries the slug. §5.A's
                     `GET /v1/paths/recommended?from={slug}` returns the single
                     next node the graph supports from there, honoring the
                     caller's already-seen `exclude` ids and a goal's `prefer`
                     rule order; a missing `from` is a `400`, an unknown slug a
                     `404`, and a real node with nothing readable ahead is an
                     honest `200` with `next: null`. `GET /v1/nodes/{id}/votes`
                     is the public tally — `count` for everyone, `votedByMe`
                     only with a live session — and `POST` casts one, per
                     account: no session is a `401`, a repeat vote or a replayed
                     `Idempotency-Key` returns the same tally rather than
                     counting twice, all persisted in §6's `votes` collection.
                     `npm run api`.
  store.mjs          §6's document model, and the seam a real database slots
                     into. Until Prompt 10 the server held all of its state in
                     module-level arrays and Maps, so an editor's publish, a
                     registered account and a reader's path died with the
                     process — which hollowed out the Content Management API's
                     whole point. Now each §6 collection (`knowledge_nodes`,
                     `relationships`, `users`, the session tokens,
                     `learning_paths`, `user_progress`, `votes`,
                     `search_index`, `ai_sessions`)
                     hydrates at boot and writes through after each mutation.
                     Zero dependencies still: a collection is `all()` /
                     `replace()`, persisted as one JSON file per collection with
                     atomic writes, which is the same two methods a Mongo
                     adapter implements with `find` / `insertMany`. Off by
                     default, so `npm run api` on its own writes nothing and the
                     server's read surface stays comparable to the client's
                     Memory provider; `ALMINHEJ_DATA_DIR` turns it on, and
                     `/v1/health` reports which mode is live.
  readingExperience.mjs §5.A's `/v1/reading/{slug}`: the server-side twin of
                     `AssembleReadingExperience`, walking the published
                     graph into the same `ReadingExperienceDTO` — isnad,
                     commentary, references, the "go deeper" pointer, and the
                     neighbor list — in one response. Kept as a port rather
                     than a shared import (the browser and the server can't
                     share a module here), and held to the client assembler
                     by a parity check that compares both over every slug.
  search.mjs         §5.A's `/v1/search?q=`: the server-side twin of
                     `application/SearchGraph.ts` — the same index and the
                     same query as plain JS, since the browser and the server
                     can't share a module here either. Only *published* nodes
                     are indexed, for the same reason only published nodes are
                     readable: a draft becoming findable would be a content
                     leak. Held to the client implementation by a parity check
                     that compares index and query results over the whole
                     corpus, harakat and all.
  explore.mjs        §5.A's `/v1/explore/{slug}`: the server-side twin of
                     `application/ExploreGraph.ts` — the same one-pass
                     `assembleExplore` as plain JS. Only *published* nodes are
                     visible, so an edge pointing at a draft is not a neighbor
                     and a draft's own slug is 404-shaped. Held to the client
                     assembler by a parity check that compares the whole DTO
                     over every published slug.
  recommendations.mjs §5.A's `/v1/paths/recommended`: the server-side twin of
                     `application/RecommendationGraph.ts` — the same rule-ordered
                     walk as plain JS, from a finished node to the one next node,
                     with the `via` edge that justifies it. Destinations are only
                     ever *published* nodes with content, so a draft sibling is
                     never suggested. Held to the client module by a parity check
                     that compares the whole DTO over every published slug,
                     across every goal ordering and several exclude sets.
  knowledgeContext.mjs  §7's `KnowledgeContextBuilder`: given a node id,
                     assembles that node's own content plus a *bounded*
                     slice of its immediate graph neighbors (only
                     EXPLAINS / REFERENCES / NARRATED_BY / PART_OF, capped
                     by count and characters) into the context sent to the
                     model. The AI layer never touches storage directly —
                     this is the one seam between the graph and the LLM.
  companion.mjs      The prompt contract, kept out of the HTTP server so
                     it can be tested with no network: a system prompt that
                     permits *only* the supplied context, requires an
                     explicit decline ("Do NOT guess") when the question
                     falls outside it, and mandates the AI-generated
                     self-identification the reading UI already uses.
                     `askClaude` takes an injectable `fetch`, which is how
                     the outbound call shape is asserted in tests.
```

### Why this structure

- **A learning path is a traversal, not a stored list.** The goal picker
  (`components/onboarding/GoalOnboardingModal.tsx`) and the goal definitions
  (`data/goals.ts`) give the reader *two* things and nothing more: a seed
  node (by slug) and an ordering of rules. What comes next is computed every
  time by walking the same edges the reading experience walks — now through
  §5.A's `GET /v1/paths/recommended` (`RecommendationGraph.ts` client-side,
  its server twin when a backend is configured) — which is why a path cannot
  drift out of sync with the graph: there is no second copy of it to drift.
  `useLearningPath` persists only the goal id and the node ids actually
  opened; the "next" card on the home page is derived from those (the ids
  travel back to the endpoint as `exclude`), and a recommendation that has no
  edge to stand on says so instead of inventing one.
- **The reader's path is per account, and that swap happened behind the
  repository boundary.** `localStorage` was the right place to *prove* the
  path, but a path that exists in one browser is a session, not a path.
  `useLearningPath` now reads and writes through `LearningPathRepository` —
  the first repository in this codebase that *writes* — so the same hook, the
  same components, and the same page keep working while the store moves from
  the browser to the server. Identity is deliberately minimal: the client
  mints one opaque token (`useAccount`) and sends it as `x-alminhej-account`,
  and the server keys each path by it (the shape of §6's `learning_paths`). It
  is an identity, not a credential — no password, no JWT — which is the honest
  floor for "per-account", and the seam real `/v1/auth/*` slots into later.
  Two details worth keeping: mutations are *load-then-write*, so a visit
  recorded before the first read lands can't clobber the stored path with an
  empty one; and when the backend is unreachable the hook no-ops rather than
  fabricating a path, the same "don't paper over a missing backend" rule the
  rest of the HTTP layer follows.
- **The AI layer is grounded by construction, and the key is server-only.**
  §7's rule is that the model never touches storage — it only ever sees a
  `KnowledgeContextBuilder`-assembled slice of the graph.
  `server/knowledgeContext.mjs` *is* that builder, and it is deliberately
  bounded (a capped neighbor count and snippet length), so a question that
  falls outside the node's assembled context is one the system prompt is
  required to decline rather than answer. The browser only calls the route;
  `ANTHROPIC_API_KEY` is read from `process.env` inside the server and is
  never serialized into the client bundle. When no key is set the endpoint
  returns `503 COMPANION_UNAVAILABLE` and the widget says the companion
  isn't configured — there is no code path that produces a fabricated
  answer.
- **A book's digitization progress is computed, not maintained.**
  `DigitizationProgressService.indexedUnitsFor(book)` counts published
  nodes that actually point at that book (`PART_OF` incoming, or
  `EXPLAINS` outgoing). Publish a new hadith node with an edge to Bukhari,
  and its progress bar moves on its own — there's no counter to edit and
  therefore no way for two lessons citing the same book to disagree about
  its progress. The *producer* of that signal now exists too: §5.B's
  `/publish` is the only thing that flips a node to `published`, and
  because the count is derived there is nothing else to recompute — a
  reviewer's publish *is* the progress update. (At Bukhari's real
  7,563-unit scale one hadith is a sub-percent change, so what visibly
  moves is the digitized count in `SourceDetailModal`; on a 42-unit book
  like Sharh al-Arba'in the bar fill itself moves.) This directly closes
  out what was `PROMPTS.md` Prompt 11 in the previous (Lesson-centric)
  version of this repo.
- **`PART_OF` vs. `REFERENCES` is a deliberate, load-bearing distinction.**
  A hadith `PART_OF` a book is a digitization signal. A narrator's
  transmission route `REFERENCES` a book (which compilation their chain
  reaches) is *not* — it's provenance, not content. Mixing these up is an
  easy mistake (an earlier draft of this dataset did exactly that, caught
  via a runtime smoke test, not the type checker) — see the comment above
  the branch-narrator edges in `infrastructure/memory/data/relationships.ts`.
- **The repository interfaces never import a storage technology.**
  `domain/repositories.ts` has zero knowledge of arrays, MongoDB, or HTTP.
  `infrastructure/memory/*` is one implementation; `container.ts` is the
  single place that decides which implementation is active.
- **The server's state has a store, and switching it on changes nothing above
  it.** `server/store.mjs` is §6's document model — one JSON file per
  collection, a two-method collection API, atomic writes — and it is the reason
  an editor's publish, a reader's path, and a registered account outlive the
  process. It is deliberately *opt-in*: with `ALMINHEJ_DATA_DIR` unset the
  server behaves exactly as it did before, which keeps `npm run api`
  dependency-free and keeps the server's read surface comparable to the client's
  Memory provider — an edited, persisted graph is, correctly, *not* the fixture
  graph, and a parity check between the two only means something while both are
  seeded from the same fixtures. `/v1/health` reports which mode is live rather
  than leaving it to be discovered, the same way it reports `companion`.
- **`SettingsContext` separates "interface language" from "translation
  language."** `uiLang` (ar/en) drives the whole chrome. `subtitleLang`
  (en/fr/es) only affects the optional line-by-line gloss under the
  Arabic text.
- **The reading canvas is never replaced, on any screen size.** Below
  1040px, `ChainOfNarration` and `StudyPanel` render inside a `BottomSheet`
  overlay instead of a static `<aside>` — same components, no duplication.

## Design tokens

Defined once in `src/index.css` via CSS custom properties (swapped by the
`.dark` class), consumed through Tailwind arbitrary values:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-emerald` | `#0E4F3F` | `#3E8C6F` | Primary brand, active states |
| `--color-gold` | `#B4863A` | `#D9B876` | Accent — used sparingly |
| `--color-bg` / `--color-panel` | ivory / white | near-black slate | Backgrounds |
| `--color-ink` / `--color-sub` | dark slate / muted | ivory / muted | Text |

Fonts: **Fraunces** (English display), **Amiri** (Qur'anic/hadith Arabic),
**Cairo** (Arabic interface chrome), **Inter** (Latin interface chrome).

## What's built vs. what's next

Built: the full `KnowledgeNode`/`Relationship` domain model, a working
Repository + Memory-provider layer (Clean Architecture, ready for a real
backend to slot in underneath), derived digitization progress, the isnad
chain reconstructed from graph edges (not a hand-authored `chain` array),
the mini knowledge-graph rendered from real relationships, Vocabulary
Helper, Source Library, and Memorize mode. Thirteen reading experiences
are authored, all of them assembled by the same unmodified service. A real
HTTP backend (`server/`, `npm run api`) now sits behind the same repository
interfaces, selectable by env var, and on top of it the §5.B Content
Management API plus the `/admin` workbench: an editor creates a node,
attaches content blocks, links it to an existing book or narrator by
autocomplete, and moves it `draft → in_review → published` — with publish
reserved for `scholar-reviewer`/`admin`, so an editor alone cannot release
their own work. **Guided Learning Paths** are now built on top of the same
graph: a bilingual "why are you here?" goal picker seeds a path, and every
"next" suggestion is a real edge traversal with a visible "because …" reason
— never a hand-authored list. That path now lives on the server, one per
account, behind `LearningPathRepository` — so it survives a reload and follows
the account rather than the browser, and none of the components that show it
changed to make that true. **The AI Companion** is now grounded rather
than canned: the three authored prompts are quick-start buttons beside a
free-text box, and every answer comes from §7's server route over a bounded,
builder-assembled slice of the graph — labelled AI-generated, declining
questions that fall outside its context, and shipping no API key to the
client. **The reader's own state is now server-side too.** The learning path
was the first thing to move off `localStorage`; the remaining per-node reader
state — the toolbar bookmark, discovered vocabulary, recite count, and the
Practice tab's takeaway/action note — has followed it behind the same boundary,
as one document per account *and* node (`ReaderStateRepository`). So it survives
a reload and follows the account rather than the browser, and `useLocalStorage`
is now gone from the tree entirely: every piece of reader-generated data goes
through a repository, Memory or HTTP, chosen in one place. **The last piece of
local state has moved too: the source-detail vote tally.** §5.A's
`GET`/`POST /v1/nodes/{id}/votes` is now real — the count is a public read
(`votedByMe` only resolves with a session), casting is per-account and idempotent
both by §6.3's `(userId, nodeId)` compound and by `Idempotency-Key`, and the
documents live in §6's `votes` collection so they survive a restart. With no
backend the Memory provider keeps the same tally in `localStorage`, so nothing
above `infrastructure/` knows the difference. And
**that account is no longer a self-minted token.** `x-alminhej-account` — a
value the client invented and the server took on faith — is gone; in its place
are real `/v1/auth/*` endpoints: register and login with an email and a
password, a `scrypt`-hashed, constant-time-verified credential, and an opaque
session token sent as `Authorization: Bearer`, from which the server resolves
the account. The old header grants access to nothing, a missing or forged token
on `/v1/me/*` is a `401`, and a login failure can't be used to tell which
emails exist. `AuthProvider`/`useAuth` carry the session on the client, the
sign-in screen lives at `/signin`, and `hooks/useIdentity.ts` decides what
"the account key" means in each mode — the session token with a backend, the
anonymous local id without one. There is deliberately no in-memory auth:
without a backend, sign-in reports itself as unavailable rather than pretending.
And the reading screen's own read has moved behind that boundary too: the
*assembled* experience — isnad, commentary, references, the "go deeper" pointer,
and the graph neighbors — is now §5.A's `GET /v1/reading/{slug}`, one request
for the whole DTO instead of three graph round trips reassembled in the browser.
`AssembleReadingExperience` is still the in-process implementation of the same
interface, so the Memory path assembles locally while the server assembles
identically in `server/readingExperience.mjs` — the two are held together by a
parity check that compares both over every published slug. And the server's own
state now outlives the server: §6's collections — the graph, accounts, sessions,
each account's path and per-node reader state, the companion log — hydrate at
boot through `server/store.mjs` and write through on every mutation, so an
editor's publish is still a publish, a reader's path is still theirs, and a
registered account can still log in after a restart. It is one env var
(`ALMINHEJ_DATA_DIR`) away and off by default, so nothing about the in-memory
story changed for anyone who doesn't ask for it. See `PROMPTS.md`, Prompt 10.
And the graph is now **searchable**: §5.A's `GET /v1/search?q=` — the last
public endpoint the doc names that nothing implemented — reads across every
type at once, so a word finds a hadith, a book, a narrator and a verse in one
list rather than only whatever the shelf on screen happened to hold. The
index is §6's `search_index`, refreshed whenever a node's text changes
(create, PATCH, publish — not only publish, since a PATCH on a live node would
otherwise leave text findable in the graph but not in search) and persisted
through the same store, so a restart doesn't re-derive it. Matching is
Arabic-aware — harakat, tatweel and Qur'anic marks are stripped, `آأإٱ`
folded to `ا` and `ىئ` to `ي`, so `إنما الأعمال بالنيات` finds the same hadith
as `انما الاعمال بالنيات` — but stays **exact-token and AND-ed**, because a
ranked near-miss is worse than no answer when the corpus is scripture. Each
row says which field it hit (title, keyword, or content) and ranks by field
weight times §3.1's authored `boost`; the excerpt is sliced from the original
text, so the fold never reaches the reader. The client has a `/search` screen
(its query in the URL, so a result list is shareable), a Header entry, and a
Library box that hands its query over instead of faking a shelf-local filter.
Both implementations — `application/SearchGraph.ts` and `server/search.mjs` —
are held together by a parity check over the whole corpus. See `PROMPTS.md`,
Prompt 11. And the graph is now something you can **look at**: §5.A's
`GET /v1/explore/{slug}` — the last public read the doc names that nothing
implemented — answers with a node's whole neighborhood in one call. It returns
three views of *one* adjacency list, sliced in a single pass so they cannot
disagree with each other: `neighbors` (every edge touching the node, either
direction), `crossRefs` (the neighbors it reaches by meaning rather than
structure — `REFERENCES`, `SIMILAR_TO`, `core_concept`, `thematic_link`,
`related_hadith`) and `timeline` (the dated neighbors, in order). The timeline
is deliberately **era-aware** rather than globally sorted: a narrator or event
is dated in CE and a book by its Hijri era label, so each entry carries its
`era` and the sort only ever orders *within* one — interleaving Hijri and
Gregorian years by raw number would assert a chronology the data does not
carry. Only published nodes appear, exactly as everywhere else in §5.A. The
client has an `/explore/:slug` screen — the neighborhood on `MiniGraph`, the
timeline and a "See also" list beside it — and `ConnectTab` now hands off to it
instead of growing a second, thinner copy of the same graph inside a reading
session. `application/ExploreGraph.ts` and `server/explore.mjs` are held
together by a parity check over every published slug, client and server
byte-identical. See `PROMPTS.md`, Prompt 12.

## Scalability notes

- This whole app currently runs against 70 hand-authored nodes and 133
  edges. The model's real test — a second reading experience with no code
  change — is already met: `app/` ships thirteen, added as data only. See
  `PROMPTS.md`, Prompt 1.
- `MiniGraph`'s layout is a simple even-angle radial spread
  (`360 / neighbors.length`), which works for a handful of neighbors and
  will get crowded past ~10-12. A real force-directed layout (`d3-force`)
  is the natural upgrade once a node has that many edges.
- `container.ts` is the swap point for a real backend, and the swap has now
  been done: two repository classes and the provider selection in
  `container.ts`, and every hook, component and application service stayed
  put. The one thing the move did expose is that `useReadingExperience` had
  no rejection path — nothing with Memory can fail, so a dead backend would
  have meant a permanently blank reading screen. That gap is closed, and a
  `404` still means "not found" rather than "broken". Per the architecture
  doc's §8 migration argument, which this repo *is* the fulfillment of, one
  level down: adapter-free, because the frontend was rebuilt to speak the
  graph model directly instead of being adapted to it.
