# ADR 0001 — Initial architecture

Date: 2026-11-13 (baseline recorded retroactively)
Status: accepted (describes what is built)

## Context

AlMinhej needed to deliver guided reading of Islamic knowledge without a
conventional course hierarchy, while staying consumable by both human
developers and AI agents.

## Decisions

1. **Knowledge graph over lesson tree.** Content is `KnowledgeNode`s +
   `Relationship`s; reading paths are projections assembled at read time.
   Rationale: flexible, non-linear guided reading; matches how the
   knowledge is actually structured.
2. **`apdk/` as normative spec.** Domain aggregates, repositories, and
   knowledge-model docs live in markdown under `apdk/` — code must conform
   to them, and they update with code. Rationale: single source of truth
   that AI agents can consume without reading implementation.
3. **Two clients, explicit priority.** `app/` (React 19 MVP) is primary;
   `platform/webapp/` (elearning) is secondary/maintained. Rationale:
   product focus without abandoning the earlier client.
4. **Layered frontend in `app/`.** `domain` / `application` /
   `infrastructure` / `components` separation inside the React app.
   Rationale: keep domain logic testable and UI thin.
5. **Arabic-first RTL everywhere.** All UI strings and layout assume
   Arabic/RTL. Rationale: the product's audience and identity.
6. **Dev mock backend.** `server/api-server.mjs` + `mockdata/` let the
   client develop without the real backend. Rationale: unblock frontend
   while backend is designed.

## Consequences / open questions

- Mock shapes may drift from the real backend — `apdk/` is the contract,
  mocks are scaffolding.
- `platform/webapp/` divergence is accepted but must be monitored —
  domain changes need a per-client adoption plan.
- Real backend location/stack is still open (`AlMinhej_Backend_
  Architecture.md` is the current proposal, not settled).
