import type { ReactNode } from "react";
import type { RecentChatSession } from "@/types";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import { useWorkspaces } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { LoadingState } from "@repo/ui/components/loading-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { SessionCard } from "./SessionCard";
import type { ConversationKind } from "./SessionCard";

export function RecentSessionsSection() {
  const { data: sessions, isLoading, error } = useRecentSessions({ limit: 8 });
  const { data: workspaces = [] } = useWorkspaces();
  const openTab = useTabStore((s) => s.openTab);

  const directoryToWorkspace = (directory: string): Workspace | undefined =>
    workspaces.find((workspace) => workspace.directory === directory);

  const kindOf = (session: RecentChatSession): ConversationKind => {
    const workspace = directoryToWorkspace(session.directory);
    if (workspace?.type === "agent") return "agent";
    if (workspace?.type === "bot") return "bot";
    return "ask";
  };

  const handleOpen = (session: RecentChatSession) => {
    const dir = session.directory;
    const workspace = directoryToWorkspace(dir);
    if (workspace?.type === "bot") {
      openTab("bot-chat", {
        sessionId: session.id,
        workspaceId: workspace.id,
        directory: dir,
        sessionName: session.title || "New Bot Chat",
      });
      return;
    }
    openTab("chat", {
      providerId: session.providerId,
      sessionId: session.id,
      workspaceId: workspace?.id ?? null,
      directory: dir,
      sessionName: session.title || "New Chat",
    });
  };

  let content: ReactNode;
  if (isLoading) {
    content = (
      <LoadingState size="inline" title="Loading sessions..." spinner={false} />
    );
  } else if (error) {
    content = (
      <ErrorState size="inline" bare message="Failed to load sessions" />
    );
  } else if (!sessions?.length) {
    content = <EmptyState size="inline" title="No conversations yet" />;
  } else {
    content = (
      <div className="flex flex-col gap-1">
        {sessions.map((session) => {
          const dir = session.directory;
          return (
            <SessionCard
              key={session.id}
              session={session}
              directory={dir}
              kind={kindOf(session)}
              onClick={() => handleOpen(session)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <section className="mb-9">
      <h2 className="mb-2 text-sm font-medium">Recent conversations</h2>
      {content}
    </section>
  );
}
