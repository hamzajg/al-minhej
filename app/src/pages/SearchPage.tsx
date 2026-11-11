import { Search as SearchIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useSettings } from "@/context/SettingsContext";
import { useSearch } from "@/hooks/useSearch";
import type { SearchResultDTO } from "@/domain/dto";
import type { UiStrings } from "@/data/i18n";

const TYPE_LABELS: Record<string, [string, string]> = {
  HADITH: ["حديث", "Hadith"],
  NARRATOR: ["راوٍ", "Narrator"],
  BOOK: ["كتاب", "Book"],
  PAGE: ["صفحة", "Page"],
  VERSE: ["آية", "Verse"],
  CONCEPT: ["مفهوم", "Concept"],
  EVENT: ["حدث", "Event"],
};

function typeLabel(type: string, uiLang: "ar" | "en"): string {
  const labels = TYPE_LABELS[type];
  if (!labels) return type;
  return uiLang === "ar" ? labels[0] : labels[1];
}

/** Why this row is here, in the reader's language. The `matchedIn` value comes
 *  from the search itself, so the caption cannot claim a match the query did
 *  not make. */
function matchCaption(result: SearchResultDTO, t: UiStrings): string {
  const field =
    result.matchedIn === "title"
      ? t.searchInTitle
      : result.matchedIn === "keyword"
        ? t.searchInKeyword
        : t.searchInContent;
  return `${t.searchMatchedIn} ${field}`;
}

export default function SearchPage() {
  const { t, uiLang, dir } = useSettings();
  // The URL is the source of truth for the query, so a search is shareable and
  // the back button behaves. Typing replaces rather than pushes, so a word does
  // not leave one history entry per keystroke.
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const { results, loading, error } = useSearch(query);

  const onChange = (value: string) => {
    setParams(value === "" ? {} : { q: value }, { replace: true });
  };

  return (
    <div dir={dir} className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      <Header />

      <div className="flex-1 overflow-y-auto px-6 py-[50px]">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] mb-2.5 text-[var(--color-gold)]"
              style={{ textTransform: uiLang === "en" ? "uppercase" : "none" }}
            >
              <SearchIcon size={13} /> {t.search}
            </div>
            <h1 className="font-display text-[32px] font-semibold m-0 mb-2">{t.searchTitle}</h1>
            <p className="text-[12.5px] m-0 text-[var(--color-sub)]">{t.searchHint}</p>
          </div>

          <div className="flex items-center gap-[10px] px-4 py-[10px] mb-8 border rounded-xl bg-[var(--color-panel)] border-[var(--color-line)]">
            <SearchIcon size={15} className="shrink-0 text-[var(--color-sub)]" />
            <input
              value={query}
              onChange={(event) => onChange(event.target.value)}
              placeholder={t.searchPlaceholder}
              autoFocus
              className="border-none outline-none bg-transparent flex-1 text-[13px] text-[var(--color-ink)]"
            />
          </div>

          {error !== null && <p className="text-[12.5px] m-0 text-[var(--color-sub)]">{t.searchError}</p>}

          {error === null && query.trim() === "" && (
            <p className="text-[12.5px] m-0 text-[var(--color-sub)]">{t.searchHint}</p>
          )}

          {error === null && query.trim() !== "" && loading && (
            <p className="text-[12.5px] m-0 text-[var(--color-sub)]">{t.searching}</p>
          )}

          {error === null && !loading && query.trim() !== "" && (
            <>
              <div className="text-[11px] mb-3 text-[var(--color-sub)]">
                {results.length} {t.searchResults}
              </div>
              {results.length === 0 ? (
                <p className="text-[12.5px] m-0 text-[var(--color-sub)]">{t.searchEmpty}</p>
              ) : (
                <ul className="list-none p-0 m-0 grid gap-2.5">
                  {results.map((result) => (
                    <li key={result.node.id}>
                      <Link
                        to={`/reading/${encodeURIComponent(result.node.slug)}`}
                        className="block px-4 py-3 border rounded-xl no-underline bg-[var(--color-panel)] border-[var(--color-line)]"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full text-[var(--color-gold)] bg-[var(--color-gold)]/15">
                            {typeLabel(result.node.type, uiLang)}
                          </span>
                          <span className="text-[10px] text-[var(--color-sub)]">
                            {matchCaption(result, t)}
                          </span>
                        </div>
                        <div className="text-[13.5px] font-bold mb-1 text-[var(--color-ink)]">
                          {uiLang === "ar" ? result.node.title.ar : result.node.title.en}
                        </div>
                        <div className="text-[11.5px] text-[var(--color-sub)]">
                          {uiLang === "ar" ? result.snippet.ar : result.snippet.en}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
