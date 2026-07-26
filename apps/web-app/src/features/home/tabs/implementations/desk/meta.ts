import { PenTool } from "lucide-react";
import type { TabTemplate } from "../../template";
import { DeskContent } from "./DeskContent";
import { DeskTabItem } from "./DeskTabItem";

export type DeskData = {
  name: string;
};

export const deskTemplate: TabTemplate<DeskData> = {
  type: "desk",
  label: "New Desk",
  icon: PenTool,
  TabBarComponent: DeskTabItem,
  ContentComponent: DeskContent,
  defaultData: {
    name: "New desk",
  },
};
