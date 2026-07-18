import { useEffect, useState } from "react";
import { readingExperienceService } from "@/application/container";
import type { BookExperienceDTO } from "@/domain/dto";

interface State {
  data: BookExperienceDTO | null;
  loading: boolean;
  notFound: boolean;
}

export function useBookExperience(bookSlug: string | undefined, pageNum: number | undefined) {
  const [state, setState] = useState<State>({ data: null, loading: true, notFound: false });

  useEffect(() => {
    let cancelled = false;

    if (!bookSlug || !pageNum) {
      setState({ data: null, loading: false, notFound: true });
      return;
    }

    setState((current) => ({ ...current, loading: true }));
    readingExperienceService.bookExperience(bookSlug, pageNum).then((dto) => {
      if (cancelled) return;
      setState({ data: dto, loading: false, notFound: dto === null });
    });

    return () => {
      cancelled = true;
    };
  }, [bookSlug, pageNum]);

  return state;
}
