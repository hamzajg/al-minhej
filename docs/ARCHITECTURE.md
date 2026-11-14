# Architecture — AlMinhej (المنهج)

Current-state map. Descriptive, not aspirational; see `docs/adr/` for why.

## Shape

```
al-minhej/
├── app/                      PRIMARY — React 19 reading MVP
│   ├── src/
│   │   ├── domain/           domain types (knowledge graph)
│   │   ├── application/      use-case/app logic
│   │   ├── infrastructure/   data access / adapters
│   │   ├── components/       UI
│   │   ├── context/          React contexts
│   │   ├── hooks/            custom hooks
│   │   ├── data/             data layer
│   │   └── lib/              utilities
│   ├── server/api-server.mjs dev API server
│   ├── mockdata/             mock knowledge-graph data
│   └── AlMinhej_Backend_Architecture.md
├── platform/webapp/          SECONDARY — elearning/streaming client
├── apdk/                     product/agent dev kit (normative specs)
│   ├── domain/               aggregates, repositories
│   └── knowledge-model/      entities, relationships, fragments,
│                             projections, bibliography, review workflow
├── spec/                     spec docs + examples
└── CHAIN_OPTIMIZATION_PLAN.md  perf/architecture notes
```

## Domain model

Content = knowledge graph: `KnowledgeNode`s + `Relationship`s.
Reading experiences are **assembled at read time** via projections —
there is no fixed course/lesson tree. Normative definitions live in
`apdk/knowledge-model/` and `apdk/domain/`.

## Flows

- **Reading (app/):** UI → application layer → infrastructure →
  knowledge-graph data (mock today, real backend later) → projected
  reading experience → components render (RTL, Arabic-first).
- **Dev loop:** `npm run api` serves mock data; `npm run dev` runs Vite.

## Frontend/backend contract

No production backend in repo. `app/server/api-server.mjs` + `mockdata/`
are the dev contract — shapes mirror the knowledge model but are not
authoritative. Real backend per `app/AlMinhej_Backend_Architecture.md`.

## Two-client strategy

`app/` (primary, active) and `platform/webapp/` (secondary, maintained)
share the same domain vision but not code — changes to the knowledge
model must be reflected in `apdk/` specs, then each client adopts at its
own pace.
