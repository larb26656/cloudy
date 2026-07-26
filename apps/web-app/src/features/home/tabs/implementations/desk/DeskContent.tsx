import { DeskCanvas } from "@/features/desk/DeskCanvas";
import { useTabStore, type Tab } from "@/stores/tabStore";

interface DeskContentProps {
  tab: Extract<Tab, { type: "desk" }>;
}

export function DeskContent({ tab }: DeskContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);

  return (
    <div className="h-full w-full overflow-hidden">
      <DeskCanvas
        tabId={tab.id}
        name={tab.data.name}
        onNameChange={(name) => {
          updateTabData(tab.id, { name });
        }}
      />
    </div>
  );
}
