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

export type NodeAttributes =
  | { kind: "book"; author: Localized<string>; eraLabel: string }
  | { kind: "page"; bookId: string; pageNum: number; readingNodeId: string | null; hadithIds: string[] }
  | { kind: "hadith"; grade: Localized<string>; isnadType?: "full" | "short" }
  | { kind: "verse"; ref: string; refLocalized: Localized<string> }
  | {
      kind: "narrator";
      dates: string;
      grade: Localized<string>;
      isnadDepth?: number;
      isnadBranch?: boolean;
    }
  | { kind: "event"; dates?: string }
  | { kind: "concept" };

export interface DigitizationTarget {
  totalUnits: number;
  unit: Localized<string>;
}

export interface ClauseTextBlock {
  type: "clauses";
  introAr: string;
  introSub: Record<"en" | "fr" | "es", string>;
  items: {
    id: number;
    ar: string;
    en: string;
    fr: string;
    es: string;
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
}

export interface CommentaryBlock {
  type: "commentary";
  scholar: Localized<string>;
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
  textEn: string;
  sourceRef: Localized<string>;
}

export type ContentBlock =
  | ClauseTextBlock
  | VocabularyBlock
  | CommentaryBlock
  | ContextBlock
  | AiContextBlock
  | QuizBlock
  | OriginalTextBlock;

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  slug: string;
  status: NodeStatus;
  title: Localized<string>;
  attributes: NodeAttributes;
  content: ContentBlock[];
  digitization?: DigitizationTarget;
  schemaVersion: number;
}

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
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
  metadata?: Record<string, string>;
}
