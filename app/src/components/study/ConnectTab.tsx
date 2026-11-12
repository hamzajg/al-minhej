import { Compass, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { MiniGraph } from "@/components/graph/MiniGraph";
import type { ReadingExperienceDTO } from "@/domain/dto";

interface Props {
  graph: ReadingExperienceDTO["graph"];
  active: string;
  onSelect: (id: string) => void;
}

export function ConnectTab({ graph, active, onSelect }: Props) {
  const { t, uiLang } = useSettings();
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

      {/* The tab shows the neighborhood in place; §5.A's `/v1/explore` is the
          same graph as its own screen — chronology and cross-references
          included — so this hands off instead of growing a second, thinner
          copy of it here. */}
      <Link
        to={`/explore/${encodeURIComponent(graph.center.slug)}`}
        className="mt-3 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl no-underline text-[12px] bg-[var(--color-panel)] border border-[var(--color-line)] text-[var(--color-gold)]"
      >
        <Compass size={13} />
        {t.exploreOpen}
      </Link>
    </div>
  );
}
