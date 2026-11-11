/**
 * KnowledgeContextBuilder — `AlMinhej_Backend_Architecture.md` §7:
 * "the AI layer never touches the database".
 *
 *   question → KnowledgeContextBuilder → grounded context → LLM → answer
 *
 * Given a node id, this assembles a *bounded* context object: the node's own
 * content blocks plus its immediate graph neighbors, and their content. The
 * LLM is handed that object and nothing else — no database handle, no
 * permission to decide for itself what is relevant. That is what keeps the
 * companion's answers grounded in curated material instead of open-ended
 * generation, and it is the server-side counterpart of the "source
 * transparency" rule the reading UI already enforces visually.
 *
 * "Bounded" is the whole design: neighbor count and snippet length are capped,
 * so the context a prompt is built from has a known, small shape no matter how
 * large the graph grows. A builder that returned "the whole graph" would make
 * criterion 1 of Prompt 5 untestable — there would be no outside-of-context
 * question left to decline.
 *
 * Dependency-free on purpose, like the rest of `server/`.
 */

/** The edges §7 names as the context boundary, plus `PART_OF` for the
 *  containing book, which the reader is always implicitly asking about. */
export const CONTEXT_EDGE_TYPES = ["EXPLAINS", "REFERENCES", "NARRATED_BY", "PART_OF"];

export const MAX_NEIGHBORS = 8;
export const MAX_SNIPPET_CHARS = 400;
export const MAX_BLOCKS = 6;
export const MAX_VOCAB = 12;

const clamp = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/** First readable text on a node, for a one-line neighbor snippet. */
function snippetOf(node) {
  const blocks = Array.isArray(node?.content) ? node.content : [];
  const original = blocks.find((b) => b.type === "original_text");
  if (original?.textAr || original?.textEn) {
    return { ar: clamp(original.textAr ?? "", MAX_SNIPPET_CHARS), en: clamp(original.textEn ?? "", MAX_SNIPPET_CHARS) };
  }
  const clauses = blocks.find((b) => b.type === "clauses");
  if (clauses?.items?.length) {
    return {
      ar: clamp(clauses.items.map((i) => i.ar).join(" "), MAX_SNIPPET_CHARS),
      en: clamp(clauses.items.map((i) => i.en).join(" "), MAX_SNIPPET_CHARS),
    };
  }
  const context = blocks.find((b) => b.type === "context");
  if (context?.body) {
    return { ar: clamp(context.body.ar ?? "", MAX_SNIPPET_CHARS), en: clamp(context.body.en ?? "", MAX_SNIPPET_CHARS) };
  }
  return null;
}

/**
 * Assemble the bounded context for one node.
 *
 * @param {string} nodeId
 * @param {Array} nodes        the node set (only *published* nodes qualify)
 * @param {Array} relationships the edge set
 * @returns the context object, or `null` if there is no such published node.
 */
export function buildKnowledgeContext(nodeId, nodes, relationships) {
  const node = nodes.find((n) => n.id === nodeId && n.status === "published");
  if (!node) return null;

  const blocks = Array.isArray(node.content) ? node.content : [];
  const byId = (id) => nodes.find((n) => n.id === id) ?? null;
  const localized = (value) => (value ? { ar: value.ar ?? "", en: value.en ?? "" } : null);

  const clauses = blocks.find((b) => b.type === "clauses");
  const original = blocks.find((b) => b.type === "original_text");
  const context = blocks.find((b) => b.type === "context");
  const ai = blocks.find((b) => b.type === "ai_context");
  const vocabulary = blocks.find((b) => b.type === "vocabulary");

  const neighbors = [];
  for (const edge of relationships) {
    if (!CONTEXT_EDGE_TYPES.includes(edge.type)) continue;
    if (edge.from !== node.id && edge.to !== node.id) continue;
    const otherId = edge.from === node.id ? edge.to : edge.from;
    const other = byId(otherId);
    if (!other || other.id === node.id) continue;
    // One entry per (neighbor, edge type): a node reachable two ways is still
    // one thing to ground on, and the cap should count distinct material.
    if (neighbors.some((n) => n.node.id === other.id && n.edgeType === edge.type)) continue;
    neighbors.push({
      edgeType: edge.type,
      direction: edge.from === node.id ? "outgoing" : "incoming",
      node: { id: other.id, type: other.type, slug: other.slug, title: localized(other.title) },
      snippet: snippetOf(other),
    });
    if (neighbors.length >= MAX_NEIGHBORS) break;
  }

  return {
    node: { id: node.id, type: node.type, slug: node.slug, title: localized(node.title) },
    original: original
      ? { ar: original.textAr ?? "", en: original.textEn ?? "", source: localized(original.sourceRef) }
      : null,
    clauses: clauses
      ? clauses.items.slice(0, MAX_BLOCKS).map((i) => ({ ar: i.ar ?? "", en: i.en ?? "" }))
      : [],
    context: context ? { title: localized(context.title), body: localized(context.body) } : null,
    aiExplanation: ai ? localized(ai.explanation) : null,
    commentary: blocks
      .filter((b) => b.type === "commentary")
      .slice(0, MAX_BLOCKS)
      .map((b) => {
        const work = byId(b.workNodeId);
        return {
          scholar: localized(b.scholar),
          note: localized(b.note),
          work: work ? localized(work.title) : null,
        };
      }),
    vocabulary: vocabulary
      ? vocabulary.entries.slice(0, MAX_VOCAB).map((e) => ({ word: e.word, en: e.en, ar: e.ar }))
      : [],
    neighbors,
  };
}
