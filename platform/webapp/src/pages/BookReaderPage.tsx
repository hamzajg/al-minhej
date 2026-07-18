import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BookReadingContent } from "@/components/reader/BookReadingContent";
import { useBookExperience } from "@/hooks/useBookExperience";

export default function BookReaderPage() {
  const { bookSlug, pageNum } = useParams();
  const navigate = useNavigate();
  const parsedPageNum = pageNum ? Number(pageNum) : undefined;
  const { data, loading, notFound } = useBookExperience(bookSlug, parsedPageNum);

  useEffect(() => {
    if (!bookSlug || !parsedPageNum || Number.isNaN(parsedPageNum)) {
      navigate("/library", { replace: true });
    }
  }, [bookSlug, parsedPageNum, navigate]);

  if (loading) {
    return (
      <div className="h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-sub)]">…</div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-ink)] text-sm">
        Not found.
      </div>
    );
  }

  return <BookReadingContent dto={data} />;
}
