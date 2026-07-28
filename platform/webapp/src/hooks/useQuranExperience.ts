import { useEffect, useState } from "react";
import { quranExperienceService } from "@/application/container";
import type { QuranExperienceDTO } from "@/domain/dto";

interface State {
  data: QuranExperienceDTO | null;
  loading: boolean;
  notFound: boolean;
}

export function useQuranExperience(slug: string | undefined) {
  const [state, setState] = useState<State>({ data: null, loading: true, notFound: false });

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setState({ data: null, loading: false, notFound: true });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    quranExperienceService.surahExperience(slug).then((dto) => {
      if (cancelled) return;
      setState({ data: dto, loading: false, notFound: dto === null });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
