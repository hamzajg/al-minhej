import type { KnowledgeNode, IsnadChain, Localized, RelationshipType } from "./types";

export interface IsnadPersonDTO {
  node: KnowledgeNode;
  role: Localized<string>;
  position: number;
  transmissionNote?: Localized<string>;
}

export interface IsnadBranchDTO {
  chain: IsnadChain;
  anchors: IsnadPersonDTO;
  members: IsnadPersonDTO[];
}

export interface IsnadDTO {
  primary: IsnadPersonDTO[];
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
  libraryNav: HadithLibraryNavDTO | null;
  graph: {
    center: KnowledgeNode;
    neighbors: GraphNeighborDTO[];
  };
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
  pageEnd?: number;
  sourcePath?: string;
}

export interface HadithRefDTO {
  node: KnowledgeNode;
  pageNum: number;
  locator: Localized<string>;
}

export interface HadithLibraryNavDTO {
  book: KnowledgeNode;
  toc: TOCEntry[];
  hadiths: HadithRefDTO[];
  currentPageNum: number;
  currentPageIndex: number;
  currentVolumeNum: number;
  currentHadithIndex: number;
  currentChapterId: string;
  currentChapterTitle: Localized<string>;
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
  originalText: { title: Localized<string>; textAr: string; textEn: string; sourceRef: Localized<string>; sourceUrl?: string } | null;
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
