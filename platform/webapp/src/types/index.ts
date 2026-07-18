/**
 * UI-only types. Domain types (KnowledgeNode, Relationship, ContentBlock,
 * DigitizationTarget, ...) live in src/domain/types.ts — see that file
 * for why: this codebase models Knowledge, not Lessons, so the "core"
 * types are no longer here.
 */

export type UiLang = "ar" | "en";
export type SubtitleLang = "en" | "fr" | "es";
export type ReadingMode = "immersive" | "guided";
export type RightTab = "understand" | "vocab" | "connect" | "practice" | "library" | "biography";
export type SheetId = "chain" | "study" | null;
export type Difficulty = "easy" | "medium" | "hard";
