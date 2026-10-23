import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import { useCapacity } from "@/hooks/queries/useModels";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import type { RecentChatSession } from "@/types";
import { ChatProvider, useChat } from "@/components/chat/ChatProvider";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message/MessageList";
import "./QuickCloudy.css";
import { createSessionTabPayload } from "@/features/pet/openSessionTab";
import { quickBridge } from "@/lib/desktop/quickBridge";
import type { ChatInputContent } from "@/lib/opencode";
import { QuickCloudySearchResults } from "./QuickCloudySearchResults";

export function QuickCloudy() {
  const [view, setView] = useState<"search" | "chat">("search");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState("cloudy");
  const [directory, setDirectory] = useState("");
  const { data: recentSessions = [] } = useRecentSessions({ limit: 100 });
  const { data: capacity, isLoading, error } = useCapacity(providerId);
  const handleSessionChange = (nextSessionId: string | null) => {
    setSessionId(nextSessionId);
  };

  useEffect(() => {
    const focusInput = () => {
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLElement>(
          ".input-chat [contenteditable], [data-slot=command-input]",
        );
        input?.focus();
      });
    };
    focusInput();
    const unsubscribe = quickBridge.onFocusInput(focusInput);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") quickBridge.hide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, sessionId]);

  if (isLoading) return <LoadingState />;
  if (error || !capacity)
    return <ErrorState message={error?.message ?? "Provider not found"} />;

  return (
    <ChatProvider
      workspace={null}
      directory={directory}
      providerId={providerId}
      sessionId={sessionId}
      onSessionChange={handleSessionChange}
      onNewSessionCreated={() => {
        setView("chat");
      }}
      capacity={capacity}
    >
      <QuickCloudyContent
        sessionName="Quick Chat"
        providerId={providerId}
        recentSessions={recentSessions.slice(0, 5)}
        onSelectSession={(session) => {
          setSessionId(session.id);
          setProviderId(session.providerId);
          setDirectory(session.directory);
          setView("chat");
          quickBridge.setHeight(640);
        }}
        onBackToPicker={() => {
          setView("search");
          setSessionId(null);
          setProviderId("cloudy");
          setDirectory("");
          quickBridge.setHeight(360);
        }}
        view={view}
      />
    </ChatProvider>
  );
}

function QuickCloudyContent({
  sessionName,
  providerId,
  recentSessions,
  onSelectSession,
  onBackToPicker,
  view,
}: {
  sessionName: string;
  providerId: string;
  recentSessions: RecentChatSession[];
  onSelectSession: (session: RecentChatSession) => void;
  onBackToPicker: () => void;
  view: "search" | "chat";
}) {
  const {
    sessionId,
    directory,
    sendMessage,
    effectiveModel,
    effectiveAgent,
    isSending,
  } = useChat();
  const [initialPrompt, setInitialPrompt] = useState("");
  const lastWindowHeight = useRef<number | null>(null);

  const submitInitialPrompt = (nextProviderId: string) => {
    const text = initialPrompt.trim();
    if (!text || isSending) return;
    const content: ChatInputContent = {
      text,
      mentions: [],
      attachments: [],
    };
    setInitialPrompt("");
    void sendMessage(content, effectiveModel, effectiveAgent, {
      newSession: true,
      providerId: nextProviderId,
    });
  };

  useEffect(() => {
    const nextHeight = view === "chat" ? 640 : 360;
    if (lastWindowHeight.current === nextHeight) return;
    lastWindowHeight.current = nextHeight;
    quickBridge.setHeight(nextHeight);
  }, [view]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        view === "chat" &&
        (event.metaKey || event.ctrlKey) &&
        event.key === "["
      ) {
        event.preventDefault();
        onBackToPicker();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBackToPicker, view]);

  return (
    <main className="flex h-dvh min-h-[360px] flex-col overflow-hidden rounded-2xl bg-background/70 text-foreground backdrop-blur-2xl">
      {(view === "chat" || initialPrompt.trim()) && (
        <header className="flex items-center justify-between px-5 py-2.5">
          <span className="text-sm font-semibold">Quick Cloudy</span>
          <div className="flex items-center gap-2">
            {view === "chat" && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onBackToPicker}
                >
                  Back
                </Button>
                {sessionId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      quickBridge.openSession(
                        createSessionTabPayload({
                          providerId,
                          sessionId,
                          directory,
                          sessionName,
                        }),
                      );
                    }}
                  >
                    Open
                  </Button>
                )}
              </>
            )}
          </div>
        </header>
      )}
      <MessageScrollerProvider autoScroll>
        {view === "chat" ? (
          <QuickCloudyChatContent sessionId={sessionId} directory={directory} />
        ) : view === "search" ? (
          <QuickCloudySearchResults
            initialPrompt={initialPrompt}
            onPromptChange={setInitialPrompt}
            recentSessions={recentSessions}
            onSelectSession={onSelectSession}
            onSubmitPrompt={submitInitialPrompt}
            disabled={isSending}
          />
        ) : null}
      </MessageScrollerProvider>
    </main>
  );
}

function QuickCloudyChatContent({
  sessionId,
  directory,
}: {
  sessionId: string | null;
  directory: string;
}) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList selectedSessionId={sessionId} directory={directory} />
      </div>
      <div className="shrink-0">
        <ChatInput placeholder="Ask Cloudy…" allowTypingWhileSending />
      </div>
    </>
  );
}
