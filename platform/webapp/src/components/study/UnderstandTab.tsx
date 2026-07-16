import { BookOpen, Info, MapPin, Quote, Sparkles } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { SourceChip } from "@/components/sources/SourceChip";
import { getAiContext, getContext } from "@/lib/contentBlocks";
import type { ReadingExperienceDTO } from "@/domain/dto";

interface Props {
  dto: ReadingExperienceDTO;
  onOpenSource: (id: string) => void;
}

export function UnderstandTab({ dto, onOpenSource }: Props) {
  const { t, uiLang } = useSettings();
  const ai = getAiContext(dto.node);
  const context = getContext(dto.node);
  const [primaryCommentary, ...restCommentary] = dto.commentary;

  return (
    <div className="grid gap-3.5">
      {ai && ai.items.length > 0 && (
        <LabeledCard tone="gold" title={t.aiExplanationTitle} icon={<Sparkles size={13} />}>
          {ai.items[0].answer[uiLang as "ar" | "en"]}
        </LabeledCard>
      )}

      {primaryCommentary && (
        <LabeledCard tone="emerald" title={t.scholarCommentaryTitle} icon={<BookOpen size={13} />}>
          {primaryCommentary.note[uiLang]}
          <div className="mt-2.5">
            <SourceChip node={primaryCommentary.work} onOpen={onOpenSource} />
          </div>
        </LabeledCard>
      )}

      {context && (
        <InfoTile icon={<MapPin size={14} />} title={context.title[uiLang]}>
          {context.body[uiLang]}
        </InfoTile>
      )}

      <div>
        <SmallHeading icon={<Quote size={12} />} text={t.moreCommentaryTitle} />
        {restCommentary.map((cm) => (
          <div
            key={cm.work.id}
            className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5 mb-2"
          >
            <div className="text-[12.5px] font-semibold mb-1">
              {cm.scholar[uiLang]}{" "}
              <span className="font-normal text-[var(--color-sub)]">
                · {uiLang === "ar" ? cm.work.title.ar : cm.work.title.en}
              </span>
            </div>
            <p className="text-xs text-[var(--color-sub)] leading-relaxed mb-2">{cm.note[uiLang]}</p>
            <SourceChip node={cm.work} onOpen={onOpenSource} />
          </div>
        ))}
        {dto.deeperSource && (
          <button
            onClick={() => onOpenSource(dto.deeperSource!.id)}
            className="flex items-center justify-between w-full bg-transparent border border-dashed border-[var(--color-line)] rounded-xl p-3"
          >
            <span className="text-[11.5px] text-[var(--color-sub)]">
              {t.goDeeper}: {uiLang === "ar" ? dto.deeperSource.title.ar : dto.deeperSource.title.en}
            </span>
            <span className="text-[10px] text-[#B0785A] font-bold">{t.notDigitizedYet}</span>
          </button>
        )}
      </div>

      {dto.quranReferences.length > 0 && (
        <div>
          <SmallHeading icon={<Sparkles size={12} />} text={t.echoedQuranTitle} />
          {dto.quranReferences.map((ref) => (
              <div
                key={ref.node.id}
                className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5 mb-2"
              >
                <div className="text-[11px] text-[var(--color-gold)] font-semibold mb-1.5">
                  {uiLang === "ar" ? ref.node.title.ar : ref.node.title.en}
                </div>
                {ref.quoteAr && (
                  <p dir="rtl" className="font-arabic text-base leading-relaxed mb-1.5">
                    {ref.quoteAr}
                  </p>
                )}
                <p className="text-[11.5px] text-[var(--color-sub)] leading-relaxed">{ref.note[uiLang]}</p>
              </div>
            ))}
        </div>
      )}

      {dto.relatedHadith.length > 0 && (
        <div>
          <SmallHeading icon={<Info size={12} />} text={t.relatedHadithTitle} />
          {dto.relatedHadith.map((ref) => (
            <div
              key={ref.node.id}
              className="bg-[var(--color-panel-2)] rounded-xl p-3 border-s-[3px] border-[var(--color-emerald)] mb-2"
            >
              <p className="text-xs leading-relaxed">{ref.note[uiLang]}</p>
              <div className="text-[10px] text-[var(--color-sub)] mt-1.5">
                {ref.srcLabel ? ref.srcLabel[uiLang] : (uiLang === "ar" ? ref.node.title.ar : ref.node.title.en)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LabeledCard({
  tone,
  title,
  icon,
  children,
}: {
  tone: "ai" | "gold" | "emerald";
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const isGold = tone === "gold" || tone === "ai";
  return (
    <div
      className={[
        "rounded-xl p-3.5 border",
        isGold
          ? "border-[var(--color-gold)]/35 bg-[var(--color-gold)]/10"
          : "border-[var(--color-emerald)]/35 bg-[var(--color-emerald)]/10",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-1.5 mb-2 font-bold text-[11px]",
          isGold ? "text-[var(--color-gold)]" : "text-[var(--color-emerald)]",
        ].join(" ")}
      >
        {icon} {title}
      </div>
      <div className="text-[12.5px] leading-relaxed text-[var(--color-ink)]">{children}</div>
    </div>
  );
}

function InfoTile({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5 text-[var(--color-gold)]">
        {icon}
        <span className="font-semibold text-[12.5px] text-[var(--color-ink)]">{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-sub)]">{children}</p>
    </div>
  );
}

function SmallHeading({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-gold)] mb-2">
      {icon}
      {text}
    </div>
  );
}
