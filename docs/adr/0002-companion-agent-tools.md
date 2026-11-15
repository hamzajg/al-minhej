# ADR 0002 — Companion v2: retrieval tools over the knowledge graph

## Status

Accepted — implemented on `feat/companion-agent`.

## Context

`POST /v1/nodes/{id}/companion/ask` answers from one node's bounded
`KnowledgeContextBuilder` output only. Real reader questions routinely
need material outside that neighborhood (a narrator's other reports, a
verse explained elsewhere, a book's other chapters). The obvious fix —
hand the model the whole graph — would destroy the bounded-context
property that makes the companion's grounding testable and keeps prompt
size predictable.

## Decision

Opt-in agent path (`"deep": true` on the existing route) implementing a
bounded Anthropic tool-use loop in `server/companion.mjs`:

- Three read-only tools: `search_knowledge`, `read_node_context`,
  `explore_node` — thin adapters over `searchGraph`,
  `buildKnowledgeContext`, `assembleExplore`. No new data access; tools
  reuse the same modules as the REST routes, so published-only filtering
  is inherited.
- Max 4 iterations; each tool result is JSON-clamped (~6k chars) so a
  large explore payload can't blow the prompt budget.
- The agent system prompt keeps the original hard rules verbatim and adds
  one: tool results count as grounding, nothing else does. Tool failures
  return `is_error` tool_results — the model sees them, the request
  doesn't crash.
- `toolTrace` is persisted in the `ai_sessions` log alongside the answer,
  preserving the scholarly-review audit trail.
- Default path (`deep` absent/false) is byte-for-byte the old behavior.

## Consequences

- Grounding boundary moved from "one node's context" to "context +
  whatever the tools fetched" — still closed-world: every claim traces to
  curated published material or a graceful decline.
- Cost/latency: up to 4 model round-trips per deep question; acceptable
  for an opt-in flag, revisit if it becomes default.
- Client unchanged; the `deep` flag and `toolTrace` are additive response
  fields. A future UI can surface "the companion consulted N sources".
- Provider stays Anthropic-only for now (the key already lives server-side);
  swapping providers means re-implementing the tool-use loop, not the tools.
