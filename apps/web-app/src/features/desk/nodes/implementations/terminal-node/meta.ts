import { Terminal } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { TerminalNode } from "./TerminalNode";
import { TerminalNodeCreateDialog } from "./TerminalNodeCreateDialog";

export const terminalNodeTemplate: NodeTemplate = {
  id: "terminal",
  label: "Terminal",
  icon: Terminal,
  size: { width: 600, height: 400 },
  configDialog: TerminalNodeCreateDialog,
  component: TerminalNode,
};
