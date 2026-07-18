import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenText, ChevronLeft, ChevronRight, ExternalLink, FileText, List, Network, ScrollText, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useSettings } from "@/context/SettingsContext";
import type { BookExperienceDTO } from "@/domain/dto";
import { getClauses } from "@/lib/contentBlocks";
import { bookReaderPath, hadithReaderPath } from "@/lib/routes";

interface Props {
  dto: BookExperienceDTO;
}

export function BookReadingContent({ dto }: Props) {
  const { t, uiLang, dir, showTranslation } = useSettings();
  const navigate = useNavigate();
  const [showToc, setShowToc] = useState(false);

  const currentPage = useMemo(
    () => dto.pages.find((entry) => entry.page.attributes.kind === "page" && entry.page.attributes.pageNum === dto.currentPageNum) ?? null,
    [dto.currentPageNum, dto.pages]
  );

  if (!currentPage || currentPage.page.attributes.kind !== "page") {
    return (
      <div className="h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-ink)] text-sm">
        Not found.
      </div>
    );
  }

  const pageIndex = dto.pages.findIndex((entry) => entry.page.id === currentPage.page.id);
  const prevPage = pageIndex > 0 ? dto.pages[pageIndex - 1] : null;
  const nextPage = pageIndex >= 0 && pageIndex < dto.pages.length - 1 ? dto.pages[pageIndex + 1] : null;
  const pageAttrs = currentPage.page.attributes;
  const bookTitle = uiLang === "ar" ? dto.book.title.ar : dto.book.title.en;
  const chapterTitle =
    uiLang === "ar"
      ? pageAttrs.chapterTitle?.ar ?? currentPage.page.title.ar ?? dto.book.title.ar
      : pageAttrs.chapterTitle?.en ?? currentPage.page.title.en ?? dto.book.title.en;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      <Header
        lessonTag={`${bookTitle} · ${t.page} ${currentPage.page.attributes.pageNum}`}
        logoHref="/library"
      />

      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-wrap gap-2 shrink-0"
        style={{ borderColor: "var(--color-line)", background: "var(--color-panel-2)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/library"
            className="text-[11px] px-2.5 py-[5px] rounded-full border"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}
          >
            {t.backToLibrary}
          </Link>
          <button
            onClick={() => setShowToc(true)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-[5px] rounded-full cursor-pointer border"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            <List size={12} /> {t.toc}
          </button>
          <div className="text-[11px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: "var(--color-sub)" }}>
            <span className="font-bold" style={{ color: "var(--color-ink)" }}>{bookTitle}</span>
            {" · "}
            {t.chapter} {chapterTitle}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--color-sub)" }}>
          <button
            disabled={!prevPage || prevPage.page.attributes.kind !== "page"}
            onClick={() => {
              if (!prevPage || prevPage.page.attributes.kind !== "page") return;
              navigate(bookReaderPath(dto.book.slug, prevPage.page.attributes.pageNum));
            }}
            className="w-6 h-6 rounded grid place-items-center border disabled:opacity-40"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-sub)" }}
          >
            {dir === "rtl" ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
          <span>
            {t.volume} {currentPage.page.attributes.volumeNum ?? 1} · {t.page} {currentPage.page.attributes.pageNum} {t.ofUnits} {dto.pages.length}
          </span>
          <button
            disabled={!nextPage || nextPage.page.attributes.kind !== "page"}
            onClick={() => {
              if (!nextPage || nextPage.page.attributes.kind !== "page") return;
              navigate(bookReaderPath(dto.book.slug, nextPage.page.attributes.pageNum));
            }}
            className="w-6 h-6 rounded grid place-items-center border disabled:opacity-40"
            style={{ background: "var(--color-panel)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          >
            {dir === "rtl" ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      {showToc && (
        <>
          <div onClick={() => setShowToc(false)} className="fixed inset-0 z-[95]" style={{ background: "rgba(0,0,0,.4)" }} />
          <div className="fixed top-0 bottom-0 inset-inline-start-0 w-[86%] max-w-[360px] z-[96] p-[18px] overflow-y-auto border-e" style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-[14px]" style={{ color: "var(--color-ink)" }}>{t.toc}</span>
              <button
                onClick={() => setShowToc(false)}
                className="rounded-full w-7 h-7 cursor-pointer border grid place-items-center"
                style={{ background: "var(--color-panel-2)", borderColor: "var(--color-line)", color: "var(--color-sub)" }}
              >
                <X size={13} />
              </button>
            </div>
            <div className="text-[11px] mb-3.5" style={{ color: "var(--color-sub)" }}>{t.tocHint}</div>
            <div className="grid gap-1.5">
              {dto.toc.map((entry) => {
                const available = entry.pages > 0;
                const active = entry.id === (pageAttrs.chapterId ?? `page-${pageAttrs.pageNum}`);
                return (
                  <button
                    key={entry.id}
                    onClick={() => {
                      if (!available) return;
                      setShowToc(false);
                      navigate(bookReaderPath(dto.book.slug, entry.pageStart));
                    }}
                    className="flex justify-between items-center text-start w-full p-[11px_12px] rounded-[10px] cursor-pointer font-family-inherit border"
                    style={{
                      background: active
                        ? "color-mix(in srgb, var(--color-emerald) 14%, transparent)"
                        : available
                          ? "color-mix(in srgb, var(--color-emerald) 8%, transparent)"
                          : "var(--color-panel-2)",
                      borderColor: active
                        ? "color-mix(in srgb, var(--color-emerald) 40%, transparent)"
                        : available
                          ? "color-mix(in srgb, var(--color-emerald) 27%, transparent)"
                          : "var(--color-line)",
                    }}
                  >
                    <div>
                      <div className="text-[12.5px] font-semibold" style={{ color: "var(--color-ink)" }}>
                        {uiLang === "ar" ? entry.title.ar : entry.title.en}
                      </div>
                      <div className="text-[9.5px] mt-0.5" style={{ color: available ? "var(--color-emerald)" : "var(--color-sub)" }}>
                        {available ? `${entry.pages} ${t.tocDigitizedPages}` : t.notDigitizedYet}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6 py-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-6">
            <section className="rounded-[22px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] tracking-[1.4px] mb-2" style={{ color: "var(--color-gold)" }}>
                    <FileText size={13} /> {t.sourcePageTitle}
                  </div>
                  <h1 className="font-display text-[26px] md:text-[32px] font-semibold m-0">{chapterTitle}</h1>
                  <div className="text-[12px] mt-1" style={{ color: "var(--color-sub)" }}>
                    {currentPage.originalText?.sourceRef[uiLang] ?? pageAttrs.sourcePage?.label[uiLang] ?? ""}
                  </div>
                </div>
                {currentPage.originalText?.sourceUrl && (
                  <a
                    href={currentPage.originalText.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-full border"
                    style={{ background: "var(--color-panel-2)", borderColor: "var(--color-line)" }}
                  >
                    <ExternalLink size={12} /> {t.openSource}
                  </a>
                )}
              </div>

              {currentPage.originalText ? (
                <div className="grid gap-4">
                  <div className="rounded-[18px] border border-[var(--color-line)] bg-[var(--color-bg)] p-5 md:p-6">
                    <div dir="rtl" className="font-arabic text-[24px] md:text-[28px] leading-[2.05] whitespace-pre-line text-center">
                      {currentPage.originalText.textAr}
                    </div>
                  </div>
                  {showTranslation && (
                    <div className="rounded-[18px] border border-[var(--color-line)] bg-[var(--color-panel-2)] p-4 text-[14px] leading-7" style={{ color: "var(--color-sub)" }}>
                      {currentPage.originalText.textEn}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--color-line)] p-5 text-sm" style={{ color: "var(--color-sub)" }}>
                  {t.sourceEmptyNote}
                </div>
              )}
            </section>

            <section className="rounded-[22px] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ScrollText size={16} className="text-[var(--color-gold)]" />
                <h2 className="m-0 text-[16px] font-semibold">{t.hadithsOnPage}</h2>
              </div>
              <div className="grid gap-4">
                {currentPage.hadiths.map((hadith) => {
                  const clauses = getClauses(hadith);
                  const translation = clauses?.items.map((item) => item.text.en).join(" ") ?? "";
                  return (
                    <article key={hadith.id} className="rounded-[18px] border border-[var(--color-line)] bg-[var(--color-bg)] p-4 md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-[11px] mb-1" style={{ color: "var(--color-gold)" }}>
                            {t.hadithNo} {hadith.id.match(/(\d+)$/)?.[1] ?? "—"}
                          </div>
                          <h3 className="m-0 text-[16px] font-semibold">{uiLang === "ar" ? hadith.title.ar : hadith.title.en}</h3>
                        </div>
                        <Link
                          to={hadithReaderPath(hadith.slug, { navMode: "page" })}
                          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-full border"
                          style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}
                        >
                          <BookOpenText size={12} /> {t.openHadithReader}
                        </Link>
                      </div>

                      {clauses?.intro.ar && (
                        <div className="mb-4">
                          <div dir="rtl" className="font-arabic text-[15px] leading-8" style={{ color: "var(--color-sub)" }}>
                            {clauses.intro.ar}
                          </div>
                          {showTranslation && clauses.intro.en && (
                            <div className="text-[12px] italic mt-1.5" style={{ color: "var(--color-sub)" }}>
                              {clauses.intro.en}
                            </div>
                          )}
                        </div>
                      )}

                      {clauses && (
                        <>
                          <div dir="rtl" className="font-arabic text-[22px] leading-[1.95]">
                            {clauses.items.map((item) => item.text.ar).join(" ")}
                          </div>
                          {showTranslation && (
                            <div className="text-[13px] leading-7 mt-3" style={{ color: "var(--color-sub)" }}>
                              {translation}
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="grid gap-4 content-start">
            <section className="rounded-[22px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Network size={15} className="text-[var(--color-gold)]" />
                <h2 className="m-0 text-[15px] font-semibold">{t.pageKnowledgeTitle}</h2>
              </div>
              <div className="grid gap-2">
                {currentPage.fragments.map((fragment) => (
                  <div key={`${fragment.node.id}:${fragment.type}`} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3">
                    <div className="text-[12px] font-semibold">
                      {uiLang === "ar" ? fragment.node.title.ar : fragment.node.title.en}
                    </div>
                    <div className="text-[11px] mt-1 leading-6" style={{ color: "var(--color-sub)" }}>
                      {fragment.detail[uiLang]}
                    </div>
                  </div>
                ))}
                {currentPage.fragments.length === 0 && (
                  <div className="text-[12px]" style={{ color: "var(--color-sub)" }}>{t.notDigitizedYet}</div>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <List size={15} className="text-[var(--color-gold)]" />
                <h2 className="m-0 text-[15px] font-semibold">{t.mentionedEntitiesTitle}</h2>
              </div>
              <div className="grid gap-2">
                {currentPage.mentions.map((mention) => (
                  <div key={mention.node.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3">
                    <div className="text-[12px] font-semibold">
                      {uiLang === "ar" ? mention.node.title.ar : mention.node.title.en}
                    </div>
                    <div className="text-[11px] mt-1 leading-6" style={{ color: "var(--color-sub)" }}>
                      {mention.context[uiLang]}
                    </div>
                  </div>
                ))}
                {currentPage.mentions.length === 0 && (
                  <div className="text-[12px]" style={{ color: "var(--color-sub)" }}>{t.notDigitizedYet}</div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
