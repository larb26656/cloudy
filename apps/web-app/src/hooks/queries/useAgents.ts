import { useQuery } from "@tanstack/react-query";
import { agentKeys } from "@/lib/opencode";
import { providerApi } from "@/lib/cloudy/provider";
import type { AgentInfo, ProviderInfo } from "@repo/contracts";
import type { Agent } from "@/types/agent";

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function useAgents({ directory }: { directory?: string } = {}) {
  return useQuery({
    queryKey: agentKeys.list(directory),
    queryFn: async (): Promise<Agent[]> => {
      void directory;
      const providers = await json<ProviderInfo[]>(await providerApi.catalog());
      return providers
        .flatMap((provider) => provider.agents ?? [])
        .filter(
          (agent): agent is AgentInfo =>
            !agent.hidden && agent.mode === "primary",
        )
        .map((agent) => ({
          name: agent.name ?? agent.id,
          description: agent.description,
          mode: agent.mode ?? "primary",
          native: agent.native,
          hidden: agent.hidden,
        }));
    },
  });
}
