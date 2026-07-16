import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { knowledgeRepository } from "@/application/container";
import ReadingContent from "@/components/reader/ReadingContent";

interface BookContext {
  bookSlug: string;
  pageNum: number;
  totalPages: number;
  bookTitle: { ar: string; en: string };
}

export default function BookReaderPage() {
  const { bookSlug, pageNum } = useParams();
  const navigate = useNavigate();
  const [readingSlug, setReadingSlug] = useState<string | null>(null);
  const [bookCtx, setBookCtx] = useState<BookContext | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!bookSlug || !pageNum) {
      navigate("/library", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      const book = await knowledgeRepository.findBySlug(bookSlug);
      if (!book || book.type !== "BOOK") {
        if (!cancelled) navigate("/library", { replace: true });
        return;
      }

      const allPages = await knowledgeRepository.listByType("PAGE");
      const page = allPages.find(
        (p) =>
          p.attributes.kind === "page" &&
          p.attributes.bookId === book.id &&
          p.attributes.pageNum === Number(pageNum)
      );
      if (!page || page.attributes.kind !== "page" || page.attributes.hadithIds.length === 0) {
        if (!cancelled) setError(true);
        return;
      }

      // Use the first hadith on the page as the reading node
      const readingNode = await knowledgeRepository.findById(
        page.attributes.hadithIds[0]
      );
      if (!readingNode) {
        if (!cancelled) setError(true);
        return;
      }

      const bookPages = allPages.filter(
        (p) => p.attributes.kind === "page" && p.attributes.bookId === book.id
      );

      if (!cancelled) {
        setReadingSlug(readingNode.slug);
        setBookCtx({
          bookSlug,
          pageNum: Number(pageNum),
          totalPages: bookPages.length,
          bookTitle: book.title,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookSlug, pageNum, navigate]);

  if (error) {
    return (
      <div className="h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-ink)] text-sm">
        Not found.
      </div>
    );
  }

  if (!readingSlug || !bookCtx) {
    return (
      <div className="h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-sub)]">…</div>
    );
  }

  return <ReadingContent slug={readingSlug} bookContext={bookCtx} />;
}
