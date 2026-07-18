import { useSettings } from "@/context/SettingsContext";
import { Pill } from "@/components/ui/Pill";
import { UnderstandTab } from "./UnderstandTab";
import { VocabularyTab } from "./VocabularyTab";
import { ConnectTab } from "./ConnectTab";
import { PracticeTab } from "./PracticeTab";
import { LibraryTab } from "./LibraryTab";
import { BiographyTab } from "./BiographyTab";
import type { ReadingExperienceDTO } from "@/domain/dto";
import type { RightTab } from "@/types";

interface Props {
  dto: ReadingExperienceDTO;
  tab: RightTab;
  setTab: (t: RightTab) => void;
  discovered: Set<string>;
  onDiscover: (id: string) => void;
  activeGraphNode: string;
  setActiveGraphNode: (id: string) => void;
  onOpenSource: (id: string) => void;
  activeNarratorId: string;
}

export function StudyPanel({
  dto,
  tab,
  setTab,
  discovered,
  onDiscover,
  activeGraphNode,
  setActiveGraphNode,
  onOpenSource,
  activeNarratorId,
}: Props) {
  const { t } = useSettings();

  const tabs: [RightTab, string][] = [
    ["understand", t.tabUnderstand],
    ["vocab", t.tabVocab],
    ["connect", t.tabConnect],
    ["practice", t.tabPractice],
    ["library", t.tabLibrary],
    ["biography", "السيرة / Biography"],
  ];

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4.5 mb-[18px]">
        {tabs.map(([key, label]) => (
          <Pill key={key} active={tab === key} onClick={() => setTab(key)}>
            {label}
          </Pill>
        ))}
      </div>

      {tab === "understand" && <UnderstandTab dto={dto} onOpenSource={onOpenSource} />}
      {tab === "vocab" && (
        <VocabularyTab node={dto.node} discovered={discovered} onDiscover={onDiscover} />
      )}
      {tab === "connect" && (
        <ConnectTab graph={dto.graph} active={activeGraphNode} onSelect={setActiveGraphNode} />
      )}
      {tab === "practice" && <PracticeTab node={dto.node} />}
      {tab === "library" && <LibraryTab onOpenSource={onOpenSource} />}
      {tab === "biography" && <BiographyTab activeNarratorId={activeNarratorId} />}
    </div>
  );
}
