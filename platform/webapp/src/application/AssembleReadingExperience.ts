import type { KnowledgeRepository, RelationshipRepository } from "@/domain/repositories";
import type {
  CommentaryBlock,
  KnowledgeNode,
  Localized,
} from "@/domain/types";
import type {
  CommentaryEntryDTO,
  GraphNeighborDTO,
  IsnadBranchDTO,
  IsnadDTO,
  IsnadPersonDTO,
  ReadingExperienceDTO,
  ReferenceDTO,
} from "@/domain/dto";
import { DigitizationProgressService } from "./DigitizationProgressService";

const ROLE_BY_DEPTH: Localized<string>[] = [
  { ar: "مصدر الحديث", en: "The source" },
  { ar: "صحابي — سمعه مباشرة", en: "Companion — heard it directly" },
  { ar: "تابعي", en: "Successor (Tabi'i)" },
  { ar: "راوٍ", en: "Narrator" },
  { ar: 'عنق السند — راوٍ واحد يمر به الإسناد كله', en: 'The single "neck" of the chain' },
];

/**
 * Orchestrates one use case: "assemble everything connected to this node
 * so the frontend never has to." Equivalent to the `/v1/reading/{slug}`
 * handler described in the architecture doc, just running against the
 * in-memory repositories for now instead of an HTTP call.
 */
export class AssembleReadingExperience {
  private nodes: KnowledgeRepository;
  private relationships: RelationshipRepository;
  private digitization: DigitizationProgressService;

  constructor(nodes: KnowledgeRepository, relationships: RelationshipRepository) {
    this.nodes = nodes;
    this.relationships = relationships;
    this.digitization = new DigitizationProgressService(nodes, relationships);
  }

  async execute(slug: string): Promise<ReadingExperienceDTO | null> {
    const node = await this.nodes.findBySlug(slug);
    if (!node) return null;

    const [isnad, commentary, quranReferences, relatedHadith, deeperSource, graph] =
      await Promise.all([
        this.buildIsnad(node),
        this.buildCommentary(node),
        this.buildReferencesByType(node, "REFERENCES", "verse-"),
        this.buildReferencesByType(node, "SIMILAR_TO", "hadith-related-"),
        this.findDeeperSource(node),
        this.buildGraph(node),
      ]);

    return { node, isnad, commentary, quranReferences, relatedHadith, deeperSource, graph };
  }

  /** A book's live digitization progress, for anywhere a Source chip renders. */
  async progressFor(bookNode: KnowledgeNode): Promise<{ indexedUnits: number; pct: number }> {
    const [indexedUnits, pct] = await Promise.all([
      this.digitization.indexedUnitsFor(bookNode),
      this.digitization.pctFor(bookNode),
    ]);
    return { indexedUnits, pct };
  }

  async library(): Promise<KnowledgeNode[]> {
    return this.nodes.listByType("BOOK");
  }

  /* ---------------- private assembly steps ---------------- */

