# Data Model Review Request — Al-Minhej Knowledge Platform

> **Purpose:** This document is a self-contained brief for an advanced AI model (architecture / data-modeling review).
> It describes the **current** public static-API mock-data structure and content used by the Al-Minhej webapp, and asks the
> reviewer to (1) assess the model, (2) recommend the correct, flexible way to present and build the data, and
> (3) define **acceptance criteria** to meet when expanding ("extending") the content.
>
> The reviewer should assume the data is consumed by a **static, client-side app** served from `public/api/**` as
> plain JSON files (no backend, no DB). The app fetches these files over HTTP at runtime.

---

## 1. Context & Goals

**Product:** Al-Minhej is an Islamic knowledge platform that presents hadith, Qur'anic verses, scholarly commentary,
concepts, historical events, books, and narrator (isnad) chains — multi-lingual (currently `ar`, `en`, with partial
`fr`/`es` in places). It is built for **reading + study**: clause-by-clause breakdown, vocabulary, commentary, AI
explanations, quizzes, and a knowledge graph of relationships between all the above.

**Current state:** Data is hand-authored mock data in `public/api/`. It powers a prototype. The goal is to move from a
small mock set to a **much larger, extensible corpus** without redesigning the app repeatedly.

**What we want from the reviewer:**
1. Critique the **current** structure for correctness, consistency, and extensibility.
2. Recommend the **right, flexible** shape for (a) the file/endpoint layout and (b) the JSON schemas, so the corpus
   can grow (more books, hadith, languages, content blocks) without breaking consumers.
3. Define **acceptance criteria** (validations, invariants, schema rules) that any newly added content must satisfy.

---

## 2. Current Data Layout (file tree)

```
public/api/
├── books/
│   ├── index.json                      # list of all books (summary)
│   └── <book-slug>/
│       ├── book.json                   # single book metadata
│       └── pages/
│           └── page-<n>/
│               └── hadith.json         # { page, hadiths[] } for one book page
└── knowledge/
    ├── nodes.json                      # flat array of ALL graph nodes
    ├── relationships.json              # flat array of ALL graph edges
    └── mappings.json                   # lookups: slug→id, id→type, type→ids, bookPages
```

**Consumption:**
- `src/infrastructure/http/HttpKnowledgeRepository.ts` → `fetch('/api/knowledge/nodes.json')`
- `src/infrastructure/http/HttpRelationshipRepository.ts` → `fetch('/api/knowledge/relationships.json')`
- Book pages are loaded per-route from `/api/books/<slug>/pages/page-<n>/hadith.json`.

---

## 3. Current Schemas

### 3.1 `books/index.json`
A `{ "books": [...] }` wrapper. Each book is a **summary** object:
```json
{
  "id": "book-bukhari",
  "slug": "sahih-al-bukhari",
  "title": { "ar": "صحيح البخاري", "en": "Sahih al-Bukhari" },
  "author": { "ar": "الإمام البخاري", "en": "Imam al-Bukhari" },
  "eraLabel": "194–256 AH",
  "digitization": { "totalUnits": 7563, "unit": { "ar": "حديث", "en": "hadith" } }
}
```

### 3.2 `books/<slug>/book.json`
A **superset** of the index entry — adds `"type": "BOOK"` and `"schemaVersion": 1`, but **drops** `title/author/eraLabel`
into `attributes`:
```json
{
  "id": "book-bukhari",
  "type": "BOOK",
  "slug": "sahih-al-bukhari",
  "status": "published",
  "title": { "ar": "...", "en": "..." },
  "attributes": { "kind": "book", "author": { "ar": "...", "en": "..." }, "eraLabel": "194–256 AH" },
  "digitization": { "totalUnits": 7563, "unit": { "ar": "حديث", "en": "hadith" } },
  "schemaVersion": 1
}
```

### 3.3 `books/<slug>/pages/page-<n>/hadith.json`
```json
{
  "page": {
    "id": "page-bukhari-1",
    "slug": "bukhari-page-1",
    "title": { "ar": "...", "en": "..." },
    "pageNum": 1,
    "bookId": "book-bukhari",
    "readingNodeId": "hadith-bukhari-1"
  },
  "hadiths": [ /* hadith node objects, see 3.4 */ ]
}
```

### 3.4 Knowledge node (inside `nodes.json` AND inside `hadith.json`)
Top-level object with `type`, `slug`, `status`, `title`, `attributes`, `content[]`, `schemaVersion`.
Node `type` values in use: `HADITH`, `VERSE`, `CONCEPT`, `EVENT`, `NARRATOR`, `BOOK`, `PAGE`.

