import { useQuery } from "@tanstack/react-query";
import { listSessions } from "../lib/opencode/sessions";
import { sessionKeys } from "../queries/query-keys";

export function useSessions(directory: string | null) {
  return useQuery({
    queryKey: sessionKeys.list(directory ?? ""),
    queryFn: () => listSessions(directory ?? ""),
    enabled: !!directory,
    staleTime: 5_000,
    retry: 1,
  });
}
