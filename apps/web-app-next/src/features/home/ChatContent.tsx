import { ChatContainer } from "@/components/chat/ChatContainer";
import type { Tab } from "@/stores/tabStore";
import { useTabStore } from "@/stores/tabStore";

interface ChatContentProps {
  tab: Tab;
}

export function ChatContent({ tab }: ChatContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);

  return (
    <ChatContainer
      sessionId={tab.data.sessionId}
      onSessionChange={(sessionId) => updateTabData(tab.id, { sessionId })}
    />
  );
}
