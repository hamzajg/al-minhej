import { MessageSquareQuote, Network } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import type { SheetId } from "@/types";

interface Props {
  sheet: SheetId;
  onToggle: (sheet: "annotations" | "metadata") => void;
}

export function BookBottomTabBar({ sheet, onToggle }: Props) {
  const { t } = useSettings();

  return (
    <nav className="fixed bottom-0 inset-x-0 h-14 z-[76] flex bg-[var(--color-panel)] border-t border-[var(--color-line)]">
      <TabButton
        active={sheet === "annotations"}
        icon={<MessageSquareQuote size={17} />}
        label={t.pageAnnotationsTitle}
        onClick={() => onToggle("annotations")}
      />
      <div className="w-px bg-[var(--color-line)] my-2.5" />
      <TabButton
        active={sheet === "metadata"}
        icon={<Network size={17} />}
        label={t.pageKnowledgeTitle}
        onClick={() => onToggle("metadata")}
      />
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
