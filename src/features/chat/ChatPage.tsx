import { ChatContainer } from "@/components/chat/ChatContainer";
import { Header } from "@/components/layout";
import { useEventStream } from "@/hooks/useEventSteam";
import { useMessageStore, useSessionStore } from "@/stores";
import { useEffect } from "react";

export default function ChatPage() {
  const { sessions, sessionStatuses, selectedSessionId } = useSessionStore();
  const { loadMessages } = useMessageStore();

  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const sessionDir = currentSession?.directory ?? undefined;
  const sessionTitle = currentSession?.title;
  const sessionStatus = selectedSessionId
    ? (sessionStatuses[selectedSessionId] ?? null)
    : null;

  useEventStream();

  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
    }
  }, [selectedSessionId, loadMessages]);

  return (
    <>
      <Header
        sessionTitle={sessionTitle}
        sessionDirectory={sessionDir}
        sessionStatus={sessionStatus}
      />
      <ChatContainer sessionId={selectedSessionId} />
    </>
  );
}
