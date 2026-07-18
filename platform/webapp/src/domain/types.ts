export type Locale = "ar" | "en" | "fr" | "es";

export type Localized<T = string> = Partial<Record<Locale, T>> & Pick<Record<Locale, T>, "ar" | "en">;

export type NodeStatus = "draft" | "in_review" | "approved" | "published" | "archived";

export type Provenance = "primary" | "ai_generated";

export type Tier = "primary" | "ai_generated" | "low";

export type NodeType = "HADITH" | "VERSE" | "CONCEPT" | "EVENT" | "NARRATOR" | "BOOK" | "PAGE";

export type NodeId = string;
export type Slug = string;

export type DigitizationStatus = "stub" | "partial" | "complete";

export interface BookIndexEntry {
  id: string;
  title: Localized<string>;
  pageStart: number;
  pageEnd?: number;
  pagesDigitized: number;
}

export type NodeAttributes =
  | { kind: "hadith"; grade: Localized<string>; isnadType: "short" | "full" | "mursal" }
  | { kind: "verse"; ref: { surah: number; ayahStart: number; ayahEnd: number }; refLocalized: Localized<string> }
  | { kind: "concept" }
  | { kind: "event"; dateStart: string; dateEnd?: string }
  | {
      kind: "narrator";
      dateBirth?: string;
      dateDeath?: string;
      grade: Localized<string>;
      isnadDepth?: number;
    }
  | {
      kind: "book";
      author: Localized<string>;
      eraLabel: Localized<string>;
      digitization: {
        totalUnits: number;
        authoredUnits: number;
        unit: Localized<string>;
      };
      index?: BookIndexEntry[];
    }
  | {
      kind: "page";
      bookId: NodeId;
      pageNum: number;
      volumeNum?: number;
      chapterId?: string;
      chapterTitle?: Localized<string>;
      hadithIds: NodeId[];
      sourcePage?: {
        path: string;
        label: Localized<string>;
      };
    };

/* ── Content block registry ── */

interface ContentBlockBase {
  type: string;
  blockVersion: number;
}

export interface ClauseItem {
  id: string;
  text: Localized<string>;
}

export interface VocabEntry {
  id: string;
  word: string;
  root?: string;
  pron?: string;
  occurrences: number[];
  gloss: Localized<string>;
}

export interface AiPrompt {
  key: string;
  question: Localized<string>;
  answer: Localized<string>;
}

export interface QuizOption {
  id: string;
  text: Localized<string>;
}

export interface QuizQuestion {
  question: Localized<string>;
  options: QuizOption[];
  correctOptionId: string;
}

export interface PageAnnotationCitation {
  title: Localized<string>;
  locator?: Localized<string>;
  url?: string;
}

export interface PageAnnotationEntry {
  id: string;
  kind: "side_note" | "marginal_commentary" | "scholarly_annotation";
  title?: Localized<string>;
  scholar?: Localized<string>;
  work?: Localized<string>;
  note: Localized<string>;
  citation?: PageAnnotationCitation;
  relatedNodeIds?: NodeId[];
}

export interface BiographicalReference {
  workTitle: Localized<string>;
  author: Localized<string>;
  locatorType: "tarjamaNumber" | "volumePage" | "yearEntry" | "page";
  locator: string;
  gradeOrNote?: Localized<string>;
  provenance: Provenance;
}

export interface BiographyBlock extends ContentBlockBase {
  type: "biography";
  kunya: Localized<string>;
  nasab: Localized<string>;
  tabaqah?: number;
  tabaqahLabel?: Localized<string>;
  birthPlace: Localized<string>;
  deathInfo: Localized<string>;
  teachers: { narratorId: NodeId; note: Localized<string> }[];
  students: { narratorId: NodeId; note: Localized<string> }[];
  biographicalReferences: BiographicalReference[];
  summary: Localized<string>;
  summaryProvenance: Provenance;
  biographyVersion?: number;
}

export type ContentBlock =
  | (ContentBlockBase & { type: "clauses"; intro: Localized<string>; items: ClauseItem[] })
  | (ContentBlockBase & { type: "vocabulary"; entries: VocabEntry[] })
  | (ContentBlockBase & { type: "commentary"; scholar: Localized<string>; workNodeId: NodeId; note: Localized<string> })
  | (ContentBlockBase & { type: "context"; title: Localized<string>; body: Localized<string> })
  | (ContentBlockBase & { type: "source_page"; title: Localized<string>; text: Localized<string>; sourceRef: Localized<string>; sourceUrl?: string })
  | (ContentBlockBase & { type: "page_annotations"; entries: PageAnnotationEntry[] })
  | (ContentBlockBase & { type: "ai_context"; items: AiPrompt[] })
  | (ContentBlockBase & { type: "quiz"; questions: QuizQuestion[] })
  | BiographyBlock
  | (ContentBlockBase & { type: "lineage"; personNodeId: NodeId; chain: { name: Localized<string>; note?: Localized<string> }[]; convergesWithProphetAt?: { name: Localized<string>; note?: Localized<string> }; agreementNote?: Localized<string>; disputedBeyond?: { afterName: Localized<string>; note: Localized<string> }; taqribSourceNote?: Localized<string> });

/* ── Node ── */

export interface KnowledgeNode {
  id: NodeId;
  type: NodeType;
  slug: Slug;
  status: NodeStatus;
  digitizationStatus: DigitizationStatus;
  title: Localized<string>;
  attributes: NodeAttributes;
  content: ContentBlock[];
  schemaVersion: 2;
  createdAt: string;
  updatedAt: string;
}

/* ── Relationship ── */

export type RelationshipType =
  | "PART_OF"
  | "NARRATED_BY"
  | "EXPLAINS"
  | "REFERENCES"
  | "SIMILAR_TO"
  | "collected_in"
  | "core_concept"
  | "related_hadith"
  | "narrator_in"
  | "full_chain_source"
  | "thematic_link"
  | "involved"
  | "contained_in"
  | "contextual";

export interface Relationship {
  id: NodeId;
  from: NodeId;
  to: NodeId;
  type: RelationshipType;
  generated: boolean;
  metadata?: Record<string, Localized<string> | string | number>;
}

/* ── Isnad (first-class model) ── */

export interface IsnadLink {
  narratorId: NodeId;
  position: number;
  transmissionNote?: Localized<string>;
}

export interface IsnadChain {
  id: string;
  hadithId: NodeId;
  role: "primary" | "branch";
  branchesFrom?: { chainId: string; narratorId: NodeId; position: number };
  links: IsnadLink[];
  terminatesAt:
    | { kind: "narrator-prophet" }
    | { kind: "documented-leaf"; narratorId: NodeId; note: Localized<string> };
}

export interface IsnadData {
  primary: IsnadChain;
  branches: IsnadChain[];
}
