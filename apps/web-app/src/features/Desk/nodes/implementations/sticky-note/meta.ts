import { StickyNoteIcon } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { StickyNoteNode } from "./StickyNoteNode";

export const stickyNoteTemplate: NodeTemplate = {
  id: "sticky",
  label: "Sticky Note",
  icon: StickyNoteIcon,
  size: { width: 200, height: 150 },
  component: StickyNoteNode,
};