  private async buildIsnad(hadith: KnowledgeNode): Promise<IsnadDTO> {
    const isShort = hadith.attributes.kind === "hadith" && hadith.attributes.isnadType === "short";
    const hadithEdges = await this.relationships.outgoingFrom(hadith.id);
    const narratedByEdges = hadithEdges.filter((r) => r.type === "NARRATED_BY");
    const directNarratorIds = narratedByEdges.map((r) => r.to);

    const connectedNarratorIds = new Set<string>();
    const visited = new Set<string>();
    const queue = [...directNarratorIds];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const node = await this.nodes.findById(currentId);
      if (node && node.type === "NARRATOR") {
        connectedNarratorIds.add(currentId);
        const [outgoing, incoming] = await Promise.all([
          this.relationships.outgoingFrom(currentId),
          this.relationships.incomingTo(currentId),
        ]);
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

    const allConnected = await this.nodes.findManyByIds([...connectedNarratorIds]);

    let chainNarrators = allConnected
      .filter((n) => n.attributes.kind === "narrator" && n.attributes.isnadDepth !== undefined && !n.attributes.isnadBranch);

    if (!isShort) {
      const directSet = new Set(directNarratorIds);
      const checks = await Promise.all(
        chainNarrators.map(async (n) => {
          if (directSet.has(n.id)) return true;
          const incoming = await this.relationships.incomingTo(n.id);
          return incoming.some((r) => r.type === "NARRATED_BY" && r.from.startsWith("narrator-"));
        })
      );
      chainNarrators = chainNarrators.filter((_, i) => checks[i]);
    }

    chainNarrators.sort((a, b) => {
      const da = a.attributes.kind === "narrator" ? a.attributes.isnadDepth ?? 0 : 0;
      const db = b.attributes.kind === "narrator" ? b.attributes.isnadDepth ?? 0 : 0;
      return da - db;
    });

    const chain: IsnadPersonDTO[] = chainNarrators.map((n) => {
      const depth = n.attributes.kind === "narrator" ? n.attributes.isnadDepth ?? 0 : 0;
      return { node: n, role: ROLE_BY_DEPTH[depth] ?? { ar: "راوٍ", en: "Narrator" }, isNeck: depth === 4 };
    });

    const branchNarrators = allConnected.filter(
      (n) => n.attributes.kind === "narrator" && n.attributes.isnadBranch
    );
    const branches: IsnadBranchDTO[] = await Promise.all(
      branchNarrators.map(async (n) => {
        const outgoing = await this.relationships.outgoingFrom(n.id);
        const toBookIds = outgoing.filter((r) => r.type === "REFERENCES" && r.to.startsWith("book-")).map((r) => r.to);
        return { node: n, toBookIds };
      })
    );

    const hadithPartOf = (await this.relationships.outgoingFrom(hadith.id)).filter(
      (r) => r.type === "PART_OF"
    );
    const bookNodes = await this.nodes.findManyByIds(hadithPartOf.map((r) => r.to));
    const books = hadithPartOf.map((r) => ({
      node: bookNodes.find((b) => b.id === r.to)!,
      locator: {
        en: r.metadata?.locator_en ?? "",
        ar: r.metadata?.locator_ar ?? "",
      },
    }));

    return { chain, branches, books };
  }

  private async buildCommentary(hadith: KnowledgeNode): Promise<CommentaryEntryDTO[]> {
    const blocks = hadith.content.filter((b): b is CommentaryBlock => b.type === "commentary");
    const workNodes = await this.nodes.findManyByIds(blocks.map((b) => b.workNodeId));
    return blocks.map((b) => ({
      scholar: b.scholar,
      note: b.note,
      work: workNodes.find((w) => w.id === b.workNodeId)!,
    }));
  }

  private async buildReferencesByType(
    hadith: KnowledgeNode,
    type: "REFERENCES" | "SIMILAR_TO",
    idPrefix: string
  ): Promise<ReferenceDTO[]> {
    const outgoing = (await this.relationships.outgoingFrom(hadith.id)).filter(
      (r) => r.type === type && r.to.startsWith(idPrefix)
    );
    const targets = await this.nodes.findManyByIds(outgoing.map((r) => r.to));
    return outgoing.map((r) => ({
      node: targets.find((t) => t.id === r.to)!,
      note: { en: r.metadata?.note_en ?? "", ar: r.metadata?.note_ar ?? "" },
      quoteAr: r.metadata?.verse_ar,
      srcLabel: r.metadata?.src_en ? { en: r.metadata.src_en, ar: r.metadata.src_ar ?? "" } : undefined,
    }));
  }

  private async findDeeperSource(hadith: KnowledgeNode): Promise<KnowledgeNode | null> {
    if (hadith.attributes.kind !== "hadith") return null;
    const edges = await this.relationships.outgoingFrom(hadith.id);
    const sourceEdge = edges.find((r) => r.type === "full_chain_source");
    if (!sourceEdge) return null;
    return this.nodes.findById(sourceEdge.to);
  }

  private async buildGraph(hadith: KnowledgeNode) {
    const edges = await this.relationships.neighborsOf(hadith.id);
    const otherIds = edges.map((e) => (e.from === hadith.id ? e.to : e.from));
    const neighborNodes = await this.nodes.findManyByIds(otherIds);

    const neighbors: GraphNeighborDTO[] = edges
      .map((e) => {
        const otherId = e.from === hadith.id ? e.to : e.from;
        const node = neighborNodes.find((n) => n.id === otherId);
        if (!node) return null;
        const detail: Localized<string> = {
          en: e.metadata?.note_en ?? `${e.type.replace("_", " ").toLowerCase()}`,
          ar: e.metadata?.note_ar ?? e.type,
        };
        return { node, relationshipType: e.type, detail } satisfies GraphNeighborDTO;
      })
      .filter((n): n is GraphNeighborDTO => n !== null);

    return { center: hadith, neighbors };
  }
}
