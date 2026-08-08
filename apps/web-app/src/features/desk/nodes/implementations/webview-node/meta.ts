import { Globe } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { WebviewNode } from "./WebviewNode";
import { WebviewNodeCreateDialog } from "./WebviewNodeCreateDialog";

export const webviewNodeTemplate: NodeTemplate = {
  id: "webview",
  label: "Webview",
  icon: Globe,
  size: { width: 500, height: 400 },
  configDialog: WebviewNodeCreateDialog,
  component: WebviewNode,
};
