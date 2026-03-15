// components/session/SessionList.tsx
import { useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { SessionItem } from "./SessionItem";
import { DirectoryFilter } from "./DirectoryFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoundStore } from "@/stores";

export function SessionList() {
  const {
    sessions,
    currentSessionId,
    sessionStatuses,
    isLoading,
    loadSessions,
    createSession,
    selectSession,
    updateSession,
    deleteSession,
    searchQuery,
    setSearchQuery,
    selectedDirectory,
  } = useBoundStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions, selectedDirectory]);

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
            onClick={() => createSession(undefined)}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
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
                  isActive={session.id === currentSessionId}
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
