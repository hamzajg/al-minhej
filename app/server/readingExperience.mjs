/**
 * The server-side `AssembleReadingExperience` — §5.A's `GET /v1/reading/{slug}`.
 *
 * The client has always been able to assemble a reading experience from raw
 * nodes and edges (`src/application/AssembleReadingExperience.ts`), which meant
 * one read cost three graph round trips and the *interpretation* of the graph
 * lived in the browser. This module is that same interpretation, moved behind
 * the endpoint the architecture doc always named, so the whole DTO arrives in a
 * single response when a backend is configured.
 *
 * It is the server-side twin of the TypeScript class, and the two are held
 * together by a parity check: every readable slug is assembled both ways and
 * the serialized DTOs are compared byte for byte. Same rule as
 * `knowledgeContext.mjs` — the server stays dependency-free, so the graph walk
 * is written twice on purpose and asserted equal rather than shared across the
 * browser/server boundary.
 *
 * Only *published* nodes are ever visible, exactly as in the rest of §5.A: a
 * draft leaking into an assembled experience would be a content bug, and the
 * fixtures happen to be all-published today, so nothing else would catch it.
 */

const ROLE_BY_DEPTH = [
  { ar: "مصدر الحديث", en: "The source" },
  { ar: "صحابي — سمعه مباشرة", en: "Companion — heard it directly" },
  { ar: "تابعي", en: "Successor (Tabi'i)" },
  { ar: "راوٍ", en: "Narrator" },
  { ar: 'عنق السند — راوٍ واحد يمر به الإسناد كله', en: 'The single "neck" of the chain' },
];

/**
 * Assemble the full reading experience for one slug.
 *
 * @param {string} slug
 * @param {Array} nodes         the node set (only *published* nodes qualify)
 * @param {Array} relationships the edge set
 * @returns the `ReadingExperienceDTO` object, or `null` if no published node
 *          has that slug (the route turns that into a `404`).
 */
