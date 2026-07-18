export function hadithReaderPath(
  slug: string,
  options?: { navMode?: "hadith" | "page" }
) {
  const params = new URLSearchParams();
  if (options?.navMode) params.set("nav", options.navMode);
  const suffix = params.toString();
  return suffix ? `/reading/hadith/${slug}?${suffix}` : `/reading/hadith/${slug}`;
}

export function bookReaderPath(bookSlug: string, pageNum: number) {
  return `/reading/book/${bookSlug}/page/${pageNum}`;
}
