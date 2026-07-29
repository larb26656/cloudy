import { MessageList } from "./message/MessageList";
import { ChatInput } from "./chat-input";
import { SessionStatusBar } from "./SessionStatusBar";
import { PermissionBanner } from "@/components/permission/PermissionBanner";
import { PermissionDialog } from "@/components/permission/PermissionDialog";
import { useCallback, useMemo, useRef, useState } from "react";
import { generatePlaceholder } from "@/lib/greeting-generator";
import {
  useSendMessage,
  useAbortGeneration,
} from "@/hooks/queries/useMessages";
import { useExecuteCommand } from "@/hooks/queries/useCommand";
import { useCreateSession } from "@/hooks/queries/useSessions";
import { useSessionData } from "@/hooks/session/useSessionHumanApprove";
import { type ChatInputContent } from "@/lib/opencode";
import { isCommand, parseCommand } from "@/lib/command";
import { useSystemCommands, findSystemCommand } from "@/lib/commands";
import { SessionPickerDialog } from "@/components/session/SessionPickerDialog";
import { toast } from "@/components/ui/sonner";
import type { ModelConfig } from "@/types";
import { QuestionBanner } from "../question/QuestionBanner";
import { QuestionSheet } from "../question/QuestionSheet";

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
  const { mutateAsync: sendMessageAsync, isPending: isSending } =
    useSendMessage();
  const { mutate: executeCmd } = useExecuteCommand();
  const { mutate: abortMutate, isPending: isAborting } = useAbortGeneration();
  const { mutateAsync: createSessionAsync } = useCreateSession();
  const systemCommands = useSystemCommands();

  const systemCommandsRef = useRef(systemCommands);
  systemCommandsRef.current = systemCommands;

  const [questionOpen, setQuestionOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);

  const {
    sessionQuestions,
    currentQuestion,
    sessionPermissions,
    currentPermission,
  } = useSessionData({ directory, sessionId });

  const ensureSessionId = useCallback(async (): Promise<string> => {
    if (sessionId) {
      return sessionId;
    }

    const newSession = await createSessionAsync({ directory });

    onSessionChange?.(newSession.id);

    return newSession.id;
  }, [sessionId, createSessionAsync, directory, onSessionChange]);

  const handleSend = useCallback(
    async (
      content: ChatInputContent,
      model?: ModelConfig | null,
      agent?: string | null,
    ) => {
      const text = content.text.trim();
      if (!text) return;

      if (isCommand(text)) {
        const parsed = parseCommand(text);
        if (!parsed) return;

        const commandSessionId = await ensureSessionId();

        if (findSystemCommand(parsed.command)) {
          systemCommandsRef.current.execute(parsed.command, parsed.arguments, {
            directory,
            sessionId: commandSessionId,
            onSessionChange,
            openSessionPicker: () => setSessionPickerOpen(true),
            model,
            agent,
          });
          return;
        }

        executeCmd({
          sessionId: commandSessionId,
          command: parsed.command,
          args: parsed.arguments,
          directory,
        });

        return;
      }

      try {
        const messageSessionId = await ensureSessionId();
        await sendMessageAsync({
          sessionId: messageSessionId,
          content: content,
          directory: directory,
          model,
          agent,
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to send message",
        );
      }
    },
    [
      ensureSessionId,
      executeCmd,
      sendMessageAsync,
      directory,
      onSessionChange,
    ],
  );

  const handleAbort = useCallback(() => {
    if (sessionId && !isAborting) {
      abortMutate({ sessionId, directory });
    }
  }, [sessionId, isAborting, abortMutate, directory]);

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (questionOpen || permissionOpen) return;
    if (isAborting) return;

    e.preventDefault();
    handleAbort();
  };

  const handleImmediateCommand = useCallback(
    (commandName: string) => {
      if (findSystemCommand(commandName)) {
        systemCommandsRef.current.execute(commandName, "", {
          directory,
          sessionId,
          onSessionChange,
          openSessionPicker: () => setSessionPickerOpen(true),
          model: null,
          agent: null,
        });
      }
    },
    [directory, sessionId, onSessionChange],
  );

  return (
    <div
      className="relative flex-1 flex flex-col bg-background overflow-hidden h-full"
      tabIndex={-1}
      onKeyDown={handleContainerKeyDown}
    >
      {/*Notify bar*/}
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

      <MessageList selectedSessionId={sessionId} directory={directory} />

      <ChatInput
        onSend={handleSend}
        onImmediateCommand={handleImmediateCommand}
        onAbort={handleAbort}
        isLoading={isSending || isAborting}
        placeholder={chatplaceholder}
        directory={directory}
      />

      <SessionStatusBar sessionId={sessionId} directory={directory} />

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
        onSessionChange={(id) => onSessionChange?.(id)}
      />
    </div>
  );
}
