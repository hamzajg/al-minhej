import { useEffect, useState } from "react";
import { readingExperienceService } from "@/application/container";
import type { KnowledgeNode } from "@/domain/types";

export function useNodeProgress(node: KnowledgeNode | undefined) {
  const [progress, setProgress] = useState({ indexedUnits: 0, pct: 0 });

  useEffect(() => {
    let cancelled = false;
    if (!node) return;
    readingExperienceService.progressFor(node).then((p) => {
      if (!cancelled) setProgress(p);
    });
    return () => {
      cancelled = true;
    };
  }, [node]);

  return progress;
}
