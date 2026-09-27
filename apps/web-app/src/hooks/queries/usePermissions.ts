import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionRequest as CorePermissionRequest } from "@repo/contracts";
import { providerApi } from "@/lib/cloudy/provider";
import { CHAT_POLL_INTERVAL, permissionKeys } from "@/lib/opencode";
import type { PermissionRequest } from "@/types";

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
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

export function usePermissions({ directory }: { directory: string }) {
  return useQuery({
    queryKey: permissionKeys.request.list(directory),
    queryFn: async (): Promise<PermissionRequest[]> =>
      (
        await json<CorePermissionRequest[]>(
          await providerApi.permissions(directory),
        )
      ).map(toPermission),
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
      const response = await providerApi.interaction({
        kind: "permission",
        sessionId: "",
        interactionId: requestID,
        value: { reply, directory },
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: permissionKeys.request.root(),
      }),
  });
}
