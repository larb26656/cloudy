import { chatTemplate } from "../implementations/chat-node";
import { stickyNoteTemplate } from "../implementations/sticky-note";
import type { NodeTemplate } from "./nodeTemplates";

export * from "./nodeTemplates";

export const nodeTemplates: NodeTemplate[] = [chatTemplate, stickyNoteTemplate];

export const nodeTypes = nodeTemplates.reduce<
  Record<string, NodeTemplate["component"]>
>((acc, template) => {
  acc[template.id] = template.component;
  return acc;
}, {});
