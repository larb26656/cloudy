import { useEffect, useMemo, useState } from "react";
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
import { ChatInput } from "./components/ChatInput";
import { MessageList } from "./components/MessageList";
import { SessionAppBar } from "./components/SessionAppBar";
import { SessionStatusBar } from "./components/SessionStatusBar";
import { BrowserWorkspaceLanding } from "./components/BrowserWorkspaceLanding";
import { useChatStore } from "./stores/chatStore";
import { useSessionStore } from "./stores/sessionStore";
import "./styles/App.css";

function App() {
  const queryClient = useQueryClient();
  const browserWorkspace = useBrowserWorkspace();
  const initializeWorkspace = useInitializeBrowserWorkspace();
  const directory =
    browserWorkspace.data?.initialized === true
      ? browserWorkspace.data.workspace.directory
      : null;
  const [input, setInput] = useState("");
  const sessionId = useSessionStore((state) => state.sessionId);
  const isSessionHydrating = useSessionStore((state) => state.isHydrating);
  const hydrateSession = useSessionStore((state) => state.hydrate);
  const selectSession = useSessionStore((state) => state.selectSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const model = useChatStore((state) => state.model);
  const isGenerating = useChatStore((state) => state.isGenerating);
  const error = useChatStore((state) => state.error);
  const setModel = useChatStore((state) => state.setModel);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const setError = useChatStore((state) => state.setError);
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
    if (!directory) return;
    let cancelled = false;
    let stop: (() => void) | undefined;

    void (async () => {
      await hydrateSession();
      if (cancelled) return;

      stop = await subscribeToEvents(directory, (event) => {
        const currentSessionId = useSessionStore.getState().sessionId;

        if (
          event.payload.type === "session.status" &&
          event.payload.properties.sessionID === currentSessionId
        ) {
          const status = event.payload.properties.status.type;
          useChatStore
            .getState()
            .setIsGenerating(status === "busy" || status === "retry");
        }

        if (
          event.payload.type === "session.error" &&
          event.payload.properties.sessionID === currentSessionId
        ) {
          useChatStore.getState().setIsGenerating(false);
          useChatStore.getState().setError("OpenCode reported an error");
        }

        if (event.payload.type === "session.idle") {
          const idleSessionId = event.payload.properties.sessionID;
          if (idleSessionId === currentSessionId) {
            useChatStore.getState().setIsGenerating(false);
          }
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
        useChatStore
          .getState()
          .setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to connect to Cloudy",
          );
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [directory, hydrateSession, queryClient, takeSessionStreaming]);

  useEffect(() => {
    if (!messagesError || !sessionId) return;
    void clearSession();
    setError(
      messagesError instanceof Error
        ? messagesError.message
        : "Failed to load messages",
    );
  }, [clearSession, messagesError, sessionId]);

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
      let currentSessionId = useSessionStore.getState().sessionId;
      if (!currentSessionId) {
        if (!directory) throw new Error("Browser workspace is not initialized");
        const session = await createBotSession(directory, model);
        currentSessionId = session.id;
        await selectSession(session.id);
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
    const currentSessionId = useSessionStore.getState().sessionId;
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
    setIsGenerating(false);
    setError(null);
    void selectSession(nextSessionId).catch((storageError: unknown) => {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "Failed to save session selection",
      );
    });
  }

  function handleNewChat() {
    setIsGenerating(false);
    setError(null);
    void clearSession().catch((storageError: unknown) => {
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
      <SessionAppBar
        sessions={sessions}
        sessionId={sessionId}
        isLoading={isSessionsLoading}
        error={sessionsError}
        onSessionChange={handleSessionChange}
        onNewChat={handleNewChat}
      />
      <MessageScrollerProvider autoScroll>
        <MessageList
          messages={visibleMessages}
          isLoading={isSessionHydrating || isMessagesLoading}
          isGenerating={isGenerating}
          error={error}
        />
        <ChatInput
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
      <SessionStatusBar directory={directory} isGenerating={isGenerating} />
    </main>
  );
}

export default App;
