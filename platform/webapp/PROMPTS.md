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
