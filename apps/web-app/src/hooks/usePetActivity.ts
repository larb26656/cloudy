import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type {
  PermissionRequest as CorePermissionRequest,
  ProviderQuestionRequest,
} from "@repo/contracts";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import { useWorkspaces } from "@/hooks/queries";
import {
  CHAT_POLL_INTERVAL,
  permissionKeys,
  questionKeys,
} from "@/lib/opencode";
import { sessionApi } from "@/lib/cloudy/provider";
import type {
  PermissionRequest,
  QuestionRequest,
  RecentChatSession,
} from "@/types";
import type { PetState } from "@/components/pet/PetSprite";

export interface ActiveSessionRecord {
  session: RecentChatSession;
  state: Exclude<PetState, "idle">;
  reason?: "question" | "permission";
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

function toQuestion(request: ProviderQuestionRequest): QuestionRequest {
  return {
    id: request.id,
    sessionID: request.sessionId,
    questions: request.questions.map((question) => ({
      ...question,
      multiple: question.multiple ?? false,
    })),
  };
}

function toPermission(request: CorePermissionRequest): PermissionRequest {
  return {
    id: request.id,
    sessionID: request.sessionId,
    permission: request.permission,
    patterns: request.patterns,
    always: request.always,
    tool: request.tool ? { messageID: request.tool.messageId } : undefined,
  };
}

async function fetchSessionQuestions(
  sessionId: string,
): Promise<QuestionRequest[]> {
  return (
    await json<ProviderQuestionRequest[]>(await sessionApi.questions(sessionId))
  ).map(toQuestion);
}

async function fetchSessionPermissions(
  sessionId: string,
): Promise<PermissionRequest[]> {
  return (
    await json<CorePermissionRequest[]>(await sessionApi.permissions(sessionId))
  ).map(toPermission);
}

/**
 * Shared activity derivation for the pet (in-window `FloatingPet` and the
 * desktop `/pet` overlay): recent sessions, their pending questions and
 * permissions, and the resulting pet state. Polling pauses while the window
 * is hidden (`refetchIntervalInBackground: false`) — desired for both
 * consumers.
 */
export function usePetActivity() {
  const { data: sessions, isLoading, error } = useRecentSessions({ limit: 8 });
  const { data: workspaces = [] } = useWorkspaces();

  const candidates = useMemo(
    () =>
      (sessions ?? []).filter(
        (session) =>
          session.runStatus === "running" || session.status === "active",
      ),
    [sessions],
  );

  const questionResults = useQueries({
    queries: candidates.map((session) => ({
      queryKey: questionKeys.list(session.id),
      queryFn: () => fetchSessionQuestions(session.id),
      refetchInterval: CHAT_POLL_INTERVAL,
      refetchIntervalInBackground: false,
    })),
  });

  const permissionResults = useQueries({
    queries: candidates.map((session) => ({
      queryKey: permissionKeys.list(session.id),
      queryFn: () => fetchSessionPermissions(session.id),
      refetchInterval: CHAT_POLL_INTERVAL,
      refetchIntervalInBackground: false,
    })),
  });

  const records: ActiveSessionRecord[] = [];
  {
    for (const [index, session] of candidates.entries()) {
      const questions = questionResults[index]?.data ?? [];
      const permissions = permissionResults[index]?.data ?? [];
      if (questions.length > 0) {
        records.push({ session, state: "wait-for-human", reason: "question" });
        continue;
      }
      if (permissions.length > 0) {
        records.push({
          session,
          state: "wait-for-human",
          reason: "permission",
        });
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
  }

  const waitingCount = records.filter(
    (record) => record.state === "wait-for-human",
  ).length;
  const workingCount = records.length - waitingCount;

  const petState: PetState =
    waitingCount > 0 ? "wait-for-human" : workingCount > 0 ? "working" : "idle";

  return {
    records,
    petState,
    waitingCount,
    workingCount,
    isLoading,
    error,
    workspaces,
  };
}

export function petTriggerLabel(
  waitingCount: number,
  workingCount: number,
): string {
  if (waitingCount > 0) {
    return `Agent activity: ${waitingCount} session${waitingCount === 1 ? "" : "s"} waiting for you`;
  }
  if (workingCount > 0) {
    return `Agent activity: ${workingCount} session${workingCount === 1 ? "" : "s"} working`;
  }
  return "Agent activity";
}
