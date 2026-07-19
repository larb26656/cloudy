import { DeskCanvas } from "../Desk/DeskCanvas";
import { useTabStore } from "@/stores/tabStore";

export function DeskContent() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  return (
    <div className="h-full w-full overflow-hidden">
      <DeskCanvas tabId={activeTabId} />
    </div>
  );
}
