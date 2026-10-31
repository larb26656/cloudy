import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import { sessionPermissionsQueryOptions } from "@/hooks/queries/usePermissions";
import { sessionQuestionsQueryOptions } from "@/hooks/queries/useQuestions";
import { useModels, useWorkspaces } from "@/hooks/queries";
import type { RecentChatSession } from "@/types";

export type AgentActivityState = "idle" | "working" | "wait-for-human";

export interface AgentActivityRecord {
  session: RecentChatSession;
  state: Exclude<AgentActivityState, "idle">;
  reason?: "question" | "permission";
}

export function useAgentActivity() {
  const { data: sessions, isLoading, error } = useRecentSessions({ limit: 8 });
  const { data: workspaces = [] } = useWorkspaces();
  const { data: providers = [] } = useModels();
  const providerById = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider])),
    [providers],
  );

  const candidates = useMemo(
    () =>
      (sessions ?? []).filter((session) => {
        const capabilities = providerById.get(session.providerId)?.capabilities;
        return (
          (session.runStatus === "running" || session.status === "active") &&
          (capabilities?.approvals || capabilities?.questions)
        );
      }),
    [providerById, sessions],
  );

  const questionResults = useQueries({
    queries: candidates.map((session) =>
      sessionQuestionsQueryOptions({ sessionId: session.id }),
    ),
  });

  const permissionResults = useQueries({
    queries: candidates.map((session) =>
      sessionPermissionsQueryOptions({ sessionId: session.id }),
    ),
  });

  const records: AgentActivityRecord[] = [];
  for (const [index, session] of candidates.entries()) {
    const questions = questionResults[index]?.data ?? [];
    const permissions = permissionResults[index]?.data ?? [];
    if (questions.length > 0) {
      records.push({ session, state: "wait-for-human", reason: "question" });
      continue;
    }
    if (permissions.length > 0) {
      records.push({ session, state: "wait-for-human", reason: "permission" });
      continue;
    }
    if (session.runStatus === "running") {
      records.push({ session, state: "working" });
    }
  }
  records.sort((a, b) => {
    if (a.state !== b.state) return a.state === "wait-for-human" ? -1 : 1;
    return b.session.updatedAt - a.session.updatedAt;
  });

  const waitingCount = records.filter(
    (record) => record.state === "wait-for-human",
  ).length;
  const workingCount = records.length - waitingCount;
  const activityState: AgentActivityState =
    waitingCount > 0 ? "wait-for-human" : workingCount > 0 ? "working" : "idle";

  return {
    records,
    activityState,
    waitingCount,
    workingCount,
    isLoading,
    error,
    workspaces,
  };
}
