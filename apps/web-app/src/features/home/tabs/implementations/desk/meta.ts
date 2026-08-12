import { Palette } from "lucide-react";
import type { TabTemplate, TabTitleProps } from "../../template";
import { useFlowStore } from "@/stores/flowStore";
import { DeskContent } from "./DeskContent";

export type DeskData = {
  name: string;
};

function DeskTabTitle({ data }: TabTitleProps<DeskData>) {
  return data.name;
}

export const deskTemplate: TabTemplate<DeskData> = {
  type: "desk",
  label: "New Desk",
  icon: Palette,
  TitleComponent: DeskTabTitle,
  ContentComponent: DeskContent,
  defaultData: {
    name: "New desk",
  },
  onClose: (tab) => {
    useFlowStore.getState().deleteFlow(tab.id);
  },
};
