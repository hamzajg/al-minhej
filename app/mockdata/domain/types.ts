/**
 * Domain model. This is the "Digital Islamic Library + Knowledge Index" reframe.
 * Everything — a hadith, a book, a page, a narrator, a Qur'an verse — is a
 * KnowledgeFragment. What used to be a hand-authored `Lesson` object is now a
 * *generated projection* over fragments + relationships (see
 * domain/dto.ts and application/AssembleReadingExperience.ts).
 */

export interface Localized<T = string> {
  ar: T;
  en: T;
}

export type NodeStatus = "draft" | "in_review" | "published";

export type NodeType =
  | "BOOK"
  | "PAGE"
  | "HADITH"
  | "VERSE"
  | "NARRATOR"
  | "EVENT"
  | "CONCEPT";

/**
 * Type-specific fields. Deliberately a discriminated union, not a free
 * `Record<string, unknown>` bag — storage can be graph-flexible, but the
 * API/domain layer stays strongly typed so the frontend never has to
 * guess what shape `attributes` is for a given node type.
 */
export interface TOCEntry {
  title: Localized<string>;
  pageNum: number;
  children?: TOCEntry[];
}

export type NodeAttributes =
  | { kind: "book"; author: Localized<string>; eraLabel: string; toc?: TOCEntry[] }
  | { kind: "page"; bookId: string; pageNum: number; sectionTitle?: Localized<string>; readingNodeId?: string; hadithIds?: string[] }
  | { kind: "hadith"; grade: Localized<string>; isnadType?: "full" | "short" }
  | { kind: "verse"; ref: string; refLocalized: Localized<string> }
  | {
      kind: "narrator";
      dates: string;
      grade: Localized<string>;
      note?: Localized<string>;
      isnadDepth?: number;
      isnadBranch?: boolean;
    }
  | { kind: "event"; dates?: string }
  | { kind: "concept" };

/**
 * Digitization progress lives directly on BOOK nodes. There is no
 * separate "Source" type — a book's `indexedUnits` is *derived* by
 * DigitizationProgressService from how many published PAGE nodes actually
 * point at it (see application/DigitizationProgressService.ts), not a
 * hand-maintained counter. What's stored here is only the static half:
 * how big the book is and what unit it's measured in (pages).
 */
export interface DigitizationTarget {
  totalUnits: number;
  unit: Localized<string>;
}

/* ---------------- Content blocks ---------------- */

export interface ClauseTextBlock {
  type: "clauses";
  /** The isnad/attribution line that precedes the hadith's clauses. */
  introAr: string;
  introSub: { en: string; fr?: string; es?: string };
  items: {
    id: number;
    ar: string;
    en: string;
    fr?: string;
    es?: string;
  }[];
}

export interface VocabularyBlock {
  type: "vocabulary";
  entries: VocabEntry[];
}

export interface VocabEntry {
  id: string;
  word: string;
  root: string;
  pron: string;
  occ: number;
  en: string;
  ar: string;
  /** Optional knowledge-graph node this word points at, so tapping the
   *  word in the reading canvas can focus the matching node in the
   *  left (chain) / right (connect) panes. */
  nodeId?: string;
}

export interface CommentaryBlock {
  type: "commentary";
  scholar: Localized<string>;
  /** The book this commentary is drawn from — a real, trackable node id. */
  workNodeId: string;
  note: Localized<string>;
}

export interface ContextBlock {
  type: "context";
  title: Localized<string>;
  body: Localized<string>;
}

export interface AiContextBlock {
  type: "ai_context";
  explanation: Localized<string>;
  prompts: string[];
  answers: Record<"ar" | "en", string[]>;
}

export interface QuizBlock {
  type: "quiz";
  questions: {
    q: Localized<string>;
    options: Localized<string>[];
    correct: number;
  }[];
}

export interface OriginalTextBlock {
  type: "original_text";
  textAr: string;
  textEn?: string;
  sourceRef?: string;
}

export type ContentBlock =
  | ClauseTextBlock
  | VocabularyBlock
  | CommentaryBlock
  | ContextBlock
  | AiContextBlock
  | QuizBlock
  | OriginalTextBlock;

/* ---------------- KnowledgeFragment — the aggregate root ---------------- */

export interface KnowledgeFragment {
  id: string;
  type: NodeType;
  slug: string;
  status: NodeStatus;
  title: Localized<string>;
  attributes: NodeAttributes;
  content: ContentBlock[];
  digitization?: DigitizationTarget; // present only on BOOK nodes
  schemaVersion: number;
}

/* ---------------- Relationship — the edge ---------------- */

export type RelationshipType =
  | "narrated_by"
  | "collected_in"
  | "commented_in"
  | "thematic_link"
  | "core_concept"
  | "contextual"
  | "related_hadith"
  | "grammatical_note"
  | "involved"
  | "authored_by"
  | "narrator_in"
  | "part_of"
  | "section_of"
  | "contained_in"
  | "mentions"
  | "NARRATED_BY"
  | "PART_OF"
  | "REFERENCES"
  | "EXPLAINS"
  | "SIMILAR_TO"
  | "full_chain_source";

export interface Relationship {
  id: string;
  from: string; // node id
  to: string; // node id
  type: RelationshipType;
  /** Free-form, small metadata — isnad depth for chain reconstruction,
   *  locator text for collected_in, "branch" flag for the fan-out point where
   *  a single-narrator chain becomes mass-transmitted. */
  metadata?: Record<string, string>;
}
