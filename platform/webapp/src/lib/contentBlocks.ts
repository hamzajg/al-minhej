import type { ContentBlock, KnowledgeNode } from "@/domain/types";

export function getClauses(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "clauses" }> => b.type === "clauses");
}

export function getVocabulary(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "vocabulary" }> => b.type === "vocabulary");
}

export function getQuiz(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "quiz" }> => b.type === "quiz");
}

export function getAiContext(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "ai_context" }> => b.type === "ai_context");
}

export function getContext(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "context" }> => b.type === "context");
}
