import { SquareTerminal } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { TerminalNode } from "./TerminalNode";
import { TerminalNodeConfigDialog } from "./TerminalNodeConfigDialog";

export const terminalNodeTemplate: NodeTemplate = {
  id: "terminal",
  label: "Terminal",
  icon: SquareTerminal,
  size: { width: 500, height: 320 },
  configDialog: TerminalNodeConfigDialog,
  component: TerminalNode,
};
