import { BotChatContainer } from "@/components/chat/BotChatContainer";
import { Center } from "@/components/layout";
import { useSession, useUpdateSession, useWorkspace } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";
import type { ModelConfig } from "@/types";
import { ErrorState } from "@repo/ui/components/error-state";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { ExternalLink } from "lucide-react";
import { useCallback } from "react";
import { WindowFrame } from "../WindowFrame";

type BotChatNodeProps = Node<
  {
    workspaceId: string;
    sessionId: string | null;
    sessionName?: string;
    model?: ModelConfig | null;
  },
  "bot-chat"
>;

export function BotChatNode({
  data,
  id,
  selected,
}: NodeProps<BotChatNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const addTab = useTabStore((s) => s.addTab);
  const { data: workspace } = useWorkspace(data.workspaceId);
  const { data: session } = useSession({ sessionId: data.sessionId });
  const updateSession = useUpdateSession();
  const title = session?.title ?? data.sessionName ?? "Bot Chat";

  const handleSessionChange = useCallback(
    (sessionId: string | null) => {
      updateNodeData(
        id,
        sessionId === null
          ? { sessionId, sessionName: "New Bot Chat" }
          : { sessionId },
      );
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
      if (!data.sessionId || !workspace) return;
      updateSession.mutate({
        sessionID: data.sessionId,
        directory: workspace.directory,
        title: newTitle,
      });
    },
    [data.sessionId, updateSession, workspace],
  );

  const handleOpenInTab = useCallback(() => {
    if (!workspace || workspace.type !== "bot") return;
    addTab("bot-chat", {
      sessionId: data.sessionId,
      workspaceId: data.workspaceId,
      directory: workspace.directory,
      sessionName: title,
      model: data.model,
    });
  }, [addTab, data.model, data.sessionId, data.workspaceId, title, workspace]);

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
          disabled: !data.sessionId || workspace?.type !== "bot",
        },
      ]}
    >
      {workspace?.type === "bot" ? (
        <BotChatContainer
          workspace={workspace}
          directory={workspace.directory}
          sessionId={data.sessionId}
          onSessionChange={handleSessionChange}
          model={data.model}
          onModelChange={handleModelChange}
        />
      ) : (
        <Center className="flex-1">
          <ErrorState message="Bot workspace not found" />
        </Center>
      )}
    </WindowFrame>
  );
}
