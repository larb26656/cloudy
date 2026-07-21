import { DeskCanvas } from "@/features/desk/DeskCanvas";
import type { Tab } from "@/stores/tabStore";

interface DeskContentProps {
  tab: Extract<Tab, { type: "desk" }>;
}

export function DeskContent({ tab }: DeskContentProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <DeskCanvas tabId={tab.id} />
    </div>
  );
}
