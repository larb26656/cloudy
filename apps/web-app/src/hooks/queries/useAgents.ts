import { useQuery } from "@tanstack/react-query";
import { agentKeys } from "@/lib/opencode";
import { fetchAgentProviderCatalog } from "./useModels";
import type { AgentInfo } from "@repo/contracts";
import type { Agent } from "@/types/agent";

export function useAgents({
  directory,
  providerId,
}: { directory?: string; providerId?: string } = {}) {
  return useQuery({
    queryKey: [...agentKeys.list(directory), providerId ?? "all"],
    queryFn: async (): Promise<Agent[]> => {
      void directory;
      const providers = await fetchAgentProviderCatalog();
      return providers
        .filter((provider) => !providerId || provider.id === providerId)
        .flatMap((provider) =>
          (provider.agents ?? [])
            .filter(
              (agent): agent is AgentInfo =>
                !agent.hidden && agent.mode === "primary",
            )
            .map((agent) => ({
              id: agent.id,
              providerId: provider.id,
              name: agent.name ?? agent.id,
              description: agent.description,
              mode: agent.mode ?? "primary",
              native: agent.native,
              hidden: agent.hidden,
            })),
        );
    },
  });
}
