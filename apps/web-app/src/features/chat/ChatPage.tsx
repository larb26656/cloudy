import { ChatContainer } from "@/components/chat/ChatContainer";
import { Header } from "@/components/layout";
import { useEventStream } from "@/hooks/useEventSteam";
import { useMessageStore, useSessionStore } from "@/stores";
import { useEffect } from "react";

export default function ChatPage() {
  const { sessions, selectedSessionId } = useSessionStore();
  const { loadMessages } = useMessageStore();

  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const sessionDir = currentSession?.directory ?? undefined;
  const sessionTitle = currentSession?.title;

  useEventStream();

  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
    }
  }, [selectedSessionId, loadMessages]);

  return (
    <>
      <Header
        title={sessionTitle || undefined}
        subtitle={sessionDir || undefined}
        showRefresh
        showThemeToggle
      />
      <ChatContainer sessionId={selectedSessionId} />
    </>
  );
}
