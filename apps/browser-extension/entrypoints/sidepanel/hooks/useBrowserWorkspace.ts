import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBrowserWorkspaceStatus,
  initializeBrowserWorkspace,
} from "../lib/cloudy/browser-workspace";
import { browserWorkspaceKeys } from "../queries/query-keys";

export function useBrowserWorkspace() {
  return useQuery({
    queryKey: browserWorkspaceKeys.status(),
    queryFn: getBrowserWorkspaceStatus,
    staleTime: 5_000,
    retry: 1,
  });
}

export function useInitializeBrowserWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initializeBrowserWorkspace,
    onSuccess: (workspace) => {
      queryClient.setQueryData(browserWorkspaceKeys.status(), workspace);
    },
  });
}
