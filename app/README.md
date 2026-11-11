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
    dto.ts           ReadingExperienceDTO and friends — what a real
                     `GET /v1/reading/{slug}` would return
    repositories.ts  KnowledgeRepository / RelationshipRepository /
                     LearningPathRepository / ReaderStateRepository interfaces
                     — the storage-agnostic boundary. The first two read the
                     authored graph; the last two *write* the reader's own
                     state: the path (one document per account) and the
                     per-node reader state (one per account *and* node).
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
                        account's own state, sending the opaque account token
                        as `x-alminhej-account`. Kept separate from
                        `httpClient.ts` because it *writes*, and because it
                        must not collapse a 404 into `null` — "your path" is
                        the account's, so a missing one is the server's honest
                        empty answer and anything else is a real error.
      HttpLearningPathRepository.ts
                        The path repository — the first one that writes —
                        over `GET`/`PUT /v1/me/path`.
      HttpReaderStateRepository.ts
                        The per-node reader-state repository over `GET`/`PUT
                        /v1/me/nodes/{id}/state`, on the same transport and
                        with the same identity.
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
    DigitizationProgressService.ts A book's progress is *derived*, never
                                    hand-edited — see "Why this structure"
                                    below.
    RecommendationStrategy.ts      The architecture doc's Strategy pattern:
                                    given a finished node and the graph,
                                    walk real edges (`PART_OF` siblings,
                                    `REFERENCES`, `SIMILAR_TO`, shared
                                    `NARRATED_BY` narrators) to suggest a
                                    next node. Every suggestion carries the
                                    one `Relationship` that justifies it, so
                                    the UI can never claim an edge the graph
                                    lacks. Rule-based today; an
                                    embedding/ML strategy replaces this
                                    class behind the same interface.
    container.ts                   The only file that decides *which*
                                    storage implementation is active. Set
                                    `VITE_ALMINHEJ_API_BASE_URL` and the app
                                    talks to the real backend; leave it unset
                                    and it runs on the Memory provider — for
                                    the graph repositories *and* the reader's
                                    own path and per-node state alike.

  hooks/
    useAccount.ts              The reader's identity: an opaque token minted
                               once and kept in `localStorage`, sent to the
                               server as `x-alminhej-account`. An identity,
                               not a credential — there is no password and
                               nothing is verified.
    useReadingExperience.ts   Bridges React to AssembleReadingExperience,
                               modeled as async even though Memory
                               resolves instantly — so swapping to a real
                               fetch() later doesn't change any component.
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
    useRecommendation.ts       Runs `recommendationStrategy.recommend` for a
                               node and reports both the suggestion and its
                               "because …" reason
    useReaderState.ts          The reader's own state for the node on screen —
                               bookmark, discovered vocabulary, recite count,
                               Practice notes — read from and written to the
                               account's store through `ReaderStateRepository`.
                               Keyed by node id, so it resets on navigation and
                               no-ops until the node has resolved; mutations are
                               load-then-write like the path's.
    useCompanion.ts            Asks §7's server route a free-text question
                               about one node. States are explicit —
                               idle / thinking / answered / unavailable /
                               error — so "not configured" can never render
                               as a fabricated answer.
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
                     dependencies. Serves the same JSON fixtures the
                     Memory provider ships, keeps §5.B's writes in memory
                     for the life of the process, and stores each account's
                     own state the same way — the learning path (`GET`/`PUT
                     /v1/me/path`) and the per-node reader state (`GET`/`PUT
                     /v1/me/nodes/{id}/state`), both keyed by the
                     `x-alminhej-account` token. `npm run api`.
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
  time by `RecommendationStrategy` walking the same edges the reading
  experience walks, which is why a path cannot drift out of sync with the
  graph — there is no second copy of it to drift. `useLearningPath` persists
  only the goal id and the node ids actually opened; the "next" card on the
  home page is derived from those, and a recommendation that has no edge to
  stand on says so instead of inventing one.
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
through a repository, Memory or HTTP, chosen in one place. What remains local
is the source-detail vote tally (plain component state, never persisted) and
identity itself — `x-alminhej-account` is an identity, not a credential, and
real auth (`/v1/auth/*`) is the honest next step — see `PROMPTS.md`, Prompt 7.

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
