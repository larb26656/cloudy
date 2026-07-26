import { ListChecks } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { TodoNode } from "./TodoNode";

export const todoNodeTemplate: NodeTemplate = {
  id: "todo",
  label: "Todo List",
  icon: ListChecks,
  size: { width: 280, height: 320 },
  defaultData: { items: [] },
  component: TodoNode,
};
