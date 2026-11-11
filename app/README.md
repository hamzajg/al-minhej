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
    repositories.ts  KnowledgeRepository / RelationshipRepository
                     interfaces — the storage-agnostic boundary

  infrastructure/
    memory/
      data/
        nodes.ts          The mock node "database" (70 nodes)
        relationships.ts  The mock edge "database"
      MemoryKnowledgeRepository.ts
      MemoryRelationshipRepository.ts
                           Implement the domain interfaces against the
                           arrays above. A MongoKnowledgeRepository later
                           satisfies the same interface — nothing above
                           this layer changes.
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

  application/
    AssembleReadingExperience.ts   Walks nodes + relationships into a
                                    ReadingExperienceDTO — the isnad chain,
                                    commentary, Qur'an cross-references,
                                    related hadith, the "go deeper" pointer,
                                    and the knowledge-graph neighbor list.
    DigitizationProgressService.ts A book's progress is *derived*, never
                                    hand-edited — see "Why this structure"
                                    below.
    container.ts                   The one file that wires Memory
                                    providers into the application service.
                                    Swapping to a real backend later means
                                    changing two lines here.

  hooks/
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
    useIsMobile.ts              Responsive breakpoint
    useLocalStorage.ts          Lightweight local persistence

  lib/
    contentBlocks.ts   Typed accessors for pulling a specific block off a
                        node's `content` array
    memorize.ts         Deterministic word-occlusion for Memorize mode
    words.ts             Shared clause -> flat word-stream helper
    format.ts             Percentage formatting shared by source components

  components/
    layout/         Header, BottomSheet, BottomTabBar
    onboarding/      Bilingual reading-mode picker (Arabic First / Guided)
    reader/          Toolbar + compact continuous Arabic canvas + Memorize mode
    chain/           Isnad explorer, driven by IsnadDTO
    graph/           Radial mini knowledge-graph (SVG), driven by real
                      relationship data — no hand-placed mock angles
    sources/         SourceChip, SourceProgressBar, SourceDetailModal —
                      operate directly on KnowledgeNode, not a separate
                      "Source" type
    study/           Tabbed panel: Understand / Vocabulary / Connect /
                      Practice / Library
    companion/       Floating AI companion, grounded in the node's
                      ai_context block
    ui/              Pill, Card, IconBadge primitives

  pages/
    HomePage.tsx     Lists published reading experiences from the graph
    ReadingPage.tsx  Composes the responsive reading studio around one
                      ReadingExperienceDTO
```

### Why this structure

- **A book's digitization progress is computed, not maintained.**
  `DigitizationProgressService.indexedUnitsFor(book)` counts published
  nodes that actually point at that book (`PART_OF` incoming, or
  `EXPLAINS` outgoing). Publish a new hadith node with an edge to Bukhari,
  and its progress bar moves on its own — there's no counter to edit and
  therefore no way for two lessons citing the same book to disagree about
  its progress. This directly closes out what was `PROMPTS.md` Prompt 11
  in the previous (Lesson-centric) version of this repo.
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
interfaces, selectable by env var. AI Companion still returns static canned
answers (no real model call yet). Guided Learning Paths and cross-session
Progress Tracking are not yet built — see `PROMPTS.md`.

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
