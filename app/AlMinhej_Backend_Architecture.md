# AlMinhej — Backend Architecture

**Domain: Knowledge, not Lessons.**

This document formalizes the pivot from a lesson-centric platform to a
knowledge-graph-centric one, and works through the three things that pivot
demands: REST API design, the object-oriented layering underneath it, and
the NoSQL document model that stores it. It also reconciles this with the
MVP frontend already shipped — that work isn't discarded, it becomes the
first `ReadingExperienceDTO` this backend needs to produce.

---

## 1. Why the reframe is correct

A lesson-centric model is a tree: `Course → Lesson → Section`. It works
until the second content type shows up — a Qur'an verse doesn't belong
inside a hadith lesson's tree, and a narrator's biography doesn't belong
inside either. Every new content type forces either a schema migration or
an awkward "lesson that isn't really a lesson."

A knowledge-centric model is a graph: everything is a **node**, and
relationships between nodes carry the meaning that used to be encoded in
folder structure. Adding tafsir, fiqh, or Arabic morphology later means
adding node types and relationship types — not redesigning the core.

This also matches the product's actual value proposition better than a
course structure does. The stated goal from day one was never "finish
Lesson 5" — it was *"I'm reading this sentence, show me everything related
to it."* That's a graph query, not a course-progress query.

---

## 2. Bounded contexts

| Context | Responsibility | Owns |
|---|---|---|
| **Knowledge Core** | The graph itself — nodes, relationships, content blocks. Source of truth. | `knowledge_nodes`, `relationships` |
| **Reading Experience** | Assembles read-optimized projections for a given node | (read-only, no storage) |
| **Learning Journey** | Learning paths, roadmaps, progress, streaks, recommendations | `user_progress`, `learning_paths` |
| **User Workspace** | Personal notes, bookmarks, reflections, votes | `user_notes`, `bookmarks`, `votes` |
| **Search** | Cross-type search over the graph | `search_index` |
| **AI Assistant** | Grounded companion conversations | `ai_sessions` |
| **Content Management** | Authoring, review, and the digitization workflow | (writes to Knowledge Core via its own API surface) |
| **Analytics** | Pilot instrumentation, usage events | `events` |
| **Administration** | Auth, roles, moderation | `users` |

**Rule:** contexts talk to each other through application services or
domain events — never by reaching into another context's collection
directly. Learning Journey doesn't write to `knowledge_nodes`; it reads
node ids and stores its own progress records against them.

---

## 3. Core domain model

### 3.1 `KnowledgeNode` — the aggregate root

Every canonical, authored piece of content is a node: book, chapter,
hadith, verse, narrator, scholar, historical event, vocabulary entry,
concept, fatwa, location, person, media asset.

```typescript
interface KnowledgeNode {
  id: string;
  type: NodeType;
  slug: string;
  status: "draft" | "in_review" | "published";
  visibility: "public" | "unlisted";
  language: UiLang[];             // languages this node has content in
  title: Localized<string>;
  attributes: NodeAttributes;      // type-specific fields, see 3.1.1
  content: ContentBlock[];         // see 3.2
  digitization?: DigitizationProgress; // present only on BOOK nodes
  search: { keywords: string[]; boost: number };
  audit: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
  };
  schemaVersion: number;
}

type NodeType =
  | "BOOK" | "CHAPTER" | "HADITH" | "VERSE" | "NARRATOR" | "SCHOLAR"
  | "HISTORICAL_EVENT" | "VOCABULARY" | "CONCEPT" | "FATWA"
  | "LOCATION" | "PERSON" | "MEDIA";
```

**One deliberate deviation from a fully generic model:** `attributes` is
typed per `NodeType` via a discriminated union (`HadithAttributes`,
`BookAttributes`, `NarratorAttributes`, ...), not a free-form bag. A
schemaless `Record<string, unknown>` here would push every runtime error
from "field doesn't exist" down to the frontend. The **storage** is
graph-flexible; the **API layer's DTOs stay strongly typed**. That's the
balance point — see §10.1.

