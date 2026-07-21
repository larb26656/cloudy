import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { QuestionSheet } from "./QuestionSheet";
import { QuestionBanner } from "./QuestionBanner";
import { PermissionBanner } from "@/components/permission/PermissionBanner";
import { PermissionDialog } from "@/components/permission/PermissionDialog";
import { useMemo, useState } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";
import {
  useSendMessage,
  useAbortGeneration,
} from "@/hooks/queries/useMessages";
import { useExecuteCommand } from "@/hooks/queries/useCommand";
import { useCreateSession } from "@/hooks/queries/useSessions";
import { useQuestions } from "@/hooks/queries/useQuestions";
import { usePermissions } from "@/hooks/queries/usePermissions";
import { type ChatInputContent } from "@/lib/opencode";
import { isCommand, parseCommand } from "@/lib/command";
import { useSystemCommands, findSystemCommand } from "@/lib/commands";
import type { ModelConfig } from "@/types";

interface ChatContainerProps {
  directory: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string | null) => void;
}

export function ChatContainer({
  directory,
  sessionId,
  onSessionChange,
}: ChatContainerProps) {
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);
  const sendMessage = useSendMessage();
  const executeCommand = useExecuteCommand();
  const abortGeneration = useAbortGeneration();
  const createSession = useCreateSession();
  const systemCommands = useSystemCommands();

  const [questionOpen, setQuestionOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);

  const { data: questions = [] } = useQuestions({
    directory: directory,
  });

  const { data: permissions = [] } = usePermissions({
    directory: directory,
  });

  const sessionQuestions = questions.filter(
    (question) => question.sessionID === sessionId,
  );
  const sessionPermissions = permissions.filter(
    (p) => p.sessionID === sessionId,
  );

  const ensureSessionId = async (): Promise<string> => {
    if (sessionId) {
      return sessionId;
    }

    const newSession = await createSession.mutateAsync({ directory });

    onSessionChange?.(newSession.id);

    return newSession.id;
  };

  const handleSend = async (
    content: ChatInputContent,
    model?: ModelConfig | null,
    agent?: string | null,
  ) => {
    const text = content.text.trim();
    if (!text) return;

    const sessionId = await ensureSessionId();

    if (isCommand(text)) {
      const parsed = parseCommand(text);
      if (!parsed) return;

      if (findSystemCommand(parsed.command)) {
        systemCommands.execute(parsed.command, parsed.arguments, {
          directory,
          sessionId,
          onSessionChange,
          model,
          agent,
        });
        return;
      }

      executeCommand.mutate({
        sessionId,
        command: parsed.command,
        args: parsed.arguments,
        directory,
      });

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
    if (sessionId && !abortGeneration.isPending) {
      abortGeneration.mutate({ sessionId, directory });
    }
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (questionOpen || permissionOpen) return;
    if (abortGeneration.isPending) return;

    e.preventDefault();
    handleAbort();
  };

  const handleImmediateCommand = (commandName: string) => {
    if (findSystemCommand(commandName)) {
      systemCommands.execute(commandName, "", {
        directory,
        sessionId,
        onSessionChange,
        model: null,
        agent: null,
      });
    }
  };

  return (
    <div
      className="flex-1 flex flex-col bg-background overflow-hidden h-full"
      tabIndex={-1}
      onKeyDown={handleContainerKeyDown}
    >
      <MessageList selectedSessionId={sessionId} directory={directory} />

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
        directory={directory}
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
