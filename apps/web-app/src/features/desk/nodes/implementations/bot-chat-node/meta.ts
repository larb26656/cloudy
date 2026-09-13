import { Bot } from "lucide-react";
import { CreateBotChatDialog } from "@/features/chat/components/CreateBotChatDialog";
import type { NodeTemplate } from "../../template";
import { BotChatNode } from "./BotChatNode";

export const botChatNodeTemplate: NodeTemplate = {
  id: "bot-chat",
  label: "Bot Chat",
  icon: Bot,
  size: { width: 400, height: 600 },
  configDialog: CreateBotChatDialog,
  component: BotChatNode,
};
