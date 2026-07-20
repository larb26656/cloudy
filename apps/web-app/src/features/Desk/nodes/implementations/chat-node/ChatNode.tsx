import { ChatContainer } from "@/components/chat/ChatContainer";
import { WindowFrame } from "../WindowFrame";
import type { Node, NodeProps } from "@xyflow/react";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import type { ConfigDialogProps } from "../../template/nodeTemplates";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

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

  const handleSessionChange = useCallback(
    (sessionId: string) => {
      updateNodeData(id, { sessionId });
    },
    [id, updateNodeData],
  );

  return (
    <WindowFrame
      title={data.label ?? "Chat"}
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
