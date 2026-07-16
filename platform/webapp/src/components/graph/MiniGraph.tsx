import { useSettings } from "@/context/SettingsContext";
import type { GraphNeighborDTO } from "@/domain/dto";
import type { NodeType } from "@/domain/types";

const NODE_COLORS: Record<NodeType, string> = {
  HADITH: "#C79A46",
  NARRATOR: "#0E4F3F",
  BOOK: "#3E6F5C",
  PAGE: "#5B8C7A",
  VERSE: "#7B8F5D",
  CONCEPT: "#B4763B",
  EVENT: "#6A5A8C",
};

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

interface Props {
  centerLabel: string;
  neighbors: GraphNeighborDTO[];
  active: string;
  onSelect: (id: string) => void;
}

export function MiniGraph({ centerLabel, neighbors, active, onSelect }: Props) {
  const { uiLang } = useSettings();
  const cx = 150,
    cy = 150,
    R = 105;
  const step = 360 / Math.max(neighbors.length, 1);

  return (
    <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-2xl p-2">
      <svg viewBox="0 0 300 300" className="w-full h-auto block">
        {neighbors.map((n, i) => {
          const [x, y] = polar(cx, cy, R, i * step - 90);
          const isActive = active === n.node.id;
          return (
            <line
              key={"l" + n.node.id}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={isActive ? "var(--color-gold)" : "var(--color-line)"}
              strokeWidth={isActive ? 2 : 1}
            />
          );
        })}

        <g onClick={() => onSelect("center")} className="cursor-pointer">
          <circle cx={cx} cy={cy} r={20} fill={NODE_COLORS.HADITH} stroke={active === "center" ? "var(--color-gold)" : "transparent"} strokeWidth={2.5} />
          <text x={cx} y={cy + 20 + 11} textAnchor="middle" fontSize="8.5" fill="var(--color-sub)">
            {centerLabel.length > 14 ? centerLabel.slice(0, 13) + "…" : centerLabel}
          </text>
        </g>

        {neighbors.map((n, i) => {
          const [x, y] = polar(cx, cy, R, i * step - 90);
          const isActive = active === n.node.id;
          const label = uiLang === "ar" ? n.node.title.ar : n.node.title.en;
          const radius = isActive ? 15 : 12;
          return (
            <g key={n.node.id} onClick={() => onSelect(n.node.id)} className="cursor-pointer">
              <circle cx={x} cy={y} r={radius} fill={NODE_COLORS[n.node.type]} stroke={isActive ? "var(--color-gold)" : "transparent"} strokeWidth={2.5} />
              <text x={x} y={y + radius + 11} textAnchor="middle" fontSize="8.5" fill="var(--color-sub)">
                {label.length > 14 ? label.slice(0, 13) + "…" : label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
