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

export function getSourcePage(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "source_page" }> => b.type === "source_page");
}

export function getPageAnnotations(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "page_annotations" }> => b.type === "page_annotations");
}

export function getBiography(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "biography" }> => b.type === "biography");
}

export function getLineage(node: KnowledgeNode) {
  return node.content.find((b): b is Extract<ContentBlock, { type: "lineage" }> => b.type === "lineage");
}

export function getLineageString(node: KnowledgeNode, uiLang: "ar" | "en"): string {
  const lineage = getLineage(node);
  if (!lineage?.chain?.length) return "";
  
  const binConnector = uiLang === "ar" ? " بن " : " bin ";
  return lineage.chain.map((item, idx) => {
    const name = item.name[uiLang] || item.name.ar;
    const prefix = idx > 0 ? binConnector : "";
    const note = item.note ? ` (${item.note[uiLang] || item.note.ar})` : "";
    return `${prefix}${name}${note}`;
  }).join("");
}
