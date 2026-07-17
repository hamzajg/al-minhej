# Al-Minhej Data Model Specification - Mock

> Target model for the static, client-fetched JSON corpus. Supersedes the mock structure
> reviewed earlier. Runtime remains plain JSON under `public/api/**` — no backend, no DB.
> Everything "derived" here is generated at **build time** from hand-authored **source** files,
> never hand-maintained in parallel.

---

## 0. Design Principles

1. **One source of truth per fact.** Book metadata, hadith↔book membership, and isnad chains
   each live in exactly one authored place. Everything else that looks like that fact is generated.
2. **Source files vs. served files are different things.** Authors edit small, per-entity source
   files. A build step compiles them into the flat/denormalized files the app actually fetches
   (indexes, aggregates). Consumers never see partial or hand-synced denormalization.
3. **Identity is `id`, always.** `slug` is a routing/display concern only, resolved through one
   generated lookup table, never re-derived ad hoc.
4. **Localization is a type, not a convention.** Every human-facing string is `Localized<T>`,
   validated against one fixed locale-required-set + optional-set.
5. **`content[]` is an open, versioned block registry.** New block types are additive; old
   readers can skip block types they don't recognize without breaking.
6. **Isnad is data, not a graph-traversal side-effect.** Chains are authored/generated as ordered,
   addressable objects (see §5), not inferred at render time from `NARRATED_BY` edges.
7. **Nothing is "probably fine."** Every invariant in §8 is mechanically checkable in CI.

---

## 1. File / Endpoint Layout

### 1.1 Authored (source) tree — not fetched by the app directly

```
data/
├── books/
│   └── <book-slug>/
│       ├── book.yaml                     # one file, one book, canonical metadata
│       └── pages/
│           └── page-<n>.yaml             # one file, one page: page meta + hadith IDs it contains
├── nodes/
│   ├── hadith/<hadith-slug>.yaml         # one file per hadith (metadata + content[])
│   ├── verse/<verse-slug>.yaml
│   ├── concept/<concept-slug>.yaml
│   ├── event/<event-slug>.yaml
│   └── narrator/<narrator-slug>.yaml
├── isnad/
│   └── <hadith-slug>/
│       ├── primary.yaml                  # exactly one primary chain
│       └── branch-<n>.yaml               # zero or more branch chains
└── relationships/
    ├── references.yaml                   # REFERENCES, SIMILAR_TO, thematic_link, contextual
    └── explains.yaml                     # EXPLAINS / commentary-work links
```

Authoring in YAML (or JSON, either works) keeps diffs small and per-entity files reviewable.
`PART_OF`, `NARRATED_BY`, `contained_in`, `narrator_in`, `full_chain_source`, `collected_in` are
**removed as hand-authored edges** — all are generated (§4, §6) from book/page/isnad source files,
which are the actual sources of truth for those facts.

### 1.2 Served (built) tree — what `public/api/**` actually contains

```
public/api/
├── v1/
│   ├── books/
│   │   ├── index.json                    # generated: array of BookSummary
│   │   └── <book-slug>.json              # generated: full Book (was book.json)
│   ├── pages/
│   │   └── <book-slug>/
│   │       └── page-<n>.json             # generated: Page + resolved Hadith refs (lazy-loadable)
│   ├── nodes/
│   │   └── <type>/<slug>.json            # generated: one node per file, fetched on demand
│   ├── isnad/
│   │   └── <hadith-slug>.json            # generated: { primary, branches[] } — see §5
│   ├── relationships/
│   │   ├── by-node/<node-id>.json        # generated: edges touching this node (sharded)
│   │   └── all.json                      # generated: full edge list, for graph-view / admin tooling only
│   └── index/
│       ├── slugs.json                    # generated: slug → { id, type }
│       ├── by-type.json                  # generated: type → id[]
│       └── manifest.json                 # generated: schemaVersion, build hash, counts, locale coverage
└── legacy/                               # adapter shims for old paths, see §7
```

**Why this shape scales:**
- Per-node, per-page files stay small and cacheable regardless of corpus size; nothing requires
  loading "all nodes" to render one hadith.
- `relationships/by-node/<id>.json` avoids ever shipping the full edge array (~120 today, but
  O(edges) grows faster than O(nodes) at 100×) to a client that only needs one node's edges.
  `all.json` is kept only for internal graph-exploration tooling, not the reading UI.
