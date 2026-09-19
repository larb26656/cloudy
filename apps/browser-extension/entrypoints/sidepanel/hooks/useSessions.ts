import { useQuery } from "@tanstack/react-query";
import { ASK_DIRECTORY, listSessions } from "../services/opencode";
import { sessionKeys } from "../queries/query-keys";

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.list(ASK_DIRECTORY),
    queryFn: listSessions,
    staleTime: 5_000,
    retry: 1,
  });
}
