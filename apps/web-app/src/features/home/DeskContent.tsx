import { DeskCanvas } from "./components/DeskCanvas";
import { useTabStore } from "@/stores/tabStore";

export function DeskContent() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  return <DeskCanvas tabId={activeTabId} />;
}
