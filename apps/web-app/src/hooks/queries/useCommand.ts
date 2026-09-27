import { useMutation } from "@tanstack/react-query";
import { providerApi } from "@/lib/cloudy/provider";

export function useExecuteCommand() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      command,
      args,
      directory,
    }: {
      sessionId: string;
      command: string;
      args?: string;
      directory: string;
    }) => {
      const response = await providerApi.executeCommand({
        sessionId,
        command,
        arguments: args,
        directory,
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
  });
}
