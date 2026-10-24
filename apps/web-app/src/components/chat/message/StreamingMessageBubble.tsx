import { MessageBubble } from "@repo/ui/components/message";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { useAgents } from "@/hooks/queries/useAgents";
import { useChatContext } from "../ChatProvider";

interface StreamingMessageBubbleProps {
  sessionId: string;
  messageId: string;
}

export function StreamingMessageBubble({
  sessionId,
  messageId,
}: StreamingMessageBubbleProps) {
  const chat = useChatContext();
  const { data: agents } = useAgents({
    directory: chat?.directory,
    providerId: chat?.providerId,
  });
  const message = useStreamingMessagesStore((s) =>
    s.streamingMessages.get(sessionId)?.get(messageId),
  );

  if (!message) return null;

  const agentNames = new Map(
    (agents ?? []).map((agent) => [agent.id, agent.name]),
  );
  const displayMessage = {
    ...message,
    parts: message.parts.map((part) =>
      part.type === "step-finish" && part.agent
        ? { ...part, agent: agentNames.get(part.agent) ?? part.agent }
        : part,
    ),
  };

  return <MessageBubble message={displayMessage} isStreaming />;
}
