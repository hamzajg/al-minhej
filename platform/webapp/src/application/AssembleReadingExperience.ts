import type { KnowledgeRepository, RelationshipRepository, IsnadRepository } from "@/domain/repositories";
import type {
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

export class AssembleReadingExperience {
  private nodes: KnowledgeRepository;
  private relationships: RelationshipRepository;
  private isnad: IsnadRepository;
  private digitization: DigitizationProgressService;

  constructor(
    nodes: KnowledgeRepository,
    relationships: RelationshipRepository,
    isnad: IsnadRepository
  ) {
    this.nodes = nodes;
    this.relationships = relationships;
    this.isnad = isnad;
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
    const slug = hadith.slug;
    const isnadData = await this.isnad.findByHadithSlug(slug);

    // Build books list from PART_OF relationships
    const hadithPartOf = (await this.relationships.outgoingFrom(hadith.id)).filter(
      (r) => r.type === "PART_OF"
    );
    const bookNodes = await this.nodes.findManyByIds(hadithPartOf.map((r) => r.to));
    const books = hadithPartOf.map((r) => ({
      node: bookNodes.find((b) => b.id === r.to)!,
      locator: {
        en: (r.metadata?.locator_en as string) ?? "",
        ar: (r.metadata?.locator_ar as string) ?? "",
      },
    }));

    if (!isnadData) {
      // Fallback: no isnad data, return empty chain
      return { primary: [], branches: [], books };
    }

    // Resolve primary chain narrators
    const primaryNarratorIds = isnadData.primary.links.map((l) => l.narratorId);
    const primaryNarratorNodes = await this.nodes.findManyByIds(primaryNarratorIds);
    const primary: IsnadPersonDTO[] = isnadData.primary.links.map((link) => {
      const node = primaryNarratorNodes.find((n) => n.id === link.narratorId)!;
      const depth = node.attributes.kind === "narrator" ? node.attributes.isnadDepth ?? 0 : 0;
      return {
        node,
        role: ROLE_BY_DEPTH[depth] ?? { ar: "راوٍ", en: "Narrator" },
        position: link.position,
        transmissionNote: link.transmissionNote,
      };
    });

    // Resolve branch chains
    const branches: IsnadBranchDTO[] = [];
    for (const branchChain of isnadData.branches) {
      const branchNarratorIds = branchChain.links.map((l) => l.narratorId);
      const branchNarratorNodes = await this.nodes.findManyByIds(branchNarratorIds);

      // Find the anchor node (the primary chain narrator this branch connects to)
      const anchorNode = primary.find(
        (p) => p.node.id === branchChain.branchesFrom?.narratorId
      );

      const members: IsnadPersonDTO[] = branchChain.links.map((link) => {
        const node = branchNarratorNodes.find((n) => n.id === link.narratorId)!;
        const depth = node.attributes.kind === "narrator" ? node.attributes.isnadDepth ?? 0 : 0;
        return {
          node,
          role: ROLE_BY_DEPTH[depth] ?? { ar: "راوٍ", en: "Narrator" },
          position: link.position,
          transmissionNote: link.transmissionNote,
        };
      });

      if (anchorNode && members.length > 0) {
        branches.push({
          chain: branchChain,
          anchors: anchorNode,
          members,
        });
      }
    }

    return { primary, branches, books };
  }

  private async buildCommentary(hadith: KnowledgeNode): Promise<CommentaryEntryDTO[]> {
    const blocks = hadith.content.filter((b): b is Extract<import("@/domain/types").ContentBlock, { type: "commentary" }> => b.type === "commentary");
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
      note: {
        en: (r.metadata?.note_en as string) ?? "",
        ar: (r.metadata?.note_ar as string) ?? "",
      },
      quoteAr: r.metadata?.verse_ar as string,
      srcLabel: r.metadata?.src_en
        ? { en: r.metadata.src_en as string, ar: (r.metadata.src_ar as string) ?? "" }
        : undefined,
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
          en: (e.metadata?.note_en as string) ?? `${e.type.replace("_", " ").toLowerCase()}`,
          ar: (e.metadata?.note_ar as string) ?? e.type,
        };
        return { node, relationshipType: e.type, detail } satisfies GraphNeighborDTO;
      })
      .filter((n): n is GraphNeighborDTO => n !== null);

    return { center: hadith, neighbors };
  }
}
