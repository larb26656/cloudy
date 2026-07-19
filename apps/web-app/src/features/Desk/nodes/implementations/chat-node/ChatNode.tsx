import { ChatContainer } from "@/components/chat/ChatContainer";
import { WindowFrame } from "../WindowFrame";
import type { Node, NodeProps } from "@xyflow/react";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import type { ConfigDialogProps } from "../../template/nodeTemplates";

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
  return (
    <WindowFrame title={data.label ?? "Chat"} nodeId={id} selected={selected}>
      <ChatContainer sessionId={data.sessionId} directory={data.directory} />
    </WindowFrame>
  );
}
