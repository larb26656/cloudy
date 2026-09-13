import { Bot } from "lucide-react";
import { useState } from "react";
import type { ModelConfig } from "@/types";
import type { TabTemplate, TabTitleProps } from "../../template";
import { useSession } from "@/hooks/queries/useSessions";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { BotChatContent } from "./BotChatContent";
import { BotChatCreateDialog } from "./BotChatCreateDialog";

export type BotChatData = {
  sessionId: string | null;
  workspaceId: string;
  directory: string;
  sessionName: string;
  model?: ModelConfig | null;
};

function BotChatTabTitle({ data }: TabTitleProps<BotChatData>) {
  const { data: session } = useSession({
    sessionId: data.sessionId,
    directory: data.directory,
  });
  const [isEditing, setIsEditing] = useState(false);
  const resolvedTitle = session?.title ?? data.sessionName ?? "New Bot Chat";

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
          ? (event) => {
              event.stopPropagation();
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

export const botChatTemplate: TabTemplate<BotChatData> = {
  type: "bot-chat",
  label: "New Bot Chat",
  icon: Bot,
  TitleComponent: BotChatTabTitle,
  ContentComponent: BotChatContent,
  CreateDialog: BotChatCreateDialog,
  getWorkspaceId: (data) => data.workspaceId,
};
