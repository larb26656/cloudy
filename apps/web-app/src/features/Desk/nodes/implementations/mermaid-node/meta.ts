import { WorkflowIcon } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { MermaidNode } from "./MermaidNode";

export const mermaidTemplate: NodeTemplate = {
  id: "mermaid",
  label: "Mermaid",
  icon: WorkflowIcon,
  size: { width: 400, height: 300 },
  component: MermaidNode,
};
