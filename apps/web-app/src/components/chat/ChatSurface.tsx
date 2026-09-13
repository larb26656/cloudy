import { useCallback, useState } from "react";
import { useWorkspace } from "@/hooks/queries";
import type { ModelConfig } from "@/types";
import { BotChatContainer } from "./BotChatContainer";
import { ChatContainer } from "./ChatContainer";

interface ChatSurfaceProps {
  workspaceId: string | null;
  directory: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string | null) => void;
  /** Agent selection restored from the host (tab/node). Null = use global default. */
  initialAgent?: string | null;
  /** Model selection restored from the host (tab/node). Null = use global default. */
  initialModel?: ModelConfig | null;
  /** Notified whenever the agent selection changes (for the host to persist). */
  onAgentChange?: (agent: string | null) => void;
  /** Notified whenever the model selection changes (for the host to persist). */
  onModelChange?: (model: ModelConfig | null) => void;
}

/**
 * Picks the right chat container for a workspace: bot workspaces get
 * {@link BotChatContainer}, everything else {@link ChatContainer}. Owns the
 * agent/model selection state so hosts (chat tab, desk chat node) only need to
 * persist changes via the change callbacks.
 */
export function ChatSurface({
  workspaceId,
  directory,
  sessionId,
  onSessionChange,
  initialAgent = null,
  initialModel = null,
  onAgentChange,
  onModelChange,
}: ChatSurfaceProps) {
  const { data: workspace } = useWorkspace(workspaceId);

  const [agent, setAgent] = useState<string | null>(initialAgent);
  const [model, setModel] = useState<ModelConfig | null>(initialModel);

  const handleAgentChange = useCallback(
    (nextAgent: string | null) => {
      setAgent(nextAgent);
      onAgentChange?.(nextAgent);
    },
    [onAgentChange],
  );

  const handleModelChange = useCallback(
    (nextModel: ModelConfig | null) => {
      setModel(nextModel);
      onModelChange?.(nextModel);
    },
    [onModelChange],
  );

  if (workspace?.type === "bot") {
    return (
      <BotChatContainer
        workspace={workspace}
        directory={directory}
        sessionId={sessionId}
        onSessionChange={onSessionChange}
        model={model}
        onModelChange={handleModelChange}
      />
    );
  }

  return (
    <ChatContainer
      workspace={workspace ?? null}
      directory={directory}
      sessionId={sessionId}
      onSessionChange={onSessionChange}
      agent={agent}
      onAgentChange={handleAgentChange}
      model={model}
      onModelChange={handleModelChange}
    />
  );
}
