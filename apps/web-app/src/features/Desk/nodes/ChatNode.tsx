import { ChatContainer } from "@/components/chat/ChatContainer";
import { WindowNode } from "./WindowNode";
import type { Node, NodeProps } from "@xyflow/react";

type ChatNodeProps = Node<
  {
    directory: string;
    sessionId: string | null;
    label?: string;
  },
  "chat"
>;

export function ChatNode({ data, id, selected }: NodeProps<ChatNodeProps>) {
  return (
    <WindowNode title={data.label ?? "Chat"} nodeId={id} selected={selected}>
      <ChatContainer sessionId={data.sessionId} directory={data.directory} />
    </WindowNode>
  );
}
