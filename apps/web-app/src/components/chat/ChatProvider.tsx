import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import type { ModelConfig } from "@/types";
import type { Workspace } from "@/lib/cloudy/workspaces";
import {
  useAbortGeneration,
  useSendMessage,
} from "@/hooks/queries/useMessages";
import { useExecuteCommand } from "@/hooks/queries/useCommand";
import { useCreateSession } from "@/hooks/queries/useSessions";
import type { ChatInputContent } from "@/lib/opencode";
import { isCommand, parseCommand } from "@/lib/command";
import { findSystemCommand, useSystemCommands } from "@/lib/commands";
import { toast } from "@/components/ui/sonner";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import { useSessionAgentModelStore } from "@/stores/sessionAgentModelStore";

type ChatContextValue = {
  workspace: Workspace | null;
  directory: string;
  sessionId: string | null;
  effectiveAgent: string | null;
  effectiveModel: ModelConfig | null;
  setAgent: (agent: string | null) => void;
  setModel: (model: ModelConfig | null) => void;
  sendMessage: (
    content: ChatInputContent,
    model?: ModelConfig | null,
    agent?: string | null,
  ) => Promise<void>;
  abortGeneration: () => void;
  executeImmediateCommand: (commandName: string) => Promise<void>;
  isGenerating: boolean;
  changeSession: (sessionId: string | null) => void;
  sessionPickerOpen: boolean;
  openSessionPicker: () => void;
  setSessionPickerOpen: (open: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function showActionError(error: unknown, fallbackMessage: string) {
  toast.error(error instanceof Error ? error.message : fallbackMessage);
}

type ChatProviderProps = PropsWithChildren<{
  workspace: Workspace | null;
  directory: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string | null) => void;
}>;

export function ChatProvider({
  children,
  workspace,
  directory,
  sessionId,
  onSessionChange,
}: ChatProviderProps) {
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const defaultAgent = useDefaultAgentStore((state) => state.defaultAgent);
  const defaultModel = useDefaultModelStore((state) => state.defaultModel);
  const sessionSelection = useSessionAgentModelStore((state) =>
    sessionId ? state.sessions[sessionId] : undefined,
  );
  const { mutateAsync: sendMessageAsync, isPending: isSending } =
    useSendMessage();
  const { mutateAsync: executeCommandAsync } = useExecuteCommand();
  const { mutate: abortMutate, isPending: isAborting } = useAbortGeneration();
  const { mutateAsync: createSessionAsync } = useCreateSession();
  const systemCommands = useSystemCommands();

  const changeSession = useCallback(
    (nextSessionId: string | null) => onSessionChange?.(nextSessionId),
    [onSessionChange],
  );

  const openSessionPicker = useCallback(() => {
    setSessionPickerOpen(true);
  }, []);

  const ensureSessionId = useCallback(
    async (
      agent?: string | null,
      model?: ModelConfig | null,
    ): Promise<string> => {
      if (sessionId) {
        return sessionId;
      }

      const newSession = await createSessionAsync({
        directory,
        agent: agent ?? undefined,
        model: model ?? undefined,
      });

      changeSession(newSession.id);

      return newSession.id;
    },
    [changeSession, createSessionAsync, directory, sessionId],
  );

  const setAgent = useCallback(
    (agent: string | null) => {
      if (!sessionId) {
        useDefaultAgentStore.getState().setDefaultAgent(agent);
        return;
      }
      if (agent === null) {
        useSessionAgentModelStore.getState().clearSessionAgent(sessionId);
        return;
      }
      useSessionAgentModelStore.getState().setSessionAgent(sessionId, agent);
    },
    [sessionId],
  );

  const setModel = useCallback(
    (model: ModelConfig | null) => {
      if (!sessionId) {
        useDefaultModelStore.getState().setDefaultModel(model);
        return;
      }
      if (model === null) {
        useSessionAgentModelStore.getState().clearSessionModel(sessionId);
        return;
      }
      useSessionAgentModelStore.getState().setSessionModel(sessionId, model);
    },
    [sessionId],
  );

  const sendMessage = useCallback(
    async (
      content: ChatInputContent,
      model?: ModelConfig | null,
      agent?: string | null,
    ) => {
      const text = content.text.trim();
      if (!text) return;

      try {
        if (isCommand(text)) {
          const parsed = parseCommand(text);
          if (!parsed) return;

          const commandSessionId = await ensureSessionId(agent, model);

          if (findSystemCommand(parsed.command)) {
            await systemCommands.execute(parsed.command, parsed.arguments, {
              directory,
              sessionId: commandSessionId,
              onSessionChange: changeSession,
              openSessionPicker,
              model,
              agent,
            });
            return;
          }

          await executeCommandAsync({
            sessionId: commandSessionId,
            command: parsed.command,
            args: parsed.arguments,
            directory,
          });
          return;
        }

        const messageSessionId = await ensureSessionId(agent, model);
        await sendMessageAsync({
          sessionId: messageSessionId,
          content,
          directory,
          model,
          agent,
        });
      } catch (err) {
        showActionError(
          err,
          isCommand(text)
            ? "Failed to execute command"
            : "Failed to send message",
        );
      }
    },
    [
      directory,
      ensureSessionId,
      executeCommandAsync,
      changeSession,
      openSessionPicker,
      sendMessageAsync,
      systemCommands,
    ],
  );

  const abortGeneration = useCallback(() => {
    if (sessionId && !isAborting) {
      abortMutate({ sessionId, directory });
    }
  }, [abortMutate, directory, isAborting, sessionId]);

  const executeImmediateCommand = useCallback(
    async (commandName: string) => {
      if (!findSystemCommand(commandName)) return;

      try {
        await systemCommands.execute(commandName, "", {
          directory,
          sessionId,
          onSessionChange: changeSession,
          openSessionPicker,
          model: null,
          agent: null,
        });
      } catch (err) {
        showActionError(err, "Failed to execute command");
      }
    },
    [directory, changeSession, openSessionPicker, sessionId, systemCommands],
  );

  const value = useMemo(
    () => ({
      workspace,
      directory,
      sessionId,
      effectiveAgent: sessionSelection?.agent ?? defaultAgent,
      effectiveModel: sessionSelection?.model ?? defaultModel,
      setAgent,
      setModel,
      sendMessage,
      abortGeneration,
      executeImmediateCommand,
      isGenerating: isSending || isAborting,
      changeSession,
      sessionPickerOpen,
      openSessionPicker,
      setSessionPickerOpen,
    }),
    [
      defaultAgent,
      defaultModel,
      directory,
      sessionId,
      sessionSelection,
      setAgent,
      setModel,
      sendMessage,
      abortGeneration,
      executeImmediateCommand,
      isSending,
      isAborting,
      changeSession,
      sessionPickerOpen,
      openSessionPicker,
      workspace,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
