import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@repo/ui/components/message/types";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import {
  abortSession,
  ASK_DIRECTORY,
  clearStoredSessionId,
  createBotSession,
  dispatchStreamEvent,
  getStoredSessionId,
  sendPrompt,
  storeSessionId,
  subscribeToEvents,
} from "./services/opencode";
import { useStreamingMessagesStore } from "@repo/opencode";
import { sessionMessageKeys } from "./queries/query-keys";
import { useSessionMessages } from "./hooks/useSessionMessages";
import { ExtensionChatInput } from "./components/ExtensionChatInput";
import { ExtensionMessageList } from "./components/ExtensionMessageList";
import { ExtensionSessionStatusBar } from "./components/ExtensionSessionStatusBar";
import "./styles/App.css";

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const {
    data: messages = [],
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useSessionMessages(sessionId);
  const streamingMessages = useStreamingMessagesStore((state) =>
    state.streamingMessages.get(sessionId ?? ""),
  );
  const takeSessionStreaming = useStreamingMessagesStore(
    (state) => state.takeSessionStreaming,
  );

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;

    void (async () => {
      const storedId = await getStoredSessionId();
      if (storedId) {
        if (!cancelled) setSessionId(storedId);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }

      stop = await subscribeToEvents((event) => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return;

        if (
          event.payload.type === "session.status" &&
          event.payload.properties.sessionID === currentSessionId
        ) {
          const status = event.payload.properties.status.type;
          setIsGenerating(status === "busy" || status === "retry");
        }

        if (
          event.payload.type === "session.error" &&
          event.payload.properties.sessionID === currentSessionId
        ) {
          setIsGenerating(false);
          setError("OpenCode reported an error");
        }

        if (
          event.payload.type === "session.idle" &&
          event.payload.properties.sessionID === currentSessionId
        ) {
          setIsGenerating(false);
          takeSessionStreaming(currentSessionId);
          void queryClient.invalidateQueries({
            queryKey: sessionMessageKeys.detail(
              ASK_DIRECTORY,
              currentSessionId,
            ),
          });
          return;
        }

        dispatchStreamEvent(event, currentSessionId);
      });
    })().catch((loadError: unknown) => {
      if (!cancelled)
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to connect to Cloudy",
        );
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [queryClient, takeSessionStreaming]);

  useEffect(() => {
    if (!messagesError || !sessionId) return;
    void clearStoredSessionId();
    setError(
      messagesError instanceof Error
        ? messagesError.message
        : "Failed to load messages",
    );
  }, [messagesError, sessionId]);

  const visibleMessages = useMemo<Message[]>(() => {
    const merged = new Map(
      messages.map((message) => [message.info.id, message]),
    );
    for (const message of streamingMessages?.values() ?? []) {
      merged.set(message.info.id, message);
    }
    return Array.from(merged.values());
  }, [messages, streamingMessages]);

  async function handleSubmit() {
    const text = input.trim();
    if (!text || isGenerating) return;

    setError(null);
    setInput("");
    try {
      let currentSessionId = sessionIdRef.current;
      if (!currentSessionId) {
        const session = await createBotSession();
        currentSessionId = session.id;
        sessionIdRef.current = session.id;
        setSessionId(session.id);
        await storeSessionId(session.id);
      }
      if (!currentSessionId) throw new Error("No session available");
      setIsGenerating(true);
      await sendPrompt(currentSessionId, text);
    } catch (sendError: unknown) {
      setIsGenerating(false);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send message",
      );
    }
  }

  async function handleStop() {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;
    try {
      await abortSession(currentSessionId);
    } catch (abortError: unknown) {
      setError(
        abortError instanceof Error
          ? abortError.message
          : "Failed to stop generation",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="chat-container">
      <MessageScrollerProvider autoScroll>
        <ExtensionMessageList
          messages={visibleMessages}
          isLoading={isLoading || isMessagesLoading}
          isGenerating={isGenerating}
          error={error}
        />
        <ExtensionChatInput
          value={input}
          isGenerating={isGenerating}
          onChange={setInput}
          onSubmit={() => void handleSubmit()}
          onStop={() => void handleStop()}
        />
      </MessageScrollerProvider>
      <ExtensionSessionStatusBar isGenerating={isGenerating} />
    </main>
  );
}

export default App;
