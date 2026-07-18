import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Library, Search, Moon, Sun } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useLibrary } from "@/hooks/useLibrary";
import { bookReaderPath } from "@/lib/routes";

export default function LibraryPage() {
  const { t, uiLang, dir, dark, setUiLang, toggleDark } = useSettings();
  const navigate = useNavigate();
  const { entries, loading } = useLibrary();
  const [query, setQuery] = useState("");

  const books = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(({ node }) => {
      const titleAr = node.title.ar.toLowerCase();
      const titleEn = node.title.en.toLowerCase();
      const author = node.attributes.kind === "book"
        ? `${node.attributes.author.ar} ${node.attributes.author.en}`.toLowerCase()
        : "";
      const chapterText = node.attributes.kind === "book" && node.attributes.index
        ? node.attributes.index.map((entry) => `${entry.title.ar} ${entry.title.en}`).join(" ").toLowerCase()
        : "";
      return [titleAr, titleEn, author, chapterText].some((value) => value.includes(term));
    });
  }, [entries, query]);

  const openBook = (bookSlug: string, pageStart: number) => {
    navigate(bookReaderPath(bookSlug, pageStart));
  };

  return (
    <div dir={dir} className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)] relative" style={{ fontFamily: uiLang === "ar" ? "'Cairo','Inter',sans-serif" : "'Inter',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUpLib { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform:translateY(0);} }
        @keyframes toastInLib { from { opacity:0; transform: translate(-50%,-8px);} to { opacity:1; transform: translate(-50%,0);} }
        .fade-up-lib { animation: fadeUpLib .45s ease both; }
        .book-card { transition: transform .2s, box-shadow .2s; }
        .book-card:hover { transform: translateY(-3px); }
        button:focus-visible { outline: 2px solid var(--color-gold); outline-offset: 2px; }
      `}</style>

      {/* HEADER matching prototype exactly */}
      <header className="h-14 flex items-center justify-between px-4 border-b shrink-0" style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--color-emerald)" }}>
            <span className="font-arabic text-[15px]" style={{ color: "var(--color-gold)" }}>ن</span>
          </div>
          <span className="font-display text-[17px] font-semibold" style={{ color: "var(--color-ink)" }}>{t.appName}</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-line)" }}>
            {(["ar", "en"] as const).map((l) => (
              <button key={l} onClick={() => setUiLang(l)}
                className="text-[11px] px-[9px] py-[7px] cursor-pointer border-none"
                style={{
                  fontFamily: l === "ar" ? "'Cairo',sans-serif" : "'Inter',sans-serif",
                  background: uiLang === l ? "var(--color-emerald)" : "var(--color-panel-2)",
                  color: uiLang === l ? "#F4EFE2" : "var(--color-sub)",
                }}>
                {l === "ar" ? "AR" : "EN"}
              </button>
            ))}
          </div>
          <button onClick={toggleDark} aria-label="Toggle dark mode"
            className="w-8 h-8 rounded-lg grid place-items-center cursor-pointer border"
            style={{ background: "var(--color-panel-2)", borderColor: "var(--color-line)" }}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* LIBRARY SHELF matching prototype exactly */}
      <div className="fade-up-lib flex-1 overflow-y-auto px-6 py-[50px]">
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] mb-2.5" style={{ color: "var(--color-gold)", textTransform: uiLang === "en" ? "uppercase" : "none" }}>
              <Library size={13} /> {t.libraryShelfTag}
            </div>
            <h1 className="font-display text-[38px] font-semibold m-0" style={{ color: "var(--color-ink)" }}>{t.libraryShelfTitle}</h1>
          </div>

          <div className="flex items-center gap-[10px] px-4 py-[10px] mb-9 border rounded-xl" style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}>
            <Search size={15} className="shrink-0" style={{ color: "var(--color-sub)" }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="border-none outline-none bg-none flex-1 text-[13px] font-family-inherit"
              style={{ color: "var(--color-ink)" }}
            />
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {loading && (
              <div className="text-[12px]" style={{ color: "var(--color-sub)" }}>{uiLang === "ar" ? "جارٍ التحميل…" : "Loading…"}</div>
            )}
            {!loading && books.length === 0 && (
              <div className="text-[12px]" style={{ color: "var(--color-sub)" }}>{uiLang === "ar" ? "لا توجد كتب." : "No books available."}</div>
            )}
            {books.map(({ node: book, indexedUnits, pct }) => {
              const attrs = book.attributes.kind === "book" ? book.attributes : null;
              const title = book.title[uiLang] ?? book.title.en;
              const author = attrs?.author ? (attrs.author[uiLang] ?? attrs.author.en) : "";
              const total = attrs?.digitization ? attrs.digitization.totalUnits : 0;
              const unit = attrs?.digitization?.unit ? (attrs.digitization.unit[uiLang] ?? attrs.digitization.unit.en) : "";
              const initial = (book.title.ar ?? title).slice(0, 1);
              const index = attrs?.index ?? [];
              const firstOpenPage = index.find((entry) => entry.pagesDigitized > 0)?.pageStart ?? 1;
              return (
                <button key={book.id} onClick={() => openBook(book.slug, firstOpenPage)} className="book-card"
                  style={{ textAlign: "start", cursor: "pointer", border: "1px solid var(--color-line)", borderRadius: 14, background: "var(--color-panel)", padding: 0, overflow: "hidden", opacity: 1 }}>
                  <div className="h-[90px] flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, var(--color-emerald), color-mix(in srgb, var(--color-emerald) 80%, transparent))" }}>
                    <span className="font-arabic text-[22px]" style={{ color: "var(--color-gold)" }}>{initial}</span>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div className="text-[12.5px] font-bold mb-1" style={{ lineHeight: 1.35, color: "var(--color-ink)" }}>{title}</div>
                    <div className="text-[10px] mb-1.5" style={{ color: "var(--color-sub)" }}>{author}</div>
                    <div className="text-[9.5px]" style={{ color: "var(--color-gold)" }}>{indexedUnits.toLocaleString()} / {total.toLocaleString()} {unit}</div>
                    <div className="text-[9.5px] mt-1" style={{ color: "var(--color-sub)" }}>
                      {pct.toFixed(pct < 1 ? 1 : 0)}% {t.unitsDigitized}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
