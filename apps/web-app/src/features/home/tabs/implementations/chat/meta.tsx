import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import type { ModelInfo } from "@repo/contracts";
import type { TabTemplate, TabTitleProps } from "../../template";
import { useSession } from "@/hooks/queries/useSessions";
import { useChatPanelStore } from "@/stores/chatPanelStore";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { ChatCreateDialog } from "./ChatCreateDialog";
import { ChatContent } from "./ChatContent";
import { ChatHeaderActions } from "./ChatHeaderActions";
import { AgentActivityIndicator } from "@/components/chat/AgentActivityIndicator";
import { CloseButtonWithIndicator } from "@/components/ui/CloseButtonWithIndicator";
import { useSessionAgentActivity } from "@/hooks/useSessionAgentActivity";
import type { TabIndicatorProps } from "../../template";

function ChatTabIndicator({ data, onClose }: TabIndicatorProps<ChatData>) {
  const activity = useSessionAgentActivity(data.sessionId ?? "");
  const indicator =
    activity.state === "idle" ? undefined : (
      <AgentActivityIndicator state={activity.state} reason={activity.reason} />
    );

  return (
    <CloseButtonWithIndicator
      aria-label="Close tab"
      onClick={onClose}
      indicator={indicator}
      closeButton={<X aria-hidden="true" className="size-3" />}
      className="ml-1 rounded p-0.5 hover:bg-muted"
    />
  );
}

export type ChatData = {
  providerId: string;
  sessionId: string | null;
  /** Null when the tab is ephemeral (session opened with no registered workspace). */
  workspaceId: string | null;
  /** Filesystem path used for all opencode calls. Always present. */
  directory: string;
  sessionName: string;
  /** Agent chosen in this chat tab. Null/undefined = use global default. */
  agent?: string | null;
  /** Model chosen in this chat tab. Null/undefined = use global default. */
  model?: ModelInfo | null;
};

function ChatTabTitle({ data }: TabTitleProps<ChatData>) {
  const { data: session } = useSession({
    sessionId: data.sessionId,
    directory: data.directory,
  });
  const [isEditing, setIsEditing] = useState(false);

  const resolvedTitle = session?.title ?? data.sessionName ?? "New Chat";

  if (
    isEditing &&
    data.sessionId &&
    session?.origin?.type !== "automation_run"
  ) {
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
        data.sessionId && session?.origin?.type !== "automation_run"
          ? (e) => {
              e.stopPropagation();
              setIsEditing(true);
            }
          : undefined
      }
      className="truncate"
    >
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate">{resolvedTitle}</span>
      </span>
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
  IndicatorComponent: ChatTabIndicator,
  hideMobileAppBarTitle: true,
  onClose: (tab) => {
    useChatPanelStore.getState().clearTab(tab.id);
  },
};