Example **HADITH with full content** (`content[]` is an ordered array of typed blocks):
```json
{
  "id": "hadith-1",
  "type": "HADITH",
  "slug": "arbain-1",
  "status": "published",
  "title": { "ar": "إنما الأعمال بالنيات", "en": "Actions are judged by intentions" },
  "attributes": {
    "kind": "hadith",
    "grade": { "ar": "صحيح، متفق عليه", "en": "Sahih, agreed upon" },
    "isnadType": "short"
  },
  "schemaVersion": 1,
  "content": [
    {
      "type": "clauses",
      "introAr": "عَنْ ... قَالَ: سَمِعْتُ رَسُولَ اللَّهِ ...",
      "introSub": { "en": "...", "fr": "...", "es": "..." },
      "items": [
        { "id": 1, "ar": "...", "en": "...", "fr": "...", "es": "..." },
        { "id": 2, "ar": "...", "en": "..." }
      ]
    },
    {
      "type": "vocabulary",
      "entries": [
        { "id": "amal", "word": "الْأَعْمَالُ", "root": "ع-م-ل", "pron": "al-a'māl",
          "occ": 1, "en": "deeds, actions", "ar": "الأفعال والتصرفات" }
      ]
    },
    {
      "type": "commentary",
      "scholar": { "ar": "...", "en": "..." },
      "workNodeId": "book-sharh-arbain",
      "note": { "en": "...", "ar": "..." }
    },
    {
      "type": "context",
      "title": { "ar": "...", "en": "..." },
      "body": { "en": "...", "ar": "..." }
    },
    {
      "type": "ai_context",
      "explanation": { "en": "...", "ar": "..." },
      "prompts": ["explain_12", "practical_example", "why_chain"],
      "answers": { "en": ["...", "...", "..."], "ar": ["...", "...", "..."] }
    },
    {
      "type": "quiz",
      "questions": [
        {
          "q": { "en": "...", "ar": "..." },
          "options": [ { "en": "...", "ar": "..." } ],
          "correct": 1
        }
      ]
    }
  ]
}
```

**Content block `type`s observed:** `clauses`, `vocabulary`, `commentary`, `context`, `ai_context`, `quiz`.
Nodes may have `content: []` (most nodes are stubs today).

**Per-type `attributes` differences (inconsistent today):**
- `HADITH`: `{ kind, grade, isnadType }`
- `VERSE`: `{ kind, ref, refLocalized }`
- `CONCEPT`: `{ kind }`
- `EVENT`: `{ kind, dates }`
- `NARRATOR`: `{ kind, dates, grade, isnadDepth, isnadBranch? }`
- `BOOK`: `{ kind, author, eraLabel }`
- `PAGE`: `{ kind, bookId, pageNum, readingNodeId, hadithIds[] }`

### 3.5 `knowledge/relationships.json`
Flat array of edges: `{ "id", "from", "to", "type", "metadata"? }`.
Edge `type`s in use: `NARRATED_BY`, `REFERENCES`, `PART_OF`, `EXPLAINS`, `SIMILAR_TO`, `core_concept`,
`thematic_link`, `collected_in`, `contained_in`, `contextual`, `narrator_in`, `related_hadith`, `full_chain_source`.

Some relationships carry `metadata` (e.g. `depth`, `locator_en/ar`, `note_en/ar`, `verse_ar`, `src_en/ar`).

> ⚠️ **Note the redundancy:** the same facts are expressed in multiple places — e.g. a hadith's book membership is
> stated both via `PAGE.hadithIds`/`readingNodeId` and via `PART_OF` edges in `relationships.json`, and again via
> `full_chain_source` edges. The `narrator_in` and `NARRATED_BY` edges duplicate the isnad info.

### 3.6 `knowledge/mappings.json`
Denormalized lookup indexes kept **in sync manually** by the author:
```json
{
  "slugToId": { "arbain-1": "hadith-1", ... },
  "idToType": { "hadith-1": "HADITH", ... },
  "typeToIds": { "HADITH": ["hadith-1", ...], ... },
  "bookPages": { "sahih-al-bukhari": [1, 2, 3], ... }
}
```

---

## 4. Current Content Coverage (mock scale)

- **Books:** 7 (`sahih-al-bukhari`, `sahih-muslim`, `sharh-al-arbain`, `jami-al-ulum-wal-hikam`, `fath-al-bari`,
  `al-tabaqat-al-kubra`, `al-bidayah-wan-nihayah`).
- **Pages authored:** ~12 across the 7 books (sparse — only a handful of `page-<n>` folders exist).
- **Nodes:** ~50 (hadith, verse, concept, event, narrator, book, page). Many are empty stubs (`content: []`).
- **Relationships:** ~120 edges.
- **Languages:** `ar` + `en` baseline; `fr`/`es` appear only on a couple of `clauses` blocks — **no consistent i18n key set**.
- **Rich content** (clauses/vocab/commentary/ai/quiz) exists for only ~4 hadith.

---

## 5. Observed Strengths

1. **Graph-oriented** model (`nodes` + `relationships`) is the right foundation for a knowledge product — it supports
   isnad chains, cross-references, similarity, and concept linking natively.
