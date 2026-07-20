import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { QuestionBanner } from "./QuestionBanner";
import { PermissionBanner } from "@/components/permission/PermissionBanner";
import { PermissionDialog } from "@/components/permission/PermissionDialog";
import { useMemo, useState } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { useSendMessage, useAbortGeneration } from "@/hooks/queries/useMessages";
import { useCreateSession } from "@/hooks/queries/useSessions";
import { useQuestions } from "@/hooks/queries/useQuestions";
import { usePermissions } from "@/hooks/queries/usePermissions";
import { type ChatInputContent } from "@/lib/opencode";
import type { ModelConfig } from "@/types";

interface ChatContainerProps {
  directory: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string) => void;
}

export function ChatContainer({
  directory,
  sessionId,
  onSessionChange,
}: ChatContainerProps) {
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);
  const sendMessage = useSendMessage();
  const abortGeneration = useAbortGeneration();
  const createSession = useCreateSession();

  const [questionOpen, setQuestionOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);

  const { data: questions = [] } = useQuestions({
    directory: directory,
  });

  const { data: permissions = [] } = usePermissions({
    directory: directory,
  });

  const sessionQuestions = questions.filter(question => question.sessionID === sessionId);
  const sessionPermissions = permissions.filter(p => p.sessionID === sessionId);

  const handleSend = (
    content: ChatInputContent,
    model?: ModelConfig | null,
    agent?: string | null,
  ) => {
    if (!sessionId) {
      createSession.mutate(
        { directory, model: model ?? undefined, agent: agent ?? undefined },
        {
          onSuccess: (newSession) => {
            sendMessage.mutate({
              sessionId: newSession.id,
              content: content,
              directory: directory,
              model,
              agent,
            });

            onSessionChange?.(newSession.id);
          },
        },
      );
      return;
    }
    sendMessage.mutate({
      sessionId,
      content: content,
      directory: directory,
      model,
      agent,
    });
  };

  const handleAbort = () => {
    if (sessionId) {
      abortGeneration.mutate({ sessionId, directory });
    }
  };

  const handleImmediateCommand = () => {
    // mock: no-op
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden h-full">
      <MessageList selectedSessionId={sessionId} />

      <ChatInput
        onSend={handleSend}
        onImmediateCommand={handleImmediateCommand}
        onAbort={handleAbort}
        isLoading={sendMessage.isPending || abortGeneration.isPending}
        placeholder={chatplaceholder}
        directory={directory}
      />

      {sessionQuestions.length > 0 && !questionOpen && (
        <QuestionBanner
          onOpenDialog={() => setQuestionOpen(true)}
          count={sessionQuestions.length}
        />
      )}

      {sessionPermissions.length > 0 && !permissionOpen && (
        <PermissionBanner
          onOpenDialog={() => setPermissionOpen(true)}
          count={sessionPermissions.length}
        />
      )}

      <QuestionSheet
        open={questionOpen}
        onOpenChange={setQuestionOpen}
        questions={sessionQuestions}
        sessionID={sessionId ?? ""}
      />

      <PermissionDialog
        open={permissionOpen}
        onOpenChange={setPermissionOpen}
        permissions={sessionPermissions}
        directory={directory}
      />
    </div>
  );
}
