import type {
  AiContextBlock,
  ClauseTextBlock,
  ContextBlock,
  KnowledgeNode,
  OriginalTextBlock,
  QuizBlock,
  VocabularyBlock,
} from "@/domain/types";

export function getClauses(node: KnowledgeNode): ClauseTextBlock | undefined {
  return node.content.find((b): b is ClauseTextBlock => b.type === "clauses");
}

export function getVocabulary(node: KnowledgeNode): VocabularyBlock | undefined {
  return node.content.find((b): b is VocabularyBlock => b.type === "vocabulary");
}

export function getQuiz(node: KnowledgeNode): QuizBlock | undefined {
  return node.content.find((b): b is QuizBlock => b.type === "quiz");
}

export function getAiContext(node: KnowledgeNode): AiContextBlock | undefined {
  return node.content.find((b): b is AiContextBlock => b.type === "ai_context");
}

export function getContext(node: KnowledgeNode): ContextBlock | undefined {
  return node.content.find((b): b is ContextBlock => b.type === "context");
}

export function getOriginalText(node: KnowledgeNode): OriginalTextBlock | undefined {
  return node.content.find((b): b is OriginalTextBlock => b.type === "original_text");
}
