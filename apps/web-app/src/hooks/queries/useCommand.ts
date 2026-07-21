import { getErrorMessage, getOcClient, type SdkError } from "@/lib/opencode";
import { useMutation } from "@tanstack/react-query";

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
      const oc = getOcClient();

      const result = await oc.session.command({
        sessionID: sessionId,
        command,
        arguments: args,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result;
    },
  });
}
