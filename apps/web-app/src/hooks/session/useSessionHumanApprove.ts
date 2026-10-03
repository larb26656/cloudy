import { useMemo } from "react";
import {
  usePermissions,
  useSessionQuestions,
  useSessionChildren,
} from "../queries";

interface UseSessionDataProps {
  directory: string;
  sessionId: string | null;
}

export function useSessionData({ directory, sessionId }: UseSessionDataProps) {
  const { data: questions = [] } = useSessionQuestions({
    sessionId: sessionId ?? "",
  });

  const { data: permissions = [] } = usePermissions({
    directory: directory,
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
