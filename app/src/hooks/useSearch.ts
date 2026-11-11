import { useEffect, useState } from "react";
import { searchRepository } from "@/application/container";
import type { SearchResultDTO } from "@/domain/dto";

interface State {
  results: SearchResultDTO[];
  loading: boolean;
  /** Set only when the repository *threw* — a backend that did not answer, as
   *  opposed to a query with no matches (which is a successful empty list). */
  error: string | null;
}

/** Long enough to swallow a burst of typing, short enough that a pause feels
 *  instant. Only matters with a real backend; the memory provider answers at once. */
const DEBOUNCE_MS = 200;

/**
 * §5.A's `/v1/search?q=` for a component. Debounced because it runs on every
 * keystroke and, with an API base URL, each one would otherwise be a request.
 *
 * A blank query is answered locally with `[]` rather than sent: "search for
 * nothing" is not a question the backend should have to entertain, and the
 * distinction it *does* care about — no matches vs. no answer — survives,
 * because `error` stays `null`.
 */
export function useSearch(query: string) {
  const [state, setState] = useState<State>({ results: [], loading: false, error: null });

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") {
      setState({ results: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    const timer = setTimeout(() => {
      searchRepository
        .search(trimmed)
        .then((results) => {
          if (!cancelled) setState({ results, loading: false, error: null });
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            setState({
              results: [],
              loading: false,
              error: cause instanceof Error ? cause.message : "Unknown error",
            });
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return state;
}
