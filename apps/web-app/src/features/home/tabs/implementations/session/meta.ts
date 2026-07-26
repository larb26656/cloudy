import { MessageCircle } from "lucide-react";
import type { TabTemplate } from "../../template";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import { SessionContent } from "./SessionContent";
import { SessionTabItem } from "./SessionTabItem";

export type SessionData = {
  sessionId: string | null;
  workspaceId: string;
  sessionName: string;
};

export const sessionTemplate: TabTemplate<SessionData> = {
  type: "session",
  label: "New Chat",
  icon: MessageCircle,
  TabBarComponent: SessionTabItem,
  ContentComponent: SessionContent,
  CreateDialog: CreateChatDialog,
};
