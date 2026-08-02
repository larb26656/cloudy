import { createContext, useCallback, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import type { ModelConfig } from "@/types";
import type { Workspace } from "@/lib/cloudy/workspaces";
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
};

const ChatContext = createContext<ChatContextValue | null>(null);

type ChatProviderProps = PropsWithChildren<{
  workspace: Workspace | null;
  directory: string;
  sessionId: string | null;
}>;

export function ChatProvider({
  children,
  workspace,
  directory,
  sessionId,
}: ChatProviderProps) {
  const defaultAgent = useDefaultAgentStore((state) => state.defaultAgent);
  const defaultModel = useDefaultModelStore((state) => state.defaultModel);
  const sessionSelection = useSessionAgentModelStore((state) =>
    sessionId ? state.sessions[sessionId] : undefined,
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

  const value = useMemo(
    () => ({
      workspace,
      directory,
      sessionId,
      effectiveAgent: sessionSelection?.agent ?? defaultAgent,
      effectiveModel: sessionSelection?.model ?? defaultModel,
      setAgent,
      setModel,
    }),
    [
      defaultAgent,
      defaultModel,
      directory,
      sessionId,
      sessionSelection,
      setAgent,
      setModel,
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
