import { MessageCircle } from "lucide-react";
import type { TabTemplate, TabTitleProps } from "../../template";
import { useSession } from "@/hooks/queries/useSessions";
import { ChatCreateDialog } from "./ChatCreateDialog";
import { ChatContent } from "./ChatContent";

export type ChatData = {
  sessionId: string | null;
  /** Null when the tab is ephemeral (session opened with no registered workspace). */
  workspaceId: string | null;
  /** Filesystem path used for all opencode calls. Always present. */
  directory: string;
  sessionName: string;
};

function ChatTabTitle({ data }: TabTitleProps<ChatData>) {
  const { data: session } = useSession({
    sessionId: data.sessionId,
    directory: data.directory,
  });

  return session?.title ?? data.sessionName ?? "New Chat";
}

export const chatTemplate: TabTemplate<ChatData> = {
  type: "chat",
  label: "New Chat",
  icon: MessageCircle,
  TitleComponent: ChatTabTitle,
  ContentComponent: ChatContent,
  CreateDialog: ChatCreateDialog,
  getWorkspaceId: (data) => data.workspaceId,
};
