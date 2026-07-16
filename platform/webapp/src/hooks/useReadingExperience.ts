import { useEffect, useState } from "react";
import { readingExperienceService } from "@/application/container";
import type { ReadingExperienceDTO } from "@/domain/dto";

interface State {
  data: ReadingExperienceDTO | null;
  loading: boolean;
  notFound: boolean;
}

/**
 * Resolves to the same shape a real `GET /v1/reading/{slug}` would return.
 * Modeled as async + loading state even though the memory provider
 * resolves instantly, specifically so swapping to a real `fetch()` later
 * doesn't change how any component consumes this hook.
 */
export function useReadingExperience(slug: string | undefined) {
  const [state, setState] = useState<State>({ data: null, loading: true, notFound: false });

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setState({ data: null, loading: false, notFound: true });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    readingExperienceService.execute(slug).then((dto) => {
      if (cancelled) return;
      setState({ data: dto, loading: false, notFound: dto === null });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
