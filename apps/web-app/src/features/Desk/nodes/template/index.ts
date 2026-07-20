import { chatTemplate } from "../implementations/chat-node";
import { stickyNoteTemplate } from "../implementations/sticky-note";
import { mermaidTemplate } from "../implementations/mermaid-node";
import { textNodeTemplate } from "../implementations/text-node";
import type { NodeTemplate } from "./nodeTemplates";

export * from "./nodeTemplates";

export const nodeTemplates: NodeTemplate[] = [
  chatTemplate,
  stickyNoteTemplate,
  mermaidTemplate,
  textNodeTemplate,
];

export const nodeTypes = nodeTemplates.reduce<
  Record<string, NodeTemplate["component"]>
>((acc, template) => {
  acc[template.id] = template.component;
  return acc;
}, {});
