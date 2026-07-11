import { ChatContainer } from "@/components/chat/ChatContainer";

interface ChatContentProps {
  sessionId: string;
}

export function ChatContent({ sessionId }: ChatContentProps) {
  // handle sessionId not found
  return <ChatContainer sessionId={sessionId} />
}
