import { useState } from "react";
import { MessageList } from "./message/MessageList";
import { BotChatInput } from "./chat-input";
import { PermissionBanner } from "@/components/permission/PermissionBanner";
import { PermissionDialog } from "@/components/permission/PermissionDialog";
import { QuestionBanner } from "../question/QuestionBanner";
import { QuestionSheet } from "../question/QuestionSheet";
import { useSessionData } from "@/hooks/session/useSessionHumanApprove";
import { ChatProvider, useChat } from "./ChatProvider";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";
import type { Workspace } from "@/lib/cloudy/workspaces";
import type { ModelConfig } from "@/types";

interface BotChatContainerProps {
  workspace?: Workspace | null;
  directory: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string | null) => void;
  agent?: string | null;
  onAgentChange?: (agent: string | null) => void;
  model?: ModelConfig | null;
  onModelChange?: (model: ModelConfig | null) => void;
  placeholder?: string;
}

const noopAgentChange = () => {};
const noopModelChange = () => {};

export function BotChatContainer({
  workspace = null,
  directory,
  sessionId,
  onSessionChange,
  agent,
  onAgentChange,
  model,
  onModelChange,
  placeholder,
}: BotChatContainerProps) {
  return (
    <ChatProvider
      workspace={workspace}
      directory={directory}
      sessionId={sessionId}
      onSessionChange={onSessionChange}
      agent={agent}
      onAgentChange={onAgentChange ?? noopAgentChange}
      model={model}
      onModelChange={
        onModelChange ?? (model !== undefined ? noopModelChange : undefined)
      }
    >
      <BotChatContainerContent placeholder={placeholder} />
    </ChatProvider>
  );
}

type BotChatContainerContentProps = {
  placeholder?: string;
};

function BotChatContainerContent({
  placeholder,
}: BotChatContainerContentProps) {
  const [questionOpen, setQuestionOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const { abortGeneration, isGenerating, directory, sessionId } = useChat();
  const {
    sessionQuestions,
    currentQuestion,
    sessionPermissions,
    currentPermission,
  } = useSessionData({ directory, sessionId });

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (questionOpen || permissionOpen || !isGenerating) return;

    e.preventDefault();
    abortGeneration();
  };

  return (
    <div
      className="relative flex-1 flex flex-col bg-background overflow-hidden h-full"
      tabIndex={-1}
      onKeyDown={handleContainerKeyDown}
    >
      <div className="absolute z-50 top-0 left-0 right-0 flex justify-end gap-2 p-2">
        {!!sessionQuestions.length && !questionOpen && (
          <QuestionBanner
            onOpenDialog={() => setQuestionOpen(true)}
            count={sessionQuestions.reduce(
              (sum, q) => sum + q.questions.length,
              0,
            )}
          />
        )}

        {!!sessionPermissions.length && !permissionOpen && (
          <PermissionBanner
            onOpenDialog={() => setPermissionOpen(true)}
            count={sessionPermissions.length}
          />
        )}
      </div>

      <MessageScrollerProvider autoScroll>
        <MessageList selectedSessionId={sessionId} directory={directory} />

        <BotChatInput placeholder={placeholder} />
      </MessageScrollerProvider>

      {currentQuestion && (
        <QuestionSheet
          open={questionOpen}
          onOpenChange={setQuestionOpen}
          question={currentQuestion}
          directory={directory}
        />
      )}

      {currentPermission && (
        <PermissionDialog
          open={permissionOpen}
          onOpenChange={setPermissionOpen}
          permission={currentPermission}
          directory={directory}
        />
      )}
    </div>
  );
}