- Everything under `public/api/v1/` is **build output** — safe to `rm -rf` and regenerate.

---

## 2. Core Shared Types

```ts
// Fixed, enforced locale set. Adding a locale = one place to change + a migration, not a convention.
type Locale = "ar" | "en" | "fr" | "es";
const REQUIRED_LOCALES: Locale[] = ["ar", "en"];       // must always be present
const OPTIONAL_LOCALES: Locale[] = ["fr", "es"];       // may be partial or absent

// Every human-facing string field uses this. Required locales are enforced by schema,
// not by convention — see §8.2.
type Localized<T = string> = Partial<Record<Locale, T>> & Pick<Record<Locale, T>, "ar" | "en">;

type NodeId = string;     // stable, immutable, e.g. "hadith-arbain-1"
type Slug = string;       // human/URL-facing, mutable via redirect table, e.g. "arbain-1"

type NodeStatus = "draft" | "in_review" | "approved" | "published" | "archived";

type NodeType = "HADITH" | "VERSE" | "CONCEPT" | "EVENT" | "NARRATOR" | "BOOK" | "PAGE";

interface NodeBase {
  id: NodeId;
  type: NodeType;
  slug: Slug;
  status: NodeStatus;
  title: Localized;
  schemaVersion: 2;
  attributes: unknown;      // narrowed per type, see §3
  content: ContentBlock[];  // may be empty; emptiness is meaningful, see §3.4
  createdAt: string;        // ISO date, set once
  updatedAt: string;        // ISO date, bumped by build/authoring tool
}
```

---

## 3. Node Schema

### 3.1 Per-type `attributes` (discriminated union — no more ad hoc catch-all)

```ts
type Attributes =
  | { kind: "hadith"; grade: Localized; isnadType: "short" | "full" | "mursal" }
  | { kind: "verse"; ref: { surah: number; ayahStart: number; ayahEnd: number }; refLocalized: Localized }
  | { kind: "concept" }
  | { kind: "event"; dateStart: string /* ISO or ISO-hijri, see §3.2 */; dateEnd?: string }
  | { kind: "narrator"; dateBirth?: string; dateDeath?: string; grade: Localized;
      isnadDepth: number /* generated, not authored — see §6 */ }
  | { kind: "book"; author: Localized; eraLabel: Localized;
      digitization: { totalUnits: number; authoredUnits: number /* generated */; unit: Localized } }
  | { kind: "page"; bookId: NodeId; pageNum: number; hadithIds: NodeId[] /* authored here, nowhere else */ };
```

