import { Bookmark, Brain, Copy, Eye, EyeOff, Play, RotateCcw, Share2, Type } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { Pill } from "@/components/ui/Pill";
import { SUBTITLE_LANGS } from "@/data/i18n";
import { DIFFICULTY_LEVELS } from "@/lib/memorize";
import type { Difficulty, SubtitleLang } from "@/types";

interface Props {
  setFontScale: (fn: (v: number) => number) => void;
  bookmarked: boolean;
  setBookmarked: (fn: (v: boolean) => boolean) => void;
  copied: boolean;
  onCopy: () => void;
  memorize: boolean;
  onToggleMemorize: () => void;
  difficulty: number;
  onSetDifficulty: (d: Difficulty) => void;
  onRevealAll: () => void;
}

export function ReaderToolbar({
  setFontScale,
  bookmarked,
  setBookmarked,
  copied,
  onCopy,
  memorize,
  onToggleMemorize,
  difficulty,
  onSetDifficulty,
  onRevealAll,
}: Props) {
  const { t, showTranslation, setShowTranslation, subtitleLang, setSubtitleLang } = useSettings();

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2 flex-wrap mb-3">
        <ToolButton icon={<Play size={13} />} label={t.audio} />
        <ToolButton icon={<Copy size={13} />} label={copied ? t.copied : t.copy} onClick={onCopy} />
        <ToolButton
          icon={<Bookmark size={13} fill={bookmarked ? "var(--color-gold)" : "none"} />}
          label={t.bookmark}
          onClick={() => setBookmarked((b) => !b)}
        />
        <ToolButton icon={<Share2 size={13} />} label={t.share} />

        <div className="flex items-center gap-0.5 bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-full px-2 py-1">
          <Type size={12} />
          <button
            onClick={() => setFontScale((s) => Math.max(0.8, s - 0.1))}
            className="text-[13px] px-1 text-[var(--color-ink)]"
          >
            –
          </button>
          <button
            onClick={() => setFontScale((s) => Math.min(1.5, s + 0.1))}
            className="text-[13px] px-1 text-[var(--color-ink)]"
          >
            +
          </button>
        </div>

        {!memorize && (
          <button
            onClick={() => setShowTranslation((s) => !s)}
            className={[
              "flex items-center gap-1.5 text-[11.5px] px-3 py-1.5 rounded-full border",
              showTranslation
                ? "bg-[var(--color-gold)] text-[#241c0a] border-[var(--color-gold)]"
                : "bg-[var(--color-panel-2)] text-[var(--color-ink)] border-[var(--color-line)]",
            ].join(" ")}
          >
            {showTranslation ? <EyeOff size={13} /> : <Eye size={13} />}
            {showTranslation ? t.hideTranslation : t.showTranslation}
          </button>
        )}
        {!memorize && showTranslation && (
          <div className="flex gap-1">
            {Object.entries(SUBTITLE_LANGS).map(([k, label]) => (
              <Pill key={k} active={subtitleLang === k} onClick={() => setSubtitleLang(k as SubtitleLang)}>
                {label}
              </Pill>
            ))}
          </div>
        )}

        <button
          onClick={onToggleMemorize}
          className={[
            "flex items-center gap-1.5 text-[11.5px] px-3 py-1.5 rounded-full border",
            memorize
              ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
              : "bg-[var(--color-panel-2)] text-[var(--color-ink)] border-[var(--color-line)]",
          ].join(" ")}
        >
          <Brain size={13} /> {t.memorize}
        </button>
      </div>

      {memorize && (
        <div className="flex items-center gap-2 flex-wrap justify-center mb-1">
          {(Object.keys(DIFFICULTY_LEVELS) as Difficulty[]).map((key) => (
            <Pill
              key={key}
              active={Math.abs(difficulty - DIFFICULTY_LEVELS[key]) < 0.01}
              onClick={() => onSetDifficulty(key)}
            >
              {t[key]}
            </Pill>
          ))}
          <Pill onClick={onRevealAll}>
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={11} /> {t.revealAll}
            </span>
          </Pill>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[11.5px] px-3 py-1.5 rounded-full bg-[var(--color-panel-2)] border border-[var(--color-line)] text-[var(--color-ink)]"
    >
      {icon}
      {label}
    </button>
  );
}
