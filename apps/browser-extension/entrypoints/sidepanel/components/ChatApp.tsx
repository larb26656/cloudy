import { useEffect, useState } from "react";
import { useStreamingMessageDisplayItems } from "@repo/opencode";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import type { Message } from "@repo/ui/components/message/types";
import { useSessionMessages } from "../hooks/useSessionMessages";
import { useSessions } from "../hooks/useSessions";
import { useSessionEventStream } from "../hooks/useSessionEventStream";
import { useChatActions } from "../hooks/useChatActions";
import { useInjectedContexts } from "../hooks/useInjectedContexts";
import { useSelectedText } from "../hooks/useSelectedText";
import { removeInjectedContextParts } from "../lib/opencode/context";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { SessionAppBar } from "./SessionAppBar";
import { useChatStore } from "../stores/chatStore";
import { useSessionStore } from "../stores/sessionStore";

interface ChatAppProps {
  directory: string;
}

const EMPTY_MESSAGES: Message[] = [];

export function ChatApp({ directory }: ChatAppProps) {
  const [input, setInput] = useState("");
  const sessionId = useSessionStore((state) => state.sessionId);
  const isSessionHydrating = useSessionStore((state) => state.isHydrating);
  const selectSession = useSessionStore((state) => state.selectSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const model = useChatStore((state) => state.model);
  const isGenerating = useChatStore((state) => state.isGenerating);
  const error = useChatStore((state) => state.error);
  const setModel = useChatStore((state) => state.setModel);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const setError = useChatStore((state) => state.setError);
  const selectedText = useSelectedText();

  const {
    data: messages = EMPTY_MESSAGES,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useSessionMessages(directory, sessionId);
  const {
    data: sessions = [],
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useSessions(directory);

  useSessionEventStream(directory);

  const displayMessages = messages
    .map(removeInjectedContextParts)
    .filter((message): message is Message => message !== null);

  useEffect(() => {
    if (!messagesError || !sessionId) return;
    void clearSession();
    setError(
      messagesError instanceof Error
        ? messagesError.message
        : "Failed to load messages",
    );
  }, [clearSession, messagesError, sessionId]);

  const { displayItems, streamingIds } = useStreamingMessageDisplayItems(
    displayMessages,
    sessionId,
  );
  const { isInContext } = useInjectedContexts(messages);
  const { submit, stop, changeSession, newChat } = useChatActions({
    directory,
    input,
    model,
    selectedText,
    isGenerating,
    isInContext,
    setInput,
    setIsGenerating,
    setError,
    selectSession,
    clearSession,
  });
  const handleSubmit = () => void submit();
  const handleStop = () => void stop();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        !event.metaKey ||
        event.key.toLowerCase() !== "n"
      ) {
        return;
      }

      event.preventDefault();
      newChat();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newChat]);

  return (
    <main className="chat-container">
      <SessionAppBar
        sessions={sessions}
        sessionId={sessionId}
        isLoading={isSessionsLoading}
        error={sessionsError}
        onSessionChange={changeSession}
        onNewChat={newChat}
      />
      <MessageScrollerProvider autoScroll>
        <MessageList
          displayItems={displayItems}
          streamingCount={streamingIds.length}
          sessionId={sessionId}
          isLoading={isSessionHydrating || isMessagesLoading}
          isGenerating={isGenerating}
          error={error}
        />
        <ChatInput
          value={input}
          isGenerating={isGenerating}
          directory={directory}
          model={model}
          selectedText={selectedText}
          onChange={setInput}
          onModelChange={setModel}
          onSubmit={handleSubmit}
          onStop={handleStop}
        />
      </MessageScrollerProvider>
    </main>
  );
}
