import { ChatContainer } from "@/components/chat/ChatContainer";
import type { Node, NodeProps } from "@xyflow/react";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import type { ConfigDialogProps } from "../../template/nodeTemplates";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { useSession } from "@/hooks/queries";
import { WindowFrame } from "../WindowFrame";

type ChatNodeProps = Node<
  {
    directory: string;
    sessionId: string | null;
    label?: string;
  },
  "chat"
>;

export function ChatConfigDialog({
  open,
  onOpenChange,
  onSubmit,
}: ConfigDialogProps) {
  return (
    <CreateChatDialog
      open={open}
      onOpenChange={onOpenChange}
      onCreated={(data) => onSubmit(data)}
    />
  );
}

export function ChatNode({ data, id, selected }: NodeProps<ChatNodeProps>) {
  const { updateNodeData } = useReactFlow();

  const { data: session } = useSession({ sessionId: data.sessionId });
  const title = session?.title ?? "Chat";

  const handleSessionChange = useCallback(
    (sessionId: string) => {
      updateNodeData(id, { sessionId });
    },
    [id, updateNodeData],
  );

  return (
    <WindowFrame
      title={title}
      nodeId={id}
      selected={selected}
      maxWidth={1200}
      maxHeight={1200}
    >
      <ChatContainer
        sessionId={data.sessionId}
        directory={data.directory}
        onSessionChange={handleSessionChange}
      />
    </WindowFrame>
  );
}
