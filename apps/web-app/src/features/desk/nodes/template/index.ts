import { chatTemplate } from "../implementations/chat-node";
import { stickyNoteTemplate } from "../implementations/sticky-note";
import { mermaidTemplate } from "../implementations/mermaid-node";
import { textNodeTemplate } from "../implementations/text-node";
import { todoNodeTemplate } from "../implementations/todo-node";
import { terminalNodeTemplate } from "../implementations/terminal-node";
import type { NodeTemplate } from "./nodeTemplates";

export * from "./nodeTemplates";

export const nodeTemplates: NodeTemplate[] = [
  chatTemplate,
  stickyNoteTemplate,
  mermaidTemplate,
  textNodeTemplate,
  todoNodeTemplate,
  terminalNodeTemplate,
];

export const nodeTypes = nodeTemplates.reduce<
  Record<string, NodeTemplate["component"]>
>((acc, template) => {
  acc[template.id] = template.component;
  return acc;
}, {});