**`QUESTION` and `REFLECTION` are deliberately *not* node types.** They're
user-generated, not authored/reviewed knowledge, and putting them in
`knowledge_nodes` would let personal reflections pollute canonical
content and its search index. They live in User Workspace instead,
referencing nodes by id rather than being nodes themselves.

#### 3.1.1 `DigitizationProgress` — this is where "Source" goes

The `Source` concept from the MVP doesn't disappear — it *is* a `BOOK`
node's digitization state, computed rather than hand-maintained:

```typescript
interface DigitizationProgress {
  totalUnits: number;              // e.g. 7,563 hadith in al-Bukhari
  indexedUnits: number;            // derived, see below
  unit: Localized<string>;         // "hadith" | "pages" | "volumes"
}
```

In the MVP, `indexedUnits` was a hand-edited number per lesson. In the
graph model it's **derived**: a book's `indexedUnits` is the count of
`published` nodes with a `PART_OF` relationship pointing at it. Digitizing
hadith 2 of Bukhari and publishing that node automatically moves Bukhari's
progress bar — nobody maintains a counter by hand, and it can never drift
out of sync with what's actually published. (Recomputed via a domain
event listener on node publish, cached on the book node for read
performance — see §6.1.)

This is also what fully resolves the "two lessons cite the same book,
whose progress number wins?" problem flagged in the MVP's `PROMPTS.md`
(Prompt 11): there's only one Bukhari node. There's nothing to desync.

### 3.2 `ContentBlock` — polymorphic, ordered, per-node

```typescript
type ContentBlock =
  | { type: "text"; lang: UiLang; text: string }
  | { type: "translation"; lang: SubtitleLang; text: string }
  | { type: "commentary"; scholarNodeId: string; text: Localized<string> }
  | { type: "vocabulary"; entries: VocabEntry[] }
  | { type: "timeline"; events: TimelineEntry[] }
  | { type: "quote"; text: Localized<string>; attribution: string }
  | { type: "quiz"; questions: QuizQuestion[] }
  | { type: "ai_context"; summary: Localized<string> }
  | { type: "media"; assetId: string; kind: "audio" | "image" };
```

New UI idea → new block variant, added to the union. No migration of
existing nodes required, because a node's `content` array simply doesn't
contain that block type until an editor adds one.

**Where this already exists in the shipped frontend**, so this isn't a
hypothetical shape — it's a re-platforming of code that's already working:

| Block type | Current frontend consumer |
|---|---|
| `text`, `translation` | `ArabicReader` |
| `commentary` | `UnderstandTab` commentary cards |
| `vocabulary` | `VocabularyTab` / word-tap popovers |
| `quiz` | `PracticeTab` |
| `ai_context` | `CompanionWidget` system-prompt grounding |
| `media` | (not yet built — audio recitation, straightforward add) |

### 3.3 `Relationship` — the edge

```typescript
interface Relationship {
  id: string;
  from: string;                    // node id
  to: string;                      // node id
  type: RelationshipType;
  weight: number;                  // relevance/strength, 0-1
  priority: number;                // display ordering
  metadata?: Record<string, string>;
  createdBy: string;
  reviewedBy?: string;
}

type RelationshipType =
  | "PART_OF" | "NARRATED_BY" | "EXPLAINS" | "MENTIONS"
  | "TRANSLATES" | "REFERENCES" | "SIMILAR_TO"
  | "FOLLOWS" | "PRECEDES" | "LOCATED_IN";
```

`PART_OF` is doing real work here: a hadith node has **two** `PART_OF`
edges — one to the Bukhari node, one to the Muslim node — which is exactly
the "Hadith 1 · Sahih al-Bukhari & Muslim" dual-citation the MVP had to
special-case in its `books` array. In the graph model it's just two edges
of the same type; nothing app-specific needed.

---

## 4. OOP layering (Clean Architecture)