`digitization.authoredUnits` is **generated** at build time by counting actually-authored hadith
for that book, so `totalUnits` (claimed corpus size) and `authoredUnits` (what's real today) can
never silently diverge without being visible in `manifest.json`.

### 3.2 Dates

All `date*` fields are ISO 8601 strings. Hijri-only events use an explicit
`{ calendar: "hijri"; value: string }` wrapper rather than a bare string, so date fields are never
ambiguous between calendars — this replaces the free-text `dates` field used today.

### 3.3 Content block registry (open/extensible)

```ts
interface ContentBlockBase {
  type: string;             // open string, but must be one of the registered types below
  blockVersion: number;     // per-block-type version, independent of node schemaVersion
}

type ContentBlock =
  | (ContentBlockBase & { type: "clauses"; intro: Localized; items: ClauseItem[] })
  | (ContentBlockBase & { type: "vocabulary"; entries: VocabEntry[] })
  | (ContentBlockBase & { type: "commentary"; scholar: Localized; workNodeId: NodeId; note: Localized })
  | (ContentBlockBase & { type: "context"; title: Localized; body: Localized })
  | (ContentBlockBase & { type: "ai_context"; items: AiPrompt[] })   // fixed, see below
  | (ContentBlockBase & { type: "quiz"; questions: QuizQuestion[] });

interface ClauseItem { id: string /* addressable, see §3.5 */; text: Localized }

interface VocabEntry {
  id: string; word: string; root?: string; pron?: string;
  occurrences: number[];    // clause ids this word occurs in, replaces fragile `occ: 1`
  gloss: Localized;
}

// Fixes problem #9: prompts/answers are no longer parallel arrays keyed by index.
interface AiPrompt { key: string; question: Localized; answer: Localized }

interface QuizQuestion {
  question: Localized;
  options: { id: string; text: Localized }[];
  correctOptionId: string;   // was a raw index — an id survives reordering
}
```

Unknown `type` values in `content[]` are **ignored, not rejected**, by readers built against an
older `blockVersion` set — this is what makes the registry additive. A new block type ships
alongside a schema entry and a bump to that block's own `blockVersion`; node-level `schemaVersion`
only changes for structural changes to `NodeBase` itself (see §7).

### 3.4 Stub vs. empty semantics

`content: []` is ambiguous today. Replace with an explicit field:

```ts
interface NodeBase {
  // ...
  digitizationStatus: "stub" | "partial" | "complete";
}
```
`stub` = not yet authored. `partial` = some blocks exist, more planned. `complete` = fully authored
for its type. This also becomes a CI/coverage metric (§9).

### 3.5 Addressable clauses

Every `ClauseItem.id` is unique **within its hadith**, and combined with `hadithId` forms a stable
composite address `"<hadithId>#<clauseId>"`. This lets a relationship, a quiz question, or a
future annotation feature cite a specific clause rather than only the whole hadith — this closes
problem #10 from the review.

---

## 4. Book / Page Model

- `books/<slug>.json` (served) is the **only** book representation. `books/index.json` is a
  generated projection (`BookSummary = Pick<Book, "id" | "slug" | "title" | "attributes" | ...>`)
  — never a separately maintained object.
- A `PAGE` node's `hadithIds` (authored in the page source file) is the **single** source of
  hadith↔page↔book membership. `PART_OF` / `contained_in` edges in the relationship graph are
  **generated** from this field at build time, purely so graph-traversal tooling doesn't need a
  special case for book membership. They are never hand-authored.

---

## 5. Isnad as a First-Class Model

(Directly addressing the branching bug from the prior review.)

```ts
interface IsnadLink {
  narratorId: NodeId;
  position: number;                     // 0 = nearest the Prophet ﷺ, increasing toward the book
  transmissionNote?: Localized;         // "haddathana", "an", "sami'tu", etc.
}

interface IsnadChain {
  id: string;                           // "isnad-<hadithSlug>-primary" / "-branch-1"
  hadithId: NodeId;
  role: "primary" | "branch";
  branchesFrom?: { chainId: string; narratorId: NodeId; position: number }; // required iff role === "branch"
  links: IsnadLink[];                   // ordered, Prophet-ward → collector-ward
  terminatesAt:
    | { kind: "narrator-prophet" }
    | { kind: "documented-leaf"; narratorId: NodeId; note: Localized };
}
```

Served as `public/api/v1/isnad/<hadith-slug>.json` = `{ primary: IsnadChain; branches: IsnadChain[] }`.

- **Primary chain** is what the reading UI renders inline — no traversal, no depth heuristic.
- **Branch chains** are rendered as chips anchored at `branchesFrom.narratorId` in the primary
  chain's link list, however many hops deep they actually are.
- `NARRATOR.attributes.isnadDepth` (§3.1) and `NARRATED_BY` edges (§6) are **generated** from
  chain data — a narrator's "depth" is a property of a specific chain, not a global constant, so
  it's computed per-chain and only surfaced on the node as a display convenience (e.g. shallowest
  occurrence across all chains), documented as such.

---

## 6. Relationship Model

### 6.1 What stays hand-authored

Only relationships that aren't already implied by book/page/isnad source files:

| Edge type | Meaning | Source |
|---|---|---|
| `REFERENCES` | loose cross-reference between nodes | `relationships/references.yaml` |
| `SIMILAR_TO` | thematically related hadith/verse | `relationships/references.yaml` |
| `thematic_link` | concept ↔ hadith/verse | `relationships/references.yaml` |
| `contextual` | historical event ↔ hadith/verse | `relationships/references.yaml` |
| `EXPLAINS` | commentary work ↔ hadith (redundant with `content[].commentary.workNodeId`? — see below) | `relationships/explains.yaml` |

`EXPLAINS` is authored **only** when the relationship exists independent of any single
`commentary` content block (e.g. a whole book of commentary on a whole other book). Any
`commentary` block's `workNodeId` already implies an `EXPLAINS` edge at the individual-hadith
level — that one is **generated**, not duplicated by hand.

### 6.2 What becomes generated (never hand-authored again)

