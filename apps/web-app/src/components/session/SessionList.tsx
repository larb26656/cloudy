import { SessionItem } from "./SessionItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores/instance";
import { ErrorState } from "@/components/ui/error-state";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { InfiniteScrollTrigger } from "../InfiniteScrollTrigger";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

type SessionListProps = {
  searchQuery: string;
};

export function SessionList({ searchQuery }: SessionListProps) {
  const navigate = useNavigate();
  const { location } = useRouterState();

  const {
    selectedSessionId,
    sessions,
    sessionStatuses,
    isLoading,
    isLoadingMore,
    nextCursor,
    error,
    loadSessions,
    loadMoreSessions,
    updateSession,
    deleteSession,
    selectSession,
    createTempSession,
  } = useStore("session");
  const { selectedDirectory } = useStore("directory");

  const filteredSessions = sessions
    .filter((session) => !session.parentID)
    .filter((session) =>
      (session.title || "New Chat")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );

  const handleSelect = async (sessionId: string) => {
    const isInChat = location.pathname.startsWith("/chat");

    if (!isInChat) {
      await navigate({ to: "/" });
    }

    selectSession(sessionId);
  };

  const handleFork = async (sessionId: string) => {
    console.log("Fork session:", sessionId);
  };

  const handleCreateSession = () => {
    createTempSession();
  };

  const sentinelRef = useInfiniteScroll({
    enabled: !!nextCursor && !searchQuery,
    onLoadMore: () => loadMoreSessions(selectedDirectory!),
  });

  return (
    <div className="flex-1 p-2 min-h-0 overflow-y-auto">
      {error ? (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <ErrorState
            message={error}
            onRetry={() => loadSessions(selectedDirectory || "")}
          />
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
          {searchQuery ? (
            <p className="text-muted-foreground">No chats found</p>
          ) : (
            <>
              <p className="text-muted-foreground mb-3">No sessions yet</p>
              <Button size="sm" onClick={handleCreateSession}>
                Create your first session
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === selectedSessionId}
              status={sessionStatuses[session.id]}
              onClick={() => handleSelect(session.id)}
              onRename={(title) => updateSession(session.id, title)}
              onDelete={() => deleteSession(session.id)}
              onFork={() => handleFork(session.id)}
            />
          ))}
          <InfiniteScrollTrigger
            enabled={!searchQuery && !!nextCursor}
            isLoading={isLoadingMore}
            sentinelRef={sentinelRef}
          />
        </div>
      )}
    </div>
  );
}
