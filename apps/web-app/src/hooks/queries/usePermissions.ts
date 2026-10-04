import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionRequest as CorePermissionRequest } from "@repo/contracts";
import { sessionApi } from "@/lib/cloudy/provider";
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

export function useSessionPermissions({ sessionId }: { sessionId: string }) {
  return useQuery({
    queryKey: permissionKeys.list(sessionId),
    queryFn: async (): Promise<PermissionRequest[]> =>
      (
        await json<CorePermissionRequest[]>(
          await sessionApi.permissions(sessionId),
        )
      ).map(toPermission),
    enabled: !!sessionId,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useReplyPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestID,
      sessionId,
      reply,
    }: {
      requestID: string;
      sessionId: string;
      reply: "once" | "always" | "reject";
    }): Promise<void> => {
      const response = await sessionApi.replyPermission(
        sessionId,
        requestID,
        reply,
      );
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: permissionKeys.root(),
      }),
  });
}
