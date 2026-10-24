import { usePinnedAgentsStore } from "@/stores/pinnedAgentsStore";
import { useCloudyAgents } from "@/hooks/queries/useCloudyAgents";
import { useCreateTempWorkspace, useModels } from "@/hooks/queries";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { useTabStore } from "@/stores/tabStore";
import { PinnedAgentButton } from "./PinnedAgentButton";

export function PinnedAgentsSection() {
  const pins = usePinnedAgentsStore((state) => state.pins);
  const { data: cloudyAgents } = useCloudyAgents();
  const { data: providers = [] } = useModels();
  const addTab = useTabStore((state) => state.addTab);
  const pushRecentDirectory = useRecentDirectoryStore((state) => state.push);
  const createTempWorkspace = useCreateTempWorkspace();

  const openPinnedAgent = (providerId: string, agentId: string) => {
    const provider = providers.find((item) => item.id === providerId);
    const createTab = (directory: string, sessionName: string) =>
      addTab("chat", {
        providerId,
        agent: agentId,
        sessionId: null,
        workspaceId: null,
        directory,
        sessionName,
      });

    if (provider?.capabilities.requiresDirectory === false) {
      createTab("", "New Chat");
      return;
    }

    createTempWorkspace.mutate(undefined, {
      onSuccess: ({ name, directory }) => {
        pushRecentDirectory(directory);
        createTab(directory, name);
      },
    });
  };

  if (!pins.length) return null;

  return (
    <section className="mb-9">
      <h2 className="mb-3.5 text-sm font-bold">Pinned agents</h2>
      <div className="flex flex-wrap gap-3">
        {pins.map((pin) => (
          <PinnedAgentButton
            key={`${pin.providerId}:${pin.agentId}`}
            pin={pin}
            avatar={
              cloudyAgents?.agents.find((agent) => agent.id === pin.agentId)
                ?.avatar
            }
            disabled={createTempWorkspace.isPending}
            onClick={() => openPinnedAgent(pin.providerId, pin.agentId)}
          />
        ))}
      </div>
    </section>
  );
}
