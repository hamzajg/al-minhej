import type { KnowledgeNode, IsnadChain, Localized, PageAnnotationEntry, RelationshipType } from "./types";

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

export interface PageAnnotationDTO extends Omit<PageAnnotationEntry, "relatedNodeIds"> {
  relatedNodes: KnowledgeNode[];
}

export interface PageExperienceDTO {
  page: KnowledgeNode;
  originalText: { title: Localized<string>; textAr: string; textEn: string; sourceRef: Localized<string>; sourceUrl?: string } | null;
  readingNode: KnowledgeNode | null;
  hadiths: KnowledgeNode[];
  annotations: PageAnnotationDTO[];
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

/* ── Quran ── */

export interface QuranTOCEntry {
  id: string;
  number: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  typeAr: string;
  typeEn: string;
  ayahs: number;
  pageStart: number;
  pagesDigitized: number;
}

export interface QuranReaderDTO {
  node: KnowledgeNode;
  order: number;
  collection: string;
  countsBasmala: boolean | "pending";
  ar: string;
  en: string;
  cityAr: string;
  cityEn: string;
  rumuz?: string;
  qiraatNote?: { ar: string; en: string };
  riwayat: {
    id: string;
    ar: string;
    en: string;
    variant: "verified" | "pending";
    variantAr?: string;
    variantEn?: string;
    note?: string;
    noteEn?: string;
    rumuz?: string;
    segmentReadings?: Record<string, { ar: string; note?: string; noteEn?: string }>;
  }[];
}

export interface QuranExperienceDTO {
  surah: KnowledgeNode;
  toc: QuranTOCEntry[];
  readers: QuranReaderDTO[];
  allRiwayat: {
    id: string;
    ar: string;
    en: string;
    readerId: string;
    readerAr: string;
    readerEn: string;
    collection: string;
    countsBasmala: boolean | "pending";
    variant?: "verified" | "pending";
    variantAr?: string;
    variantEn?: string;
    note?: string;
    noteEn?: string;
    rumuz?: string;
    readerRumuz?: string;
    segmentReadings?: Record<string, { ar: string; note?: string; noteEn?: string }>;
  }[];
  segments: Record<string, { ar: string; arVariant?: string; en: string; variant?: boolean }>;
  vocab: {
    id: string;
    word: string;
    root: string;
    pron: string;
    occ: number;
    en: string;
    ar: string;
  }[];
  tafsir: {
    id: string;
    scholar: string;
    scholarEn: string;
    work: string;
    workEn: string;
    note: { ar: string; en: string };
  }[];
  related: {
    id: string;
    type: string;
    ar: string;
    en: string;
    src?: { ar: string; en: string };
    note?: { ar: string; en: string };
  }[];
  sources: Record<string, {
    id: string;
    ar: string;
    en: string;
    authorAr: string;
    authorEn: string;
    era: string;
    total: number;
    indexed: number;
    unit: { ar: string; en: string };
  }>;
  quiz: {
    q: { ar: string; en: string };
    options: { ar: string; en: string }[];
    correct: number;
  }[];
  companionPrompts: { ar: string[]; en: string[] };
  companionAnswers: { ar: string[]; en: string[] };
  basmalaNote: { ar: string; en: string; pendingReaders: string; pendingReadersEn: string };
  collections: Record<string, { ar: string; en: string; countAr: string; countEn: string }>;
  qiraatPaths: Record<string, { ar: string; en: string; subtitleAr: string; subtitleEn: string; descAr: string; descEn: string }>;
  rumuz?: { ar: string; en: string; descAr: string; descEn: string; letters: Record<string, { reader: string; readerAr: string; readerEn: string; type: string }> };
  shatibiyyahCouplets?: {
    ar: string;
    en: string;
    author: { ar: string; en: string; died: string };
    totalCouplets: number;
    meter: { ar: string; en: string };
    source: { ar: string; en: string };
    basedOn?: { ar: string; en: string };
    fatihaCouplets: Record<string, {
      ar: string;
      en: string;
      sectionAr?: string;
      sectionEn?: string;
      versesRange?: string;
      rumuzLetters?: string[];
      rumuzNotes?: { ar: string; en: string };
    }>;
  };
  durrahCouplets?: {
    ar: string;
    en: string;
    author: { ar: string; en: string; died: string };
    totalCouplets: number;
    meter: { ar: string; en: string };
    source: { ar: string; en: string };
    purpose?: { ar: string; en: string };
    fatihaCouplets: Record<string, {
      ar: string;
      en: string;
      sectionAr?: string;
      sectionEn?: string;
      versesRange?: string;
      rumuzLetters?: string[];
      rumuzNotes?: { ar: string; en: string };
    }>;
  };
  tayyibahCouplets?: {
    ar: string;
    en: string;
    author: { ar: string; en: string; died: string };
    totalCouplets: number;
    meter: { ar: string; en: string };
    source: { ar: string; en: string };
    purpose?: { ar: string; en: string };
    fatihaCouplets: Record<string, {
      ar: string;
      en: string;
      sectionAr?: string;
      sectionEn?: string;
      versesRange?: string;
      rumuzLetters?: string[];
      rumuzNotes?: { ar: string; en: string };
    }>;
  };
}
