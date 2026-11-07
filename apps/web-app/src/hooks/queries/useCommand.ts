import { useMutation } from "@tanstack/react-query";
import { cloudyClient } from "@/lib/api";
import { emptyResponse } from "@/lib/api-response";
import type { ProviderMessageRequest } from "@repo/contracts";

export function useExecuteCommand() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      command,
      args,
      model,
    }: {
      sessionId: string;
      command: string;
      args?: string;
      model?: ProviderMessageRequest["model"];
    }) => {
      await emptyResponse(
        await cloudyClient.api.sessions[":sessionId"].command.$post({
          param: { sessionId },
          json: { command, arguments: args, model },
        }),
      );
    },
  });
}
