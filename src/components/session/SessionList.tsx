// components/session/SessionList.tsx
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { SessionItem } from "./SessionItem";
import { DirectoryFilter } from "../directory/DirectoryFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionStore, useDirectoryStore } from "@/stores";
import { useChatWorkspace } from "@/hooks/useChatWorkspace";
import { ErrorState } from "@/components/ui/error-state";

export function SessionList() {
  const {
    selectedSessionId,
    sessions,
    sessionStatuses,
    isLoading,
    error,
    loadSessions,
    updateSession,
    deleteSession,
    selectSession,
  } = useSessionStore();
  const { createSession } = useChatWorkspace();
  const { selectedDirectory } = useDirectoryStore();
  const [searchQuery, setSearchQuery] = useState("");
  // TODO decision should use in search query?
  // const { searchQuery, setSearchQuery } = useChatUIStore();

  const filteredSessions = sessions.filter((session) =>
    (session.title || "New Chat")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleFork = async (sessionId: string) => {
    console.log("Fork session:", sessionId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col h-full bg-muted lg:p-2 lg:border lg:rounded-2xl">
        <div className="p-4 border-b">
          <Button
            size={"lg"}
            onClick={() => {
              createSession();
            }}
            className="w-full gap-2"
          >
            <Plus className="size-5" />
            New Chat
          </Button>
        </div>
        <div className="px-4 py-2 border-b">
          <DirectoryFilter />
        </div>
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
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
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No chats found" : "No chats yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === selectedSessionId}
                  status={sessionStatuses[session.id]}
                  onClick={() => selectSession(session.id)}
                  onRename={(title) => updateSession(session.id, title)}
                  onDelete={() => deleteSession(session.id)}
                  onFork={() => handleFork(session.id)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t text-xs text-muted-foreground text-center">
          {filteredSessions.length} chat
          {filteredSessions.length !== 1 ? "s" : ""}
          {selectedDirectory && (
            <span className="ml-1">in filtered directory</span>
          )}
        </div>{" "}
      </div>
    </div>
  );
}
