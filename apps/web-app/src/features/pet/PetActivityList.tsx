import { AgentActivityList } from "@/components/notification/AgentActivityList";
import type { AgentActivityRecord } from "@/hooks/useAgentActivity";
import type { Workspace } from "@/lib/cloudy/workspaces";
import type { RecentChatSession } from "@/types";

interface PetActivityListProps {
  isLoading: boolean;
  error: unknown;
  records: AgentActivityRecord[];
  workspaces: Pick<Workspace, "id" | "name" | "type" | "directory">[];
  onOpenSession: (session: RecentChatSession) => void;
}

export function PetActivityList({
  isLoading,
  error,
  records,
  workspaces,
  onOpenSession,
}: PetActivityListProps) {
  return (
    <AgentActivityList
      isLoading={isLoading}
      error={error}
      records={records}
      workspaces={workspaces}
      onOpenSession={onOpenSession}
    />
  );
}
