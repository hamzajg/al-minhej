import type { KnowledgeRepository, RelationshipRepository, IsnadRepository } from "@/domain/repositories";
import type {
  KnowledgeNode,
  Localized,
} from "@/domain/types";
import type {
  BookExperienceDTO,
  CommentaryEntryDTO,
  FragmentRelationDTO,
  GraphNeighborDTO,
  HadithRefDTO,
  HadithLibraryNavDTO,
  IsnadBranchDTO,
  IsnadDTO,
  IsnadPersonDTO,
  MentionDTO,
  PageExperienceDTO,
  ReadingExperienceDTO,
  ReferenceDTO,
  TOCEntry,
} from "@/domain/dto";
import { getSourcePage } from "@/lib/contentBlocks";
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

    const [isnad, commentary, quranReferences, relatedHadith, deeperSource, libraryNav, graph] =
      await Promise.all([
        this.buildIsnad(node),
        this.buildCommentary(node),
        this.buildReferencesByType(node, "REFERENCES", "verse-"),
        this.buildReferencesByType(node, "SIMILAR_TO", "hadith-related-"),
        this.findDeeperSource(node),
        this.buildLibraryNav(node),
        this.buildGraph(node),
      ]);

    return { node, isnad, commentary, quranReferences, relatedHadith, deeperSource, libraryNav, graph };
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

  async bookExperience(bookSlug: string, pageNum: number): Promise<BookExperienceDTO | null> {
    const book = await this.nodes.findBySlug(bookSlug);
    if (!book || book.type !== "BOOK" || book.attributes.kind !== "book") return null;

    const pages = (await this.nodes.listByType("PAGE"))
      .filter(
        (node) =>
          node.attributes.kind === "page" &&
          node.attributes.bookId === book.id
      )
      .sort((a, b) => {
        const aVolume = a.attributes.kind === "page" ? a.attributes.volumeNum ?? 1 : 1;
        const bVolume = b.attributes.kind === "page" ? b.attributes.volumeNum ?? 1 : 1;
        if (aVolume !== bVolume) return aVolume - bVolume;
        const aPageNum = a.attributes.kind === "page" ? a.attributes.pageNum : 0;
        const bPageNum = b.attributes.kind === "page" ? b.attributes.pageNum : 0;
        return aPageNum - bPageNum;
      });

    if (pages.length === 0) return null;

    const currentPage = pages.find(
      (node) => node.attributes.kind === "page" && node.attributes.pageNum === pageNum
    );
    if (!currentPage) return null;

    const pageExperiences = await Promise.all(
      pages.map((page) => this.buildPageExperience(page))
    );

    const hadiths = this.buildHadithRefs(pageExperiences);
    const currentHadithIndex = hadiths.findIndex((entry) => entry.pageNum === pageNum);

    return {
      book,
      toc: this.buildToc(book, pages),
      pages: pageExperiences,
      currentPageNum: pageNum,
      hadiths,
      currentHadithIndex: currentHadithIndex >= 0 ? currentHadithIndex : 0,
    };
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

  private async buildLibraryNav(node: KnowledgeNode): Promise<HadithLibraryNavDTO | null> {
    if (node.type !== "HADITH") return null;

    const relationships = await this.relationships.outgoingFrom(node.id);
    const partOf = relationships.find((edge) => edge.type === "PART_OF");
    if (!partOf) return null;

    const book = await this.nodes.findById(partOf.to);
    if (!book || book.type !== "BOOK" || book.attributes.kind !== "book") return null;

    const pages = (await this.nodes.listByType("PAGE"))
      .filter(
        (entry) =>
          entry.attributes.kind === "page" &&
          entry.attributes.bookId === book.id
      )
      .sort((a, b) => {
        const aVolume = a.attributes.kind === "page" ? a.attributes.volumeNum ?? 1 : 1;
        const bVolume = b.attributes.kind === "page" ? b.attributes.volumeNum ?? 1 : 1;
        if (aVolume !== bVolume) return aVolume - bVolume;
        const aPageNum = a.attributes.kind === "page" ? a.attributes.pageNum : 0;
        const bPageNum = b.attributes.kind === "page" ? b.attributes.pageNum : 0;
        return aPageNum - bPageNum;
      });

    const currentPage = pages.find(
      (page) => page.attributes.kind === "page" && page.attributes.hadithIds.includes(node.id)
    );
    if (!currentPage || currentPage.attributes.kind !== "page") return null;
    const currentPageAttrs = currentPage.attributes;

    const pageExperiences = await Promise.all(pages.map((page) => this.buildPageExperience(page)));
    const hadiths = this.buildHadithRefs(pageExperiences);
    const currentHadithIndex = hadiths.findIndex((entry) => entry.node.id === node.id);
    const pageOrder = [...new Set(hadiths.map((entry) => entry.pageNum))];
    const currentPageIndex = pageOrder.findIndex((pageNum) => pageNum === currentPageAttrs.pageNum);

    return {
      book,
      toc: this.buildToc(book, pages),
      hadiths,
      currentPageNum: currentPageAttrs.pageNum,
      currentPageIndex: currentPageIndex >= 0 ? currentPageIndex : 0,
      currentVolumeNum: currentPageAttrs.volumeNum ?? 1,
      currentHadithIndex: currentHadithIndex >= 0 ? currentHadithIndex : 0,
      currentChapterId: currentPageAttrs.chapterId ?? `page-${currentPageAttrs.pageNum}`,
      currentChapterTitle: this.getPageChapterTitle(currentPage, book.title),
    };
  }

  private async buildPageExperience(page: KnowledgeNode): Promise<PageExperienceDTO> {
    if (page.attributes.kind !== "page") {
      return {
        page,
        originalText: null,
        readingNode: null,
        hadiths: [],
        fragments: [],
        mentions: [],
      };
    }

    const hadithNodes = await this.nodes.findManyByIds(page.attributes.hadithIds);
    const hadiths = page.attributes.hadithIds
      .map((id) => hadithNodes.find((node) => node.id === id))
      .filter((node): node is KnowledgeNode => Boolean(node));

    const source = getSourcePage(page);
    const { fragments, mentions } = await this.buildPageConnections(hadiths);

    return {
      page,
      originalText: source
        ? {
            title: source.title,
            textAr: source.text.ar,
            textEn: source.text.en,
            sourceRef: source.sourceRef,
            sourceUrl: source.sourceUrl,
          }
        : null,
      readingNode: hadiths[0] ?? null,
      hadiths,
      fragments,
      mentions,
    };
  }

  private async buildPageConnections(hadiths: KnowledgeNode[]): Promise<{
    fragments: FragmentRelationDTO[];
    mentions: MentionDTO[];
  }> {
    const fragmentMap = new Map<string, FragmentRelationDTO>();
    const mentionMap = new Map<string, MentionDTO>();

    for (const hadith of hadiths) {
      const edges = await this.relationships.neighborsOf(hadith.id);
      const otherIds = edges.map((edge) => (edge.from === hadith.id ? edge.to : edge.from));
      const nodes = await this.nodes.findManyByIds(otherIds);

      for (const edge of edges) {
        const otherId = edge.from === hadith.id ? edge.to : edge.from;
        const node = nodes.find((entry) => entry.id === otherId);
        if (!node) continue;

        const detail = this.toLocalizedDetail(edge);

        if (node.type === "CONCEPT" || node.type === "EVENT" || node.type === "VERSE") {
          fragmentMap.set(`${node.id}:${edge.type}`, {
            node,
            type: edge.type,
            detail,
          });
          continue;
        }

        if (node.type === "NARRATOR" || node.type === "BOOK" || node.type === "HADITH") {
          mentionMap.set(node.id, {
            node,
            context: detail,
          });
        }
      }
    }

    return {
      fragments: [...fragmentMap.values()],
      mentions: [...mentionMap.values()],
    };
  }

  private buildHadithRefs(pages: PageExperienceDTO[]): HadithRefDTO[] {
    return pages.flatMap((pageExperience) => {
      if (pageExperience.page.attributes.kind !== "page") return [];
      const pageAttrs = pageExperience.page.attributes;
      const chapterTitle = this.getPageChapterTitle(pageExperience.page);

      return pageExperience.hadiths.map((node) => ({
        node,
        pageNum: pageAttrs.pageNum,
        locator: {
          ar: `${chapterTitle.ar} · الحديث ${this.extractNumericSuffix(node.id) ?? "—"}`,
          en: `${chapterTitle.en} · Hadith ${this.extractNumericSuffix(node.id) ?? "—"}`,
        },
      }));
    });
  }

  private buildToc(book: KnowledgeNode, pages: KnowledgeNode[]): TOCEntry[] {
    if (book.attributes.kind === "book" && book.attributes.index && book.attributes.index.length > 0) {
      return book.attributes.index.map((entry) => ({
        id: entry.id,
        title: entry.title,
        pages: entry.pagesDigitized,
        pageStart: entry.pageStart,
        pageEnd: entry.pageEnd,
        sourcePath: entry.sourcePath,
      }));
    }

    const grouped = new Map<string, { title: Localized<string>; pages: number[] }>();
    for (const page of pages) {
      if (page.attributes.kind !== "page") continue;
      const key = page.attributes.chapterId ?? `page-${page.attributes.pageNum}`;
      const entry = grouped.get(key) ?? {
        title: this.getPageChapterTitle(page, book.title),
        pages: [],
      };
      entry.pages.push(page.attributes.pageNum);
      grouped.set(key, entry);
    }

    return [...grouped.entries()].map(([id, entry]) => {
      const sortedPages = [...entry.pages].sort((a, b) => a - b);
      return {
        id,
        title: entry.title,
        pages: sortedPages.length,
        pageStart: sortedPages[0],
        pageEnd: sortedPages.at(-1),
      };
    });
  }

  private toLocalizedDetail(edge: Awaited<ReturnType<RelationshipRepository["neighborsOf"]>>[number]): Localized<string> {
    return {
      en: (edge.metadata?.note_en as string) ?? `${edge.type.replaceAll("_", " ").toLowerCase()}`,
      ar: (edge.metadata?.note_ar as string) ?? edge.type,
    };
  }

  private extractNumericSuffix(value: string): number | null {
    const match = value.match(/(\d+)$/);
    return match ? Number(match[1]) : null;
  }

  private getPageChapterTitle(page: KnowledgeNode, fallbackTitle?: Localized<string>): Localized<string> {
    if (page.attributes.kind !== "page") {
      return fallbackTitle ?? page.title;
    }

    if (page.attributes.chapterTitle) {
      return page.attributes.chapterTitle;
    }

    const titleAr = page.title.ar || fallbackTitle?.ar || "فصل غير معنون";
    const titleEn = page.title.en || fallbackTitle?.en || "Untitled section";

    return {
      ar: titleAr,
      en: titleEn,
    };
  }
}
