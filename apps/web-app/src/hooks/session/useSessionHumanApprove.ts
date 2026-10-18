import { useMemo } from "react";
import {
  useSessionPermissions,
  useSessionQuestions,
  useSessionChildren,
} from "../queries";
import type { ResolvedProviderCapabilities } from "@repo/contracts";

interface UseSessionDataProps {
  sessionId: string | null;
  capabilities: Pick<ResolvedProviderCapabilities, "approvals" | "questions">;
}

export function useSessionData({
  sessionId,
  capabilities,
}: UseSessionDataProps) {
  const { data: questions = [] } = useSessionQuestions({
    sessionId: sessionId ?? "",
    enabled: capabilities.questions,
  });

  const { data: permissions = [] } = useSessionPermissions({
    sessionId: sessionId ?? "",
    enabled: capabilities.approvals,
  });

  const { data: childSessions = [] } = useSessionChildren({
    sessionId: sessionId,
  });

  const sessionRelations = useMemo(() => {
    if (!sessionId) return new Set<string>();
    return new Set<string>([sessionId, ...childSessions.map((cs) => cs.id)]);
  }, [sessionId, childSessions]);

  const sessionQuestions = questions;

  const currentQuestion = sessionQuestions.length
    ? sessionQuestions[0]
    : undefined;

  const sessionPermissions = useMemo(() => {
    return permissions.filter((q) => sessionRelations.has(q.sessionID));
  }, [permissions, sessionRelations]);

  const currentPermission = sessionPermissions.length
    ? sessionPermissions[0]
    : undefined;

  return {
    questions,
    permissions,
    sessionQuestions,
    currentQuestion,
    sessionPermissions,
    currentPermission,
  };
}