2. **Localized fields** (`{ ar, en }`) are consistently used at the node-title level.
3. **`content[]` as a typed-block array** is a good, extensible pattern for composing a reading experience.
4. **`schemaVersion`** is present, which is forward-thinking for migrations.
5. **Per-page file layout** under `books/<slug>/pages/` scales naturally as more pages are digitized.

---

## 6. Observed Problems / Risks (for the reviewer to weigh in on)

1. **Duplicated / divergent sources of truth.**
   - Book metadata exists in 3 forms: `books/index.json`, `books/<slug>/book.json`, and as a `BOOK` node in
     `nodes.json` — with **different field placement** (`author`/`eraLabel` at top level in index, nested in
     `attributes` in `book.json`/`nodes.json`).
   - Hadith↔book↔page↔narrator links are encoded in `PAGE` attributes, `PART_OF`, `contained_in`, `contextual`,
     `NARRATED_BY`, and `narrator_in` edges simultaneously.
2. **Manual `mappings.json`** must be kept in sync by hand; it is a maintenance trap and a single point of divergence.
3. **Inconsistent i18n.** Some strings are `{ ar, en }`, some add `fr`/`es`, others are bare strings
   (`eraLabel`, `digitization.unit` is `{ar,en}` but `grade` sometimes only `{ar,en}` and `dates` is a bare string).
   No enforced set of supported locales.
4. **Empty stubs (`content: []`)** are indistinguishable from "not yet digitized" vs "genuinely no content."
5. **`status` only on some nodes** (`published`); no lifecycle for draft/approved/review.
6. **`id` vs `slug` confusion.** Both are used as references; `slugToId` exists but is duplicated effort.
7. **Type stringly-typed:** `type` and edge `type` are free-form strings with no enum enforcement in the data.
8. **`attributes` is a catch-all** with per-type shapes; new node types require ad-hoc fields.
9. **`ai_context` prompts/answers** are positional arrays keyed only by index alignment (`prompts[i]` ↔ `answers.en[i]`)
   — fragile if one language has a different count.
10. **No content addressing for clauses** beyond in-page `id`; cross-referencing a specific clause isn't supported.
11. **`digitization.totalUnits` vs actual authored pages** disagree wildly (e.g. Bukhari 7563 hadith, 3 pages mocked).

---

## 7. What We Need the Reviewer To Produce

Please return a structured recommendation covering:

### A. Assessment of the current model
- What is sound, what is fragile, and what will *break* as the corpus grows 10×–100×.

### B. Recommended flexible data shape
1. **Endpoint/file layout** — keep per-book-per-page files? Centralize? Hybrid? Recommend a layout that scales to
   thousands of pages and supports incremental builds.
2. **Node schema** — a unified, versioned schema (JSON Schema / TS types) where:
   - localization is **consistent and enforced** (recommend a `Localized<T>` pattern and a fixed locale set),
   - `attributes` per `type` is well-defined (or replaced),
   - the `content[]` block registry is open/extensible without breaking old readers,
   - identity (`id` vs `slug`) is unambiguous.
3. **Relationship model** — how to avoid duplication, how to make isnad a first-class, queryable structure, and whether
   to keep a single `relationships.json` or shard it.
4. **Derived indexes** (`mappings.json`) — should they be generated at build time and never hand-authored? Recommend a
   build/generation strategy.
5. **Migration path** — how to evolve `schemaVersion` safely for the existing mock data.

### C. Acceptance criteria for extending content
Concrete, checkable rules a new content record must pass, e.g.:
- Required fields per node `type`; locale coverage rules (which locales mandatory).
- Uniqueness of `id` / `slug`; referential integrity of every `from`/`to`/`workNodeId`/`bookId`/`hadithIds` reference.
- `content[]` block validation (allowed `type`s, required sub-fields, i18n completeness, `ai_context` prompt/answer parity).
- Relationship invariants (e.g. every `HADITH` must resolve to ≥1 `BOOK` via `PART_OF`; isnad must terminate at
   `narrator-prophet` or a documented leaf).
- `schemaVersion` present and supported.
- No orphan nodes / dangling edges.
- Suggested **automated validation** (CI lint/JSON-Schema/type-check) to enforce the above.

### D. (Optional) A concrete target schema
If possible, provide draft JSON Schema and/or TypeScript type definitions for the recommended model so we can adopt it
directly.

---

## 8. Constraints To Respect

- **No backend / no database** in the current architecture — data ships as static JSON and is fetched by the client.
  (Recommendations may propose a *build-time* generator, but the runtime artifact must remain static JSON.)
- **Must remain client-fetchable** and reasonably small per request (lazy-load by book/page).
- **Arabic-script correctness** matters (RTL, diacritics, `ﷺ`/acronyms preserved).
- Existing app reads `nodes.json`, `relationships.json`, `mappings.json`, and the per-page `hadith.json` — the
  migration path must be incremental or provide an adapter.
- Keep multi-language scope open (≥ `ar`, `en`; `fr`/`es` later) without rework.

---

*End of brief.*
