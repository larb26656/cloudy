import { PenTool } from "lucide-react";
import type { TabTemplate } from "../../template";
import { DeskContent } from "./DeskContent";
import { DeskTabItem } from "./DeskTabItem";

export const deskTemplate: TabTemplate = {
  type: "desk",
  label: "New Desk",
  icon: PenTool,
  TabBarComponent: DeskTabItem,
  ContentComponent: DeskContent,
  defaultData: {},
};
