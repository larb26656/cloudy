import { useQuery } from "@tanstack/react-query";
import type { VcsFileDiff } from "@opencode-ai/sdk/v2";
import { getErrorMessage, getOcClient, vcsKeys, type SdkError } from "@/lib/opencode";

export function useVcsDiff({ directory }: { directory?: string }) {
  return useQuery({
    queryKey: vcsKeys.diff(directory ?? ""),
    queryFn: async (): Promise<VcsFileDiff[]> => {
      if (!directory) return [];
      const oc = getOcClient();
      const result = await oc.vcs.diff({ directory, mode: "git" });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data ?? [];
    },
    enabled: !!directory,
  });
}
