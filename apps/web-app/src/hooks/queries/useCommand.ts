import { useMutation } from "@tanstack/react-query";
import { sessionApi } from "@/lib/cloudy/provider";

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
      const response = await sessionApi.executeCommand(sessionId, {
        command,
        arguments: args,
      });
      if (!response.ok) throw new Error(await response.text());
      if (response.status === 204) return;
      return response.json();
    },
  });
}
