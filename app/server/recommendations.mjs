/**
 * The server-side `RecommendationGraph` — §5.A's `GET /v1/paths/recommended`.
 *
 * `src/application/RecommendationGraph.ts` is the browser-side copy; this module
 * is the dependency-free port of it, exactly as `search.mjs`, `explore.mjs` and
 * `readingExperience.mjs` are ports of their TypeScript twins. The two are held
 * together by a parity check: the whole DTO is assembled both ways over the
 * fixture graph and the serialized results are compared byte for byte. The walk
 * is written twice because the browser bundle and this process cannot share a
 * module — not because the two are allowed to differ.
 *
 * A suggestion is never invented: every candidate is a node some real edge points
 * to, and the `via` edge travels with it so the UI can say *which* connection
 * produced it. When no rule finds a readable node the honest answer is
 * `next: null`, not a plausible-looking guess.
 */

/** Most pedagogical first: keep a collection together, then explicit
 *  cross-references, then similarity, then the weakest signal. */
const DEFAULT_ORDER = ["same_collection", "cross_reference", "similar_to", "shared_narrator"];

/** A node is a valid destination only if it can actually be read. */
function isReadable(node) {
  return node.status === "published" && node.content.length > 0;
}

/** Every edge pointing *at* `nodeId` — the repository read `incomingTo` did. */
function incoming(edges, nodeId) {
  return edges.filter((r) => r.to === nodeId);
}

/** Every edge originating *from* `nodeId` — the repository read `outgoingFrom` did. */
function outgoing(edges, nodeId) {
  return edges.filter((r) => r.from === nodeId);
}

/**
 * The assembled `RecommendationDTO` for one starting slug, or `null` when no
 * *published* node carries it (the route turns that into a `404`).
 *
 * `next` inside the DTO may itself be `null`: the `from` is a real node, but no
 * edge out of it leads somewhere readable. The two nulls are different answers
 * and the caller is expected to tell them apart.
 *
 * @param {{ fromSlug: string, exclude: string[], prefer: string[] }} query
 * @param {Array} nodes         the node set (only *published* nodes qualify)
 * @param {Array} relationships the edge set
 */
export function recommendNext(query, nodes, relationships) {
  const published = nodes.filter((n) => n.status === "published");
  const from = published.find((n) => n.slug === query.fromSlug);
  if (!from) return null;

  const skip = new Set(query.exclude);
  skip.add(from.id);
  const order = query.prefer.length > 0 ? query.prefer : DEFAULT_ORDER;

  for (const reason of order) {
    const next = applyRule(reason, from, skip, published, relationships);
    if (next) return { from, next };
  }
  // No edge from here leads to something readable — say so honestly
  // rather than invent a suggestion the graph does not support.
  return { from, next: null };
}

function applyRule(reason, from, skip, published, relationships) {
  switch (reason) {
    case "same_collection":
      return sameCollection(from, skip, published, relationships);
    case "cross_reference":
      return byEdgeType(from, skip, published, relationships, "cross_reference", ["REFERENCES"]);
    case "similar_to":
      return byEdgeType(from, skip, published, relationships, "similar_to", ["SIMILAR_TO"]);
    case "shared_narrator":
      return sharedNarrator(from, skip, published, relationships);
  }
}

/** Another node collected in the same book — e.g. the next hadith of
 *  Al-Arba'in, or a sibling hadith in Sahih Muslim. */
function sameCollection(from, skip, published, relationships) {
  const partOf = outgoing(relationships, from.id).filter((r) => r.type === "PART_OF");
  const candidates = [];
  for (const edge of partOf) {
    for (const r of incoming(relationships, edge.to)) {
      if (r.type === "PART_OF" && !skip.has(r.from)) {
        candidates.push({ edge: r, nodeId: r.from, anchorId: edge.to });
      }
    }
  }
  return pick(candidates, skip, "same_collection", from, published);
}

/** A direct REFERENCES or SIMILAR_TO edge, in either direction. */
function byEdgeType(from, skip, published, relationships, reason, types) {
  const out = outgoing(relationships, from.id).filter((r) => types.includes(r.type));
  const inc = incoming(relationships, from.id).filter((r) => types.includes(r.type));
  const candidates = [
    ...out.map((edge) => ({ edge, nodeId: edge.to, anchorId: null })),
    ...inc.map((edge) => ({ edge, nodeId: edge.from, anchorId: null })),
  ];
  return pick(candidates, skip, reason, from, published);
}

/** Another hadith that passes through a narrator this one also does. */
function sharedNarrator(from, skip, published, relationships) {
  const mine = outgoing(relationships, from.id).filter((r) => r.type === "NARRATED_BY");
  const candidates = [];
  for (const edge of mine) {
    for (const r of incoming(relationships, edge.to)) {
      if (r.type === "NARRATED_BY" && r.from !== from.id && !skip.has(r.from)) {
        candidates.push({ edge: r, nodeId: r.from, anchorId: edge.to });
      }
    }
  }
  return pick(candidates, skip, "shared_narrator", from, published);
}

/** Resolve candidates to readable nodes and take the first. Ties break
 *  on node id so the same graph always yields the same suggestion. */
function pick(candidates, skip, reason, from, published) {
  const viable = candidates.filter((c) => !skip.has(c.nodeId) && c.nodeId !== from.id);
  if (viable.length === 0) return null;

  const readable = viable
    .map((c) => ({ candidate: c, node: published.find((n) => n.id === c.nodeId) }))
    .filter((x) => x.node !== undefined && isReadable(x.node))
    .sort((a, b) => (a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0));
  if (readable.length === 0) return null;

  const { candidate, node } = readable[0];
  const anchor = candidate.anchorId
    ? published.find((n) => n.id === candidate.anchorId) ?? null
    : null;
  return { node, reason, via: candidate.edge, anchor };
}
