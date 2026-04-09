import { ChatContainer } from "@/components/chat/ChatContainer";
import { Header } from "@/components/layout";
import { useEventStream } from "@/hooks/useEventSteam";
import { useMessageStore, useSessionStore } from "@/stores";
import { useEffect, useState } from "react";

type SnippetType = "idea" | "memory" | "artifact";

const snippetPrompts: Record<SnippetType, string> = {
  idea: "ฉันอยากได้ไอเดียใหม่ๆ ช่วย brainstorm ให้หน่อย",
  memory: "ฉันอยากบันทึกความจำสำคัญ",
  artifact: "ช่วยสร้าง artifact ให้หน่อย",
};

export default function ChatPage() {
  const { sessions, selectedSessionId } = useSessionStore();
  const { messages, loadMessages } = useMessageStore();
  const [initialInput, setInitialInput] = useState<string>("");

  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const sessionDir = currentSession?.directory ?? undefined;
  const sessionTitle = currentSession?.title;

  useEventStream();

  useEffect(() => {
    if (!selectedSessionId) return;

    const hasLoaded = !!messages[selectedSessionId];
    if (hasLoaded) return;

    loadMessages(selectedSessionId);
  }, [selectedSessionId, messages, loadMessages]);

  const handleSnippetSelect = (type: SnippetType) => {
    setInitialInput(snippetPrompts[type]);
  };

  return (
    <>
      <Header
        title={sessionTitle || undefined}
        subtitle={sessionDir || undefined}
        showRefresh
        showThemeToggle
      />
      <ChatContainer
        sessionId={selectedSessionId}
        onSnippetSelect={handleSnippetSelect}
        initialInput={initialInput}
      />
    </>
  );
}
