import { useModels } from "@/hooks/queries/useModels";
import { useSession } from "@/hooks/queries/useSessions";
import { useSessionPermissions } from "@/hooks/queries/usePermissions";
import { useSessionQuestions } from "@/hooks/queries/useQuestions";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";

export type SessionAgentActivityState = "idle" | "working" | "wait-for-human";
export type SessionAgentActivityReason = "question" | "permission";

export function useSessionAgentActivity(sessionId: string) {
  const hasStreamingMessages = useStreamingMessagesStore(
    (state) => (state.streamingMessages.get(sessionId)?.size ?? 0) > 0,
  );
  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSession({ sessionId });
  const {
    data: providers,
    isLoading: isProvidersLoading,
    error: providersError,
  } = useModels();
  const capabilities = providers?.find(
    (provider) => provider.id === session?.providerId,
  )?.capabilities;
  const isActive =
    (!!session &&
      (session.runStatus === "running" || session.status === "active")) ||
    hasStreamingMessages;
  const supportsQuestions = !!capabilities?.questions;
  const supportsApprovals = !!capabilities?.approvals;
  const questions = useSessionQuestions({
    sessionId,
    enabled: isActive && supportsQuestions,
  });
  const permissions = useSessionPermissions({
    sessionId,
    enabled: isActive && supportsApprovals,
  });

  let state: SessionAgentActivityState = "idle";
  let reason: SessionAgentActivityReason | undefined;

  if (questions.data?.length) {
    state = "wait-for-human";
    reason = "question";
  } else if (permissions.data?.length) {
    state = "wait-for-human";
    reason = "permission";
  } else if (session?.runStatus === "running" || hasStreamingMessages) {
    state = "working";
  }

  return {
    state,
    reason,
    isLoading:
      isSessionLoading ||
      isProvidersLoading ||
      (isActive &&
        ((supportsQuestions && questions.isLoading) ||
          (supportsApprovals && permissions.isLoading))),
    error:
      sessionError ?? providersError ?? questions.error ?? permissions.error,
  };
}
