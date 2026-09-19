import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@repo/ui/components/message/types";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import {
  abortSession,
  createBotSession,
  sendPrompt,
} from "./lib/opencode/sessions";
import { dispatchStreamEvent, subscribeToEvents } from "./lib/opencode/events";
import {
  clearStoredSessionId,
  getStoredSessionId,
  storeSessionId,
} from "./lib/session-storage";
import {
  mergeMessages,
  reconcileMessages,
  useStreamingMessagesStore,
} from "@repo/opencode";
import { sessionKeys, sessionMessageKeys } from "./queries/query-keys";
import {
  useBrowserWorkspace,
  useInitializeBrowserWorkspace,
} from "./hooks/useBrowserWorkspace";
import { useSessionMessages } from "./hooks/useSessionMessages";
import { useSessions } from "./hooks/useSessions";
import { ExtensionChatInput } from "./components/ExtensionChatInput";
import type { ExtensionModel } from "./components/ExtensionModelSelector";
import { ExtensionMessageList } from "./components/ExtensionMessageList";
import { ExtensionSessionAppBar } from "./components/ExtensionSessionAppBar";
import { ExtensionSessionStatusBar } from "./components/ExtensionSessionStatusBar";
import { BrowserWorkspaceLanding } from "./components/BrowserWorkspaceLanding";
import "./styles/App.css";

function App() {
  const queryClient = useQueryClient();
  const browserWorkspace = useBrowserWorkspace();
  const initializeWorkspace = useInitializeBrowserWorkspace();
  const directory =
    browserWorkspace.data?.initialized === true
      ? browserWorkspace.data.workspace.directory
      : null;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ExtensionModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const {
    data: messages = [],
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useSessionMessages(directory, sessionId);
  const {
    data: sessions = [],
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useSessions(directory);
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
    if (!directory) return;
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

      stop = await subscribeToEvents(directory, (event) => {
        const currentSessionId = sessionIdRef.current;

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

        if (event.payload.type === "session.idle") {
          const idleSessionId = event.payload.properties.sessionID;
          if (idleSessionId === currentSessionId) setIsGenerating(false);
          const streamedMessages = takeSessionStreaming(idleSessionId);
          queryClient.setQueryData<Message[]>(
            sessionMessageKeys.detail(directory, idleSessionId),
            (cachedMessages = []) =>
              mergeMessages(cachedMessages, streamedMessages),
          );
          void queryClient.invalidateQueries({
            queryKey: sessionMessageKeys.detail(directory, idleSessionId),
          });
          void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
          return;
        }

        if (currentSessionId) dispatchStreamEvent(event, currentSessionId);
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
  }, [directory, queryClient, takeSessionStreaming]);

  useEffect(() => {
    if (!messagesError || !sessionId) return;
    void clearStoredSessionId();
    setError(
      messagesError instanceof Error
        ? messagesError.message
        : "Failed to load messages",
    );
  }, [messagesError, sessionId]);

  const visibleMessages = useMemo(
    () => reconcileMessages(messages, streamingMessages?.values() ?? []),
    [messages, streamingMessages],
  );

  async function handleSubmit() {
    const text = input.trim();
    if (!text || isGenerating) return;

    setError(null);
    setInput("");
    try {
      let currentSessionId = sessionIdRef.current;
      if (!currentSessionId) {
        if (!directory) throw new Error("Browser workspace is not initialized");
        const session = await createBotSession(directory, model);
        currentSessionId = session.id;
        sessionIdRef.current = session.id;
        setSessionId(session.id);
        await storeSessionId(session.id);
        void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
      }
      if (!currentSessionId) throw new Error("No session available");
      setIsGenerating(true);
      if (!directory) throw new Error("Browser workspace is not initialized");
      await sendPrompt(currentSessionId, text, directory, model);
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
      if (!directory) return;
      await abortSession(currentSessionId, directory);
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

  function handleSessionChange(nextSessionId: string) {
    sessionIdRef.current = nextSessionId;
    setSessionId(nextSessionId);
    setIsGenerating(false);
    setError(null);
    void storeSessionId(nextSessionId).catch((storageError: unknown) => {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Failed to save session selection",
      );
    });
  }

  function handleNewChat() {
    sessionIdRef.current = null;
    setSessionId(null);
    setIsGenerating(false);
    setError(null);
    void clearStoredSessionId().catch((storageError: unknown) => {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Failed to clear session selection",
      );
    });
  }

  if (browserWorkspace.isLoading || browserWorkspace.isError) {
    return (
      <BrowserWorkspaceLanding
        isLoading={browserWorkspace.isLoading}
        isInitializing={false}
        error={browserWorkspace.error}
        onInitialize={() => undefined}
        onRetry={() => void browserWorkspace.refetch()}
      />
    );
  }

  if (!directory) {
    return (
      <BrowserWorkspaceLanding
        isLoading={false}
        isInitializing={initializeWorkspace.isPending}
        error={initializeWorkspace.error}
        onInitialize={() => initializeWorkspace.mutate()}
        onRetry={() => initializeWorkspace.mutate()}
      />
    );
  }

  return (
    <main className="chat-container">
      <ExtensionSessionAppBar
        sessions={sessions}
        sessionId={sessionId}
        isLoading={isSessionsLoading}
        error={sessionsError}
        onSessionChange={handleSessionChange}
        onNewChat={handleNewChat}
      />
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
          directory={directory}
          model={model}
          onChange={setInput}
          onModelChange={setModel}
          onSubmit={() => void handleSubmit()}
          onStop={() => void handleStop()}
        />
      </MessageScrollerProvider>
      <ExtensionSessionStatusBar
        directory={directory}
        isGenerating={isGenerating}
      />
    </main>
  );
}

export default App;
