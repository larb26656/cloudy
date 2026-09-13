import { ChatSurface } from "@/components/chat/ChatSurface";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { useSession, useUpdateSession, useWorkspace } from "@/hooks/queries";
import { WindowFrame } from "../WindowFrame";
import { ExternalLink } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { ErrorState } from "@repo/ui/components/error-state";
import { Center } from "@/components/layout";
import type { ModelConfig } from "@/types";

type ChatNodeProps = Node<
  {
    workspaceId: string | null;
    /** Present when the node was created from an ad-hoc path (no workspace). */
    directory?: string | null;
    sessionId: string | null;
    sessionName?: string;
    agent?: string | null;
    model?: ModelConfig | null;
  },
  "chat"
>;

export function ChatNode({ data, id, selected }: NodeProps<ChatNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const addTab = useTabStore((s) => s.addTab);
  const { data: workspace } = useWorkspace(data.workspaceId);
  const updateSession = useUpdateSession();

  const { data: session } = useSession({ sessionId: data.sessionId });
  const title = session?.title ?? "Chat";
  const directory = workspace?.directory ?? data.directory;

  const handleSessionChange = useCallback(
    (sessionId: string | null) => {
      updateNodeData(id, { sessionId });
    },
    [id, updateNodeData],
  );

  const handleAgentChange = useCallback(
    (agent: string | null) => {
      updateNodeData(id, { agent });
    },
    [id, updateNodeData],
  );

  const handleModelChange = useCallback(
    (model: ModelConfig | null) => {
      updateNodeData(id, { model });
    },
    [id, updateNodeData],
  );

  const handleRename = useCallback(
    (newTitle: string) => {
      if (!data.sessionId || !directory) return;
      updateSession.mutate({
        sessionID: data.sessionId,
        directory,
        title: newTitle,
      });
    },
    [data.sessionId, directory, updateSession],
  );

  const handleOpenInTab = useCallback(() => {
    if (!directory) return;
    addTab("chat", {
      sessionId: data.sessionId,
      workspaceId: data.workspaceId,
      directory,
      sessionName: title,
    });
  }, [addTab, data.sessionId, data.workspaceId, directory, title]);

  return (
    <WindowFrame
      title={title}
      nodeId={id}
      selected={selected}
      maxWidth={1200}
      maxHeight={1200}
      onRename={data.sessionId ? handleRename : undefined}
      actions={[
        {
          icon: ExternalLink,
          label: "Open in tab",
          onClick: handleOpenInTab,
          disabled: !data.sessionId || !directory,
        },
      ]}
    >
      {directory ? (
        <ChatSurface
          workspaceId={data.workspaceId}
          directory={directory}
          sessionId={data.sessionId}
          onSessionChange={handleSessionChange}
          initialAgent={data.agent}
          onAgentChange={handleAgentChange}
          initialModel={data.model}
          onModelChange={handleModelChange}
        />
      ) : (
        <Center className="flex-1">
          <ErrorState message="Workspace not found" />
        </Center>
      )}
    </WindowFrame>
  );
}
