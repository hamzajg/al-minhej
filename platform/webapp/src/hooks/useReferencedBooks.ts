import { useEffect, useState } from "react";
import { knowledgeRepository, relationshipRepository } from "@/application/container";
import type { KnowledgeNode } from "@/domain/types";

/** Books a node points at via a REFERENCES edge — used for narrator
 *  biography sources (Tabaqat Ibn Sa'd, Al-Bidayah wa'n-Nihayah, ...). */
export function useReferencedBooks(nodeId: string | undefined) {
  const [books, setBooks] = useState<KnowledgeNode[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!nodeId) {
      setBooks([]);
      return;
    }
    (async () => {
      const outgoing = await relationshipRepository.outgoingFrom(nodeId);
      const bookIds = outgoing.filter((r) => r.type === "REFERENCES").map((r) => r.to);
      const nodes = await knowledgeRepository.findManyByIds(bookIds);
      if (!cancelled) setBooks(nodes.filter((n) => n.type === "BOOK"));
    })();
    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  return books;
}