export function assembleReadingExperience(slug, nodes, relationships) {
  const published = nodes.filter((n) => n.status === "published");
  const node = published.find((n) => n.slug === slug);
  if (!node) return null;

  const byId = (id) => published.find((n) => n.id === id) ?? null;
  const findManyByIds = (ids) => {
    const set = new Set(ids);
    return published.filter((n) => set.has(n.id));
  };
  const outgoingFrom = (id) => relationships.filter((r) => r.from === id);
  const incomingTo = (id) => relationships.filter((r) => r.to === id);
  const neighborsOf = (id) => relationships.filter((r) => r.from === id || r.to === id);

  /* ---------------- assembly steps ---------------- */

  function buildIsnad(hadith) {
    const isShort = hadith.attributes.kind === "hadith" && hadith.attributes.isnadType === "short";
    const hadithEdges = outgoingFrom(hadith.id);
    const narratedByEdges = hadithEdges.filter((r) => r.type === "NARRATED_BY");
    const directNarratorIds = narratedByEdges.map((r) => r.to);

    const connectedNarratorIds = new Set();
    const visited = new Set();
    const queue = [...directNarratorIds];
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const current = byId(currentId);
      if (current && current.type === "NARRATOR") {
        connectedNarratorIds.add(currentId);
        const outgoing = outgoingFrom(currentId);
        const incoming = incomingTo(currentId);
        for (const rel of outgoing) {
          if (rel.type === "NARRATED_BY" && rel.to.startsWith("narrator-") && !visited.has(rel.to)) {
            queue.push(rel.to);
          }
        }
        if (!isShort) {
          for (const rel of incoming) {
            if (rel.type === "NARRATED_BY" && rel.from.startsWith("narrator-") && !visited.has(rel.from)) {
              queue.push(rel.from);
            }
          }
        }
      }
    }

    const allConnected = findManyByIds([...connectedNarratorIds]);

    let chainNarrators = allConnected.filter(
      (n) =>
        n.attributes.kind === "narrator" &&
        n.attributes.isnadDepth !== undefined &&
        !n.attributes.isnadBranch
    );

    if (!isShort) {
      const directSet = new Set(directNarratorIds);
      chainNarrators = chainNarrators.filter((n) => {
        if (directSet.has(n.id)) return true;
        const incoming = incomingTo(n.id);
        return incoming.some((r) => r.type === "NARRATED_BY" && r.from.startsWith("narrator-"));
      });
    }

    chainNarrators.sort((a, b) => (a.attributes.isnadDepth ?? 0) - (b.attributes.isnadDepth ?? 0));

    const chain = chainNarrators.map((n) => {
      const depth = n.attributes.kind === "narrator" ? n.attributes.isnadDepth ?? 0 : 0;
      return { node: n, role: ROLE_BY_DEPTH[depth] ?? { ar: "راوٍ", en: "Narrator" }, isNeck: depth === 4 };
    });

    const branchNarrators = allConnected.filter(
      (n) => n.attributes.kind === "narrator" && n.attributes.isnadBranch
    );
    const branches = branchNarrators.map((n) => {
      const outgoing = outgoingFrom(n.id);
      const toBookIds = outgoing
        .filter((r) => r.type === "REFERENCES" && r.to.startsWith("book-"))
        .map((r) => r.to);
      return { node: n, toBookIds };
    });

    const hadithPartOf = outgoingFrom(hadith.id).filter((r) => r.type === "PART_OF");
    const bookNodes = findManyByIds(hadithPartOf.map((r) => r.to));
    const books = hadithPartOf.map((r) => ({
      node: bookNodes.find((b) => b.id === r.to),
      locator: {
        en: r.metadata?.locator_en ?? "",
        ar: r.metadata?.locator_ar ?? "",
      },
    }));

    return { chain, branches, books };
  }

  function buildCommentary(hadith) {
    const blocks = hadith.content.filter((b) => b.type === "commentary");
    const workNodes = findManyByIds(blocks.map((b) => b.workNodeId));
    return blocks.map((b) => ({
      scholar: b.scholar,
      note: b.note,
      work: workNodes.find((w) => w.id === b.workNodeId),
    }));
  }

  function buildReferencesByType(hadith, type, idPrefix) {
    const outgoing = outgoingFrom(hadith.id).filter(
      (r) => r.type === type && r.to.startsWith(idPrefix)
    );
    const targets = findManyByIds(outgoing.map((r) => r.to));
    return outgoing.map((r) => ({
      node: targets.find((t) => t.id === r.to),
      note: { en: r.metadata?.note_en ?? "", ar: r.metadata?.note_ar ?? "" },
      quoteAr: r.metadata?.verse_ar,
      srcLabel: r.metadata?.src_en ? { en: r.metadata.src_en, ar: r.metadata.src_ar ?? "" } : undefined,
    }));
  }

  function findDeeperSource(hadith) {
    if (hadith.attributes.kind !== "hadith") return null;
    const edges = outgoingFrom(hadith.id);
    const sourceEdge = edges.find((r) => r.type === "full_chain_source");
    if (!sourceEdge) return null;
    return byId(sourceEdge.to);
  }

  function buildGraph(hadith) {
    const edges = neighborsOf(hadith.id);
    const otherIds = edges.map((e) => (e.from === hadith.id ? e.to : e.from));
    const neighborNodes = findManyByIds(otherIds);

    const neighbors = edges
      .map((e) => {
        const otherId = e.from === hadith.id ? e.to : e.from;
        const other = neighborNodes.find((n) => n.id === otherId);
        if (!other) return null;
        const detail = {
          en: e.metadata?.note_en ?? `${e.type.replace("_", " ").toLowerCase()}`,
          ar: e.metadata?.note_ar ?? e.type,
        };
        return { node: other, relationshipType: e.type, detail };
      })
      .filter((n) => n !== null);

    return { center: hadith, neighbors };
  }

  return {
    node,
    isnad: buildIsnad(node),
    commentary: buildCommentary(node),
    quranReferences: buildReferencesByType(node, "REFERENCES", "verse-"),
    relatedHadith: buildReferencesByType(node, "SIMILAR_TO", "hadith-related-"),
    deeperSource: findDeeperSource(node),
    graph: buildGraph(node),
  };
}
