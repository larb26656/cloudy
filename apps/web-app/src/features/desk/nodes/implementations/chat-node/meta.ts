import { MessageSquareIcon } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import { ChatNode } from "./ChatNode";

export const chatTemplate: NodeTemplate = {
  id: "chat",
  label: "Chat",
  icon: MessageSquareIcon,
  size: { width: 400, height: 600 },
  configDialog: CreateChatDialog,
  component: ChatNode,
};
