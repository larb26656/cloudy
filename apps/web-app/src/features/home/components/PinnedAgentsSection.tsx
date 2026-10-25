import { usePinnedAgentsStore } from "@/stores/pinnedAgentsStore";
import { useCloudyAgents } from "@/hooks/queries/useCloudyAgents";
import { useModels } from "@/hooks/queries";
import { useNewChat } from "@/hooks/useNewChat";
import { PinnedAgentButton } from "./PinnedAgentButton";

export function PinnedAgentsSection() {
  const pins = usePinnedAgentsStore((state) => state.pins);
  const { data: cloudyAgents } = useCloudyAgents();
  const { data: providers = [] } = useModels();
  const { create, createTemp, isCreatingTemp } = useNewChat();

  const openPinnedAgent = (providerId: string, agentId: string) => {
    const provider = providers.find((item) => item.id === providerId);
    if (provider?.capabilities.requiresDirectory === false) {
      create({ providerId, agent: agentId, directory: "" });
      return;
    }

    createTemp({ providerId, agent: agentId });
  };

  if (!pins.length) return null;

  return (
    <section className="mb-9">
      <h2 className="mb-3.5 text-sm font-bold">Pinned agents</h2>
      <div className="flex flex-wrap gap-3 lg:flex-nowrap lg:overflow-x-auto lg:pb-2">
        {pins.map((pin) => (
          <PinnedAgentButton
            key={`${pin.providerId}:${pin.agentId}`}
            pin={pin}
            avatar={
              cloudyAgents?.agents.find((agent) => agent.id === pin.agentId)
                ?.avatar
            }
            disabled={isCreatingTemp}
            onClick={() => openPinnedAgent(pin.providerId, pin.agentId)}
          />
        ))}
      </div>
    </section>
  );
}
