import type { ReactNode } from "react";
import type { Session } from "@opencode-ai/sdk/v2";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import { useWorkspaces } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionRow } from "./SessionRow";

export function RecentSessionsSection() {
  const { data: sessions, isLoading, error } = useRecentSessions({ limit: 8 });
  const { data: workspaces = [] } = useWorkspaces();
  const addTab = useTabStore((s) => s.addTab);

  const directoryToWorkspace = (directory: string): Workspace | undefined =>
    workspaces.find((workspace) => workspace.directory === directory);

  const handleOpen = (session: Session) => {
    const workspace = directoryToWorkspace(session.directory);
    addTab("chat", {
      sessionId: session.id,
      workspaceId: workspace?.id ?? null,
      directory: session.directory,
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
    content = <EmptyState size="inline" title="No sessions yet" />;
  } else {
    content = (
      <div className="flex flex-col gap-1.5">
        {sessions.map((session) => {
          const workspace = directoryToWorkspace(session.directory);
          return (
            <SessionRow
              key={session.id}
              session={session}
              workspaceName={workspace?.name}
              directory={session.directory}
              onClick={() => handleOpen(session)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <section className="mb-9">
      <h2 className="mb-3.5 text-sm font-bold">Recent sessions</h2>
      {content}
    </section>
  );
}
