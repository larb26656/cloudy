import { useMutation } from "@tanstack/react-query";
import { cloudyClient } from "@/lib/api";
import { emptyResponse } from "@/lib/api-response";

export function useExecuteCommand() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      command,
      args,
    }: {
      sessionId: string;
      command: string;
      args?: string;
    }) => {
      await emptyResponse(
        await cloudyClient.api.sessions[":sessionId"].command.$post({
          param: { sessionId },
          json: { command, arguments: args },
        }),
      );
    },
  });
}
