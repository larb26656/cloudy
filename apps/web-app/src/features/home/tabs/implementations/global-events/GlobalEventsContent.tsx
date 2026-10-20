import type { Tab } from "@/stores/tabStore";
import { GlobalEventViewer } from "@/features/global-events/GlobalEventViewer";

interface GlobalEventsContentProps {
  tab: Extract<Tab, { type: "global-events" }>;
}

export function GlobalEventsContent(_props: GlobalEventsContentProps) {
  return <GlobalEventViewer />;
}
