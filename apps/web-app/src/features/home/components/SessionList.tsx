import type { ReactNode } from "react";
import { useState } from "react";
import type { ChatSession } from "@/types";

import { Button } from "@repo/ui/components/button";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { useTabStore } from "@/stores/tabStore";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";
import { useSessions, useCreateSession } from "@/hooks/queries";
import { Plus } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { WorkspaceType } from "@/lib/cloudy/workspaces";

interface SessionListProps {
  directory: string;
  workspaceId: string;
  workspaceType: WorkspaceType;
  /** Optional custom header rendered above the list. When omitted, the default "New chat" button is shown. */
  header?: ReactNode;
}

function SessionList({
  directory,
  workspaceId,
  workspaceType,
  header,
}: SessionListProps) {
  const { data: sessions = [], isLoading, error } = useSessions({ directory });
  const createSession = useCreateSession();
  const addTab = useTabStore((s) => s.addTab);
  const defaultProviderId = useDefaultProviderStore((s) => s.defaultProviderId);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSelect = (session: ChatSession) => {
    addTab(workspaceType === "bot" ? "bot-chat" : "chat", {
      ...(workspaceType === "agent" && { providerId: session.providerId }),
      sessionId: session.id,
      workspaceId,
      directory,
      sessionName:
        session.title ||
        (workspaceType === "bot" ? "New Bot Chat" : "New Chat"),
    });
  };

  const handleNewChat = () => {
    addTab(workspaceType === "bot" ? "bot-chat" : "chat", {
      ...(workspaceType === "agent" && { providerId: defaultProviderId }),
      sessionId: null,
      workspaceId,
      directory,
      sessionName: workspaceType === "bot" ? "New Bot Chat" : "New Chat",
    });
  };

  if (isLoading) {
    return (
      <LoadingState size="inline" title="Loading sessions..." spinner={false} />
    );
  }
  if (error) {
    return <ErrorState size="inline" bare message="Failed to load sessions" />;
  }

  const rootSessions = sessions.filter(
    (session: ChatSession) => !session.parentID,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      {header ?? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          disabled={createSession.isPending}
          className="self-start gap-2"
        >
          <Plus data-icon="inline-start" />
          {workspaceType === "bot" ? "New bot chat" : "New chat"}
        </Button>
      )}
      {rootSessions.map((session: ChatSession) =>
        editingId === session.id ? (
          <SessionTitleInput
            key={session.id}
            sessionId={session.id}
            directory={directory}
            initialTitle={
              session.title ||
              (workspaceType === "bot" ? "New Bot Chat" : "New Chat")
            }
            onDone={() => setEditingId(null)}
            className="px-2 py-1.5"
          />
        ) : (
          <button
            key={session.id}
            type="button"
            onClick={() => handleSelect(session)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingId(session.id);
            }}
            className={cn(
              "shrink-0 truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
            )}
          >
            {session.title ||
              (workspaceType === "bot" ? "New Bot Chat" : "New Chat")}
          </button>
        ),
      )}
      {rootSessions.length === 0 && (
        <EmptyState size="inline" title="No sessions yet" />
      )}
    </div>
  );
}

export { SessionList };
