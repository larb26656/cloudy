import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CHAT_POLL_INTERVAL,
  getOcClient,
  getErrorMessage,
  permissionKeys,
  type SdkError,
} from "@/lib/opencode";
import type { PermissionRequest } from "@opencode-ai/sdk/v2";

export function usePermissions({
  directory,
}: {
  directory: string;
}) {
  return useQuery({
    queryKey: permissionKeys.request.list(directory),
    queryFn: async (): Promise<PermissionRequest[]> => {
      const oc = getOcClient();
      const result = await oc.permission.list({ directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data ?? [];
    },
    enabled: !!directory,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useReplyPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestID,
      reply,
      directory,
    }: {
      requestID: string;
      reply: "once" | "always" | "reject";
      directory?: string;
    }): Promise<void> => {
      const oc = getOcClient();
      const result = await oc.permission.reply({
        requestID,
        reply,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.request.root() });
    },
  });
}
