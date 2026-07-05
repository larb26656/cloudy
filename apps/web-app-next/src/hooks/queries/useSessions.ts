import {
  getErrorMessage,
  getOcClient,
  sessionKeys,
  type SdkError,
} from "@/lib/opencode";
import type { Session } from "@opencode-ai/sdk/v2";
import { useQuery } from "@tanstack/react-query";

export function useSessions({ directory }: { directory: string }) {
  return useQuery({
    queryKey: sessionKeys.infinite(directory),
    queryFn: async (): Promise<Session[]> => {
      const oc = getOcClient();
      const result = await oc.session.list({ directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      const data = result.data;

      return data;
    },
    enabled: !!directory,
  });
}

export function useCreateSession() {
  throw new Error("useCreateSession: not implemented (M4 wire-up).");
}

export function useUpdateSession() {
  throw new Error("useUpdateSession: not implemented (M4 wire-up).");
}

export function useDeleteSession() {
  throw new Error("useDeleteSession: not implemented (M4 wire-up).");
}

export function useForkSession() {
  throw new Error("useForkSession: not implemented (M4 wire-up).");
}
