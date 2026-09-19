import { useQuery } from "@tanstack/react-query";
import { ASK_DIRECTORY, loadSessionMessages } from "./opencode";
import { sessionMessageKeys } from "./query-keys";

export function useSessionMessages(sessionId: string | null) {
  return useQuery({
    queryKey: sessionMessageKeys.detail(ASK_DIRECTORY, sessionId ?? ""),
    queryFn: () => loadSessionMessages(sessionId ?? ""),
    enabled: !!sessionId,
    staleTime: 5_000,
    retry: 1,
  });
}
