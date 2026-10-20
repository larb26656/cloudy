import { Activity } from "lucide-react";
import type { TabTemplate, TabTitleProps } from "../../template";
import { GlobalEventsContent } from "./GlobalEventsContent";

export type GlobalEventsData = Record<string, never>;

function GlobalEventsTabTitle(_props: TabTitleProps<GlobalEventsData>) {
  return "Global Events";
}

export const globalEventsTemplate: TabTemplate<GlobalEventsData> = {
  type: "global-events",
  label: "Global Events",
  icon: Activity,
  TitleComponent: GlobalEventsTabTitle,
  ContentComponent: GlobalEventsContent,
  defaultData: {},
};