```
HTTP Controller
      │  (parsing, auth guard, status codes — no business logic)
      ▼
Application Service
      │  (orchestrates a use case, owns the transaction boundary)
      ▼
Domain Service
      │  (pure business logic — no I/O, fully unit-testable)
      ▼
Repository (interface, defined in the domain layer)
      ▼
StorageProvider (implementation)
      │
   Memory → MongoDB → (future) Firestore / graph DB
```

**The rule that matters:** domain services and repository *interfaces*
never import anything from `mongodb`. Only the concrete
`MongoStorageProvider` does. This is what makes `MemoryStorageProvider`
possible for fast unit tests and local dev without a database running.

```typescript
// domain layer — no Mongo import anywhere here
interface KnowledgeRepository {
  findBySlug(slug: string): Promise<KnowledgeNode | null>;
  findByType(type: NodeType, opts?: PageOpts): Promise<Page<KnowledgeNode>>;
  save(node: KnowledgeNode): Promise<void>;
}

interface RelationshipRepository {
  neighborsOf(nodeId: string, types?: RelationshipType[]): Promise<Relationship[]>;
}

// application layer
class AssembleReadingExperience {
  constructor(
    private nodes: KnowledgeRepository,
    private relationships: RelationshipRepository,
    private progress: ProgressRepository,
  ) {}

  async execute(slug: string, userId?: string): Promise<ReadingExperienceDTO> {
    const node = await this.nodes.findBySlug(slug);
    if (!node) throw new NotFoundError(slug);
    const edges = await this.relationships.neighborsOf(node.id);
    const related = await this.nodes.findManyByIds(edges.map(e => e.to));
    const userProgress = userId ? await this.progress.get(userId, node.id) : null;
    return ReadingExperienceMapper.toDTO(node, edges, related, userProgress);
  }
}
```

### Named patterns and where they earn their place

| Pattern | Used for |
|---|---|
| **Repository** | Every collection, per §above — isolates storage tech |
| **Strategy** | `RecommendationStrategy` (rule-based now, ML later); `DifficultyStrategy` for memorize-mode occlusion if it moves server-side |
| **Builder** | `KnowledgeContextBuilder` — assembles the grounded context handed to the AI companion (§7) |
| **Factory / Mapper** | `ReadingExperienceMapper`, `ExploreMapper` — turn raw nodes+edges into response DTOs |
| **Adapter** | `LessonCompatibilityAdapter` — see §8, keeps the existing frontend working unmodified |
| **Observer / domain events** | `NodePublished`, `VoteCast` events trigger digitization-cache refresh, search re-index, analytics — decouples the write path from side effects |
| **CQRS-lite** | Write model = raw `KnowledgeNode`/`Relationship` aggregates. Read model = denormalized DTOs (`ReadingExperienceDTO`, `ExploreDTO`) assembled/cached for the read-heavy reading surface |

---

## 5. REST API — two surfaces, deliberately different shapes

**Public Reading API** — few, rich, projection-based endpoints. Optimized
for "give me everything about what I'm looking at in one round trip,"
per the original philosophy: the frontend never assembles data, the
backend does.

**Content Management API** — conventional resource CRUD. This is the
scholarly-review and digitization surface; editors work node-by-node and
need standard create/update/list semantics, not a curated reading
projection. Different bounded context, different API shape — that's
expected, not an inconsistency.

### 5.A Public Reading API

| Method | Path | Returns |
|---|---|---|
| `GET` | `/v1/reading/{nodeSlug}` | `ReadingExperienceDTO` |
| `GET` | `/v1/explore/{nodeSlug}` | `ExploreDTO` (graph neighbors, timeline, cross-refs) |
| `GET` | `/v1/nodes/{id}/relationships?type=` | lightweight edge list, for interactive graph UI |
| `GET` | `/v1/search?q=` | `SearchResultDTO[]` (mixed node types) |
| `GET` | `/v1/paths/recommended` | personalized next-node suggestions |
| `POST` | `/v1/onboarding/goals` | sets initial learning path |
| `POST` | `/v1/nodes/{id}/votes` | prioritization vote (digitization) |
| `POST` | `/v1/nodes/{id}/companion/ask` | grounded AI answer |
| `GET`/`POST` | `/v1/me/progress` | learning progress |
| `GET`/`POST` | `/v1/me/bookmarks`, `/v1/me/notes`, `/v1/me/reflections` | user workspace |
| `POST` | `/v1/auth/register`, `/login`, `/refresh`, `/logout` | standard auth |

