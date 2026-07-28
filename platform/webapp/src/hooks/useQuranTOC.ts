import { useEffect, useState } from "react";
import { quranExperienceService } from "@/application/container";
import type { QuranTOCEntry } from "@/domain/dto";

interface State {
  data: QuranTOCEntry[];
  loading: boolean;
}

export function useQuranTOC() {
  const [state, setState] = useState<State>({ data: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    quranExperienceService.surahToc().then((toc) => {
      if (cancelled) return;
      setState({ data: toc, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
