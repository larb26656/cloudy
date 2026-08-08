import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { SessionStatusBar } from "./SessionStatusBar";
import { PermissionBanner } from "@/components/permission/PermissionBanner";
import { PermissionDialog } from "@/components/permission/PermissionDialog";
import { useMemo, useState } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { useSessionData } from "@/hooks/session/useSessionHumanApprove";
import { SessionPickerDialog } from "@/components/session/SessionPickerDialog";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { QuestionBanner } from "../question/QuestionBanner";
import { QuestionSheet } from "../question/QuestionSheet";
import { ChatProvider, useChat } from "./ChatProvider";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";

interface ChatContainerProps {
  workspace?: Workspace | null;
  directory: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string | null) => void;
}

export function ChatContainer({
  workspace = null,
  directory,
  sessionId,
  onSessionChange,
}: ChatContainerProps) {
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);

  return (
    <ChatProvider
      workspace={workspace}
      directory={directory}
      sessionId={sessionId}
      onSessionChange={onSessionChange}
    >
      <ChatContainerContent chatplaceholder={chatplaceholder} />
    </ChatProvider>
  );
}

type ChatContainerContentProps = {
  chatplaceholder: string;
};

function ChatContainerContent({ chatplaceholder }: ChatContainerContentProps) {
  const [questionOpen, setQuestionOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const {
    abortGeneration,
    isGenerating,
    directory,
    sessionId,
    workspace,
    changeSession,
    sessionPickerOpen,
    setSessionPickerOpen,
  } = useChat();
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

        <ChatInput placeholder={chatplaceholder} />
      </MessageScrollerProvider>

      <SessionStatusBar
        sessionId={sessionId}
        directory={directory}
        workspace={workspace}
      />

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

      <SessionPickerDialog
        open={sessionPickerOpen}
        onOpenChange={setSessionPickerOpen}
        directory={directory}
        sessionId={sessionId}
        onSessionChange={changeSession}
      />
    </div>
  );
}
