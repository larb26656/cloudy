import type { ReactNode } from "react";
import { Loader2, MessageCircleQuestion, ShieldAlert } from "lucide-react";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { cn } from "@repo/ui/lib/utils";
import type { ActiveSessionRecord } from "@/hooks/usePetActivity";
import type { Workspace } from "@/lib/cloudy/workspaces";
import type { RecentChatSession } from "@/types";

interface PetActivityListProps {
  isLoading: boolean;
  error: unknown;
  records: ActiveSessionRecord[];
  workspaces: Pick<Workspace, "id" | "name" | "type" | "directory">[];
  onOpenSession: (session: RecentChatSession) => void;
}

/**
 * The pet's activity list — loading/error/empty/list branches shared by the
 * in-window `FloatingPet` popover and the desktop `PetOverlay` panel.
 */
export function PetActivityList({
  isLoading,
  error,
  records,
  workspaces,
  onOpenSession,
}: PetActivityListProps) {
  let content: ReactNode;
  if (isLoading) {
    content = <LoadingState size="compact" title={null} />;
  } else if (error) {
    content = (
      <ErrorState size="compact" bare message="Failed to load sessions" />
    );
  } else if (records.length === 0) {
    content = (
      <EmptyState
        size="compact"
        title="No session needs attention"
        description="Working and waiting sessions will appear here"
      />
    );
  } else {
    content = (
      <ul className="flex flex-col">
        {records.map((record) => {
          const isWaiting = record.state === "wait-for-human";
          const Icon = isWaiting
            ? record.reason === "permission"
              ? ShieldAlert
              : MessageCircleQuestion
            : Loader2;
          const workspaceName = workspaces.find(
            (w) => w.directory === record.session.directory,
          )?.name;
          return (
            <li key={record.session.id}>
              <button
                type="button"
                onClick={() => onOpenSession(record.session)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon
                  data-icon
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground",
                    !isWaiting && "animate-spin",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {record.session.title || "Untitled"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {workspaceName ?? record.session.directory}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    isWaiting
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {isWaiting ? "Waiting for you" : "Working"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }
  return <>{content}</>;
}
