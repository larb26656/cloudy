import { MessageSquareIcon } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { ChatConfigDialog, ChatNode } from "./ChatNode";

export const chatTemplate: NodeTemplate = {
  id: "chat",
  label: "Chat",
  icon: MessageSquareIcon,
  size: { width: 400, height: 600 },
  configDialog: ChatConfigDialog,
  component: ChatNode,
};
