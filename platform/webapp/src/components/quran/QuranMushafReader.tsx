import { useMemo, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { VocabPopover } from "@/components/reader/VocabPopover";
import type { AyahSegment, Riwayah, VocabWord } from "@/domain/quran";

function buildDisplayAyat(countsBasmala: boolean | "pending"): AyahSegment[] {
  const segments = {
    basmala: { ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", en: "In the name of God, the Most Compassionate, the Most Merciful." },
    hamd: { ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", en: "All praise belongs to God, Lord of all the worlds." },
    rahman: { ar: "الرَّحْمَٰنِ الرَّحِيمِ", en: "The Most Compassionate, the Most Merciful." },
    malik: { ar: "مَلِكِ يَوْمِ الدِّينِ", arVariant: "مَالِكِ يَوْمِ الدِّينِ", en: "Master of the Day of Judgment.", variant: true },
    iyyaka: { ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "You alone we worship, and You alone we ask for help." },
    ihdina: { ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", en: "Guide us to the straight path." },
    siratal1: { ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ", en: "The path of those You have blessed," },
    siratal2: { ar: "غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", en: "not of those who have earned anger, nor of those who have gone astray." },
  };
  if (countsBasmala === true) {
    return [
      { key: "basmala", marker: "١", ...segments.basmala, isBasmala: true },
      { key: "hamd", marker: "٢", ...segments.hamd },
      { key: "rahman", marker: "٣", ...segments.rahman },
      { key: "malik", marker: "٤", ...segments.malik },
      { key: "iyyaka", marker: "٥", ...segments.iyyaka },
      { key: "ihdina", marker: "٦", ...segments.ihdina },
      { key: "siratal", marker: "٧", ar: `${segments.siratal1.ar} ${segments.siratal2.ar}`, en: `${segments.siratal1.en} ${segments.siratal2.en}` },
    ];
  }
  return [
    { key: "basmala", marker: null, ...segments.basmala, isBasmala: true },
    { key: "hamd", marker: "١", ...segments.hamd },
    { key: "rahman", marker: "٢", ...segments.rahman },
    { key: "malik", marker: "٣", ...segments.malik },
    { key: "iyyaka", marker: "٤", ...segments.iyyaka },
    { key: "ihdina", marker: "٥", ...segments.ihdina },
    { key: "siratal1", marker: "٦", ...segments.siratal1 },
    { key: "siratal2", marker: "٧", ...segments.siratal2 },
  ];
}

interface QuranMushafReaderProps {
  titleAr: string;
  typeAr: string;
  typeEn: string;
  ayahCount: number;
  vocab: VocabWord[];
  activeRiwayah: Riwayah;
  fontScale: number;
  isCompact?: boolean;
  onDiscover: (id: string) => void;
  memorize: boolean;
  difficulty: number;
  revealed: Set<string>;
  onToggleReveal: (key: string) => void;
  showTranslation: boolean;
  onCompareSegment: (segmentKey: string) => void;
}

function isOccluded(index: number, difficulty: number) {
  const hash = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
  return hash < difficulty;
}

/** Decorative corner ornament — pure SVG Islamic geometric motif */
function CornerOrnament() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 2 L14 2 L14 6 L6 6 L6 14 L2 14 Z"
        fill="var(--mushaf-border-outer)"
        opacity="0.9"
      />
      <path
        d="M2 2 L8 2 L8 8 L2 8 Z"
        fill="var(--mushaf-gold)"
        opacity="0.65"
      />
      <circle cx="14" cy="14" r="2" fill="var(--mushaf-gold)" opacity="0.75" />
      <path
        d="M14 6 Q18 6 18 10"
        stroke="var(--mushaf-border-outer)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.65"
      />
      <path
        d="M6 14 Q6 18 10 18"
        stroke="var(--mushaf-border-outer)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.65"
      />
    </svg>
  );
}

/** Small decorative divider diamond */
function Diamond() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="var(--mushaf-gold)" opacity="0.5" />
    </svg>
  );
}

/** Decorative surah header rule */
function SurahRule() {
  return (
    <div className="flex items-center justify-center gap-2 my-1">
      <div className="h-px flex-1" style={{ background: "linear-gradient(to left, var(--mushaf-gold), transparent)" }} />
      <Diamond />
      <div className="h-px flex-1" style={{ background: "linear-gradient(to right, var(--mushaf-gold), transparent)" }} />
    </div>
  );
}

export function QuranMushafReader({
  titleAr,
  typeAr,
  typeEn,
  ayahCount,
  vocab,
  activeRiwayah,
  fontScale,
  isCompact,
  onDiscover,
  memorize,
  difficulty,
  revealed,
  onToggleReveal,
  showTranslation,
  onCompareSegment,
}: QuranMushafReaderProps) {
  const { uiLang } = useSettings();
  const [hoverVocab, setHoverVocab] = useState<string | null>(null);

  const usesMalikVariant =
    activeRiwayah.variant === "verified" && activeRiwayah.variantAr === "مَالِكِ";

  const displayAyat = useMemo(
    () => buildDisplayAyat(activeRiwayah.countsBasmala ?? false),
    [activeRiwayah.countsBasmala]
  );

  const vocabByWord = useMemo(() => {
    const map: Record<string, VocabWord> = {};
    vocab.forEach((v) => {
      map[v.word] = v;
    });
    return map;
  }, [vocab]);

  const words = useMemo(() => {
    const list: { key: string; raw: string; clean: string; idx: number; ayah: string }[] = [];
    let idx = 0;
    displayAyat.forEach((ay) => {
      const text = usesMalikVariant && ay.variant ? ay.arVariant ?? ay.ar : ay.ar;
      text.split(" ").forEach((w) => {
        list.push({
          key: `${ay.key}-${idx}`,
          raw: w,
          clean: w.replace(/[،,.:]/g, ""),
          idx,
          ayah: ay.key,
        });
        idx += 1;
      });
    });
    return list;
  }, [displayAyat, usesMalikVariant]);

  const isAr = uiLang === "ar";

  const baseFontSize = (isCompact ? 22 : 26) * fontScale;
  const basmalaFontSize = (isCompact ? 23 : 28) * fontScale;
  const innerPadding = isCompact ? "22px 18px 20px" : "30px 36px 26px";

  return (
    /* ══════════════════════════════════════════════════════════
       MUSHAF PAGE CANVAS
       ══════════════════════════════════════════════════════════ */
    <div
      className={`mf-page w-full${memorize ? " mf-memorize" : ""}`}
      style={{
        maxWidth: 560,
        boxShadow: memorize
          ? "0 0 0 3px color-mix(in srgb, var(--color-emerald) 35%, transparent), 0 28px 60px -24px rgba(0,0,0,.55)"
          : "0 4px 8px -3px rgba(0,0,0,.07), 0 28px 64px -24px rgba(0,0,0,.42)",
      }}
    >
      {/* ── 3-layer gold border frame ── */}
      <div className="mf-frame-outer">
        <div className="mf-frame-mid">
          <div className="mf-frame-inner" style={{ padding: innerPadding }}>

            {/* ── Corner ornaments ── */}
            {(["tl", "tr", "bl", "br"] as const).map((pos) => (
              <div key={pos} className={`mf-corner mf-corner-${pos}`}>
                <CornerOrnament />
              </div>
            ))}

            {/* ── Juz'/Hizb margin annotation (desktop only) ── */}
            {!isCompact && (
              <div
                className="mf-margin"
                style={{ insetInlineEnd: -36 }}
              >
                <div className="mf-margin-label">
                  {isAr ? "الجزء" : "Juz'"}<br />١
                </div>
                <div className="mf-margin-label">
                  {isAr ? "الحزب" : "Hizb"}<br />١
                </div>
              </div>
            )}

            {/* ── Surah Header Cartouche ── */}
            <div className="text-center mb-5">
              <SurahRule />

              <div
                className="mf-cartouche"
                style={{ padding: isCompact ? "10px 32px" : "12px 52px", marginTop: 10, marginBottom: 10 }}
              >
                {/* Surah title */}
                <div
                  className="font-arabic"
                  style={{
                    fontSize: isCompact ? 20 : 24,
                    color: "var(--mushaf-title)",
                    letterSpacing: "0.04em",
                    fontWeight: 400,
                  }}
                >
                  {titleAr}
                </div>

                {/* Metadata line */}
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--mushaf-gold-dark)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {isAr
                    ? `${typeAr} · ${ayahCount} آيات · الجزء ١`
                    : `${typeEn} · ${ayahCount} Verses · Juz' 1`}
                </div>
              </div>

              <SurahRule />
            </div>

            {/* ── Ayah text ── */}
            <div
              className="mf-verses"
              style={{
                fontSize: baseFontSize,
                lineHeight: memorize ? 2.8 : 2.2,
              }}
              dir="rtl"
            >
              {displayAyat.map((ay) => {
                const displayText =
                  usesMalikVariant && ay.variant ? ay.arVariant ?? ay.ar : ay.ar;
                return (
                  <span key={ay.key} className="inline">
                    {ay.isBasmala && (
                      <span
                        className="mf-basmalah block text-center mb-2"
                        style={{
                          fontSize: basmalaFontSize * 0.9,
                        }}
                      >
                        {displayText}
                      </span>
                    )}
                    {!ay.isBasmala &&
                      displayText.split(" ").map((w, wIdx) => {
                        const globalIdx = words.findIndex(
                          (wr) => wr.ayah === ay.key && wr.raw === w
                        );
                        const isRevealed = revealed.has(`${ay.key}-${globalIdx}`);
                        const isHidden =
                          memorize && !isRevealed && isOccluded(globalIdx, difficulty);
                        const vocabEntry = vocabByWord[w];
                        const isVocab = !!vocabEntry;

                        return (
                          <span
                            key={`${ay.key}-${wIdx}`}
                            className={[
                              "inline-block mx-[2px] transition-all duration-200",
                              isHidden ? "text-transparent select-none" : "",
                              isVocab && !isHidden
                                ? "vocab-word cursor-pointer"
                                : "",
                            ].join(" ")}
                            style={{
                              fontSize: wIdx === 0 && ay.marker ? baseFontSize : baseFontSize,
                              color: isHidden
                                ? "transparent"
                                : isVocab
                                  ? "var(--mushaf-highlight)"
                                  : "var(--mushaf-ink)",
                              borderBottom: isVocab && !isHidden
                                ? "1.5px dotted var(--mushaf-gold)"
                                : "none",
                            }}
                            onMouseEnter={() => isVocab && setHoverVocab(w)}
                            onMouseLeave={() => setHoverVocab(null)}
                            onClick={() => {
                              if (memorize) onToggleReveal(`${ay.key}-${globalIdx}`);
                              else if (isVocab && vocabEntry) onDiscover(vocabEntry.id);
                            }}
                          >
                            {w}
                          </span>
                        );
                      })}
                    {ay.marker && !ay.isBasmala && (
                      <span className="mf-rosette">
                        {ay.marker}
                      </span>
                    )}
                    {!ay.isBasmala && (
                      <button
                        onClick={() => onCompareSegment(ay.key)}
                        className="inline-block mx-0.5 text-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
                        style={{
                          fontSize: baseFontSize * 0.5,
                          color: "var(--mushaf-gold-dark)",
                          verticalAlign: "middle",
                        }}
                        title={isAr ? "مقارنة القراءات" : "Compare readings"}
                      >
                        ⇄
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* ── Translation ── */}
            {showTranslation && (
              <div className="mf-translation mt-5 pt-4">
                {displayAyat
                  .filter((ay) => !ay.isBasmala)
                  .map((ay) => (
                    <p
                      key={ay.key}
                      className="text-[12px] leading-relaxed mb-2"
                      style={{ color: "var(--color-sub)", fontFamily: "var(--font-sans)" }}
                    >
                      <span
                        className="mf-rosette inline-flex text-center"
                        style={{
                          width: 20,
                          height: 20,
                          fontSize: 9,
                          verticalAlign: "middle",
                          marginRight: 6,
                        }}
                      >
                        {ay.marker}
                      </span>
                      {ay.en}
                    </p>
                  ))}
              </div>
            )}

            {/* ── Bottom ornamental rule ── */}
            <div className="mt-6 mb-2 flex items-center justify-center gap-2">
              <div className="h-px flex-1" style={{ background: "linear-gradient(to left, var(--mushaf-gold), transparent)" }} />
              <Diamond />
              <div className="h-px flex-1" style={{ background: "linear-gradient(to right, var(--mushaf-gold), transparent)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Vocab popover ── */}
      {hoverVocab && vocabByWord[hoverVocab] && (
        <VocabPopover
          v={vocabByWord[hoverVocab]}
        />
      )}
    </div>
  );
}
