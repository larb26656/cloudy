import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { PermissionRequest as CorePermissionRequest } from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { emptyResponse, jsonResponse } from "@/lib/api-response";
import { CHAT_POLL_INTERVAL, permissionKeys } from "@/lib/opencode";
import type { PermissionRequest } from "@/types";

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

export function sessionPermissionsQueryOptions({
  sessionId,
  enabled = true,
}: {
  sessionId: string;
  enabled?: boolean;
}) {
  return queryOptions({
    queryKey: permissionKeys.list(sessionId),
    queryFn: async (): Promise<PermissionRequest[]> =>
      (
        await jsonResponse<CorePermissionRequest[]>(
          await cloudyClient.api.sessions[":sessionId"].permissions.$get({
            param: { sessionId },
          }),
        )
      ).map(toPermission),
    enabled: !!sessionId && enabled,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessionPermissions(options: {
  sessionId: string;
  enabled?: boolean;
}) {
  return useQuery(sessionPermissionsQueryOptions(options));
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
      await emptyResponse(
        await cloudyClient.api.sessions[":sessionId"].permissions[
          ":permissionId"
        ].$post({
          param: { sessionId, permissionId: requestID },
          json: { reply },
        }),
      );
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: permissionKeys.root(),
      }),
  });
}
