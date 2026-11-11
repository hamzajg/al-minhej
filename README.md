# AlMinhej

**AlMinhej** (المنهج) is an Arabic-first platform for guided reading of authentic
Islamic knowledge. Instead of a lesson/course hierarchy, content is modelled as a
**knowledge graph** — `KnowledgeNode`s connected by `Relationship`s — and reading
experiences are assembled at read time.

This repository is the single source of truth for the product vision, the domain
model, and the client implementations. It is written to be consumed by both
human contributors and AI coding agents.

## Product priority

There are two clients in this repository, and they do **not** have equal weight:

| Priority | Path | What it is |
|---|---|---|
| **Primary** | `app/` | The **AlMinhej MVP** — the standalone React 19 client that delivers the current product goal: an Arabic-first, guided *reading* experience over the Al-Arba'in an-Nawawiyyah knowledge graph. This is where active product work happens. |
| Secondary | `platform/webapp/` | The earlier **elearning / streaming platform** client (React 19 + Vite, Arabic-first RTL). Kept building and supported, but no longer the focus. |

The MVP in `app/` is the engineering continuation of
[`AlMinhej_Backend_Architecture.md`](app/AlMinhej_Backend_Architecture.md) and the
living front end of the `apdk/` product vision. New domain work, new reading
experiences, and new product surface should land in `app/`.

## Repository layout

| Path | What it is |
|---|---|
| `app/` | **AlMinhej MVP** (primary) — React 19 + TypeScript + Vite + Tailwind v4 reading client |
| `spec/` | Product and architecture specification, data model, examples, contributing guide |
| `apdk/` | AlMinhej AI Product Development Kit — domain docs, knowledge model, skills, prompts |
| `platform/webapp/` | Secondary elearning / streaming platform client (React 19 + TypeScript + Vite, Arabic-first, RTL) |
| `CHAIN_OPTIMIZATION_PLAN.md` | Working plan for the knowledge-chain model |

`apdk/` describes how production code should be built; `app/` is the primary
implementation and `platform/webapp/` the secondary one. See
[`apdk/README.md`](apdk/README.md) for the full architecture narrative,
[`app/README.md`](app/README.md) for the MVP frontend, and
[`platform/webapp/README.md`](platform/webapp/README.md) for the webapp.

## Quickstart

### Primary — the MVP (`app/`)

```bash
cd app
npm install          # or: bun install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm run lint         # oxlint
```

### Secondary — the elearning / streaming platform (`platform/webapp/`)

```bash
cd platform/webapp
bun install          # or: npm install
bun run dev          # http://localhost:5173
bun run build        # type-check + production build
bun run lint         # oxlint
```

There is no backend yet: both clients implement the domain model and reading
experience against in-repo fixtures.

## Status

Early / active development. The knowledge graph, reading experience, and domain
types are in place; persistence and a real API are planned. Active product work
is on the primary MVP in `app/`.

## Contributing

Read [`spec/CONTRIBUTING.md`](spec/CONTRIBUTING.md) and
[`apdk/README.md`](apdk/README.md) before changing the domain model. Keep the
knowledge-graph vocabulary (`KnowledgeNode`, `Relationship`) consistent — there
is intentionally no `Lesson` type.

## License

MIT — see [`spec/LICENSE`](spec/LICENSE).
