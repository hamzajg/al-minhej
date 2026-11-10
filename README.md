# AlMinhej

**AlMinhej** (المنهج) is an Arabic-first platform for guided reading of authentic
Islamic knowledge. Instead of a lesson/course hierarchy, content is modelled as a
**knowledge graph** — `KnowledgeNode`s connected by `Relationship`s — and reading
experiences are assembled at read time.

This repository is the single source of truth for the product vision, the domain
model, and the first client implementation. It is written to be consumed by both
human contributors and AI coding agents.

## Repository layout

| Path | What it is |
|---|---|
| `spec/` | Product and architecture specification, data model, examples, contributing guide |
| `apdk/` | AlMinhej AI Product Development Kit — domain docs, knowledge model, skills, prompts |
| `platform/webapp/` | React 19 + TypeScript + Vite client (Arabic-first, RTL) |
| `CHAIN_OPTIMIZATION_PLAN.md` | Working plan for the knowledge-chain model |

`apdk/` describes how production code should be built; `platform/` contains the
first implementation. See [`apdk/README.md`](apdk/README.md) for the full
architecture narrative and [`platform/webapp/README.md`](platform/webapp/README.md)
for the frontend details.

## Quickstart

```bash
cd platform/webapp
bun install          # or: npm install
bun run dev          # http://localhost:5173
bun run build        # type-check + production build
bun run lint         # oxlint
```

There is no backend yet: the client implements the domain model and reading
experience against in-repo fixtures.

## Status

Early / active development. The knowledge graph, reading experience, and domain
types are in place; persistence and a real API are planned.

## Contributing

Read [`spec/CONTRIBUTING.md`](spec/CONTRIBUTING.md) and
[`apdk/README.md`](apdk/README.md) before changing the domain model. Keep the
knowledge-graph vocabulary (`KnowledgeNode`, `Relationship`) consistent — there
is intentionally no `Lesson` type.

## License

MIT — see [`spec/LICENSE`](spec/LICENSE).