#### `GET /v1/reading/{nodeSlug}` — the contract that replaces "open Lesson 5"

```jsonc
{
  "node": {
    "id": "hadith-1-bukhari",
    "type": "HADITH",
    "title": { "ar": "إنما الأعمال بالنيات", "en": "Actions are judged by intentions" },
    "content": [
      { "type": "text", "lang": "ar", "text": "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ..." },
      { "type": "translation", "lang": "en", "text": "Actions are only judged..." },
      { "type": "commentary", "scholarNodeId": "scholar-nawawi", "text": { "en": "...", "ar": "..." } }
    ]
  },
  "connectedKnowledge": {
    "narratedBy": [{ "id": "narrator-umar", "title": {...}, "relationshipType": "NARRATED_BY" }],
    "partOf": [
      { "id": "book-bukhari", "title": {...}, "locator": { "en": "Book 1, Hadith 1" } },
      { "id": "book-muslim", "title": {...}, "locator": { "en": "Hadith 1907" } }
    ],
    "explainedBy": [{ "id": "book-sharh-arbain", "title": {...} }],
    "references": [{ "id": "verse-bayyinah-98-5", "type": "VERSE" }]
  },
  "aiContext": { "available": true },
  "suggestedNext": [{ "id": "hadith-2-bukhari", "reason": "same_collection" }],
  "progress": { "status": "in_progress", "wordsDiscovered": 3, "quizCompleted": false }
}
```

One request. The frontend renders blocks and relationship groups; it
doesn't decide what "related" means or issue five follow-up calls.

#### Error contract (all endpoints)

```json
{ "error": { "code": "NODE_NOT_FOUND", "message": "No node with slug 'x'", "details": null } }
```

Standard HTTP status + this envelope. Versioned via URI prefix (`/v1`).
Mutating endpoints (`votes`, `progress`) accept an `Idempotency-Key`
header so a retried request from a flaky mobile connection can't double-
count a vote.

### 5.B Content Management API

```
GET    /v1/admin/nodes?type=HADITH&status=draft
POST   /v1/admin/nodes
PATCH  /v1/admin/nodes/{id}
POST   /v1/admin/nodes/{id}/relationships
POST   /v1/admin/nodes/{id}/submit-for-review
POST   /v1/admin/nodes/{id}/publish
```

Role-gated (`editor`, `scholar-reviewer`, `admin`). Publishing a node is
what triggers the `NodePublished` domain event that recomputes the
parent book's `digitization.indexedUnits` and refreshes the search index.

---

## 6. NoSQL document model (MongoDB)

| Collection | Holds | Embed or reference? |
|---|---|---|
| `knowledge_nodes` | All authored content (single polymorphic collection, `type` field, indexed) | Embeds `content` blocks (bounded, always fetched together). References relationships (not embedded). |
| `relationships` | Graph edges | Own collection — many-to-many, queried from both directions |
| `user_progress` | Per-user, per-node progress | Own collection, **not** embedded in the user doc |
| `user_notes`, `bookmarks`, `votes` | Small per-user records | Own collections |
| `search_index` | Denormalized, refreshed on publish | Own collection (or swap for Atlas Search / Typesense later) |
| `ai_sessions` | Companion Q&A audit log | Own collection |
| `media` | Asset metadata → object storage URLs | Own collection; binaries never live in Mongo |
| `users` | Auth/profile | Own collection |

### One refinement to the originally proposed collection list

A separate `books` collection was on the table. I'd fold it into
`knowledge_nodes` as `type: "BOOK"` instead: a dedicated collection would
just be a filtered view of the same shape, and it forces every query
that legitimately wants "all node types related to X" to special-case
books. A single polymorphic collection with a `type` index, plus an
aggregation pipeline for "books only" (what the Library tab needs), gets
the same result without duplicated query logic. `sources` as a concept
disappears entirely for the same reason — per §3.1.1, it's just a field
on book nodes now.

