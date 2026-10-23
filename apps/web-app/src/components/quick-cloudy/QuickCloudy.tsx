import { useEffect, useRef, useState } from "react";
import { Clock3, MessageCircle } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@repo/ui/components/command";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import { useCapacity } from "@/hooks/queries/useModels";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import type { RecentChatSession } from "@/types";
import { ChatProvider, useChat } from "@/components/chat/ChatProvider";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message/MessageList";
import { createSessionTabPayload } from "@/components/pet/openSessionTab";
import { quickBridge } from "@/lib/desktop/quickBridge";
import type { ChatInputContent } from "@/lib/opencode";

const PROVIDER_ID = "cloudy";

export function QuickCloudy() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { data: recentSessions = [] } = useRecentSessions({ limit: 100 });
  const { data: capacity, isLoading, error } = useCapacity(PROVIDER_ID);
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
      directory=""
      providerId={PROVIDER_ID}
      sessionId={sessionId}
      onSessionChange={handleSessionChange}
      capacity={capacity}
    >
      <QuickCloudyContent
        sessionName="Quick Chat"
        recentSessions={recentSessions
          .filter((session) => session.providerId === PROVIDER_ID)
          .slice(0, 5)}
        onSelectSession={(id) => {
          setSessionId(id);
          quickBridge.setHeight(640);
        }}
        onNewSession={() => {
          setSessionId(null);
          quickBridge.setHeight(360);
        }}
      />
    </ChatProvider>
  );
}

function QuickCloudyContent({
  sessionName,
  recentSessions,
  onSelectSession,
  onNewSession,
}: {
  sessionName: string;
  recentSessions: RecentChatSession[];
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
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
  const { data: matchingSessions = [] } = useRecentSessions({
    limit: 100,
    search: initialPrompt.trim() || undefined,
  });

  const submitInitialPrompt = () => {
    const text = initialPrompt.trim();
    if (!text || isSending) return;
    const content: ChatInputContent = {
      text,
      mentions: [],
      attachments: [],
    };
    setInitialPrompt("");
    void sendMessage(content, effectiveModel, effectiveAgent);
  };

  useEffect(() => {
    const nextHeight = sessionId ? 640 : 360;
    if (lastWindowHeight.current === nextHeight) return;
    lastWindowHeight.current = nextHeight;
    quickBridge.setHeight(nextHeight);
  }, [initialPrompt, sessionId]);

  return (
    <main className="flex h-dvh min-h-[360px] flex-col overflow-hidden bg-background text-foreground">
      {(sessionId || initialPrompt.trim()) && (
        <header className="flex items-center justify-between border-b px-5 py-2.5">
          <span className="text-sm font-semibold">Quick Cloudy</span>
          <div className="flex items-center gap-2">
            {sessionId && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onNewSession}
                >
                  New chat
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    quickBridge.openSession(
                      createSessionTabPayload({
                        providerId: PROVIDER_ID,
                        sessionId,
                        directory,
                        sessionName,
                      }),
                    );
                  }}
                >
                  Open
                </Button>
              </>
            )}
          </div>
        </header>
      )}
      <MessageScrollerProvider autoScroll>
        {sessionId ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <MessageList
                selectedSessionId={sessionId}
                directory={directory}
                isShowEmptyState={false}
              />
            </div>
            <div className="shrink-0">
              <ChatInput placeholder="Ask Cloudy…" allowTypingWhileSending />
            </div>
          </>
        ) : (
          <Command
            shouldFilter={false}
            className="h-auto flex-1 rounded-xl bg-background p-2"
          >
            <CommandInput
              value={initialPrompt}
              onValueChange={setInitialPrompt}
              placeholder="Ask Cloudy…"
              aria-label="Ask Cloudy"
              disabled={isSending}
            />
            <CommandList>
              {initialPrompt.trim() && (
                <CommandGroup>
                  <CommandItem
                    value={initialPrompt.trim()}
                    onSelect={submitInitialPrompt}
                    className="min-w-0"
                  >
                    <MessageCircle />
                    <span className="min-w-0 flex-1 truncate">
                      Ask Cloudy “{initialPrompt.trim()}”
                    </span>
                    <CommandShortcut>↵</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              )}
              {(initialPrompt.trim() ? matchingSessions : recentSessions)
                .length > 0 && (
                <CommandGroup heading="Recent chats">
                  {(initialPrompt.trim() ? matchingSessions : recentSessions)
                    .filter((session) => session.providerId === PROVIDER_ID)
                    .slice(0, 5)
                    .map((session) => (
                      <CommandItem
                        key={session.id}
                        value={session.id}
                        onSelect={() => onSelectSession(session.id)}
                        className="min-w-0"
                      >
                        <Clock3 />
                        <span className="min-w-0 flex-1 truncate">
                          {session.title ||
                            session.directory ||
                            "Untitled chat"}
                        </span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        )}
      </MessageScrollerProvider>
    </main>
  );
}
