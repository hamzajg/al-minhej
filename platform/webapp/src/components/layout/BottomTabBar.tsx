import { BookOpen, GitBranch } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import type { SheetId } from "@/types";

interface Props {
  sheet: SheetId;
  onToggle: (sheet: "chain" | "study") => void;
}

export function BottomTabBar({ sheet, onToggle }: Props) {
  const { t } = useSettings();

  return (
    <nav className="fixed bottom-0 inset-x-0 h-14 z-[76] flex bg-[var(--color-panel)] border-t border-[var(--color-line)]">
      <TabButton active={sheet === "chain"} icon={<GitBranch size={17} />} label={t.mChain} onClick={() => onToggle("chain")} />
      <div className="w-px bg-[var(--color-line)] my-2.5" />
      <TabButton active={sheet === "study"} icon={<BookOpen size={17} />} label={t.mStudy} onClick={() => onToggle("study")} />
    </nav>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex-1 flex flex-col items-center justify-center gap-0.5",
        active ? "text-[var(--color-gold)]" : "text-[var(--color-sub)]",
      ].join(" ")}
    >
      {icon}
      <span className={active ? "text-[10.5px] font-bold" : "text-[10.5px] font-medium"}>{label}</span>
    </button>
  );
}