| Edge type | Generated from |
|---|---|
| `PART_OF` / `contained_in` | `PAGE.hadithIds`, `PAGE.bookId` |
| `NARRATED_BY` / `narrator_in` | `IsnadChain.links` |
| `full_chain_source` | `IsnadChain` → its terminal `documented-leaf`, if any |
| `collected_in` | `PART_OF` transitively resolved to book |
| `EXPLAINS` (per-hadith) | `content[].commentary.workNodeId` |

### 6.3 Edge shape (unchanged in spirit, tightened)

```ts
interface Relationship {
  id: string;
  from: NodeId;
  to: NodeId;
  type: string;                 // enum-checked against a registered edge-type list (see §8.4)
  generated: boolean;           // true = build output, false = hand-authored
  metadata?: Record<string, Localized | string | number>;
}
```

### 6.4 Sharding

Served as `relationships/by-node/<id>.json` (all edges touching that node, both directions) for
runtime use, plus one `relationships/all.json` for admin/graph-exploration tooling. The reading UI
never fetches `all.json`.

---

## 7. Derived Indexes — Build-Time Only

`mappings.json` is retired as a single hand-maintained file. It is replaced by generated,
purpose-specific index files, each a pure function of the authored source tree:

```ts
// index/slugs.json
type SlugIndex = Record<Slug, { id: NodeId; type: NodeType }>;

// index/by-type.json
type TypeIndex = Record<NodeType, NodeId[]>;

// index/manifest.json
interface Manifest {
  schemaVersion: 2;
  builtAt: string;
  counts: Record<NodeType, number>;
  localeCoverage: Record<Locale, { nodes: number; percentOfTotal: number }>;
  digitizationStatusCounts: Record<"stub" | "partial" | "complete", number>;
}
```

Build pipeline: `data/**` (authored) → validate (§8) → compile → write `public/api/v1/**`. The
build **fails** (not warns) on any §8 violation. No served file is ever hand-edited.

---

## 8. Acceptance Criteria (CI-Enforced)

### 8.1 Identity
- Every `id` is globally unique across all node types.
- Every `slug` is globally unique; `index/slugs.json` has no collisions.
- Every reference field (`bookId`, `workNodeId`, `hadithIds[]`, `from`, `to`, `narratorId`,
  `branchesFrom.chainId`) resolves to an existing `id`. No dangling references.
- No orphan nodes: every non-`BOOK`/`PAGE` node has ≥1 resolvable relationship or isnad-chain
  membership pointing to it, or is explicitly tagged `digitizationStatus: "stub"`.

### 8.2 Localization
- `title` and every `Localized` field: `ar` and `en` present and non-empty. Missing `fr`/`es` is
  allowed; a field partially filled with only `fr` and no `en`/`ar` is a build error.
- Arabic-script fields pass a diacritics/RTL sanity check (no mixed-direction corruption, `ﷺ`
  preserved as a single codepoint, not decomposed).

### 8.3 Node-type rules
- `HADITH`: must have exactly one `isnad/<slug>/primary.yaml`; every `branch-*.yaml` must have a
  valid `branchesFrom` pointing at a `position` that exists in the primary chain's `links`.
- `HADITH`: must resolve to exactly one `BOOK` via generated `PART_OF` (i.e. must appear in
  exactly one `PAGE.hadithIds`).
- `NARRATOR`: every chain link referencing a narrator must resolve; a narrator with zero chain
  memberships is flagged as an unused stub.
- `PAGE`: `pageNum` unique within its `bookId`; `hadithIds` non-empty.
- `BOOK.attributes.digitization.authoredUnits` is generated, never authored — a PR that hand-sets
  it fails validation.
- Isnad chain must terminate at `{kind: "narrator-prophet"}` or a `documented-leaf` with a
  non-empty `note`. A chain with neither is invalid.

### 8.4 Content blocks
- `content[].type` must be one of the registered block types (§3.3); unregistered types fail
  validation at authoring time (registry lives in `data/schema/block-types.json`) even though
  *readers* treat unknown types as ignorable — the registry gate is for authors, the leniency is
  for old clients.
- `ai_context.items[].key` unique within the block; no positional-array parity requirement remains
  (structurally impossible to violate now).
- `quiz.questions[].correctOptionId` must match one `options[].id` in the same question.
- `ClauseItem.id` unique within its hadith.

### 8.5 Relationships
- Every edge's `type` is in the registered edge-type enum (`data/schema/edge-types.json`).
- `generated: true` edges are never present in hand-authored source files — CI diff-checks that
  `relationships/*.yaml` never contains a type from the generated-only list (§6.2).
