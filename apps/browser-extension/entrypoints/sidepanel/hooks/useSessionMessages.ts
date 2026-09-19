import { useQuery } from "@tanstack/react-query";
import { loadSessionMessages } from "../lib/opencode/sessions";
import { sessionMessageKeys } from "../queries/query-keys";

export function useSessionMessages(
  directory: string | null,
  sessionId: string | null,
) {
  return useQuery({
    queryKey: sessionMessageKeys.detail(directory ?? "", sessionId ?? ""),
    queryFn: () => loadSessionMessages(sessionId ?? "", directory ?? ""),
    enabled: !!directory && !!sessionId,
    staleTime: 5_000,
    retry: 1,
  });
}
