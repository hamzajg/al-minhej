import { Languages, Library, Moon, Sparkle, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";

interface HeaderProps {
  lessonTag?: string;
  discoveredCount?: number;
  totalVocab?: number;
  onReopenOnboarding?: () => void;
  isCompact?: boolean;
  logoHref?: string;
}

export function Header({
  lessonTag,
  discoveredCount,
  totalVocab,
  onReopenOnboarding,
  isCompact,
  logoHref = "/",
}: HeaderProps) {
  const { t, uiLang, setUiLang, dark, toggleDark } = useSettings();

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-line)] bg-[var(--color-panel)] shrink-0">
      <Link to={logoHref} className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-emerald)] grid place-items-center shrink-0">
          <span className="font-arabic text-[15px] text-[var(--color-gold-light)]">ن</span>
        </div>
        <span className="font-display text-[17px] font-semibold text-[var(--color-ink)]">
          {t.appName}
        </span>
        {!isCompact && lessonTag && (
          <span className="text-[11.5px] text-[var(--color-sub)] border-s border-[var(--color-line)] ps-2.5">
            {lessonTag}
          </span>
        )}
      </Link>

      <div className="flex items-center gap-1.5">
        <Link
          to="/library"
          title={t.tabLibrary}
          className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--color-panel-2)] border border-[var(--color-line)]"
        >
          <Library size={14} />
        </Link>

        {discoveredCount !== undefined && discoveredCount > 0 && (
          <div className="text-[10.5px] text-[var(--color-gold)] bg-[var(--color-gold)]/15 rounded-full px-2.5 py-1 flex items-center gap-1">
            <Sparkle size={11} />
            {discoveredCount}/{totalVocab} {t.wordsExplored}
          </div>
        )}

        {onReopenOnboarding && (
          <button
            title={t.reopenPicker}
            onClick={onReopenOnboarding}
            className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--color-panel-2)] border border-[var(--color-line)]"
          >
            <Languages size={14} />
          </button>
        )}

        <div className="flex rounded-lg overflow-hidden border border-[var(--color-line)]">
          {(["ar", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setUiLang(l)}
              className={[
                "text-[11px] px-2.5 py-1.5",
                l === "ar" ? "font-ui-ar" : "font-sans",
                uiLang === l
                  ? "bg-[var(--color-emerald)] text-[#F4EFE2]"
                  : "bg-[var(--color-panel-2)] text-[var(--color-sub)]",
              ].join(" ")}
            >
              {l === "ar" ? "AR" : "EN"}
            </button>
          ))}
        </div>

        <button
          aria-label="Toggle dark mode"
          onClick={toggleDark}
          className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--color-panel-2)] border border-[var(--color-line)]"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