- No duplicate edges (same `from`+`to`+`type`).

### 8.6 Versioning
- Every served node/edge/index file carries `schemaVersion`. The build refuses to emit a file
  whose `schemaVersion` doesn't match the current compiler's expected version (see §9).

### 8.7 Automated enforcement

- JSON Schema (generated from the TS types in this document) validates every authored YAML file
  pre-build.
- A build-time referential-integrity pass (custom script, graph-shaped — can't be pure JSON
  Schema) checks §8.1, §8.3 (chain/branch), §8.5.
- `manifest.json` diff is posted on every PR (counts, locale coverage, stub percentage) so scale
  and completeness regressions are visible, not just structural errors.
- CI fails the build (not just warns) on any violation above; nothing under `public/api/v1/` ships
  if validation fails.

---

## 9. Migration Path (schemaVersion 1 → 2)

1. **Adapter layer, not rewrite.** Ship `public/api/legacy/**` as a thin, generated compatibility
   shim: old paths (`/api/knowledge/nodes.json`, `/api/knowledge/mappings.json`,
   `/api/books/<slug>/pages/page-<n>/hadith.json`) are produced *from* the new source tree by the
   same build, so `HttpKnowledgeRepository.ts` etc. keep working unmodified during rollout.
2. **Convert existing mock content once**, mechanically: `books/index.json` + `book.json` merge
   into `book.yaml`; `nodes.json` entries split into `nodes/<type>/<slug>.yaml`; isnad-relevant
   `NARRATED_BY` edges are hand-reviewed once to produce initial `primary.yaml`/`branch-*.yaml`
   files (this is the one genuinely manual step — the model can't infer "which path is primary"
   from a flat edge list, which is exactly the bug that started this).
   `ai_context.prompts[]`/`answers.en[]` pairs are zipped into `AiPrompt[]` with generated `key`s.
3. **Cut over consumers** (`HttpKnowledgeRepository`, `HttpRelationshipRepository`, page loaders)
   to `v1/**` paths one at a time; each can run against the legacy adapter until switched.
4. **Retire `legacy/**`** once all consumers are migrated and one release cycle has passed with
   no legacy traffic (add a build-time counter/log if you want hard evidence before deleting it).
5. **Future schema bumps** follow the same pattern: new `schemaVersionN` folder under `v1/` (or a
   new `v1/` root for breaking changes), generated adapter to the prior version, consumers migrate
   at their own pace, old version retired after a deprecation window.

---

## 10. Worked Example (abridged)

`data/nodes/hadith/arbain-1.yaml` → compiles to:

```json
{
  "id": "hadith-arbain-1",
  "type": "HADITH",
  "slug": "arbain-1",
  "status": "published",
  "digitizationStatus": "complete",
  "title": { "ar": "إنما الأعمال بالنيات", "en": "Actions are judged by intentions" },
  "attributes": { "kind": "hadith", "grade": { "ar": "صحيح، متفق عليه", "en": "Sahih, agreed upon" }, "isnadType": "short" },
  "schemaVersion": 2,
  "content": [
    { "type": "clauses", "blockVersion": 1, "intro": { "ar": "...", "en": "..." },
      "items": [ { "id": "c1", "text": { "ar": "...", "en": "..." } } ] },
    { "type": "ai_context", "blockVersion": 1,
      "items": [ { "key": "explain_12", "question": { "en": "..." }, "answer": { "en": "..." } } ] }
  ]
}
```

`data/isnad/arbain-1/primary.yaml` → `public/api/v1/isnad/arbain-1.json`:

```json
{
  "primary": {
    "id": "isnad-arbain-1-primary",
    "hadithId": "hadith-arbain-1",
    "role": "primary",
    "links": [
      { "narratorId": "narrator-umar", "position": 0 },
      { "narratorId": "narrator-alqamah", "position": 1 },
      { "narratorId": "narrator-yahya", "position": 2 },
      { "narratorId": "narrator-sufyan", "position": 3 },
      { "narratorId": "narrator-humaydi", "position": 4 }
    ],
    "terminatesAt": { "kind": "narrator-prophet" }
  },
  "branches": []
}
```

This is the exact shape the fixed `buildIsnad` reads directly — one array to render inline, an
empty (or populated) branch list to render as chips, no depth heuristics anywhere in the client.