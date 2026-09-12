import { MessageCircle } from "lucide-react";
import { useState } from "react";
import type { ModelConfig } from "@/types";
import type { TabTemplate, TabTitleProps } from "../../template";
import { useSession } from "@/hooks/queries/useSessions";
import { useChatPanelStore } from "@/stores/chatPanelStore";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { ChatCreateDialog } from "./ChatCreateDialog";
import { ChatContent } from "./ChatContent";
import { ChatHeaderActions } from "./ChatHeaderActions";

export type ChatData = {
  sessionId: string | null;
  /** Null when the tab is ephemeral (session opened with no registered workspace). */
  workspaceId: string | null;
  /** Filesystem path used for all opencode calls. Always present. */
  directory: string;
  sessionName: string;
  /** Agent chosen in this chat tab. Null/undefined = use global default. */
  agent?: string | null;
  /** Model chosen in this chat tab. Null/undefined = use global default. */
  model?: ModelConfig | null;
};

function ChatTabTitle({ data }: TabTitleProps<ChatData>) {
  const { data: session } = useSession({
    sessionId: data.sessionId,
    directory: data.directory,
  });
  const [isEditing, setIsEditing] = useState(false);

  const resolvedTitle = session?.title ?? data.sessionName ?? "New Chat";

  if (isEditing && data.sessionId) {
    return (
      <SessionTitleInput
        sessionId={data.sessionId}
        directory={data.directory}
        initialTitle={resolvedTitle}
        onDone={() => setIsEditing(false)}
      />
    );
  }

  return (
    <span
      onDoubleClick={
        data.sessionId
          ? (e) => {
              e.stopPropagation();
              setIsEditing(true);
            }
          : undefined
      }
      className="truncate"
    >
      {resolvedTitle}
    </span>
  );
}

export const chatTemplate: TabTemplate<ChatData> = {
  type: "chat",
  label: "New Chat",
  icon: MessageCircle,
  TitleComponent: ChatTabTitle,
  ContentComponent: ChatContent,
  CreateDialog: ChatCreateDialog,
  getWorkspaceId: (data) => data.workspaceId,
  HeaderActionsComponent: ChatHeaderActions,
  onClose: (tab) => {
    useChatPanelStore.getState().clearTab(tab.id);
  },
};
