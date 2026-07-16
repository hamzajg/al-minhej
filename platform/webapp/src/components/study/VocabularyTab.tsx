import { useSettings } from "@/context/SettingsContext";
import { getVocabulary } from "@/lib/contentBlocks";
import type { KnowledgeNode } from "@/domain/types";

interface Props {
  node: KnowledgeNode;
  discovered: Set<string>;
  onDiscover: (id: string) => void;
}

export function VocabularyTab({ node, discovered, onDiscover }: Props) {
  const { uiLang } = useSettings();
  const vocab = getVocabulary(node)?.entries ?? [];

  return (
    <div className="grid gap-2.5">
      {vocab.map((v) => (
        <div
          key={v.id}
          onClick={() => onDiscover(v.id)}
          className={[
            "bg-[var(--color-panel)] border rounded-xl p-3.5 cursor-pointer transition-colors",
            discovered.has(v.id) ? "border-[var(--color-gold)]" : "border-[var(--color-line)]",
          ].join(" ")}
        >
          <div className="font-arabic text-xl mb-1">{v.word}</div>
          <div className="text-[12.5px] font-semibold">{v.gloss[uiLang as "ar" | "en"]}</div>
          <div className="text-[11px] text-[var(--color-sub)]">
            {v.root && <>{uiLang === "ar" ? "الجذر" : "root"} {v.root}</>}
            {v.pron && <> · {v.pron}</>}
          </div>
        </div>
      ))}
    </div>
  );
}