### 6.1 Embedding vs. referencing — the actual decision rule used above

- **Embed** when the data is *always* read together and *bounded* in
  size (a node's content blocks, its localized title). Embedding avoids
  a round trip for data that's never useful on its own.
- **Reference** when the data is *many-to-many* (a book is `PART_OF`
  target for thousands of hadith — embedding hadith into the book doc
  would blow past reasonable document size) or *grows per-user over
  time* (`user_progress` — embedding progress records inside the user
  document risks the 16MB document ceiling and creates write contention
  on one hot document as a user reads more).
- **Denormalize deliberately, with a documented staleness window**, only
  for read-hot, write-cold data. `digitization` on a book node is exactly
  this: recomputed on `NodePublished`, cached on the node, read constantly
  by the Library tab. The tradeoff (a newly-published hadith might take a
  few seconds to reflect in the progress bar, depending on how the event
  listener is wired) is worth stating explicitly rather than discovering
  it in production.

### 6.2 Example documents

```jsonc
// knowledge_nodes — a BOOK node
{
  "_id": "book-bukhari",
  "type": "BOOK",
  "slug": "sahih-al-bukhari",
  "status": "published",
  "title": { "ar": "صحيح البخاري", "en": "Sahih al-Bukhari" },
  "attributes": { "author": "Imam al-Bukhari", "eraLabel": "194–256 AH", "category": "hadith" },
  "digitization": { "totalUnits": 7563, "indexedUnits": 1, "unit": { "en": "hadith", "ar": "حديث" } },
  "schemaVersion": 1
}
```

```jsonc
// relationships — two edges from the same hadith node
{ "_id": "r1", "from": "hadith-1-bukhari", "to": "book-bukhari", "type": "PART_OF",
  "metadata": { "locator_en": "Book 1, Hadith 1" } }
{ "_id": "r2", "from": "hadith-1-bukhari", "to": "book-muslim", "type": "PART_OF",
  "metadata": { "locator_en": "Hadith 1907" } }
```

### 6.3 Indexes worth stating explicitly

- `knowledge_nodes`: unique on `slug`; compound on `(type, status)`
- `relationships`: compound on `(from, type)` and `(to, type)` — traversal happens both directions
- `user_progress`: unique compound on `(userId, nodeId)`
- `votes`: unique compound on `(userId, nodeId)` — this is what makes voting idempotent, not app-level "have they voted" checks

### 6.4 Translations — a decision point, not a fixed answer

For the current two-language (ar/en) + three-subtitle-language scope,
`Localized<T>` embedded inline (as already used throughout the MVP types)
is correct — simple, atomic, no extra round trip. If the platform later
adds crowdsourced translation into many languages, a separate
`translations` collection keyed by `(nodeId, blockId, lang)` becomes worth
the extra complexity — mainly because it lets translation review/versioning
happen independently of the source content's own edit history. Not needed
yet; worth flagging now so it doesn't get bolted on awkwardly later.

### 6.5 Schema evolution

Every document carries `schemaVersion`. Migrations are explicit scripts
keyed off that field, run before deploying code that expects the new
shape — standard practice, but worth stating since NoSQL has no schema
enforcement to force the issue the way a SQL migration would.

---

## 7. The AI layer never touches the database

```
question → KnowledgeContextBuilder → grounded context → LLM → answer
```

`KnowledgeContextBuilder` (a Builder, formally) collects the node itself,
its `EXPLAINS`/`REFERENCES`/`NARRATED_BY` neighbors, and their content
blocks, and assembles a bounded context object. The LLM only ever sees
that assembled context — never a raw database handle, never permission to
decide what's relevant on its own. This is what keeps the companion's
answers grounded in curated material rather than open-ended generation,
and it's a direct continuation of the "source transparency" principle the
frontend already enforces visually (AI explanation vs. scholar commentary,
always labeled separately).

Every `POST /v1/nodes/{id}/companion/ask` call is logged to `ai_sessions`
— not for surveillance, but because that log is the raw material for a
scholarly reviewer to spot-check whether the companion is staying properly
grounded, which matters more here than in a generic chatbot product.

---

## 8. Migration: the shipped MVP isn't wasted work

The current frontend's `Lesson` type is, functionally, a hand-authored
`ReadingExperienceDTO` for exactly one node. That was the right shape to
validate the reading UX fast. The pivot doesn't discard it — it changes
where that shape comes from.

**`LessonCompatibilityAdapter`**: a mapper that takes a `KnowledgeNode` +
its relationships and produces the *exact* JSON shape
`src/data/lessons/hadith-1.ts` currently hand-authors. Concretely:

| Current `Lesson` field | Becomes |
|---|---|
| `chain`, `branches`, `books` (isnad) | `NARRATED_BY` / `PART_OF` relationship traversal from the hadith node |
| `sources` | Book-type nodes' `digitization` field, fetched by id |
| `graphNodes`, `nodeDetail` (mini graph) | Real read from `/v1/nodes/{id}/relationships`, replacing the hand-placed `angle` values |
| `commentary[].sourceId` | `EXPLAINS` relationship target |
| `clauses`, `vocab`, `quiz` | `text`/`translation`/`vocabulary`/`quiz` content blocks |

If the adapter's output matches `Lesson` exactly, **no component under
`src/components` needs to change.** Only the data-fetching layer
(currently a static import) becomes an API call through the adapter. This
is the practical argument for doing the pivot now, while there's one
lesson to migrate, rather than after there are forty.

---

## 9. Contract stability end-to-end

Define request/response shapes once, as Zod schemas, on the backend.
Generate an OpenAPI spec from them (`zod-to-openapi`). Generate frontend
TypeScript types from that spec (`openapi-typescript`), eventually
replacing the hand-maintained `src/types/index.ts`. This closes the loop
so the frontend and backend can't silently drift apart the way
hand-synced type definitions always eventually do.

---

## 10. Where I'd push back / open questions

**10.1 — Generic storage, typed API.** Already stated in §3.1, restated
because it's the most important constraint in this whole document: don't
let `KnowledgeNode.attributes` or `ContentBlock` become truly
`Record<string, unknown>` at the API boundary. Keep storage
graph-flexible; keep response DTOs strongly typed per node type. The
alternative trades a real problem (schema rigidity) for a worse one
(runtime type errors reaching the frontend).

**10.2 — MongoDB's graph traversal has a real ceiling.** `$graphLookup`
handles the 2-3 hop queries this product actually needs today (hadith →
narrator → book; hadith → topic → other hadith) without trouble. If
"explore" grows into genuinely deep, open-ended multi-hop discovery later,
a real graph database (Neo4j) earns its complexity at that point — not
before. Consistent with this project's own stated approach elsewhere:
validate before scaling.

**10.3 — Reflections/Questions stay out of the knowledge graph.**
Restated from §3.1 because it's an easy mistake to walk back under
pressure to "make everything a node": user-generated content and
authored/reviewed content have different governance needs (one needs
scholarly review before publish, the other doesn't and shouldn't), and
mixing them undermines the "everything in the graph is authoritative"
property that makes source transparency trustworthy in the first place.

---

## Suggested next prompts (continuing the `PROMPTS.md` pattern)

- **Prompt 12** — Stand up `KnowledgeNode` + `Relationship` storage (Memory
  + Mongo providers) and the `LessonCompatibilityAdapter`, so the existing
  frontend can run against real data with zero component changes.
- **Prompt 13** — Content Management API + the scholarly digitization
  review workflow (draft → in_review → published), replacing hand-edited
  `indexedUnits` with the derived count from §3.1.1.
- **Prompt 14** — `/v1/explore/{nodeSlug}` + wire the frontend's
  `MiniGraph` component to real relationship data instead of the
  hand-placed `angle` values currently in `hadith-1.ts`.
