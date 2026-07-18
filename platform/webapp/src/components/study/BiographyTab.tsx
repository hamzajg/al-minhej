import { useSettings } from "@/context/SettingsContext";
import { useKnowledgeNode } from "@/hooks/useKnowledgeNode";
import { BiographyDisplay } from "@/components/narrator/BiographyDisplay";
import { LineageDisplay } from "@/components/narrator/LineageDisplay";
import { useState, useEffect } from "react";

interface Props {
  activeNarratorId: string;
}

export function BiographyTab({ activeNarratorId }: Props) {
  const { uiLang } = useSettings();
  const narrator = useKnowledgeNode(activeNarratorId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (narrator) setLoading(false);
  }, [narrator]);

  if (loading || !narrator) {
    return <div className="text-center py-8 text-[var(--color-sub)]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-[var(--color-ink)]">
            {uiLang === "ar" ? narrator.title.ar : narrator.title.en}
          </h3>
          <p className="text-sm text-[var(--color-sub)] mt-1">
            {uiLang === "ar" ? "السيرة والنسب" : "Biography & Lineage"}
          </p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-[var(--color-panel)] text-[var(--color-sub)] border border-[var(--color-line)]">
          {narrator.type}
        </span>
      </div>

      <BiographyDisplay narrator={narrator} />
      <LineageDisplay narrator={narrator} />
    </div>
  );
}