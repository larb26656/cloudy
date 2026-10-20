import { Activity } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { GlobalEventNode } from "./GlobalEventNode";

export const globalEventNodeTemplate: NodeTemplate = {
  id: "global-event",
  label: "Global Event",
  icon: Activity,
  size: { width: 500, height: 600 },
  component: GlobalEventNode,
};
