# AGENTS.md — AlMinhej (المنهج)

Guidance for AI agents (and humans) working in this repository.

## Project

Arabic-first platform for guided reading of authentic Islamic knowledge.
Content is modelled as a **knowledge graph** — `KnowledgeNode`s connected
by `Relationship`s — and reading experiences are assembled at read time,
not from a fixed lesson hierarchy. The repo is the single source of truth
for product vision, domain model, and client implementations — written to
be consumed by humans *and* AI agents.

Two clients, unequal weight:
- **`app/` (primary)** — AlMinhej MVP: React 19 + TS + Vite + Tailwind v4
  reading client over the Al-Arba'in an-Nawawiyyah graph. Active product
  work lands here.
- **`platform/webapp/` (secondary)** — earlier elearning/streaming
  platform client (React 19 + Vite, Arabic-first RTL). Maintained, not
  the focus.

Supporting dirs: `apdk/` (product/agent development kit — domain +
knowledge-model markdown specs), `spec/` (spec docs + examples).

## Commands

Verified 2026-11-13 against CI (`.github/workflows/ci.yml`, two jobs:
Node and Bun) and `app/package.json`.

| Task | Command |
|---|---|
| Install (app) | `cd app && npm ci` |
| Dev (app) | `cd app && npm run dev` (Vite) |
| API server (app) | `cd app && npm run api` (`node server/api-server.mjs`) |
| Build (app) | `cd app && npm run build` (`tsc -b && vite build`) |
| Lint (app) | `cd app && npm run lint` (`oxlint`) |
| Install (platform/webapp) | `cd platform/webapp && bun install --frozen-lockfile` (CI uses bun) |
| Build + lint (platform/webapp) | `cd platform/webapp && bun run build && bun run lint` |

## Architecture

```
app/                    PRIMARY client — reading experience MVP
  src/{application,components,context,data,domain,hooks,infrastructure,lib}
  server/api-server.mjs dev/mock API server
  mockdata/             mock knowledge-graph data
  AlMinhej_Backend_Architecture.md  backend architecture doc
  package.json          react 19, vite, tailwind v4, oxlint
platform/webapp/        SECONDARY client — elearning platform
apdk/
  domain/               aggregates.md, repositories.md
  knowledge-model/      entities, identifiers, relationships,
                        knowledge-fragments, projections,
                        bibliography, review-workflow
  skills/               agent-consumable skill docs
spec/                   spec docs + examples
```

### Domain model (from `apdk/`)

Knowledge graph: `KnowledgeNode` entities + `Relationship`s; projections
assemble reading experiences at read time. `apdk/` docs are the
normative spec — read them before changing domain types or API shapes.

## Conventions

- Arabic-first, RTL — all UI must handle RTL correctly; new strings need
  Arabic + appropriate pluralisation.
- `app/` is primary: new domain work, reading experiences, product
  surface go there — not `platform/webapp/`.
- Domain logic stays in `src/domain/` + `src/application/` — components
  stay presentational; data access behind `src/infrastructure/`.
- `apdk/` and `spec/` are normative — update them in the same PR as code
  that changes the model (they're the anti-drift contract for agents).
- KISS: the knowledge graph is the product — don't add a lesson/course
  hierarchy that bypasses it.

## Landmines

- **Default branch is `main`, not `master`.**
- `app/` uses npm; CI's second job uses **bun** for `platform/webapp/` —
  don't assume one package manager across the repo.
- Tailwind **v4** in `app/` — different config conventions than v3.
- `mockdata/` + `server/api-server.mjs` are dev scaffolding — production
  backend is not in this repo; don't treat mock shapes as the real API.
- `apdk/` docs are normative — contradicting them silently is a bug.
- RTL: test Arabic layout before claiming UI works.

## Agent rules

- Branch from `main`; name branches `feat/*`, `fix/*`, `chore/*`, `docs/*`.
- Docs-only changes still go through a PR; never commit to `main` directly.
- Verify before claiming: `cd app && npm ci && npm run build && npm run
  lint` (and bun equivalents for `platform/webapp/`) — report real output.
- Domain/API changes must update `apdk/` + `spec/` in the same PR.
- Keep changes minimal and consistent with surrounding code. No drive-by
  refactors.
- Update AGENTS.md / docs/ARCHITECTURE.md when clients, domain model, or
  commands change.
