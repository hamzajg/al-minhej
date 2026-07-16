import { useEffect, useState } from "react";
import { knowledgeRepository } from "@/application/container";
import type { KnowledgeNode } from "@/domain/types";

export function useReadingIndex() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);

  useEffect(() => {
    let cancelled = false;
    knowledgeRepository.listByType("HADITH").then((list) => {
      // Exclude lightweight "related hadith" stub nodes (empty content —
      // they're graph neighbors, not standalone reading experiences).
      if (!cancelled) setNodes(list.filter((n) => n.content.length > 0));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return nodes;
}
