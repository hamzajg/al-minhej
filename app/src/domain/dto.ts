import type { KnowledgeNode, Localized, RelationshipType } from "./types";

export interface IsnadPersonDTO {
  node: KnowledgeNode;
  role: Localized<string>;
  isNeck: boolean;
}

export interface IsnadBranchDTO {
  node: KnowledgeNode;
  toBookIds: string[];
}

export interface IsnadDTO {
  chain: IsnadPersonDTO[];
  branches: IsnadBranchDTO[];
  books: { node: KnowledgeNode; locator: Localized<string> }[];
}

export interface CommentaryEntryDTO {
  scholar: Localized<string>;
  work: KnowledgeNode;
  note: Localized<string>;
}

export interface ReferenceDTO {
  node: KnowledgeNode;
  note: Localized<string>;
  quoteAr?: string;
  srcLabel?: Localized<string>;
}

export interface GraphNeighborDTO {
  node: KnowledgeNode;
  relationshipType: RelationshipType;
  detail: Localized<string>;
}

export interface ReadingExperienceDTO {
  node: KnowledgeNode;
  isnad: IsnadDTO;
  commentary: CommentaryEntryDTO[];
  quranReferences: ReferenceDTO[];
  relatedHadith: ReferenceDTO[];
  deeperSource: KnowledgeNode | null;
  graph: {
    center: KnowledgeNode;
    neighbors: GraphNeighborDTO[];
  };
}

/**
 * §5.A's `GET /v1/search?q=` — one row per matching node, mixed types in one
 * list (a hadith, a book, a narrator, a verse next to each other). That mixing
 * *is* the point: the search runs over the knowledge graph, so it is not
 * confined to whatever a lesson index happened to contain.
 */
export interface SearchResultDTO {
  node: KnowledgeNode;
  /**
   * Which field the query hit. Carried because "why is this row here?" is the
   * first thing a reader asks of a cross-type result list, and deriving it in
   * the UI would mean re-implementing the match.
   */
  matchedIn: "title" | "keyword" | "content";
  /** Relevance, highest first; the field weight multiplied by §3.1's `boost`. */
  score: number;
  /** A short excerpt around the match, one per language the node carries. */
  snippet: Localized<string>;
}

export interface LibraryEntryDTO {
  node: KnowledgeNode;
  indexedUnits: number;
  pct: number;
}

export interface TOCEntry {
  id: string;
  title: Localized<string>;
  pages: number;
  pageStart: number;
}

export interface HadithRefDTO {
  node: KnowledgeNode;
  pageNum: number;
  locator: Localized<string>;
}

export interface FragmentRelationDTO {
  node: KnowledgeNode;
  type: RelationshipType;
  detail: Localized<string>;
}

export interface MentionDTO {
  node: KnowledgeNode;
  context: Localized<string>;
}

export interface PageExperienceDTO {
  page: KnowledgeNode;
  originalText: { textAr: string; textEn: string; sourceRef: Localized<string> } | null;
  readingNode: KnowledgeNode | null;
  hadiths: KnowledgeNode[];
  fragments: FragmentRelationDTO[];
  mentions: MentionDTO[];
}

export interface BookExperienceDTO {
  book: KnowledgeNode;
  toc: TOCEntry[];
  pages: PageExperienceDTO[];
  currentPageNum: number;
  hadiths: HadithRefDTO[];
  currentHadithIndex: number;
}
