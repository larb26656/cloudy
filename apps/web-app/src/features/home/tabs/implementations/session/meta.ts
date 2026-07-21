import { MessageCircle } from "lucide-react";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import type { TabTemplate } from "../../template";
import { SessionContent } from "./SessionContent";
import { SessionTabItem } from "./SessionTabItem";

export const sessionTemplate: TabTemplate = {
  type: "session",
  label: "New Chat",
  icon: MessageCircle,
  TabBarComponent: SessionTabItem,
  ContentComponent: SessionContent,
  CreateDialog: CreateChatDialog,
};
