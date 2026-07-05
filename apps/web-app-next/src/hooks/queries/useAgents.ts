import { useQuery } from "@tanstack/react-query";
import { getOcClient } from "@/lib/opencode";
import { agentKeys } from "@/lib/opencode";
import type { Agent } from "@/types/agent";
import { getErrorMessage, type SdkError } from "@/lib/opencode";

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: async (): Promise<Agent[]> => {
      const oc = getOcClient();
      const result = await oc.app.agents();
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      const data = result.data;
      if (!Array.isArray(data)) return [];
      return data
        .filter((a) => !a.hidden)
        .map((a) => ({
          name: a.name,
          description: a.description,
          mode: a.mode,
          native: a.native,
          hidden: a.hidden,
        }));
    },
  });
}
