import { ChatContainer } from "@/components/chat/ChatContainer";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { useSession } from "@/hooks/queries";
import { WindowFrame } from "../WindowFrame";
import { ExternalLink } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

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
  const workspace = useWorkspaceStore((s) =>
    s.getWorkspace(data.workspaceId),
  );

  const { data: session } = useSession({ sessionId: data.sessionId });
  const title = session?.title ?? "Chat";
  const directory = workspace?.directory;

  const handleSessionChange = useCallback(
    (sessionId: string | null) => {
      updateNodeData(id, { sessionId });
    },
    [id, updateNodeData],
  );

  const handleOpenInTab = useCallback(() => {
    addTab("session", {
      sessionId: data.sessionId,
      workspaceId: data.workspaceId,
      sessionName: title,
    });
  }, [addTab, data.sessionId, data.workspaceId, title]);

  return (
    <WindowFrame
      title={title}
      nodeId={id}
      selected={selected}
      maxWidth={1200}
      maxHeight={1200}
      actions={[
        {
          icon: ExternalLink,
          label: "Open in tab",
          onClick: handleOpenInTab,
          disabled: !data.sessionId,
        },
      ]}
    >
      {directory ? (
        <ChatContainer
          sessionId={data.sessionId}
          directory={directory}
          onSessionChange={handleSessionChange}
        />
      ) : (
        <div className="p-4 text-sm text-muted-foreground">
          Workspace not found.
        </div>
      )}
    </WindowFrame>
  );
}
