# AlMinhej Specification

This directory is the source of truth for **what** AlMinhej is and **why** it is
built this way. It sits above the implementation in `platform/` and the delivery
kit in `apdk/`.

## Contents

| Path | Purpose |
|---|---|
| `docs/data-model-mock.md` | Knowledge-graph data model (nodes, relationships, projections) |
| `examples/preview-assessment.md` | Worked example of a reading experience |
| `examples/AlMinhejLesson_Sources.jsx` | Reference UI for source attribution |
| `CONTRIBUTING.md` | How to propose and review spec changes |
| `LICENSE` | MIT |

## Principles

- **Knowledge, not lessons.** Content is a graph of `KnowledgeNode`s and
  `Relationship`s. Reading experiences are projections assembled at read time.
- **Arabic-first.** Copy, typography, and layout assume RTL and Arabic content.
- **Traceable.** Every statement can point back to its source.
- **Agent-readable.** Specs are written as structured Markdown so coding agents
  can consume them directly (see `apdk/.ai/`).

## Changing the spec

Open a PR against this directory and follow
[`CONTRIBUTING.md`](CONTRIBUTING.md). Domain-model changes should also update
`apdk/domain/` and the TypeScript types in `platform/webapp/src/domain/`.
