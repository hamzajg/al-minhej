import { Network } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { MiniGraph } from "@/components/graph/MiniGraph";
import type { ReadingExperienceDTO } from "@/domain/dto";

interface Props {
  graph: ReadingExperienceDTO["graph"];
  active: string;
  onSelect: (id: string) => void;
}

export function ConnectTab({ graph, active, onSelect }: Props) {
  const { uiLang } = useSettings();
  const centerLabel = uiLang === "ar" ? graph.center.title.ar : graph.center.title.en;
  const activeNeighbor = graph.neighbors.find((n) => n.node.id === active);
  const activeLabel = active === "center" ? centerLabel : activeNeighbor ? (uiLang === "ar" ? activeNeighbor.node.title.ar : activeNeighbor.node.title.en) : "";
  const activeDetail = active === "center" ? null : activeNeighbor?.detail[uiLang];

  return (
    <div>
      <MiniGraph centerLabel={centerLabel} neighbors={graph.neighbors} active={active} onSelect={onSelect} />
      <div className="mt-3 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Network size={13} className="text-[var(--color-gold)]" />
          <span className="font-semibold text-[12.5px]">{activeLabel}</span>
        </div>
        {activeDetail && <p className="text-xs text-[var(--color-sub)] leading-relaxed">{activeDetail}</p>}
      </div>
    </div>
  );
}
