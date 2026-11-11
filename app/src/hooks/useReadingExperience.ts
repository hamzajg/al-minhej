import { useEffect, useState } from "react";
import { readingExperienceRepository } from "@/application/container";
import type { ReadingExperienceDTO } from "@/domain/dto";

interface State {
  data: ReadingExperienceDTO | null;
  loading: boolean;
  notFound: boolean;
  /** Set only when the application layer *threw* — a real backend failure,
   *  as opposed to a slug that simply isn't in the graph (`notFound`). */
  error: string | null;
}

/**
 * Resolves to the same shape a real `GET /v1/reading/{slug}` would return.
 * Modeled as async + loading state even though the memory provider
 * resolves instantly, specifically so swapping to a real `fetch()` later
 * doesn't change how any component consumes this hook.
 *
 * That swap is why the rejection path exists: with Memory it was unreachable,
 * with a real backend it is the difference between "the API is down" and a
 * screen stuck on the loading state forever.
 */
export function useReadingExperience(slug: string | undefined) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    notFound: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setState({ data: null, loading: false, notFound: true, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    readingExperienceRepository
      .get(slug)
      .then((dto) => {
        if (cancelled) return;
        setState({ data: dto, loading: false, notFound: dto === null, error: null });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          notFound: false,
          error: cause instanceof Error ? cause.message : "Unknown error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
