import { useEffect, useState } from "react";
import { knowledgeRepository } from "@/application/container";
import type { KnowledgeNode } from "@/domain/types";

export function useKnowledgeNode(id: string | null) {
  const [node, setNode] = useState<KnowledgeNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setNode(null);
      return;
    }
    knowledgeRepository.findById(id).then((n) => {
      if (!cancelled) setNode(n);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return node;
}
