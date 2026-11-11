import type { KnowledgeFragment, Localized, RelationshipType, TOCEntry, OriginalTextBlock } from "./types";

/**
 * What `/v1/reading/{slug}` would return from a real backend. The frontend
 * never assembles this itself — it's produced by
 * application/AssembleReadingExperience.ts, walking fragments + relationships.
 * Every UI component downstream reads from this shape, not from raw fragments.
 */

export interface IsnadPersonDTO {
  node: KnowledgeFragment;
  role: Localized<string>;
  isNeck: boolean; // the single-narrator "neck" of the chain (Yahya)
}

export interface IsnadBranchDTO {
  node: KnowledgeFragment;
  toBookIds: string[];
}

export interface IsnadDTO {
  chain: IsnadPersonDTO[];
  branches: IsnadBranchDTO[];
  books: { node: KnowledgeFragment; locator: Localized<string> }[];
}

export interface CommentaryEntryDTO {
  scholar: Localized<string>;
  work: KnowledgeFragment; // the book node — carries live digitization data
  note: Localized<string>;
}

export interface ReferenceDTO {
  node: KnowledgeFragment;
  note: Localized<string>;
  quoteAr?: string;
  /** Source attribution text for related-hadith cards (e.g. "Sahih Muslim"). */
  srcLabel?: Localized<string>;
}

export interface GraphNeighborDTO {
  node: KnowledgeFragment;
  relationshipType: RelationshipType;
  detail: Localized<string>;
}

export interface ReadingExperienceDTO {
  node: KnowledgeFragment;
  isnad: IsnadDTO;
  commentary: CommentaryEntryDTO[];
  quranReferences: ReferenceDTO[];
  relatedHadith: ReferenceDTO[];
  /** "Go deeper" pointer to a not-yet-digitized commentary work not
   *  already covered by `commentary` above. */
  deeperSource: KnowledgeFragment | null;
  graph: {
    center: KnowledgeFragment;
    neighbors: GraphNeighborDTO[];
  };
}

export interface LibraryEntryDTO {
  node: KnowledgeFragment;
  indexedUnits: number; // derived, see DigitizationProgressService
  pct: number;
}

/* ── Book experience DTOs ───────────────────────────────────────────── */

export interface FragmentRelationDTO {
  fragment: KnowledgeFragment;
  relationshipType: RelationshipType;
  locator?: string; // position on page
}

export interface MentionDTO {
  fragment: KnowledgeFragment;
  relationshipType: RelationshipType;
  detail: Localized<string>;
}

export interface PageRelationDTO {
  node: KnowledgeFragment;
  relationshipType: RelationshipType;
  detail: Localized<string>;
}

export interface PageExperienceDTO {
  page: KnowledgeFragment;
  originalText: OriginalTextBlock;
  /** The structured hadith/verse node this page displays, when one exists.
   *  Drives the interactive, relation-reflecting center canvas (clauses +
   *  vocabulary + isnad + graph) instead of a plain string. */
  readingNode: KnowledgeFragment | null;
  /** Every structured hadith/fragment node on this page, in reading order. */
  hadiths: KnowledgeFragment[];
  fragments: FragmentRelationDTO[]; // all knowledge fragments on this page
  mentions: MentionDTO[]; // what this page references
}

export interface HadithRefDTO {
  node: KnowledgeFragment;
  pageNum: number;
}

export interface BookExperienceDTO {
  book: KnowledgeFragment;
  toc: TOCEntry[];
  pages: PageExperienceDTO[];
  currentPageNum: number;
  /** Flat, ordered list of every hadith/fragment in the book (across all
   *  pages), each tagged with the page it lives on. Powers the global
   *  "hadith 1, 2, 3…" navigation alongside the "page 1, 2, 3…" navigation. */
  hadiths: HadithRefDTO[];
  /** Zero-based index into `hadiths` for the hadith currently displayed. */
  currentHadithIndex: number;
}
