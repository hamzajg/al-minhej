import { useEffect, useState } from "react";
import { exploreRepository } from "@/application/container";
import type { ExploreDTO } from "@/domain/dto";

interface State {
  data: ExploreDTO | null;
  loading: boolean;
  notFound: boolean;
  /** Set only when the application layer *threw* — a real backend failure, as
   *  opposed to a slug that simply isn't in the published graph (`notFound`). */
  error: string | null;
}

/**
 * Resolves to the same shape a real `GET /v1/explore/{slug}` returns. Modelled
 * as async with a loading state even though the memory provider answers
 * instantly, so swapping to the backend changes nothing for the screen — and
 * with the rejection path present, "the API is down" can never render as "this
 * node has no connections".
 */
export function useExplore(slug: string | undefined) {
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
    exploreRepository
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
