import { ChatContainer } from "@/components/chat/ChatContainer";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { useSession, useUpdateSession, useWorkspace } from "@/hooks/queries";
import { WindowFrame } from "../WindowFrame";
import { ExternalLink } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { ErrorState } from "@/components/ui/error-state";
import { Center } from "@/components/layout";

type ChatNodeProps = Node<
  {
    workspaceId: string;
    sessionId: string | null;
    sessionName?: string;
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
  const directory = workspace?.directory;

  const handleSessionChange = useCallback(
    (sessionId: string | null) => {
      updateNodeData(id, { sessionId });
    },
    [id, updateNodeData],
  );

  const handleRename = useCallback(
    (newTitle: string) => {
      if (!data.sessionId) return;
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
        <ChatContainer
          workspace={workspace}
          sessionId={data.sessionId}
          directory={directory}
          onSessionChange={handleSessionChange}
        />
      ) : (
        <Center className="flex-1">
          <ErrorState message="Workspace not found" />
        </Center>
      )}
    </WindowFrame>
  );
}
