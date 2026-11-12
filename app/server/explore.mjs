/**
 * The server-side `ExploreGraph` — §5.A's `GET /v1/explore/{slug}`.
 *
 * `src/application/ExploreGraph.ts` is the browser-side copy; this module is the
 * dependency-free port of it, exactly as `search.mjs` and `readingExperience.mjs`
 * are ports of their TypeScript twins. The two are held together by a parity
 * check: every published slug is assembled both ways and the serialized DTOs are
 * compared byte for byte. The graph walk is written twice because the browser
 * bundle and this process cannot share a module — not because the two are
 * allowed to differ.
 *
 * Only *published* nodes are visible, exactly as in the rest of §5.A: an edge
 * pointing at a draft is not a neighbor, because the graph as published is the
 * graph the reader has.
 */

/**
 * The edge types that connect a node to another by *meaning* rather than by
 * structure. `PART_OF`, `NARRATED_BY`, `EXPLAINS`, `contextual` and the
 * `..._in` edges all say where a node sits in the corpus; these five say what it
 * is *about*, which is what a reader follows when they want more of the same.
 */
const CROSS_REF_TYPES = new Set([
  "REFERENCES",
  "SIMILAR_TO",
  "core_concept",
  "thematic_link",
  "related_hadith",
]);

/** Era ordering for display only — see `compareTimeline`. */
const ERA_RANK = { CE: 0, AH: 1, unknown: 2 };

/** `"194–256 AH"` → `"AH"`, `"c. 584–644 CE"` → `"CE"`, anything else `"unknown"`. */
function eraOf(label) {
  if (/\bAH\b/.test(label)) return "AH";
  if (/\bCE\b/.test(label)) return "CE";
  return "unknown";
}

/** The first integer in a date string, or `null` when there isn't one. */
function yearOf(label) {
  const match = label.match(/\d+/);
  return match ? Number(match[0]) : null;
}

/**
 * The authored date for a node, if it carries one. Narrators and events are
 * dated; books carry an era label instead. Nothing is inferred for the node
 * types that don't — inventing a date for a hadith or a concept would be
 * fabrication, not enrichment.
 */
function dateOf(node) {
  const attributes = node.attributes;
  let label = null;
  if (attributes.kind === "narrator" || attributes.kind === "event") {
    label = attributes.dates ?? null;
  } else if (attributes.kind === "book") {
    label = attributes.eraLabel;
  }
  if (label === null || label.trim() === "") return null;
  return { node, label, era: eraOf(label), year: yearOf(label) };
}

/**
 * Oldest first, *within* an era. The era rank is a display choice, not a
 * chronology: the fixture graph genuinely contains both a Hijri and a Gregorian
 * date, and interleaving them by raw year would assert an ordering nobody
 * authored. Ties break on node id so the order is stable across runs.
 */
function compareTimeline(a, b) {
  if (ERA_RANK[a.era] !== ERA_RANK[b.era]) return ERA_RANK[a.era] - ERA_RANK[b.era];
  const ya = a.year ?? Number.POSITIVE_INFINITY;
  const yb = b.year ?? Number.POSITIVE_INFINITY;
  if (ya !== yb) return ya - yb;
  return a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0;
}

/**
 * The assembled `ExploreDTO` for one slug, or `null` when no published node has
 * it (the route turns that into a `404`).
 *
 * @param {string} slug
 * @param {Array} nodes         the node set (only *published* nodes qualify)
 * @param {Array} relationships the edge set
 */
export function assembleExplore(slug, nodes, relationships) {
  const published = nodes.filter((n) => n.status === "published");
  const node = published.find((n) => n.slug === slug);
  if (!node) return null;

  const byId = (id) => published.find((n) => n.id === id) ?? null;
  const edges = relationships.filter((r) => r.from === node.id || r.to === node.id);

  const neighbors = [];
  const crossRefs = [];
  const timeline = [];
  const dated = new Set();

  for (const edge of edges) {
    const other = byId(edge.from === node.id ? edge.to : edge.from);
    if (!other) continue;

    const detail = {
      en: edge.metadata?.note_en ?? `${edge.type.replace("_", " ").toLowerCase()}`,
      ar: edge.metadata?.note_ar ?? edge.type,
    };
    neighbors.push({ node: other, relationshipType: edge.type, detail });

    if (CROSS_REF_TYPES.has(edge.type)) {
      crossRefs.push({ node: other, relationshipType: edge.type, note: detail });
    }

    // An adjacency list may legitimately name a node twice (a narrator reached
    // by two edge types), but a chronology may not: one person is one date.
    const entry = dateOf(other);
    if (entry && !dated.has(other.id)) {
      dated.add(other.id);
      timeline.push(entry);
    }
  }

  timeline.sort(compareTimeline);

  return { node, neighbors, timeline, crossRefs };
}
