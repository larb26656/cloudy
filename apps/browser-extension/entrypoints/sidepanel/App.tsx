import { useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@repo/ui/components/message/types";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import {
  abortSession,
  applyStreamEvent,
  ASK_DIRECTORY,
  clearStoredSessionId,
  createBotSession,
  getStoredSessionId,
  loadSessionMessages,
  sendPrompt,
  storeSessionId,
  subscribeToEvents,
  type StreamState,
} from "./opencode";
import { ExtensionChatInput } from "./ExtensionChatInput";
import { ExtensionMessageList } from "./ExtensionMessageList";
import { ExtensionSessionStatusBar } from "./ExtensionSessionStatusBar";
import "./App.css";

const emptyStream: StreamState = {
  messages: new Map(),
  pendingDeltas: new Map(),
  parts: new Map(),
};

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stream, setStream] = useState<StreamState>(emptyStream);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;

    void (async () => {
      const storedId = await getStoredSessionId();
      if (storedId) {
        try {
          const loaded = await loadSessionMessages(storedId);
          if (!cancelled) {
            setSessionId(storedId);
            setMessages(loaded);
          }
          setIsLoading(false);
        } catch {
          await clearStoredSessionId();
          setIsLoading(false);
        }
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
          void loadSessionMessages(currentSessionId)
            .then((loaded) => {
              if (!cancelled) {
                setMessages(loaded);
                setStream(emptyStream);
              }
            })
            .catch((loadError: unknown) => {
              if (!cancelled)
                setError(
                  loadError instanceof Error
                    ? loadError.message
                    : "Failed to load messages",
                );
            });
          return;
        }

        setStream((current) =>
          applyStreamEvent(current, event, currentSessionId),
        );
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
  }, []);

  const visibleMessages = useMemo<Message[]>(() => {
    const merged = new Map(
      messages.map((message) => [message.info.id, message]),
    );
    for (const message of stream.messages.values()) {
      merged.set(message.info.id, message);
    }
    return Array.from(merged.values());
  }, [messages, stream]);

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
          isLoading={isLoading}
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
