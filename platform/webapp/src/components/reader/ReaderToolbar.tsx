import { UnifiedReaderToolbar } from "@/components/reader/UnifiedReaderToolbar";
import type { Difficulty } from "@/types";

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
  return (
    <UnifiedReaderToolbar
      setFontScale={setFontScale}
      bookmarked={bookmarked}
      setBookmarked={setBookmarked}
      copied={copied}
      onCopy={onCopy}
      memorize={memorize}
      onToggleMemorize={onToggleMemorize}
      difficulty={difficulty}
      onSetDifficulty={onSetDifficulty}
      onRevealAll={onRevealAll}
      readerType="hadith"
    />
  );
}