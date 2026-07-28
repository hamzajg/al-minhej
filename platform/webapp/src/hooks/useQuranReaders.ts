import { useEffect, useState } from "react";
import { quranExperienceService } from "@/application/container";
import type { QuranReaderDTO } from "@/domain/dto";

interface State {
  data: QuranReaderDTO[];
  loading: boolean;
}

export function useQuranReaders() {
  const [state, setState] = useState<State>({ data: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    quranExperienceService.listReaders().then((readers) => {
      if (cancelled) return;
      setState({ data: readers, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
