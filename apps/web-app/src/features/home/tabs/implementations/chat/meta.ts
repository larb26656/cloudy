import { MessageCircle } from "lucide-react";
import type { TabTemplate } from "../../template";
import { ChatCreateDialog } from "./ChatCreateDialog";
import { ChatContent } from "./ChatContent";
import { ChatTabItem } from "./ChatTabItem";

export type ChatData = {
  sessionId: string | null;
  workspaceId: string;
  sessionName: string;
};

export const chatTemplate: TabTemplate<ChatData> = {
  type: "chat",
  label: "New Chat",
  icon: MessageCircle,
  TabBarComponent: ChatTabItem,
  ContentComponent: ChatContent,
  CreateDialog: ChatCreateDialog,
};
