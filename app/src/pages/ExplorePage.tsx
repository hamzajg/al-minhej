import { Clock, Compass, Link2, Network } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MiniGraph } from "@/components/graph/MiniGraph";
import { useSettings } from "@/context/SettingsContext";
import { useExplore } from "@/hooks/useExplore";
import type { ExploreDTO, TimelineEntryDTO } from "@/domain/dto";
import type { UiStrings } from "@/data/i18n";
import { useState } from "react";

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

/** The era is carried on the entry precisely so it can be shown; a reader has to
 *  know whether "194" is a Hijri or a Gregorian year before they can read it. */
function timelineCaption(entry: TimelineEntryDTO, t: UiStrings): string {
  if (entry.era === "unknown") return entry.label;
  return `${entry.label} · ${entry.era === "AH" ? t.exploreEraAH : t.exploreEraCE}`;
}

export default function ExplorePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, dir } = useSettings();
  const { data, loading, notFound, error } = useExplore(slug);
  const [active, setActive] = useState("center");

  return (
    <div dir={dir} className="h-screen w-full flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      <Header />

      <div className="flex-1 overflow-y-auto px-6 py-[50px]">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {loading && <p className="text-[12.5px] text-[var(--color-sub)]">{t.exploreLoading}</p>}

          {!loading && error !== null && (
            <p className="text-[12.5px] text-[var(--color-sub)]">{t.exploreError}</p>
          )}

          {!loading && error === null && (notFound || !data) && (
            <div className="text-center">
              <p className="text-[12.5px] text-[var(--color-sub)]">{t.exploreNotFound}</p>
              <Link to="/library" className="text-[12.5px] text-[var(--color-gold)]">
                {t.backToLibrary}
              </Link>
            </div>
          )}

          {!loading && error === null && data && (
            <ExploreBody data={data} active={active} onSelect={setActive} />
          )}
        </div>
      </div>
    </div>
  );
}

function ExploreBody({
  data,
  active,
  onSelect,
}: {
  data: ExploreDTO;
  active: string;
  onSelect: (id: string) => void;
}) {
  const { t, uiLang } = useSettings();
  const centerLabel = uiLang === "ar" ? data.node.title.ar : data.node.title.en;
  const activeNeighbor = data.neighbors.find((n) => n.node.id === active);
  const activeLabel =
    active === "center"
      ? centerLabel
      : activeNeighbor
        ? uiLang === "ar"
          ? activeNeighbor.node.title.ar
          : activeNeighbor.node.title.en
        : "";
  const activeDetail = active === "center" ? null : activeNeighbor?.detail[uiLang];

  return (
    <>
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 text-[11px] tracking-[1.5px] mb-2.5 text-[var(--color-gold)]"
          style={{ textTransform: uiLang === "en" ? "uppercase" : "none" }}
        >
          <Compass size={13} /> {t.explore}
        </div>
        <h1 className="font-display text-[32px] font-semibold m-0 mb-2">{centerLabel}</h1>
        <p className="text-[12.5px] m-0 text-[var(--color-sub)]">{t.exploreHint}</p>
      </div>

      {/* Neighbors — the same component the reading screen's Connect tab uses,
          over the same DTO shape, because the neighborhood is the same fact. */}
      <MiniGraph centerLabel={centerLabel} neighbors={data.neighbors} active={active} onSelect={onSelect} />
      <div className="mt-3 mb-9 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Network size={13} className="text-[var(--color-gold)]" />
          <span className="font-semibold text-[12.5px]">{activeLabel}</span>
        </div>
        {activeDetail && <p className="text-xs text-[var(--color-sub)] leading-relaxed m-0">{activeDetail}</p>}
      </div>

      <section className="mb-9">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-[var(--color-gold)]" />
          <h2 className="font-display text-[16px] font-semibold m-0">{t.exploreTimeline}</h2>
          <span className="text-[11px] text-[var(--color-sub)]">{data.neighbors.length} {t.exploreNeighbors}</span>
        </div>
        {data.timeline.length === 0 ? (
          <p className="text-[12.5px] text-[var(--color-sub)] m-0">{t.exploreEmpty}</p>
        ) : (
          <ul className="list-none p-0 m-0 grid gap-2">
            {data.timeline.map((entry) => (
              <li key={entry.node.id}>
                <Link
                  to={`/reading/${encodeURIComponent(entry.node.slug)}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 border rounded-xl no-underline bg-[var(--color-panel)] border-[var(--color-line)]"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full text-[var(--color-gold)] bg-[var(--color-gold)]/15 shrink-0">
                      {typeLabel(entry.node.type, uiLang)}
                    </span>
                    <span className="text-[13px] text-[var(--color-ink)] truncate">
                      {uiLang === "ar" ? entry.node.title.ar : entry.node.title.en}
                    </span>
                  </span>
                  <span className="text-[11px] text-[var(--color-sub)] shrink-0">
                    {timelineCaption(entry, t)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={14} className="text-[var(--color-gold)]" />
          <h2 className="font-display text-[16px] font-semibold m-0">{t.exploreCrossRefs}</h2>
        </div>
        {data.crossRefs.length === 0 ? (
          <p className="text-[12.5px] text-[var(--color-sub)] m-0">{t.exploreEmpty}</p>
        ) : (
          <ul className="list-none p-0 m-0 grid gap-2">
            {data.crossRefs.map((ref) => (
              <li key={`${ref.relationshipType}-${ref.node.id}`}>
                <Link
                  to={`/reading/${encodeURIComponent(ref.node.slug)}`}
                  className="block px-4 py-3 border rounded-xl no-underline bg-[var(--color-panel)] border-[var(--color-line)]"
                >
                  <div className="mb-1.5">
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full text-[var(--color-gold)] bg-[var(--color-gold)]/15">
                      {typeLabel(ref.node.type, uiLang)}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-bold mb-1 text-[var(--color-ink)]">
                    {uiLang === "ar" ? ref.node.title.ar : ref.node.title.en}
                  </div>
                  <div className="text-[11.5px] text-[var(--color-sub)]">{ref.note[uiLang]}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
