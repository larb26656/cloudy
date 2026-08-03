import { Type } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { TextNode } from "./TextNode";

export const textNodeTemplate: NodeTemplate = {
  id: "text",
  label: "Text",
  icon: Type,
  size: { width: 240, height: 140 },
  component: TextNode,
};
