/**
 * The server-side `SearchGraph` — §5.A's `GET /v1/search?q=` over §6's
 * `search_index` collection.
 *
 * `src/application/SearchGraph.ts` is the same logic in TypeScript. As with
 * `readingExperience.mjs` and `knowledgeContext.mjs`, the two cannot share a
 * module across the browser/server boundary while this server stays
 * dependency-free, so it is written twice on purpose and the two are held
 * together by a parity check over every fixture query rather than by a shared
 * import that would drag the build toolchain into the server.
 *
 * Only *published* nodes are indexed, for the same reason only published nodes
 * are readable: a draft becoming findable would be a content leak, and search
 * is the easiest place to leak one by accident.
 */

/** Arabic harakat, tatweel, and the Quranic marks — orthography, not letters. */
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/;

/**
 * The letter forms that differ only in how they are written, never in which
 * word they spell. Folding them is what makes a keyboard-typed query find a
 * text typeset with the other spelling.
 */
const LETTER_FOLD = {
  "\u0622": "\u0627", // آ -> ا
  "\u0623": "\u0627", // أ -> ا
  "\u0625": "\u0627", // إ -> ا
  "\u0671": "\u0627", // ٱ -> ا
  "\u0649": "\u064A", // ى -> ي
  "\u0626": "\u064A", // ئ -> ي
  "\u0629": "\u0647", // ة -> ه
  "\u0624": "\u0648", // ؤ -> و
};

/** Any Arabic-script character, including the Arabic-Indic digits. */
const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F]/;

const hasArabic = (text) => ARABIC_SCRIPT.test(text);

/**
 * Fold a string for comparison, remembering where each surviving character came
 * from. Lowercasing and diacritic-stripping both change length, so the map is
 * what lets `excerpt` slice the *original* text rather than its folded ghost.
 */
function fold(text) {
  const chars = [];
  const map = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (DIACRITICS.test(ch)) continue;
    const foldedChar = (LETTER_FOLD[ch] ?? ch).toLowerCase();
    chars.push(foldedChar);
    for (let k = 0; k < foldedChar.length; k += 1) map.push(i);
  }
  return { folded: chars.join(""), map };
}

/**
 * Flatten a node's attributes and content to the plain strings the index holds.
 * Recursive rather than per-block-type on purpose: the block union has grown
 * before, and a new block type should become searchable by existing.
 *
 * The two skipped keys are structure, not language: `type` discriminates the
 * block and `kind` the attributes, so indexing them would make the word
 * "hadith" match every hadith's metadata rather than its text.
 */
function collectText(value, out) {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, out);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (key === "type" || key === "kind") continue;
      collectText(nested, out);
    }
  }
}

/**
 * §6's `search_index` document. Denormalized: the flattened text is copied in
 * so a query never re-walks the content blocks, which is the whole reason the
 * collection exists separately from `knowledge_nodes`.
 *
 * @param {Array} nodes the node set
 * @returns {Array} one entry per published node
 */
export function buildSearchIndex(nodes) {
  return nodes
    .filter((node) => node.status === "published")
    .map((node) => {
      const strings = [];
      collectText(node.attributes, strings);
      collectText(node.content, strings);

      const ar = [];
      const en = [];
      for (const text of strings) (hasArabic(text) ? ar : en).push(text);

      return {
        nodeId: node.id,
        slug: node.slug,
        type: node.type,
        title: node.title,
        keywords: node.search?.keywords ?? [],
        boost: node.search?.boost ?? 1,
        text: { ar: ar.join(" "), en: en.join(" ") },
      };
    });
}

/** The window of `source` shown around the first token, with ellipses only
 *  where text was actually cut. */
function excerpt(source, tokens) {
  if (source.trim() === "") return "";
  const { folded, map } = fold(source);

  let at = -1;
  for (const token of tokens) {
    const found = folded.indexOf(token);
    if (found !== -1 && (at === -1 || found < at)) at = found;
  }
  if (at === -1) return source.length > 160 ? `${source.slice(0, 160).trimEnd()}…` : source;

  const centre = map[at] ?? 0;
  const start = Math.max(0, centre - 60);
  const end = Math.min(source.length, centre + 100);
  const head = start > 0 ? "…" : "";
  const tail = end < source.length ? "…" : "";
  return `${head}${source.slice(start, end).trim()}${tail}`;
}

const FIELD_WEIGHT = { title: 3, keyword: 2, content: 1 };

/**
 * Answer one query against an index. Tokens are ANDed — every word must land —
 * and the field a hit landed in decides both the weight and what the caller is
 * told. Results are ordered by score and then by node id, so the same query
 * answers in the same order on both sides of the parity check.
 *
 * @param {string} query
 * @param {Array} index  §6's `search_index` entries
 * @param {Array} nodes  the node set the index refers to
 * @returns the `SearchResultDTO[]` the route sends
 */
export function searchGraph(query, index, nodes) {
  const tokens = fold(query).folded.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const results = [];

  for (const entry of index) {
    const node = byId.get(entry.nodeId);
    if (node === undefined) continue;

    const title = fold(`${entry.title.ar} ${entry.title.en}`).folded;
    const keywords = fold(entry.keywords.join(" ")).folded;
    const body = fold(`${entry.text.ar} ${entry.text.en}`).folded;

    const hitsTitle = tokens.every((token) => title.includes(token));
    const hitsKeyword = tokens.every((token) => keywords.includes(token));
    const hitsBody = tokens.every((token) => body.includes(token));
    if (!hitsTitle && !hitsKeyword && !hitsBody) continue;

    const matchedIn = hitsTitle ? "title" : hitsKeyword ? "keyword" : "content";
    const useTitle = matchedIn === "title";

    results.push({
      node,
      matchedIn,
      score: FIELD_WEIGHT[matchedIn] * entry.boost,
      snippet: {
        ar: excerpt(useTitle || entry.text.ar.trim() === "" ? entry.title.ar : entry.text.ar, tokens),
        en: excerpt(useTitle || entry.text.en.trim() === "" ? entry.title.en : entry.text.en, tokens),
      },
    });
  }

  results.sort((a, b) => b.score - a.score || (a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0));
  return results;
}
